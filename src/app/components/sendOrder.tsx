"use client";

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FiPhone, FiUser, FiMessageSquare } from 'react-icons/fi';

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

const SendOrder: React.FC<SendOrderProps> = ({ cartItems, totalPrice, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    comment: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.phone || !formData.name) {
      toast.error('Telefon va ism majburiy!');
      setLoading(false);
      return;
    }

    try {
      const orderData = {
        items: cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          totalItemPrice: item.price * item.quantity
        })),
        totalPrice,
        customerInfo: {
          ...formData,
          phone: formData.phone.startsWith('+') ? formData.phone : `+${formData.phone}`
        },
        orderDate: new Date().toISOString(),
        status: 'new'
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error('Buyurtma yuborishda xatolik');
      }

      toast.success('Buyurtmangiz muvaffaqiyatli yuborildi!');
      onSubmit();
    } catch (err) {
      toast.error('Xatolik yuz berdi. Qaytadan urinib ko\'ring');
      console.error('Order submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all">
        <div className="border-b pb-3 mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Buyurtma berish</h2>
          <p className="text-gray-500 text-sm mt-1">Iltimos, ma'lumotlarni to'ldiring</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <FiPhone className="mr-2" />
              Telefon*
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
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
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Yuborilmoqda...
                  </span>
                ) : (
                  'Buyurtma berish'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendOrder; 