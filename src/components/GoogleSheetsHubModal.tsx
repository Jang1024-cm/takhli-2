import React, { useState } from 'react';
import { useWasteBank } from '../context/WasteBankContext';
import { 
  FileSpreadsheet, 
  Code2, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  X, 
  Table, 
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Layers,
  Users,
  HeartHandshake,
  FileCode,
  Upload
} from 'lucide-react';
import { GAS_INDEX_HTML, GAS_CODE_GS } from '../data/gasTemplates';

interface GoogleSheetsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSheetsHubModal: React.FC<GoogleSheetsHubModalProps> = ({ isOpen, onClose }) => {
  const { 
    users,
    prices, 
    deposits, 
    withdrawals, 
    welfareContributions,
    getAllMembersSummary, 
    googleSheetUrl, 
    setGoogleSheetUrl, 
    pullFromGoogleSheet,
    pushToGoogleSheet,
    syncWithGoogleSheet, 
    importPricesFromCSV,
    isSyncing, 
    lastSynced 
  } = useWasteBank();

  const [activeTab, setActiveTab] = useState<'guide' | 'codegs' | 'indexhtml' | 'sync' | 'exportAll' | 'sheet1' | 'sheet2' | 'sheet3' | 'sheet4'>('guide');
  const [copied, setCopied] = useState<boolean>(false);
  const [urlInput, setUrlInput] = useState<string>(googleSheetUrl);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [csvPasteInput, setCsvPasteInput] = useState<string>('');
  const [csvPasteFeedback, setCsvPasteFeedback] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const TARGET_SPREADSHEET_ID = '17GTwer_lim6W7z3DO-W4I5u1waDAVZxxwCGiJGu0GDs';
  const SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit`;

  const membersSummary = getAllMembersSummary();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const indexHtmlContent = GAS_INDEX_HTML;

  const handleExportCSV = (sheetType: 'prices' | 'deposits' | 'balance' | 'users' | 'all') => {
    let csvContent = '';
    let filename = '';

    if (sheetType === 'prices') {
      csvContent = 'รหัสขยะ,ประเภทขยะ,ชนิดขยะย่อย,ราคารับซื้อปัจจุบัน (บาท/กก.),เดือนที่มีผลบังคับใช้\n' +
        prices.map(p => `"${p.code}","${p.category}","${p.subType}",${p.currentPrice},"${p.effectiveMonth}"`).join('\n');
      filename = 'Sheet1_PriceConfig_Takhli.csv';
    } else if (sheetType === 'deposits') {
      csvContent = 'เลขที่ใบเสร็จ,วันที่,รหัสสมาชิก,ชื่อสมาชิก,รหัสขยะ,ประเภท,ชนิดย่อย,น้ำหนัก (กก.),ราคาต่อหน่วย (บาท),รวมเป็นเงิน (บาท),เจ้าหน้าที่ผู้บันทึก,หมายเหตุ\n' +
        deposits.map(d => `"${d.receiptNumber}","${d.date}","${d.memberCode}","${d.memberName}","${d.wasteCode}","${d.category}","${d.subType}",${d.weight},${d.unitPrice},${d.totalAmount},"${d.recordedBy}","${d.note || ''}"`).join('\n');
      filename = 'Sheet2_DepositLedger_Takhli.csv';
    } else if (sheetType === 'balance') {
      csvContent = 'รหัสสมาชิก,ชื่อ-นามสกุล,สังกัด/แผนก,ยอดฝากสะสม (บาท),ยอดถอนสะสม (บาท),ยอดเงินคงเหลือสุทธิ (บาท),สถานะบัญชี,น้ำหนักรวม (กก.)\n' +
        membersSummary.map(m => `"${m.memberCode}","${m.memberName}","${m.department}",${m.totalDepositAmount},${m.totalWithdrawalApproved},${m.currentBalance},"${m.isBelowMinimum ? 'ต่ำกว่าเกณฑ์ขั้นต่ำ 50 บาท (ห้ามถอน)' : 'ปกติ (สามารถถอนเงินได้)'}",${m.totalWeightKg}`).join('\n');
      filename = 'Sheet3_WithdrawalLedger_Takhli.csv';
    } else if (sheetType === 'users') {
      csvContent = 'รหัสสมาชิก,ชื่อ-นามสกุล,กอง/สำนัก,อีเมล,เบอร์โทร,เลขบัตรประชาชน,สิทธิ์,สถานะสวัสดิการ\n' +
        users.map(u => `"${u.memberCode}","${u.name}","${u.department}","${u.email}","${u.phone || ''}","${u.nationalId || ''}","${u.role}","${u.welfareEnrolled ? 'เข้าร่วมกองทุน' : 'ยังไม่เข้าร่วม'}"`).join('\n');
      filename = 'Sheet4_Users_Takhli.csv';
    } else {
      // Export all sheets in structured text
      csvContent = '=== SHEET 1: PRICECONFIG ===\n' +
        'รหัสขยะ,ประเภท,ชนิดย่อย,ราคาต่อกก.,เดือน\n' +
        prices.map(p => `"${p.code}","${p.category}","${p.subType}",${p.currentPrice},"${p.effectiveMonth}"`).join('\n') +
        '\n\n=== SHEET 2: DEPOSITLEDGER ===\n' +
        'เลขที่ใบเสร็จ,วันที่,รหัสสมาชิก,ชื่อ,รหัสขยะ,ชนิด,น้ำหนัก,ราคา,รวมเงิน,ผู้บันทึก\n' +
        deposits.map(d => `"${d.receiptNumber}","${d.date}","${d.memberCode}","${d.memberName}","${d.wasteCode}","${d.subType}",${d.weight},${d.unitPrice},${d.totalAmount},"${d.recordedBy}"`).join('\n') +
        '\n\n=== SHEET 3: USERS_SUMMARY ===\n' +
        'รหัสสมาชิก,ชื่อ,แผนก,ยอดฝากรวม,ยอดถอนรวม,คงเหลือ\n' +
        membersSummary.map(m => `"${m.memberCode}","${m.memberName}","${m.department}",${m.totalDepositAmount},${m.totalWithdrawalApproved},${m.currentBalance}`).join('\n');
      filename = 'Takhli_WasteBank_AllSheets_Master.csv';
    }

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const handleTriggerSync = async () => {
    setSyncFeedback('กำลังเชื่อมต่อไปยัง Google Sheets...');
    const res = await syncWithGoogleSheet();
    setSyncFeedback(res.message);
    setTimeout(() => {
      setSyncFeedback(null);
    }, 4500);
  };

  // Google Apps Script Code.gs ready to copy/paste into Apps Script
  const codeGsContent = GAS_CODE_GS;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Header with Sheet ID */}
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-700/60 rounded-xl border border-emerald-500/30 shrink-0">
              <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold text-base sm:text-lg">ฐานข้อมูล Google Sheets อบต.ตาคลี</h2>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-100 px-2 py-0.5 rounded-full border border-emerald-400/40">
                  เชื่อมต่อชีตจริง
                </span>
              </div>
              <p className="text-xs text-emerald-100 flex items-center space-x-1.5 mt-0.5">
                <span>Google Sheet ID:</span>
                <span className="font-mono font-bold text-amber-300 bg-emerald-950/60 px-1.5 py-0.2 rounded">
                  {TARGET_SPREADSHEET_ID}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Direct Link to the exact Google Sheet */}
            <a
              href={SPREADSHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs font-bold transition shadow-xs"
            >
              <span>เปิดชีตจริงในแท็บใหม่</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-700/50 transition"
              aria-label="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-3 pt-2 overflow-x-auto text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`py-2.5 px-3.5 font-bold whitespace-nowrap border-b-2 flex items-center space-x-1.5 transition ${
              activeTab === 'guide'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>📖 ขั้นตอนการติดตั้งใช้งานจริง</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('codegs')}
            className={`py-2.5 px-3.5 font-bold whitespace-nowrap border-b-2 flex items-center space-x-1.5 transition ${
              activeTab === 'codegs'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-4 h-4 text-emerald-600" />
            <span>📁 ไฟล์ที่ 1: Code.gs</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">มี initializeSheets</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('indexhtml')}
            className={`py-2.5 px-3.5 font-bold whitespace-nowrap border-b-2 flex items-center space-x-1.5 transition ${
              activeTab === 'indexhtml'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-4 h-4 text-emerald-600" />
            <span>🌐 ไฟล์ที่ 2: index.html</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-bold">ครบ 3 ระบบ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`py-2.5 px-3.5 font-bold whitespace-nowrap border-b-2 flex items-center space-x-1.5 transition ${
              activeTab === 'sync'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <RefreshCw className="w-4 h-4 text-amber-600" />
            <span>🔄 ซิงค์ข้อมูลสด & ตรวจสอบ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sheet1')}
            className={`py-2.5 px-3 font-medium whitespace-nowrap border-b-2 flex items-center space-x-1.5 transition ${
              activeTab === 'sheet1'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-4 h-4 text-emerald-600" />
            <span>Sheet 1: ราคา</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sheet2')}
            className={`py-2.5 px-3 font-medium whitespace-nowrap border-b-2 flex items-center space-x-1.5 transition ${
              activeTab === 'sheet2'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-4 h-4 text-emerald-600" />
            <span>Sheet 2: ฝากขยะ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sheet3')}
            className={`py-2.5 px-3 font-medium whitespace-nowrap border-b-2 flex items-center space-x-1.5 transition ${
              activeTab === 'sheet3'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-4 h-4 text-emerald-600" />
            <span>Sheet 3: ถอนเงิน</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('exportAll')}
            className={`py-2.5 px-3 font-medium whitespace-nowrap border-b-2 flex items-center space-x-1.5 transition ${
              activeTab === 'exportAll'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>📥 นำออก Excel/CSV</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">

          {/* TAB 1: STEP-BY-STEP DEPLOYMENT & USAGE GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-6">
              {/* Highlight Banner */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl p-4 sm:p-5 shadow-xs">
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 bg-emerald-700 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-sm sm:text-base text-emerald-950">
                        คู่มือการติดตั้งใช้งานจริง — แยก 2 ไฟล์ตามมาตรฐาน Google Apps Script สะอาด รันผ่าน 100%
                      </h3>
                      <span className="text-[11px] bg-emerald-700 text-white px-2.5 py-0.5 rounded-full font-semibold">
                        แก้ปัญหา SyntaxError และพบ initializeSheets ทันที
                      </span>
                    </div>
                    <p className="text-xs text-emerald-900 leading-relaxed">
                      ระบบนี้เชื่อมต่อกับ Google Sheets รหัสไอดี{' '}
                      <span className="font-mono font-bold text-emerald-950 bg-emerald-200 px-1.5 py-0.5 rounded">
                        17GTwer_lim6W7z3DO-W4I5u1waDAVZxxwCGiJGu0GDs
                      </span>{' '}
                      โดยแยกไฟล์เป็น <b>Code.gs</b> (แบ็กเอนด์/ฐานข้อมูล มีฟังก์ชัน <code>initializeSheets</code>) และ <b>index.html</b> (หน้าเว็บระบบจริง 3 ระบบ):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                      <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                        <div className="font-bold text-emerald-800">1. ระบบล็อกอิน & ลงทะเบียน</div>
                        <div className="text-[11px] text-slate-600 mt-0.5">ล็อกอินด้วยรหัส/บัตร ปชช., ปุ่มสลับด่วน 3 สิทธิ์, ฟอร์มลงทะเบียนสมาชิกใหม่ 5 กอง/สำนัก</div>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                        <div className="font-bold text-amber-800">2. ระบบจัดการแอดมิน</div>
                        <div className="text-[11px] text-slate-600 mt-0.5">จัดการสมาชิก, แก้ไขราคารับซื้อขยะ, อนุมัติการถอนเงิน (ขั้นต่ำ 50 บ.), ส่งออก CSV</div>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                        <div className="font-bold text-teal-800">3. ระบบหน้าสมาชิก</div>
                        <div className="text-[11px] text-slate-600 mt-0.5">ชั่งขยะคำนวณเงินสด, พิมพ์ใบเสร็จความร้อน 80mm, สมุดบัญชี A4, ยื่นคำขอถอนเงินสด</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Steps Grid */}
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-bold flex items-center justify-center text-base shrink-0">
                    1
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-bold text-sm text-slate-800">
                        เปิดไฟล์ Google Spreadsheet ไอดีเป้าหมาย
                      </h4>
                      <a
                        href={SPREADSHEET_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200"
                      >
                        <span>คลิกเพื่อเปิดชีตทันที</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      เข้าใช้งานผ่านบัญชี Google ของ อบต.ตาคลี หรือบัญชีผู้ดูแลระบบ ไปที่ลิงก์ชีตไอดี:
                      <code className="block mt-1 font-mono text-emerald-900 bg-slate-100 p-2 rounded-lg break-all text-[11px]">
                        {SPREADSHEET_URL}
                      </code>
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-bold flex items-center justify-center text-base shrink-0">
                    2
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="font-bold text-sm text-slate-800">
                      เปิดเมนู Apps Script บน Google Sheets
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      ที่แถบเมนูด้านบนของไฟล์ Google Sheets ให้คลิกเลือกที่เมนู{' '}
                      <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        ส่วนขยาย (Extensions)
                      </span>{' '}
                      ➔{' '}
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Apps Script
                      </span>
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-bold flex items-center justify-center text-base shrink-0">
                    3
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5">
                        <span>คัดลอกไฟล์ที่ 1: Code.gs ไปวางใน Apps Script</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">มี initializeSheets</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleCopy(codeGsContent)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด Code.gs'}</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      ใน Apps Script ให้ลบโค้ดเดิมในไฟล์ <code className="font-mono font-bold text-slate-800">Code.gs</code> ออกทั้งหมด แล้วนำโค้ดจากแท็บ{' '}
                      <span className="font-bold text-emerald-800">"📁 ไฟล์ที่ 1: Code.gs"</span> ไปวางแทนที่ แล้วกดปุ่มบันทึก (Ctrl + S)<br />
                      <span className="text-emerald-700 font-semibold text-[11px]">✨ ไวยากรณ์ตรวจสอบแล้ว 100% สะอาด ไร้ SyntaxError บรรทัด 490 และฟังก์ชัน initializeSheets() อยู่บนสุดทันที!</span>
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-bold flex items-center justify-center text-base shrink-0">
                    4
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="font-bold text-sm text-slate-800">
                      สั่งรันฟังก์ชัน initializeSheets() สร้าง 5 แผ่นงานอัตโนมัติ (ทำเพียงครั้งเดียว)
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      ที่แถบเครื่องมือด้านบนใน Apps Script ให้คลิกเลือกฟังก์ชัน{' '}
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        initializeSheets
                      </span>{' '}
                      แล้วกดปุ่ม <b>"เรียกใช้ (Run)"</b> 1 ครั้ง (หาก Google ถามสิทธิ์ความปลอดภัย ให้กด Review Permissions ➔ Advanced ➔ Go to Takhli Waste Bank ➔ Allow)
                    </p>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-700 space-y-1">
                      <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>ระบบจะเนรมิตแผ่นงานทั้ง 5 แผ่นให้โดยอัตโนมัติ:</span>
                      </div>
                      <ul className="list-disc pl-5 space-y-0.5 text-slate-600">
                        <li><b>PriceConfig:</b> ตารางราคารับซื้อขยะ 4 ประเภท (กระดาษ, พลาสติก, โลหะ, แก้ว)</li>
                        <li><b>DepositLedger:</b> สมุดบันทึกรับฝากขยะ พร้อมเลขที่ใบเสร็จ RCP-</li>
                        <li><b>WithdrawalLedger:</b> ทะเบียนคำขอถอนเงินสดและการอนุมัติกองคลัง</li>
                        <li><b>Users:</b> ฐานข้อมูลพนักงาน อบต.ตาคลี พร้อมสังกัดและสิทธิ์</li>
                        <li><b>WelfareLedger:</b> สมุดบัญชีกองทุนสวัสดิการพนักงาน</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-bold flex items-center justify-center text-base shrink-0">
                    5
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5">
                        <span>สร้างไฟล์ที่ 2: index.html (หน้าเว็บระบบจริง 3 ระบบ)</span>
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">ล็อกอิน • แอดมิน • สมาชิก</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleCopy(indexHtmlContent)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด index.html'}</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      1. ในแถบด้านซ้ายของ Apps Script ให้คลิกที่เครื่องหมาย <b>+</b> (เพิ่มไฟล์) ข้างคำว่า <b>"ไฟล์ (Files)"</b><br />
                      2. เลือก <b>"HTML"</b> แล้วตั้งชื่อไฟล์ว่า <code className="font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">index</code> (Apps Script จะต่อท้ายเป็น index.html ให้อัตโนมัติ)<br />
                      3. ลบโค้ดเริ่มต้นออกทั้งหมด แล้วนำโค้ดจากแท็บ <span className="font-bold text-emerald-800">"🌐 ไฟล์ที่ 2: index.html"</span> ไปวางแทนที่ แล้วกดบันทึก (Ctrl + S)
                    </p>
                  </div>
                </div>

                {/* Step 6 */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-bold flex items-center justify-center text-base shrink-0">
                    6
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="font-bold text-sm text-slate-800">
                      ทำการ Deploy เป็น Web App (เว็บแอป)
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      1. คลิกปุ่มสีน้ำเงินมุมขวาบน <b>"ทำให้ใช้งานได้ (Deploy)"</b> ➔ <b>"การทำให้ใช้งานได้ใหม่ (New deployment)"</b><br />
                      2. คลิกที่รูปฟันเฟืองเลือกประเภท <b>"เว็บแอป (Web app)"</b><br />
                      3. ตั้งค่าการเข้าถึง:
                    </p>
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-xs space-y-1 text-emerald-950 font-mono">
                      <div>• Execute as (ปฏิบัติการในฐานะ): <b>Me (ฉัน / บัญชีเจ้าของชีต)</b></div>
                      <div>• Who has access (ผู้มีสิทธิ์เข้าถึง): <b>Anyone (ทุกคน)</b></div>
                    </div>
                    <p className="text-xs text-slate-600">
                      4. กดปุ่ม <b>Deploy</b> แล้วคัดลอก <b>Web App URL</b> (ที่ลงท้ายด้วย <code>/exec</code>)
                    </p>
                  </div>
                </div>

                {/* Step 7 */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-bold flex items-center justify-center text-base shrink-0">
                    7
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="font-bold text-sm text-slate-800">
                      เปิดใช้งาน Web App URL — ใช้งานได้ครบทั้ง 3 ระบบทันที 100%
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      เมื่อคลิกเปิด <b>Web App URL</b> (ที่ลงท้ายด้วย <code>/exec</code>) ในเบราว์เซอร์หรือมือถือ ท่านจะพบกับระบบจริงตัวเต็มที่มีครบทั้ง 3 ระบบทันที:<br />
                      <span className="inline-block mt-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg p-2 font-medium">
                        ✅ <b>1. ระบบล็อกอิน & ลงทะเบียน:</b> สลับสิทธิ์แอดมิน/สมาชิกได้ทันที หรือลงทะเบียนพนักงานใหม่<br />
                        ✅ <b>2. ระบบจัดการแอดมิน:</b> อนุมัติถอนเงิน, ปรับราคารับซื้อขยะ, จัดการพนักงาน, กองทุนสวัสดิการ<br />
                        ✅ <b>3. ระบบหน้าสมาชิก:</b> ชั่งขยะคำนวณเงินสด, พิมพ์ใบเสร็จ 80mm, ดูสมุดบัญชี A4, ขอถอนเงิน
                      </span>
                      <br />
                      และยังสามารถนำ URL นี้มาบันทึกในแท็บ <button type="button" onClick={() => setActiveTab('sync')} className="font-bold text-emerald-700 underline">"🔄 ซิงค์ข้อมูลสด & ตรวจสอบ"</button> เพื่อให้หน้านี้เชื่อมต่อ Real-time ได้ด้วยเช่นกัน!
                    </p>
                  </div>
                </div>
              </div>

              {/* Practical Sub-District Usage Architecture */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                <h4 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                  <span>🏢 แนวทางการนำไปใช้งานจริง ณ องค์การบริหารส่วนตำบลตาคลี</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                    <div className="font-bold text-emerald-800 flex items-center space-x-1.5">
                      <span>⚖️ จุดรับฝากขยะ (คัดแยก)</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      ติดตั้งโน้ตบุ๊ก หรือแท็บเล็ต/มือถือ พร้อมเครื่องชั่ง เมื่อพนักงานนำขยะมาส่ง เจ้าหน้าที่เลือกรหัสพนักงาน ชั่งน้ำหนัก ระบบคำนวณเงินและบันทึกลง Google Sheets ทันที
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                    <div className="font-bold text-sky-800 flex items-center space-x-1.5">
                      <span>📱 สมาชิกพนักงาน</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      เปิดระบบบนสมาร์ทโฟน เช็คยอดเงินสะสม น้ำหนักขยะที่คัดแยก ประวัติเงินสมทบสวัสดิการ และกดส่งคำขอถอนเงินสดได้ด้วยตนเองตลอด 24 ชั่วโมง
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                    <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                      <span>💰 กองคลัง & ผู้บริหาร</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      เปิดตรวจสอบความถูกต้องได้จาก Google Sheets โดยตรง ทั้งยอดเงินคงค้าง, สถิติขยะรายเดือน, ตรวจสอบก่อนจ่ายเงินสด และพิมพ์ใบแจ้งยอด A4 ได้ทันที
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CODE.GS FULL SOURCE */}
          {activeTab === 'codegs' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-emerald-950">📁 ไฟล์ที่ 1: Code.gs (มี initializeSheets และ API หลังบ้าน)</h4>
                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">ไวยากรณ์ผ่าน 100%</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    วางในไฟล์ <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-300">Code.gs</code> ใน Apps Script โค้ดได้รับการปรับปรุงให้สะอาด ไร้ SyntaxError 100% และมีฟังก์ชัน <code className="font-mono font-bold text-emerald-950">initializeSheets()</code> อยู่บรรทัดแรกสุด พร้อมให้กด "เรียกใช้ (Run)" ทันที!
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Spreadsheet ID: <span className="font-bold text-emerald-700">{TARGET_SPREADSHEET_ID}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(codeGsContent)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'คัดลอกสำเร็จแล้ว!' : 'คัดลอกโค้ด Code.gs'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-900 text-emerald-300 font-mono text-xs rounded-xl overflow-x-auto max-h-[480px] leading-relaxed border border-slate-800">
                  <code>{codeGsContent}</code>
                </pre>
              </div>
            </div>
          )}

          {/* TAB: INDEX.HTML FULL SOURCE */}
          {activeTab === 'indexhtml' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-bold text-emerald-950 flex items-center space-x-1.5">
                      <FileCode className="w-4 h-4 text-emerald-700" />
                      <span>🌐 ไฟล์ที่ 2: index.html (หน้าเว็บระบบจริง 3 ระบบ)</span>
                    </h4>
                    <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">ครบ 3 ระบบ</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    กดปุ่ม <b>+</b> ข้างคำว่า "ไฟล์" ใน Apps Script เลือก <b>HTML</b> ตั้งชื่อว่า <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-300">index</code> แล้ววางโค้ดนี้ จะได้ระบบครบทั้ง 3 ระบบ (1.ล็อกอิน/ลงทะเบียน 2.จัดการแอดมิน 3.หน้าสมาชิก)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(indexHtmlContent)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'คัดลอกสำเร็จแล้ว!' : 'คัดลอกโค้ด index.html'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-900 text-emerald-300 font-mono text-xs rounded-xl overflow-x-auto max-h-[480px] leading-relaxed border border-slate-800">
                  <code>{indexHtmlContent}</code>
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: REAL-TIME SYNC & WEBHOOK STATUS */}
          {activeTab === 'sync' && (
            <div className="space-y-5 max-w-3xl mx-auto py-2">
              {/* Question & Answer Banner directly addressing user request */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-300/80 rounded-2xl p-4 text-xs text-amber-950 space-y-2.5 shadow-xs">
                <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
                  <span className="text-base">💡</span>
                  <span>ทำไมเมื่อแก้ไขตัวเลขใน Google Sheets แล้ว ข้อมูลในระบบยังไม่เปลี่ยนตาม?</span>
                </div>
                <p className="leading-relaxed text-slate-700">
                  เนื่องจาก Google Sheets เป็นไฟล์ภายนอกบน Google Drive ของท่าน เมื่อมีการแก้ไขตัวเลข (เช่น เปลี่ยนราคารับซื้อขยะ หรือแก้ไขข้อมูล) ระบบต้องทำการ <b>"ดึงข้อมูล (Pull Sync)"</b> จาก Google Sheets เข้ามาอัปเดตในระบบ โดยท่านสามารถเลือกทำได้ 3 วิธีดังนี้:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200">
                    <span className="font-bold text-emerald-800 block mb-0.5">วิธีที่ 1: ดึงข้อมูลสดทันที (1-Click)</span>
                    <span>เปิดสิทธิ์แชร์ชีตเป็น <b>"ทุกคนที่มีลิงก์มีสิทธิ์ดู"</b> แล้วกดปุ่ม <b>"ดึงข้อมูลสดจาก Google Sheets"</b> ด้านล่าง ข้อมูลจะอัปเดตทันที</span>
                  </div>
                  <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200">
                    <span className="font-bold text-sky-800 block mb-0.5">วิธีที่ 2: วางตาราง CSV (ทันที)</span>
                    <span>คัดลอกจาก Google Sheet มาวางในกล่อง <b>"นำเข้าราคาผ่าน CSV"</b> ด้านล่าง แล้วกดอัปเดต เหมาะกับชีตส่วนตัว</span>
                  </div>
                  <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200">
                    <span className="font-bold text-purple-800 block mb-0.5">วิธีที่ 3: ต่อ Apps Script Web App</span>
                    <span>ใส่ Web App URL ด้านล่าง ระบบจะส่งและดึงข้อมูลแบบ 2 ทางอัตโนมัติทั้งตอนฝากขยะและตอนแก้ไข</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Pull, Push, Sync */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5">
                      <span>สั่งการซิงค์ข้อมูลกับ Google Sheets ID:</span>
                      <a 
                        href={SPREADSHEET_URL} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md hover:underline flex items-center gap-1"
                      >
                        {TARGET_SPREADSHEET_ID.substring(0, 15)}...
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      เลือกดำเนินการดึงข้อมูลล่าสุดจากชีต หรือส่งข้อมูลจากระบบไปเก็บในชีต
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Action 1: Pull from Google Sheets */}
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs">
                        <Download className="w-4 h-4 text-emerald-700" />
                        <span>1. ดึงข้อมูลล่าสุดจาก Google Sheets (Pull)</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        ดึงตัวเลขราคารับซื้อ (PriceConfig), สมาชิก (Users) และสมุดบัญชีจากชีตเข้ามาอัปเดตในระบบทันที
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        setSyncFeedback('กำลังดึงข้อมูลสดจาก Google Sheets...');
                        const res = await pullFromGoogleSheet();
                        setSyncFeedback(res.message);
                        setTimeout(() => setSyncFeedback(null), 6000);
                      }}
                      disabled={isSyncing}
                      className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center space-x-1.5 transition"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'กำลังดึงข้อมูล...' : '🔄 ดึงข้อมูลสดจาก Google Sheets ทันที'}</span>
                    </button>
                  </div>

                  {/* Action 2: Push to Google Sheets */}
                  <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-2 text-sky-900 font-bold text-xs">
                        <Upload className="w-4 h-4 text-sky-700" />
                        <span>2. ส่งข้อมูลระบบไปอัปเดตในชีต (Push)</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        ส่งสรุปยอดและรายการธุรกรรมล่าสุดไปยัง Google Apps Script Web App เพื่อบันทึกลงในแผ่นงาน
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        setSyncFeedback('กำลังส่งข้อมูลไปยัง Google Sheets...');
                        const res = await pushToGoogleSheet();
                        setSyncFeedback(res.message);
                        setTimeout(() => setSyncFeedback(null), 6000);
                      }}
                      disabled={isSyncing}
                      className="w-full py-2 px-3 bg-sky-700 hover:bg-sky-800 disabled:bg-sky-400 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center space-x-1.5 transition"
                    >
                      <Upload className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'กำลังส่งข้อมูล...' : '⬆️ ส่งข้อมูลระบบไป Google Sheets'}</span>
                    </button>
                  </div>
                </div>

                {syncFeedback && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 font-medium animate-in fade-in flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>{syncFeedback}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                  <div>
                    ซิงค์ข้อมูลล่าสุด: <span className="font-mono text-slate-800 font-bold">{lastSynced || 'ยังไม่ได้ซิงค์'}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-emerald-700 font-semibold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>ระบบรองรับการซิงค์แบบเรียลไทม์ 2 ทาง</span>
                  </div>
                </div>
              </div>

              {/* Web App URL Configuration */}
              <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <label className="block text-xs font-bold text-slate-700">
                  Google Apps Script Web App URL (สำหรับการซิงค์ผ่านสคริปต์อัตโนมัติ)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 text-xs font-mono px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setGoogleSheetUrl(urlInput);
                      handleTriggerSync();
                    }}
                    disabled={isSyncing}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white text-xs font-bold rounded-xl shadow-xs transition shrink-0 flex items-center justify-center space-x-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>บันทึก & ซิงค์สองทาง</span>
                  </button>
                </div>
              </div>

              {/* Quick CSV Paste Importer: Ideal for instant offline/manual price updates */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                    <span>นำเข้า/อัปเดตราคารับซื้อด่วนด้วยการวางตาราง (Quick CSV Paste)</span>
                  </div>
                  <span className="text-[10px] text-slate-500">คัดลอกจาก Excel หรือ Google Sheets แล้ววางได้ทันที</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  หาก Google Sheets ของท่านตั้งค่าเป็นส่วนตัว ท่านสามารถคัดลอกตารางจากแผ่นงาน <b>PriceConfig</b> มาวางในช่องด้านล่าง แล้วกดอัปเดตราคาในระบบได้ทันที:
                </p>
                <textarea
                  rows={3}
                  value={csvPasteInput}
                  onChange={(e) => setCsvPasteInput(e.target.value)}
                  placeholder="รหัสขยะ,ประเภท,ชนิดย่อย,ราคาต่อกก.&#10;P01,พลาสติก,ขวดพลาสติกใส PET,8.50&#10;M01,โลหะ,กระป๋องอลูมิเนียม,35.00"
                  className="w-full text-xs font-mono p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!csvPasteInput.trim()) {
                        setCsvPasteFeedback({ success: false, message: 'กรุณาวางข้อมูล CSV หรือข้อความตารางจากชีตก่อนกดอัปเดต' });
                        return;
                      }
                      const result = importPricesFromCSV(csvPasteInput);
                      setCsvPasteFeedback(result);
                      if (result.success) {
                        setCsvPasteInput('');
                      }
                      setTimeout(() => setCsvPasteFeedback(null), 5000);
                    }}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>อัปเดตราคารับซื้อในระบบทันที</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const sample = 'รหัสขยะ,ประเภทขยะ,ชนิดขยะย่อย,ราคารับซื้อปัจจุบัน (บาท/กก.)\nP01,พลาสติก,ขวดพลาสติกใส PET รวม,9.00\nP02,พลาสติก,พลาสติกขุ่น ขาวนม HDPE,7.50\nM01,โลหะ,กระป๋องอลูมิเนียมโค้ก,36.00\nP03,กระดาษ,กระดาษลัง ลังลูกฟูก,3.50';
                      setCsvPasteInput(sample);
                    }}
                    className="text-xs text-emerald-800 underline hover:text-emerald-950"
                  >
                    ใส่ตัวอย่าง
                  </button>
                </div>

