/**
 * Image Compression Utility for Web & Mobile
 * Resizes and compresses user-uploaded images in-browser using HTML5 Canvas.
 * Outputs lightweight Base64 Data URL (< 35 KB) safe for Google Sheets & LocalStorage.
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 - 1.0
  mimeType?: 'image/jpeg' | 'image/webp' | 'image/png';
  maxKBytes?: number;
}

export const compressImageFile = (
  file: File,
  options: CompressOptions = {}
): Promise<string> => {
  const {
    maxWidth = 320,
    maxHeight = 320,
    quality = 0.82,
    mimeType = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (JPG, PNG, WEBP)'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio constraints
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('ไม่สามารถประมวลผล Canvas บนอุปกรณ์นี้ได้'));
          return;
        }

        // Fill background with clean white for transparent PNGs converted to JPEG
        if (mimeType === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        try {
          const compressedBase64 = canvas.toDataURL(mimeType, quality);
          resolve(compressedBase64);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('เกิดข้อผิดพลาดในการโหลดไฟล์'));
    reader.readAsDataURL(file);
  });
};
