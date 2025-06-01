"use client";

import React, { useEffect, useState } from "react";
import { FaList, FaBox, FaShoppingCart } from "react-icons/fa";
import { db, database } from "../utils/Firebase.config";
import { collection, getDocs } from "firebase/firestore";
import { onValue, ref } from "firebase/database";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

// Kartalar uchun gradient va ranglar
const CARD_GRADIENTS = [
  "from-blue-500 to-blue-700",
  "from-green-500 to-green-700",
  "from-violet-500 to-purple-700",
];
const ICON_BG = [
  "bg-white text-blue-600",
  "bg-white text-green-600",
  "bg-white text-purple-600",
];
const COLORS = ["#2563eb", "#22c55e", "#a21caf", "#e11d48"];

const DashboardPage: React.FC = () => {
  const [categoryCount, setCategoryCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);

  const [orderStats, setOrderStats] = useState<{ pie: any[]; bar: any[] }>({
    pie: [],
    bar: [],
  });

  // Firestore: Kategoriya va mahsulotlar
  const fetchCategoryCount = async () => {
    const querySnapshot = await getDocs(collection(db, "categories"));
    setCategoryCount(querySnapshot.size);
  };
  const fetchProductCount = async () => {
    const querySnapshot = await getDocs(collection(db, "products"));
    setProductCount(querySnapshot.size);
  };

  // RTDB: Buyurtmalar statistikasi
  const fetchOrderStats = () => {
    const ordersRef = ref(database, "orders");
    onValue(ordersRef, (snapshot) => {
      let orders: any[] = [];
      let statusStats: any = {
        Yangi: 0,
        Jarayonda: 0,
        Bajarildi: 0,
        "Bekor qilindi": 0,
      };
      let monthlyStats: any = {};

      snapshot.forEach((child) => {
        const order = child.val();
        orders.push(order);
        // Status statistikasi
        switch (order.status) {
          case "new":
            statusStats["Yangi"]++;
            break;
          case "processing":
            statusStats["Jarayonda"]++;
            break;
          case "completed":
            statusStats["Bajarildi"]++;
            break;
          case "cancelled":
            statusStats["Bekor qilindi"]++;
            break;
          default:
            break;
        }
        // Oylik buyurtmalar statistikasi
        if (order.createdAt) {
          const d = new Date(order.createdAt);
          const key = `${d.getFullYear()}-${(d.getMonth() + 1)
            .toString()
            .padStart(2, "0")}`;
          monthlyStats[key] = (monthlyStats[key] || 0) + 1;
        }
      });
      setOrderCount(orders.length);

      // Pie diagram uchun status stats
      const pieData = Object.keys(statusStats).map((key) => ({
        name: key,
        value: statusStats[key],
      }));

      // Area chart uchun oylik
      const barData = Object.entries(monthlyStats).map(([key, value]) => ({
        oy: key,
        buyurtmalar: value,
      }));

      setOrderStats({
        pie: pieData,
        bar: barData,
      });
    });
  };

  useEffect(() => {
    fetchCategoryCount();
    fetchProductCount();
    fetchOrderStats();
    // eslint-disable-next-line
  }, []);

  const CARD_LIST = [
    {
      title: "Kategoriyalar",
      value: categoryCount,
      icon: <FaList size={28} />,
      bg: CARD_GRADIENTS[0],
      iconBg: ICON_BG[0],
    },
    {
      title: "Buyurtmalar",
      value: orderCount,
      icon: <FaShoppingCart size={28} />,
      bg: CARD_GRADIENTS[1],
      iconBg: ICON_BG[1],
    },
    {
      title: "Mahsulotlar",
      value: productCount,
      icon: <FaBox size={28} />,
      bg: CARD_GRADIENTS[2],
      iconBg: ICON_BG[2],
    },
  ];

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-neutral-900 dark:to-neutral-800 transition">
      <h1 className="text-2xl md:text-3xl font-bold mb-8 text-gray-900 dark:text-white text-center">
        Admin <span className="text-blue-600">Dashboard</span>
      </h1>
      {/* Statistic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center mb-10">
        {CARD_LIST.map((card, idx) => (
          <div
            key={card.title}
            className={`relative w-full max-w-xs p-6 rounded-2xl shadow-xl flex flex-col gap-3 bg-gradient-to-br ${card.bg} transition hover:scale-105 cursor-pointer`}
          >
            <div
              className={`absolute right-5 top-5 ${card.iconBg} rounded-full p-3 shadow-md flex items-center justify-center`}
            >
              {card.icon}
            </div>
            <div className="mt-6">
              <div className="uppercase text-xs text-white/80 font-semibold mb-2 tracking-widest">
                {card.title}
              </div>
              <div className="text-white font-extrabold text-4xl tracking-tight drop-shadow">
                {card.value}
              </div>
            </div>
            <div className="absolute inset-0 bg-white/10 pointer-events-none rounded-2xl" />
          </div>
        ))}
      </div>
      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Pie chart */}
        <div className="w-full bg-gradient-to-br from-white via-sky-50 to-blue-100 dark:from-neutral-800 dark:via-neutral-900 dark:to-slate-800 rounded-2xl shadow-lg p-7 border border-blue-100 dark:border-neutral-700 flex flex-col items-center">
          <h2 className="font-bold mb-4 text-sky-800 dark:text-white text-lg text-center">
            Buyurtmalar statusi
          </h2>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStats.pie}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={85}
                  fill="#2563eb"
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {orderStats.pie.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={36} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Area (tog') chart */}
        <div className="w-full bg-gradient-to-br from-white via-green-50 to-emerald-100 dark:from-neutral-800 dark:via-neutral-900 dark:to-slate-800 rounded-2xl shadow-lg p-7 border border-green-100 dark:border-neutral-700 flex flex-col items-center">
          <h2 className="font-bold mb-4 text-emerald-700 dark:text-white text-lg text-center">
            Oylik buyurtmalar soni
          </h2>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={orderStats.bar}
                margin={{ top: 10, right: 20, left: 0, bottom: 25 }}
              >
                <defs>
                  <linearGradient
                    id="colorBuyurtmalar"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#a7f3d0" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="oy" className="text-xs" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="buyurtmalar"
                  stroke="#22c55e"
                  fillOpacity={1}
                  fill="url(#colorBuyurtmalar)"
                  activeDot={{ r: 8 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