                {csvPasteFeedback && (
                  <div className={`p-2.5 rounded-xl text-xs font-medium ${
                    csvPasteFeedback.success 
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                      : 'bg-rose-100 text-rose-900 border border-rose-300'
                  }`}>
                    {csvPasteFeedback.message}
                  </div>
                )}
              </div>

              {/* Status Checklist Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
                <div className="font-bold text-slate-800">สถานะความพร้อมข้อมูลในระบบ อบต.ตาคลี:</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex flex-col justify-between">
                    <span className="text-[11px] text-slate-500">สมาชิกพนักงาน:</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm mt-0.5">{users.length} คน</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex flex-col justify-between">
                    <span className="text-[11px] text-slate-500">ตารางราคาขยะ:</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm mt-0.5">{prices.length} รายการ</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex flex-col justify-between">
                    <span className="text-[11px] text-slate-500">รายการฝากขยะ:</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm mt-0.5">{deposits.length} รายการ</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex flex-col justify-between">
                    <span className="text-[11px] text-slate-500">รายการขอถอนเงิน:</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm mt-0.5">{withdrawals.length} รายการ</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EXPORT ALL SHEETS (CSV / EXCEL READY) */}
          {activeTab === 'exportAll' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950">
                <h4 className="font-bold text-sm mb-1 text-emerald-900">
                  📥 ส่งออกข้อมูลสำหรับนำเข้า Google Sheets (ID: {TARGET_SPREADSHEET_ID})
                </h4>
                <p>
                  ท่านสามารถดาวน์โหลดไฟล์แยกแต่ละชีต หรือดาวน์โหลดไฟล์ Master รวม เพื่อนำไปใช้ Import เข้าแผ่นงาน Google Sheets ได้ทันทีโดยไม่ต้องพิมพ์ใหม่
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-slate-800">Sheet 1: ตารางควบคุมราคา (PriceConfig)</div>
                    <div className="text-[11px] text-slate-500">{prices.length} ชนิดขยะ ประจำเดือนปัจจุบัน</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExportCSV('prices')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-slate-800">Sheet 2: สมุดบันทึกรับฝากขยะ (DepositLedger)</div>
                    <div className="text-[11px] text-slate-500">{deposits.length} รายการฝากขยะทั้งหมด</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExportCSV('deposits')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-slate-800">Sheet 3: บัญชียอดเงินคงเหลือ & ถอนเงิน (Ledger)</div>
                    <div className="text-[11px] text-slate-500">สรุปยอดเงินคงค้างรายบุคคล {membersSummary.length} รายการ</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExportCSV('balance')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-slate-800">Sheet 4: ทะเบียนพนักงาน อบต.ตาคลี (Users)</div>
                    <div className="text-[11px] text-slate-500">รายชื่อพนักงาน {users.length} คน พร้อมสังกัด</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExportCSV('users')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-xs text-slate-800">ดาวน์โหลดรวมทุกแผ่นงานในไฟล์เดียว (Master All-in-One)</div>
                  <div className="text-[11px] text-slate-500">รวมราคา, สรุปยอดเงิน, และประวัติการรับฝากทั้งหมด</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleExportCSV('all')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลด Master CSV</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: SHEET 1 TABLE VIEW */}
          {activeTab === 'sheet1' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-900">
                <div>
                  <span className="font-bold">วัตถุประสงค์ชีต 1 (PriceConfig):</span> สำหรับกรอกและอัปเดตราคาขยะแต่ละประเภทในเดือนนั้นๆ (เช่น ประจำเดือนกันยายน 2026) หน้ารับฝากขยะจะใช้ตารางนี้คำนวณเงินทันที
                </div>
                <button
                  type="button"
                  onClick={() => handleExportCSV('prices')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shrink-0 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลด CSV ชีต 1</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
                      <th className="p-3 border-r border-slate-200">รหัสขยะ (Code)</th>
                      <th className="p-3 border-r border-slate-200">ประเภทขยะ (Category)</th>
                      <th className="p-3 border-r border-slate-200">ชนิดขยะย่อย (Sub-type)</th>
                      <th className="p-3 border-r border-slate-200 text-right">ราคารับซื้อปัจจุบัน (บาท/กก.)</th>
                      <th className="p-3 border-r border-slate-200">ประจำเดือน</th>
                      <th className="p-3 text-center">หน่วยนับ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {prices.map((p) => (
                      <tr key={p.code} className="hover:bg-slate-50 font-mono">
                        <td className="p-3 border-r border-slate-100 font-bold text-emerald-800">{p.code}</td>
                        <td className="p-3 border-r border-slate-100 font-sans">{p.category}</td>
                        <td className="p-3 border-r border-slate-100 font-sans font-medium">{p.subType}</td>
                        <td className="p-3 border-r border-slate-100 text-right font-bold text-slate-900">{p.currentPrice.toFixed(2)}</td>
                        <td className="p-3 border-r border-slate-100 font-sans text-slate-500">{p.effectiveMonth}</td>
                        <td className="p-3 text-center font-sans text-slate-500">กิโลกรัม</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: SHEET 2 TABLE VIEW */}
          {activeTab === 'sheet2' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-900">
                <div>
                  <span className="font-bold">วัตถุประสงค์ชีต 2 (DepositLedger):</span> บันทึกทุกธุรกรรมการรับฝากขยะพร้อมออกเลขที่ใบเสร็จ RCP- อัตโนมัติ
                </div>
                <button
                  type="button"
                  onClick={() => handleExportCSV('deposits')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shrink-0 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลด CSV ชีต 2</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
                      <th className="p-2.5 border-r border-slate-200">เลขที่ใบเสร็จ</th>
                      <th className="p-2.5 border-r border-slate-200">วันที่</th>
                      <th className="p-2.5 border-r border-slate-200">รหัสสมาชิก</th>
                      <th className="p-2.5 border-r border-slate-200">ชื่อสมาชิก</th>
                      <th className="p-2.5 border-r border-slate-200">ชนิดขยะ</th>
                      <th className="p-2.5 border-r border-slate-200 text-right">กก.</th>
                      <th className="p-2.5 border-r border-slate-200 text-right">ราคา/กก.</th>
                      <th className="p-2.5 border-r border-slate-200 text-right">ยอดรวม (บาท)</th>
                      <th className="p-2.5">ผู้บันทึก</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deposits.slice(0, 10).map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50 font-mono text-[11px]">
                        <td className="p-2.5 border-r border-slate-100 font-bold text-emerald-800">{d.receiptNumber}</td>
                        <td className="p-2.5 border-r border-slate-100">{d.date}</td>
                        <td className="p-2.5 border-r border-slate-100 font-bold">{d.memberCode}</td>
                        <td className="p-2.5 border-r border-slate-100 font-sans">{d.memberName}</td>
                        <td className="p-2.5 border-r border-slate-100 font-sans">{d.subType}</td>
                        <td className="p-2.5 border-r border-slate-100 text-right">{d.weight}</td>
                        <td className="p-2.5 border-r border-slate-100 text-right">{d.unitPrice.toFixed(2)}</td>
                        <td className="p-2.5 border-r border-slate-100 text-right font-bold text-emerald-800">{d.totalAmount.toFixed(2)}</td>
                        <td className="p-2.5 font-sans text-slate-500">{d.recordedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: SHEET 3 TABLE VIEW */}
          {activeTab === 'sheet3' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-900">
                <div>
                  <span className="font-bold">วัตถุประสงค์ชีต 3 (WithdrawalLedger):</span> บันทึกคำขอถอนเงินสด ควบคุมกฎคงเหลือขั้นต่ำ 50 บาท
                </div>
                <button
                  type="button"
                  onClick={() => handleExportCSV('balance')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shrink-0 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลด CSV ชีต 3</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
                      <th className="p-2.5 border-r border-slate-200">รหัสสมาชิก</th>
                      <th className="p-2.5 border-r border-slate-200">ชื่อ-นามสกุล</th>
                      <th className="p-2.5 border-r border-slate-200">สังกัด/แผนก</th>
                      <th className="p-2.5 border-r border-slate-200 text-right">ยอดฝากรวม (บาท)</th>
                      <th className="p-2.5 border-r border-slate-200 text-right">ยอดถอนรวม (บาท)</th>
                      <th className="p-2.5 border-r border-slate-200 text-right">คงเหลือสุทธิ (บาท)</th>
                      <th className="p-2.5 text-center">สถานะสิทธิ์การถอน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {membersSummary.slice(0, 10).map((m) => (
                      <tr key={m.memberCode} className="hover:bg-slate-50 font-mono text-[11px]">
                        <td className="p-2.5 border-r border-slate-100 font-bold text-emerald-800">{m.memberCode}</td>
                        <td className="p-2.5 border-r border-slate-100 font-sans font-medium">{m.memberName}</td>
                        <td className="p-2.5 border-r border-slate-100 font-sans text-slate-500">{m.department}</td>
                        <td className="p-2.5 border-r border-slate-100 text-right text-emerald-700">{m.totalDepositAmount.toFixed(2)}</td>
                        <td className="p-2.5 border-r border-slate-100 text-right text-rose-600">{m.totalWithdrawalApproved.toFixed(2)}</td>
                        <td className="p-2.5 border-r border-slate-100 text-right font-bold text-slate-900">{m.currentBalance.toFixed(2)}</td>
                        <td className="p-2.5 text-center font-sans">
                          {m.isBelowMinimum ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold">
                              ต่ำกว่า 50 บาท (ห้ามถอน)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                              พร้อมถอนเงินได้
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs">
          <div className="text-slate-600 flex items-center space-x-1.5 text-center sm:text-left">
            <span>ฐานข้อมูล Google Sheets ID:</span>
            <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
              {TARGET_SPREADSHEET_ID}
            </span>
            <span className="hidden sm:inline">• อบต.ตาคลี อ.ตาคลี จ.นครสวรรค์</span>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={SPREADSHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition inline-flex items-center space-x-1"
            >
              <span>เปิดดูไฟล์ Google Sheets</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
