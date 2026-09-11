import React, { useState } from 'react';
import { useWasteBank } from '../context/WasteBankContext';
import { Printer, X, HeartHandshake, Calendar, UserCheck, ExternalLink, ShieldCheck, CheckCircle2, Award } from 'lucide-react';
import { printA4Document, openDocumentInNewTab } from '../utils/printHelper';
import { thaiBahtText } from '../utils/thaiBahtText';
import { WelfareContributionRecord } from '../types';

interface WelfareReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberCode?: string;
  selectedContributionId?: string;
}

export const WelfareReceiptModal: React.FC<WelfareReceiptModalProps> = ({
  isOpen,
  onClose,
  memberCode,
  selectedContributionId
}) => {
  const { currentUser, users, welfareConfig, welfareContributions, getMemberWelfareSummary, orgConfig, logActivity } = useWasteBank();

  const targetMemberCode = memberCode || currentUser?.memberCode || 'MB001';
  const member = users.find(u => u.memberCode === targetMemberCode) || currentUser;
  const wfSummary = getMemberWelfareSummary(targetMemberCode);

  // Filter welfare contributions for this member
  const myContribs = welfareContributions.filter(c => c.memberCode === targetMemberCode);

  const [activeContribId, setActiveContribId] = useState<string>(
    selectedContributionId || (myContribs.length > 0 ? myContribs[0].id : '')
  );

  React.useEffect(() => {
    if (selectedContributionId) {
      setActiveContribId(selectedContributionId);
    } else if (myContribs.length > 0 && !activeContribId) {
      setActiveContribId(myContribs[0].id);
    }
  }, [selectedContributionId, myContribs]);

  if (!isOpen) return null;

  const activeAdmin = currentUser?.role === 'admin' 
    ? currentUser 
    : users.find(u => u.role === 'admin');
  
  const currentContrib = myContribs.find(c => c.id === activeContribId) || myContribs[0] || {
    id: 'WF-DEF',
    memberCode: targetMemberCode,
    amount: welfareConfig?.monthlyContributionAmount || 50,
    date: '09/09/2026',
    receiptNumber: `WFR-202609-${targetMemberCode.slice(-3)}`,
    source: 'waste_deposit' as const,
    note: 'หักสมทบจากยอดเงินขายขยะรีไซเคิล',
    recordedBy: 'เจ้าหน้าที่การเงิน อบต.'
  };

  const buyerStaffName = (currentContrib.recordedBy && currentContrib.recordedBy !== 'ระบบอัตโนมัติ')
    ? currentContrib.recordedBy
    : (activeAdmin?.name || 'นายชาญชัย รักษ์ตาคลี');

  const receiptNo = currentContrib.receiptNumber || `WFR-202609-${currentContrib.id.slice(-4)}`;
  const docTitle = `ใบเสร็จเงินสวัสดิการสงเคราะห์_${member?.memberCode}_${receiptNo}`;

  const handlePrint = () => {
    logActivity?.(
      'print_document',
      'พิมพ์เอกสารทางการ A4',
      `พิมพ์ใบเสร็จเงินสวัสดิการสงเคราะห์สมาชิก ${member?.name} (${member?.memberCode}) [${receiptNo}]`,
      currentUser || undefined
    );
    printA4Document('welfare-receipt-printable-document', docTitle);
  };

  const handleOpenNewTab = () => {
    logActivity?.(
      'print_document',
      'เปิดพิมพ์เอกสารแท็บใหม่',
      `เปิดพิมพ์ใบเสร็จเงินสวัสดิการสงเคราะห์ในแท็บใหม่ สมาชิก ${member?.name} (${member?.memberCode}) [${receiptNo}]`,
      currentUser || undefined
    );
    openDocumentInNewTab('welfare-receipt-printable-document', docTitle);
  };

  const now = new Date();
  const printTimestamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;

  const sourceLabels: Record<string, string> = {
    waste_deposit: 'หักจากเงินฝากขายขยะรีไซเคิลอัตโนมัติ',
    waste_balance_deduct: 'โอนหักจากยอดเงินคงเหลือในบัญชีธนาคารขยะ',
    cash_topup: 'นำส่งเงินสด ณ สำนักงานกองคลัง/สวัสดิการ'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="no-print px-5 py-3.5 bg-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HeartHandshake className="w-5 h-5 text-emerald-400" />
            <h2 className="font-semibold text-sm sm:text-base">
              ใบเสร็จรับเงินค่าใช้จ่ายสมทบกองทุนสวัสดิการสงเคราะห์พนักงาน
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            {myContribs.length > 1 && (
              <select
                value={activeContribId}
                onChange={(e) => setActiveContribId(e.target.value)}
                className="bg-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 border border-slate-600 focus:ring-1 focus:ring-emerald-400 outline-hidden max-w-[180px] truncate"
                title="เลือกใบเสร็จเงินสวัสดิการ"
              >
                {myContribs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.date} - {c.amount.toFixed(2)} ฿ ({c.receiptNumber})
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
            id="welfare-receipt-printable-document"
            className="bg-white w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-12 shadow-md border border-slate-200 text-slate-800 text-xs leading-relaxed flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between border-b-2 border-teal-700 pb-4">
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
                      กองทุนสวัสดิการสงเคราะห์พนักงาน
                    </h1>
                    <p className="text-xs text-slate-600 font-medium">
                      องค์การบริหารส่วนตำบลตาคลี อ.ตาคลี จ.นครสวรรค์
                    </p>
                    <p className="text-[11px] text-slate-500">
                      กองสาธารณสุขและสิ่งแวดล้อม ร่วมกับ กองคลัง อบต.ตาคลี
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block px-3 py-1 bg-teal-800 text-white font-bold text-xs rounded-md uppercase tracking-wider mb-1">
                    ใบเสร็จรับเงินค่าใช้จ่ายสวัสดิการ
                  </div>
                  <div className="text-[11px] text-slate-500">ต้นฉบับสำหรับพนักงาน/สมาชิกกองทุน</div>
                  <div className="font-mono text-xs font-bold text-slate-800 mt-1">
                    เลขที่: <span className="text-teal-800 font-bold">{receiptNo}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    วันที่ชำระ: <span className="font-mono font-semibold">{currentContrib.date}</span>
                  </div>
                </div>
              </div>

              {/* Sub-header Banner */}
              <div className="my-4 p-2.5 bg-teal-50/80 border border-teal-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  <span className="font-bold text-teal-900 text-xs sm:text-sm">
                    ใบเสร็จรับเงินค่าใช้จ่ายเงินสมทบกองทุนสวัสดิการสงเคราะห์พนักงาน (Welfare Contribution Receipt)
                  </span>
                </div>
                <span className="text-[11px] text-teal-700 font-semibold bg-teal-100/70 px-2 py-0.5 rounded-md">
                  ประจำงวด: {welfareConfig.currentMonth}
                </span>
              </div>

              {/* Member Profile */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs mb-5">
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500">รหัสสมาชิก/พนักงาน:</span>{' '}
                    <strong className="font-mono text-teal-900 font-bold text-sm">
                      {member?.memberCode}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">ชื่อ - นามสกุล พนักงาน:</span>{' '}
                    <strong className="text-slate-900 font-semibold">{member?.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">สังกัด / สำนัก / กอง:</span>{' '}
                    <span className="text-slate-700">{member?.department || 'พนักงาน อบต.ตาคลี'}</span>
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
                    <span className="text-slate-500">สถานะในกองทุนสวัสดิการ:</span>{' '}
                    <span className="text-emerald-700 font-bold">
                      ✓ สมาชิกสมบูรณ์ (ได้รับสิทธิประโยชน์ครบ 4 ด้าน)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">ช่องทางการชำระ:</span>{' '}
                    <span className="text-slate-700 font-medium">
                      {sourceLabels[currentContrib.source] || currentContrib.source}
                    </span>
                  </div>
                </div>
              </div>

              {/* Receipt Breakdown Table */}
              <div className="border border-slate-300 rounded-lg overflow-hidden mb-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                      <th className="p-2.5 text-center w-12 border-r border-slate-300">ลำดับ</th>
                      <th className="p-2.5 border-r border-slate-300">รายการค่าใช้จ่าย</th>
                      <th className="p-2.5 border-r border-slate-300">รอบเดือน / ข้อมูลอ้างอิง</th>
                      <th className="p-2.5 border-r border-slate-300">ช่องทางการหักชำระ</th>
                      <th className="p-2.5 text-right">จำนวนเงิน (บาท)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-3 text-center font-mono border-r border-slate-200">1</td>
                      <td className="p-3 font-medium text-slate-900 border-r border-slate-200">
                        เงินค่าใช้จ่ายสมทบกองทุนสวัสดิการสงเคราะห์พนักงาน อบต.ตาคลี
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {currentContrib.note || 'สมทบตามระเบียบกองทุนประจำเดือน'}
                        </div>
                      </td>
                      <td className="p-3 font-mono text-slate-700 border-r border-slate-200">
                        {welfareConfig.currentMonth}
                      </td>
                      <td className="p-3 border-r border-slate-200 text-slate-700">
                        {sourceLabels[currentContrib.source] || currentContrib.source}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-teal-800 text-base">
                        {currentContrib.amount.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-800">
                    <tr>
                      <td colSpan={4} className="p-2.5 text-right border-r border-slate-300">
                        รวมเงินค่าใช้จ่ายสมทบทั้งสิ้น:
                      </td>
                      <td className="p-2.5 text-right font-mono font-extrabold text-base text-teal-900">
                        {currentContrib.amount.toFixed(2)} บาท
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Thai Baht text */}
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-lg flex items-center justify-between text-xs mb-5">
                <span className="text-slate-600 font-medium">จำนวนเงินตัวอักษร (Baht in Words):</span>
                <strong className="text-teal-950 font-bold text-sm">
                  ({thaiBahtText(currentContrib.amount)})
                </strong>
              </div>

              {/* Welfare Fund Cumulative & Protection Summary */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>ข้อมูลสิทธิประโยชน์และความคุ้มครองของพนักงานที่ได้รับ:</span>
                  </span>
                  <span className="text-slate-500">
                    ยอดเงินสมทบสะสมตลอดชีพ: <strong className="text-teal-800 font-mono">{(wfSummary?.totalLifetimeContributed || 0).toFixed(2)} บาท</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="text-slate-500 font-medium text-[11px]">1. ฌาปนกิจสงเคราะห์</div>
                    <div className="text-sm font-bold text-teal-800 mt-0.5">
                      {(welfareConfig?.benefitCoverageDetails?.funeralAssistance ?? 3000).toLocaleString()} ฿
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">สมาชิก/บิดามารดาเสียชีวิต</div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="text-slate-500 font-medium text-[11px]">2. รักษาพยาบาล</div>
                    <div className="text-sm font-bold text-teal-800 mt-0.5">
                      {(welfareConfig?.benefitCoverageDetails?.medicalAssistance ?? 1000).toLocaleString()} ฿
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">นอน รพ.ตาคลี</div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="text-slate-500 font-medium text-[11px]">3. ขวัญถุงคลอดบุตร</div>
                    <div className="text-sm font-bold text-teal-800 mt-0.5">
                      {(welfareConfig?.benefitCoverageDetails?.childbirthAssistance ?? 1500).toLocaleString()} ฿
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">บุตรแรกเกิดพนักงาน</div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="text-slate-500 font-medium text-[11px]">4. ทุนการศึกษาบุตร</div>
                    <div className="text-sm font-bold text-teal-800 mt-0.5">
                      {(welfareConfig?.benefitCoverageDetails?.scholarshipAssistance ?? 1000).toLocaleString()} ฿
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">เรียนดีประจำปี</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature Block */}
            <div className="pt-6 border-t border-slate-300">
              <div className="grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="h-14 border-b border-dotted border-slate-400 mx-10 mb-2 flex items-end justify-center pb-1">
                    <span className="font-semibold text-slate-700">{buyerStaffName}</span>
                  </div>
                  <div className="font-bold text-slate-800">({buyerStaffName})</div>
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
                    พนักงาน / สมาชิกผู้ชำระเงินสมทบกองทุน
                  </div>
                  <div className="text-slate-400 text-[10px] mt-0.5">
                    วันที่ {currentContrib.date}
                  </div>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 mt-6">
                เอกสารใบเสร็จนี้ออกโดยระบบบริหารกองทุนสวัสดิการสงเคราะห์พนักงาน อบต.ตาคลี • ออกเมื่อ {printTimestamp}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
