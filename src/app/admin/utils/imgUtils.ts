import imageCompression from "browser-image-compression";

/**
 * Resizes and compresses an image file to reduce its size.
 *
 * @param file - The image file to be compressed.
 * @param maxSizeMB - The maximum size in MB for the compressed file (default: 1MB).
 * @param maxWidthOrHeight - The maximum width or height of the image (default: 1024px).
 * @returns A Promise that resolves to the Base64 string of the compressed image.
 */
export const resizeImage = async (
  file: File,
  maxSizeMB: number = 1,
  maxWidthOrHeight: number = 1024
): Promise<string> => {
  try {
    // Compression options
    const options = {
      maxSizeMB, // Target size in MB
      maxWidthOrHeight, // Maximum dimension of the image
      useWebWorker: true, // Use WebWorker for performance
    };

    // Compress the image
    const compressedFile = await imageCompression(file, options);

    // Convert compressed image to Base64
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onloadend = () => {
        if (reader.result) {
          resolve(reader.result as string);
        } else {
          reject(new Error("Failed to convert the image to Base64 format"));
        }
      };
      reader.readAsDataURL(compressedFile);
    });
  } catch (error) {
    console.error("Error compressing image:", error);
    throw new Error("Image compression failed");
  }
};
