import { clerkClient } from "@clerk/clerk-sdk-node";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { status } = await request.json();
    const user = await clerkClient.users.updateUser(params.userId, {
      publicMetadata: { status },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Foydalanuvchi statusini o'zgartirishda xatolik:", error);
    return NextResponse.json(
      { error: "Foydalanuvchi statusini o'zgartirishda xatolik" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    await clerkClient.users.deleteUser(params.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Foydalanuvchini o'chirishda xatolik:", error);
    return NextResponse.json(
      { error: "Foydalanuvchini o'chirishda xatolik" },
      { status: 500 }
    );
  }
} 