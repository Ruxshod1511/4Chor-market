import React, { useState } from "react";
import { YMaps, Map, Placemark } from "@pbe/react-yandex-maps";
import {
  FiSearch,
  FiMapPin,
  FiCrosshair,
  FiZoomIn,
  FiZoomOut,
} from "react-icons/fi";

interface YandexMapModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (coords: [number, number]) => void;
  defaultCoords?: [number, number];
}

const YandexMapModal: React.FC<YandexMapModalProps> = ({
  open,
  onClose,
  onSelect,
  defaultCoords = [41.311151, 69.279737], // Tashkent
}) => {
  const [coords, setCoords] = useState<[number, number]>(defaultCoords);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [zoom, setZoom] = useState(12);
  const [showIcon, setShowIcon] = useState(false);

  // Map click - marker
  const handleMapClick = (e: any) => {
    const newCoords = e.get("coords");
    setCoords(newCoords);
    setShowIcon(true);
    setTimeout(() => setShowIcon(false), 1500);
  };

  // Qidiruv (adres yoki kordinata)
  const handleSearch = async () => {
    if (!search.trim()) return;
    // Koordinata (masalan: "41.3,69.2")
    const coordsRegex = /^\s*(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)\s*$/;
    if (coordsRegex.test(search.trim())) {
      const arr = search.split(",").map((x) => parseFloat(x.trim()));
      setCoords([arr[0], arr[1]]);
      mapInstance &&
        mapInstance.setCenter([arr[0], arr[1]], zoom, { duration: 400 });
      setShowIcon(true);
      setTimeout(() => setShowIcon(false), 1500);
    } else {
      // Matnli qidiruv
      if (window.ymaps) {
        window.ymaps.geocode(search).then(function (res: any) {
          const firstGeoObject = res.geoObjects.get(0);
          if (firstGeoObject) {
            const pos = firstGeoObject.geometry.getCoordinates();
            setCoords(pos);
            mapInstance && mapInstance.setCenter(pos, zoom, { duration: 400 });
            setShowIcon(true);
            setTimeout(() => setShowIcon(false), 1500);
          } else {
            alert("Manzil topilmadi.");
          }
        });
      }
    }
  };

  // Input Enter bosilsa qidirish
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // O‘zini joyini topish (Geolokatsiya)
  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Brauzer geolokatsiyani qo‘llab-quvvatlamaydi!");
      return;
    }
    setLoadingGeo(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords([lat, lng]);
        mapInstance && mapInstance.setCenter([lat, lng], 16, { duration: 400 });
        setShowIcon(true);
        setTimeout(() => setShowIcon(false), 1500);
        setLoadingGeo(false);
      },
      (err) => {
        alert("Joylashuvni aniqlab bo‘lmadi!");
        setLoadingGeo(false);
      }
    );
  };

  // Zoom in/out
  const handleZoom = (dir: "in" | "out") => {
    const newZoom =
      dir === "in" ? Math.min(zoom + 1, 18) : Math.max(zoom - 1, 3);
    setZoom(newZoom);
    mapInstance && mapInstance.setZoom(newZoom, { duration: 300 });
  };

  // Modal ko‘rinmasin, open false bo‘lsa
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg flex flex-col items-center relative">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-500 hover:text-red-600 text-2xl"
        >
          &times;
        </button>
        <h3 className="mb-3 text-lg font-bold text-gray-800">
          Lokatsiyani xaritadan tanlang
        </h3>
        {/* Qidiruv va My Location */}
        <div className="w-full flex items-center gap-2 mb-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleInputKeyDown}
            className="flex-1 p-2 border rounded text-sm"
            placeholder="Manzil yoki '41.3, 69.2'"
          />
          <button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded flex items-center"
            onClick={handleSearch}
            title="Qidirish"
          >
            <FiSearch />
          </button>
          <button
            type="button"
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded flex items-center"
            onClick={handleMyLocation}
            disabled={loadingGeo}
            title="Mening joyim"
          >
            <FiCrosshair />
            {loadingGeo && (
              <span className="ml-1 animate-pulse text-xs">...</span>
            )}
          </button>
        </div>

        {/* Map controls (Zoom) */}
        <div className="flex w-full justify-end mb-1 gap-1">
          <button
            onClick={() => handleZoom("in")}
            className="p-2 rounded bg-gray-200 hover:bg-gray-300 transition"
            title="Kattalashtirish"
          >
            <FiZoomIn />
          </button>
          <button
            onClick={() => handleZoom("out")}
            className="p-2 rounded bg-gray-200 hover:bg-gray-300 transition"
            title="Kichiklashtirish"
          >
            <FiZoomOut />
          </button>
        </div>

        {/* Yandex Map */}
        <div className="w-full rounded-lg overflow-hidden mb-4 border shadow relative">
          <YMaps>
            <Map
              defaultState={{
                center: coords,
                zoom: zoom,
              }}
              state={{
                center: coords,
                zoom: zoom,
              }}
              width="100%"
              height="300px"
              onClick={handleMapClick}
              instanceRef={(ref: any) => {
                if (ref && ref !== mapInstance) setMapInstance(ref);
              }}
            >
              <Placemark
                geometry={coords}
                // Custom marker options
                options={{
                  iconLayout: "default#image",
                  iconImageHref:
                    "https://cdn-icons-png.flaticon.com/512/684/684908.png",
                  iconImageSize: [36, 36],
                  iconImageOffset: [-18, -36],
                }}
                // label yoki icon uchun balloon ochmasligi uchun
                properties={{
                  balloonContent: "",
                }}
              />
            </Map>
            {/* Marker tanlanganda chiqadigan label/icon (animated) */}
            {showIcon && (
              <div className="absolute left-1/2 top-[110px] -translate-x-1/2 z-20 flex flex-col items-center animate-bounce pointer-events-none">
                <FiMapPin className="text-4xl text-blue-600 drop-shadow" />
                <span className="text-xs mt-1 bg-blue-50 px-2 py-0.5 rounded text-blue-800 font-bold shadow">
                  Tanlandi!
                </span>
              </div>
            )}
          </YMaps>
        </div>

        {/* Koordinata chiqarish */}
        <div className="w-full flex flex-col gap-2 mb-3">
          <span className="text-sm text-gray-600 text-center">
            Tanlangan joy:{" "}
            <b>
              {coords[0].toFixed(6)}, {coords[1].toFixed(6)}
            </b>
          </span>
        </div>
        <div className="flex gap-3 w-full">
          <button
            className="flex-1 px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-800"
            onClick={onClose}
          >
            Bekor qilish
          </button>
          <button
            className="flex-1 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            onClick={() => {
              onSelect(coords);
              onClose();
            }}
          >
            Saqlash
          </button>
        </div>
      </div>
    </div>
  );
};

export default YandexMapModal;
