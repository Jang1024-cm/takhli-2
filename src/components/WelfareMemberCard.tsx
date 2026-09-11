import React, { useState } from 'react';
import { useWasteBank } from '../context/WasteBankContext';
import { 
  HeartHandshake, 
  ShieldCheck, 
  ArrowRight, 
  Coins, 
  Wallet, 
  Printer, 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Check, 
  X, 
  TrendingUp,
  Award,
  Sparkles,
  HelpCircle,
  Clock,
  LogOut,
  FileText,
  Lock,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WelfareReceiptModal } from './WelfareReceiptModal';

interface WelfareMemberCardProps {
  onOpenWelfareStatement: () => void;
  onOpenWelfareAlerts: () => void;
}

export const WelfareMemberCard: React.FC<WelfareMemberCardProps> = ({
  onOpenWelfareStatement,
  onOpenWelfareAlerts
}) => {
  const { 
    currentUser, 
    welfareConfig, 
    welfareContributions, 
    toggleWelfareEnrollment, 
    contributeToWelfare, 
    requestWelfareExit,
    getMemberWelfareSummary, 
    getMemberSummary 
  } = useWasteBank();

  const memberCode = currentUser?.memberCode || 'MB001';
  const wfSummary = getMemberWelfareSummary(memberCode);
  const wasteSummary = getMemberSummary(memberCode);

  // Modals for Top-up and Transfer
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [transferAmount, setTransferAmount] = useState<string>(
    wfSummary.remainingShortfall > 0 ? String(wfSummary.remainingShortfall) : '50'
  );
  const [transferNote, setTransferNote] = useState<string>('');
  const [transferSource, setTransferSource] = useState<'waste_balance_deduct' | 'cash_topup'>('waste_balance_deduct');
  const [actionError, setActionError] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string>('');

  // Welfare Resignation & Exit Permission state
  const [isExitRequestModalOpen, setIsExitRequestModalOpen] = useState<boolean>(false);
  const [isConfirmExitModalOpen, setIsConfirmExitModalOpen] = useState<boolean>(false);
  const [exitReason, setExitReason] = useState<string>('');
  const [exitMsg, setExitMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Welfare Receipt Print Modal state
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [selectedReceiptContribId, setSelectedReceiptContribId] = useState<string | undefined>(undefined);

  const percentComplete = Math.min(100, Math.round((wfSummary.currentMonthContributed / wfSummary.monthlyTarget) * 100));

  const handleEnroll = () => {
    toggleWelfareEnrollment(memberCode, true, true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  const handleOpenExitFlow = () => {
    // Check if user has permission from admin to opt out
    if (currentUser?.canOptOutWelfare) {
      setIsConfirmExitModalOpen(true);
    } else {
      setIsExitRequestModalOpen(true);
    }
  };

  const handleSubmitExitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exitReason.trim()) {
      setExitMsg({ text: 'กรุณาระบุเหตุผลในการขอลาออกจากกองทุนสวัสดิการ', isError: true });
      return;
    }

    const res = requestWelfareExit(memberCode, exitReason.trim());
    if (res.success) {
      setExitMsg({ text: res.message, isError: false });
      setTimeout(() => {
        setIsExitRequestModalOpen(false);
        setExitMsg(null);
      }, 2500);
    } else {
      setExitMsg({ text: res.message, isError: true });
    }
  };

  const handleFinalExitConfirm = () => {
    const success = toggleWelfareEnrollment(memberCode, false, false);
    if (success) {
      setIsConfirmExitModalOpen(false);
    }
  };

  const handleAutoDeductToggle = () => {
    toggleWelfareEnrollment(memberCode, true, !wfSummary.autoDeduct);
  };

  const handleContributeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      setActionError('กรุณาระบุจำนวนเงินที่มากกว่า 0 บาท');
      return;
    }

    const res = contributeToWelfare(memberCode, amt, transferSource, transferNote);
    if (!res.success) {
      setActionError(res.message);
    } else {
      setActionSuccess(res.message);
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        setIsTransferModalOpen(false);
        setActionSuccess('');
      }, 1500);
    }
  };

  const myRecentContribs = welfareContributions
    .filter(c => c.memberCode === memberCode)
    .slice(0, 3);

  // If user is NOT enrolled in welfare
  if (!wfSummary.isEnrolled) {
    return (
      <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-2xl p-6 sm:p-7 border border-emerald-800 shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
          <HeartHandshake className="w-56 h-56" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ระบบเสริมตามความสมัครใจ (Optional Welfare Fund)</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            กองทุนสวัสดิการสงเคราะห์พนักงาน อบต.ตาคลี
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 leading-relaxed">
            สมาชิกสามารถเลือกเข้าร่วมได้ตามความสมัครใจ โดยสามารถนำเงินที่ได้จากการขายขยะรีไซเคิล 
            หรือยอดเงินคงเหลือในบัญชีธนาคารขยะมาหักสมทบเข้ากองทุน ({welfareConfig.monthlyContributionAmount.toFixed(2)} บาท/เดือน)
            เพื่อรับสิทธิการคุ้มครองและเงินช่วยเหลือครอบคลุม 4 ด้าน
          </p>

          {/* 4 Benefits Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-emerald-800/60 text-xs">
            <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
              <div className="text-emerald-300 font-semibold">1. ฌาปนกิจสงเคราะห์</div>
              <div className="text-base font-extrabold text-white mt-0.5">
                {welfareConfig.benefitCoverageDetails.funeralAssistance.toLocaleString()} ฿
              </div>
              <div className="text-[10px] text-emerald-200/70 mt-0.5">สมาชิก/บิดามารดาเสียชีวิต</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
              <div className="text-emerald-300 font-semibold">2. รักษาพยาบาล</div>
              <div className="text-base font-extrabold text-white mt-0.5">
                {welfareConfig.benefitCoverageDetails.medicalAssistance.toLocaleString()} ฿
              </div>
              <div className="text-[10px] text-emerald-200/70 mt-0.5">นอน รพ.ตาคลี</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
              <div className="text-emerald-300 font-semibold">3. ขวัญถุงคลอดบุตร</div>
              <div className="text-base font-extrabold text-white mt-0.5">
                {welfareConfig.benefitCoverageDetails.childbirthAssistance.toLocaleString()} ฿
              </div>
              <div className="text-[10px] text-emerald-200/70 mt-0.5">บุตรแรกเกิดพนักงาน</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
              <div className="text-emerald-300 font-semibold">4. ทุนการศึกษาบุตร</div>
              <div className="text-base font-extrabold text-white mt-0.5">
                {welfareConfig.benefitCoverageDetails.scholarshipAssistance.toLocaleString()} ฿
              </div>
              <div className="text-[10px] text-emerald-200/70 mt-0.5">เรียนดีประจำปี</div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={handleEnroll}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold text-xs sm:text-sm rounded-xl shadow-lg transition"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>สมัครใจเข้าร่วมกองทุนสวัสดิการทันที</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-[11px] text-emerald-200/80">
              * ไม่มีค่าสมัครแรกเข้า หักสมทบจากยอดเงินขายขยะตามเกณฑ์ {welfareConfig.monthlyContributionAmount} บาท/เดือน
            </span>
          </div>
        </div>
      </div>
    );
  }

  // If user IS enrolled in welfare
  return (
    <div className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-sm relative overflow-hidden space-y-5">
      {/* Top Bar Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <HeartHandshake className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-slate-800 text-base sm:text-lg">
                ระบบเงินสวัสดิการสงเคราะห์พนักงาน (เชื่อมโยงธนาคารขยะ)
              </h2>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
                ✓ เข้าร่วมแล้ว
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              รอบประจำเดือน: <span className="font-semibold text-slate-700">{welfareConfig.currentMonth}</span> • 
              ความคุ้มครอง 4 ด้าน: ฌาปนกิจ, รักษาพยาบาล, คลอดบุตร, ทุนการศึกษา
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Print Welfare Receipt Button */}
          <button
            type="button"
            onClick={() => {
              setSelectedReceiptContribId(undefined);
              setIsReceiptModalOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition cursor-pointer shadow-2xs"
            title="พิมพ์ใบเสร็จเงินสวัสดิการสงเคราะห์ประจำเดือน"
          >
            <Printer className="w-3.5 h-3.5 text-teal-700" />
            <span>พิมพ์ใบเสร็จเงินสวัสดิการ</span>
          </button>

          {/* Print A4 Statement Button */}
          <button
            type="button"
            onClick={onOpenWelfareStatement}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            title="พิมพ์ใบรับรองสวัสดิการ A4"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ใบรับรอง A4</span>
          </button>

          {/* Resignation / Exit Flow Button (Strict restriction: member cannot unenroll unless admin approved) */}
          {currentUser?.canOptOutWelfare ? (
            <button
              type="button"
              onClick={handleOpenExitFlow}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-xl transition cursor-pointer"
              title="แอดมินอนุญาตให้ลาออกแล้ว คลิกเพื่อยืนยันออกจากระบบสวัสดิการ"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>ออกจากระบบสวัสดิการ (ได้รับอนุญาตแล้ว)</span>
            </button>
          ) : currentUser?.welfareResignationRequested ? (
            <button
              type="button"
              onClick={handleOpenExitFlow}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl transition cursor-pointer"
              title="ส่งคำร้องขอลาออกแล้ว อยู่ระหว่างรอผู้ดูแลระบบอนุมัติ"
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>รอแอดมินอนุมัติลาออก</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenExitFlow}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-slate-200 transition cursor-pointer"
              title="ต้องขออนุญาตจากผู้ดูแลระบบก่อน จึงจะสามารถออกจากระบบสวัสดิการได้"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ขอลาออกจากกองทุน</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress & Monthly Calculation Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Monthly Target & Contributed */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold">ยอดสมทบประจำเดือน</span>
            <span className="font-mono text-emerald-700 font-bold">{percentComplete}%</span>
          </div>

          <div className="mt-2">
            <div className="text-2xl font-extrabold text-slate-800">
              {wfSummary.currentMonthContributed.toFixed(2)}{' '}
              <span className="text-sm font-normal text-slate-500">
                / {wfSummary.monthlyTarget.toFixed(2)} บาท
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  wfSummary.isTargetMet ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200/80 text-xs">
            {wfSummary.isTargetMet ? (
              <span className="inline-flex items-center space-x-1 font-bold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>สมทบครบตามเกณฑ์รอบนี้แล้ว</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 font-bold text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>ยังขาดอีก {wfSummary.remainingShortfall.toFixed(2)} บาท</span>
              </span>
            )}
          </div>
        </div>

        {/* Metric 2: Waste Sales & Threshold Calculation */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold">ยอดขายขยะในเดือนนี้</span>
            <span className="text-[11px] text-slate-400">เกณฑ์: {welfareConfig.requiredWasteSalesThreshold.toFixed(2)} ฿</span>
          </div>

          <div className="mt-2">
            <div className="text-2xl font-extrabold text-teal-700">
              {wfSummary.currentMonthWasteSales.toFixed(2)}{' '}
              <span className="text-sm font-normal text-slate-500">บาท</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {wfSummary.currentMonthWasteSales >= welfareConfig.requiredWasteSalesThreshold ? (
                <span className="text-emerald-700 font-semibold">
                  ✓ ยอดขายขยะเพียงพอต่อการหักสมทบสวัสดิการ ({welfareConfig.monthlyContributionAmount} ฿)
                </span>
              ) : (
                <span className="text-slate-600">
                  ต้องการยอดขายขยะเพิ่มอีก{' '}
                  <span className="font-bold text-amber-700">
                    {(welfareConfig.requiredWasteSalesThreshold - wfSummary.currentMonthWasteSales).toFixed(2)}
                  </span>{' '}
                  บาท จึงจะพอหักยอดสวัสดิการ
                </span>
              )}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200/80 text-xs flex items-center justify-between">
            <span className="text-slate-500">ตัดยอดอัตโนมัติเมื่อขาย:</span>
            <button
              onClick={handleAutoDeductToggle}
              className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition ${
                wfSummary.autoDeduct 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {wfSummary.autoDeduct ? '✓ เปิดใช้งาน' : 'ปิดอยู่'}
            </button>
          </div>
        </div>

        {/* Metric 3: Waste Bank Balance & Quick Contribute */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold">ยอดเงินคงเหลือธนาคารขยะ</span>
            <span className="text-[11px] text-slate-400">คงต่ำสุด 50 ฿</span>
          </div>

          <div className="mt-2">
            <div className="text-2xl font-extrabold text-slate-800">
              {wasteSummary.currentBalance.toFixed(2)}{' '}
              <span className="text-sm font-normal text-slate-500">บาท</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {wasteSummary.maxWithdrawable > 0 ? (
                <span>
                  ยอดที่สามารถโอนสมทบได้: <strong className="text-emerald-700 font-mono">{wasteSummary.maxWithdrawable.toFixed(2)} บาท</strong>
                </span>
              ) : (
                <span className="text-rose-600 font-medium">
                  ยอดคงเหลือต่ำกว่าเกณฑ์ 50 บาท (โอนไม่ได้)
                </span>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200/80">
            <button
              onClick={() => {
                setTransferSource('waste_balance_deduct');
                setTransferAmount(wfSummary.remainingShortfall > 0 ? String(wfSummary.remainingShortfall) : '50');
                setIsTransferModalOpen(true);
              }}
              className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs transition flex items-center justify-center space-x-1"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>นำเงินมาสมทบกองทุน</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Contributions Snippet */}
      {myRecentContribs.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-slate-700">ประวัติการสมทบล่าสุดของคุณ:</span>
            <span className="text-slate-400">สมทบสะสมตลอดชีพ {wfSummary.totalLifetimeContributed.toFixed(2)} บาท</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {myRecentContribs.map((c) => (
              <div key={c.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">
                    {c.source === 'waste_deposit' && '♻️ หักจากเงินฝากขายขยะ'}
                    {c.source === 'cash_topup' && '💵 นำเงินสดมาฝาก'}
                    {c.source === 'waste_balance_deduct' && '🏦 หักโอนจากเงินขยะ'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{c.date} • {c.receiptNumber}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="font-mono font-bold text-emerald-700 text-sm">
                    +{c.amount.toFixed(2)} ฿
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReceiptContribId(c.id);
                      setIsReceiptModalOpen(true);
                    }}
                    title="พิมพ์ใบเสร็จเงินสวัสดิการสำหรับรายการนี้"
                    className="p-1 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-md transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Coins className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-base">สมทบเงินเข้ากองทุนสวัสดิการ</h3>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleContributeSubmit} className="space-y-4">
              {/* Select Source */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  เลือกช่องทางการนำเงินมาสมทบ:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setTransferSource('waste_balance_deduct')}
                    className={`p-3 rounded-xl border text-left transition ${
                      transferSource === 'waste_balance_deduct'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                      <span>โอนจากเงินธนาคารขยะ</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal mt-1">
                      มีเงินถอนได้: {wasteSummary.maxWithdrawable.toFixed(2)} ฿
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTransferSource('cash_topup')}
                    className={`p-3 rounded-xl border text-left transition ${
                      transferSource === 'cash_topup'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <Coins className="w-4 h-4 text-emerald-600" />
                      <span>นำเงินสดมาฝากสมทบ</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal mt-1">
                      ฝาก ณ กองคลัง อบต.ตาคลี
                    </div>
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  จำนวนเงินที่ต้องการสมทบ (บาท):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full text-base font-mono font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    placeholder="50.00"
                    required
                  />
                  <span className="absolute right-3.5 top-3 text-xs text-slate-400">บาท</span>
                </div>
                {wfSummary.remainingShortfall > 0 && (
                  <p className="text-[11px] text-amber-700 mt-1">
                    * ยอดค้างสมทบประจำเดือนนี้: {wfSummary.remainingShortfall.toFixed(2)} บาท
                  </p>
                )}
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  บันทึกเพิ่มเติม (ไม่บังคับ):
                </label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  placeholder="เช่น สมทบประจำเดือนกันยายน 2026"
                />
              </div>

              {actionError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {actionSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
                >
                  ยืนยันการสมทบเงิน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Welfare Receipt Modal (A4 Printable) */}
      <WelfareReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        memberCode={memberCode}
        selectedContributionId={selectedReceiptContribId}
      />

      {/* Welfare Resignation Request Modal (Admin must approve before member can exit) */}
      {isExitRequestModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-800 text-base">
                  ยื่นคำร้องขออนุญาตลาออกจากระบบสวัสดิการ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsExitRequestModalOpen(false);
                  setExitMsg(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Regulation Notice */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>ระเบียบกองทุนสวัสดิการสงเคราะห์พนักงาน อบต.ตาคลี:</strong> สมาชิกไม่สามารถกดยกเลิกระบบด้วยตนเองได้ทันที จำเป็นต้องส่งคำร้องให้เจ้าหน้าที่ผู้ดูแลระบบ (Admin) ตรวจสอบภาระการสมทบและอนุญาตก่อน จึงจะสามารถกดยืนยันออกจากระบบได้
              </div>
            </div>

            {/* If user has already submitted a pending request */}
            {currentUser?.welfareResignationRequested ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                  <span className="font-bold text-slate-800">
                    สถานะ: ส่งคำร้องแล้ว รอผู้ดูแลระบบพิจารณาอนุมัติ
                  </span>
                </div>
                <div className="text-slate-600">
                  วันที่ยื่นคำร้อง: <span className="font-semibold text-slate-800">{currentUser.welfareResignationDate}</span>
                </div>
                <div className="text-slate-600">
                  เหตุผลที่ระบุ: <span className="text-slate-800 italic">"{currentUser.welfareResignationReason || 'ไม่ระบุ'}"</span>
                </div>
                <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                  ขณะนี้เรื่องอยู่ระหว่างการพิจารณาโดยผู้ดูแลระบบ อบต.ตาคลี เมื่อได้รับอนุมัติแล้ว ปุ่ม 'ออกจากระบบสวัสดิการ' ในหน้านี้จะเปิดสิทธิ์ให้ท่านกดยืนยันการลาออกได้ทันที
                </p>
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsExitRequestModalOpen(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    รับทราบและปิด
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitExitRequest} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เหตุผลความจำเป็นในการขอลาออก <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={exitReason}
                    onChange={(e) => setExitReason(e.target.value)}
                    required
                    placeholder="เช่น ย้ายสังกัดสำนัก/กอง, เกษียณอายุราชการ, ลาออกจากงาน, หรือเหตุผลความจำเป็นส่วนตัว..."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    ข้อมูลนี้จะถูกส่งไปยังหน้ากระดานผู้ดูแลระบบ (Admin Panel) เพื่อประกอบการพิจารณาเปิดสิทธิ์
                  </p>
                </div>

                {exitMsg && (
                  <div className={`p-2.5 rounded-xl border text-xs flex items-center space-x-1.5 ${
                    exitMsg.isError ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}>
                    {exitMsg.isError ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    <span>{exitMsg.text}</span>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsExitRequestModalOpen(false);
                      setExitMsg(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    ส่งคำร้องขออนุญาตต่อผู้ดูแลระบบ
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Confirm Exit Modal (Only active if canOptOutWelfare === true) */}
      {isConfirmExitModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <LogOut className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-800 text-base">
                  ยืนยันการออกจากระบบสวัสดิการสงเคราะห์
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmExitModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong>ผู้ดูแลระบบได้อนุมัติคำร้องของท่านเรียบร้อยแล้ว:</strong> ท่านได้รับสิทธิ์ในการกดยืนยันเพื่อออกจากระบบเงินสวัสดิการสงเคราะห์พนักงาน
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              เมื่อยืนยันออกจากระบบ ระบบจะไม่ทำการหักเงินสมทบรายเดือนอีกต่อไป และสิทธิประโยชน์คุ้มครอง 4 ด้านจะสิ้นสุดลง ทั้งนี้ท่านยังคงสามารถนำขยะมาฝากและใช้งานบัญชีธนาคารขยะได้ตามปกติ
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmExitModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                ยกเลิก (ยังคงอยู่ในระบบ)
              </button>
              <button
                type="button"
                onClick={handleFinalExitConfirm}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                ยืนยันการออกจากระบบสวัสดิการ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
