import React, { useState } from 'react';
import { useWasteBank } from '../context/WasteBankContext';
import { Printer, X, Scale, Calendar, UserCheck, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { printA4Document, openDocumentInNewTab } from '../utils/printHelper';
import { thaiBahtText } from '../utils/thaiBahtText';
import { DepositRecord } from '../types';

interface WeightSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDepositId?: string;
  memberCode?: string;
}

export const WeightSlipModal: React.FC<WeightSlipModalProps> = ({
  isOpen,
  onClose,
  selectedDepositId,
  memberCode
}) => {
  const { currentUser, users, deposits, orgConfig, logActivity } = useWasteBank();

  const targetMemberCode = memberCode || currentUser?.memberCode || 'MB001';
  const member = users.find(u => u.memberCode === targetMemberCode) || currentUser;

  // Filter deposits for this member
  const memberDeposits = deposits.filter(d => d.memberCode === targetMemberCode);

  const [activeDepositId, setActiveDepositId] = useState<string>(
    selectedDepositId || (memberDeposits.length > 0 ? memberDeposits[0].id : '')
  );

  // Sync activeDepositId when prop changes
  React.useEffect(() => {
    if (selectedDepositId) {
      setActiveDepositId(selectedDepositId);
    } else if (memberDeposits.length > 0 && !activeDepositId) {
      setActiveDepositId(memberDeposits[0].id);
    }
  }, [selectedDepositId, memberDeposits]);

  if (!isOpen) return null;

  const currentDeposit = memberDeposits.find(d => d.id === activeDepositId) || memberDeposits[0];

  const activeAdmin = currentUser?.role === 'admin' 
    ? currentUser 
    : users.find(u => u.role === 'admin');
  const buyerOfficerName = currentDeposit?.recordedBy || activeAdmin?.name || 'นายสมเกียรติ มั่นคง';

  const slipNumber = currentDeposit?.receiptNumber || `WS-${currentDeposit?.date ? currentDeposit.date.replace(/\//g, '') : '00'}-${(currentDeposit?.id || '01').slice(-3)}`;
  const docTitle = `ใบชั่งน้ำหนัก_${member?.memberCode}_${slipNumber}`;

  const handlePrint = () => {
    logActivity?.(
      'print_document',
      'พิมพ์เอกสารทางการ A4',
      `พิมพ์ใบชั่งน้ำหนักขยะรีไซเคิลสมาชิก ${member?.name} (${member?.memberCode}) [${slipNumber}]`,
      currentUser || undefined
    );
    printA4Document('weight-slip-printable-document', docTitle);
  };

  const handleOpenNewTab = () => {
    logActivity?.(
      'print_document',
      'เปิดพิมพ์เอกสารแท็บใหม่',
      `เปิดพิมพ์ใบชั่งน้ำหนักขยะรีไซเคิลในแท็บใหม่ สมาชิก ${member?.name} (${member?.memberCode}) [${slipNumber}]`,
      currentUser || undefined
    );
    openDocumentInNewTab('weight-slip-printable-document', docTitle);
  };

  const now = new Date();
  const printTimestamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="no-print px-5 py-3.5 bg-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-emerald-400" />
            <h2 className="font-semibold text-sm sm:text-base">ใบชั่งน้ำหนักและนำฝากขยะรีไซเคิล (Weight Slip)</h2>
          </div>

          <div className="flex items-center space-x-2">
            {memberDeposits.length > 1 && (
              <select
                value={activeDepositId}
                onChange={(e) => setActiveDepositId(e.target.value)}
                className="bg-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 border border-slate-600 focus:ring-1 focus:ring-emerald-400 outline-hidden max-w-[200px] truncate"
                title="เลือกรายการใบชั่ง"
              >
                {memberDeposits.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.date} - {d.subType} ({d.weightKg} กก. - {d.totalPrice.toFixed(2)} ฿)
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์เอกสาร</span>
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

        {/* Document Scroll Area */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-100 flex justify-center">
          <div
            id="weight-slip-printable-document"
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
                      // Fallback if logo fails
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div>
                    <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                      องค์การบริหารส่วนตำบลตาคลี
                    </h1>
                    <p className="text-xs text-slate-600">
                      กองสาธารณสุขและสิ่งแวดล้อม • งานจัดการขยะมูลฝอยและสิ่งแวดล้อม
                    </p>
                    <p className="text-[11px] text-slate-500">
                      อ.ตาคลี จ.นครสวรรค์ 60140 • โทรศัพท์ 056-261-xxx
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold text-xs rounded-md uppercase tracking-wider mb-1">
                    ใบชั่งน้ำหนักและนำฝากขยะ
                  </div>
                  <div className="text-[11px] text-slate-500">ต้นฉบับ / ผู้ชั่งน้ำหนักออกให้</div>
                  <div className="font-mono text-xs font-bold text-slate-800 mt-1">
                    เลขที่: <span className="text-emerald-800">{slipNumber}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    วันที่ชั่ง: <span className="font-mono font-semibold">{currentDeposit?.date || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Document Subtitle Banner */}
              <div className="my-4 p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Scale className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-emerald-900 text-xs sm:text-sm">
                    ใบรับรองการชั่งน้ำหนักขยะรีไซเคิล (Recycling Weight Scale Certificate)
                  </span>
                </div>
                <span className="text-[11px] text-emerald-700 font-medium">
                  จุดรับฝาก: ธนาคารขยะ อบต.ตาคลี
                </span>
              </div>

              {/* Member & Transaction Information */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs mb-5">
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500">รหัสสมาชิกผู้นำฝาก:</span>{' '}
                    <strong className="font-mono text-emerald-800 font-bold text-sm">
                      {member?.memberCode}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">ชื่อ - สกุล สมาชิก:</span>{' '}
                    <strong className="text-slate-900 font-semibold">{member?.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">สำนัก / กองสังกัด:</span>{' '}
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
                    <span className="text-slate-500">เจ้าหน้าที่ผู้รับซื้อขยะ:</span>{' '}
                    <strong className="text-emerald-900">
                      {buyerOfficerName} (ผู้ดูแลระบบ อบต.ตาคลี)
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">สถานะบันทึกระบบ:</span>{' '}
                    <span className="inline-flex items-center text-emerald-700 font-semibold text-[11px]">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> บันทึกเข้าบัญชีสำเร็จ
                    </span>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown Table */}
              <div className="border border-slate-300 rounded-lg overflow-hidden mb-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                      <th className="p-2.5 text-center w-12 border-r border-slate-300">ลำดับ</th>
                      <th className="p-2.5 border-r border-slate-300">รหัสขยะ</th>
                      <th className="p-2.5 border-r border-slate-300">หมวดหมู่</th>
                      <th className="p-2.5 border-r border-slate-300">รายละเอียดชนิดขยะรีไซเคิล</th>
                      <th className="p-2.5 text-right border-r border-slate-300">น้ำหนักสุทธิ (กก.)</th>
                      <th className="p-2.5 text-right border-r border-slate-300">ราคาต่อหน่วย (บาท)</th>
                      <th className="p-2.5 text-right">จำนวนเงิน (บาท)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {currentDeposit ? (
                      <tr>
                        <td className="p-3 text-center font-mono border-r border-slate-200">1</td>
                        <td className="p-3 font-mono font-bold text-slate-700 border-r border-slate-200">
                          {currentDeposit.wasteCode}
                        </td>
                        <td className="p-3 border-r border-slate-200">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {currentDeposit.category}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-900 border-r border-slate-200">
                          {currentDeposit.subType}
                          {currentDeposit.note && (
                            <div className="text-[11px] text-slate-500 italic mt-0.5">
                              * บันทึก: {currentDeposit.note}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900 text-sm border-r border-slate-200">
                          {(currentDeposit.weight ?? currentDeposit.weightKg ?? 0).toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-700 border-r border-slate-200">
                          {(currentDeposit.unitPrice ?? 0).toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-800 text-sm">
                          {(currentDeposit.totalAmount ?? currentDeposit.totalPrice ?? 0).toFixed(2)}
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                          ไม่พบข้อมูลรายการชั่งน้ำหนัก
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-800">
                    <tr>
                      <td colSpan={4} className="p-2.5 text-right border-r border-slate-300">
                        รวมน้ำหนักและยอดเงินสุทธิ:
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-sm text-slate-900 border-r border-slate-300">
                        {currentDeposit ? (currentDeposit.weight ?? currentDeposit.weightKg ?? 0).toFixed(2) : '0.00'} กก.
                      </td>
                      <td className="p-2.5 border-r border-slate-300"></td>
                      <td className="p-2.5 text-right font-mono font-extrabold text-base text-emerald-800">
                        {currentDeposit ? (currentDeposit.totalAmount ?? currentDeposit.totalPrice ?? 0).toFixed(2) : '0.00'} บาท
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Thai Baht Text Box */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs mb-5">
                <span className="text-slate-600 font-medium">จำนวนเงินตัวอักษร (Baht in Words):</span>
                <span className="font-bold text-emerald-950 text-sm">
                  ({thaiBahtText(currentDeposit?.totalPrice || 0)})
                </span>
              </div>

              {/* Note / Welfare deduction info if applicable */}
              {currentDeposit?.welfareContributed && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-900 mb-5 flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>การหักสมทบสวัสดิการสงเคราะห์พนักงาน:</strong> รายการนี้มีการหักยอดสมทบเข้ากองทุนสวัสดิการสงเคราะห์พนักงาน อบต.ตาคลี เป็นเงิน 50.00 บาท และโอนเงินส่วนที่เหลือเข้าบัญชีเงินฝากธนาคารขยะของสมาชิกเรียบร้อยแล้ว
                  </div>
                </div>
              )}

              {/* Environmental Impact Notice */}
              <div className="p-2.5 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-[11px] text-slate-500 mb-6">
                🌿 <strong>ประโยชน์ต่อสิ่งแวดล้อม:</strong> การนำขยะรีไซเคิลจำนวน {currentDeposit?.weightKg.toFixed(2) || '0'} กก. เข้าสู่ธนาคารขยะ อบต.ตาคลี ช่วยลดการปล่อยก๊าซเรือนกระจกได้ประมาณ {((currentDeposit?.weightKg || 0) * 1.8).toFixed(2)} kg CO₂e
              </div>
            </div>

            {/* Signature Block */}
            <div className="pt-6 border-t border-slate-300">
              <div className="grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="h-14 border-b border-dotted border-slate-400 mx-10 mb-2 flex items-end justify-center pb-1">
                    <span className="font-semibold text-slate-700">{buyerOfficerName}</span>
                  </div>
                  <div className="font-bold text-slate-800">
                    ({buyerOfficerName})
                  </div>
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
                    สมาชิกผู้ส่งมอบขยะและตรวจสอบน้ำหนัก
                  </div>
                  <div className="text-slate-400 text-[10px] mt-0.5">
                    วันที่ {currentDeposit?.date || printTimestamp}
                  </div>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 mt-6">
                เอกสารนี้พิมพ์จากระบบสารสนเทศธนาคารขยะรีไซเคิล องค์การบริหารส่วนตำบลตาคลี • ออกเมื่อ {printTimestamp}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
