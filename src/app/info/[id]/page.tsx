"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/admin/utils/Firebase.config";
import { FiArrowLeft, FiPlus, FiMinus, FiShoppingCart } from "react-icons/fi";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  sku: string;
  like: boolean;
}

const ProductDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState<number>(1);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "products", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    try {
      const cartItems = JSON.parse(localStorage.getItem("cartItems") || "{}");
      const updatedCart = {
        ...cartItems,
        [product?.id as string]:
          (cartItems[product?.id as string] || 0) + cartCount,
      };
      localStorage.setItem("cartItems", JSON.stringify(updatedCart));
      alert("✅ Mahsulot savatga qo‘shildi!");
    } catch (error) {
      console.error("Cart update error:", error);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-500"></div>
          </div>
          <p className="text-gray-600 text-lg animate-pulse">Yuklanmoqda...</p>
        </div>
      </div>
    );
  if (!product)
    return (
      <div className="p-6 text-center text-red-600">🚫 Mahsulot topilmadi</div>
    );

  return (
    <div className="min-h-screen h-100 bg-gradient-to-b sm:w-full from-white to-blue-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl p-6 sm:p-10">
        {/* Back */}
        <div className="flex items-center justify-start mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 bg-gradient-to-r  text-black px-4 py-2 rounded-full shadow-md hover:shadow-lg hover:bg-cyan-400 transition-all duration-300 text-sm"
          >
            <FiArrowLeft className="text-lg" />
            <span>Orqaga qaytish</span>
          </button>
        </div>

        {/* Image */}
        <div className="w-full h-64 sm:h-80 rounded-xl overflow-hidden shadow mb-6">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>

        {/* Title & Description */}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
          {product.name}
        </h1>
        <p className="text-gray-600 text-lg leading-relaxed mb-4">
          {product.description}
        </p>

        {/* Price */}
        <p className="text-2xl font-semibold text-blue-600 mb-6">
          {product.price.toLocaleString()} so‘m
        </p>

        {/* Quantity & Button */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Counter */}
          <div className="flex items-center border rounded-full overflow-hidden ">
            <button
              onClick={() => setCartCount(Math.max(1, cartCount - 1))}
              className="px-5 py-3 text-xl text-gray-600 hover:bg-gray-100 transition"
              aria-label="Kamaytirish"
            >
              <FiMinus />
            </button>
            <span className="px-6 py-2 text-xl font-semibold text-gray-800 bg-gray-50">
              {cartCount}
            </span>
            <button
              onClick={() => setCartCount(cartCount + 1)}
              className="px-5 py-3 text-xl bg-blue-600 text-white active:bg-blue-700 transition"
              aria-label="Ko‘paytirish"
            >
              <FiPlus />
            </button>
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            className="flex items-center gap-3 bg-green-600 hover:bg-green-700 transition text-white text-lg font-semibold px-6 py-3 rounded-full shadow-md"
          >
            <FiShoppingCart className="text-xl" /> Savatga qo‘shish
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
