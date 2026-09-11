import React, { useState, useEffect } from 'react';
import { useWasteBank } from '../context/WasteBankContext';
import { Printer, X, Download, ShieldCheck, AlertTriangle, Calendar, UserCheck, ExternalLink } from 'lucide-react';
import { printA4Document, openDocumentInNewTab } from '../utils/printHelper';

interface A4StatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMemberCode?: string;
}

export const A4StatementModal: React.FC<A4StatementModalProps> = ({
  isOpen,
  onClose,
  selectedMemberCode
}) => {
  const { currentUser, users, deposits, withdrawals, getMemberSummary } = useWasteBank();

  const isAdminOrFinance = currentUser?.role === 'admin' || currentUser?.role === 'finance';

  // Rule: Non-admin users can ONLY see their own statement! Admin can pick any member or selectedMemberCode
  const targetCode = isAdminOrFinance
    ? (selectedMemberCode || currentUser?.memberCode || 'MB001')
    : (currentUser?.memberCode || 'MB001');

  const [activeCode, setActiveCode] = useState<string>(targetCode);
  const [selectedMonth, setSelectedMonth] = useState<string>('กันยายน 2026');

  // Keep activeCode strictly synced if current user changes or non-admin
  useEffect(() => {
    if (!isAdminOrFinance && currentUser?.memberCode) {
      setActiveCode(currentUser.memberCode);
    } else if (selectedMemberCode) {
      setActiveCode(selectedMemberCode);
    }
  }, [isAdminOrFinance, currentUser?.memberCode, selectedMemberCode]);

  if (!isOpen) return null;

  const member = users.find(u => u.memberCode === activeCode) || users[1];
  const summary = getMemberSummary(activeCode);
  const memberDeposits = deposits.filter(d => d.memberCode === activeCode);
  const memberWithdrawals = withdrawals.filter(w => w.memberCode === activeCode && w.status === 'approved');

  const activeAdmin = currentUser?.role === 'admin' 
    ? currentUser 
    : users.find(u => u.role === 'admin');
  const buyerStaffName = activeAdmin?.name || 'นายชาญชัย รักษ์ตาคลี';

  const docTitle = `ใบแจ้งยอดธนาคารขยะ_${member?.memberCode}_${member?.name || ''}`;

  const handlePrint = () => {
    printA4Document('a4-printable-document', docTitle);
  };

  const handleOpenNewTab = () => {
    openDocumentInNewTab('a4-printable-document', docTitle);
  };

  const now = new Date();
  const printTimestamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="no-print px-5 py-3.5 bg-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <h2 className="font-semibold text-sm sm:text-base">ใบแจ้งยอดประจำเดือน (Print-Friendly A4 Layout)</h2>
          </div>
          <div className="flex items-center space-x-2">
            {/* Member Info / Selector */}
            {isAdminOrFinance ? (
              <select
                value={activeCode}
                onChange={(e) => setActiveCode(e.target.value)}
                className="bg-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 border border-slate-600 focus:ring-1 focus:ring-emerald-400 outline-hidden"
                title="เลือกสมาชิกเพื่อพิมพ์ใบแจ้งยอด"
              >
                {users.filter(u => u.role === 'member').map(u => (
                  <option key={u.id} value={u.memberCode}>
                    {u.memberCode} - {u.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="bg-slate-700/90 text-emerald-300 text-xs rounded-lg px-3 py-1.5 border border-slate-600 font-mono font-medium flex items-center space-x-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{member?.memberCode} ({member?.name?.split(' ')[0]})</span>
              </div>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg shadow-sm transition cursor-pointer"
              title="พิมพ์เอกสาร A4 หรือบันทึกเป็น PDF"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ / บันทึก PDF</span>
            </button>

            <button
              type="button"
              onClick={handleOpenNewTab}
              className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg border border-slate-600 transition cursor-pointer"
              title="เปิดพิมพ์ในหน้าต่างใหม่ (หากเปิดในแท็บแยก)"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
              <span>เปิดแท็บพิมพ์</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
              aria-label="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Printable A4 Sheet Body */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-slate-100 flex justify-center">
          <div
            id="a4-printable-document"
            className="bg-white w-full max-w-[210mm] min-h-[297mm] p-6 sm:p-10 shadow-lg sm:shadow-md border border-slate-300 sm:border-slate-200 text-slate-900 flex flex-col justify-between"
            style={{ fontFamily: "'Sarabun', 'Prompt', sans-serif" }}
          >
            <div>
              {/* Header Box */}
              <div className="border-2 border-emerald-800 rounded-lg p-5 bg-emerald-50/40 text-center relative mb-6">
                <div className="text-xl sm:text-2xl font-bold text-emerald-900 tracking-wide flex items-center justify-center space-x-2">
                  <span>🌳 ใบแจ้งยอดธนาคารขยะหน่วยงาน 🌳</span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-emerald-800 mt-1">
                  องค์การบริหารส่วนตำบลตาคลี อำเภอตาคลี จังหวัดนครสวรรค์
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  โครงการส่งเสริมการคัดแยกขยะรีไซเคิลเพื่อสวัสดิการพนักงานและสิ่งแวดล้อม
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-emerald-200 text-left text-xs sm:text-sm">
                  <div>
                    <span className="font-bold text-slate-700">รหัสสมาชิก:</span>{' '}
                    <span className="font-mono font-bold text-emerald-800 text-base">{member?.memberCode}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-700">ประจำเดือน:</span>{' '}
                    <span className="font-medium text-slate-900">{selectedMonth}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">ชื่อ-นามสกุล:</span>{' '}
                    <span className="font-medium text-slate-900">{member?.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-700">สังกัด:</span>{' '}
                    <span className="font-medium text-slate-900">{member?.department}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-bold text-slate-700">อีเมล:</span>{' '}
                    <span className="font-mono text-slate-800">{member?.email}</span>
                  </div>
                </div>
              </div>

              {/* Section 1: Deposit Items Table */}
              <div className="mb-6">
                <div className="font-bold text-sm sm:text-base text-slate-800 mb-2 flex items-center justify-between border-b-2 border-slate-300 pb-1">
                  <span>[ส่วนที่ 1: รายการฝากขยะและรายรับสะสม]</span>
                  <span className="text-xs text-slate-500 font-normal">รวม {memberDeposits.length} รายการ</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-semibold">
                        <th className="p-2.5 border-r border-slate-300 text-center w-24">วันที่</th>
                        <th className="p-2.5 border-r border-slate-300">ประเภทขยะ</th>
                        <th className="p-2.5 border-r border-slate-300">ชนิดย่อย</th>
                        <th className="p-2.5 border-r border-slate-300 text-right">น้ำหนัก (กก.)</th>
                        <th className="p-2.5 border-r border-slate-300 text-right">ราคา/หน่วย</th>
                        <th className="p-2.5 text-right font-bold w-32">รวมเป็นเงิน (บาท)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberDeposits.length > 0 ? (
                        memberDeposits.map((dep, idx) => (
                          <tr key={dep.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                            <td className="p-2.5 border-r border-b border-slate-200 text-center font-mono text-xs">{dep.date}</td>
                            <td className="p-2.5 border-r border-b border-slate-200">
                              <span className="font-medium text-slate-800">{dep.category}</span>
                            </td>
                            <td className="p-2.5 border-r border-b border-slate-200 text-slate-700">{dep.subType}</td>
                            <td className="p-2.5 border-r border-b border-slate-200 text-right font-mono font-medium">{dep.weight.toFixed(2)}</td>
                            <td className="p-2.5 border-r border-b border-slate-200 text-right font-mono text-slate-600">{dep.unitPrice.toFixed(2)}</td>
                            <td className="p-2.5 border-b border-slate-200 text-right font-mono font-bold text-emerald-800">
                              {dep.totalAmount.toFixed(2)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                            ยังไม่มีรายการบันทึกฝากขยะในรอบเดือนนี้
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-emerald-50/80 font-bold border-t-2 border-slate-300 text-slate-900">
                        <td colSpan={3} className="p-2.5 text-right">รวมน้ำหนักและเงินฝากสะสม:</td>
                        <td className="p-2.5 text-right font-mono text-emerald-900">{summary.totalWeightKg.toFixed(2)} กก.</td>
                        <td></td>
                        <td className="p-2.5 text-right font-mono text-emerald-900 text-base">{summary.totalDepositAmount.toFixed(2)} บาท</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Section 2: Financial Summary Box */}
              <div className="border-2 border-slate-800 rounded-lg p-5 bg-white mb-6">
                <div className="font-bold text-sm sm:text-base text-slate-900 mb-3 border-b border-slate-200 pb-2">
                  [ส่วนที่ 2: สรุปสถานะทางการเงินและสภาพคล่องบัญชี]
                </div>

                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-200">
                    <span className="text-slate-700 flex items-center space-x-1.5">
                      <span>💰</span>
                      <span>ยอดรวมเงินฝากสะสมทั้งหมด:</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">{summary.totalDepositAmount.toFixed(2)} บาท</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-200">
                    <span className="text-slate-700 flex items-center space-x-1.5">
                      <span>💸</span>
                      <span>ยอดรวมการถอนเงินสะสม:</span>
                    </span>
                    <span className="font-mono font-bold text-rose-700">-{summary.totalWithdrawalApproved.toFixed(2)} บาท</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 bg-slate-50 px-2 rounded-sm border border-slate-200">
                    <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                      <span>📊</span>
                      <span>ยอดเงินคงเหลือสุทธิ (Current Balance):</span>
                    </span>
                    <span className={`font-mono font-bold text-base sm:text-lg ${summary.isBelowMinimum ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {summary.currentBalance.toFixed(2)} บาท
                    </span>
                  </div>

                  <div className={`p-3 rounded-md border mt-3 flex items-start space-x-2.5 ${
                    summary.isBelowMinimum 
                      ? 'bg-rose-50 border-rose-300 text-rose-800' 
                      : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  }`}>
                    {summary.isBelowMinimum ? (
                      <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                    ) : (
                      <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-xs sm:text-sm">
                        {summary.isBelowMinimum ? '⚠️ สถานะบัญชี: ต่ำกว่าเกณฑ์ขั้นต่ำ / ห้ามถอน' : '✅ สถานะบัญชี: ปกติ / สามารถถอนเงินได้'}
                      </div>
                      <div className="text-[11px] sm:text-xs mt-0.5 text-slate-600">
                        (หมายเหตุ: กฎควบคุมสภาพคล่องของคลังธนาคารขยะ อบต.ตาคลี กำหนดเงินคงเหลือขั้นต่ำในบัญชีไว้ที่ 50.00 บาท | ยอดที่สามารถถอนได้สูงสุดในขณะนี้: {summary.maxWithdrawable.toFixed(2)} บาท)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signatures Area for official document */}
              <div className="grid grid-cols-2 gap-8 pt-4 pb-2 text-center text-xs">
                <div>
                  <div className="h-12 border-b border-dashed border-slate-400 mx-8"></div>
                  <p className="mt-2 text-slate-700">({member?.name})</p>
                  <p className="text-[11px] text-slate-500">ลายมือชื่อสมาชิกผู้ถือบัญชี</p>
                </div>
                <div>
                  <div className="h-12 border-b border-dashed border-slate-400 mx-8"></div>
                  <p className="mt-2 text-slate-700">({buyerStaffName})</p>
                  <p className="text-[11px] text-slate-500 font-medium">เจ้าหน้าที่ผู้รับซื้อขยะ</p>
                  <p className="text-[10px] text-slate-400">องค์การบริหารส่วนตำบลตาคลี</p>
                </div>
              </div>
            </div>

            {/* Print Footer */}
            <div className="pt-4 border-t-2 border-slate-800 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 mt-6">
              <div>
                ออกโดย: ระบบอัตโนมัติธนาคารขยะดิจิทัล อบต.ตาคลี (เชื่อมต่อ Google Sheets)
              </div>
              <div className="font-mono">
                พิมพ์เมื่อ: {printTimestamp}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions (Hidden in Print) */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs text-slate-500">
            * เอกสารถูกจัดหน้ากระดาษแบบ A4 Print-Friendly พร้อมพิมพ์หรือบันทึกเป็น PDF ด้วยเบราว์เซอร์
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition"
            >
              ปิดหน้าต่าง
            </button>
            <button
              type="button"
              onClick={handleOpenNewTab}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition"
              title="เปิดพิมพ์ในหน้าต่างใหม่ (เพื่อบันทึก PDF โดยตรง)"
            >
              <ExternalLink className="w-4 h-4 text-slate-600" />
              <span>เปิดพิมพ์ในแท็บใหม่</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์หน้านี้ / บันทึก PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
