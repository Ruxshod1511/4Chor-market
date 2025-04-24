"use client";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../utils/Firebase.config";
import { useEffect, useState } from "react";
import { FiEdit, FiTrash } from "react-icons/fi";

interface Category {
  id: string;
  title: string;
  description: string;
  status: "Published" | "Draft";
}

const CategoryTable = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "Draft" as "Published" | "Draft",
  });

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
    fetchCategories();
  }, []);

  const handleAddOrUpdate = async () => {
    if (editMode && selectedCategory) {
      await updateDoc(doc(db, "categories", selectedCategory.id), form);
    } else {
      await addDoc(collection(db, "categories"), form);
    }
    closeModal();
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "categories", id));
    fetchCategories();
  };

  const closeModal = () => {
    setShowModal(false);
    setForm({ title: "", description: "", status: "Draft" });
    setEditMode(false);
    setSelectedCategory(null);
  };

  const filtered = categories.filter((cat) =>
    cat.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6  min-h-screen text-gray-800  dark:text-gray-100">
      <h1 className="text-xl mb-3 text-gray-800 dark:text-white">
        <span className="text-blue-500">admin/</span>
        <span>category</span>
      </h1>
      <div className="flex justify-between items-center mb-4">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded float-end"
          onClick={() => {
            setEditMode(false);
            setForm({ title: "", description: "", status: "Draft" });
            setShowModal(true);
          }}
        >
          + Add New
        </button>
      </div>

      <input
        type="text"
        className="border rounded w-full p-2 mb-4 dark:bg-gray-800 dark:text-white dark:border-gray-600"
        placeholder="Search by title..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm dark:border-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-800 text-left">
            <tr>
              <th className="p-2 border dark:border-gray-700">№</th>
              <th className="p-2 border dark:border-gray-700">Title</th>
              <th className="p-2 border dark:border-gray-700">Description</th>
              <th className="p-2 border dark:border-gray-700">Status</th>
              <th className="p-2 border dark:border-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((cat, index) => (
              <tr
                key={cat.id}
                className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700"
              >
                <td className="p-2 border dark:border-gray-700">{index + 1}</td>
                <td className="p-2 border dark:border-gray-700">{cat.title}</td>
                <td className="p-2 border dark:border-gray-700">
                  {cat.description}
                </td>
                <td className="p-2 border dark:border-gray-700">
                  <span
                    className={`px-2 py-1 rounded text-white text-xs ${
                      cat.status === "Published" ? "bg-green-500" : "bg-red-500"
                    }`}
                  >
                    {cat.status}
                  </span>
                </td>
                <td className="p-2 border dark:border-gray-700">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditMode(true);
                        setSelectedCategory(cat);
                        setForm({
                          title: cat.title,
                          description: cat.description,
                          status: cat.status,
                        });
                        setShowModal(true);
                      }}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <FiEdit className="inline mr-2" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FiTrash className="inline mr-2" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {editMode ? "Edit Category" : "Add Category"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block font-medium text-gray-800 dark:text-gray-200">
                  Title
                </label>
                <input
                  type="text"
                  className="border rounded w-full p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-medium text-gray-800 dark:text-gray-200">
                  Description
                </label>
                <textarea
                  className="border rounded w-full p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block font-medium text-gray-800 dark:text-gray-200">
                  Status
                </label>
                <select
                  className="border rounded w-full p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as "Published" | "Draft",
                    })
                  }
                >
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-white"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleAddOrUpdate}
              >
                {editMode ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryTable;
