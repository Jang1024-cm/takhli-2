/**
 * ====================================================================
 * โครงการธนาคารขยะดิจิทัล องค์การบริหารส่วนตำบลตาคลี จ.นครสวรรค์
 * รหัสไอดี Google Sheets: 17GTwer_lim6W7z3DO-W4I5u1waDAVZxxwCGiJGu0GDs
 * ====================================================================
 * 📁 ไฟล์ที่ 1: Code.gs (Apps Script Backend Logic)
 * มีฟังก์ชัน initializeSheets() สร้าง 5 แผ่นงานอัตโนมัติ
 * และฟังก์ชัน API รับ-ส่งข้อมูลกับหน้าเว็บ index.html
 * ====================================================================
 */

const SPREADSHEET_ID = "17GTwer_lim6W7z3DO-W4I5u1waDAVZxxwCGiJGu0GDs";
const MINIMUM_BALANCE = 50.00;

/**
 * ฟังก์ชันตรวจสอบและเชื่อมต่อกับ Google Spreadsheet
 * รองรับทั้งกรณี Script ผูกกับแผ่นงานโดยตรง หรือระบุ SPREADSHEET_ID
 */
function getSpreadsheet() {
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}

  try {
    if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "" && SPREADSHEET_ID !== "YOUR_SPREADSHEET_ID_HERE") {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      if (ss) return ss;
    }
  } catch (e) {}

  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * ⭐ 1. ฟังก์ชันสร้าง 5 แผ่นงานอัตโนมัติ (initializeSheets)
 * เลือกฟังก์ชันนี้แล้วกดปุ่ม "เรียกใช้ (Run)" 1 ครั้ง
 * ระบบจะเนรมิตโครงสร้างชีต 5 แผ่นงาน พร้อมรายชื่อพนักงาน 150 คนให้ทันที
 */
