import React, { useState } from 'react';
import { useWasteBank } from '../context/WasteBankContext';
import { Printer, X, Receipt, Calendar, UserCheck, ExternalLink, Wallet, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { printA4Document, openDocumentInNewTab } from '../utils/printHelper';
import { thaiBahtText } from '../utils/thaiBahtText';

interface MonthlySalesReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberCode?: string;
}

export const MonthlySalesReceiptModal: React.FC<MonthlySalesReceiptModalProps> = ({
  isOpen,
  onClose,
  memberCode
}) => {
  const { currentUser, users, deposits, getMemberSummary, orgConfig, logActivity } = useWasteBank();

  const targetMemberCode = memberCode || currentUser?.memberCode || 'MB001';
  const member = users.find(u => u.memberCode === targetMemberCode) || currentUser;
  const summary = getMemberSummary(targetMemberCode);

  // Extract all available months from this member's deposits
  const allMemberDeposits = deposits.filter(d => d.memberCode === targetMemberCode);
  const availableMonths = React.useMemo(() => {
    const set = new Set<string>();
    allMemberDeposits.forEach(d => {
      const parts = d.date.split('/');
      if (parts.length === 3) {
        set.add(`${parts[1]}/${parts[2]}`);
      }
    });
    const now = new Date();
    const curr = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    set.add(curr);
    return Array.from(set).sort().reverse();
  }, [allMemberDeposits]);

  // Month selection: e.g. "09/2026" or "all"
  const now = new Date();
  const currentMonthFormatted = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(
    availableMonths.includes(currentMonthFormatted) ? currentMonthFormatted : (availableMonths[0] || 'all')
  );

  if (!isOpen) return null;

  // Filter deposits for this member and selected month
  const memberDeposits = allMemberDeposits.filter(d => {
    if (selectedMonth === 'all') return true;
    const parts = d.date.split('/');
    if (parts.length === 3) {
      const depositMonth = `${parts[1]}/${parts[2]}`;
      return depositMonth === selectedMonth;
    }
    return true;
  });

  const totalMonthlyWeightKg = memberDeposits.reduce((sum, d) => sum + (d.weight ?? d.weightKg ?? 0), 0);
  const totalMonthlySalesAmount = memberDeposits.reduce((sum, d) => sum + (d.totalAmount ?? d.totalPrice ?? 0), 0);

  const activeAdmin = (currentUser?.role === 'admin' || currentUser?.role === 'superadmin')
    ? currentUser 
    : (users.find(u => u.role === 'admin') || users.find(u => u.role === 'superadmin'));
  const buyerOfficerName = activeAdmin?.name || 'นายสมเกียรติ มั่นคง';

  const receiptNumber = `REC-M${selectedMonth === 'all' ? 'ALL' : selectedMonth.replace('/', '')}-${member?.memberCode || 'MB001'}`;
  const docTitle = `ใบเสร็จรับเงินขายขยะ_${member?.memberCode}_${selectedMonth.replace('/', '_')}`;

  const handlePrint = () => {
    logActivity?.(
      'print_document',
      'พิมพ์เอกสารทางการ A4',
      `พิมพ์ใบเสร็จรับเงินขายขยะสมาชิก ${member?.name} (${member?.memberCode}) รอบเดือน ${selectedMonth === 'all' ? 'ทั้งหมด' : selectedMonth} [${receiptNumber}]`,
      currentUser || undefined
    );
    printA4Document('monthly-receipt-printable-document', docTitle);
  };

  const handleOpenNewTab = () => {
    logActivity?.(
      'print_document',
      'เปิดพิมพ์เอกสารแท็บใหม่',
      `เปิดพิมพ์ใบเสร็จรับเงินขายขยะในแท็บใหม่ สมาชิก ${member?.name} (${member?.memberCode}) [${receiptNumber}]`,
      currentUser || undefined
    );
    openDocumentInNewTab('monthly-receipt-printable-document', docTitle);
  };

  const printTimestamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;

  // Thai Month Display Name
  const thaiMonths: Record<string, string> = {
    '01': 'มกราคม', '02': 'กุมภาพันธ์', '03': 'มีนาคม', '04': 'เมษายน',
    '05': 'พฤษภาคม', '06': 'มิถุนายน', '07': 'กรกฎาคม', '08': 'สิงหาคม',
    '09': 'กันยายน', '10': 'ตุลาคม', '11': 'พฤศจิกายน', '12': 'ธันวาคม'
  };
  const [mStr, yStr] = selectedMonth.split('/');
  const thaiMonthName = selectedMonth === 'all'
    ? 'ทุกรอบเดือน (ทั้งหมด)'
    : `${thaiMonths[mStr] || mStr} ${parseInt(yStr || '2026', 10) + 543}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="no-print px-5 py-3.5 bg-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <h2 className="font-semibold text-sm sm:text-base">
              ใบเสร็จรับเงินขายขยะประจำเดือนพร้อมสรุปยอดเงินคงเหลือ
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            {/* Month Filter */}
            <div className="flex items-center space-x-1 bg-slate-700 rounded-lg px-2 py-1 text-xs">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-white font-medium outline-hidden cursor-pointer"
                title="เลือกเดือนที่ต้องการพิมพ์ใบเสร็จ"
              >
                <option value="all" className="bg-slate-800 text-white">ทุกรอบเดือน (ทั้งหมด)</option>
                {availableMonths.map(m => {
                  const [mNum, yNum] = m.split('/');
                  const mLabel = `${thaiMonths[mNum] || mNum} ${parseInt(yNum || '2026', 10) + 543}`;
                  return (
                    <option key={m} value={m} className="bg-slate-800 text-white">
                      {mLabel} {m === currentMonthFormatted ? '(เดือนปัจจุบัน)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ใบเสร็จ A4</span>
            </button>

            <button
              type="button"
              onClick={handleOpenNewTab}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg transition cursor-pointer"
              title="เปิดในแท็บใหม่"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">แท็บใหม่</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Scroll Area */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-100 flex justify-center">
          <div
            id="monthly-receipt-printable-document"
            className="bg-white w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-12 shadow-md border border-slate-200 text-slate-800 text-xs leading-relaxed flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between border-b-2 border-emerald-700 pb-4">
                <div className="flex items-center space-x-3.5">
                  <img
                    src={orgConfig?.logoUrl || '/logo.png'}
                    alt="ตราสัญลักษณ์"
                    className="w-16 h-16 object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div>
                    <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                      องค์การบริหารส่วนตำบลตาคลี
                    </h1>
                    <p className="text-xs text-slate-600 font-medium">
                      ธนาคารขยะรีไซเคิลชุมชน อบต.ตาคลี • กองสาธารณสุขและสิ่งแวดล้อม
                    </p>
                    <p className="text-[11px] text-slate-500">
                      หมู่ที่ 2 ต.ตาคลี อ.ตาคลี จ.นครสวรรค์ 60140
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-md uppercase tracking-wider mb-1">
                    ใบเสร็จรับเงินขายขยะ & สรุปยอดคงเหลือ
                  </div>
                  <div className="text-[11px] text-slate-500">สำหรับสมาชิก/พนักงานนำไปเป็นหลักฐาน</div>
                  <div className="font-mono text-xs font-bold text-slate-800 mt-1">
                    เลขที่ใบเสร็จ: <span className="text-emerald-800">{receiptNumber}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    ประจำงวดเดือน: <strong className="text-slate-900">{thaiMonthName}</strong>
                  </div>
                </div>
              </div>

              {/* Member Profile Information */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs my-4">
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500">รหัสสมาชิก (Member ID):</span>{' '}
                    <strong className="font-mono text-emerald-800 font-bold text-sm">
                      {member?.memberCode}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">ชื่อ - สกุล สมาชิก:</span>{' '}
                    <strong className="text-slate-900 font-semibold">{member?.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">สังกัด / สำนัก / กอง:</span>{' '}
                    <span className="text-slate-700">{member?.department || 'กองสาธารณสุขและสิ่งแวดล้อม'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500">เลขประจำตัวประชาชน:</span>{' '}
                    <span className="font-mono text-slate-700 font-medium">
                      {member?.nationalId
                        ? member.nationalId.replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1-$2-$3-$4-$5')
                        : '3-6007-00214-99-1'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">สถานะสมาชิก:</span>{' '}
                    <span className="text-emerald-700 font-semibold">ปกติ (Active)</span>
                  </div>
                  <div>
                    <span className="text-slate-500">วันที่ออกใบเสร็จ:</span>{' '}
                    <span className="font-mono text-slate-600">{printTimestamp}</span>
                  </div>
                </div>
              </div>

              {/* Monthly Deposit Transactions Table */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center space-x-1.5">
                    <span>รายการขายและนำฝากขยะรีไซเคิลในเดือน {thaiMonthName}</span>
                    <span className="font-normal text-slate-500 text-xs">({memberDeposits.length} รายการ)</span>
                  </h3>
                </div>

                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                        <th className="p-2 text-center w-10 border-r border-slate-300">ที่</th>
                        <th className="p-2 border-r border-slate-300">วันที่</th>
                        <th className="p-2 border-r border-slate-300">เลขที่ใบชั่ง</th>
                        <th className="p-2 border-r border-slate-300">หมวดหมู่ขยะ</th>
                        <th className="p-2 border-r border-slate-300">ชนิดขยะรีไซเคิล</th>
                        <th className="p-2 text-right border-r border-slate-300">น้ำหนัก (กก.)</th>
                        <th className="p-2 text-right border-r border-slate-300">ราคา/กก.</th>
                        <th className="p-2 text-right">จำนวนเงิน (บาท)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {memberDeposits.map((d, index) => (
                        <tr key={d.id} className="hover:bg-slate-50">
                          <td className="p-2 text-center font-mono border-r border-slate-200">{index + 1}</td>
                          <td className="p-2 font-mono text-slate-600 border-r border-slate-200">{d.date}</td>
                          <td className="p-2 font-mono text-[11px] text-slate-500 border-r border-slate-200">
                            {d.receiptNumber || `WS-${d.id.slice(-4)}`}
                          </td>
                          <td className="p-2 border-r border-slate-200">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {d.category}
                            </span>
                          </td>
                          <td className="p-2 font-medium text-slate-900 border-r border-slate-200">{d.subType}</td>
                          <td className="p-2 text-right font-mono text-slate-800 border-r border-slate-200">
                            {(d.weight ?? d.weightKg ?? 0).toFixed(2)}
                          </td>
                          <td className="p-2 text-right font-mono text-slate-600 border-r border-slate-200">
                            {(d.unitPrice ?? 0).toFixed(2)}
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-emerald-800">
                            {(d.totalAmount ?? d.totalPrice ?? 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}

                      {memberDeposits.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-slate-400 italic">
                            ไม่มีรายการขายขยะในรอบเดือน {thaiMonthName}
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-800">
                      <tr>
                        <td colSpan={5} className="p-2.5 text-right border-r border-slate-300">
                          รวมยอดขายขยะในเดือน {thaiMonthName}:
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900 border-r border-slate-300">
                          {totalMonthlyWeightKg.toFixed(2)} กก.
                        </td>
                        <td className="p-2.5 border-r border-slate-300"></td>
                        <td className="p-2.5 text-right font-mono font-extrabold text-sm text-emerald-800">
                          {totalMonthlySalesAmount.toFixed(2)} บาท
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Thai Baht text for monthly sales */}
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center justify-between text-xs mb-5">
                <span className="text-slate-600 font-medium">ยอดเงินขายขยะเดือนนี้ (ตัวอักษร):</span>
                <strong className="text-emerald-950 font-bold">
                  ({thaiBahtText(totalMonthlySalesAmount)})
                </strong>
              </div>

              {/* ========================================================================= */}
              {/* HIGHLIGHTED ACCOUNT BALANCE SUMMARY BOX (Requirement: พร้อมยอดเงินคงเหลือแสดงให้เห็นด้วย) */}
              {/* ========================================================================= */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border-2 border-emerald-600 rounded-xl mb-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-emerald-200">
                  <div className="flex items-center space-x-2">
                    <Wallet className="w-5 h-5 text-emerald-700" />
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      สรุปสถานะบัญชีเงินฝากและยอดคงเหลือสุทธิ (Current Account Balance)
                    </h3>
                  </div>
                  <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    ข้อมูลอัปเดตเรียลไทม์
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 text-xs">
                  {/* Current Balance */}
                  <div className="bg-white p-3.5 rounded-lg border border-emerald-200 shadow-2xs">
                    <div className="text-slate-500 font-medium">ยอดเงินคงเหลือสุทธิ (Current Balance)</div>
                    <div className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">
                      {summary.currentBalance.toFixed(2)}{' '}
                      <span className="text-xs font-normal text-slate-600">บาท</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      ({thaiBahtText(summary.currentBalance)})
                    </div>
                  </div>

                  {/* Withdrawable */}
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
                    <div className="text-slate-500 font-medium">ยอดที่ขอเบิกถอนได้ (หลังหักเงินสำรอง 50 ฿)</div>
                    <div className="text-2xl font-extrabold text-teal-800 font-mono mt-1">
                      {summary.maxWithdrawable.toFixed(2)}{' '}
                      <span className="text-xs font-normal text-slate-600">บาท</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      * บังคับคงเงินขั้นต่ำ 50.00 ฿ ในบัญชี
                    </div>
                  </div>

                  {/* Lifetime Earnings */}
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
                    <div className="text-slate-500 font-medium">ยอดเงินฝากขยะสะสมตลอดชีพ</div>
                    <div className="text-2xl font-extrabold text-slate-800 font-mono mt-1">
                      {summary.totalDepositAmount.toFixed(2)}{' '}
                      <span className="text-xs font-normal text-slate-600">บาท</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      ถอนไปแล้วสะสม: <span className="font-mono font-semibold text-rose-600">-{summary.totalWithdrawalApproved.toFixed(2)} ฿</span>
                    </div>
                  </div>
                </div>

                {summary.isBelowMinimum && (
                  <div className="mt-3 p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      คำเตือน: ปัจจุบันยอดเงินคงเหลือต่ำกว่าเกณฑ์ 50.00 บาท ไม่สามารถทำรายการขอถอนเงินสดได้ กรุณานำขยะมาฝากเพิ่ม
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Signature Block */}
            <div className="pt-6 border-t border-slate-300 mt-4">
              <div className="grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="h-14 border-b border-dotted border-slate-400 mx-10 mb-2 flex items-end justify-center pb-1">
                    <span className="font-semibold text-slate-700">{buyerOfficerName}</span>
                  </div>
                  <div className="font-bold text-slate-800">({buyerOfficerName})</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    เจ้าหน้าที่ผู้รับซื้อขยะ
                  </div>
                  <div className="text-slate-400 text-[10px] mt-0.5">
                    องค์การบริหารส่วนตำบลตาคลี
                  </div>
                </div>

                <div>
                  <div className="h-14 border-b border-dotted border-slate-400 mx-10 mb-2 flex items-end justify-center pb-1">
                    <span className="font-semibold text-slate-700">{member?.name}</span>
                  </div>
                  <div className="font-bold text-slate-800">({member?.name})</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    สมาชิกผู้รับใบเสร็จและตรวจสอบยอดเงินคงเหลือ
                  </div>
                  <div className="text-slate-400 text-[10px] mt-0.5">
                    วันที่ {printTimestamp.split(' ')[0]}
                  </div>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 mt-6">
                เอกสารทางการเงินออกโดยระบบสารสนเทศธนาคารขยะรีไซเคิล องค์การบริหารส่วนตำบลตาคลี อ.ตาคลี จ.นครสวรรค์
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
