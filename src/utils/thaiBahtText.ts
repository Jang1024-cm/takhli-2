/**
 * Thai Baht Text conversion utility for official receipts and vouchers
 * Example: 150.00 -> "หนึ่งร้อยห้าสิบบาทถ้วน"
 */

const THAI_NUMBERS = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
const THAI_UNITS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

function convertIntegerPart(numStr: string): string {
  let result = '';
  const len = numStr.length;

  for (let i = 0; i < len; i++) {
    const digit = parseInt(numStr.charAt(i), 10);
    const pos = len - i - 1;

    if (digit !== 0) {
      if (pos === 0 && digit === 1 && len > 1) {
        result += 'เอ็ด';
      } else if (pos === 1 && digit === 2) {
        result += 'ยี่';
      } else if (pos === 1 && digit === 1) {
        result += '';
      } else {
        result += THAI_NUMBERS[digit];
      }
      result += THAI_UNITS[pos];
    }
  }

  return result || 'ศูนย์';
}

export function thaiBahtText(num: number): string {
  if (isNaN(num)) return '';
  if (num === 0) return 'ศูนย์บาทถ้วน';

  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const fixed = absNum.toFixed(2);
  const [intPart, decPart] = fixed.split('.');

  let text = '';

  // Process millions if large
  if (intPart.length > 6) {
    const millions = intPart.substring(0, intPart.length - 6);
    const remainder = intPart.substring(intPart.length - 6);
    text += convertIntegerPart(millions) + 'ล้าน' + convertIntegerPart(remainder);
  } else {
    text += convertIntegerPart(intPart);
  }

  text += 'บาท';

  const satang = parseInt(decPart, 10);
  if (satang === 0) {
    text += 'ถ้วน';
  } else {
    text += convertIntegerPart(decPart) + 'สตางค์';
  }

  return (isNegative ? 'ลบ' : '') + text;
}
