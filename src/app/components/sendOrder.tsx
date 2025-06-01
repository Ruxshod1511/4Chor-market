"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";
import { FiPhone, FiUser, FiMessageSquare, FiMapPin } from "react-icons/fi";
import YandexMapModal from "./yandexMapModal";

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

  const [showMapModal, setShowMapModal] = useState(false);
  const [locationCoords, setLocationCoords] = useState<[number, number] | null>(
    null
  );

  // YandexMapdan koordinata olish
  const handleSelectLocation = (coords: [number, number]) => {
    setLocationCoords(coords);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.phone || !formData.name) {
      toast.error("Telefon va ism majburiy!");
      return;
    }
    if (!locationCoords) {
      toast.error("Lokatsiya majburiy!");
      return;
    }
    setLoading(true);

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
      mapLocation: { lat: locationCoords[0], lng: locationCoords[1] },
      orderDate: new Date().toISOString(),
      status: "new",
    };

    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });
      toast.success(
        "Buyurtmangiz yuborildi, tez orada siz bilan aloqaga chiqamiz!"
      );
      onSubmit();

      setLoading(false);
    } catch (err) {
      console.error("Buyurtma yuborishda xatolik:", err);
      toast.error("Buyurtma yuborilmadi. Qayta urinib ko‘ring.");
      setLoading(false);
    }
  };

  return (
    <>
      <YandexMapModal
        open={showMapModal}
        onClose={() => setShowMapModal(false)}
        onSelect={handleSelectLocation}
      />
      <div className="fixed z-50 inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
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

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <FiMapPin className="mr-2" />
                Lokatsiya* (majburiy)
              </label>

              <button
                type="button"
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition"
                onClick={() => setShowMapModal(true)}
              >
                Lokatsiyani xaritadan tanlash
              </button>
              {locationCoords && (
                <div className="text-green-700 mt-2 text-xs">
                  Tanlangan joy: <br />
                  <b>Latitude:</b> {locationCoords[0].toFixed(6)},{" "}
                  <b>Longitude:</b> {locationCoords[1].toFixed(6)}
                </div>
              )}
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
                  className="flex-1 px-4 py-3 text-black bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
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
    </>
  );
};

export default SendOrder;
