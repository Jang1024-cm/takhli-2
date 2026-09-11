import React, { useState } from 'react';
import { useWasteBank } from '../context/WasteBankContext';
import { 
  BarChart3, 
  Scale, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Settings, 
  Users, 
  Plus, 
  Search, 
  KeyRound, 
  Shield, 
  ArrowUpRight, 
  FileSpreadsheet, 
  Printer, 
  Mail, 
  Send,
  Sparkles,
  TrendingUp,
  Tag,
  Coins,
  Trash2,
  Camera,
  Edit3,
  Building2,
  AlertTriangle,
  Download,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  HeartHandshake,
  Banknote,
  ShieldCheck,
  ShieldAlert,
  Bell,
  FileText,
  History,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import confetti from 'canvas-confetti';
import { WasteCategory, WastePriceItem, User } from '../types';
import { WelfareAdminSection } from './WelfareAdminSection';
import { AdminSettings } from './AdminSettings';
import { MemberProfileModal } from './MemberProfileModal';
import { ExecutiveSummaryA4Modal } from './ExecutiveSummaryA4Modal';
import { ActivityLogsView } from './ActivityLogsView';
import { exportMembersToCsv, downloadCsvForExcel } from '../utils/backupRestore';
import { compressImageFile } from '../utils/imageCompressor';

interface AdminPanelProps {
  onOpenStatementModalForMember: (memberCode: string) => void;
  onOpenAlertsModalForMember: (memberCode: string, depositId?: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onOpenStatementModalForMember,
  onOpenAlertsModalForMember
}) => {
  const { 
    currentUser, 
    users, 
    prices, 
    deposits, 
    withdrawals, 
    getOrgStats, 
    recordDeposit, 
    approveWithdrawal, 
    rejectWithdrawal, 
    updatePrice, 
    updatePriceItem,
    deletePriceItem,
    addNewPriceItem, 
    resetUserPassword, 
    updateUserRole, 
    toggleUserActiveStatus,
    toggleUserWithdrawalPermission,
    toggleUserWelfareOptOutPermission,
    getMemberSummary, 
    getAllMembersSummary,
    departments,
    adminCreateUser,
    getNextMemberCode,
    pullFromGoogleSheet,
    isSyncing
  } = useWasteBank();

  const [sheetSyncStatus, setSheetSyncStatus] = useState<string | null>(null);

  const handlePullPricesFromSheet = async () => {
    setSheetSyncStatus('กำลังดึงข้อมูลราคาล่าสุดจาก Google Sheets...');
    const res = await pullFromGoogleSheet();
    setSheetSyncStatus(res.message);
    setTimeout(() => {
      setSheetSyncStatus(null);
    }, 6000);
  };

  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'overview' | 'deposit' | 'withdrawals' | 'prices' | 'members' | 'welfare' | 'alerts' | 'logs' | 'orgSettings'>('overview');
  const [isAdminNavCollapsed, setIsAdminNavCollapsed] = useState<boolean>(false);
  const [isExecutiveSummaryModalOpen, setIsExecutiveSummaryModalOpen] = useState<boolean>(false);

  // Edit Full Price Item State
  const [editingPriceFullItem, setEditingPriceFullItem] = useState<WastePriceItem | null>(null);
  const [fullEditCategory, setFullEditCategory] = useState<WasteCategory>('พลาสติก');
  const [fullEditSubType, setFullEditSubType] = useState<string>('');
  const [fullEditPrice, setFullEditPrice] = useState<string>('');

  // Member Profile Edit modal state
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<User | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Quick Deposit Station state
  const [selectedMemberCode, setSelectedMemberCode] = useState<string>('MB001');
  const [selectedWasteCode, setSelectedWasteCode] = useState<string>('PL01');
  const [depositWeight, setDepositWeight] = useState<string>('');
  const [depositNote, setDepositNote] = useState<string>('');
  const [depositMsg, setDepositMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [lastCreatedDepositId, setLastCreatedDepositId] = useState<string | null>(null);

  // Price editor state
  const [editingPriceCode, setEditingPriceCode] = useState<string | null>(null);
  const [newPriceValue, setNewPriceValue] = useState<string>('');
  const [showAddPriceModal, setShowAddPriceModal] = useState<boolean>(false);
  const [newCode, setNewCode] = useState<string>('');
  const [newCategory, setNewCategory] = useState<WasteCategory>('พลาสติก');
  const [newSubType, setNewSubType] = useState<string>('');
  const [newPrice, setNewPrice] = useState<string>('');

  // Members filter & password reset modal state
  const [memberSearch, setMemberSearch] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [resetTargetUser, setResetTargetUser] = useState<{ memberCode: string; name: string } | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState<string>('password123');
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  const orgStats = getOrgStats();
  const membersSummary = getAllMembersSummary();

  // Selected item price calculation
  const currentSelectedPriceItem = prices.find(p => p.code === selectedWasteCode) || prices[0];
  const calculatedTotal = (parseFloat(depositWeight) || 0) * (currentSelectedPriceItem?.currentPrice || 0);

  // Deposit Submit Handler
  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDepositMsg(null);
    const weightNum = parseFloat(depositWeight);
    if (isNaN(weightNum) || weightNum <= 0) {
      setDepositMsg({ text: 'กรุณากรอกน้ำหนักที่มากกว่า 0 กิโลกรัม', isError: true });
      return;
    }

    const res = recordDeposit(selectedMemberCode, selectedWasteCode, weightNum, depositNote);
    if (res.success && res.record) {
      setDepositMsg({ text: res.message, isError: false });
      setLastCreatedDepositId(res.record.id);
      setDepositWeight('');
      setDepositNote('');

      // Trigger eco celebratory confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#059669', '#34d399', '#f59e0b']
      });
    } else {
      setDepositMsg({ text: res.message, isError: true });
    }
  };

  // Price Edit Submit
  const handleSavePrice = (code: string) => {
    const p = parseFloat(newPriceValue);
    if (!isNaN(p) && p >= 0) {
      updatePrice(code, p);
      setEditingPriceCode(null);
      setNewPriceValue('');
    }
  };

  const handleAddPriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(newPrice);
    if (!newCode || !newSubType || isNaN(p) || p < 0) return;

    addNewPriceItem({
      code: newCode.toUpperCase(),
      category: newCategory,
      subType: newSubType,
      currentPrice: p,
      effectiveMonth: 'กันยายน 2026',
      unit: 'กก.'
    });

    setShowAddPriceModal(false);
    setNewCode('');
    setNewSubType('');
    setNewPrice('');
  };

  const handleDeletePrice = (code: string, subType: string) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบชนิดขยะ "${subType}" (รหัส: ${code}) ออกจากฐานข้อมูล?`)) {
      const success = deletePriceItem(code);
      if (!success) {
        alert('ไม่สามารถลบชนิดขยะได้ (เฉพาะผู้ดูแลระบบ)');
      }
    }
  };

  const handleOpenEditFullPrice = (item: WastePriceItem) => {
    setEditingPriceFullItem(item);
    setFullEditCategory(item.category);
    setFullEditSubType(item.subType);
    setFullEditPrice(item.currentPrice.toString());
  };

  const handleSaveFullPriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPriceFullItem) return;
    const priceNum = parseFloat(fullEditPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      alert('กรุณากรอกราคาต่อหน่วยที่ถูกต้อง');
      return;
    }

    updatePriceItem(editingPriceFullItem.code, {
      category: fullEditCategory,
      subType: fullEditSubType.trim() || editingPriceFullItem.subType,
      currentPrice: priceNum
    });
    setEditingPriceFullItem(null);
  };

  // Password reset handler
  const handleConfirmPasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser || !newPasswordInput) return;
    resetUserPassword(resetTargetUser.memberCode, newPasswordInput);
    setResetSuccessMsg(`รีเซ็ตรหัสผ่านของ ${resetTargetUser.name} สำเร็จแล้ว`);
    setTimeout(() => {
      setResetSuccessMsg(null);
      setResetTargetUser(null);
      setNewPasswordInput('password123');
    }, 2000);
  };

  // Pie chart colors
  const PIE_COLORS: Record<string, string> = {
    'กระดาษ': '#3b82f6',
    'พลาสติก': '#10b981',
    'โลหะ': '#f59e0b',
    'แก้ว': '#8b5cf6'
  };

  // Permission filter & quick notification toast
  const [permissionFilter, setPermissionFilter] = useState<'all' | 'active' | 'suspended' | 'canWithdraw' | 'blockedWithdraw'>('all');
  const [permissionToast, setPermissionToast] = useState<string | null>(null);

  const handleToggleUserActive = (u: User) => {
    if (u.memberCode === currentUser?.memberCode && u.isActive !== false) {
      alert('ไม่สามารถระงับสิทธิ์บัญชีผู้ดูแลระบบที่กำลังใช้งานอยู่ได้');
      return;
    }
    const nextVal = u.isActive === false;
    const res = toggleUserActiveStatus(u.memberCode, nextVal);
    if (res.success) {
      setPermissionToast(res.message);
      setTimeout(() => setPermissionToast(null), 3500);
    }
  };

  const handleToggleUserWithdrawal = (u: User) => {
    const nextVal = u.canWithdraw === false;
    const res = toggleUserWithdrawalPermission(u.memberCode, nextVal);
    if (res.success) {
      setPermissionToast(res.message);
      setTimeout(() => setPermissionToast(null), 3500);
    }
  };

  // Filtered members
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
                          u.memberCode.toLowerCase().includes(memberSearch.toLowerCase()) ||
                          u.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
                          (u.nationalId && u.nationalId.includes(memberSearch));
    const matchesDept = departmentFilter === 'all' || u.department === departmentFilter;

    let matchesPerm = true;
    if (permissionFilter === 'active') {
      matchesPerm = u.isActive !== false;
    } else if (permissionFilter === 'suspended') {
      matchesPerm = u.isActive === false;
    } else if (permissionFilter === 'canWithdraw') {
      matchesPerm = u.canWithdraw !== false;
    } else if (permissionFilter === 'blockedWithdraw') {
      matchesPerm = u.canWithdraw === false;
    }

    return matchesSearch && matchesDept && matchesPerm;
  });

  // Pagination & custom rows per page for members
  const [rowsPerPage, setRowsPerPage] = useState<number>(30);
  const [customRowsInput, setCustomRowsInput] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Add Member Modal State
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState<boolean>(false);
  const [addMemberName, setAddMemberName] = useState<string>('');
  const [addMemberDept, setAddMemberDept] = useState<string>('');
  const [addMemberNationalId, setAddMemberNationalId] = useState<string>('');
  const [addMemberEmail, setAddMemberEmail] = useState<string>('');
  const [addMemberPhone, setAddMemberPhone] = useState<string>('');
  const [addMemberCode, setAddMemberCode] = useState<string>('');
  const [addMemberPassword, setAddMemberPassword] = useState<string>('123456');
  const [addMemberRole, setAddMemberRole] = useState<'member' | 'admin'>('member');
  const [addMemberWelfare, setAddMemberWelfare] = useState<boolean>(true);
  const [addMemberAvatar, setAddMemberAvatar] = useState<string>('');
  const [addMemberIsActive, setAddMemberIsActive] = useState<boolean>(true);
  const [addMemberCanWithdraw, setAddMemberCanWithdraw] = useState<boolean>(true);
  const [addMemberStatusReason, setAddMemberStatusReason] = useState<string>('');
  const [isUploadingAddAvatar, setIsUploadingAddAvatar] = useState<boolean>(false);
  const [addMemberError, setAddMemberError] = useState<string>('');
  const [addMemberSuccess, setAddMemberSuccess] = useState<string>('');

  // Export to Excel handler
  const handleExportMembersToExcel = () => {
    const csv = exportMembersToCsv(filteredUsers, getMemberSummary);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCsvForExcel(csv, `ทะเบียนสมาชิก_อบต_ตาคลี_${dateStr}.csv`);
  };

  // Open add member modal handler
  const handleOpenAddMemberModal = () => {
    const nextCode = getNextMemberCode();
    setAddMemberCode(nextCode);
    setAddMemberName('');
    setAddMemberDept(departments[0] || 'สำนักปลัด');
    setAddMemberNationalId('');
    setAddMemberEmail(`member_${nextCode.toLowerCase()}@takhli.go.th`);
    setAddMemberPhone('');
    setAddMemberPassword('123456');
    setAddMemberRole('member');
    setAddMemberWelfare(true);
    setAddMemberAvatar('');
    setAddMemberIsActive(true);
    setAddMemberCanWithdraw(true);
    setAddMemberStatusReason('');
    setAddMemberError('');
    setAddMemberSuccess('');
    setIsAddMemberModalOpen(true);
  };

  // Handle add member submit
  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddMemberError('');
    if (!addMemberName.trim()) {
      setAddMemberError('กรุณากรอกชื่อ-นามสกุลสมาชิก');
      return;
    }

    const res = adminCreateUser({
      name: addMemberName.trim(),
      memberCode: addMemberCode.trim(),
      department: addMemberDept || departments[0] || 'สำนักปลัด',
      nationalId: addMemberNationalId.trim() || undefined,
      email: addMemberEmail.trim() || `member_${addMemberCode.toLowerCase()}@takhli.go.th`,
      phone: addMemberPhone.trim() || undefined,
      password: addMemberPassword.trim() || '123456',
      role: addMemberRole,
      welfareEnrolled: addMemberWelfare,
      avatarUrl: addMemberAvatar || undefined,
      isActive: addMemberIsActive,
      canWithdraw: addMemberCanWithdraw,
      statusReason: addMemberStatusReason.trim() || undefined
    });

    if (!res.success) {
      setAddMemberError(res.message);
    } else {
      setAddMemberSuccess(res.message);
      setTimeout(() => {
        setIsAddMemberModalOpen(false);
        setAddMemberSuccess('');
      }, 1200);
    }
  };

  // Handle add member avatar upload & compress
  const handleAddMemberAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAddAvatar(true);
    setAddMemberError('');
    try {
      const compressed = await compressImageFile(file, { maxWidth: 200, maxHeight: 200, quality: 0.85, maxKBytes: 40 });
      setAddMemberAvatar(compressed);
    } catch (err: any) {
      setAddMemberError(err.message || 'ไม่สามารถบีบอัดรูปภาพได้');
    } finally {
      setIsUploadingAddAvatar(false);
      e.target.value = '';
    }
  };

  // Handle apply custom rows per page
  const handleApplyCustomRows = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customRowsInput, 10);
    if (!isNaN(val) && val > 0) {
      setRowsPerPage(val);
      setCurrentPage(1);
    }
  };

  // Pagination calculation
  const totalFilteredCount = filteredUsers.length;
  const effectivePerPage = rowsPerPage > 0 ? rowsPerPage : (totalFilteredCount || 1);
  const totalPages = Math.ceil(totalFilteredCount / effectivePerPage) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * effectivePerPage;
  const endIndex = rowsPerPage > 0 ? Math.min(startIndex + effectivePerPage, totalFilteredCount) : totalFilteredCount;
  const displayedUsers = rowsPerPage > 0 ? filteredUsers.slice(startIndex, endIndex) : filteredUsers;

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');

  return (
    <div className="space-y-6 pb-12">
      {/* Admin Title & Sub-tabs */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl font-bold">
              <Shield className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                ศูนย์ควบคุมผู้ดูแลระบบ (Admin Panel)
              </h1>
              <p className="text-xs text-slate-500">
                องค์การบริหารส่วนตำบลตาคลี • ควบคุมตารางราคาและอนุมัติการถอนเงิน
              </p>
            </div>
          </div>

          {/* Quick Action Buttons for Alerts and Executive A4 Summary */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveAdminSubTab('alerts')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 active:scale-95 border ${
                activeAdminSubTab === 'alerts'
                  ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-400'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
              }`}
              title="ระบบแจ้งเตือนอัตโนมัติ (Telegram & Email Alert)"
            >
              <Bell className="w-4 h-4 text-amber-600" />
              <span>ระบบแจ้งเตือนอัตโนมัติ (Telegram & Email Alert)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExecutiveSummaryModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5 active:scale-95 border border-emerald-800"
              title="สรุปรายละเอียดทั้งหมดของระบบเป็น A4 One-Page (พิมพ์ PDF และส่งอีเมลอัตโนมัติ)"
            >
              <FileText className="w-4 h-4 text-emerald-200" />
              <span>สรุปรายงานระบบ วันเพจ A4 (พิมพ์ PDF / ส่งอีเมล)</span>
            </button>
          </div>
        </div>

        {/* Sub-tab Navigation: Beautiful grid of buttons fitting on one screen without scrollbar */}
        <div className="pt-2 border-t border-slate-100">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveAdminSubTab('overview')}
              className={`flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                activeAdminSubTab === 'overview'
                  ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-600'
                  : 'bg-white hover:bg-emerald-50/60 text-slate-700 hover:text-emerald-900 border border-slate-200/70 shadow-2xs'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span className="truncate">สรุปภาพรวม</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAdminSubTab('deposit')}
              className={`flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                activeAdminSubTab === 'deposit'
                  ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-600'
                  : 'bg-white hover:bg-emerald-50/60 text-slate-700 hover:text-emerald-900 border border-slate-200/70 shadow-2xs'
              }`}
            >
              <Scale className="w-4 h-4 shrink-0" />
              <span className="truncate">บันทึกฝากขยะ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAdminSubTab('withdrawals')}
              className={`flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                activeAdminSubTab === 'withdrawals'
                  ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-600'
                  : 'bg-white hover:bg-emerald-50/60 text-slate-700 hover:text-emerald-900 border border-slate-200/70 shadow-2xs'
              }`}
            >
              <Coins className="w-4 h-4 shrink-0" />
              <span className="truncate">อนุมัติออมเงิน</span>
              {pendingWithdrawals.length > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px] font-bold shrink-0">
                  {pendingWithdrawals.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveAdminSubTab('prices')}
              className={`flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                activeAdminSubTab === 'prices'
                  ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-600'
                  : 'bg-white hover:bg-emerald-50/60 text-slate-700 hover:text-emerald-900 border border-slate-200/70 shadow-2xs'
              }`}
            >
              <Tag className="w-4 h-4 shrink-0" />
              <span className="truncate">ราคากลางรับซื้อ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAdminSubTab('members')}
              className={`flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                activeAdminSubTab === 'members'
                  ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-600'
                  : 'bg-white hover:bg-emerald-50/60 text-slate-700 hover:text-emerald-900 border border-slate-200/70 shadow-2xs'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className="truncate">ทะเบียนพนักงาน</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAdminSubTab('welfare')}
              className={`flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                activeAdminSubTab === 'welfare'
                  ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-600'
                  : 'bg-white hover:bg-emerald-50/60 text-slate-700 hover:text-emerald-900 border border-slate-200/70 shadow-2xs'
              }`}
            >
              <HeartHandshake className="w-4 h-4 shrink-0" />
              <span className="truncate">กองทุนสวัสดิการ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAdminSubTab('alerts')}
              className={`flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                activeAdminSubTab === 'alerts'
                  ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-500'
                  : 'bg-white hover:bg-amber-50/60 text-slate-700 hover:text-amber-900 border border-slate-200/70 shadow-2xs'
              }`}
            >
              <Bell className="w-4 h-4 shrink-0 text-amber-500 group-hover:text-amber-600" />
              <span className="truncate">แจ้งเตือนอัตโนมัติ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAdminSubTab('logs')}
              className={`flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                activeAdminSubTab === 'logs'
                  ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-800'
                  : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/70 shadow-2xs'
              }`}
            >
              <History className="w-4 h-4 shrink-0 text-emerald-500" />
              <span className="truncate">ล็อกกิจกรรม (Audit)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAdminSubTab('orgSettings')}
              className={`flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                activeAdminSubTab === 'orgSettings'
                  ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-600'
                  : 'bg-white hover:bg-emerald-50/60 text-slate-700 hover:text-emerald-900 border border-slate-200/70 shadow-2xs'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span className="truncate">ตั้งค่าระบบ</span>
            </button>
          </div>
        </div>
      </div>


      {/* SUB-TAB 1: OVERVIEW DASHBOARD */}
      {activeAdminSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Executive Quick Actions Bar */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  ศูนย์ควบคุมหลัก
                </span>
                <h3 className="font-bold text-sm sm:text-base text-white">
                  ระบบส่งรายงานผู้บริหาร & แจ้งเตือนอัตโนมัติ (Telegram & Email)
                </h3>
              </div>
              <p className="text-xs text-emerald-100/80 max-w-2xl">
                สร้างรายงานสรุปภาพรวมขนาดวันเพจ A4 สั่งพิมพ์ออก PDF ส่งอีเมลถึงผู้บริหารหรือสมาชิกตามกำหนดเวลา และตั้งค่าการแจ้งเตือนอัตโนมัติแบบเรียลไทม์
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setActiveAdminSubTab('alerts')}
                className="flex-1 md:flex-initial px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-extrabold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Bell className="w-4 h-4 text-slate-900" />
                <span>ระบบแจ้งเตือนอัตโนมัติ (Telegram & Email)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsExecutiveSummaryModalOpen(true)}
                className="flex-1 md:flex-initial px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-950 font-extrabold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>สรุปรายงานวันเพจ A4 (พิมพ์ PDF / ส่งอีเมล)</span>
              </button>
            </div>
          </div>

          {/* 4 High-Level Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ขยะสะสมรวม</div>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-800">
                {orgStats.totalRecycledWeight.toFixed(1)}{' '}
                <span className="text-sm font-normal text-slate-500">กก.</span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-700 font-medium">
                คัดแยกช่วยสิ่งแวดล้อมตาคลี
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">มูลค่าเงินสะสมรวม</div>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-700">
                {orgStats.totalMoneyDistributed.toFixed(2)}{' '}
                <span className="text-sm font-normal text-slate-500">บาท</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                แปลงขยะเป็นสวัสดิการ
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">สภาพคล่องคลังคงเหลือ</div>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-800">
                {orgStats.totalTreasuryRemainingBalance.toFixed(2)}{' '}
                <span className="text-sm font-normal text-slate-500">บาท</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                หักถอนแล้ว: {orgStats.totalTreasuryApprovedWithdrawals.toFixed(2)} บาท
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">สมาชิกที่ร่วมโครงการ</div>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-teal-700">
                {orgStats.activeRecyclersCount}{' '}
                <span className="text-sm font-normal text-slate-500">คน</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                สมาชิกที่เคยมีประวัติฝากขยะในระบบ
              </div>
            </div>
          </div>

          {/* 2 Graphical Visualizations (Recharts Bar & Pie) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Bar Chart by Category (น้ำหนักขยะแยกตามประเภท) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">ปริมาณขยะแยกตามประเภท (กก.)</h3>
                  <p className="text-xs text-slate-500">สถิติน้ำหนักขยะสะสมจาก 4 หมวดหมู่หลัก</p>
                </div>
                <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={orgStats.categoryWeights} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <XAxis dataKey="category" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip
                      formatter={(value: any) => [`${value} กก.`, 'ปริมาณรวม']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Bar dataKey="weight" radius={[6, 6, 0, 0]}>
                      {orgStats.categoryWeights.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.category] || '#10b981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-100 text-center text-xs">
                {orgStats.categoryWeights.map(c => (
                  <div key={c.category} className="p-2 bg-slate-50 rounded-xl">
                    <div className="font-medium text-slate-700">{c.category}</div>
                    <div className="font-bold font-mono text-emerald-700 mt-0.5">{c.weight} กก.</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Pie Chart by Revenue Proportion (สัดส่วนมูลค่าเงินสวัสดิการ) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">สัดส่วนมูลค่าเงินสวัสดิการแยกตามประเภทขยะ</h3>
                  <p className="text-xs text-slate-500">โครงสร้างรายได้ที่คืนกลับสู่พนักงาน อบต.ตาคลี</p>
                </div>
                <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                  <Coins className="w-4 h-4" />
                </span>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orgStats.categoryWeights}
                      dataKey="value"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={3}
                    >
                      {orgStats.categoryWeights.map((entry, index) => (
                        <Cell key={`pie-cell-${index}`} fill={PIE_COLORS[entry.category] || '#10b981'} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [`${value} บาท`, 'มูลค่า']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-100 text-center text-xs">
                {orgStats.categoryWeights.map(c => (
                  <div key={c.category} className="p-2 bg-slate-50 rounded-xl">
                    <div className="font-medium text-slate-700">{c.category}</div>
                    <div className="font-bold font-mono text-slate-800 mt-0.5">{c.value.toFixed(1)} ฿</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Leaderboard Top 5 Eco Champions */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">🏆 อันดับสมาชิกผู้รักษ์โลก (Top Recyclers)</h3>
                <p className="text-xs text-slate-500">จัดอันดับตามปริมาณน้ำหนักขยะที่นำมาฝากสะสม</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="p-3 w-16 text-center">อันดับ</th>
                    <th className="p-3">รหัส / ชื่อสมาชิก</th>
                    <th className="p-3">สังกัด / กอง</th>
                    <th className="p-3 text-right">น้ำหนักรวม (กก.)</th>
                    <th className="p-3 text-right">ยอดเงินสะสม (บาท)</th>
                    <th className="p-3 text-center">สถานะบัญชี</th>
                    <th className="p-3 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {membersSummary
                    .sort((a, b) => b.totalWeightKg - a.totalWeightKg)
                    .slice(0, 5)
                    .map((m, idx) => (
                      <tr key={m.memberCode} className="hover:bg-slate-50/70">
                        <td className="p-3 text-center font-bold">
                          {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : idx + 1}
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">{m.memberName}</div>
                          <div className="text-[10px] font-mono text-emerald-700">{m.memberCode}</div>
                        </td>
                        <td className="p-3 text-slate-600">{m.department}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-800 text-sm">
                          {m.totalWeightKg.toFixed(2)} กก.
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-slate-800">
                          {m.totalDepositAmount.toFixed(2)} บาท
                        </td>
                        <td className="p-3 text-center">
                          {m.isBelowMinimum ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
                              ⚠️ ต่ำกว่า 50฿
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              ✅ ปกติ
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-1.5">
                          <button
                            onClick={() => onOpenStatementModalForMember(m.memberCode)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="ดูและพิมพ์ใบแจ้งยอด A4"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenAlertsModalForMember(m.memberCode)}
                            className="p-1.5 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition"
                            title="ส่งอีเมลแจ้งเตือนยอด"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: QUICK DEPOSIT STATION */}
      {activeAdminSubTab === 'deposit' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Input Form (ชั่งน้ำหนัก ➡️ แปลงเป็นเงินด้วย VLOOKUP) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100 mb-5">
              <Scale className="w-6 h-6 text-emerald-600" />
              <div>
                <h2 className="font-bold text-base text-slate-800">
                  เคาน์เตอร์บันทึกรับฝากขยะ (Deposit Station)
                </h2>
                <p className="text-xs text-slate-500">
                  สูตรอัตโนมัติ: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-emerald-800">[น้ำหนัก (กก.)] × [ราคารับซื้อปัจจุบัน]</code>
                </p>
              </div>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Member selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รหัส / ชื่อพนักงานสมาชิก
                  </label>
                  <select
                    value={selectedMemberCode}
                    onChange={(e) => setSelectedMemberCode(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500"
                  >
                    {users.filter(u => u.role === 'member').map(u => (
                      <option key={u.id} value={u.memberCode}>
                        {u.memberCode} - {u.name} ({u.department})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Waste Type selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รหัสและชนิดขยะ (ดึงจากตาราง Sheet 1)
                  </label>
                  <select
                    value={selectedWasteCode}
                    onChange={(e) => setSelectedWasteCode(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500"
                  >
                    {prices.map(p => (
                      <option key={p.code} value={p.code}>
                        {p.code} • {p.subType} ({p.currentPrice.toFixed(2)} ฿/กก.)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Weight and Auto Calculation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    น้ำหนักที่ชั่งได้ (กิโลกรัม)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="เช่น 5.5"
                    value={depositWeight}
                    onChange={(e) => setDepositWeight(e.target.value)}
                    className="w-full text-sm font-mono font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="sm:col-span-1">
                  <span className="block text-xs font-semibold text-slate-500 mb-1">
                    ราคาต่อหน่วย (VLOOKUP)
                  </span>
                  <div className="h-10 flex items-center font-mono font-bold text-slate-700 text-sm">
                    {currentSelectedPriceItem?.currentPrice.toFixed(2)} บาท/กก.
                  </div>
                </div>

                <div className="sm:col-span-1 bg-white p-3 rounded-lg border border-emerald-200 text-right">
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase">
                    คำนวณเงินสุทธิ
                  </span>
                  <div className="font-mono font-extrabold text-emerald-800 text-xl">
                    {calculatedTotal.toFixed(2)} ฿
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  บันทึกสภาพขยะ / หมายเหตุ
                </label>
                <input
                  type="text"
                  placeholder="เช่น ขวดแกะฉลาก ล้างสะอาด บีบแบนเรียบร้อย"
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {depositMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    depositMsg.isError
                      ? 'bg-rose-50 border border-rose-200 text-rose-700'
                      : 'bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center justify-between'
                  }`}
                >
                  <span>{depositMsg.text}</span>
                  {!depositMsg.isError && lastCreatedDepositId && (
                    <button
                      type="button"
                      onClick={() => onOpenAlertsModalForMember(selectedMemberCode, lastCreatedDepositId)}
                      className="inline-flex items-center space-x-1 text-xs font-semibold underline text-sky-700 hover:text-sky-900"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>ส่งอีเมลแจ้งสมาชิก</span>
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-700/20 transition flex items-center justify-center space-x-2"
              >
                <Scale className="w-4 h-4" />
                <span>ยืนยันการรับฝากและบันทึกลง Ledger (Sheet 2)</span>
              </button>
            </form>
          </div>

          {/* Right: Quick Recent Transactions */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 text-sm">รายการฝากขยะล่าสุด</h3>
                <span className="text-[11px] font-mono text-slate-500">สดจากคลัง</span>
              </div>

              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {deposits.slice(0, 6).map(d => (
                  <div key={d.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-slate-800">{d.memberName}</span>{' '}
                        <span className="font-mono text-[11px] text-slate-500">({d.memberCode})</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-800">
                        +{d.totalAmount.toFixed(2)} ฿
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1 flex justify-between">
                      <span>{d.subType} ({d.weight.toFixed(1)} กก.)</span>
                      <span className="font-mono text-slate-400">{d.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
              * ข้อมูลจะถูกเชื่อมต่อเข้า Google Sheets (Sheet 2: Deposit Ledger) อัตโนมัติ
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: WITHDRAWAL APPROVAL SYSTEM */}
      {activeAdminSubTab === 'withdrawals' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-slate-800">ระบบอนุมัติการถอนเงินสด (Withdrawal Approval)</h2>
              <p className="text-xs text-slate-500">
                ตรวจสอบความถูกต้องและยอดเงินขั้นต่ำ 50 บาท ก่อนจ่ายเงินสดสวัสดิการ
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
              รออนุมัติ: {pendingWithdrawals.length} รายการ
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="p-3">เลขที่คำขอ</th>
                  <th className="p-3">วันที่ยื่น</th>
                  <th className="p-3">สมาชิก</th>
                  <th className="p-3 text-right">ยอดที่ขอถอน (บาท)</th>
                  <th className="p-3 text-right">ยอดคงเหลือปัจจุบัน</th>
                  <th className="p-3 text-center">สถานะสภาพคล่อง</th>
                  <th className="p-3 text-center">สถานะคำขอ</th>
                  <th className="p-3 text-center">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {withdrawals.map(w => {
                  const mSummary = getMemberSummary(w.memberCode);
                  const remainingIfApproved = mSummary.currentBalance - w.amount;
                  const violatesMinimum = remainingIfApproved < 50;

                  return (
                    <tr key={w.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-mono font-semibold text-slate-600">{w.requestNumber}</td>
                      <td className="p-3 font-mono text-slate-500">{w.date}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{w.memberName}</div>
                        <div className="text-[10px] font-mono text-slate-400">{w.memberCode}</div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-rose-700 text-sm">
                        {w.amount.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-mono font-medium text-slate-800">
                        {mSummary.currentBalance.toFixed(2)} ฿
                      </td>
                      <td className="p-3 text-center">
                        {violatesMinimum ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
                            ⚠️ จะเหลือน้อยกว่า 50฿
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            ✅ ผ่านเกณฑ์ขั้นต่ำ
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {w.status === 'pending' && (
                          <span className="px-2.5 py-1 rounded-full font-semibold text-[10px] bg-amber-100 text-amber-800">
                            รออนุมัติ
                          </span>
                        )}
                        {w.status === 'approved' && (
                          <span className="px-2.5 py-1 rounded-full font-semibold text-[10px] bg-emerald-100 text-emerald-800">
                            อนุมัติแล้ว ({w.processedBy})
                          </span>
                        )}
                        {w.status === 'rejected' && (
                          <span className="px-2.5 py-1 rounded-full font-semibold text-[10px] bg-slate-100 text-slate-600">
                            ปฏิเสธ
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {w.status === 'pending' ? (
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => approveWithdrawal(w.id, currentUser?.name || 'นายชาญชัย อบต.ตาคลี')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-[11px] shadow-xs transition"
                            >
                              อนุมัติจ่ายเงิน
                            </button>
                            <button
                              onClick={() => rejectWithdrawal(w.id, currentUser?.name || 'นายชาญชัย อบต.ตาคลี', 'ไม่ผ่านเกณฑ์คงเงินขั้นต่ำ')}
                              className="px-2 py-1 bg-slate-200 hover:bg-rose-100 hover:text-rose-800 text-slate-700 rounded-lg text-[11px] transition"
                            >
                              ปฏิเสธ
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">- ดำเนินการแล้ว -</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: PRICE CONFIGURATION (SHEET 1) */}
      {activeAdminSubTab === 'prices' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h2 className="font-bold text-base text-slate-800">
                แผ่นงานที่ 1: ตารางควบคุมราคา (Dashboard & Price Config)
              </h2>
              <p className="text-xs text-slate-500">
                แก้ไขราคารับซื้อประจำเดือนกันยายน 2026 ได้อิสระ โดยไม่มีผลกระทบต่อประวัติยอดเงินของรายการเก่า
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePullPricesFromSheet}
                disabled={isSyncing}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold shadow-2xs transition"
                title="ดึงข้อมูลราคาที่แก้ไขใน Google Sheets (PriceConfig) เข้าสู่ระบบ"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'กำลังดึงราคา...' : '🔄 ดึงราคาล่าสุดจาก Google Sheets'}</span>
              </button>

              <button
                onClick={() => setShowAddPriceModal(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มชนิดขยะใหม่</span>
              </button>
            </div>
          </div>

          {sheetSyncStatus && (
            <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-200 text-xs text-emerald-900 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{sheetSyncStatus}</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="p-3">รหัสขยะ</th>
                  <th className="p-3">ประเภทขยะ</th>
                  <th className="p-3">ชนิดขยะย่อย</th>
                  <th className="p-3 text-right">ราคารับซื้อปัจจุบัน (บาท/กก.)</th>
                  <th className="p-3">รอบเดือน</th>
                  <th className="p-3 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prices.map(p => (
                  <tr key={p.code} className="hover:bg-slate-50/70">
                    <td className="p-3 font-mono font-bold text-emerald-800">{p.code}</td>
                    <td className="p-3 font-medium text-slate-800">{p.category}</td>
                    <td className="p-3 text-slate-700">{p.subType}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 text-sm">
                      {editingPriceCode === p.code ? (
                        <div className="flex items-center justify-end space-x-1">
                          <input
                            type="number"
                            step="0.5"
                            value={newPriceValue}
                            onChange={(e) => setNewPriceValue(e.target.value)}
                            className="w-20 px-2 py-1 border border-emerald-500 rounded text-right font-mono text-xs"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSavePrice(p.code)}
                            className="p-1 text-white bg-emerald-600 rounded hover:bg-emerald-700"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingPriceCode(null)}
                            className="p-1 text-slate-600 bg-slate-200 rounded hover:bg-slate-300"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <span>{p.currentPrice.toFixed(2)} บาท</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-500">{p.effectiveMonth}</td>
                    <td className="p-3 text-center">
                      {editingPriceCode !== p.code ? (
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => {
                              setEditingPriceCode(p.code);
                              setNewPriceValue(p.currentPrice.toString());
                            }}
                            className="px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition"
                            title="แก้ไขราคาด่วน"
                          >
                            แก้ไขราคา
                          </button>
                          <button
                            onClick={() => handleOpenEditFullPrice(p)}
                            className="p-1 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition"
                            title="แก้ไขหมวดหมู่และชื่อชนิดขยะ"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePrice(p.code, p.subType)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="ลบชนิดขยะนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: MEMBERS & PASSWORDS (150+ STAFF DIRECTORY) */}
      {activeAdminSubTab === 'members' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-0">
          {/* Header & Main Actions */}
          <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-slate-800">
                  ทะเบียนและจัดการสมาชิกพนักงาน อบต.ตาคลี
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  รวม {users.length} คน
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ค้นหา, เพิ่มสมาชิกใหม่, ปรับระดับสิทธิ์, รีเซ็ตรหัสผ่าน, เลือกจำนวนที่แสดง และส่งออกไฟล์ Excel
              </p>
            </div>

            {/* Quick Actions: Add Member & Export Excel */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleOpenAddMemberModal}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ เพิ่มสมาชิกใหม่</span>
              </button>

              <button
                type="button"
                onClick={handleExportMembersToExcel}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl border border-slate-300 transition flex items-center gap-1.5"
                title="ดาวน์โหลดไฟล์ Excel (.csv รองรับภาษาไทย)"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>ส่งออก Excel (CSV)</span>
              </button>
            </div>
          </div>

          {/* Filter Bar & Rows Per Page Selector */}
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            {/* Search & Dept */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, รหัส, อีเมล..."
                  value={memberSearch}
                  onChange={(e) => {
                    setMemberSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white w-48 sm:w-60"
                />
              </div>

              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs border border-slate-300 rounded-xl px-3 py-1.5 bg-white font-medium"
              >
                <option value="all">ทุกกอง / สังกัด</option>
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              {/* Permission Filter */}
              <select
                value={permissionFilter}
                onChange={(e) => {
                  setPermissionFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="text-xs border border-slate-300 rounded-xl px-3 py-1.5 bg-white font-medium"
              >
                <option value="all">ทุกสถานะสิทธิ์</option>
                <option value="active">🟢 สิทธิ์ใช้งานปกติ</option>
                <option value="suspended">🔴 ระงับสิทธิ์เข้าใช้งาน</option>
                <option value="canWithdraw">🟢 สิทธิ์ขอถอนเงินปกติ</option>
                <option value="blockedWithdraw">🟠 ระงับสิทธิ์ขอถอนเงิน</option>
              </select>
            </div>

            {/* Rows Per Page Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500 font-semibold whitespace-nowrap">แสดงต่อหน้า:</span>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                {[10, 30, 50, 100].map(cnt => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => {
                      setRowsPerPage(cnt);
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                      rowsPerPage === cnt
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setRowsPerPage(-1);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                    rowsPerPage === -1
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  ทั้งหมด
                </button>
              </div>

              {/* Custom Rows Input */}
              <form onSubmit={handleApplyCustomRows} className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="500"
                  placeholder="ระบุ"
                  value={customRowsInput}
                  onChange={(e) => setCustomRowsInput(e.target.value)}
                  className="w-14 px-2 py-1 border border-slate-300 rounded-lg text-center font-mono text-xs bg-white"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold text-xs transition"
                >
                  แสดง
                </button>
              </form>
            </div>
          </div>

          {/* Quick Permission Feedback Toast */}
          {permissionToast && (
            <div className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{permissionToast}</span>
              </div>
              <button 
                onClick={() => setPermissionToast(null)} 
                className="text-emerald-700 hover:text-emerald-900 text-xs px-2 py-0.5 rounded cursor-pointer"
              >
                ✕ ปิด
              </button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="p-3">รหัสสมาชิก</th>
                  <th className="p-3">สมาชิก / พนักงาน</th>
                  <th className="p-3">สังกัด / กอง</th>
                  <th className="p-3">อีเมล</th>
                  <th className="p-3 text-right">ยอดเงินคงเหลือ</th>
                  <th className="p-3 text-center">ระดับสิทธิ์</th>
                  <th className="p-3 text-center">สิทธิ์เข้าใช้งาน</th>
                  <th className="p-3 text-center">สิทธิ์ขอถอนเงิน</th>
                  <th className="p-3 text-center">สิทธิ์ลาออกสวัสดิการ</th>
                  <th className="p-3 text-center">จัดการบัญชี</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedUsers.map(u => {
                  const mSummary = getMemberSummary(u.memberCode);
                  const isCurrentAdmin = u.memberCode === currentUser?.memberCode;
                  const isActive = u.isActive !== false;
                  const canWithdraw = u.canWithdraw !== false;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-mono font-bold text-emerald-800">{u.memberCode}</td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2.5">
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover border border-emerald-400 shadow-2xs bg-white shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-200 shrink-0">
                              {u.memberCode.substring(0, 3)}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {(!isActive || !canWithdraw) && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded-sm text-[9px] font-bold bg-rose-100 text-rose-700">
                                  จำกัดสิทธิ์
                                </span>
                              )}
                            </div>
                            {u.nationalId && (
                              <div className="text-[10px] font-mono text-slate-400">
                                ปชช: {u.nationalId.replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1-$2-$3-$4-$5')}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-slate-600">{u.department}</td>
                      <td className="p-3 font-mono text-slate-500">{u.email}</td>
                      <td className="p-3 text-right font-mono font-bold">
                        {u.role === 'member' ? (
                          <span className={mSummary.isBelowMinimum ? 'text-rose-600' : 'text-emerald-700'}>
                            {mSummary.currentBalance.toFixed(2)} ฿
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <select
                          value={u.role}
                          onChange={(e) => updateUserRole(u.memberCode, e.target.value as any)}
                          className={`text-[11px] font-semibold rounded-lg px-2 py-1 border ${
                            u.role === 'admin'
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          }`}
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>

                      {/* สิทธิ์เข้าใช้งานระบบ (Active Status Toggle) */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          disabled={isCurrentAdmin && isActive}
                          onClick={() => handleToggleUserActive(u)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition shadow-2xs cursor-pointer ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200'
                          } ${isCurrentAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                          title={
                            isCurrentAdmin
                              ? 'บัญชีที่คุณกำลังใช้งานอยู่ ไม่สามารถระงับได้'
                              : isActive ? 'คลิกเพื่อระงับสิทธิ์เข้าใช้งาน' : 'คลิกเพื่อเปิดสิทธิ์เข้าใช้งาน'
                          }
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'}`} />
                          <span>{isActive ? 'เปิดใช้งาน' : 'ระงับใช้งาน'}</span>
                        </button>
                        {u.statusReason && !isActive && (
                          <div className="text-[10px] text-rose-600 mt-0.5 truncate max-w-[110px] mx-auto" title={u.statusReason}>
                            {u.statusReason}
                          </div>
                        )}
                      </td>

                      {/* สิทธิ์การขอถอนเงิน (Withdrawal Permission Toggle) */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleUserWithdrawal(u)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition shadow-2xs cursor-pointer ${
                            canWithdraw
                              ? 'bg-teal-100 text-teal-800 border border-teal-300 hover:bg-teal-200'
                              : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                          }`}
                          title={canWithdraw ? 'คลิกเพื่อระงับสิทธิ์การขอถอนเงิน' : 'คลิกเพื่อเปิดสิทธิ์การขอถอนเงิน'}
                        >
                          <Banknote className={`w-3.5 h-3.5 ${canWithdraw ? 'text-teal-700' : 'text-amber-700'}`} />
                          <span>{canWithdraw ? 'อนุญาตถอน' : 'ระงับสิทธิ์ถอน'}</span>
                        </button>
                        {u.statusReason && !canWithdraw && (
                          <div className="text-[10px] text-amber-700 mt-0.5 truncate max-w-[110px] mx-auto" title={u.statusReason}>
                            {u.statusReason}
                          </div>
                        )}
                      </td>

                      {/* สิทธิ์ลาออกสวัสดิการ */}
                      <td className="p-3 text-center whitespace-nowrap">
                        {u.welfareEnrolled ? (
                          <button
                            type="button"
                            onClick={() => {
                              const nextVal = !u.canOptOutWelfare;
                              toggleUserWelfareOptOutPermission(
                                u.memberCode,
                                nextVal,
                                nextVal ? 'ผู้ดูแลระบบอนุญาตให้ลาออกจากสวัสดิการได้' : 'ผู้ดูแลระบบระงับสิทธิ์ลาออก'
                              );
                              setPermissionToast(
                                nextVal
                                  ? `อนุญาตให้ ${u.name} ลาออกจากสวัสดิการได้แล้ว`
                                  : `ระงับสิทธิ์การลาออกจากสวัสดิการของ ${u.name} แล้ว`
                              );
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition shadow-2xs cursor-pointer ${
                              u.canOptOutWelfare
                                ? 'bg-sky-100 text-sky-800 border border-sky-300 hover:bg-sky-200'
                                : u.welfareResignationRequested
                                ? 'bg-amber-500 text-white hover:bg-amber-600 animate-pulse shadow-xs'
                                : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
                            }`}
                            title={
                              u.canOptOutWelfare
                                ? 'คลิกเพื่อระงับสิทธิ์ลาออก'
                                : u.welfareResignationRequested
                                ? `สมาชิกยื่นขอลาออก: ${u.welfareResignationReason || 'ไม่ระบุเหตุผล'} (คลิกเพื่ออนุญาต)`
                                : 'คลิกเพื่อเปิดสิทธิ์ให้สมาชิกลาออกได้'
                            }
                          >
                            <span>
                              {u.canOptOutWelfare
                                ? '✓ อนุญาตให้ลาออก'
                                : u.welfareResignationRequested
                                ? '🔔 อนุมัติลาออก'
                                : 'ล็อกสวัสดิการ'}
                            </span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">- ไม่ได้เข้าร่วม -</span>
                        )}
                      </td>

                      {/* จัดการบัญชี */}
                      <td className="p-3 text-center space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedUserForProfile(u);
                            setIsProfileModalOpen(true);
                          }}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition cursor-pointer"
                          title="แก้ไขโปรไฟล์และรูปถ่ายพนักงาน"
                        >
                          <Camera className="w-3 h-3 text-emerald-600" />
                          <span>โปรไฟล์</span>
                        </button>
                        <button
                          onClick={() => setResetTargetUser({ memberCode: u.memberCode, name: u.name })}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                          title="รีเซ็ตรหัสผ่านพนักงาน"
                        >
                          <KeyRound className="w-3 h-3 text-slate-500" />
                          <span>รีเซ็ต</span>
                        </button>
                        {u.role === 'member' && (
                          <button
                            onClick={() => onOpenStatementModalForMember(u.memberCode)}
                            className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                            title="พิมพ์ใบแจ้งยอด A4"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {displayedUsers.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center p-8 text-slate-400">
                      ไม่พบข้อมูลสมาชิกตามเงื่อนไขที่ค้นหา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Pagination Bar */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-slate-600 font-medium">
              แสดงรายการที่ <span className="font-bold text-slate-900">{totalFilteredCount === 0 ? 0 : startIndex + 1}</span> ถึง{' '}
              <span className="font-bold text-slate-900">{endIndex}</span> จากทั้งหมด{' '}
              <span className="font-bold text-emerald-800">{totalFilteredCount}</span> คน{' '}
              {rowsPerPage > 0 && `(หน้า ${safeCurrentPage} จาก ${totalPages})`}
            </div>

            {rowsPerPage > 0 && totalPages > 1 && (
              <div className="flex items-center gap-1 self-center sm:self-auto">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 transition"
                  title="หน้าแรก"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 transition"
                  title="ก่อนหน้า"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* Number Badges */}
                <div className="flex items-center gap-1 mx-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5) {
                      if (safeCurrentPage > 3) {
                        pageNum = Math.min(safeCurrentPage - 2 + i, totalPages - 4 + i);
                      }
                    }
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                          safeCurrentPage === pageNum
                            ? 'bg-emerald-700 text-white shadow-2xs'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 transition"
                  title="ถัดไป"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safeCurrentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 transition"
                  title="หน้าสุดท้าย"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 6: WELFARE MANAGEMENT */}
      {activeAdminSubTab === 'welfare' && (
        <WelfareAdminSection
          onOpenStatementForMember={onOpenStatementModalForMember}
          onOpenAlertsForMember={(code) => onOpenAlertsModalForMember(code)}
        />
      )}

      {/* SUB-TAB 7: TELEGRAM & EMAIL AUTO ALERT */}
      {activeAdminSubTab === 'alerts' && (
        <AdminSettings initialTab="alerts" />
      )}

      {/* SUB-TAB: AUDIT LOGS & ACTIVITY HISTORY */}
      {activeAdminSubTab === 'logs' && (
        <ActivityLogsView />
      )}

      {/* SUB-TAB 8: ORG CONFIG & DEPARTMENTS */}
      {activeAdminSubTab === 'orgSettings' && (
        <AdminSettings initialTab="all" />
      )}

      {/* MODAL: Add New Price Item */}
      {showAddPriceModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">เพิ่มรายการชนิดขยะใหม่ (Sheet 1)</h3>
              <button onClick={() => setShowAddPriceModal(false)} className="text-emerald-200 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddPriceSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสขยะ (Code)</label>
                <input
                  type="text"
                  placeholder="เช่น PL03 หรือ M003"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">หมวดหมู่หลัก (Category)</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as WasteCategory)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
                >
                  <option value="กระดาษ">กระดาษ</option>
                  <option value="พลาสติก">พลาสติก</option>
                  <option value="โลหะ">โลหะ</option>
                  <option value="แก้ว">แก้ว</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชนิดขยะย่อย (Sub-type)</label>
                <input
                  type="text"
                  placeholder="เช่น พลาสติกกรอบ / ฝาขวด"
                  value={newSubType}
                  onChange={(e) => setNewSubType(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ราคารับซื้อเริ่มต้น (บาท/กก.)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="เช่น 3.50"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPriceModal(false)}
                  className="flex-1 py-2 text-xs font-medium text-slate-700 border border-slate-300 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                >
                  บันทึกราคาใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Password Reset */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm">รีเซ็ตรหัสผ่านพนักงาน</h3>
              </div>
              <button onClick={() => setResetTargetUser(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleConfirmPasswordReset} className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div className="font-semibold text-slate-800">{resetTargetUser.name}</div>
                <div className="text-[11px] font-mono text-slate-500">รหัสสมาชิก: {resetTargetUser.memberCode}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  พิมพ์รหัสผ่านใหม่ (อัปเดตลง Google Sheets)
                </label>
                <input
                  type="text"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {resetSuccessMsg && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium border border-emerald-200">
                  {resetSuccessMsg}
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="flex-1 py-2 text-xs font-medium text-slate-700 border border-slate-300 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl"
                >
                  บันทึกรหัสผ่านใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Full Price Item Edit (Category, SubType, Price) */}
      {editingPriceFullItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">แก้ไขรายการชนิดขยะ & ราคา</h3>
                <p className="text-xs text-emerald-200">รหัสขยะ: {editingPriceFullItem.code}</p>
              </div>
              <button onClick={() => setEditingPriceFullItem(null)} className="text-emerald-200 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSaveFullPriceSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสขยะ (Code)</label>
                <input
                  type="text"
                  value={editingPriceFullItem.code}
                  disabled
                  className="w-full text-xs font-mono px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">หมวดหมู่หลัก (Category)</label>
                <select
                  value={fullEditCategory}
                  onChange={(e) => setFullEditCategory(e.target.value as WasteCategory)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
                >
                  <option value="กระดาษ">กระดาษ</option>
                  <option value="พลาสติก">พลาสติก</option>
                  <option value="โลหะ">โลหะ</option>
                  <option value="แก้ว">แก้ว</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อชนิดขยะย่อย (Sub-type)</label>
                <input
                  type="text"
                  value={fullEditSubType}
                  onChange={(e) => setFullEditSubType(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ราคารับซื้อต่อหน่วย (บาท/กก.)</label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={fullEditPrice}
                  onChange={(e) => setFullEditPrice(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-xl font-bold text-emerald-700"
                  required
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPriceFullItem(null)}
                  className="flex-1 py-2 text-xs font-medium text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add New Member Modal */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="font-bold text-base">เพิ่มทะเบียนสมาชิกพนักงานใหม่</h3>
                  <p className="text-xs text-emerald-200">อบต.ตาคลี จ.นครสวรรค์</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddMemberModalOpen(false)}
                className="text-emerald-200 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {addMemberError && (
                <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs font-semibold border border-rose-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{addMemberError}</span>
                </div>
              )}

              {addMemberSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold border border-emerald-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{addMemberSuccess}</span>
                </div>
              )}

              {/* Member Code & Role */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รหัสสมาชิก <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addMemberCode}
                    onChange={(e) => setAddMemberCode(e.target.value)}
                    className="w-full text-xs font-mono font-bold text-emerald-800 px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ระดับสิทธิ์การใช้งาน
                  </label>
                  <select
                    value={addMemberRole}
                    onChange={(e) => setAddMemberRole(e.target.value as any)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="member">สมาชิกทั่วไป (Member)</option>
                    <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                  </select>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อ - นามสกุล พนักงาน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น นายสมบูรณ์ มั่นคง"
                  value={addMemberName}
                  onChange={(e) => setAddMemberName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  กอง / สังกัด อบต.ตาคลี <span className="text-rose-500">*</span>
                </label>
                <select
                  value={addMemberDept}
                  onChange={(e) => setAddMemberDept(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                >
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* National ID & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เลขประจำตัวประชาชน (13 หลัก)
                  </label>
                  <input
                    type="text"
                    maxLength={13}
                    placeholder="1600100000000"
                    value={addMemberNationalId}
                    onChange={(e) => setAddMemberNationalId(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    placeholder="08X-XXX-XXXX"
                    value={addMemberPhone}
                    onChange={(e) => setAddMemberPhone(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Email & Initial Password */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    อีเมล (ใช้เข้าสู่ระบบ)
                  </label>
                  <input
                    type="email"
                    value={addMemberEmail}
                    onChange={(e) => setAddMemberEmail(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รหัสผ่านเริ่มต้น <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addMemberPassword}
                    onChange={(e) => setAddMemberPassword(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* Welfare Enrolled Checkbox */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-900">กองทุนสวัสดิการฌาปนกิจ</div>
                  <div className="text-[11px] text-emerald-700">คงเงินขั้นต่ำ 300 บาทเพื่อคุ้มครองสิทธิ์</div>
                </div>
                <input
                  type="checkbox"
                  checked={addMemberWelfare}
                  onChange={(e) => setAddMemberWelfare(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-emerald-300"
                />
              </div>

              {/* Permission Settings in Add Member Modal */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>กำหนดสิทธิ์เริ่มต้นการใช้งานและถอนเงิน:</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer bg-white p-2 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={addMemberIsActive}
                      onChange={(e) => setAddMemberIsActive(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                    <span>เปิดสิทธิ์ใช้งานระบบ</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer bg-white p-2 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={addMemberCanWithdraw}
                      onChange={(e) => setAddMemberCanWithdraw(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                    />
                    <span>เปิดสิทธิ์ขอถอนเงิน</span>
                  </label>
                </div>
              </div>

              {/* Profile Avatar Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รูปถ่ายโปรไฟล์พนักงาน (ดึงจากคอมพิวเตอร์/มือถือ)
                </label>
                <div className="flex items-center space-x-3">
                  {addMemberAvatar ? (
                    <img
                      src={addMemberAvatar}
                      alt="Preview"
                      className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                      <Camera className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAddMemberAvatarChange}
                      disabled={isUploadingAddAvatar}
                      className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      {isUploadingAddAvatar ? 'กำลังบีบอัดรูปภาพ...' : 'ระบบจะบีบอัดขนาดไฟล์อัตโนมัติ ไม่เปลืองเนื้อที่'}
                    </p>
                  </div>
                  {addMemberAvatar && (
                    <button
                      type="button"
                      onClick={() => setAddMemberAvatar('')}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      ลบรูป
                    </button>
                  )}
                </div>
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="flex-1 py-2 text-xs font-medium text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isUploadingAddAvatar}
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-xl shadow-xs transition"
                >
                  บันทึกสมาชิกใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Member Profile & Photo (Admin can edit any member) */}
      <MemberProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setSelectedUserForProfile(null);
        }}
        targetUser={selectedUserForProfile || undefined}
      />

      {/* MODAL: Executive Summary One-Page A4 & Auto-Email Dispatch */}
      <ExecutiveSummaryA4Modal
        isOpen={isExecutiveSummaryModalOpen}
        onClose={() => setIsExecutiveSummaryModalOpen(false)}
      />
    </div>
  );
};
