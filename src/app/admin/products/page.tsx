"use client";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../utils/Firebase.config";
import { useEffect, useState } from "react";
import { FiEdit, FiTrash } from "react-icons/fi";
import { resizeImage } from "../utils/imgUtils";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  amount: number;
  category: string;
  image: string;
  like: boolean;
}

interface Category {
  id: string;
  title: string;
}

const ProductTable = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: 0,
    amount: 0,
    category: "",
    image: "",
    like: false,
  });

  const fetchProducts = async () => {
    const querySnapshot = await getDocs(collection(db, "products"));
    const data: Product[] = [];
    querySnapshot.forEach((doc) => {
      const { id, ...rest } = doc.data() as Product;
      data.push({ id: doc.id, ...rest });
    });
    setProducts(data);
  };

  const fetchCategories = async () => {
    const querySnapshot = await getDocs(collection(db, "categories"));
    const data: Category[] = [];
    querySnapshot.forEach((doc) => {
      const { id, ...rest } = doc.data() as Category;
      data.push({ id: doc.id, ...rest });
    });
    setCategories(data);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const productExists = async (name: string, category: string) => {
    const q = query(
      collection(db, "products"),
      where("name", "==", name),
      where("category", "==", category)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editMode && selectedProduct) {
      await updateDoc(doc(db, "products", selectedProduct.id), form);
      setProducts((prevProducts) =>
        prevProducts.map((prod) =>
          prod.id === selectedProduct.id ? { ...prod, ...form } : prod
        )
      );
    } else {
      const exists = await productExists(form.name, form.category);
      if (exists) return;
      const docRef = await addDoc(collection(db, "products"), form);
      setProducts((prevProducts) => [
        ...prevProducts,
        { id: docRef.id, ...form },
      ]);
    }
    closeModal();
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "products", id));
    setProducts((prevProducts) =>
      prevProducts.filter((prod) => prod.id !== id)
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressedBase64 = await resizeImage(file);
      setForm({ ...form, image: compressedBase64 });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setForm({
      name: "",
      description: "",
      price: 0,
      amount: 0,
      category: "",
      image: "",
      like: false,
    });
    setEditMode(false);
    setSelectedProduct(null);
  };

  const filtered = products.filter((prod) =>
    prod.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 min-h-screen text-gray-800 dark:text-gray-100">
      <h1 className="text-xl mb-3 text-gray-800 dark:text-white">
        <span className="text-blue-500">admin/</span>
        <span>product</span>
      </h1>

      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded w-full md:w-auto"
          onClick={() => {
            setEditMode(false);
            setForm({
              name: "",
              description: "",
              price: 0,
              amount: 0,
              category: "",
              image: "",
              like: false,
            });
            setShowModal(true);
          }}
        >
          + Add New Product
        </button>
        <input
          type="text"
          className="border rounded w-full md:w-1/2 p-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm dark:border-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="p-2 border dark:border-gray-700">№</th>
              <th className="p-2 border dark:border-gray-700">Name</th>
              <th className="p-2 border dark:border-gray-700">Category</th>
              <th className="p-2 border dark:border-gray-700">Price</th>
              <th className="p-2 border dark:border-gray-700">Amount</th>
              <th className="p-2 border dark:border-gray-700">Image</th>
              <th className="p-2 border dark:border-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((prod, index) => (
              <tr key={prod.id} className="border-b dark:border-gray-700">
                <td className="p-2 border dark:border-gray-700">{index + 1}</td>
                <td className="p-2 border dark:border-gray-700">{prod.name}</td>
                <td className="p-2 border dark:border-gray-700">
                  {prod.category}
                </td>
                <td className="p-2 border dark:border-gray-700">
                  {prod.price}
                </td>
                <td className="p-2 border dark:border-gray-700">
                  {prod.amount}
                </td>
                <td className="p-2 border dark:border-gray-700">
                  {prod.image && (
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="h-10 w-10 rounded object-cover"
                    />
                  )}
                </td>
                <td className="p-2 border dark:border-gray-700">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditMode(true);
                        setSelectedProduct(prod);
                        setForm({
                          name: prod.name,
                          description: prod.description,
                          price: prod.price,
                          amount: prod.amount,
                          category: prod.category,
                          image: prod.image,
                          like: false,
                        });
                        setShowModal(true);
                      }}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <FiEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(prod.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FiTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-lg p-6">
            <form onSubmit={handleAddOrUpdate}>
              <h2 className="text-lg font-semibold mb-4 dark:text-white text-center">
                {editMode ? "Edit Product" : "Add Product"}
              </h2>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block font-medium dark:text-gray-200 text-center">
                    Image
                  </label>
                  <input
                    type="file"
                    className="border p-2 dark:bg-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={handleFileUpload}
                  />
                  {form.image && (
                    <img
                      src={form.image}
                      alt="Preview"
                      className="mt-4 h-24 w-24 shadow-md"
                    />
                  )}
                </div>
                <div>
                  <label className="block font-medium dark:text-gray-200">
                    Name
                  </label>
                  <input
                    type="text"
                    className="border rounded w-full p-2 dark:bg-gray-700 dark:text-white"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium dark:text-gray-200">
                    Description
                  </label>
                  <textarea
                    className="border rounded w-full p-2 dark:bg-gray-700 dark:text-white"
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium dark:text-gray-200">
                    Price
                  </label>
                  <input
                    type="number"
                    className="border rounded w-full p-2 dark:bg-gray-700 dark:text-white"
                    value={form.price}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        price: parseFloat(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium dark:text-gray-200">
                    Amount
                  </label>
                  <input
                    type="number"
                    className="border rounded w-full p-2 dark:bg-gray-700 dark:text-white"
                    value={form.amount}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        amount: parseInt(e.target.value, 10),
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium dark:text-gray-200">
                    Category
                  </label>
                  <select
                    className="border rounded w-full p-2 dark:bg-gray-700 dark:text-white"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.title}>
                        {cat.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  {editMode ? "Update Product" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductTable;
