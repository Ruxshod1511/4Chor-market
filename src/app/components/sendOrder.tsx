"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiPhone, FiUser, FiMessageSquare } from "react-icons/fi";

interface SendOrderProps {
  cartItems: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  totalPrice: number;
  onClose: () => void;
  onSubmit: () => void;
}

interface LocationInfo {
  ip: string;
  city: string;
  region: string;
  country_name: string;
  latitude: number;
  longitude: number;
}

const SendOrder: React.FC<SendOrderProps> = ({
  cartItems,
  totalPrice,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    phone: "",
    name: "",
    comment: "",
  });
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [showTelegramModal, setShowTelegramModal] = useState(false);

  // IP orqali lokatsiyani olish
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        setLocation(data);
      } catch (err) {
        console.error("Lokatsiyani olishda xatolik:", err);
      }
    };
    fetchLocation();
  }, []);

  // Buyurtma yuborish + modalni ochish
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.phone || !formData.name) {
      toast.error("Telefon va ism majburiy!");
      return;
    }

    setShowTelegramModal(true); // modalni ochish

    // Backendga yuborish (fon rejimida)
    try {
      const orderData = {
        items: cartItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          totalItemPrice: item.price * item.quantity,
        })),
        totalPrice,
        customerInfo: {
          ...formData,
          phone: formData.phone.startsWith("+")
            ? formData.phone
            : `+${formData.phone}`,
        },
        location: location
          ? {
              ip: location.ip,
              city: location.city,
              region: location.region,
              country: location.country_name,
              lat: location.latitude,
              lng: location.longitude,
            }
          : null,
        orderDate: new Date().toISOString(),
        status: "new",
      };

      await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });
    } catch (err) {
      console.error("Buyurtma yuborishda xatolik:", err);
      toast.error("Buyurtma yuborilmadi. Qayta urinib ko‘ring.");
    }
  };

  // Telegram modal yopilganda toast va onSubmit ishlashi
  const handleTelegramClose = () => {
    setShowTelegramModal(false);
    toast.success(
      "Buyurtmangiz yuborildi, tez orada siz bilan aloqaga chiqamiz!"
    );
    onSubmit();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full transform transition-all">
          <div className="border-b pb-3 mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              Buyurtma berish
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Iltimos, ma'lumotlarni to'ldiring
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <FiPhone className="mr-2" />
                Telefon*
              </label>
              <input
                type="number"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-black"
                placeholder="+998 90 123 45 67"
                required
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <FiUser className="mr-2" />
                Ismingiz*
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-black"
                placeholder="To'liq ismingiz"
                required
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <FiMessageSquare className="mr-2" />
                Izoh
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, comment: e.target.value }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-black"
                placeholder="Manzil yoki qo'shimcha ma'lumotlar"
                rows={3}
              />
            </div>

            <div className="border-t pt-4 mt-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">Jami summa:</span>
                <span className="text-xl font-bold text-blue-600">
                  {totalPrice.toLocaleString()} so'm
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? "Yuborilmoqda..." : "Buyurtma berish"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Telegramga yuborish haqida modal */}
      {showTelegramModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h2 className="text-xl font-semibold text-center text-gray-800 mb-4">
              Ma'lumot yuborish
            </h2>
            <p className="text-gray-700 text-center mb-4">
              Iltimos, quyidagi ma'lumotlarni <br />
              <a
                href="https://t.me/Kurbonova_nigora"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 font-bold underline"
              >
                4Chor admin
              </a>{" "}
              ga Telegram orqali yuboring:
            </p>
            <div className="bg-gray-100 p-3 rounded text-sm text-gray-800 space-y-2">
              <div>
                📍 <span className="font-medium">Lokatsiya:</span> <br />
                Iltimos, Telegram orqali lokatsiyangizni yuboring!
              </div>
              <a
                className="underline text-blue-500"
                href="https://youtube.com/shorts/zy0-Az_YkKM?si=F3Xj4rFLCb0nNJFL"
                target="_blank"
                rel="noopener noreferrer"
              >
                Lokatsiya yuborish bo‘yicha video
              </a>
              <div>
                📞 <span className="font-medium">Telefon:</span> <br />
                {formData.phone}
              </div>
            </div>
            <button
              onClick={handleTelegramClose}
              className="mt-6 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
            >
              Yubordim
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SendOrder;