function initializeSheets() {
  const ss = getSpreadsheet();
  if (!ss) {
    throw new Error("ไม่สามารถเข้าถึง Google Spreadsheet ได้ กรุณาตรวจสอบสิทธิ์หรือ ID ของชีต");
  }

  // 1. Sheet: PriceConfig (ราคารับซื้อขยะ 4 หมวด)
  const priceSheet = getOrCreateSheet(ss, "PriceConfig", [
    "รหัสขยะ", "หมวดหมู่", "ชนิดขยะย่อย", "ราคาต่อหน่วย_บาท_กก", "วันที่อัปเดต", "ผู้แก้ไขล่าสุด"
  ]);
  if (priceSheet.getLastRow() <= 1) {
    priceSheet.appendRow(["W-P01", "กระดาษ", "กระดาษขาวดำ (A4/เอกสาร)", 4.50, new Date(), "ระบบ"]);
    priceSheet.appendRow(["W-P02", "กระดาษ", "กระดาษลัง/กล่องลูกฟูก", 3.00, new Date(), "ระบบ"]);
    priceSheet.appendRow(["W-PL01", "พลาสติก", "ขวดพลาสติกใส (PET)", 7.00, new Date(), "ระบบ"]);
    priceSheet.appendRow(["W-PL02", "พลาสติก", "พลาสติกขุ่น (HDPE)", 5.50, new Date(), "ระบบ"]);
    priceSheet.appendRow(["W-M01", "โลหะ", "กระป๋องอลูมิเนียม", 35.00, new Date(), "ระบบ"]);
    priceSheet.appendRow(["W-M02", "โลหะ", "เศษเหล็กหนา/เหล็กรวม", 6.00, new Date(), "ระบบ"]);
    priceSheet.appendRow(["W-G01", "แก้ว", "ขวดแก้วใส/ขวดเบียร์รวม", 1.50, new Date(), "ระบบ"]);
  }

  // 2. Sheet: DepositLedger (สมุดบัญชีรับฝากขยะ)
  getOrCreateSheet(ss, "DepositLedger", [
    "เลขที่ใบเสร็จ", "วันเวลา", "รหัสสมาชิก", "ชื่อสมาชิก", "สังกัด_กอง",
    "รหัสขยะ", "หมวดหมู่", "ชนิดขยะ", "น้ำหนัก_กก", "ราคาต่อหน่วย",
    "จำนวนเงิน_บาท", "ผู้บันทึก", "หมายเหตุ"
  ]);

  // 3. Sheet: WithdrawalLedger (ทะเบียนคำขอถอนเงินสด)
  getOrCreateSheet(ss, "WithdrawalLedger", [
    "เลขที่คำขอ", "วันเวลาที่ขอ", "รหัสสมาชิก", "ชื่อสมาชิก", "สังกัด_กอง",
    "จำนวนเงินที่ขอถอน", "ยอดคงเหลือก่อนถอน", "ยอดคงเหลือสุทธิ", "สถานะ",
    "วันเวลาอนุมัติ", "ผู้อนุมัติ_กองคลัง", "หมายเหตุ"
  ]);

  // 4. Sheet: Users (ฐานข้อมูลพนักงาน อบต.ตาคลี 150 คน)
  const usersSheet = getOrCreateSheet(ss, "Users", [
    "รหัสสมาชิก", "ชื่อ_นามสกุล", "สังกัด_กอง_สำนัก", "เลขบัตรประชาชน",
    "เบอร์โทรศัพท์", "อีเมล", "สิทธิ์ในระบบ", "รหัสผ่าน", "วันที่ลงทะเบียน", "สถานะ"
  ]);
  if (usersSheet.getLastRow() <= 1) {
    // 3 บัญชีหลักสำหรับทดสอบระบบ
    usersSheet.appendRow(["ADM01", "นายเฉลิมชัย ชนะพาล (แอดมิน)", "กองสาธารณสุขและสิ่งแวดล้อม", "1600100000011", "056-261-111", "admin@takhli.local", "admin", "password123", new Date(), "ปกติ"]);
    usersSheet.appendRow(["FIN01", "นางสาวสุดารัตน์ การเงิน", "กองคลัง", "1600100000022", "056-261-112", "finance@takhli.local", "finance", "password123", new Date(), "ปกติ"]);
    usersSheet.appendRow(["MB001", "นายสมชาย ใจดี", "สำนักปลัด", "1600100000033", "081-234-5678", "somchai@takhli.local", "member", "password123", new Date(), "ปกติ"]);

    // รายชื่อพนักงาน อบต.ตาคลี 150 คน กระจาย 5 กอง/สำนัก
    const depts = [
      "สำนักปลัด",
      "กองคลัง",
      "กองช่าง",
      "กองสาธารณสุขและสิ่งแวดล้อม",
      "กองการศึกษา ศาสนาและวัฒนธรรม"
    ];
    const firstNames = ["วิชัย", "สมบัติ", "ประสิทธิ์", "ประเสริฐ", "มนัส", "สมพร", "สมศักดิ์", "สุวรรณ", "กฤษดา", "ชำนาญ", "สุรชัย", "บุญมี", "อรุณ", "สายัณห์", "ณรงค์", "กมล", "ธีระ", "นิวัฒน์", "ทรงศักดิ์", "ชูชาติ", "มานพ", "วิเชียร", "อนันต์", "สมเกียรติ", "พิชัย", "สุนทร", "วิโรจน์", "วรพจน์", "ไพโรจน์", "ประจักษ์"];
    const lastNames = ["สุขสมบูรณ์", "คงเจริญ", "ทองดี", "เจริญผล", "มีโชค", "ใจมั่น", "มั่งคั่ง", "วงษ์สุวรรณ", "ศิริผล", "ยอดแก้ว", "สุขใจ", "บุญเกิด", "พุ่มพวง", "เกิดผล", "สุขเกษม", "รัตนพันธ์", "ชำนาญป่า", "จันทร์โอสถ", "มีทรัพย์", "แสงทอง", "บัวหลวง", "พรมมา", "สีใส", "คำแก้ว", "คำแพง", "ชัยชนะ", "จันทร์หอม", "บุญส่ง", "ทรัพย์สิน", "พิทักษ์"];

    const sampleUsers = [];
    for (let i = 2; i <= 150; i++) {
      const code = "MB" + String(i).padStart(3, "0");
      const fName = firstNames[(i - 2) % firstNames.length];
      const lName = lastNames[(i - 2) % lastNames.length];
      const name = (i % 2 === 0 ? "นาย" : "นางสาว") + fName + " " + lName;
      const dept = depts[(i - 2) % depts.length];
      const natId = "16001" + String(10000000 + i).slice(1);
      const phone = "08" + String(10000000 + (i * 739)).slice(1, 9);
      sampleUsers.push([code, name, dept, natId, phone, code.toLowerCase() + "@takhli.local", "member", "password123", new Date(), "ปกติ"]);
    }
    usersSheet.getRange(usersSheet.getLastRow() + 1, 1, sampleUsers.length, 10).setValues(sampleUsers);
  }

  // 5. Sheet: WelfareLedger (กองทุนสวัสดิการฌาปนกิจ)
  const welfareSheet = getOrCreateSheet(ss, "WelfareLedger", [
    "ลำดับ", "วันเวลา", "ประเภทรายการ", "รหัสสมาชิก", "ชื่อสมาชิก",
    "จำนวนเงิน_บาท", "ยอดคงเหลือกองทุน", "ผู้บันทึก", "หมายเหตุ"
  ]);
  if (welfareSheet.getLastRow() <= 1) {
    welfareSheet.appendRow([1, new Date(), "ยอดยกมาเริ่มต้น", "SYSTEM", "กองทุนสวัสดิการ อบต.ตาคลี", 4250.00, 4250.00, "กองคลัง", "กองทุนสมทบเริ่มต้น"]);
  }

  Logger.log("✅ สร้าง 5 แผ่นงานสำเร็จเรียบร้อยแล้ว!");
  return "✅ สร้าง 5 แผ่นงานสำหรับระบบธนาคารขยะดิจิทัล อบต.ตาคลี พร้อมรายชื่อสมาชิก 150 คน สำเร็จเรียบร้อยแล้ว!";
}

