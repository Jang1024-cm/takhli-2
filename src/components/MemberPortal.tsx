import React, { useState, useMemo } from 'react';
import { useWasteBank } from '../context/WasteBankContext';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Leaf, 
  TreePine, 
  History, 
  Sparkles, 
  FileText,
  Filter,
  DollarSign,
  Search,
  RotateCcw,
  Calendar,
  BarChart3,
  PieChart as PieIcon,
  Tag,
  Camera,
  CreditCard,
  SlidersHorizontal,
  ChevronRight,
  Printer,
  Scale,
  Receipt
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  PieChart, 
  Pie, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import confetti from 'canvas-confetti';
import { WelfareMemberCard } from './WelfareMemberCard';
import { MemberProfileModal } from './MemberProfileModal';
import { WeightSlipModal } from './WeightSlipModal';
import { MonthlySalesReceiptModal } from './MonthlySalesReceiptModal';
import { WelfareReceiptModal } from './WelfareReceiptModal';
import { ActivityLogsView } from './ActivityLogsView';

interface MemberPortalProps {
  onOpenStatementModal?: () => void;
  onOpenAlertsModal?: () => void;
  onOpenWelfareStatement?: () => void;
  onOpenWelfareAlerts?: () => void;
}

export const MemberPortal: React.FC<MemberPortalProps> = () => {
  const { currentUser, deposits, withdrawals, getMemberSummary, requestWithdrawal, prices } = useWasteBank();

  // Profile modal and withdrawal request modal
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawNote, setWithdrawNote] = useState<string>('');
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [withdrawError, setWithdrawError] = useState<string>('');
  const [withdrawSuccess, setWithdrawSuccess] = useState<string>('');

  // Modals for Weight Slip, Monthly Sales Receipt, Welfare Receipt, and Activity Logs
  const [isWeightSlipModalOpen, setIsWeightSlipModalOpen] = useState<boolean>(false);
  const [selectedDepositIdForSlip, setSelectedDepositIdForSlip] = useState<string | undefined>(undefined);
  const [isMonthlyReceiptModalOpen, setIsMonthlyReceiptModalOpen] = useState<boolean>(false);
  const [isWelfareReceiptModalOpen, setIsWelfareReceiptModalOpen] = useState<boolean>(false);
  const [isActivityLogModalOpen, setIsActivityLogModalOpen] = useState<boolean>(false);

  // Fallback to MB001 if no user is logged in
  const memberCode = currentUser?.memberCode || 'MB001';
  const summary = getMemberSummary(memberCode);

  const memberDeposits = useMemo(() => {
    return deposits.filter(d => d.memberCode === memberCode);
  }, [deposits, memberCode]);

  const memberWithdrawals = useMemo(() => {
    return withdrawals.filter(w => w.memberCode === memberCode);
  }, [withdrawals, memberCode]);

  // ==========================================
  // 1. FILTER & TABLE STATE: ราคารับซื้อขยะประจำเดือน (ตารางรายละเอียดทั้งหมด)
  // ==========================================
  const [priceCategoryFilter, setPriceCategoryFilter] = useState<string>('all');
  const [priceSearchQuery, setPriceSearchQuery] = useState<string>('');
  const [appliedPriceCategory, setAppliedPriceCategory] = useState<string>('all');
  const [appliedPriceSearch, setAppliedPriceSearch] = useState<string>('');
  const [priceViewMode, setPriceViewMode] = useState<'chart' | 'table'>('table');

  const filteredPrices = useMemo(() => {
    return prices.filter(p => {
      const matchCat = appliedPriceCategory === 'all' || p.category === appliedPriceCategory;
      const matchQuery = !appliedPriceSearch || 
        p.subType.toLowerCase().includes(appliedPriceSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(appliedPriceSearch.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [prices, appliedPriceCategory, appliedPriceSearch]);

  const handlePriceSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedPriceCategory(priceCategoryFilter);
    setAppliedPriceSearch(priceSearchQuery.trim());
  };

  const handlePriceReset = () => {
    setPriceCategoryFilter('all');
    setPriceSearchQuery('');
    setAppliedPriceCategory('all');
    setAppliedPriceSearch('');
  };

  // ==========================================
  // 2. FILTER & CHART STATE: สถิติปริมาณขยะแยกตามประเภทของคุณ (กก.)
  // ==========================================
  const [wasteStartDate, setWasteStartDate] = useState<string>('');
  const [wasteEndDate, setWasteEndDate] = useState<string>('');
  const [appliedWasteStart, setAppliedWasteStart] = useState<string>('');
  const [appliedWasteEnd, setAppliedWasteEnd] = useState<string>('');
  const [wasteQuickRange, setWasteQuickRange] = useState<'all' | 'month' | 'year'>('all');

  const filteredDeposits = useMemo(() => {
    return memberDeposits.filter(d => {
      if (!appliedWasteStart && !appliedWasteEnd) return true;
      if (appliedWasteStart && d.date < appliedWasteStart) return false;
      if (appliedWasteEnd && d.date > appliedWasteEnd) return false;
      return true;
    });
  }, [memberDeposits, appliedWasteStart, appliedWasteEnd]);

  const handleWasteFilterApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedWasteStart(wasteStartDate);
    setAppliedWasteEnd(wasteEndDate);
    setWasteQuickRange('all');
  };

  const handleWasteQuickRange = (range: 'all' | 'month' | 'year') => {
    setWasteQuickRange(range);
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    if (range === 'all') {
      setWasteStartDate('');
      setWasteEndDate('');
      setAppliedWasteStart('');
      setAppliedWasteEnd('');
    } else if (range === 'month') {
      const start = `${year}-${month}-01`;
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      const end = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      setWasteStartDate(start);
      setWasteEndDate(end);
      setAppliedWasteStart(start);
      setAppliedWasteEnd(end);
    } else if (range === 'year') {
      const start = `${year}-01-01`;
      const end = `${year}-12-31`;
      setWasteStartDate(start);
      setWasteEndDate(end);
      setAppliedWasteStart(start);
      setAppliedWasteEnd(end);
    }
  };

  const handleWasteReset = () => {
    setWasteStartDate('');
    setWasteEndDate('');
    setAppliedWasteStart('');
    setAppliedWasteEnd('');
    setWasteQuickRange('all');
  };

  // Aggregated waste category data based on filtered deposits
  const wasteCategoryStats = useMemo(() => {
    const stats: Record<string, number> = {
      'กระดาษ': 0,
      'พลาสติก': 0,
      'โลหะ': 0,
      'แก้ว': 0
    };
    filteredDeposits.forEach(d => {
      if (stats[d.category] !== undefined) {
        stats[d.category] += d.weight;
      } else {
        stats[d.category] = (stats[d.category] || 0) + d.weight;
      }
    });
    return Object.entries(stats).map(([name, weight]) => ({
      name,
      weight: Math.round(weight * 10) / 10
    }));
  }, [filteredDeposits]);

  const totalFilteredWasteKg = useMemo(() => {
    return filteredDeposits.reduce((acc, d) => acc + d.weight, 0);
  }, [filteredDeposits]);

  const categoryColors: Record<string, string> = {
    'กระดาษ': '#3b82f6',
    'พลาสติก': '#10b981',
    'โลหะ': '#f59e0b',
    'แก้ว': '#8b5cf6'
  };

  // ==========================================
  // 3. FILTER & CHART STATE: ประวัติธุรกรรมบัญชี (ฝาก & ถอน)
  // ==========================================
  const [txStartDate, setTxStartDate] = useState<string>('');
  const [txEndDate, setTxEndDate] = useState<string>('');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'deposits' | 'withdrawals'>('all');
  const [appliedTxStart, setAppliedTxStart] = useState<string>('');
  const [appliedTxEnd, setAppliedTxEnd] = useState<string>('');
  const [appliedTxType, setAppliedTxType] = useState<'all' | 'deposits' | 'withdrawals'>('all');
  const [txChartType, setTxChartType] = useState<'bar' | 'pie'>('bar');

  const handleTxFilterApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedTxStart(txStartDate);
    setAppliedTxEnd(txEndDate);
    setAppliedTxType(txTypeFilter);
  };

  const handleTxReset = () => {
    setTxStartDate('');
    setTxEndDate('');
    setTxTypeFilter('all');
    setAppliedTxStart('');
    setAppliedTxEnd('');
    setAppliedTxType('all');
  };

  // Filtered transactions
  const filteredTxDeposits = useMemo(() => {
    if (appliedTxType === 'withdrawals') return [];
    return memberDeposits.filter(d => {
      if (appliedTxStart && d.date < appliedTxStart) return false;
      if (appliedTxEnd && d.date > appliedTxEnd) return false;
      return true;
    });
  }, [memberDeposits, appliedTxStart, appliedTxEnd, appliedTxType]);

  const filteredTxWithdrawals = useMemo(() => {
    if (appliedTxType === 'deposits') return [];
    return memberWithdrawals.filter(w => {
      if (appliedTxStart && w.date < appliedTxStart) return false;
      if (appliedTxEnd && w.date > appliedTxEnd) return false;
      return true;
    });
  }, [memberWithdrawals, appliedTxStart, appliedTxEnd, appliedTxType]);

  const totalFilteredDepositAmount = useMemo(() => {
    return filteredTxDeposits.reduce((acc, d) => acc + d.totalAmount, 0);
  }, [filteredTxDeposits]);

  const totalFilteredWithdrawApproved = useMemo(() => {
    return filteredTxWithdrawals
      .filter(w => w.status === 'approved')
      .reduce((acc, w) => acc + w.amount, 0);
  }, [filteredTxWithdrawals]);

  // Data for Transaction Charts
  const txComparisonBarData = useMemo(() => {
    return [
      {
        name: 'เงินฝากขยะ',
        amount: Math.round(totalFilteredDepositAmount * 100) / 100,
        fill: '#10b981'
      },
      {
        name: 'ถอนเงินสด (อนุมัติ)',
        amount: Math.round(totalFilteredWithdrawApproved * 100) / 100,
        fill: '#ef4444'
      }
    ];
  }, [totalFilteredDepositAmount, totalFilteredWithdrawApproved]);

  const txPieData = useMemo(() => {
    const list = [];
    if (totalFilteredDepositAmount > 0) {
      list.push({
        name: 'เงินฝากขยะ',
        value: Math.round(totalFilteredDepositAmount * 100) / 100,
        color: '#10b981'
      });
    }
    if (totalFilteredWithdrawApproved > 0) {
      list.push({
        name: 'ถอนเงินสด',
        value: Math.round(totalFilteredWithdrawApproved * 100) / 100,
        color: '#ef4444'
      });
    }
    return list;
  }, [totalFilteredDepositAmount, totalFilteredWithdrawApproved]);

  // Combined sorted transactions for table
  const combinedTransactions = useMemo(() => {
    type UnifiedTx = {
      id: string;
      rawDepositId?: string;
      date: string;
      type: 'deposit' | 'withdrawal';
      title: string;
      sub: string;
      qty: string;
      amount: number;
      status: string;
      note?: string;
    };

    const list: UnifiedTx[] = [];

    filteredTxDeposits.forEach(d => {
      list.push({
        id: `dep-${d.id}`,
        rawDepositId: d.id,
        date: d.date,
        type: 'deposit',
        title: d.subType,
        sub: d.wasteCode,
        qty: `${d.weight.toFixed(2)} กก.`,
        amount: d.totalAmount,
        status: 'recorded',
        note: d.note
      });
    });

    filteredTxWithdrawals.forEach(w => {
      list.push({
        id: `wth-${w.id}`,
        date: w.date,
        type: 'withdrawal',
        title: `คำขอถอนเงินสด (${w.requestNumber})`,
        sub: w.accountNumber || 'กองคลัง',
        qty: '-',
        amount: w.amount,
        status: w.status,
        note: w.note
      });
    });

    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredTxDeposits, filteredTxWithdrawals]);

  // Environmental impact calculations
  const carbonAvoidedKg = Math.round(summary.totalWeightKg * 1.8 * 10) / 10;
  const treesEquivalent = Math.round((summary.totalWeightKg * 0.05) * 10) / 10;

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError('');
    setWithdrawSuccess('');

    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      setWithdrawError('กรุณาระบุจำนวนเงินที่ต้องการถอนมากกว่า 0 บาท');
      return;
    }

    if (currentUser?.canWithdraw === false) {
      setWithdrawError('⚠️ ไม่สามารถส่งคำขอถอนเงินได้เนื่องจากบัญชีนี้ถูกระงับสิทธิ์การขอถอนเงินชั่วคราว');
      return;
    }

    const res = requestWithdrawal(memberCode, amt, withdrawNote);
    if (!res.success) {
      setWithdrawError(res.message);
    } else {
      setWithdrawSuccess(res.message);
      setWithdrawAmount('');
      setWithdrawNote('');
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        setIsWithdrawModalOpen(false);
        setWithdrawSuccess('');
      }, 2000);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome Bar (Printer, Account Switcher & Mail Notification buttons REMOVED per user request) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative group">
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={summary.memberName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md bg-white"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-emerald-600/20">
                {summary.memberCode}
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="absolute -bottom-1 -right-1 p-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-full shadow-md transition cursor-pointer"
              title="แก้ไขรูปถ่ายโปรไฟล์"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                {summary.memberName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                พนักงาน / สมาชิก อบต.ตาคลี
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 text-xs sm:text-sm text-slate-500 mt-0.5">
              <span>สังกัด: <strong className="font-medium text-slate-700">{summary.department}</strong></span>
              <span>•</span>
              <span className="font-mono text-emerald-700 font-bold">{summary.memberCode}</span>
              {currentUser?.nationalId && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-mono text-slate-600">
                    <CreditCard className="w-3 h-3 text-slate-400" />
                    <span>{currentUser.nationalId.replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1-$2-$3-$4-$5')}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Clean Action Controls for Members */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer"
          >
            <Camera className="w-4 h-4 text-emerald-600" />
            <span>แก้ไขโปรไฟล์ & รูปถ่าย</span>
          </button>

          <button
            type="button"
            onClick={() => setIsWithdrawModalOpen(true)}
            className={`inline-flex items-center space-x-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer ${
              currentUser?.canWithdraw === false
                ? 'text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300'
                : 'text-white bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>{currentUser?.canWithdraw === false ? 'สิทธิ์ถอนถูกระงับ' : 'ขอถอนเงินสด'}</span>
          </button>
        </div>
      </div>

      {/* Withdrawal Permission Alert Banner (if disabled by admin) */}
      {currentUser?.canWithdraw === false && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start space-x-3 text-amber-900 text-xs sm:text-sm shadow-xs animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">แจ้งเตือนสถานะบัญชี: บัญชีของคุณถูกระงับสิทธิ์การขอถอนเงินชั่วคราว</p>
            <p className="text-amber-800 mt-1">
              {currentUser.statusReason ? (
                <>หมายเหตุจากผู้ดูแลระบบ: <span className="font-semibold">{currentUser.statusReason}</span> • </>
              ) : null}
              หากท่านมีข้อสงสัยหรือต้องการยื่นคำร้อง กรุณาติดต่อกองคลัง หรือเจ้าหน้าที่ผู้ดูแลระบบธนาคารขยะ อบต.ตาคลี
            </p>
          </div>
        </div>
      )}

      {/* Official Printing & Receipt Action Bar */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-emerald-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-sm sm:text-base text-white">
              ศูนย์พิมพ์เอกสารและใบเสร็จรับเงินสมาชิก
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              แบบฟอร์มทางการ อบต.ตาคลี
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            สั่งพิมพ์ใบชั่งน้ำหนักขยะที่ออกโดยผู้ดูแลระบบ, ใบเสร็จขายขยะเดือนนี้พร้อมยอดคงเหลือ, และใบเสร็จเงินสวัสดิการสงเคราะห์
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Button 1: Print Weight Slip */}
          <button
            type="button"
            onClick={() => {
              setSelectedDepositIdForSlip(undefined);
              setIsWeightSlipModalOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-800 rounded-xl transition shadow-xs cursor-pointer"
            title="พิมพ์ใบชั่งน้ำหนักที่มีรายละเอียดการขายขยะแต่ละประเภทที่ออกโดยผู้ดูแลระบบ"
          >
            <Scale className="w-3.5 h-3.5 text-emerald-600" />
            <span>พิมพ์ใบชั่งน้ำหนัก</span>
          </button>

          {/* Button 2: Print Monthly Sales Receipt */}
          <button
            type="button"
            onClick={() => setIsMonthlyReceiptModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition shadow-xs cursor-pointer"
            title="พิมพ์ใบเสร็จรับเงินที่ขายในเดือนนี้พร้อมยอดเงินคงเหลือสุทธิ"
          >
            <Receipt className="w-3.5 h-3.5 text-slate-950" />
            <span>พิมพ์ใบเสร็จขายขยะเดือนนี้</span>
          </button>

          {/* Button 3: Print Welfare Receipt (for members enrolled in welfare or having contributions) */}
          {(currentUser?.welfareEnrolled || (currentUser?.welfareTotalContributed && currentUser.welfareTotalContributed > 0)) && (
            <button
              type="button"
              onClick={() => setIsWelfareReceiptModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition shadow-xs cursor-pointer border border-teal-400/30"
              title="พิมพ์ใบเสร็จค่าใช้จ่ายเงินสวัสดิการสงเคราะห์พนักงาน"
            >
              <FileText className="w-3.5 h-3.5 text-teal-200" />
              <span>พิมพ์ใบเสร็จเงินสวัสดิการ</span>
            </button>
          )}

          {/* Button 4: View Personal Activity Logs (Audit Trail) */}
          <button
            type="button"
            onClick={() => setIsActivityLogModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-xl transition shadow-xs cursor-pointer border border-emerald-500/40"
            title="ดูประวัติการเข้าใช้งานและบันทึกล็อกกิจกรรมของฉันเพื่อเป็นหลักฐาน (Audit Trail)"
          >
            <History className="w-3.5 h-3.5 text-emerald-400" />
            <span>ประวัติการใช้งาน & ล็อก (Audit Trail)</span>
          </button>
        </div>
      </div>

      {/* Main Financial Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Balance (Prominently Green, Turns Red when < 50 THB) */}
        <div
          className={`rounded-2xl p-6 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between shadow-xs ${
            summary.isBelowMinimum
              ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white border-rose-600 shadow-rose-500/20'
              : 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-600 shadow-emerald-600/20'
          }`}
        >
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
            <Wallet className="w-36 h-36" />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-90">
                ยอดเงินคงเหลือสุทธิ (Current Balance)
              </span>
              <div className="p-2 bg-white/20 backdrop-blur-xs rounded-xl">
                <Wallet className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {summary.currentBalance.toFixed(2)}{' '}
                <span className="text-lg font-medium opacity-90">บาท</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-white/20">
            {summary.isBelowMinimum ? (
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-xs px-3 py-2 rounded-xl text-xs font-bold text-white">
                <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                <span>⚠️ ต่ำกว่าเกณฑ์ขั้นต่ำ 50 บาท / ห้ามถอน</span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs opacity-95">
                <span className="flex items-center space-x-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>สถานะ: บัญชีปกติ</span>
                </span>
                <span className="font-semibold bg-white/20 px-2 py-0.5 rounded-md">
                  ถอนได้สูงสุด: {summary.maxWithdrawable.toFixed(2)} ฿
                </span>
              </div>
            )}
            <p className="text-[11px] opacity-80 mt-1.5">
              * กฎควบคุมสภาพคล่องคลัง อบต.ตาคลี: ต้องคงเงินขั้นต่ำ 50.00 บาท
            </p>
          </div>
        </div>

        {/* Card 2: Recycled Weight & Eco Impact */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                ปริมาณขยะรีไซเคิลสะสม
              </span>
              <div className="p-2 bg-teal-50 rounded-xl text-teal-600">
                <Leaf className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
                {summary.totalWeightKg.toFixed(2)}{' '}
                <span className="text-lg font-medium text-slate-500">กก.</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-slate-400 text-[11px]">ลดคาร์บอน (CO₂e)</div>
              <div className="font-bold text-emerald-700 mt-0.5">-{carbonAvoidedKg} kg</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-slate-400 text-[11px]">เทียบเท่าปลูกต้นไม้</div>
              <div className="font-bold text-teal-700 mt-0.5">~{treesEquivalent} ต้น</div>
            </div>
          </div>
        </div>

        {/* Card 3: Total Lifetime Earnings & Withdrawal stats */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                ยอดเงินฝากขยะสะสมตลอดชีพ
              </span>
              <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
                {summary.totalDepositAmount.toFixed(2)}{' '}
                <span className="text-lg font-medium text-slate-500">บาท</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>ยอดถอนสะสมที่อนุมัติแล้ว:</span>
              <span className="font-mono font-semibold text-rose-600">-{summary.totalWithdrawalApproved.toFixed(2)} บาท</span>
            </div>
            {summary.totalWithdrawalPending > 0 && (
              <div className="flex justify-between text-amber-700 bg-amber-50 px-2 py-1 rounded-md">
                <span>คำขอถอนเงินรออนุมัติ:</span>
                <span className="font-mono font-semibold">{summary.totalWithdrawalPending.toFixed(2)} บาท</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Welfare Assistance System Card */}
      <WelfareMemberCard
        onOpenWelfareStatement={() => {}}
        onOpenWelfareAlerts={() => {}}
      />

      {/* ========================================================================= */}
      {/* SECTION 1: สถิติปริมาณขยะแยกตามประเภทของคุณ (กก.) พร้อมตัวกรองวันที่ */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-slate-800 text-base sm:text-lg">
                สถิติปริมาณขยะแยกตามประเภทของคุณ (กก.)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ติดตามปริมาณขยะรีไซเคิลแยกตามประเภท 4 หมวดหลัก (กระดาษ, พลาสติก, โลหะ, แก้ว)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              รวมในช่วงนี้: <strong>{totalFilteredWasteKg.toFixed(2)} กก.</strong> ({filteredDeposits.length} รายการ)
            </span>
          </div>
        </div>

        {/* Filter Toolbar: วัน เดือน ปี หรือระหว่างวันที่ พร้อมปุ่มค้นหา */}
        <form onSubmit={handleWasteFilterApply} className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200 my-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>ช่วงวันที่:</span>
            </span>

            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={wasteStartDate}
                onChange={(e) => setWasteStartDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-emerald-500 outline-hidden font-mono"
                title="จากวันที่"
              />
              <span className="text-slate-400">ถึง</span>
              <input
                type="date"
                value={wasteEndDate}
                onChange={(e) => setWasteEndDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-emerald-500 outline-hidden font-mono"
                title="ถึงวันที่"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-2xs transition cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>ค้นหา</span>
            </button>

            {(appliedWasteStart || appliedWasteEnd) && (
              <button
                type="button"
                onClick={handleWasteReset}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-lg transition cursor-pointer"
                title="ล้างการกรองเพื่อแสดงทั้งหมด"
              >
                <RotateCcw className="w-3 h-3" />
                <span>แสดงทั้งหมด</span>
              </button>
            )}
          </div>

          {/* Quick Filter Presets */}
          <div className="flex items-center space-x-1">
            <span className="text-slate-400 mr-1 text-[11px]">เลือกด่วน:</span>
            <button
              type="button"
              onClick={() => handleWasteQuickRange('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                wasteQuickRange === 'all' && !appliedWasteStart && !appliedWasteEnd
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              ทั้งหมด (Default)
            </button>
            <button
              type="button"
              onClick={() => handleWasteQuickRange('month')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                wasteQuickRange === 'month'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              เดือนนี้
            </button>
            <button
              type="button"
              onClick={() => handleWasteQuickRange('year')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                wasteQuickRange === 'year'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              ปีนี้
            </button>
          </div>
        </form>

        {/* Waste Category Bar Chart */}
        <div className="h-64 w-full mt-3">
          {totalFilteredWasteKg > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wasteCategoryStats} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} stroke="#cbd5e1" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                <Tooltip
                  formatter={(val: any) => [`${val} กก.`, 'น้ำหนักสะสม']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="weight" radius={[8, 8, 0, 0]} barSize={48}>
                  {wasteCategoryStats.map((entry, index) => (
                    <Cell key={`cell-waste-${index}`} fill={categoryColors[entry.name] || '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-8">
              <Leaf className="w-8 h-8 text-slate-300 mb-2" />
              <span>ไม่พบข้อมูลการฝากขยะในช่วงเวลาที่เลือก</span>
              <button
                type="button"
                onClick={handleWasteReset}
                className="mt-2 text-emerald-600 hover:underline font-semibold not-italic"
              >
                คลิกเพื่อแสดงข้อมูลทั้งหมด
              </button>
            </div>
          )}
        </div>

        {/* Breakdown Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 mt-2 border-t border-slate-100 text-center text-xs">
          {wasteCategoryStats.map(item => {
            const percent = totalFilteredWasteKg > 0 ? Math.round((item.weight / totalFilteredWasteKg) * 100) : 0;
            return (
              <div key={item.name} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: categoryColors[item.name] || '#10b981' }}></span>
                  <span className="font-semibold text-slate-700">{item.name}</span>
                </div>
                <div className="font-mono text-emerald-700 font-bold text-base mt-1">{item.weight} กก.</div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">{percent}% ของทั้งหมด</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* SECTION 2: ตารางแสดงรายละเอียดทั้งหมดของขยะรีไซเคิล & ราคารับซื้อประจำเดือน */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-slate-800 text-base sm:text-lg">
                ตารางแสดงรายละเอียดราคารับซื้อขยะประจำเดือน
              </h2>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                ก.ย. 2026 (PriceConfig)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ตารางแสดงรายละเอียดทั้งหมดของขยะรีไซเคิล รหัส ประเภท ชนิดขยะ ราคาต่อกิโลกรัม เกณฑ์แต้มสะสม และเงื่อนไขการคัดแยก
            </p>
          </div>

          {/* Switch View: Table is the default primary view */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setPriceViewMode('table')}
              className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                priceViewMode === 'table' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>ตารางรายละเอียดขยะทั้งหมด</span>
            </button>
            <button
              type="button"
              onClick={() => setPriceViewMode('chart')}
              className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                priceViewMode === 'chart' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>ดูกราฟเปรียบเทียบ</span>
            </button>
          </div>
        </div>

        {/* Filter Controls for Prices */}
        <form onSubmit={handlePriceSearch} className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200 my-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>หมวดหมู่:</span>
            </span>

            <select
              value={priceCategoryFilter}
              onChange={(e) => setPriceCategoryFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-emerald-500 outline-hidden cursor-pointer"
            >
              <option value="all">ทุกหมวดหมู่ ({prices.length} รายการ)</option>
              <option value="พลาสติก">พลาสติก</option>
              <option value="กระดาษ">กระดาษ</option>
              <option value="โลหะ">โลหะ</option>
              <option value="แก้ว">แก้ว</option>
            </select>

            <div className="relative">
              <input
                type="text"
                placeholder="ค้นหาชื่อหรือรหัสขยะ (เช่น PET, กระดาษ, PL01)..."
                value={priceSearchQuery}
                onChange={(e) => setPriceSearchQuery(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg pl-2.5 pr-8 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-emerald-500 outline-hidden w-52 sm:w-64"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
            </div>

            <button
              type="submit"
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-2xs transition cursor-pointer"
            >
              <span>ค้นหา</span>
            </button>

            {(appliedPriceCategory !== 'all' || appliedPriceSearch) && (
              <button
                type="button"
                onClick={handlePriceReset}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-lg transition cursor-pointer"
                title="ล้างเพื่อแสดงราคาขยะทั้งหมด"
              >
                <RotateCcw className="w-3 h-3" />
                <span>รีเซ็ต</span>
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-500">
            แสดง <strong>{filteredPrices.length}</strong> จากทั้งหมด {prices.length} ชนิดขยะ
          </div>
        </form>

        {/* View Mode: Table (Default) or Chart */}
        {priceViewMode === 'table' ? (
          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="p-3 w-20">รหัสขยะ</th>
                  <th className="p-3 w-28">หมวดหมู่</th>
                  <th className="p-3 min-w-[220px]">ชนิดและรายละเอียดขยะรีไซเคิล</th>
                  <th className="p-3 w-28 text-right">ราคารับซื้อ (บาท/กก.)</th>
                  <th className="p-3 w-16 text-center">หน่วย</th>
                  <th className="p-3 w-28 text-right">เกณฑ์คะแนน</th>
                  <th className="p-3 w-28 text-center">รอบประจำเดือน</th>
                  <th className="p-3 w-28 text-center">สถานะรับซื้อ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPrices.map((p, idx) => {
                  // Custom sorting & preparation guidelines based on waste type
                  const getTip = () => {
                    if (p.category === 'พลาสติก') {
                      if (p.subType.includes('ใส') || p.subType.includes('PET')) return 'ล้างคราบเครื่องดื่มให้สะอาด แกะฉลากพลาสติกออก บีบขวดให้แบนเพื่อประหยัดพื้นที่';
                      if (p.subType.includes('ขุ่น') || p.subType.includes('HDPE')) return 'ล้างด้านในให้เกลี้ยง คว่ำให้แห้งก่อนนำส่ง';
                      return 'แยกประเภทพลาสติก ล้างสะอาด ปราศจากสิ่งปนเปื้อน';
                    }
                    if (p.category === 'กระดาษ') {
                      if (p.subType.includes('ลัง') || p.subType.includes('ลูกฟูก')) return 'แกะเทปกาวออก พับแบนและมัดเชือกเป็นมัดให้แน่น ห้ามเปียกน้ำ';
                      if (p.subType.includes('ขาว') || p.subType.includes('A4')) return 'แยกคลิปหนีบกระดาษและลวดเย็บออก ซ้อนเรียงให้เรียบร้อย';
                      return 'แยกกระดาษตามเกรด มัดเชือกเป็นระเบียบ ไม่เปียกชื้น';
                    }
                    if (p.category === 'โลหะ') {
                      if (p.subType.includes('อลูมิเนียม')) return 'เทเครื่องดื่มออกให้หมด บีบกระป๋องให้แบน แยกจากกระป๋องสังกะสี';
                      if (p.subType.includes('ทองแดง') || p.subType.includes('ทองเหลือง')) return 'ปอกฉนวนหรือแยกสิ่งเจือปนออกเพื่อราคาประเมินสูงสุด';
                      return 'เคาะสนิมออก คัดแยกตามเกรดโลหะ';
                    }
                    if (p.category === 'แก้ว') {
                      return 'แยกขวดแก้วตามสี (ใส/เขียว/ชา) ห้ามขวดแตกหรือบิ่น ล้างคว่ำให้แห้ง';
                    }
                    return 'ทำความสะอาดและคัดแยกก่อนนำมาจำหน่ายที่ธนาคารขยะ';
                  };

                  return (
                    <tr key={p.code} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-700">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs">
                          {p.code}
                        </span>
                      </td>
                      <td className="p-3">
                        <span 
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white shadow-2xs inline-block"
                          style={{ backgroundColor: categoryColors[p.category] || '#10b981' }}
                        >
                          {p.category}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800 text-sm">
                          {p.subType}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed flex items-center gap-1">
                          <span className="text-emerald-600 font-semibold">แนะนำ:</span>
                          <span>{getTip()}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-mono font-extrabold text-emerald-700 text-base">
                          {p.currentPrice.toFixed(2)}
                        </span>
                        <span className="text-slate-400 text-[10px] ml-1">฿</span>
                      </td>
                      <td className="p-3 text-center text-slate-600 font-medium">
                        กก.
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-slate-700">
                        <span className="text-amber-600 font-bold">{p.pointsPerKg}</span> แต้ม/กก.
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-[11px] text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded">
                          {p.effectiveMonth || 'ก.ย. 2569'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>เปิดรับซื้อ</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {filteredPrices.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 text-xs italic">
                      <Tag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <div>ไม่พบรายการขยะตามคำค้นหา "{appliedPriceSearch}"</div>
                      <button
                        type="button"
                        onClick={handlePriceReset}
                        className="mt-2 text-emerald-600 font-semibold not-italic hover:underline cursor-pointer"
                      >
                        คลิกเพื่อแสดงราคาทั้งหมด
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-72 w-full mt-3">
            {filteredPrices.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredPrices}
                  margin={{ top: 15, right: 20, left: -10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="subType" 
                    tick={{ fontSize: 11, fill: '#475569' }} 
                    stroke="#cbd5e1"
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    stroke="#cbd5e1" 
                    unit=" ฿"
                  />
                  <Tooltip
                    formatter={(val: any, name: any, item: any) => [
                      `${val} บาท/กก.`, 
                      `ราคารับซื้อ (${item?.payload?.code} • ${item?.payload?.category})`
                    ]}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="currentPrice" radius={[6, 6, 0, 0]}>
                    {filteredPrices.map((entry, index) => (
                      <Cell key={`cell-price-${index}`} fill={categoryColors[entry.category] || '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <span>ไม่พบรายการขยะตามคำค้นหา</span>
                <button
                  type="button"
                  onClick={handlePriceReset}
                  className="mt-2 text-emerald-600 hover:underline font-semibold not-italic"
                >
                  คลิกเพื่อแสดงราคาทั้งหมด
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 gap-2">
          <span>📍 จุดรับฝากขยะ: อาคารกองสาธารณสุขและสิ่งแวดล้อม อบต.ตาคลี ทุกวันพุธ เวลา 08:30 - 15:30 น.</span>
          <span className="font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            * อิงราคาตลาดรีไซเคิลกลาง สหกรณ์ตาคลี (ปรับปรุงประจำเดือน)
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: กราฟ & ประวัติการทำธุรกรรมบัญชี (เงินฝาก & ถอนเงิน) พร้อมตัวกรอง */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="font-bold text-base sm:text-lg text-slate-800">
                ประวัติธุรกรรมบัญชีและกราฟการเงิน (ฝากขยะ & ถอนเงินสด)
              </h2>
              <p className="text-xs text-slate-500">
                สรุปยอดความเคลื่อนไหวบัญชีและบันทึกประวัติการฝาก/ถอนเงิน
              </p>
            </div>
          </div>

          {/* Toggle Transaction Chart Type */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setTxChartType('bar')}
              className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                txChartType === 'bar' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>กราฟแท่งเปรียบเทียบ</span>
            </button>
            <button
              type="button"
              onClick={() => setTxChartType('pie')}
              className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                txChartType === 'pie' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>กราฟวงกลมสัดส่วน</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar for Transactions */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <form onSubmit={handleTxFilterApply} className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>ตัวกรองประวัติ:</span>
              </span>

              {/* Type Filter */}
              <select
                value={txTypeFilter}
                onChange={(e) => setTxTypeFilter(e.target.value as any)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-emerald-500 outline-hidden"
              >
                <option value="all">ธุรกรรมทั้งหมด (ฝาก + ถอน)</option>
                <option value="deposits">เฉพาะเงินฝากขยะ</option>
                <option value="withdrawals">เฉพาะถอนเงินสด</option>
              </select>

              {/* Date Filter */}
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={txStartDate}
                  onChange={(e) => setTxStartDate(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-emerald-500 outline-hidden font-mono"
                  title="วันที่เริ่มต้น"
                />
                <span className="text-slate-400">ถึง</span>
                <input
                  type="date"
                  value={txEndDate}
                  onChange={(e) => setTxEndDate(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-emerald-500 outline-hidden font-mono"
                  title="วันที่สิ้นสุด"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-2xs transition cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>ค้นหา</span>
              </button>

              {(appliedTxStart || appliedTxEnd || appliedTxType !== 'all') && (
                <button
                  type="button"
                  onClick={handleTxReset}
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-lg transition cursor-pointer"
                  title="รีเซ็ตเพื่อแสดงธุรกรรมทั้งหมด"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>แสดงทั้งหมด</span>
                </button>
              )}
            </div>

            {/* Metric Summary Badges */}
            <div className="flex items-center space-x-3 text-xs">
              <span className="text-slate-600">
                ฝาก: <strong className="font-mono text-emerald-700 font-bold">+{totalFilteredDepositAmount.toFixed(2)} ฿</strong>
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">
                ถอน: <strong className="font-mono text-rose-600 font-bold">-{totalFilteredWithdrawApproved.toFixed(2)} ฿</strong>
              </span>
            </div>
          </form>
        </div>

        {/* Transaction Graph Section */}
        <div className="p-6 bg-slate-50/50 border-b border-slate-200">
          <div className="max-w-3xl mx-auto h-56">
            {txChartType === 'bar' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={txComparisonBarData} margin={{ top: 15, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#334155' }} stroke="#cbd5e1" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" unit=" ฿" />
                  <Tooltip
                    formatter={(val: any) => [`${val.toLocaleString()} บาท`, 'ยอดเงิน']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={56}>
                    {txComparisonBarData.map((entry, index) => (
                      <Cell key={`cell-tx-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              txPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={txPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {txPieData.map((entry, index) => (
                        <Cell key={`cell-pie-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`${val.toLocaleString()} บาท`, 'ยอดเงิน']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                  ไม่มีข้อมูลการทำธุรกรรมในช่วงเวลาที่เลือก
                </div>
              )
            )}
          </div>
        </div>

        {/* Combined Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <th className="p-3">วันที่</th>
                <th className="p-3">ประเภทธุรกรรม</th>
                <th className="p-3">รายละเอียด / ชนิดขยะ</th>
                <th className="p-3 text-right">น้ำหนัก / จำนวน</th>
                <th className="p-3 text-right">ยอดเงิน (บาท)</th>
                <th className="p-3 text-center">สถานะ</th>
                <th className="p-3">หมายเหตุ</th>
                <th className="p-3 text-center">พิมพ์เอกสาร</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {combinedTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                  <td className="p-3 font-mono text-slate-600">{tx.date}</td>
                  <td className="p-3">
                    {tx.type === 'deposit' ? (
                      <span className="inline-flex items-center space-x-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <ArrowUpRight className="w-3 h-3" />
                        <span>ฝากขยะ</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        <ArrowDownLeft className="w-3 h-3" />
                        <span>ถอนเงินสด</span>
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-medium text-slate-800">
                    {tx.title} <span className="font-mono text-slate-400 text-[11px]">({tx.sub})</span>
                  </td>
                  <td className="p-3 text-right font-mono font-medium text-slate-700">
                    {tx.qty}
                  </td>
                  <td className={`p-3 text-right font-mono font-bold text-sm ${
                    tx.type === 'deposit' ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {tx.type === 'deposit' ? `+${tx.amount.toFixed(2)}` : `-${tx.amount.toFixed(2)}`}
                  </td>
                  <td className="p-3 text-center">
                    {tx.status === 'recorded' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        บันทึกสำเร็จ
                      </span>
                    )}
                    {tx.status === 'approved' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        อนุมัติแล้ว
                      </span>
                    )}
                    {tx.status === 'pending' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                        รออนุมัติ
                      </span>
                    )}
                    {tx.status === 'rejected' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
                        ปฏิเสธ
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-slate-500 text-[11px] truncate max-w-xs">{tx.note || '-'}</td>
                  <td className="p-3 text-center">
                    {tx.type === 'deposit' && tx.rawDepositId ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDepositIdForSlip(tx.rawDepositId);
                          setIsWeightSlipModalOpen(true);
                        }}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200 transition cursor-pointer"
                        title="พิมพ์ใบชั่งน้ำหนักขยะรายการนี้"
                      >
                        <Printer className="w-3 h-3 text-emerald-600" />
                        <span>ใบชั่ง</span>
                      </button>
                    ) : (
                      <span className="text-slate-300 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))}

              {combinedTransactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                    ไม่พบรายการธุรกรรมตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Withdrawal Request Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-200" />
                <h3 className="font-bold text-base">ยื่นคำขอถอนเงินสดสวัสดิการ</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(false)}
                className="text-emerald-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>ยอดเงินคงเหลือปัจจุบัน:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {summary.currentBalance.toFixed(2)} บาท
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>กฎเงินคงเหลือขั้นต่ำในบัญชี:</span>
                  <span className="font-mono font-semibold text-amber-700">50.00 บาท</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-semibold pt-1 border-t border-slate-200">
                  <span>ยอดที่สามารถถอนได้สูงสุด:</span>
                  <span className="font-mono text-sm">{summary.maxWithdrawable.toFixed(2)} บาท</span>
                </div>
              </div>

              {currentUser?.canWithdraw === false ? (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">สิทธิ์การขอถอนเงินถูกระงับชั่วคราว:</span>{' '}
                    {currentUser.statusReason ? `(${currentUser.statusReason}) ` : ''}
                    บัญชีของคุณถูกระงับสิทธิ์การขอถอนเงินสดโดยผู้ดูแลระบบ อบต.ตาคลี ไม่สามารถส่งคำขอถอนเงินได้ในขณะนี้
                  </div>
                </div>
              ) : summary.isBelowMinimum ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">ไม่สามารถถอนเงินได้:</span>{' '}
                    ยอดเงินคงเหลือของคุณต่ำกว่าเกณฑ์ขั้นต่ำ 50 บาท กรุณานำขยะมาฝากเพิ่มเพื่อสะสมยอดก่อนถอนเงิน
                  </div>
                </div>
              ) : null}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  จำนวนเงินที่ต้องการถอน (บาท)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max={summary.maxWithdrawable}
                    disabled={currentUser?.canWithdraw === false || summary.isBelowMinimum}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="เช่น 50, 100"
                    className="w-full text-sm font-mono px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden disabled:bg-slate-100 disabled:cursor-not-allowed"
                    required
                  />
                  <button
                    type="button"
                    disabled={currentUser?.canWithdraw === false || summary.isBelowMinimum || summary.maxWithdrawable <= 0}
                    onClick={() => setWithdrawAmount(summary.maxWithdrawable.toString())}
                    className="absolute right-2 top-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md transition disabled:opacity-50 cursor-pointer"
                  >
                    ถอนสูงสุด
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เหตุผล / บันทึกเพิ่มเติม (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={withdrawNote}
                  disabled={currentUser?.canWithdraw === false}
                  onChange={(e) => setWithdrawNote(e.target.value)}
                  placeholder="เช่น ถอนเงินสวัสดิการนำไปซื้อของใช้"
                  className="w-full text-xs px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden disabled:bg-slate-100"
                />
              </div>

              {withdrawError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                  {withdrawError}
                </div>
              )}

              {withdrawSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium">
                  {withdrawSuccess}
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={currentUser?.canWithdraw === false || summary.isBelowMinimum || summary.maxWithdrawable <= 0}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  ยืนยันคำขอถอนเงิน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Profile & Photo Edit Modal */}
      <MemberProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Weight Slip Modal (พิมพ์ใบชั่งน้ำหนักขยะ) */}
      <WeightSlipModal
        isOpen={isWeightSlipModalOpen}
        onClose={() => {
          setIsWeightSlipModalOpen(false);
          setSelectedDepositIdForSlip(undefined);
        }}
        memberCode={memberCode}
        selectedDepositId={selectedDepositIdForSlip}
      />

      {/* Monthly Sales Receipt Modal (พิมพ์ใบเสร็จขายขยะเดือนนี้พร้อมยอดคงเหลือ) */}
      <MonthlySalesReceiptModal
        isOpen={isMonthlyReceiptModalOpen}
        onClose={() => setIsMonthlyReceiptModalOpen(false)}
        memberCode={memberCode}
      />

      {/* Welfare Receipt Modal (พิมพ์ใบเสร็จเงินสวัสดิการสงเคราะห์) */}
      <WelfareReceiptModal
        isOpen={isWelfareReceiptModalOpen}
        onClose={() => setIsWelfareReceiptModalOpen(false)}
        memberCode={memberCode}
      />

      {/* Member Activity Logs & Audit Trail Modal */}
      {isActivityLogModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm sm:text-base">
                  ประวัติการเข้าใช้งานและบันทึกล็อกของฉัน (Member Audit Trail)
                </h3>
                <span className="font-mono text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {memberCode}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsActivityLogModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                title="ปิดหน้าต่าง"
              >
                ✕
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <ActivityLogsView
                filterMemberCode={memberCode}
                title={`บันทึกประวัติการเข้าใช้งานของ ${currentUser?.name || memberCode}`}
                description="เก็บบันทึกประวัติการทำรายการ เข้าสู่ระบบ บันทึกฝากขยะ การขอถอนเงิน และการพิมพ์ใบเสร็จรับเงิน เพื่อเป็นหลักฐานอ้างอิงของสมาชิก"
              />
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsActivityLogModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
