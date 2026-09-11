import { WastePriceItem, DepositRecord, User, WasteCategory, UserRole } from '../types';

/**
 * Robust CSV parser that handles quotes, escaped quotes, commas, and newlines
 */
export function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let current = '';
  let insideQuote = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      row.push(current.trim());
      current = '';
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(current.trim());
      if (row.length > 0 && row.some(cell => cell.length > 0)) {
        lines.push(row);
      }
      row = [];
      current = '';
    } else {
      current += char;
    }
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    if (row.some(cell => cell.length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}

/**
 * Parse PriceConfig CSV from Google Sheet
 * Expected columns: [Code, Category, SubType, CurrentPrice, EffectiveMonth, PointsPerKg]
 */
export function parsePricesFromSheetCSV(csvText: string): WastePriceItem[] {
  const rows = parseCSV(csvText);
  if (rows.length < 2) return [];

  const items: WastePriceItem[] = [];
  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0] || r[0].startsWith('#')) continue;

    const code = r[0].trim();
    const rawCat = (r[1] || '').trim();
    const validCategory: WasteCategory = ['พลาสติก', 'กระดาษ', 'โลหะ', 'แก้ว'].includes(rawCat)
      ? (rawCat as WasteCategory)
      : 'พลาสติก';

    const subType = (r[2] || code).trim();
    // Parse numeric price cleanly
    const cleanPriceStr = (r[3] || '0').replace(/[^0-9.-]/g, '');
    const currentPrice = Math.max(0, parseFloat(cleanPriceStr) || 0);
    const effectiveMonth = (r[4] || 'ก.ย. 2026').trim();

    items.push({
      code,
      category: validCategory,
      subType,
      currentPrice,
      effectiveMonth,
      unit: 'กก.',
      color: validCategory === 'กระดาษ' ? '#3B82F6' : validCategory === 'พลาสติก' ? '#10B981' : validCategory === 'โลหะ' ? '#F59E0B' : '#8B5CF6'
    });
  }

  return items;
}

/**
 * Parse Users CSV from Google Sheet
 * Expected columns: [Code, Name, Department, NationalId, Phone, Email, Role, Password, ...]
 */
export function parseUsersFromSheetCSV(csvText: string): Partial<User>[] {
  const rows = parseCSV(csvText);
  if (rows.length < 2) return [];

  const users: Partial<User>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0] || r[0].startsWith('#')) continue;

    const memberCode = r[0].trim();
    const name = (r[1] || '').trim();
    if (!name) continue;

    const department = (r[2] || 'สำนักปลัด').trim();
    const nationalId = (r[3] || '').replace(/\D/g, '');
    const phone = (r[4] || '').trim();
    const email = (r[5] || `${memberCode.toLowerCase()}@takhli.local`).trim();
    const role: UserRole = (r[6] || 'member').toLowerCase().includes('admin') ? 'admin' : (r[6] || '').toLowerCase().includes('fin') ? 'finance' : 'member';
    const password = (r[7] || 'password123').trim();

    users.push({
      memberCode,
      name,
      department,
      nationalId,
      phone,
      email,
      role,
      password
    });
  }

  return users;
}

/**
 * Parse DepositLedger CSV from Google Sheet
 * Expected columns: [ReceiptNo, Date, MemberCode, MemberName, WasteCode, Category, SubType, Weight, UnitPrice, TotalAmount, RecordedBy, Note]
 */
export function parseDepositsFromSheetCSV(csvText: string): DepositRecord[] {
  const rows = parseCSV(csvText);
  if (rows.length < 2) return [];

  const deposits: DepositRecord[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0] || r[0].startsWith('#')) continue;

    const receiptNumber = r[0].trim();
    const date = (r[1] || '').trim();
    const memberCode = (r[2] || '').trim();
    const memberName = (r[3] || '').trim();
    const wasteCode = (r[4] || '').trim();
    const category = ((r[5] || 'พลาสติก').trim()) as WasteCategory;
    const subType = (r[6] || '').trim();
    const weight = parseFloat((r[7] || '0').replace(/[^0-9.-]/g, '')) || 0;
    const unitPrice = parseFloat((r[8] || '0').replace(/[^0-9.-]/g, '')) || 0;
    const totalAmount = parseFloat((r[9] || '0').replace(/[^0-9.-]/g, '')) || (weight * unitPrice);
    const recordedBy = (r[10] || 'เจ้าหน้าที่').trim();
    const note = (r[11] || '').trim();

    deposits.push({
      id: `dep-${receiptNumber}-${i}`,
      receiptNumber,
      date,
      timestamp: Date.now() - (i * 1000),
      memberCode,
      memberName,
      wasteCode,
      category,
      subType,
      weight,
      weightKg: weight,
      unitPrice,
      totalAmount,
      totalPrice: totalAmount,
      recordedBy,
      note
    });
  }

  return deposits;
}

