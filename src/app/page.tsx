"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "./admin/utils/Firebase.config";
import { FiShoppingCart, FiHeart, FiTrash2, FiArrowLeft } from "react-icons/fi";
import { MdSearch } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import SendOrder from "./components/sendOrder";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Exit } from "./exitModal/page";
import { Carousel1 } from "./components/carusel";
import logo from "./ilb/4chor.png";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">
              We're sorry, but something went wrong. Please try refreshing the
              page or contact support if the problem persists.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sku: string;
  category: string;
  image: string;
  like: boolean;
}

interface Category {
  id: string;
  title: string;
  status?: string;
}

interface CartItem {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

interface CartProduct extends CartItem {
  name: string;
  image: string;
  price: number;
}

const SKELETON_COUNT = 10;

const SkeletonCard = () => (
  <div
    className="bg-white rounded-xl shadow-md p-4 animate-pulse"
    aria-label="Loading product"
  >
    <div className="w-full h-40 bg-gray-300 rounded mb-4" />
    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2" />
    <div className="h-4 bg-gray-300 rounded w-1/2 mb-2" />
    <div className="h-6 bg-gray-300 rounded w-1/3" />
  </div>
);

const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"products" | "order">("products");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [searchResultsOpen, setSearchResultsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const debouncedSearch = useCallback((value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setSearch(value);
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    debouncedSearch(value);
    setSearchResultsOpen(true);
  };

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("cartItems");
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (err) {
      console.error("Failed to load cart:", err);
    }
  }, []);

  const navigateToOrderPage = useCallback(() => {
    const selectedProducts = Object.entries(cart)
      .map(([id, quantity]) => {
        const product = products.find((p) => p.id === id);
        return product
          ? {
              id: product.id,
              name: product.name,
              image: product.image,
              price: product.price,
              quantity,
            }
          : null;
      })
      .filter(Boolean) as CartItem[];

    if (selectedProducts.length === 0) {
      setError("Your cart is empty. Add some products first.");
      return;
    }

    try {
      localStorage.setItem("cartItems", JSON.stringify(selectedProducts));
      router.push("/order");
    } catch (err) {
      console.error("Error saving cart items:", err);
      setError("Failed to proceed to checkout. Please try again.");
    }
  }, [cart, products, router]);

  useEffect(() => {
    try {
      const savedSearchHistory = localStorage.getItem("searchHistory");
      if (savedSearchHistory) {
        setSearchHistory(JSON.parse(savedSearchHistory));
      }
    } catch (err) {
      console.error("Failed to load search history:", err);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const categoriesSnapshot = await getDocs(collection(db, "categories"));
        const categoryData: Category[] = [];

        categoriesSnapshot.forEach((doc) => {
          const data = doc.data() as Omit<Category, "id">;
          if (data.status !== "Draft") {
            categoryData.push({ id: doc.id, ...data });
          }
        });

        setCategories(categoryData);

        const productsSnapshot = await getDocs(collection(db, "products"));
        const productData: Product[] = [];

        productsSnapshot.forEach((doc) => {
          const product = { id: doc.id, ...doc.data() } as Product;
          if (categoryData.some((cat) => cat.title === product.category)) {
            productData.push(product);
          }
        });

        setProducts(productData);
      } catch (err) {
        console.error("Data fetch error:", err);
        setError("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchResultsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalPrice = Object.entries(cart).reduce((sum, [id, count]) => {
    const product = products.find((p) => p.id === id);
    return product ? sum + product.price * count : sum;
  }, 0);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory =
      !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const searchSuggestions = search
    ? products
        .filter((product) =>
          product.name.toLowerCase().includes(search.toLowerCase())
        )
        .slice(0, 5)
    : [];

  const handleToggleLike = async (id: string) => {
    try {
      const updatedProducts = products.map((p) =>
        p.id === id ? { ...p, like: !p.like } : p
      );

      setProducts(updatedProducts);

      await updateDoc(doc(db, "products", id), {
        like: updatedProducts.find((p) => p.id === id)?.like,
      });
    } catch (err) {
      console.error("Error toggling like:", err);
      setError("Failed to update favorite status");
    }
  };

  const handleAddToCart = useCallback((id: string) => {
    try {
      setCart((prev) => ({
        ...prev,
        [id]: (prev[id] || 0) + 1,
      }));
    } catch (err) {
      console.error("Error adding to cart:", err);
      setError("Failed to add item to cart");
    }
  }, []);

  const handleRemoveFromCart = useCallback((id: string) => {
    try {
      setCart((prev) => {
        const newCart = { ...prev };
        if (newCart[id] > 1) {
          newCart[id]--;
        } else {
          delete newCart[id];
        }
        return newCart;
      });
    } catch (err) {
      console.error("Error removing from cart:", err);
      setError("Failed to remove item from cart");
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("cartItems", JSON.stringify(cart));
    } catch (err) {
      console.error("Failed to save cart:", err);
      setError("Failed to save cart items");
    }
  }, [cart]);

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && search.trim()) {
      const trimmedSearch = search.trim();
      if (!searchHistory.includes(trimmedSearch)) {
        const updatedHistory = [...searchHistory, trimmedSearch].slice(-5);
        setSearchHistory(updatedHistory);
        try {
          localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
        } catch (err) {
          console.error("Failed to save search history:", err);
          setError("Failed to save search history");
        }
      }
      setSearch("");
      setSearchResultsOpen(false);
    }
  };

