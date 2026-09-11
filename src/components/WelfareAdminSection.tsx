import React, { useState } from 'react';
import { useWasteBank } from '../context/WasteBankContext';
import { 
  HeartHandshake, 
  Settings, 
  Coins, 
  Plus, 
  Search, 
  Printer, 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingDown, 
  TrendingUp, 
  FileText, 
  Calendar,
  Wallet,
  Users,
  DollarSign,
  ArrowDownLeft,
  X,
  Play,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WelfareExpenseCategory, WelfareContributionSource } from '../types';

interface WelfareAdminSectionProps {
  onOpenStatementForMember: (memberCode: string) => void;
  onOpenAlertsForMember: (memberCode: string) => void;
}

export const WelfareAdminSection: React.FC<WelfareAdminSectionProps> = ({
  onOpenStatementForMember,
  onOpenAlertsForMember
}) => {
  const { 
    users, 
    welfareConfig, 
    welfareContributions, 
    welfareExpenses, 
    updateWelfareConfig, 
    recordWelfareExpense, 
    batchDeductMonthlyWelfare, 
    contributeToWelfare, 
    toggleWelfareEnrollment, 
    toggleUserWelfareOptOutPermission,
    getAllMembersWelfareSummary, 
    getWelfareFundStats 
  } = useWasteBank();

  const fundStats = getWelfareFundStats();
  const allSummaries = getAllMembersWelfareSummary();

  // Pending exit requests awaiting admin approval
  const pendingExitRequests = users.filter(u => u.welfareEnrolled && u.welfareResignationRequested && !u.canOptOutWelfare);

  // Active view within welfare management
  const [subView, setSubView] = useState<'roster' | 'expenses' | 'settings'>('roster');
  const [memberFilter, setMemberFilter] = useState<'all' | 'enrolled' | 'not_enrolled' | 'met' | 'shortfall' | 'resignation'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Settings form state
  const [monthlyAmount, setMonthlyAmount] = useState<string>(String(welfareConfig.monthlyContributionAmount));
  const [thresholdAmount, setThresholdAmount] = useState<string>(String(welfareConfig.requiredWasteSalesThreshold));
  const [currentMonth, setCurrentMonth] = useState<string>(welfareConfig.currentMonth);
  const [funeralAmt, setFuneralAmt] = useState<string>(String(welfareConfig.benefitCoverageDetails.funeralAssistance));
  const [medicalAmt, setMedicalAmt] = useState<string>(String(welfareConfig.benefitCoverageDetails.medicalAssistance));
  const [childbirthAmt, setChildbirthAmt] = useState<string>(String(welfareConfig.benefitCoverageDetails.childbirthAssistance));
  const [scholarshipAmt, setScholarshipAmt] = useState<string>(String(welfareConfig.benefitCoverageDetails.scholarshipAssistance));
  const [settingsSaved, setSettingsSaved] = useState<boolean>(false);

  // Disbursement (Expense) modal state
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [expenseTitle, setExpenseTitle] = useState<string>('');
  const [expenseCategory, setExpenseCategory] = useState<WelfareExpenseCategory>('ฌาปนกิจสงเคราะห์');
  const [expenseAmount, setExpenseAmount] = useState<string>('3000');
  const [expenseRecipient, setExpenseRecipient] = useState<string>('');
  const [expenseMemberCode, setExpenseMemberCode] = useState<string>('MB001');
  const [expenseApprovedBy, setExpenseApprovedBy] = useState<string>('นายก อบต.ตาคลี');
  const [expenseNote, setExpenseNote] = useState<string>('');
  const [expenseMsg, setExpenseMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Batch process result modal state
  const [batchResult, setBatchResult] = useState<{
    processedCount: number;
    successCount: number;
    insufficientCount: number;
    details: string[]
  } | null>(null);

  // Quick contribute modal state
  const [quickContribMember, setQuickContribMember] = useState<{ memberCode: string; name: string } | null>(null);
  const [quickContribAmount, setQuickContribAmount] = useState<string>('50');
  const [quickContribSource, setQuickContribSource] = useState<WelfareContributionSource>('cash_topup');
  const [quickContribMsg, setQuickContribMsg] = useState<string>('');

  // Filtered members
  const filteredSummaries = allSummaries.filter(m => {
    const matchesSearch = 
      m.memberName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.memberCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.department.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (memberFilter === 'enrolled') return m.isEnrolled;
    if (memberFilter === 'not_enrolled') return !m.isEnrolled;
    if (memberFilter === 'met') return m.isEnrolled && m.isTargetMet;
    if (memberFilter === 'shortfall') return m.isEnrolled && !m.isTargetMet;
    if (memberFilter === 'resignation') {
      const u = users.find(user => user.memberCode === m.memberCode);
      return u?.welfareResignationRequested === true;
    }

    return true;
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateWelfareConfig({
      monthlyContributionAmount: parseFloat(monthlyAmount) || 50,
      requiredWasteSalesThreshold: parseFloat(thresholdAmount) || 50,
      currentMonth,
      benefitCoverageDetails: {
        funeralAssistance: parseFloat(funeralAmt) || 3000,
        medicalAssistance: parseFloat(medicalAmt) || 1000,
        childbirthAssistance: parseFloat(childbirthAmt) || 1500,
        scholarshipAssistance: parseFloat(scholarshipAmt) || 1000
      }
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const handleRunBatchDeduct = () => {
    if (confirm(`คุณต้องการประมวลผลหักยอดเงินสมทบสวัสดิการประจำเดือน ${welfareConfig.currentMonth} จากบัญชีธนาคารขยะของสมาชิกที่เข้าร่วมทุกคนใช่หรือไม่? (เฉพาะสมาชิกที่มีเงินคงเหลือเพียงพอตามเกณฑ์ 50 บาท)`)) {
      const res = batchDeductMonthlyWelfare();
      setBatchResult(res);
      if (res.successCount > 0) {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
  };

  const handleDisburseExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseMsg(null);

    const amt = parseFloat(expenseAmount);
    if (isNaN(amt) || amt <= 0) {
      setExpenseMsg({ text: 'กรุณาระบุจำนวนเงินที่มากกว่า 0 บาท', isError: true });
      return;
    }

    if (!expenseTitle.trim() || !expenseRecipient.trim()) {
      setExpenseMsg({ text: 'กรุณาระบุหัวข้อและชื่อผู้รับเงิน', isError: true });
      return;
    }

    const res = recordWelfareExpense({
      date: `${String(new Date().getDate()).padStart(2, '0')}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`,
      title: expenseTitle,
      category: expenseCategory,
      amount: amt,
      recipientName: expenseRecipient,
      recipientMemberCode: expenseMemberCode,
      approvedBy: expenseApprovedBy,
      month: welfareConfig.currentMonth,
      note: expenseNote
    });

    if (res.success) {
      setExpenseMsg({ text: res.message, isError: false });
      setExpenseTitle('');
      setExpenseRecipient('');
      setExpenseNote('');
      setTimeout(() => {
        setShowExpenseModal(false);
        setExpenseMsg(null);
      }, 1500);
    }
  };

  const handleQuickContribSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickContribMember) return;

    const amt = parseFloat(quickContribAmount);
    if (isNaN(amt) || amt <= 0) {
      setQuickContribMsg('กรุณาระบุจำนวนเงินที่มากกว่า 0 บาท');
      return;
    }

    const res = contributeToWelfare(
      quickContribMember.memberCode,
      amt,
      quickContribSource,
      `เจ้าหน้าที่กองคลังบันทึกสมทบประจำเดือน ${welfareConfig.currentMonth}`
    );

    if (res.success) {
      setQuickContribMsg(`✓ ${res.message}`);
      setTimeout(() => {
        setQuickContribMember(null);
        setQuickContribMsg('');
      }, 1500);
    } else {
      setQuickContribMsg(`⚠️ ${res.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welfare Header & Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Fund Pool */}
        <div className="bg-gradient-to-br from-emerald-800 to-teal-950 text-white rounded-2xl p-5 border border-emerald-700 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
              ยอดเงินกองทุนสะสมสุทธิ
            </span>
            <div className="p-2 bg-white/10 rounded-xl">
              <HeartHandshake className="w-5 h-5 text-emerald-300" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold tracking-tight">
              {fundStats.totalFundPool.toFixed(2)}{' '}
              <span className="text-sm font-normal text-emerald-200">บาท</span>
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-white/10 text-xs text-emerald-200 flex justify-between">
            <span>สมทบสะสมทั้งหมด:</span>
            <span className="font-mono font-bold text-white">+{fundStats.totalCollected.toFixed(2)} ฿</span>
          </div>
        </div>

        {/* Metric 2: Monthly Expenses Used (Matches user prompt!) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              เบิกจ่ายสวัสดิการเดือนนี้
            </span>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-rose-600 tracking-tight">
              {fundStats.currentMonthExpenses.toFixed(2)}{' '}
              <span className="text-sm font-normal text-slate-500">บาท</span>
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>เบิกจ่ายสะสมตลอดชีพ:</span>
            <span className="font-mono font-semibold text-slate-700">-{fundStats.totalExpenses.toFixed(2)} ฿</span>
          </div>
        </div>

        {/* Metric 3: Enrolled Members Ratio */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              สมาชิกที่เข้าร่วมกองทุน
            </span>
            <div className="p-2 bg-teal-50 rounded-xl text-teal-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-800 tracking-tight">
              {fundStats.enrolledMembersCount}{' '}
              <span className="text-sm font-normal text-slate-500">คน</span>
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>สมาชิกเข้าร่วมกองทุน:</span>
            <span className="font-semibold text-emerald-700">
              {fundStats.enrolledMembersCount} คน (สมัครใจ)
            </span>
          </div>
        </div>

        {/* Metric 4: Monthly Target Status */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              สถานะรอบ {welfareConfig.currentMonth}
            </span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-extrabold text-emerald-700">{fundStats.targetMetCount}</span>
              <span className="text-xs text-slate-500">ครบเกณฑ์</span>
              <span className="text-slate-300">•</span>
              <span className="text-2xl font-extrabold text-amber-600">{fundStats.shortfallCount}</span>
              <span className="text-xs text-slate-500">ยังค้างยอด</span>
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>เกณฑ์สมทบ:</span>
            <span className="font-semibold text-slate-800">{welfareConfig.monthlyContributionAmount.toFixed(2)} ฿/เดือน</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex space-x-2">
          <button
            onClick={() => setSubView('roster')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition ${
              subView === 'roster'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทะเบียนสมาชิกสวัสดิการ & ตรวจสอบยอด
          </button>
          <button
            onClick={() => setSubView('expenses')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition ${
              subView === 'expenses'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ประวัติการเบิกจ่ายสวัสดิการ ({welfareExpenses.length})
          </button>
          <button
            onClick={() => setSubView('settings')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition flex items-center space-x-1.5 ${
              subView === 'settings'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>ตั้งค่าเกณฑ์ & สิทธิประโยชน์</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>เบิกจ่ายเงินสวัสดิการ</span>
          </button>

          <button
            onClick={handleRunBatchDeduct}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition"
          >
            <Play className="w-4 h-4" />
            <span>ประมวลผลหักยอดอัตโนมัติ</span>
          </button>
        </div>
      </div>

      {/* SUBVIEW 1: MEMBER WELFARE ROSTER */}
      {subView === 'roster' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setMemberFilter('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                  memberFilter === 'all' ? 'bg-emerald-800 text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                ทั้งหมด ({allSummaries.length})
              </button>
              <button
                onClick={() => setMemberFilter('enrolled')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                  memberFilter === 'enrolled' ? 'bg-emerald-800 text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                เข้าร่วมแล้ว ({fundStats.enrolledMembersCount})
              </button>
              <button
                onClick={() => setMemberFilter('met')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                  memberFilter === 'met' ? 'bg-emerald-800 text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                ✓ สมทบครบแล้ว ({fundStats.targetMetCount})
              </button>
              <button
                onClick={() => setMemberFilter('shortfall')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                  memberFilter === 'shortfall' ? 'bg-emerald-800 text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                ⚠️ ยังค้างยอด ({fundStats.shortfallCount})
              </button>
              <button
                onClick={() => setMemberFilter('not_enrolled')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                  memberFilter === 'not_enrolled' ? 'bg-emerald-800 text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                ยังไม่เข้าร่วม ({allSummaries.length - fundStats.enrolledMembersCount})
              </button>
              <button
                onClick={() => setMemberFilter('resignation')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                  memberFilter === 'resignation' ? 'bg-amber-800 text-white' : 'bg-white text-amber-900 border border-amber-300'
                }`}
              >
                🔔 คำขอลาออก ({users.filter(u => u.welfareResignationRequested).length})
              </button>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหารหัส, ชื่อ, ส่วนงาน..."
                className="w-full text-xs pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
              />
            </div>
          </div>

          {/* Pending Exit Requests Panel */}
          {pendingExitRequests.length > 0 && (
            <div className="p-4 bg-amber-50/90 border-b border-amber-200">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                    มีคำขอยกเลิกสวัสดิการสงเคราะห์รอการพิจารณา ({pendingExitRequests.length} รายการ)
                  </h4>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    ตามระเบียบ อบต.ตาคลี สมาชิกไม่สามารถกดยกเลิกสวัสดิการได้เองจนกว่าผู้ดูแลระบบจะตรวจสอบและอนุญาต
                  </p>

                  <div className="mt-2.5 space-y-2">
                    {pendingExitRequests.map(reqUser => (
                      <div key={reqUser.id} className="p-2.5 bg-white rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-slate-800">{reqUser.name}</span>
                            <span className="font-mono text-[11px] text-slate-500">({reqUser.memberCode})</span>
                            <span className="text-[11px] text-slate-600">• {reqUser.department}</span>
                          </div>
                          {reqUser.welfareResignationReason && (
                            <div className="text-[11px] text-slate-600 mt-0.5">
                              เหตุผล: <span className="font-medium text-slate-800">{reqUser.welfareResignationReason}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              toggleUserWelfareOptOutPermission(reqUser.memberCode, true, 'ผู้ดูแลระบบตรวจสอบและอนุญาตให้ลาออก');
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
                          >
                            ✓ อนุญาตให้ลาออก
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              toggleUserWelfareOptOutPermission(reqUser.memberCode, false, 'ปฏิเสธคำขอยกเลิกสวัสดิการ');
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded-lg text-xs transition cursor-pointer"
                          >
                            ปฏิเสธ
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Roster Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">รหัส / ชื่อพนักงาน</th>
                  <th className="p-3.5">สถานะการเข้าร่วม</th>
                  <th className="p-3.5 text-right">สมทบเดือนนี้ / เป้าหมาย</th>
                  <th className="p-3.5 text-right">ยอดขายขยะเดือนนี้</th>
                  <th className="p-3.5 text-right">เงินคงเหลือในบัญชีขยะ</th>
                  <th className="p-3.5 text-center">จัดการ & การทำงาน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      ไม่พบข้อมูลสมาชิกตามเงื่อนไข
                    </td>
                  </tr>
                ) : (
                  filteredSummaries.map((m) => {
                    const memberUser = users.find(u => u.memberCode === m.memberCode);

                    return (
                    <tr key={m.memberCode} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800">{m.memberName}</div>
                        <div className="text-[11px] text-slate-500">
                          {m.memberCode} • <span className="text-slate-600">{m.department}</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        {m.isEnrolled ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <span>✓ เข้าร่วม</span>
                            </span>
                            {m.autoDeduct && (
                              <div className="text-[10px] text-slate-400">หักอัตโนมัติ: เปิด</div>
                            )}
                            {memberUser?.welfareResignationRequested && (
                              <div className="mt-1">
                                {memberUser.canOptOutWelfare ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                                    ✓ อนุญาตลาออกแล้ว
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                    🔔 ขอลาออก (รออนุมัติ)
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => toggleWelfareEnrollment(m.memberCode, true, true)}
                            className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition"
                          >
                            + สมัครเข้าร่วม
                          </button>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        {m.isEnrolled ? (
                          <div>
                            <div className="font-mono font-bold text-slate-800">
                              {m.currentMonthContributed.toFixed(2)}{' '}
                              <span className="text-slate-400 font-normal">/ {m.monthlyTarget.toFixed(2)} ฿</span>
                            </div>
                            {m.isTargetMet ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md">
                                ครบตามเกณฑ์
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-md">
                                ขาดอีก {m.remainingShortfall.toFixed(2)} ฿
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="p-3.5 text-right font-mono">
                        <div className="font-semibold text-teal-800">{m.currentMonthWasteSales.toFixed(2)} ฿</div>
                        <div className="text-[10px] text-slate-400">
                          {m.currentMonthWasteSales >= welfareConfig.requiredWasteSalesThreshold ? (
                            <span className="text-emerald-600">✓ พอหักยอด</span>
                          ) : (
                            <span>ขาดอีก {(welfareConfig.requiredWasteSalesThreshold - m.currentMonthWasteSales).toFixed(2)} ฿</span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 text-right font-mono">
                        <div className="font-bold text-slate-800">{m.wasteBalanceAvailable.toFixed(2)} ฿</div>
                        <div className="text-[10px] text-slate-400">(คงถอนได้)</div>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {m.isEnrolled && (
                            <button
                              onClick={() => {
                                setQuickContribMember({ memberCode: m.memberCode, name: m.memberName });
                                setQuickContribAmount(m.remainingShortfall > 0 ? String(m.remainingShortfall) : '50');
                              }}
                              title="บันทึกรับเงินสมทบสด หรือหักโอนจากเงินขยะ"
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <Coins className="w-4 h-4" />
                            </button>
                          )}

                          {/* Admin toggle for member welfare opt-out permission */}
                          {m.isEnrolled && (
                            memberUser?.canOptOutWelfare ? (
                              <button
                                type="button"
                                onClick={() => toggleUserWelfareOptOutPermission(m.memberCode, false)}
                                title="ยกเลิกสิทธิ์ลาออก (สมาชิกจะไม่สามารถกดยกเลิกเองได้)"
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-[10px] font-bold transition cursor-pointer"
                              >
                                ระงับสิทธิ์ลาออก
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => toggleUserWelfareOptOutPermission(m.memberCode, true, 'ผู้ดูแลระบบอนุญาตให้ลาออก')}
                                title={memberUser?.welfareResignationRequested ? `อนุมัติคำขอลาออก (เหตุผล: ${memberUser.welfareResignationReason || 'ไม่ระบุ'})` : 'อนุญาตให้สมาชิกลาออกจากสวัสดิการได้'}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                  memberUser?.welfareResignationRequested
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-2xs'
                                    : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200'
                                }`}
                              >
                                {memberUser?.welfareResignationRequested ? '✓ อนุมัติลาออก' : 'อนุญาตลาออก'}
                              </button>
                            )
                          )}

                          <button
                            onClick={() => onOpenStatementForMember(m.memberCode)}
                            title="พิมพ์ใบรับรองสวัสดิการ A4"
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onOpenAlertsForMember(m.memberCode)}
                            title="ส่งแจ้งเตือน Telegram / Email"
                            className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition"
                          >
                            <Bell className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => toggleWelfareEnrollment(m.memberCode, !m.isEnrolled, !m.isEnrolled)}
                            title={m.isEnrolled ? 'ยกเลิกการเข้าร่วม' : 'เข้าร่วมกองทุน'}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBVIEW 2: EXPENSES DISBURSEMENT HISTORY */}
      {subView === 'expenses' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                รายการเบิกจ่ายเงินสวัสดิการสงเคราะห์แก่สมาชิก (ทั้งหมด {welfareExpenses.length} รายการ)
              </h3>
              <p className="text-xs text-slate-500">
                รวมเงินสวัสดิการที่จ่ายไปทั้งสิ้น: <strong className="text-rose-600">{fundStats.totalExpenses.toFixed(2)} บาท</strong> (รอบเดือน {welfareConfig.currentMonth}: {fundStats.currentMonthExpenses.toFixed(2)} บาท)
              </p>
            </div>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>บันทึกเบิกจ่ายใหม่</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3.5">เลขที่ใบสำคัญ / วันที่</th>
                  <th className="p-3.5">รายการช่วยเหลือ</th>
                  <th className="p-3.5">หมวดหมู่สวัสดิการ</th>
                  <th className="p-3.5">ผู้ได้รับสวัสดิการ</th>
                  <th className="p-3.5">ผู้อนุมัติ</th>
                  <th className="p-3.5 text-right">จำนวนเงิน (฿)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {welfareExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      ยังไม่มีประวัติการเบิกจ่ายสวัสดิการ
                    </td>
                  </tr>
                ) : (
                  welfareExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-slate-800">{exp.voucherNumber}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{exp.date}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800">{exp.title}</div>
                        {exp.note && <div className="text-[11px] text-slate-500 mt-0.5">{exp.note}</div>}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-medium text-slate-800">{exp.recipientName}</div>
                        {exp.recipientMemberCode && (
                          <div className="text-[11px] text-slate-500">รหัส: {exp.recipientMemberCode}</div>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {exp.approvedBy}
                      </td>
                      <td className="p-3.5 text-right font-mono font-extrabold text-rose-600 text-sm">
                        -{exp.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300">
                  <td colSpan={5} className="p-3 text-right">
                    รวมยอดจ่ายสวัสดิการทั้งหมด:
                  </td>
                  <td className="p-3 text-right font-mono text-rose-600 text-base">
                    -{fundStats.totalExpenses.toFixed(2)} ฿
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* SUBVIEW 3: SETTINGS & POLICIES (Matching user prompt requirement!) */}
      {subView === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 max-w-4xl">
          <div className="pb-4 mb-6 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                ระบบตั้งค่ากองทุนสวัสดิการสงเคราะห์พนักงาน อบต.ตาคลี
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                กำหนดอัตราเงินสมทบรายเดือน, เกณฑ์ยอดขายขยะขั้นต่ำ, และสิทธิประโยชน์การช่วยเหลือ
              </p>
            </div>
            {settingsSaved && (
              <span className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>บันทึกการตั้งค่าเรียบร้อยแล้ว!</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Monthly Contribution Amount */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  1. ยอดเงินสวัสดิการสงเคราะห์ที่หักสมทบต่อเดือน (บาท):
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  ยอดเงินที่สมาชิกต้องสมทบในแต่ละเดือนเพื่อรักษาสิทธิสวัสดิการ
                </p>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="10"
                    value={monthlyAmount}
                    onChange={(e) => setMonthlyAmount(e.target.value)}
                    className="w-full text-base font-mono font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
                    required
                  />
                  <span className="absolute right-3.5 top-3 text-xs text-slate-400">บาท/เดือน</span>
                </div>
              </div>

              {/* Required Waste Sales Threshold */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  2. เกณฑ์ยอดขายขยะหรือนำเงินฝากเพื่อให้พอหักยอดสวัสดิการ (บาท):
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  สมาชิกต้องขายขยะหรือนำเงินมาฝากเท่าไรในเดือนนั้น จึงจะพอหักยอดสวัสดิการ
                </p>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="10"
                    value={thresholdAmount}
                    onChange={(e) => setThresholdAmount(e.target.value)}
                    className="w-full text-base font-mono font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
                    required
                  />
                  <span className="absolute right-3.5 top-3 text-xs text-slate-400">บาท/เดือน</span>
                </div>
              </div>

              {/* Current Active Month */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 md:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  3. รอบเดือนปัจจุบันที่กำลังเปิดรับการสมทบ:
                </label>
                <input
                  type="text"
                  value={currentMonth}
                  onChange={(e) => setCurrentMonth(e.target.value)}
                  className="w-full text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
                  placeholder="เช่น กันยายน 2026"
                  required
                />
              </div>
            </div>

            {/* 4 Benefit Coverage Details */}
            <div className="bg-emerald-50/40 p-5 rounded-xl border border-emerald-200">
              <h4 className="font-bold text-emerald-950 text-sm mb-3 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>กำหนดอัตราวงเงินช่วยเหลือสวัสดิการ 4 ด้าน:</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    เงินช่วยเหลือฌาปนกิจ:
                  </label>
                  <input
                    type="number"
                    value={funeralAmt}
                    onChange={(e) => setFuneralAmt(e.target.value)}
                    className="w-full font-mono font-bold px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                  <span className="text-[10px] text-slate-400">บาท/กรณี</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    เงินช่วยเหลือค่ารักษาพยาบาล:
                  </label>
                  <input
                    type="number"
                    value={medicalAmt}
                    onChange={(e) => setMedicalAmt(e.target.value)}
                    className="w-full font-mono font-bold px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                  <span className="text-[10px] text-slate-400">บาท/กรณี</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    เงินขวัญถุงคลอดบุตร:
                  </label>
                  <input
                    type="number"
                    value={childbirthAmt}
                    onChange={(e) => setChildbirthAmt(e.target.value)}
                    className="w-full font-mono font-bold px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                  <span className="text-[10px] text-slate-400">บาท/กรณี</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ทุนการศึกษาบุตรพนักงาน:
                  </label>
                  <input
                    type="number"
                    value={scholarshipAmt}
                    onChange={(e) => setScholarshipAmt(e.target.value)}
                    className="w-full font-mono font-bold px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                  <span className="text-[10px] text-slate-400">บาท/ปี</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition"
              >
                บันทึกการตั้งค่ากองทุนสวัสดิการ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: DISBURSE WELFARE EXPENSE */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-800 text-base">บันทึกเบิกจ่ายเงินสวัสดิการสงเคราะห์</h3>
              </div>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDisburseExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมวดหมู่เงินสวัสดิการ:
                </label>
                <select
                  value={expenseCategory}
                  onChange={(e) => {
                    const cat = e.target.value as WelfareExpenseCategory;
                    setExpenseCategory(cat);
                    if (cat === 'ฌาปนกิจสงเคราะห์') setExpenseAmount(String(welfareConfig.benefitCoverageDetails.funeralAssistance));
                    if (cat === 'รักษาพยาบาล/เจ็บป่วย') setExpenseAmount(String(welfareConfig.benefitCoverageDetails.medicalAssistance));
                    if (cat === 'คลอดบุตร') setExpenseAmount(String(welfareConfig.benefitCoverageDetails.childbirthAssistance));
                    if (cat === 'ทุนการศึกษาบุตร') setExpenseAmount(String(welfareConfig.benefitCoverageDetails.scholarshipAssistance));
                  }}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                >
                  <option value="ฌาปนกิจสงเคราะห์">ฌาปนกิจสงเคราะห์ ({welfareConfig.benefitCoverageDetails.funeralAssistance} ฿)</option>
                  <option value="รักษาพยาบาล/เจ็บป่วย">รักษาพยาบาล/เจ็บป่วย ({welfareConfig.benefitCoverageDetails.medicalAssistance} ฿)</option>
                  <option value="คลอดบุตร">คลอดบุตร ({welfareConfig.benefitCoverageDetails.childbirthAssistance} ฿)</option>
                  <option value="ทุนการศึกษาบุตร">ทุนการศึกษาบุตร ({welfareConfig.benefitCoverageDetails.scholarshipAssistance} ฿)</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หัวข้อ / รายการเบิกจ่าย:
                </label>
                <input
                  type="text"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="เช่น เงินช่วยเหลือฌาปนกิจสงเคราะห์ (บิดาสมาชิกเสียชีวิต)"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    สมาชิกผู้เอาประกัน:
                  </label>
                  <select
                    value={expenseMemberCode}
                    onChange={(e) => {
                      setExpenseMemberCode(e.target.value);
                      const m = users.find(u => u.memberCode === e.target.value);
                      if (m) setExpenseRecipient(m.name);
                    }}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    {users.filter(u => u.role === 'member').map(u => (
                      <option key={u.id} value={u.memberCode}>
                        {u.memberCode} - {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อผู้รับเงิน:
                  </label>
                  <input
                    type="text"
                    value={expenseRecipient}
                    onChange={(e) => setExpenseRecipient(e.target.value)}
                    placeholder="ชื่อ-สกุลผู้รับเงิน"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    จำนวนเงิน (บาท):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full text-sm font-mono font-bold px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ผู้อนุมัติ:
                  </label>
                  <input
                    type="text"
                    value={expenseApprovedBy}
                    onChange={(e) => setExpenseApprovedBy(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมายเหตุ / เอกสารอ้างอิง:
                </label>
                <input
                  type="text"
                  value={expenseNote}
                  onChange={(e) => setExpenseNote(e.target.value)}
                  placeholder="เช่น มติคณะกรรมการข้อ 12 / ใบมรณบัตรเลขที่..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              {expenseMsg && (
                <div className={`p-2.5 rounded-xl text-xs flex items-center space-x-1.5 ${
                  expenseMsg.isError ? 'bg-rose-50 border border-rose-200 text-rose-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                }`}>
                  {expenseMsg.isError ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{expenseMsg.text}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition"
                >
                  บันทึกเบิกจ่ายสวัสดิการ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BATCH DEDUCT RESULT */}
      {batchResult && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-base">
                  ผลการประมวลผลหักยอดสมทบสวัสดิการอัตโนมัติ
                </h3>
              </div>
              <button
                onClick={() => setBatchResult(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="text-slate-500">ตรวจสอบทั้งหมด</div>
                <div className="text-lg font-bold text-slate-800 mt-0.5">{batchResult.processedCount} คน</div>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <div className="text-emerald-700">หักสำเร็จ</div>
                <div className="text-lg font-bold text-emerald-800 mt-0.5">{batchResult.successCount} คน</div>
              </div>
              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                <div className="text-amber-700">เงินไม่พอหัก (ขาด)</div>
                <div className="text-lg font-bold text-amber-800 mt-0.5">{batchResult.insufficientCount} คน</div>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-xs">
              {batchResult.details.length === 0 ? (
                <div className="text-slate-400 text-center py-2">
                  สมาชิกทุกคนได้สมทบครบตามเกณฑ์รอบเดือนนี้แล้ว
                </div>
              ) : (
                batchResult.details.map((item, idx) => (
                  <div key={idx} className="text-slate-700 leading-relaxed">
                    {item}
                  </div>
                ))
              )}
            </div>

            <div className="text-[11px] text-slate-500">
              * กฎควบคุมความปลอดภัย: ระบบจะตัดยอดเฉพาะเมื่อสมาชิกมียอดคงเหลือหลังหักไม่ต่ำกว่า 50.00 บาทเท่านั้น
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setBatchResult(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl"
              >
                รับทราบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: QUICK CONTRIBUTE / TOP-UP FOR MEMBER */}
      {quickContribMember && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Coins className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-slate-800 text-base">รับฝาก/หักเงินสมทบสวัสดิการ</h3>
                  <p className="text-xs text-slate-500">
                    {quickContribMember.memberCode} - {quickContribMember.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickContribMember(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickContribSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ช่องทางการรับเงินสมทบ:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setQuickContribSource('cash_topup')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      quickContribSource === 'cash_topup'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    💵 รับเงินสด ณ กองคลัง
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickContribSource('waste_balance_deduct')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      quickContribSource === 'waste_balance_deduct'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    🏦 หักจากเงินขยะ
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  จำนวนเงินสมทบ (บาท):
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={quickContribAmount}
                  onChange={(e) => setQuickContribAmount(e.target.value)}
                  className="w-full text-base font-mono font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  required
                />
              </div>

              {quickContribMsg && (
                <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-medium">
                  {quickContribMsg}
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickContribMember(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
                >
                  ยืนยันการรับสมทบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
