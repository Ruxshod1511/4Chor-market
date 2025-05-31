"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { db } from "../utils/Firebase.config";
import { collection, addDoc } from "firebase/firestore";

export default function UploadPage() {
  const [status, setStatus] = useState("");
  const [images, setImages] = useState<{ [key: string]: string }>({});

  // 1. Convert images to base64
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const readerPromises = Array.from(files).map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const name = file.name.replace(/\.[^/.]+$/, "").trim();
          resolve({ name, base64: reader.result as string });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readerPromises).then((results: any[]) => {
      const imageMap: { [key: string]: string } = {};
      results.forEach(({ name, base64 }) => {
        imageMap[name] = base64;
      });
      setImages(imageMap);
      setStatus("✅ Rasm fayllar tayyorlandi!");
    });
  };

  // 2. Read products from Excel
  const handleExcelUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets["Прайс"];

      if (!sheet) {
        setStatus("❌ 'Прайс' varaq topilmadi!");
        return;
      }

      // Read from row 9 (index 8)
      const jsonData = XLSX.utils.sheet_to_json(sheet, {
        defval: "",
        range: 8,
        header: [
          "rowNum",
          "productName",
          "model",
          "shelfLife",
          "package",
          "price",
          "vatCode",
        ],
        raw: false,
      });

      // Format products to match your Firestore structure
      const formatted = jsonData
        .filter(
          (item: any) => item.productName && item.productName.trim() !== ""
        )
        .map((item: any) => {
          const name = item.productName.trim();
          const rawPriceString = String(item.price).replace(/,/g, "."); // vergulni nuqtaga
          const rawPrice = parseFloat(rawPriceString) || 0; // string → float
          const price = Math.round(rawPrice * 1.1); // 10% qo‘shish

          return {
            name,
            category: "Makon Med",
            description: formatDescription(item),
            price,
            amount: 1000,
            like: false,
            model: item.model || "-",
            shelfLife: item.shelfLife || "-",
            package: item.package || "-",
            vatCode: item.vatCode || "-",
          };
        });

      await uploadToFirebase(formatted);
    };

    reader.readAsArrayBuffer(file);
  };

  // Helper function to format description
  const formatDescription = (item: any): string => {
    return `Mahsulot: ${item.productName}\nModel: ${
      item.model || "-"
    }\nYaroqlilik muddati: ${item.shelfLife || "-"}\nQadoqlanish: ${
      item.package || "-"
    }`;
  };

  // Helper function to determine category
  const determineCategory = (productName: string): string => {
    const lowerName = productName.toLowerCase();

    if (lowerName.includes("корректор осанки")) {
      return "Posture Correctors";
    }
    if (lowerName.includes("марла")) {
      return "Medical Gauze";
    }
    if (lowerName.includes("повязка") || lowerName.includes("фиксации")) {
      return "Medical Bandages";
    }
    if (lowerName.includes("гутор") || lowerName.includes("сустава")) {
      return "Joint Supports";
    }
    if (lowerName.includes("детск")) {
      return "Pediatric Products";
    }

    return "Other Medical Products";
  };

  // 3. Upload to Firestore with error handling
  const uploadToFirebase = async (data: any[]) => {
    const colRef = collection(db, "products");
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const item of data) {
      try {
        // Check if required fields exist
        if (!item.name || !item.price) {
          errors.push(
            `❌ Majburiy maydonlar yo'q: ${item.name || "Nomsiz mahsulot"}`
          );
          errorCount++;
          continue;
        }

        await addDoc(colRef, item);
        successCount++;
      } catch (error) {
        console.error("Xatolik:", item, error);
        errors.push(
          `❌ ${item.name}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        errorCount++;
      }
    }

    setStatus(
      `✅ ${successCount} ta mahsulot muvaffaqiyatli yuklandi!\n` +
        (errorCount > 0
          ? `❌ ${errorCount} ta xatolik yuz berdi:\n${errors.join("\n")}`
          : "")
    );
  };

  // 4. UI
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">📥 Mahsulotlarni Yuklash</h1>

      <div className="space-y-4">
        <div>
          <label className="block font-semibold mb-2">
            📸 Rasm fayllar (.jpg/.png):
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">
            📄 Excel fayl (.xlsx):
          </label>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleExcelUpload}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-green-50 file:text-green-700
              hover:file:bg-green-100"
          />
        </div>
      </div>

      {status && (
        <div
          className={`p-4 rounded-md ${
            status.includes("❌")
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {status.split("\n").map((line, i) => (
            <p key={i} className="whitespace-pre-line">
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
