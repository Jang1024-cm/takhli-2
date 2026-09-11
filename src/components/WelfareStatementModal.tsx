import React, { useState, useEffect } from 'react';
import { useWasteBank } from '../context/WasteBankContext';
import { Printer, X, ShieldCheck, HeartHandshake, Award, FileText, CheckCircle2, AlertTriangle, Calendar, UserCheck, ExternalLink } from 'lucide-react';
import { printA4Document, openDocumentInNewTab } from '../utils/printHelper';

interface WelfareStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMemberCode?: string;
}

export const WelfareStatementModal: React.FC<WelfareStatementModalProps> = ({
  isOpen,
  onClose,
  selectedMemberCode
}) => {
  const { 
    currentUser, 
    users, 
    welfareConfig, 
    welfareContributions, 
    getMemberWelfareSummary, 
    getMemberSummary 
  } = useWasteBank();

  const isAdminOrFinance = currentUser?.role === 'admin' || currentUser?.role === 'superadmin' || currentUser?.role === 'finance';

  const targetCode = isAdminOrFinance
    ? (selectedMemberCode || currentUser?.memberCode || 'MB001')
    : (currentUser?.memberCode || 'MB001');

  const [activeCode, setActiveCode] = useState<string>(targetCode);

  useEffect(() => {
    if (!isAdminOrFinance && currentUser?.memberCode) {
      setActiveCode(currentUser.memberCode);
    } else if (selectedMemberCode) {
      setActiveCode(selectedMemberCode);
    }
  }, [isAdminOrFinance, currentUser?.memberCode, selectedMemberCode]);

  if (!isOpen) return null;

  const member = users.find(u => u.memberCode === activeCode) || users[1];
  const wfSummary = getMemberWelfareSummary(activeCode);
  const wasteSummary = getMemberSummary(activeCode);
  const memberContribs = welfareContributions.filter(c => c.memberCode === activeCode);

  const activeAdmin = (currentUser?.role === 'admin' || currentUser?.role === 'superadmin')
    ? currentUser 
    : (users.find(u => u.role === 'admin') || users.find(u => u.role === 'superadmin'));
  const buyerStaffName = activeAdmin?.name || 'นายชาญชัย รักษ์ตาคลี';

  const docTitle = `ใบแจ้งยอดสวัสดิการ_${member?.memberCode}_${member?.name || ''}`;

  const handlePrint = () => {
    printA4Document('welfare-printable-document', docTitle);
  };

  const handleOpenNewTab = () => {
    openDocumentInNewTab('welfare-printable-document', docTitle);
  };

  const now = new Date();
  const printTimestamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="no-print px-5 py-3.5 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HeartHandshake className="w-5 h-5 text-emerald-400" />
            <h2 className="font-semibold text-sm sm:text-base">
              ใบแจ้งยอดเงินกองทุนสวัสดิการสงเคราะห์พนักงาน (Print-Friendly A4 Layout)
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {/* Member Info / Selector */}
            {isAdminOrFinance ? (
              <select
                value={activeCode}
                onChange={(e) => setActiveCode(e.target.value)}
                className="bg-emerald-800 text-white text-xs rounded-lg px-2.5 py-1.5 border border-emerald-700 focus:ring-1 focus:ring-emerald-400 outline-hidden"
                title="เลือกสมาชิกเพื่อพิมพ์ใบแจ้งยอดสวัสดิการ"
              >
                {users.filter(u => u.role === 'member').map(u => (
                  <option key={u.id} value={u.memberCode}>
                    {u.memberCode} - {u.name} {u.welfareEnrolled ? '(เข้าร่วมสวัสดิการ)' : '(ยังไม่เข้าร่วม)'}
                  </option>
                ))}
              </select>
            ) : (
              <div className="bg-emerald-800/90 text-emerald-200 text-xs rounded-lg px-3 py-1.5 border border-emerald-700 font-mono font-medium flex items-center space-x-1.5">
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
              className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 text-xs font-medium rounded-lg border border-emerald-700 transition cursor-pointer"
              title="เปิดพิมพ์ในหน้าต่างใหม่ (หากเปิดในแท็บแยก)"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-300" />
              <span>เปิดแท็บพิมพ์</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-800 transition"
              aria-label="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable A4 Sheet Body */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-slate-100 flex justify-center">
          <div
            id="welfare-printable-document"
            className="bg-white w-full max-w-[210mm] min-h-[297mm] p-6 sm:p-10 shadow-lg sm:shadow-md border border-slate-300 sm:border-slate-200 text-slate-900 flex flex-col justify-between text-left"
            style={{ fontFamily: "'Sarabun', 'Prompt', sans-serif" }}
          >
            <div>
              {/* Header Box */}
              <div className="border-2 border-emerald-800 rounded-lg p-5 bg-emerald-50/50 text-center relative mb-6">
                <div className="text-xl sm:text-2xl font-bold text-emerald-950 tracking-wide flex items-center justify-center space-x-2">
                  <span>🤝 ใบรับรองยอดเงินสมทบกองทุนสวัสดิการสงเคราะห์พนักงาน 🤝</span>
                </div>
                <div className="text-sm font-semibold text-emerald-900 mt-1">
                  องค์การบริหารส่วนตำบลตาคลี อำเภอตาคลี จังหวัดนครสวรรค์
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  โครงการธนาคารขยะเชื่อมโยงกองทุนสวัสดิการสงเคราะห์ (ความสมัครใจของสมาชิก)
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-emerald-200 text-left text-xs">
                  <div>
                    <span className="font-bold text-slate-700">รหัสสมาชิก:</span>{' '}
                    <span className="font-mono font-bold text-emerald-800">{member?.memberCode}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">ชื่อ-นามสกุล:</span>{' '}
                    <span className="font-medium text-slate-900">{member?.name}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">สังกัดส่วนงาน:</span>{' '}
                    <span className="font-medium text-slate-900">{member?.department}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">สถานะสมาชิก:</span>{' '}
                    <span className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                      wfSummary.isEnrolled 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {wfSummary.isEnrolled ? '✓ เข้าร่วมกองทุน' : 'ยังไม่เข้าร่วม'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Monthly Welfare Status Overview */}
              <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-emerald-700" />
                    <span className="font-bold text-slate-800 text-sm">
                      รอบประจำเดือน: {welfareConfig.currentMonth}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500">สถานะการสมทบรอบนี้:</span>
                    {wfSummary.isTargetMet ? (
                      <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>สมทบครบตามเกณฑ์แล้ว</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>ยังขาดอีก {wfSummary.remainingShortfall.toFixed(2)} บาท</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3 text-center">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <div className="text-[11px] text-slate-500">เกณฑ์สมทบประจำเดือน</div>
                    <div className="text-base font-bold text-slate-800 mt-0.5">
                      {wfSummary.monthlyTarget.toFixed(2)} <span className="text-xs font-normal">บาท</span>
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <div className="text-[11px] text-slate-500">สมทบไปแล้วเดือนนี้</div>
                    <div className="text-base font-bold text-emerald-700 mt-0.5">
                      {wfSummary.currentMonthContributed.toFixed(2)} <span className="text-xs font-normal">บาท</span>
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <div className="text-[11px] text-slate-500">ยอดขายขยะในเดือนนี้</div>
                    <div className="text-base font-bold text-teal-700 mt-0.5">
                      {wfSummary.currentMonthWasteSales.toFixed(2)} <span className="text-xs font-normal">บาท</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      (เกณฑ์ขายขยะพอหัก: {welfareConfig.requiredWasteSalesThreshold.toFixed(2)} ฿)
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <div className="text-[11px] text-slate-500">ยอดเงินในธนาคารขยะที่ถอนได้</div>
                    <div className="text-base font-bold text-slate-800 mt-0.5">
                      {wasteSummary.maxWithdrawable.toFixed(2)} <span className="text-xs font-normal">บาท</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      (คงเหลือสุทธิ {wasteSummary.currentBalance.toFixed(2)} ฿)
                    </div>
                  </div>
                </div>
              </div>

              {/* Welfare Protection Entitlements */}
              <div className="mb-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
                <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs sm:text-sm mb-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>สิทธิประโยชน์และการคุ้มครองของสมาชิกกองทุนสวัสดิการสงเคราะห์ อบต.ตาคลี</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                    <div className="font-semibold text-slate-800">1. ฌาปนกิจสงเคราะห์</div>
                    <div className="text-emerald-700 font-bold text-sm mt-0.5">
                      {welfareConfig.benefitCoverageDetails.funeralAssistance.toLocaleString()} บาท
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">สมาชิกหรือบิดามารดาเสียชีวิต</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                    <div className="font-semibold text-slate-800">2. รักษาพยาบาล/เจ็บป่วย</div>
                    <div className="text-emerald-700 font-bold text-sm mt-0.5">
                      {welfareConfig.benefitCoverageDetails.medicalAssistance.toLocaleString()} บาท
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">นอนพักรักษาตัว รพ.ตาคลี</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                    <div className="font-semibold text-slate-800">3. ขวัญถุงคลอดบุตร</div>
                    <div className="text-emerald-700 font-bold text-sm mt-0.5">
                      {welfareConfig.benefitCoverageDetails.childbirthAssistance.toLocaleString()} บาท
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">บุตรแรกเกิดของพนักงาน</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                    <div className="font-semibold text-slate-800">4. ทุนการศึกษาบุตร</div>
                    <div className="text-emerald-700 font-bold text-sm mt-0.5">
                      {welfareConfig.benefitCoverageDetails.scholarshipAssistance.toLocaleString()} บาท
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">สนับสนุนการเรียนดีประจำปี</div>
                  </div>
                </div>
              </div>

              {/* Table of Contributions */}
              <div className="mb-6">
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm mb-2 flex items-center justify-between">
                  <span>ประวัติการนำเงินมาสมทบกองทุนสวัสดิการ (ใบเสร็จรับเงิน/ตัดยอด)</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    รวมทั้งสิ้น {wfSummary.totalLifetimeContributed.toFixed(2)} บาท ({wfSummary.contributionCount} รายการ)
                  </span>
                </h3>

                <table className="w-full border border-slate-300 text-xs text-left">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                      <th className="p-2 border-r border-slate-300 w-10 text-center">ลำดับ</th>
                      <th className="p-2 border-r border-slate-300 w-24">วันที่</th>
                      <th className="p-2 border-r border-slate-300 w-32">เลขที่ใบเสร็จ</th>
                      <th className="p-2 border-r border-slate-300">ช่องทางการสมทบ</th>
                      <th className="p-2 border-r border-slate-300 w-28">รอบเดือน</th>
                      <th className="p-2 text-right w-24">จำนวนเงิน (฿)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberContribs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-400">
                          ยังไม่มีประวัติการสมทบเงินเข้ากองทุนสวัสดิการ
                        </td>
                      </tr>
                    ) : (
                      memberContribs.map((c, idx) => (
                        <tr key={c.id} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="p-2 border-r border-slate-200 text-center text-slate-500">{idx + 1}</td>
                          <td className="p-2 border-r border-slate-200 font-mono text-[11px]">{c.date}</td>
                          <td className="p-2 border-r border-slate-200 font-mono font-semibold text-emerald-800 text-[11px]">
                            {c.receiptNumber}
                          </td>
                          <td className="p-2 border-r border-slate-200">
                            <div>
                              <span className="font-medium text-slate-800">
                                {c.source === 'waste_deposit' && '♻️ หักจากเงินฝากขายขยะ'}
                                {c.source === 'cash_topup' && '💵 นำเงินสดมาฝากสมทบ'}
                                {c.source === 'waste_balance_deduct' && '🏦 หักโอนจากเงินคงเหลือธนาคารขยะ'}
                              </span>
                              {c.note && <div className="text-[10px] text-slate-500 mt-0.5">{c.note}</div>}
                            </div>
                          </td>
                          <td className="p-2 border-r border-slate-200 text-slate-600 text-[11px]">{c.month}</td>
                          <td className="p-2 text-right font-mono font-bold text-emerald-700">
                            +{c.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300">
                      <td colSpan={5} className="p-2 text-right border-r border-slate-300">
                        รวมเงินสมทบสะสมทั้งหมด:
                      </td>
                      <td className="p-2 text-right font-mono text-emerald-800 text-sm">
                        {wfSummary.totalLifetimeContributed.toFixed(2)} ฿
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Regulatory Notice */}
              <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="font-semibold text-slate-700">หมายเหตุและระเบียบกองทุน:</div>
                <div>1. สมาชิกสามารถนำเงินจากการขายขยะรีไซเคิล หรือยอดเงินคงเหลือในบัญชีธนาคารขยะมาสมทบได้ตามความสะดวก</div>
                <div>2. บัญชีธนาคารขยะต้องคงเหลือยอดเงินขั้นต่ำไม่น้อยกว่า 50.00 บาท เพื่อรักษาสภาพคล่องตามมติ อบต.ตาคลี</div>
                <div>3. หากยอดขายขยะไม่เพียงพอ สมาชิกสามารถนำเงินสดมาฝากสมทบ ณ กองคลัง ได้ทุกวันทำการ</div>
              </div>
            </div>

            {/* Signature Section */}
            <div className="pt-8 border-t border-slate-300 mt-8">
              <div className="grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="h-12 border-b border-dashed border-slate-400 mx-10"></div>
                  <div className="mt-2 font-semibold text-slate-800">
                    ({member?.name})
                  </div>
                  <div className="text-slate-500 text-[11px]">สมาชิกผู้เอาประกันสวัสดิการ</div>
                </div>
                <div>
                  <div className="h-12 border-b border-dashed border-slate-400 mx-10"></div>
                  <div className="mt-2 font-semibold text-slate-800">
                    ({buyerStaffName})
                  </div>
                  <div className="text-slate-500 text-[11px]">เจ้าหน้าที่ผู้รับซื้อขยะ</div>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 text-center mt-6">
                เอกสารพิมพ์จากระบบธนาคารขยะดิจิทัล อบต.ตาคลี • วันที่พิมพ์: {printTimestamp}
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
