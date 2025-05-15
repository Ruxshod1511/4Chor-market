"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function Exit() {
  const [showModal, setShowModal] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!confirmed) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    const handlePopState = () => {
      if (!confirmed) {
        setShowModal(true);
        window.history.pushState(null, "", window.location.href);
      }
    };

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [confirmed]);

  const chiqishgaRuxsatBer = () => {
    setConfirmed(true);
    setShowModal(false);
    window.history.back();
  };

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Saytdan chiqmoqchimisiz?
            </h2>
            <p className="text-gray-600 mb-6">
              Jarayondagi maʼlumotlar saqlanmasligi mumkin.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Yo‘q
              </button>
              <button
                onClick={chiqishgaRuxsatBer}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Ha, chiqaman
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