/**
 * 2. ฟังก์ชันแสดงหน้าเว็บ Web App (doGet)
 * โหลดไฟล์ index.html สำหรับรัน Web App
 */
function doGet(e) {
  try {
    return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('ระบบธนาคารขยะดิจิทัล องค์การบริหารส่วนตำบลตาคลี')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    try {
      return HtmlService.createHtmlOutputFromFile('index.html')
        .setTitle('ระบบธนาคารขยะดิจิทัล องค์การบริหารส่วนตำบลตาคลี')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    } catch (err2) {
      return HtmlService.createHtmlOutput(
        '<div style="font-family:sans-serif;padding:30px;max-width:600px;margin:40px auto;border:2px solid #ef4444;border-radius:12px;background:#fef2f2;">' +
        '<h2 style="color:#dc2626;margin-top:0;">⚠️ ยังไม่พบไฟล์ index ใน Apps Script</h2>' +
        '<p style="color:#374151;">ใน Apps Script ให้กด <b>+ &gt; HTML</b> ตั้งชื่อว่า <b>index</b> แล้วนำโค้ดจาก index.html ไปวาง</p>' +
        '<p style="color:#6b7280;font-size:12px;">รายละเอียด: ' + err.message + '</p>' +
        '</div>'
      );
    }
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: "No post data" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;

    if (action === "recordDeposit") {
      const res = recordDeposit(postData.data);
      return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === "submitWithdrawal") {
      const res = submitWithdrawal(postData.data);
      return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === "approveWithdrawal") {
      const res = approveWithdrawal(postData.reqNo, postData.isApproved, postData.approvedBy);
      return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === "registerUser") {
      const res = registerUser(postData.data);
      return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === "getInitialData") {
      const res = getInitialData();
      return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Unknown action: " + action }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 4. ฟังก์ชันดึงข้อมูลทั้งหมดสำหรับหน้าเว็บ (getInitialData)
 */
function getInitialData() {
  try {
    const ss = getSpreadsheet();
    if (!ss) {
      return { success: false, error: "Cannot access spreadsheet" };
    }

    // Auto-create sheets if missing
    if (!ss.getSheetByName("PriceConfig") || !ss.getSheetByName("Users")) {
      initializeSheets();
    }

    // 1. ราคารับซื้อ
    const priceSheet = ss.getSheetByName("PriceConfig");
    const prices = [];
    if (priceSheet && priceSheet.getLastRow() > 1) {
      const data = priceSheet.getRange(2, 1, priceSheet.getLastRow() - 1, 4).getValues();
      data.forEach(r => {
        if (r[0]) prices.push({ code: String(r[0]), category: String(r[1] || ""), subType: String(r[2] || ""), price: Number(r[3]) || 0 });
      });
    }

    // 2. สมาชิก 150 คน
    const usersSheet = ss.getSheetByName("Users");
    const users = [];
    if (usersSheet && usersSheet.getLastRow() > 1) {
      const data = usersSheet.getRange(2, 1, usersSheet.getLastRow() - 1, 8).getValues();
      data.forEach(r => {
        if (r[0]) {
          users.push({
            code: String(r[0]),
            name: String(r[1] || ""),
            dept: String(r[2] || ""),
            nationalId: String(r[3] || ""),
            phone: String(r[4] || ""),
            email: String(r[5] || ""),
            role: String(r[6] || "member"),
            password: String(r[7] || "password123")
          });
        }
      });
    }

    // 3. รายการฝากขยะ
    const depSheet = ss.getSheetByName("DepositLedger");
    const deposits = [];
    const memberBalances = {};
    if (depSheet && depSheet.getLastRow() > 1) {
      const data = depSheet.getRange(2, 1, depSheet.getLastRow() - 1, 12).getValues();
      data.forEach(r => {
        if (r[0]) {
          const amt = Number(r[10]) || 0;
          const uCode = String(r[2]);
          let dStr = "";
          if (r[1] instanceof Date) {
            dStr = Utilities.formatDate(r[1], "Asia/Bangkok", "dd/MM/yyyy HH:mm");
          } else {
            dStr = String(r[1] || "");
          }
          deposits.unshift({
            receipt: String(r[0]),
            date: dStr,
            memberCode: uCode,
            name: String(r[3] || ""),
            dept: String(r[4] || ""),
            wasteCode: String(r[5] || ""),
            category: String(r[6] || ""),
            subType: String(r[7] || ""),
            weight: Number(r[8]) || 0,
            unitPrice: Number(r[9]) || 0,
            total: amt,
            recordedBy: String(r[11] || "")
          });
          memberBalances[uCode] = (memberBalances[uCode] || 0) + amt;
        }
      });
    }

    // 4. คำขอถอนเงิน
    const wdrSheet = ss.getSheetByName("WithdrawalLedger");
    const withdrawals = [];
    if (wdrSheet && wdrSheet.getLastRow() > 1) {
      const data = wdrSheet.getRange(2, 1, wdrSheet.getLastRow() - 1, 11).getValues();
      data.forEach(r => {
        if (r[0]) {
          const amt = Number(r[5]) || 0;
          const uCode = String(r[2]);
          const status = String(r[8] || "");
          let dStr = r[1] instanceof Date ? Utilities.formatDate(r[1], "Asia/Bangkok", "dd/MM/yyyy HH:mm") : String(r[1] || "");
          let appStr = r[9] instanceof Date ? Utilities.formatDate(r[9], "Asia/Bangkok", "dd/MM/yyyy HH:mm") : String(r[9] || "");
          withdrawals.unshift({
            reqNo: String(r[0]),
            date: dStr,
            memberCode: uCode,
            name: String(r[3] || ""),
            dept: String(r[4] || ""),
            amount: amt,
            status: status,
            approvedAt: appStr,
            approvedBy: String(r[10] || "")
          });
          if (status === "อนุมัติแล้ว" || status === "จ่ายเงินสดเรียบร้อย") {
            memberBalances[uCode] = (memberBalances[uCode] || 0) - amt;
          }
        }
      });
    }

    // 5. สวัสดิการ
    const welfareSheet = ss.getSheetByName("WelfareLedger");
    let welfareBal = 4250.00;
    if (welfareSheet && welfareSheet.getLastRow() > 1) {
      const lastRowVal = welfareSheet.getRange(welfareSheet.getLastRow(), 7).getValue();
      if (lastRowVal) welfareBal = Number(lastRowVal) || 4250.00;
    }

    return {
      success: true,
      prices: prices,
      users: users,
      deposits: deposits,
      withdrawals: withdrawals,
      memberBalances: memberBalances,
      welfare: { balance: welfareBal }
    };
  } catch(err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * 5. ฟังก์ชันบันทึกการฝากขยะ (recordDeposit)
 */
function recordDeposit(data) {
  try {
    const ss = getSpreadsheet();
    const sheet = getOrCreateSheet(ss, "DepositLedger", [
      "เลขที่ใบเสร็จ", "วันเวลา", "รหัสสมาชิก", "ชื่อสมาชิก", "สังกัด_กอง",
      "รหัสขยะ", "หมวดหมู่", "ชนิดขยะ", "น้ำหนัก_กก", "ราคาต่อหน่วย",
      "จำนวนเงิน_บาท", "ผู้บันทึก", "หมายเหตุ"
    ]);

    const receiptNo = generateReceiptNumber(sheet);
    const date = new Date();
    const dateStr = Utilities.formatDate(date, "Asia/Bangkok", "dd/MM/yyyy HH:mm");
    const weight = Number(data.weight) || 0;
    const unitPrice = Number(data.unitPrice) || 0;
    const total = Math.round(weight * unitPrice * 100) / 100;

    sheet.appendRow([
      receiptNo,
      date,
      data.memberCode,
      data.memberName,
      data.dept || "อบต.ตาคลี",
      data.wasteCode,
      data.category,
      data.subType,
      weight,
      unitPrice,
      total,
      data.recordedBy || "เจ้าหน้าที่",
      data.note || ""
    ]);

    return {
      success: true,
      receiptNumber: receiptNo,
      totalAmount: total,
      date: dateStr
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * 6. ฟังก์ชันส่งคำขอถอนเงินสด (submitWithdrawal)
 */
function submitWithdrawal(data) {
  try {
    const ss = getSpreadsheet();
    const depSheet = ss.getSheetByName("DepositLedger");
    const wdrSheet = getOrCreateSheet(ss, "WithdrawalLedger", [
      "เลขที่คำขอ", "วันเวลาที่ขอ", "รหัสสมาชิก", "ชื่อสมาชิก", "สังกัด_กอง",
      "จำนวนเงินที่ขอถอน", "ยอดคงเหลือก่อนถอน", "ยอดคงเหลือสุทธิ", "สถานะ",
      "วันเวลาอนุมัติ", "ผู้อนุมัติ_กองคลัง", "หมายเหตุ"
    ]);

    const currentBalance = calculateUserBalance(depSheet, wdrSheet, data.memberCode);
    const withdrawAmount = Number(data.amount) || 0;

    if (withdrawAmount <= 0) {
      return { success: false, error: "จำนวนเงินที่ขอถอนต้องมากกว่า 0 บาท" };
    }
    if ((currentBalance - withdrawAmount) < MINIMUM_BALANCE) {
      return {
        success: false,
        error: "ยอดเงินคงเหลือหลังการถอนต้องไม่น้อยกว่า " + MINIMUM_BALANCE.toFixed(2) + " บาท (ยอดคงเหลือปัจจุบัน: " + currentBalance.toFixed(2) + " บาท)"
      };
    }

    const reqNo = "WDR-" + Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyyMMdd") + "-" + String(wdrSheet.getLastRow()).padStart(3, "0");
    const netBalance = Math.round((currentBalance - withdrawAmount) * 100) / 100;

    wdrSheet.appendRow([
      reqNo,
      new Date(),
      data.memberCode,
      data.memberName,
      data.dept || "อบต.ตาคลี",
      withdrawAmount,
      currentBalance,
      netBalance,
      "รออนุมัติกองคลัง",
      "",
      "",
      data.note || "ขอรับเงินสด ณ กองคลัง อบต.ตาคลี"
    ]);

    return {
      success: true,
      reqNo: reqNo,
      currentBalance: currentBalance,
      withdrawAmount: withdrawAmount,
      netBalance: netBalance
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * 7. ฟังก์ชันอนุมัติการถอนเงิน (approveWithdrawal)
 */
function approveWithdrawal(reqNo, isApproved, approvedBy) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName("WithdrawalLedger");
    if (!sheet) return { success: false, error: "ไม่พบแผ่นงาน WithdrawalLedger" };

    const data = sheet.getDataRange().getValues();
    let foundRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(reqNo).trim()) {
        foundRow = i + 1;
        break;
      }
    }

    if (foundRow === -1) {
      return { success: false, error: "ไม่พบคำขอเลขที่: " + reqNo };
    }

    const newStatus = isApproved ? "อนุมัติแล้ว" : "ไม่อนุมัติ";
    sheet.getRange(foundRow, 9).setValue(newStatus);
    sheet.getRange(foundRow, 10).setValue(new Date());
    sheet.getRange(foundRow, 11).setValue(approvedBy || "เจ้าหน้าที่กองคลัง");

    return { success: true, reqNo: reqNo, status: newStatus };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * 8. ฟังก์ชันลงทะเบียนสมาชิกใหม่ (registerUser)
 */
function registerUser(data) {
  try {
    const ss = getSpreadsheet();
    const sheet = getOrCreateSheet(ss, "Users", [
      "รหัสสมาชิก", "ชื่อ_นามสกุล", "สังกัด_กอง_สำนัก", "เลขบัตรประชาชน",
      "เบอร์โทรศัพท์", "อีเมล", "สิทธิ์ในระบบ", "รหัสผ่าน", "วันที่ลงทะเบียน", "สถานะ"
    ]);

    const newRow = sheet.getLastRow();
    const newCode = data.code || ("MB" + String(newRow).padStart(3, "0"));
    sheet.appendRow([
      newCode,
      data.name,
      data.dept,
      data.nationalId || "",
      data.phone || "",
      data.email || (newCode.toLowerCase() + "@takhli.local"),
      data.role || "member",
      data.password || "password123",
      new Date(),
      "ปกติ"
    ]);

    return {
      success: true,
      user: {
        code: newCode,
        name: data.name,
        dept: data.dept,
        role: data.role || "member",
        password: data.password || "password123"
      }
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * 9. ฟังก์ชันอัปเดตราคารับซื้อ (updatePrice)
 */
function updatePrice(data) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName("PriceConfig");
    if (!sheet) return { success: false, error: "ไม่พบแผ่นงาน PriceConfig" };

    const rows = sheet.getDataRange().getValues();
    let updated = false;

    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === String(data.code).trim()) {
        sheet.getRange(i + 1, 4).setValue(Number(data.price) || 0);
        sheet.getRange(i + 1, 5).setValue(new Date());
        sheet.getRange(i + 1, 6).setValue(data.updatedBy || "แอดมิน");
        updated = true;
        break;
      }
    }

    if (!updated) {
      sheet.appendRow([data.code, data.category, data.subType, Number(data.price) || 0, new Date(), data.updatedBy || "แอดมิน"]);
    }

    return { success: true, code: data.code, price: Number(data.price) || 0 };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * ฟังก์ชันผู้ช่วย: ดึงหรือสร้างชีต
 */
function getOrCreateSheet(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#d1fae5");
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

/**
 * ฟังก์ชันผู้ช่วย: สร้างเลขที่ใบเสร็จ RCP-
 */
function generateReceiptNumber(sheet) {
  const dateStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyyMMdd");
  const count = sheet ? Math.max(1, sheet.getLastRow()) : 1;
  return "RCP-" + dateStr + "-" + String(count).padStart(4, "0");
}

/**
 * ฟังก์ชันผู้ช่วย: คำนวณยอดเงินคงเหลือของสมาชิก
 */
function calculateUserBalance(depSheet, wdrSheet, userCode) {
  let totalDeposits = 0;
  let totalWithdrawals = 0;

  if (depSheet && depSheet.getLastRow() > 1) {
    const depData = depSheet.getRange(2, 1, depSheet.getLastRow() - 1, 11).getValues();
    depData.forEach(r => {
      if (String(r[2]).trim() === String(userCode).trim()) {
        totalDeposits += Number(r[10]) || 0;
      }
    });
  }

  if (wdrSheet && wdrSheet.getLastRow() > 1) {
    const wdrData = wdrSheet.getRange(2, 1, wdrSheet.getLastRow() - 1, 9).getValues();
    wdrData.forEach(r => {
      if (String(r[2]).trim() === String(userCode).trim() && (r[8] === "อนุมัติแล้ว" || r[8] === "จ่ายเงินสดเรียบร้อย")) {
        totalWithdrawals += Number(r[5]) || 0;
      }
    });
  }

  return Math.round((totalDeposits - totalWithdrawals) * 100) / 100;
}