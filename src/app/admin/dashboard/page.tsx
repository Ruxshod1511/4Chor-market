"use client";

import React, { useState, useEffect } from "react";
import { FaList, FaBox, FaUsers, FaShoppingCart } from "react-icons/fa";
import { db } from "../utils/Firebase.config";
import { collection, onSnapshot, doc, getDoc, updateDoc, getDocs } from 'firebase/firestore';
import { unsubscribe } from "diagnostics_channel";


type CardData = {
  title: string;
  count: string;
  icon: React.ReactNode;
};

const DashboardPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [categoryCount, setCategoryCount] = useState<number>(0);
  const [productCount, setProductCount] = useState<number>(0);
  const [orderCount, setOrderCount] = useState<number>(0);
  const [userCount, setUserCount] = useState<number>(0); // Added state for user count

  const cardData: CardData[] = [
    {
      title: "Total Category",
      count: `${categoryCount}X`,
      icon: <FaList size={26} className="text-blue-500" />,
    },
    {
      title: "Total Order",
      count: `2X`,
      icon: <FaShoppingCart size={26} className="text-green-500" />,
    },
    {
      title: "Total Product",
      count: `${productCount}X`,
      icon: <FaBox size={26} className="text-purple-500" />,
    },
    {
      title: "Total User",
      count: `${userCount}X`, 
      icon: <FaUsers size={26} className="text-red-500" />,
    },
  ];

  const fetchCategoryCount = async (): Promise<void> => {
    const querySnapshot = await getDocs(collection(db, "categories"));
    setCategoryCount(querySnapshot.size);
  };

  const fetchProductCount = async (): Promise<void> => {
    const querySnapshot = await getDocs(collection(db, "products"));
    setProductCount(querySnapshot.size);
  };

  const fetchOrderCount = async (): Promise<void> => {
   

   
  };

  const fetchUserCount = async (): Promise<void> => {
    const querySnapshot = await getDocs(collection(db, "users"));
    setUserCount(querySnapshot.size);
  };

  useEffect(() => {
    fetchCategoryCount();
    fetchProductCount();
    fetchOrderCount();
    fetchUserCount(); 
  }, []);

  const toggleModal = () => {
    setIsModalOpen((prev) => !prev);
  };

  return (
    <div className="px-4 py-6 sm:px-6">
      <h1 className="text-xl mb-3 text-gray-800 dark:text-white">
        <span className="text-blue-500">admin/</span>
        <span>dashboard</span>
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center">
        {cardData.map((card, index) => (
          <div
            key={index}
            className="flex items-center bg-white shadow-md rounded-xl p-5 gap-4 border border-gray-200 hover:shadow-xl transition w-full max-w-xs"
          >
            <div className="p-3 border-2 border-gray-300 rounded-full bg-gray-50">
              {card.icon}
            </div>
            <div>
              <h2 className="text-gray-600 text-base font-semibold mb-1">
                {card.title}
              </h2>
              <p className="text-2xl font-bold text-gray-800">{card.count}</p>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-4">
            <h2 className="text-2xl font-semibold mb-4">Modal Content</h2>
            <p className="text-lg mb-4">This is a centered modal.</p>
            <button
              onClick={toggleModal}
              className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
            >
              Close Modal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
