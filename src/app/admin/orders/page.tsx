"use client";

import React, { useEffect, useState } from "react";
import { ref, onValue, update, get, remove } from "firebase/database";
import { database } from "@/app/admin/utils/Firebase.config";
import { FiEye } from "react-icons/fi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { collection, doc, updateDoc, getDocs } from "firebase/firestore";
import { db } from "@/app/admin/utils/Firebase.config";

interface Order {
  id: string;
  customerInfo: {
    name: string;
    phone: string;
    comment?: string;
  };
  items: {
    name: string;
    quantity: number;
    price: number;
    totalItemPrice: number;
  }[];
  totalPrice: number;
  status: "new" | "processing" | "completed" | "cancelled";
  orderNumber: number;
  createdAt: number;
}

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleString();
  };

  useEffect(() => {
    const ordersRef = ref(database, "orders");

    const unsubscribe = onValue(
      ordersRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const ordersData: Order[] = [];
          snapshot.forEach((childSnapshot) => {
            const order = {
              id: childSnapshot.key,
              ...childSnapshot.val(),
            } as Order;
            ordersData.push(order);
          });

          ordersData.sort((a, b) => {
            const dateA = a.createdAt || 0;
            const dateB = b.createdAt || 0;
            return dateB - dateA;
          });

          setOrders(ordersData);
        } else {
          setOrders([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching orders:", error);
        toast.error("Buyurtmalarni yuklashda xatolik yuz berdi");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  async function handleDelete(id: string) {
    await remove(ref(database, `orders/${id}`));
  }

  const handleStatusChange = async (
    orderId: string,
    newStatus: Order["status"]
  ) => {
    try {
      const orderRef = ref(database, `orders/${orderId}`);
      await update(orderRef, {
        status: newStatus,
      });

      // Agar status "completed" bo'lsa
      if (newStatus === "completed") {
        // Buyurtmani olish
        const orderSnapshot = await get(orderRef);
        const orderData = orderSnapshot.val();

        if (orderData && orderData.items) {
          for (const item of orderData.items) {
            try {
              const productsSnapshot = await getDocs(
                collection(db, "products")
              );
              const product = productsSnapshot.docs.find(
                (doc) => doc.data().name === item.name
              );

              if (product) {
                const productData = product.data();
                const currentAmount = productData.amount || 0;
                const newAmount = Math.max(0, currentAmount - item.quantity);

                // Mahsulot miqdorini yangilash
                await updateDoc(doc(db, "products", product.id), {
                  amount: newAmount,
                });

                console.log(
                  `${item.name} miqdori yangilandi: ${currentAmount} -> ${newAmount}`
                );
              }
            } catch (error) {
              console.error(
                `${item.name} miqdorini yangilashda xatolik:`,
                error
              );
              toast.error(
                `${item.name} miqdorini yangilashda xatolik yuz berdi`
              );
            }
          }
        }
      }

      toast.success("Buyurtma statusi muvaffaqiyatli o'zgartirildi");
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Statusni o'zgartirishda xatolik yuz berdi");
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: Order["status"]): string => {
    switch (status) {
      case "new":
        return "Yangi";
      case "processing":
        return "Jarayonda";
      case "completed":
        return "Bajarildi";
      case "cancelled":
        return "Bekor qilindi";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 rounded-lg shadow">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-3 mt-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-full mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            Buyurtmalar
          </h1>
        </div>

        <div className="rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    №
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mijoz
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefon
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sana
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ko'rish
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order, idx) => (
                  <tr
                    key={order.id}
                    className="bg-white hover:bg-blue-50 transition"
                  >
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.orderNumber || idx + 1}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.customerInfo?.name || "Noma'lum"}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.customerInfo?.phone || "-"}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(
                            order.id,
                            e.target.value as Order["status"]
                          )
                        }
                        className={`text-sm rounded-full px-3 py-1 font-semibold border focus:outline-none focus:ring-2 ${getStatusColor(
                          order.status
                        )}`}
                      >
                        <option value="new">Yangi</option>
                        <option value="processing">Jarayonda</option>
                        <option value="completed">Bajarildi</option>
                        <option value="cancelled">Bekor qilindi</option>
                      </select>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() =>
                          (window.location.href = `/admin/orders/view?id=${order.id}`)
                        }
                        className="text-blue-600 hover:text-blue-900 p-2 rounded transition"
                        title="Ko‘rish"
                      >
                        <FiEye size={18} />
                      </button>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-800">
                    Buyurtma #{selectedOrder.orderNumber}
                  </h2>
                  <p className="text-xs md:text-sm text-gray-500">
                    {formatDate(selectedOrder.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-800">
                    Mijoz ma'lumotlari
                  </h3>
                  <p className="text-sm md:text-base">
                    Ism: {selectedOrder.customerInfo.name}
                  </p>
                  <p className="text-sm md:text-base">
                    Telefon: {selectedOrder.customerInfo.phone}
                  </p>
                  {selectedOrder.customerInfo.comment && (
                    <p className="text-sm md:text-base">
                      Izoh: {selectedOrder.customerInfo.comment}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="font-medium text-gray-800 mb-2">
                    Buyurtma tarkibi
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">
                            Mahsulot
                          </th>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">
                            Narxi
                          </th>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">
                            Soni
                          </th>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">
                            Jami
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedOrder.items.map((item, index) => (
                          <tr key={index}>
                            <td className="py-2 text-sm">{item.name}</td>
                            <td className="py-2 text-sm">
                              {item.price.toLocaleString()} so'm
                            </td>
                            <td className="py-2 text-sm">{item.quantity}</td>
                            <td className="py-2 text-sm">
                              {item.totalItemPrice.toLocaleString()} so'm
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2">
                          <td colSpan={3} className="py-2 font-medium text-sm">
                            Jami summa:
                          </td>
                          <td className="py-2 font-bold text-sm">
                            {selectedOrder.totalPrice.toLocaleString()} so'm
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Status</h3>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) =>
                      handleStatusChange(
                        selectedOrder.id,
                        e.target.value as Order["status"]
                      )
                    }
                    className={`w-full text-sm rounded-lg px-3 py-2 font-semibold ${getStatusColor(
                      selectedOrder.status
                    )}`}
                  >
                    <option value="new">Yangi</option>
                    <option value="processing">Jarayonda</option>
                    <option value="completed">Bajarildi</option>
                    <option value="cancelled">Bekor qilindi</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
