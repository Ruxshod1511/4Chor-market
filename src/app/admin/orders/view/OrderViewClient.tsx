"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { ref, onValue, update } from 'firebase/database';
import { database } from '@/app/admin/utils/Firebase.config';
import { toast } from 'react-toastify';
import { FiPrinter, FiTrash2, FiPlus, FiX, FiDownload } from 'react-icons/fi';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  totalItemPrice: number;
}

interface Order {
  id: string;
  customerInfo: {
    name: string;
    phone: string;
    comment?: string;
  };
  items: OrderItem[];
  totalPrice: number;
  status: 'new' | 'processing' | 'completed' | 'cancelled';
  orderNumber: number;
  createdAt: any;
}

export default function OrderViewClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 1,
    price: 0
  });

  useEffect(() => {
    if (!orderId) return;

    const orderRef = ref(database, `orders/${orderId}`);
    const unsubscribe = onValue(orderRef, (snapshot) => {
      if (snapshot.exists()) {
        const orderData = snapshot.val();
        setOrder({ id: orderId, ...orderData });
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching order:', error);
      toast.error('Buyurtmani yuklashda xatolik yuz berdi');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orderId]);

  useEffect(() => {
    const productsRef = ref(database, 'products');
    const unsubscribe = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const productsData: Product[] = [];
        snapshot.forEach((childSnapshot) => {
          productsData.push({
            id: childSnapshot.key as string,
            ...childSnapshot.val()
          });
        });
        setProducts(productsData);
      }
    });

    return () => unsubscribe();
  }, []);

  const handlePrint = () => {
    const printContent = document.getElementById('contentRef');
    const originalContents = document.body.innerHTML;
    
    document.body.innerHTML = printContent?.innerHTML || '';
    
    window.print();
    
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const handleDownloadPDF = async () => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = contentRef.current;
      if (!element) {
        throw new Error('Content element not found');
      }

      document.body.classList.add('print-mode');

      const opt = {
        margin: [10, 10, 10, 10],
        filename: `buyurtma-${order?.orderNumber || 'unknown'}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: true,
          windowWidth: element.scrollWidth
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait'
        }
      };

      await html2pdf().set(opt).from(element).save();

      document.body.classList.remove('print-mode');
    } catch (error) {
      console.error('PDF yaratishda xatolik:', error);
      toast.error('PDF yaratishda xatolik yuz berdi');
      document.body.classList.remove('print-mode');
    }
  };

  const handleDeleteItem = async (index: number) => {
    if (!order) return;

    try {
      const updatedItems = [...order.items];
      updatedItems.splice(index, 1);
      
      const newTotalPrice = updatedItems.reduce((sum, item) => sum + item.totalItemPrice, 0);
      
      await update(ref(database, `orders/${order.id}`), {
        items: updatedItems,
        totalPrice: newTotalPrice
      });

      setOrder({ ...order, items: updatedItems, totalPrice: newTotalPrice });
      toast.success('Mahsulot o\'chirildi');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Mahsulotni o\'chirishda xatolik yuz berdi');
    }
  };

  const handleAddItem = async () => {
    if (!order || !newItem.name || newItem.quantity <= 0) {
      toast.error('Barcha maydonlarni to\'ldiring');
      return;
    }

    try {
      const selectedProduct = products.find(product => product.name === newItem.name);
      
      if (!selectedProduct) {
        toast.error('Mahsulot topilmadi');
        return;
      }

      const newItemWithTotal = {
        name: selectedProduct.name,
        quantity: newItem.quantity,
        price: selectedProduct.price,
        totalItemPrice: newItem.quantity * selectedProduct.price
      };

      const updatedItems = [...(order.items || []), newItemWithTotal];
      const newTotalPrice = updatedItems.reduce((sum, item) => sum + item.totalItemPrice, 0);

      await update(ref(database, `orders/${order.id}`), {
        items: updatedItems,
        totalPrice: newTotalPrice
      });

      setOrder({ ...order, items: updatedItems, totalPrice: newTotalPrice });
      setNewItem({ name: '', quantity: 1, price: 0 });
      toast.success('Yangi mahsulot qo\'shildi');
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Mahsulot qo\'shishda xatolik yuz berdi');
    }
  };

  const handleSelectProduct = (product: Product) => {
    setNewItem({
      name: product.name,
      quantity: 1,
      price: product.price
    });
    setShowProductModal(false);
  };

  const ProductSelectionModal = () => {
    if (!showProductModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Mahsulot tanlang</h2>
            <button
              onClick={() => setShowProductModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX size={24} />
            </button>
          </div>
          <div className="p-4">
            {products.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                Mahsulotlar yuklanmoqda...
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <motion.article
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => handleSelectProduct(product)}
                    className="bg-white rounded-xl shadow-md p-3 group relative flex flex-col transition-all hover:shadow-lg cursor-pointer border border-gray-200"
                  >
                    <div className="relative">
                      <div className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={product.image}
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
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mt-2 line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 flex-grow">
                      {product.description}
                    </p>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-lg font-semibold text-blue-600">
                        {product.price.toLocaleString()} so'm
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectProduct(product);
                        }}
                        className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={`Tanlash ${product.name}`}
                      >
                        <FiPlus className="text-blue-600" />
                      </button>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 bg-gray-900">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-1/4"></div>
          <div className="h-64 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen p-4 bg-gray-900">
        <div className="text-center text-gray-400">
          Buyurtma topilmadi
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 print:p-0 bg-[#111827] print:bg-white">
      <div className="max-w-4xl mx-auto bg-[#1F2937] print:bg-white print:shadow-none shadow-lg rounded-lg overflow-hidden">
        <div className="p-6 print:p-4">
          <div className="flex justify-between items-start mb-6 no-print">
            <h1 className="text-2xl font-bold text-white">
              Buyurtma #{order.orderNumber}
            </h1>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8]"
              >
                <FiPrinter />
                Chop etish
              </button>
            </div>
          </div>

          <div ref={contentRef}>
            <div className="only-print text-center mb-8 border-b border-[#E5E7EB] pb-4">
              <h1 className="text-3xl font-bold text-[#111827] mb-2">
                Buyurtma #{order.orderNumber}
              </h1>
              <p className="text-[#4B5563]">
                {new Date().toLocaleDateString('uz-UZ', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            <div className="mb-8 print:mb-6">
              <h2 className="text-xl font-semibold mb-4 text-white print:text-[#111827] border-b border-[#374151] print:border-[#E5E7EB] pb-2">
                Mijoz ma'lumotlari
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="print:border print:border-[#E5E7EB] print:p-4 print:rounded">
                  <p className="text-sm text-[#9CA3AF] print:text-[#4B5563] mb-1">Ism</p>
                  <p className="font-medium text-white print:text-[#111827] text-lg">{order.customerInfo.name}</p>
              
                  <p className="text-sm text-[#9CA3AF] print:text-[#4B5563] mb-1">Telefon</p>
                  <p className="font-medium text-white print:text-[#111827] text-lg">{order.customerInfo.phone}</p>
                </div>
                {order.customerInfo.comment && (
                  <div className="md:col-span-2 print:border print:border-[#E5E7EB] print:p-4 print:rounded">
                    <p className="text-sm text-[#9CA3AF] print:text-[#4B5563] mb-1">Izoh</p>
                    <p className="font-medium text-white print:text-[#111827]">{order.customerInfo.comment}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-8 print:mb-6">
              <h2 className="text-xl font-semibold mb-4 text-white print:text-[#111827] border-b border-[#374151] print:border-[#E5E7EB] pb-2">
                Buyurtma tarkibi
              </h2>
              <div className="overflow-x-auto print:border print:border-[#E5E7EB] print:rounded">
                <table className="w-full print:border-collapse">
                  <thead>
                    <tr className="border-b border-[#374151] print:border-[#E5E7EB] print:bg-gray-50">
                      <th className="text-left py-3 px-4 text-[#9CA3AF] print:text-[#111827] print:font-bold">#</th>
                      <th className="text-left py-3 px-4 text-[#9CA3AF] print:text-[#111827] print:font-bold">Mahsulot</th>
                      <th className="text-left py-3 px-4 text-[#9CA3AF] print:text-[#111827] print:font-bold">Narxi</th>
                      <th className="text-left py-3 px-4 text-[#9CA3AF] print:text-[#111827] print:font-bold">Soni</th>
                      <th className="text-left py-3 px-4 text-[#9CA3AF] print:text-[#111827] print:font-bold">Jami</th>
                      <th className="text-left py-3 px-4 text-[#9CA3AF] print:hidden">Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => (
                      <tr key={index} className="border-b border-[#374151] print:border-[#E5E7EB]">
                        <td className="py-3 px-4 text-white print:text-[#111827]">{index + 1}</td>
                        <td className="py-3 px-4 text-white print:text-[#111827]">{item.name}</td>
                        <td className="py-3 px-4 text-white print:text-[#111827]">{item.price.toLocaleString()} so'm</td>
                        <td className="py-3 px-4 text-white print:text-[#111827]">{item.quantity}</td>
                        <td className="py-3 px-4 text-white print:text-[#111827]">{item.totalItemPrice.toLocaleString()} so'm</td>
                        <td className="py-3 px-4 print:hidden">
                          <button
                            onClick={() => handleDeleteItem(index)}
                            className="text-[#F87171] hover:text-[#EF4444] print:hidden"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[#374151] print:border-[#E5E7EB] print:bg-gray-50">
                      <td colSpan={4} className="py-3 px-4 font-medium text-white print:text-[#111827] text-right">
                        Jami summa:
                      </td>
                      <td colSpan={2} className="py-3 px-4 font-bold text-white print:text-[#111827]">
                        {order.totalPrice.toLocaleString()} so'm
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="print:mt-8 print:pt-8 print:border-t print:border-[#E5E7EB] print:text-center print:text-[#4B5563]">
              <p className="print:text-sm">Bu hujjat kompyuter tomonidan yaratilgan va imzo talab qilinmaydi</p>
              <p className="print:text-sm print:mt-1">Savol va murojatlar uchun: +998 91 296 11 11</p>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .only-print {
            display: block !important;
          }
          #contentRef {
            padding: 0;
            margin: 0;
          }
          #contentRef * {
            color: #111827 !important;
            background-color: white !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            padding: 8px !important;
            border: 1px solid #E5E7EB !important;
          }
          th {
            background-color: #F9FAFB !important;
            font-weight: bold !important;
          }
        }
        .only-print {
          display: none;
        }
      `}</style>
      <ProductSelectionModal />
    </div>
  );
} 