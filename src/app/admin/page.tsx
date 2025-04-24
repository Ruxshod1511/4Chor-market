"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const AdminPage = () => {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    const adminEmail = "ruxshodinte@gmail.com";
    if (user?.primaryEmailAddress?.emailAddress === adminEmail) {
      router.push("/admin")
    }
    else{
      router.push("/")
    }
    
   
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gray-900 p-6 flex items-center justify-center">
      <h1 className="text-5xl text-white">Hi admin 👋</h1>
    </div>
  );
};

export default AdminPage;
