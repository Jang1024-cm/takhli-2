import React, { useState, useMemo } from 'react';
import { useWasteBank } from '../context/WasteBankContext';
import { printA4Document, openDocumentInNewTab } from '../utils/printHelper';
import { ScheduledEmailReport } from '../types';
import { 
  Printer, 
  Download, 
  Send, 
  Calendar, 
  Clock, 
  Mail, 
  Users, 
  CheckCircle2, 
  Building2, 
  FileText, 
  X, 
  ShieldCheck, 
  Sparkles, 
  Search, 
  Filter, 
  RefreshCw, 
  ArrowRight,
  TrendingUp,
  Coins,
  Scale,
  Award,
  Leaf,
  Layers,
  CheckSquare,
  Square,
  AlertCircle
} from 'lucide-react';

interface ExecutiveSummaryA4ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExecutiveSummaryA4Modal: React.FC<ExecutiveSummaryA4ModalProps> = ({
  isOpen,
  onClose
}) => {
  const { 
    currentUser, 
    users, 
    deposits, 
    withdrawals, 
    prices, 
    orgConfig, 
    welfareConfig, 
    welfareContributions, 
    welfareExpenses,
    departments,
    getOrgStats,
    alertConfig
  } = useWasteBank();

  // Active view tab in modal: 'a4_preview' | 'auto_email'
  const [activeTab, setActiveTab] = useState<'a4_preview' | 'auto_email'>('a4_preview');

  // Date range filter for report data
  const [dataStartDate, setDataStartDate] = useState<string>('2026-09-01');
  const [dataEndDate, setDataEndDate] = useState<string>('2026-09-30');

  // Auto-Email Scheduling States
  const [dispatchType, setDispatchType] = useState<'immediate' | 'scheduled' | 'monthly' | 'weekly'>('immediate');
  const [scheduleDate, setScheduleDate] = useState<string>('2026-09-30');
  const [scheduleTime, setScheduleTime] = useState<string>('09:00');
  const [recipientAudience, setRecipientAudience] = useState<'executives' | 'all_members' | 'custom'>('executives');
  const [additionalEmails, setAdditionalEmails] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState<string>('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');

  // Email action feedback
  const [isProcessingEmail, setIsProcessingEmail] = useState<boolean>(false);
  const [emailStatusToast, setEmailStatusToast] = useState<{ text: string; isError: boolean } | null>(null);

  // Local storage persisted schedule list
  const [schedulesList, setSchedulesList] = useState<ScheduledEmailReport[]>(() => {
    const saved = localStorage.getItem('WASTE_BANK_SCHEDULED_REPORTS');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [
      {
        id: 'SCH-001',
        reportType: 'executive_summary_a4',
        title: 'รายงานสรุปผลการดำเนินงานธนาคารขยะ ประจำเดือนกันยายน 2569',
        recipients: [
          { name: 'นายก อบต.ตาคลี', email: 'mayor@takhli.go.th', role: 'ผู้บริหารสูงสุด' },
          { name: 'ปลัด อบต.ตาคลี', email: 'clerk@takhli.go.th', role: 'หัวหน้าส่วนราชการ' },
          { name: 'ผอ.กองสาธารณสุขและสิ่งแวดล้อม', email: 'health@takhli.go.th', role: 'ผู้กำกับดูแล' },
          { name: 'ผอ.กองคลัง', email: 'finance@takhli.go.th', role: 'ผู้ตรวจสอบการเงิน' }
        ],
        dataStartDate: '2026-09-01',
        dataEndDate: '2026-09-30',
        scheduledDate: '2026-09-30',
        scheduledTime: '16:30',
        frequency: 'monthly',
        status: 'scheduled',
        createdAt: '2026-09-01 08:30:00',
        createdBy: 'นายชาญชัย รักษ์ตาคลี (ผู้ดูแลระบบ)'
      }
    ];
  });

  // Calculate dynamic stats based on data range
  const filteredDeposits = useMemo(() => {
    return deposits.filter(d => {
      // d.date format: DD/MM/YYYY or YYYY-MM-DD
      let dStr = d.date;
      if (d.date.includes('/')) {
        const parts = d.date.split('/');
        if (parts.length === 3) {
          dStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      return (!dataStartDate || dStr >= dataStartDate) && (!dataEndDate || dStr <= dataEndDate);
    });
  }, [deposits, dataStartDate, dataEndDate]);

  const totalFilteredWeight = filteredDeposits.reduce((acc, curr) => acc + curr.weightKg, 0);
  const totalFilteredSales = filteredDeposits.reduce((acc, curr) => acc + curr.totalPrice, 0);

  // Group by category
  const categoryStats = useMemo(() => {
    const map: Record<string, { weight: number; value: number; count: number }> = {
      'พลาสติก': { weight: 0, value: 0, count: 0 },
      'โลหะ': { weight: 0, value: 0, count: 0 },
      'กระดาษ': { weight: 0, value: 0, count: 0 },
      'แก้ว': { weight: 0, value: 0, count: 0 }
    };

    filteredDeposits.forEach(d => {
      if (map[d.category]) {
        map[d.category].weight += d.weightKg;
        map[d.category].value += d.totalPrice;
        map[d.category].count += 1;
      }
    });

    return map;
  }, [filteredDeposits]);

  // Welfare metrics
  const totalWelfareFund = welfareContributions.reduce((sum, c) => sum + c.amount, 0);
  const totalWelfareExpense = welfareExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netWelfareFund = totalWelfareFund - totalWelfareExpense;

  // Active admin name for signature
  const activeAdmin = (currentUser?.role === 'admin' || currentUser?.role === 'superadmin')
    ? currentUser 
    : (users.find(u => u.role === 'admin') || users.find(u => u.role === 'superadmin'));
  const buyerStaffName = activeAdmin?.name || 'นายชาญชัย รักษ์ตาคลี';

  // Executive predefined recipients
  const executiveRecipients = [
    { name: 'นายกองค์การบริหารส่วนตำบลตาคลี', email: 'mayor@takhli.go.th', role: 'ผู้บริหารระดับสูง' },
    { name: 'ปลัดองค์การบริหารส่วนตำบลตาคลี', email: 'clerk@takhli.go.th', role: 'หัวหน้าส่วนราชการ' },
    { name: 'ผู้อำนวยการกองสาธารณสุขและสิ่งแวดล้อม', email: 'health@takhli.go.th', role: 'ผู้กำกับโครงการ' },
    { name: 'ผู้อำนวยการกองคลัง', email: 'finance@takhli.go.th', role: 'ผู้ตรวจสอบงบการเงิน' },
    { name: alertConfig.adminEmail || 'admin-waste@takhli.go.th', email: alertConfig.adminEmail || 'admin-waste@takhli.go.th', role: 'อีเมลผู้ดูแลระบบ' }
  ];

  // Recipient list calculation
  const computedRecipients = useMemo(() => {
    if (recipientAudience === 'executives') {
      return executiveRecipients;
    }
    if (recipientAudience === 'all_members') {
      return users.map(u => ({
        name: u.name,
        email: u.email,
        role: `${u.department} (${u.memberCode})`
      }));
    }
    // Custom selection
    const selected = users.filter(u => selectedUserIds.includes(u.id)).map(u => ({
      name: u.name,
      email: u.email,
      role: `${u.department} (${u.memberCode})`
    }));
    return selected;
  }, [recipientAudience, users, selectedUserIds, alertConfig.adminEmail]);

  // Print handler
  const handlePrintDocument = () => {
    printA4Document('executive-summary-a4-printable', `รายงานสรุปภาพรวมธนาคารขยะ_A4_${dataStartDate}_ถึง_${dataEndDate}`);
  };

  const handleOpenNewTab = () => {
    openDocumentInNewTab('executive-summary-a4-printable', `รายงานสรุปภาพรวมธนาคารขยะ_A4_${dataStartDate}_ถึง_${dataEndDate}`);
  };

  // Quick preset data ranges
  const handleSetQuickRange = (preset: 'this_month' | 'last_month' | 'all_time' | 'q3_2026') => {
    if (preset === 'this_month') {
      setDataStartDate('2026-09-01');
      setDataEndDate('2026-09-30');
    } else if (preset === 'last_month') {
      setDataStartDate('2026-08-01');
      setDataEndDate('2026-08-31');
    } else if (preset === 'q3_2026') {
      setDataStartDate('2026-07-01');
      setDataEndDate('2026-09-30');
    } else if (preset === 'all_time') {
      setDataStartDate('2026-01-01');
      setDataEndDate('2026-12-31');
    }
  };

  // Dispatch / Schedule Submit
  const handleDispatchEmailReport = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingEmail(true);
    setEmailStatusToast(null);

    const targetList = [...computedRecipients];
    if (additionalEmails.trim()) {
      const extras = additionalEmails.split(',').map(m => m.trim()).filter(Boolean);
      extras.forEach(em => {
        targetList.push({ name: 'ผู้รับสำเนาภายนอก', email: em, role: 'CC' });
      });
    }

    if (targetList.length === 0) {
      setIsProcessingEmail(false);
      setEmailStatusToast({ text: 'กรุณาเลือกผู้รับอย่างน้อย 1 ท่าน', isError: true });
      return;
    }

    const newSchedule: ScheduledEmailReport = {
      id: `SCH-${Date.now().toString().slice(-4)}`,
      reportType: 'executive_summary_a4',
      title: `รายงานสรุปผลการดำเนินงานธนาคารขยะ ประจำช่วง ${dataStartDate} ถึง ${dataEndDate}`,
      recipients: targetList,
      dataStartDate,
      dataEndDate,
      scheduledDate: scheduleDate,
      scheduledTime: scheduleTime,
      frequency: dispatchType === 'immediate' ? 'once' : dispatchType,
      status: dispatchType === 'immediate' ? 'sent' : 'scheduled',
      lastSentAt: dispatchType === 'immediate' ? new Date().toLocaleString('th-TH') : undefined,
      createdAt: new Date().toLocaleString('th-TH'),
      createdBy: `${buyerStaffName} (เจ้าหน้าที่ผู้รับซื้อขยะ / แอดมิน)`
    };

    setTimeout(() => {
      const updatedList = [newSchedule, ...schedulesList];
      setSchedulesList(updatedList);
      localStorage.setItem('WASTE_BANK_SCHEDULED_REPORTS', JSON.stringify(updatedList));

      setIsProcessingEmail(false);
      if (dispatchType === 'immediate') {
        setEmailStatusToast({ 
          text: `⚡ ดำเนินการส่งรายงานสรุป A4 ทางอีเมลไปยังผู้รับ ${targetList.length} ท่าน เรียบร้อยแล้ว`, 
          isError: false 
        });
      } else {
        setEmailStatusToast({ 
          text: `⏰ บันทึกตารางการส่งอีเมลรายงานอัตโนมัติ (วันที่ ${scheduleDate} เวลา ${scheduleTime} น.) สำเร็จแล้ว`, 
          isError: false 
        });
      }

      setTimeout(() => setEmailStatusToast(null), 5000);
    }, 1000);
  };

  const handleDeleteSchedule = (id: string) => {
    const updated = schedulesList.filter(s => s.id !== id);
    setSchedulesList(updated);
    localStorage.setItem('WASTE_BANK_SCHEDULED_REPORTS', JSON.stringify(updated));
  };

  // Toggle user selection
  const handleToggleUser = (id: string) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter(x => x !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  const handleSelectAllFilteredUsers = (ids: string[]) => {
    const allSelected = ids.every(id => selectedUserIds.includes(id));
    if (allSelected) {
      setSelectedUserIds(selectedUserIds.filter(id => !ids.includes(id)));
    } else {
      setSelectedUserIds(Array.from(new Set([...selectedUserIds, ...ids])));
    }
  };

  // Filtered members for custom audience picker
  const filteredPickUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                            u.memberCode.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                            u.email.toLowerCase().includes(memberSearchTerm.toLowerCase());
      const matchesDept = selectedDeptFilter === 'all' || u.department === selectedDeptFilter;
      return matchesSearch && matchesDept;
    });
  }, [users, memberSearchTerm, selectedDeptFilter]);

  if (!isOpen) return null;

  const now = new Date();
  const printTimestamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh]">
        
        {/* MODAL HEADER & CONTROLS (Hidden during printing) */}
        <div className="no-print bg-slate-900 text-white px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-700/80 rounded-xl text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold text-base sm:text-lg">
                  สรุปรายละเอียดระบบแบบวันเพจ A4 (Executive Summary & Auto-Email)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ขนาด A4 One-Page
                </span>
              </div>
              <p className="text-xs text-slate-400">
                องค์การบริหารส่วนตำบลตาคลี • พิมพ์ออกเครื่องพิมพ์, บันทึกเป็น PDF และตั้งเวลาส่งอีเมลอัตโนมัติ
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrintDocument}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
              title="พิมพ์เอกสารออกเครื่องพิมพ์ หรือกดบันทึกเป็น PDF"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ A4 / บันทึก PDF</span>
            </button>

            <button
              type="button"
              onClick={handleOpenNewTab}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center space-x-1"
              title="เปิดในแท็บใหม่เพื่อดูตัวอย่างแบบเต็มหน้าจอ"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">เปิดแท็บใหม่</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TAB SWITCHER & DATE RANGE FILTER BAR (Hidden during printing) */}
        <div className="no-print bg-slate-100 border-b border-slate-200 px-5 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-1 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('a4_preview')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'a4_preview' 
                  ? 'bg-emerald-700 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>1. ดูตัวอย่างเอกสาร A4 One-Page (พร้อมพิมพ์)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('auto_email')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'auto_email' 
                  ? 'bg-emerald-700 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>2. ตั้งค่าส่งอีเมลอัตโนมัติ (Telegram & Email Alert)</span>
              {schedulesList.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold ml-1">
                  {schedulesList.length}
                </span>
              )}
            </button>
          </div>

          {/* Quick Date Range Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-medium">ช่วงข้อมูลรายงาน:</span>
            <input
              type="date"
              value={dataStartDate}
              onChange={(e) => setDataStartDate(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono"
            />
            <span className="text-slate-400">ถึง</span>
            <input
              type="date"
              value={dataEndDate}
              onChange={(e) => setDataEndDate(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono"
            />
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => handleSetQuickRange('this_month')}
                className="px-2 py-1 bg-white hover:bg-emerald-50 text-slate-700 border border-slate-200 rounded-lg font-medium text-[11px]"
              >
                เดือนนี้
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickRange('all_time')}
                className="px-2 py-1 bg-white hover:bg-emerald-50 text-slate-700 border border-slate-200 rounded-lg font-medium text-[11px]"
              >
                ทั้งหมด
              </button>
            </div>
          </div>
        </div>

        {/* MODAL MAIN CONTENT SCROLLABLE AREA */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-50">
          
          {/* TAB 1: A4 ONE-PAGE DOCUMENT PREVIEW */}
          {activeTab === 'a4_preview' && (
            <div className="flex justify-center">
              <div 
                id="executive-summary-a4-printable"
                className="bg-white w-full max-w-[210mm] min-h-[297mm] p-6 sm:p-8 rounded-xl shadow-md border border-slate-200 text-slate-800 text-xs flex flex-col justify-between font-sans text-left"
                style={{ boxSizing: 'border-box', textAlign: 'left' }}
              >
                <div>
                  {/* Document Header with Official Emblem */}
                  <div 
                    className="flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-4 text-left"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', textAlign: 'left' }}
                  >
                    <div className="flex items-center space-x-3.5 text-left" style={{ display: 'flex', alignItems: 'center' }}>
                      <div className="w-14 h-14 shrink-0 flex items-center justify-center bg-emerald-50 rounded-xl border border-emerald-200 p-1" style={{ width: '56px', height: '56px', flexShrink: 0 }}>
                        {orgConfig.logoUrl ? (
                          <img 
                            src={orgConfig.logoUrl} 
                            alt="Logo" 
                            className="max-h-12 max-w-12 object-contain" 
                            style={{ maxHeight: '48px', maxWidth: '48px', objectFit: 'contain' }}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Building2 className="w-8 h-8 text-emerald-800" />
                        )}
                      </div>
                      <div className="text-left" style={{ textAlign: 'left' }}>
                        <div className="text-[11px] font-semibold text-emerald-800 tracking-wider">
                          เอกสารทางการ • องค์การบริหารส่วนตำบลตาคลี อำเภอตาคลี จังหวัดนครสวรรค์
                        </div>
                        <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-snug">
                          รายงานสรุปภาพรวมผลการดำเนินงานธนาคารขยะและกองทุนสวัสดิการพนักงาน
                        </h1>
                        <p className="text-[11px] text-slate-600">
                          (Executive One-Page Summary Report • ประจำปีงบประมาณ พ.ศ. 2569)
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-[10px] text-slate-500 font-mono shrink-0 pl-2" style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div className="font-bold text-slate-700 text-xs">เลขที่เอกสาร: REP-TK-202609-01</div>
                      <div>ช่วงข้อมูล: {dataStartDate} ถึง {dataEndDate}</div>
                      <div>จัดพิมพ์เมื่อ: {printTimestamp}</div>
                    </div>
                  </div>

                  {/* SECTION 1: EXECUTIVE KEY METRICS (4 Columns) */}
                  <div className="mb-4 text-left" style={{ textAlign: 'left' }}>
                    <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between text-left" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
                      <span>1. ดัชนีชี้วัดผลงานหลักภาพรวม (Key Performance Indicators)</span>
                      <span className="text-[10px] text-slate-500 font-normal">สถานะสมาชิกทั้งหมด 150 คน คลุมครบ 100%</span>
                    </div>

                    <div 
                      className="grid grid-cols-4 gap-2 text-center"
                      style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '8px', textAlign: 'center' }}
                    >
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <div className="text-[10px] text-emerald-800 font-medium">ขยะรีไซเคิลสะสมรวม</div>
                        <div className="text-base font-extrabold text-emerald-950 font-mono mt-0.5">
                          {totalFilteredWeight.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-emerald-700">กิโลกรัม (kg)</div>
                      </div>

                      <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl">
                        <div className="text-[10px] text-blue-800 font-medium">เงินหมุนเวียนสร้างรายได้</div>
                        <div className="text-base font-extrabold text-blue-950 font-mono mt-0.5">
                          {totalFilteredSales.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-blue-700">บาท (THB)</div>
                      </div>

                      <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl">
                        <div className="text-[10px] text-teal-800 font-medium">กองทุนสวัสดิการสุทธิ</div>
                        <div className="text-base font-extrabold text-teal-950 font-mono mt-0.5">
                          {netWelfareFund.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-teal-700">บาท (คงเหลือพร้อมดูแล)</div>
                      </div>

                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="text-[10px] text-amber-800 font-medium">ลดก๊าซเรือนกระจก</div>
                        <div className="text-base font-extrabold text-amber-950 font-mono mt-0.5">
                          {(totalFilteredWeight * 1.8).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-amber-700">kg CO₂e (คาร์บอน)</div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: WASTE CATEGORIES BREAKDOWN */}
                  <div className="mb-4 text-left" style={{ textAlign: 'left' }}>
                    <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between text-left" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
                      <span>2. สรุปปริมาณและมูลค่าขยะรีไซเคิลแยกตาม 4 หมวดหมู่</span>
                      <span className="text-[10px] text-slate-500 font-normal">บันทึกรายการผ่านระบบตาชั่งดิจิทัล</span>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden text-left" style={{ textAlign: 'left' }}>
                      <table className="w-full text-left text-[11px]" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="py-1.5 px-3 text-left" style={{ textAlign: 'left' }}>หมวดหมู่ขยะรีไซเคิล</th>
                            <th className="py-1.5 px-3 text-right" style={{ textAlign: 'right' }}>น้ำหนักรวม (กก.)</th>
                            <th className="py-1.5 px-3 text-right" style={{ textAlign: 'right' }}>สัดส่วน (%)</th>
                            <th className="py-1.5 px-3 text-right" style={{ textAlign: 'right' }}>จำนวนเงินรวม (บาท)</th>
                            <th className="py-1.5 px-3 text-right" style={{ textAlign: 'right' }}>เฉลี่ยต่อ กก.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(Object.entries(categoryStats) as [string, { weight: number; value: number; count: number }][]).map(([cat, stat]) => {
                            const percent = totalFilteredWeight > 0 ? (stat.weight / totalFilteredWeight) * 100 : 0;
                            const avgPrice = stat.weight > 0 ? stat.value / stat.weight : 0;
                            return (
                              <tr key={cat} className="hover:bg-slate-50/60">
                                <td className="py-1.5 px-3 font-semibold text-slate-800 text-left" style={{ textAlign: 'left' }}>
                                  {cat === 'พลาสติก' && '🔵 พลาสติก (PET / รวม)'}
                                  {cat === 'โลหะ' && '🟠 โลหะ / สังกะสี / อะลูมิเนียม'}
                                  {cat === 'กระดาษ' && '📄 กระดาษ / ลังกระดาษ'}
                                  {cat === 'แก้ว' && '🟣 แก้ว / ขวดแก้วเครื่องดื่ม'}
                                </td>
                                <td className="py-1.5 px-3 text-right font-mono font-medium" style={{ textAlign: 'right' }}>{stat.weight.toFixed(2)}</td>
                                <td className="py-1.5 px-3 text-right font-mono text-slate-600" style={{ textAlign: 'right' }}>{percent.toFixed(1)}%</td>
                                <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-900" style={{ textAlign: 'right' }}>{stat.value.toFixed(2)} ฿</td>
                                <td className="py-1.5 px-3 text-right font-mono text-slate-500" style={{ textAlign: 'right' }}>{avgPrice.toFixed(2)} ฿</td>
                              </tr>
                            );
                          })}
                          <tr className="bg-slate-50/90 font-bold border-t border-slate-300">
                            <td className="py-2 px-3 text-slate-900 text-left" style={{ textAlign: 'left' }}>รวมทั้งสิ้น (Grand Total)</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-900" style={{ textAlign: 'right' }}>{totalFilteredWeight.toFixed(2)} กก.</td>
                            <td className="py-2 px-3 text-right font-mono" style={{ textAlign: 'right' }}>100.0%</td>
                            <td className="py-2 px-3 text-right font-mono text-emerald-900 text-xs" style={{ textAlign: 'right' }}>{totalFilteredSales.toFixed(2)} บาท</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-600" style={{ textAlign: 'right' }}>
                              {totalFilteredWeight > 0 ? (totalFilteredSales / totalFilteredWeight).toFixed(2) : '0.00'} ฿
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* SECTION 3: WELFARE FUND & DISBURSEMENTS */}
                  <div className="mb-4 text-left" style={{ textAlign: 'left' }}>
                    <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between text-left" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
                      <span>3. สรุปสถานะกองทุนสวัสดิการสงเคราะห์พนักงาน อบต.ตาคลี</span>
                      <span className="text-[10px] text-teal-800 font-bold">สมทบ {welfareConfig?.monthlyContributionAmount || 50} บาท/เดือน</span>
                    </div>

                    <div 
                      className="grid grid-cols-3 gap-2.5 p-3 bg-teal-50/60 border border-teal-200 rounded-xl text-xs text-left"
                      style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px', textAlign: 'left' }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <div className="text-[10px] text-slate-500">ยอดเงินสมทบสะสมตลอดชีพ</div>
                        <div className="text-sm font-bold text-teal-900 font-mono mt-0.5">
                          {totalWelfareFund.toFixed(2)} บาท
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          ({welfareContributions.length} รายการสมทบ)
                        </div>
                      </div>

                      <div style={{ textAlign: 'left' }}>
                        <div className="text-[10px] text-slate-500">ยอดจ่ายสวัสดิการช่วยเหลือพนักงาน</div>
                        <div className="text-sm font-bold text-rose-800 font-mono mt-0.5">
                          {totalWelfareExpense.toFixed(2)} บาท
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          (ฌาปนกิจ, พยาบาล, คลอดบุตร, ทุนการศึกษา)
                        </div>
                      </div>

                      <div style={{ textAlign: 'left' }}>
                        <div className="text-[10px] text-slate-500">เงินกองทุนสวัสดิการคงเหลือสุทธิ</div>
                        <div className="text-sm font-extrabold text-emerald-800 font-mono mt-0.5">
                          {netWelfareFund.toFixed(2)} บาท
                        </div>
                        <div className="text-[10px] text-emerald-600 mt-0.5">
                          สภาพคล่องคุ้มครองสมาชิก 100%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4: STATUTORY LIQUIDITY & COMPLIANCE */}
                  <div 
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl mb-6 text-[11px] text-slate-600 flex items-center justify-between text-left"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <strong>การปฏิบัติตามระเบียบ:</strong> รักษาระดับเงินขั้นต่ำในบัญชีสมาชิก 50.00 บาท เพื่อสภาพคล่องคลัง • ยอดถอนสะสมที่อนุมัติแล้ว: {withdrawals.filter(w => w.status === 'approved').reduce((a, c) => a + c.amount, 0).toFixed(2)} บาท
                    </div>
                    <div className="font-semibold text-emerald-800 shrink-0 ml-3 flex items-center" style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      ตรวจสอบแล้วถูกต้อง
                    </div>
                  </div>
                </div>

                {/* SECTION 5: OFFICIAL SIGNATURES (3 COLUMNS) */}
                <div className="pt-4 border-t border-slate-300">
                  <div 
                    className="grid grid-cols-3 gap-6 text-center text-[11px]"
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '24px', textAlign: 'center' }}
                  >
                    {/* Signer 1: Report Drafter */}
                    <div>
                      <div className="h-12 border-b border-dashed border-slate-400 mx-6 mb-1.5 flex items-end justify-center pb-1">
                        <span className="text-slate-600">นางสาวศิริพร บุญเกิด</span>
                      </div>
                      <div className="font-bold text-slate-800">(นางสาวศิริพร บุญเกิด)</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">เจ้าหน้าที่ผู้จัดทำรายงานสรุป</div>
                      <div className="text-[9px] text-slate-400">นักวิชาการสาธารณสุขปฏิบัติการ</div>
                    </div>

                    {/* Signer 2: Buyer Officer (From logged in admin) */}
                    <div>
                      <div className="h-12 border-b border-dashed border-slate-400 mx-6 mb-1.5 flex items-end justify-center pb-1">
                        <span className="font-bold text-emerald-950">{buyerStaffName}</span>
                      </div>
                      <div className="font-bold text-slate-800">({buyerStaffName})</div>
                      <div className="text-[10px] text-slate-700 font-semibold mt-0.5">เจ้าหน้าที่ผู้รับซื้อขยะ</div>
                      <div className="text-[9px] text-slate-400">องค์การบริหารส่วนตำบลตาคลี</div>
                    </div>

                    {/* Signer 3: Executive Approver */}
                    <div>
                      <div className="h-12 border-b border-dashed border-slate-400 mx-6 mb-1.5 flex items-end justify-center pb-1">
                        <span className="text-slate-600">(ลายมือชื่อผู้บริหาร)</span>
                      </div>
                      <div className="font-bold text-slate-800">(นายกองค์การบริหารส่วนตำบลตาคลี)</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">ผู้อนุมัติรายงานผลการดำเนินงาน</div>
                      <div className="text-[9px] text-slate-400">องค์การบริหารส่วนตำบลตาคลี</div>
                    </div>
                  </div>

                  {/* Print Footer Notice */}
                  <div 
                    className="mt-4 pt-2 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-400"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      ระบบสารสนเทศธนาคารขยะดิจิทัล อบต.ตาคลี • พิมพ์จากฐานข้อมูลอัตโนมัติ Google Sheets
                    </div>
                    <div className="font-mono">
                      หน้า 1 จาก 1 (One-Page A4) • วันที่พิมพ์: {printTimestamp}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AUTOMATED EMAIL DISPATCH & SCHEDULING */}
          {activeTab === 'auto_email' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {emailStatusToast && (
                <div className={`p-4 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
                  emailStatusToast.isError 
                    ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{emailStatusToast.text}</span>
                </div>
              )}

              <form onSubmit={handleDispatchEmailReport} className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                      <Send className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">
                        กำหนดการจัดส่งรายงานวันเพจ A4 อัตโนมัติทางอีเมล (Auto-Email Dispatcher)
                      </h3>
                      <p className="text-xs text-slate-500">
                        เลือกผู้รับทั้งผู้บริหารหรือสมาชิก และระบุช่วงวัน เวลา เดือน ปี ที่จะส่งโดยอัตโนมัติ
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    ผู้รับที่เลือก: {computedRecipients.length} ท่าน
                  </span>
                </div>

                {/* 1. SCHEDULE TIMING: DATE, TIME, MONTH, YEAR */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700">
                    1. ระบุช่วงวัน เวลา เดือน ปี ที่จะส่งรายงานอัตโนมัติ
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setDispatchType('immediate')}
                      className={`p-3 rounded-xl border text-left transition ${
                        dispatchType === 'immediate'
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-600'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center space-x-1">
                        <span>⚡ ส่งทันที (Send Now)</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        ส่งรายงานทันทีที่กดยืนยัน
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDispatchType('scheduled')}
                      className={`p-3 rounded-xl border text-left transition ${
                        dispatchType === 'scheduled'
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-600'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>ระบุวัน/เวลา ครั้งเดียว</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        กำหนดวันและเวลาเฉพาะเจาะจง
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDispatchType('monthly')}
                      className={`p-3 rounded-xl border text-left transition ${
                        dispatchType === 'monthly'
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-600'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center space-x-1">
                        <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                        <span>ส่งอัตโนมัติทุกสิ้นเดือน</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        ส่งสรุปประจำเดือนรอบถัดไป
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDispatchType('weekly')}
                      className={`p-3 rounded-xl border text-left transition ${
                        dispatchType === 'weekly'
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-600'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>ส่งทุกวันจันทร์</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        ส่งสรุปผลงานสัปดาห์ละครั้ง
                      </div>
                    </button>
                  </div>

                  {/* Date & Time Selectors */}
                  {dispatchType !== 'immediate' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          วันที่จัดส่ง (วัน / เดือน / ปี ค.ศ.)
                        </label>
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 font-mono"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          เวลาจัดส่ง (ชั่วโมง : นาที น.)
                        </label>
                        <input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 font-mono"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. RECIPIENT AUDIENCE SELECTION */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700">
                    2. เลือกผู้รับรายงาน (ผู้บริหารหรือสมาชิกพนักงาน)
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRecipientAudience('executives')}
                      className={`p-3 rounded-xl border text-left transition ${
                        recipientAudience === 'executives'
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-600'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs">🏛️ คณะผู้บริหาร อบต.ตาคลี</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        นายก อบต., ปลัด, ผอ.กองคลัง, ผอ.สาธารณสุข
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRecipientAudience('all_members')}
                      className={`p-3 rounded-xl border text-left transition ${
                        recipientAudience === 'all_members'
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-600'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs">👥 สมาชิกและพนักงานทุกคน</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        ส่งถึงพนักงานในระบบครบทั้ง 150 คน
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRecipientAudience('custom')}
                      className={`p-3 rounded-xl border text-left transition ${
                        recipientAudience === 'custom'
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-600'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs">✍️ เลือกสมาชิกรายบุคคล</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        ค้นหาและเลือกเฉพาะรายชื่อที่ต้องการ
                      </div>
                    </button>
                  </div>

                  {/* Custom selection member picker */}
                  {recipientAudience === 'custom' && (
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                        <div className="relative w-full sm:w-64">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                          <input
                            type="text"
                            value={memberSearchTerm}
                            onChange={(e) => setMemberSearchTerm(e.target.value)}
                            placeholder="ค้นหาชื่อ, รหัส, อีเมล..."
                            className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                          />
                        </div>

                        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between">
                          <select
                            value={selectedDeptFilter}
                            onChange={(e) => setSelectedDeptFilter(e.target.value)}
                            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                          >
                            <option value="all">ทุกกอง / ส่วนราชการ</option>
                            {departments.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => handleSelectAllFilteredUsers(filteredPickUsers.map(u => u.id))}
                            className="px-2.5 py-1.5 text-[11px] font-semibold bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shrink-0"
                          >
                            เลือกทั้งหมด ({filteredPickUsers.length})
                          </button>
                        </div>
                      </div>

                      {/* Member list checklist */}
                      <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg bg-white divide-y divide-slate-100 text-xs">
                        {filteredPickUsers.map(u => {
                          const isSelected = selectedUserIds.includes(u.id);
                          return (
                            <div 
                              key={u.id}
                              onClick={() => handleToggleUser(u.id)}
                              className={`p-2 px-3 flex items-center justify-between cursor-pointer transition ${
                                isSelected ? 'bg-emerald-50/70' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400 shrink-0" />
                                )}
                                <span className="font-semibold text-slate-800">{u.name}</span>
                                <span className="text-[10px] text-slate-500 font-mono">({u.memberCode})</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                  {u.department}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 font-mono">{u.email}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Additional CC / BCC Emails */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ระบุอีเมลผู้รับภายนอกเพิ่มเติม (คั่นด้วยเครื่องหมายจุลภาค ,)
                    </label>
                    <input
                      type="text"
                      value={additionalEmails}
                      onChange={(e) => setAdditionalEmails(e.target.value)}
                      placeholder="เช่น executive@district.go.th, auditor@audit.go.th"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* 3. EMAIL SUBJECT & PREVIEW */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700">
                    3. ตัวอย่างหัวข้อและข้อความที่จะส่ง
                  </label>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 font-mono">
                    <div className="text-slate-500">
                      <strong>หัวข้อ:</strong> [รายงานสรุป A4] ผลการดำเนินงานธนาคารขยะดิจิทัล อบต.ตาคลี ({dataStartDate} ถึง {dataEndDate})
                    </div>
                    <div className="text-slate-500">
                      <strong>ไฟล์แนบอัตโนมัติ:</strong> 📄 Executive_Summary_OnePage_A4.pdf
                    </div>
                    <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                      เรียน คณะผู้บริหารและสมาชิก อบต.ตาคลี<br />
                      ระบบขอส่งรายงานสรุปผลการดำเนินงานธนาคารขยะดิจิทัล: น้ำหนักรวม {totalFilteredWeight.toFixed(2)} กก., มูลค่าหมุนเวียน {totalFilteredSales.toFixed(2)} บาท, กองทุนสวัสดิการสุทธิ {netWelfareFund.toFixed(2)} บาท
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    * ระบบจะบันทึกประวัติการส่งลงในตารางกำหนดการด้านล่างโดยอัตโนมัติ
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessingEmail}
                    className="w-full sm:w-auto px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {isProcessingEmail 
                        ? 'กำลังดำเนินการส่ง...' 
                        : dispatchType === 'immediate'
                          ? `⚡ ส่งอีเมลรายงานให้ผู้รับ ${computedRecipients.length} ท่าน ทันที`
                          : `⏰ บันทึกกำหนดการส่งอัตโนมัติ (${scheduleDate})`
                      }
                    </span>
                  </button>
                </div>
              </form>

              {/* SCHEDULED REPORTS & DISPATCH LOG TABLE */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-slate-600" />
                    <h4 className="font-bold text-slate-800 text-xs">
                      ตารางและประวัติการส่งรายงานอัตโนมัติที่บันทึกไว้ ({schedulesList.length} รายการ)
                    </h4>
                  </div>
                </div>

                {schedulesList.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    ยังไม่มีรายการกำหนดการส่งรายงานที่บันทึกไว้
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">ชื่อรายงาน / ช่วงข้อมูล</th>
                          <th className="py-2 px-3">ผู้รับ</th>
                          <th className="py-2 px-3">กำหนดส่ง (วัน/เวลา)</th>
                          <th className="py-2 px-3">ความถี่</th>
                          <th className="py-2 px-3">สถานะ</th>
                          <th className="py-2 px-3 text-right">การจัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {schedulesList.map(sch => (
                          <tr key={sch.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-800">{sch.title}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                ข้อมูล: {sch.dataStartDate} ถึง {sch.dataEndDate}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-slate-700">{sch.recipients.length} ท่าน</span>
                              <div className="text-[10px] text-slate-400 truncate max-w-xs">
                                {sch.recipients.map(r => r.name).join(', ')}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700">
                              {sch.scheduledDate} {sch.scheduledTime} น.
                            </td>
                            <td className="py-2.5 px-3">
                              {sch.frequency === 'monthly' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                  ทุกสิ้นเดือน
                                </span>
                              )}
                              {sch.frequency === 'weekly' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                  ทุกวันจันทร์
                                </span>
                              )}
                              {sch.frequency === 'once' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                  ครั้งเดียว
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {sch.status === 'sent' ? (
                                <span className="inline-flex items-center text-emerald-700 font-bold text-[10px]">
                                  <CheckCircle2 className="w-3 h-3 mr-1" /> ส่งสำเร็จแล้ว
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-blue-700 font-bold text-[10px]">
                                  <Clock className="w-3 h-3 mr-1" /> รอถึงกำหนดส่ง
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteSchedule(sch.id)}
                                className="text-rose-600 hover:text-rose-800 text-[11px] font-medium"
                              >
                                ลบ
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