  const handleDeleteSearchItem = (item: string) => {
    const updatedHistory = searchHistory.filter((word) => word !== item);
    setSearchHistory(updatedHistory);

    try {
      localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
    } catch (err) {
      console.error("Failed to update search history:", err);
    }
  };

  const handleClearSearchHistory = () => {
    setSearchHistory([]);

    try {
      localStorage.removeItem("searchHistory");
    } catch (err) {
      console.error("Failed to clear search history:", err);
    }
  };

  const handleQuantityChange = (id: string, change: number) => {
    try {
      setCart((prev) => {
        const newCart = { ...prev };
        const newQuantity = Math.max(1, (newCart[id] || 0) + change);
        newCart[id] = newQuantity;
        return newCart;
      });
    } catch (err) {
      setError("Failed to update quantity");
      console.error("Error updating quantity:", err);
    }
  };

  const handleDelete = (id: string) => {
    try {
      setCart((prev) => {
        const newCart = { ...prev };
        delete newCart[id];
        return newCart;
      });
    } catch (err) {
      setError("Failed to remove item");
      console.error("Error deleting item:", err);
    }
  };

  const handleOrderSubmit = () => {
    setShowOrderForm(false);
    setCart({});
    setActiveTab("products");
  };

  const renderProductsTab = () => (
    <>
      <Carousel1 />
      <section
        aria-label="Product categories"
        className="container mx-auto px-4"
      >
        <Exit />

        <div className="flex gap-3 overflow-x-auto pb-2 md:mt-3 scroll-smooth">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              !selectedCategory
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
            aria-current={!selectedCategory ? "true" : "false"}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.title)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                selectedCategory === cat.title
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
              aria-current={selectedCategory === cat.title ? "true" : "false"}
            >
              {cat.title}
            </button>
          ))}
        </div>
      </section>

      <main className="container mx-auto px-4 py-6">
        {filteredProducts.length === 0 && !loading ? (
          <div className="text-center py-10">
            <h2 className="text-xl font-semibold text-gray-700">
              Maxsulot topilmadi
            </h2>
            <p className="text-gray-500 mt-2">
              {search
                ? "Boshqa qidiruv soʻzini sinab koʻring"
                : "Ushbu turkumda mahsulotlar mavjud emas"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {loading
              ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                  <SkeletonCard key={`skeleton-${i}`} />
                ))
              : filteredProducts.map((product) => (
                  <motion.article
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-xl shadow-md p-2 group relative flex flex-col transition-all hover:shadow-lg"
                  >
                    <div className="relative">
                      <div
                        className="w-full h-40 bg-gray-200 rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => setSelectedImage(product.image)}
                      >
                        <img
                          src={product.image || "/placeholder.png"}
                          alt={product.name}
                          className="w-full h-full object-cover transition-opacity duration-300"
                          loading="lazy"
                          onLoad={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.style.opacity = "1";
                          }}
                          style={{ opacity: 0 }}
                        />
                      </div>
                      <motion.button
                        onClick={() => handleToggleLike(product.id)}
                        className={`absolute top-2 right-2 p-1 rounded-full ${
                          product.like
                            ? "bg-red-500 text-white"
                            : "bg-white text-gray-500"
                        } shadow-md`}
                        whileHover={{ scale: 1.2 }}
                        aria-label={
                          product.like
                            ? `Remove ${product.name} from favorites`
                            : `Add ${product.name} to favorites`
                        }
                      >
                        <FiHeart />
                      </motion.button>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
                      {product.name}
                    </h3>
                    <p
                      className="text-sm text-gray-600 line-clamp-2 cursor-pointer active:underline"
                      onClick={() => router.push(`/info/${product.id}`)}
                    >
                      {product.description}
                    </p>

                    <div className="flex justify-between items-center mt-4">
                      <span className="text-lg font-semibold text-blue-600">
                        {product.price.toLocaleString()} сум
                      </span>

                      <motion.button
                        onClick={() => handleAddToCart(product.id)}
                        whileTap={{ scale: 1.05 }}
                        className="relative bg-blue-100 hover:bg-blue-200 text-blue-600 p-2 rounded-full shadow-md transition duration-200"
                        aria-label={`Add ${product.name} to cart`}
                      >
                        <FiShoppingCart className="text-2xl" />

                        {cart[product.id] > 0 && (
                          <span className="absolute -top-2 -right-1 bg-red-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full shadow">
                            {cart[product.id]}
                          </span>
                        )}
                      </motion.button>
                    </div>
                  </motion.article>
                ))}
          </div>
        )}
      </main>
    </>
  );

  const renderOrderTab = () => {
    const selectedProducts = Object.entries(cart)
      .map(([id, quantity]) => {
        const product = products.find((p) => p.id === id);
        return product
          ? {
              id: product.id,
              name: product.name,
              image: product.image,
              price: product.price,
              quantity,
            }
          : null;
      })
      .filter(Boolean) as CartItem[];

    const totalPrice = selectedProducts.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    return (
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setActiveTab("products")}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            aria-label="Go back to products"
          >
            <FiArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            Sizning savatingiz
          </h1>
        </div>

        {selectedProducts.length === 0 ? (
          <div className="text-center py-10">
            <h2 className="text-xl font-semibold text-gray-700">
              Savatingiz boʻsh
            </h2>
            <p className="text-gray-500 mt-2">
              Avval savatga ba'zi mahsulotlarni qo'shing
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {selectedProducts.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col sm:flex-row items-center justify-between bg-white p-3 sm:p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center w-full sm:w-auto mb-3 sm:mb-0">
                    <img
                      src={item.image || "/placeholder.png"}
                      alt={item.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md"
                      loading="lazy"
                    />
                    <div className="ml-3 sm:ml-4">
                      <h2 className="text-sm sm:text-base font-medium text-gray-800 line-clamp-1">
                        {item.name}
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {item.price.toLocaleString()} sum
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-400 hover:text-red-600 p-1 sm:p-2 transition-colors"
                      aria-label="Remove item"
                    >
                      <FiTrash2 size={18} />
                    </button>

                    <div className="flex items-center border rounded-full overflow-hidden ml-3">
                      <button
                        onClick={() => handleQuantityChange(item.id, -1)}
                        className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
                        aria-label="Decrease quantity"
                        disabled={item.quantity <= 1}
                      >
                        −
                      </button>
                      <span className="px-3 py-1 font-medium text-gray-800 min-w-[30px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.id, 1)}
                        className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="mt-8 border-t pt-6 sticky bottom-0 bg-gray-50 pb-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-gray-700">
                  Total:
                </span>
                <span className="text-xl font-bold text-blue-600">
                  {totalPrice.toLocaleString()} sum
                </span>
              </div>
              <button
                onClick={() => setShowOrderForm(true)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
                disabled={selectedProducts.length === 0}
              >
                Rasmiylashtirishga o'tish
              </button>
            </div>

            {showOrderForm && (
              <SendOrder
                cartItems={selectedProducts}
                totalPrice={totalPrice}
                onClose={() => setShowOrderForm(false)}
                onSubmit={handleOrderSubmit}
              />
            )}
          </div>
        )}
      </main>
    );
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-white">
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center p-4">
            <div className="relative max-w-4xl w-full">
              <button
                onClick={() => setSelectedImage(null)}
                className="fixed top-4 right-4 text-white text-4xl hover:text-gray-300 transition-colors w-10 h-10 flex items-center justify-center"
                aria-label="Close image preview"
              >
                ×
              </button>
              <img
                src={selectedImage}
                alt="Enlarged view"
                className="w-full h-auto rounded-lg shadow-2xl"
              />
            </div>
          </div>
        )}

        <header className="bg-gradient-to-r from-blue-500 to-blue-700 shadow-lg sticky top-0 z-40">
          <div className="container mx-auto px-4 py-3 mb-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex w-full sm:w-auto justify-between items-center">
                <div className="flex items-center align-item-center mt-2">
                  <img
                    style={{
                      width: "110px",
                      height: "50px",
                      objectFit: "cover",
                    }}
                    src={logo.src}
                    alt="logo"
                  />
                </div>
                <button
                  onClick={() => setActiveTab("order")}
                  className="relative flex items-center sm:hidden"
                  aria-label="Cart"
                >
                  <div className="relative">
                    <FiShoppingCart size={24} className="text-white" />
                    {Object.keys(cart).length > 0 && (
                      <span
                        className="absolute -top-1 -right-3 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full"
                        style={{ minWidth: "20px", textAlign: "center" }}
                      >
                        {Object.keys(cart).length}
                      </span>
                    )}
                  </div>
                </button>
              </div>

              <div ref={searchRef} className="relative w-full sm:w-96">
                <label htmlFor="search-input" className="sr-only">
                  Mahsulot qidirish
                </label>
                <MdSearch className="absolute top-3 left-3 text-gray-400 text-xl" />
                <input
                  id="search-input"
                  type="text"
                  placeholder="Mahsulot qidirish..."
                  className="w-full pl-10 pr-4 bg-amber-50 py-2 rounded-full border border-gray-300 focus:ring-2 outline-none text-gray-900 placeholder-gray-500"
                  onChange={handleSearchChange}
                  onFocus={() => setSearchResultsOpen(true)}
                  onKeyDown={handleSearchSubmit}
                  aria-expanded={searchResultsOpen}
                  aria-haspopup="listbox"
                />
                {searchResultsOpen && (
                  <div
                    className="absolute z-50 mt-2 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto"
                    role="listbox"
                  >
                    {searchSuggestions.length > 0 ? (
                      searchSuggestions.map((product) => (
                        <button
                          key={product.id}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                          onClick={() => {
                            setSelectedCategory(null);
                            setSearch(product.name);
                            setSearchResultsOpen(false);
                          }}
                          role="option"
                        >
                          <span className="text-sm text-black">
                            {product.name}
                          </span>
                          <span className="text-sm font-semibold text-blue-600">
                            {product.price.toLocaleString()} сум
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        natija topilmadi
                      </div>
                    )}

                    {searchHistory.length > 0 && (
                      <div className="border-t mt-2 pt-2">
                        <div className="px-4 flex justify-between items-center mb-1">
                          <h4 className="text-xs font-bold text-gray-600">
                            Qidiruv tarixi
                          </h4>
                          <button
                            onClick={handleClearSearchHistory}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Hammasini tozalash
                          </button>
                        </div>
                        {searchHistory.map((item, index) => (
                          <div
                            key={index}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                          >
                            <button
                              className="text-sm text-black flex-grow text-left"
                              onClick={() => {
                                setSearch(item);
                                setSearchResultsOpen(false);
                              }}
                            >
                              {item}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSearchItem(item);
                              }}
                              className="text-gray-400 hover:text-red-500 ml-2"
                              aria-label={`Remove ${item} from history`}
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => setActiveTab("order")}
                className="relative hidden sm:flex items-center"
                aria-label="Cart"
                style={{ minWidth: "120px" }}
              >
                <div className="relative">
                  <FiShoppingCart size={30} className="text-white" />
                  {Object.keys(cart).length > 0 && (
                    <span
                      className="absolute -top-1 -right-3 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full"
                      style={{ minWidth: "20px", textAlign: "center" }}
                    >
                      {Object.keys(cart).length}
                    </span>
                  )}
                </div>
                {totalPrice > 0 && (
                  <span className="text-sm font-semibold text-white ml-2 whitespace-nowrap">
                    {totalPrice.toLocaleString()} sum
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Error message */}
        {error && (
          <div className="container mx-auto px-4 mt-4">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">{error}</span>
              <button
                onClick={() => setError(null)}
                className="absolute top-0 right-0 px-2 py-1"
                aria-label="Dismiss error"
              >
                &times;
              </button>
            </div>
          </div>
        )}

        {activeTab === "products" ? renderProductsTab() : renderOrderTab()}
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </ErrorBoundary>
  );
};

export default HomePage;
