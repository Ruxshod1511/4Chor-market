import { NextResponse } from "next/server";
import { ref, push, serverTimestamp } from "firebase/database";
import { database } from "../../admin/utils/Firebase.config";

export async function POST(request: Request) {
  try {
    const orderData = await request.json();

    const ordersRef = ref(database, 'orders');
    const newOrderRef = push(ordersRef, {
      ...orderData,
      status: "new",
      createdAt: serverTimestamp(),
      orderNumber: Date.now(),
      items: orderData.items.map((item: any) => ({
        ...item,
        totalItemPrice: item.price * item.quantity
      })),
      customerInfo: {
        ...orderData.customerInfo,
        phone: orderData.customerInfo.phone.startsWith('+') 
          ? orderData.customerInfo.phone 
          : `+${orderData.customerInfo.phone}`
      }
    });

    return NextResponse.json({ 
      success: true, 
      orderId: newOrderRef.key,
      message: "Buyurtma muvaffaqiyatli qabul qilindi"
    });
  } catch (error) {
    console.error("Buyurtmani saqlashda xatolik:", error);
    return NextResponse.json(
      { error: "Buyurtmani saqlashda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}