import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function PortfolioPromoBanner() {
  const [show, setShow] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const hideTimeout = useRef<NodeJS.Timeout | null>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  // Auto-hide banner after scroll or inactivity
  useEffect(() => {
    const handleScroll = () => {
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
      }

      hideTimeout.current = setTimeout(() => {
        setIsVisible(false);
        // Wait for animation to complete before removing from DOM
        setTimeout(() => setShow(false), 300);
      }, 2000);
    };

    if (show) {
      window.addEventListener("scroll", handleScroll);
      // Also hide after 15 seconds of inactivity
      hideTimeout.current = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => setShow(false), 300);
      }, 15000);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
      }
    };
  }, [show]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setShow(false), 300);
  };

  if (!show) return null;

  return (
    <div
      ref={bannerRef}
      className={` top-0 left-0 w-full z-50 flex justify-center bg-gradient-to-r from-sky-900 to-blue-900 transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      <div className="relative w-full max-w-screen-xl text-white py-2 px-4 sm:py-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
          <span className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-yellow-300 font-bold text-sm md:text-base">
              <span className="text-lg">👨‍💻</span> Portfolio
            </span>
            <a
              href="https://ruxshod.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm sm:text-base md:text-lg underline hover:text-yellow-400 transition-colors font-medium whitespace-nowrap"
            >
              Mening loyihalarim ko'rgazmasi{" "}
            </a>
          </span>
          <span className="hidden sm:block text-xs text-blue-200">
            Mening so'nggi ishimni va amaliy tadqiqotlarimni tekshiring
          </span>
        </div>

        <button
          onClick={handleClose}
          className="absolute right-2 sm:static p-1 rounded-full hover:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Close banner"
        >
          <X size={18} className="text-blue-100 hover:text-white" />
        </button>
      </div>
    </div>
  );
}
