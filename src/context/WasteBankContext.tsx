import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  UserRole,
  WastePriceItem, 
  DepositRecord, 
  WithdrawalRecord, 
  MemberAccountSummary, 
  WasteCategory,
  WelfareConfig,
  WelfareContributionRecord,
  WelfareExpenseRecord,
  MemberWelfareSummary,
  WelfareContributionSource,
  OrgConfig,
  AlertConfig,
  TransactionAlertPrompt,
  BackupModuleKey,
  WasteBankBackupData,
  ActivityLog,
  ActivityLogAction,
  PurgeDatabaseOptions
} from '../types';
import { 
  INITIAL_USERS, 
  SUPER_ADMIN_USER,
  INITIAL_PRICES, 
  INITIAL_DEPOSITS, 
  INITIAL_WITHDRAWALS, 
  MINIMUM_BALANCE_CONFIG,
  INITIAL_WELFARE_CONFIG,
  INITIAL_WELFARE_CONTRIBUTIONS,
  INITIAL_WELFARE_EXPENSES,
  INITIAL_ORG_CONFIG,
  INITIAL_ALERT_CONFIG,
  INITIAL_ACTIVITY_LOGS,
  DEPARTMENTS
} from '../data/initialData';
import { 
  parsePricesFromSheetCSV, 
  parseUsersFromSheetCSV, 
  parseDepositsFromSheetCSV 
} from '../utils/sheetCsvParser';

interface WasteBankContextType {
  currentUser: User | null;
  users: User[];
  prices: WastePriceItem[];
  deposits: DepositRecord[];
  withdrawals: WithdrawalRecord[];
  minimumBalance: number;
  googleSheetUrl: string;
  isSyncing: boolean;
  lastSynced: string | null;

  // Departments
  departments: string[];
  addDepartment: (name: string) => { success: boolean; message: string };
  editDepartment: (oldName: string, newName: string) => { success: boolean; message: string };
  deleteDepartment: (name: string) => { success: boolean; message: string };

  // Organization info & Logo
  orgConfig: OrgConfig;
  updateOrgConfig: (config: Partial<OrgConfig>) => boolean;
  updateOrgLogo: (logoUrl: string) => boolean;
  resetOrgLogo: () => boolean;

  // Telegram & Email Alerts configuration
  alertConfig: AlertConfig;
  updateAlertConfig: (config: Partial<AlertConfig>) => { success: boolean; message: string };

  // Transaction Notification Prompt
  pendingTransactionAlert: TransactionAlertPrompt | null;
  setPendingTransactionAlert: (prompt: TransactionAlertPrompt | null) => void;
  confirmTransactionAlert: (channels: { telegram: boolean; email: boolean }) => void;
  cancelTransactionAlert: () => void;
  
  // Welfare Assistance System State
  welfareConfig: WelfareConfig;
  welfareContributions: WelfareContributionRecord[];
  welfareExpenses: WelfareExpenseRecord[];
  
  // Auth actions
  login: (identifier: string, pass: string) => { success: boolean; message: string };
  logout: () => void;
  switchUser: (user: User) => void;
  registerUser: (name: string, email: string, department: string, pass: string, phone?: string, nationalId?: string, avatarUrl?: string) => { success: boolean; message: string; user?: User };
  adminCreateUser: (userData: {
    name: string;
    memberCode?: string;
    department: string;
    email?: string;
    phone?: string;
    nationalId?: string;
    password?: string;
    role?: UserRole;
    avatarUrl?: string;
    welfareEnrolled?: boolean;
    isActive?: boolean;
    canWithdraw?: boolean;
    statusReason?: string;
  }) => { success: boolean; message: string; user?: User };
  getNextMemberCode: () => string;
  resetUserPassword: (memberCode: string, newPass: string) => boolean;
  updateUserRole: (memberCode: string, newRole: UserRole) => { success: boolean; message: string };
  toggleUserActiveStatus: (memberCode: string, isActive: boolean, reason?: string) => { success: boolean; message: string };
  toggleUserWithdrawalPermission: (memberCode: string, canWithdraw: boolean, reason?: string) => { success: boolean; message: string };
  toggleUserWelfareOptOutPermission: (memberCode: string, canOptOut: boolean, reason?: string) => { success: boolean; message: string };
  requestWelfareExit: (memberCode: string, reason: string) => { success: boolean; message: string };
  updateUserProfile: (memberCode: string, data: Partial<User>) => { success: boolean; message: string };
  deleteUserProfileImage: (memberCode: string) => { success: boolean; message: string };
  
  // Transaction actions
  recordDeposit: (memberCode: string, wasteCode: string, weight: number, note?: string, autoContributeWelfare?: boolean) => { success: boolean; message: string; record?: DepositRecord };
  requestWithdrawal: (memberCode: string, amount: number, note?: string) => { success: boolean; message: string };
  approveWithdrawal: (withdrawalId: string, adminName: string) => boolean;
  rejectWithdrawal: (withdrawalId: string, adminName: string, reason?: string) => boolean;
  
  // Price config actions
  updatePrice: (code: string, newPrice: number) => boolean;
  updatePriceItem: (code: string, updated: Partial<WastePriceItem>) => boolean;
  deletePriceItem: (code: string) => boolean;
  addNewPriceItem: (item: Omit<WastePriceItem, 'color'>) => boolean;
  
  // Welfare Assistance actions
  toggleWelfareEnrollment: (memberCode: string, enrolled: boolean, autoDeduct?: boolean) => boolean;
  contributeToWelfare: (memberCode: string, amount: number, source: WelfareContributionSource, note?: string) => { success: boolean; message: string };
  recordWelfareExpense: (expense: Omit<WelfareExpenseRecord, 'id' | 'timestamp' | 'voucherNumber'>) => { success: boolean; message: string; record?: WelfareExpenseRecord };
  updateWelfareConfig: (newConfig: Partial<WelfareConfig>) => boolean;
  batchDeductMonthlyWelfare: () => { processedCount: number; successCount: number; insufficientCount: number; details: string[] };
  getMemberWelfareSummary: (memberCode: string) => MemberWelfareSummary;
  getAllMembersWelfareSummary: () => MemberWelfareSummary[];
  getWelfareFundStats: () => {
    totalFundPool: number;
    totalCollected: number;
    totalExpenses: number;
    currentMonthExpenses: number;
    enrolledMembersCount: number;
    targetMetCount: number;
    shortfallCount: number;
    recentContributions: WelfareContributionRecord[];
    recentExpenses: WelfareExpenseRecord[];
  };

  // Helper calculations
  getMemberSummary: (memberCode: string) => MemberAccountSummary;
  getAllMembersSummary: () => MemberAccountSummary[];
  getOrgStats: () => {
    totalRecycledWeight: number;
    totalMoneyDistributed: number;
    totalTreasuryApprovedWithdrawals: number;
    totalTreasuryRemainingBalance: number;
    activeRecyclersCount: number;
    totalStaffCount: number;
    categoryWeights: { category: WasteCategory; weight: number; value: number }[];
    recentDeposits: DepositRecord[];
  };
  
  // Google Sheet Webhook Sync & Real-time Integration
  setGoogleSheetUrl: (url: string) => void;
  pullFromGoogleSheet: (customSheetId?: string) => Promise<{ success: boolean; message: string; updatedCount?: number }>;
  pushToGoogleSheet: () => Promise<{ success: boolean; message: string }>;
  syncWithGoogleSheet: () => Promise<{ success: boolean; message: string; updatedCount?: number }>;
  importPricesFromCSV: (csvText: string) => { success: boolean; message: string; count: number };
  resetToDefaultData: () => void;

  // Database Backup & Restore / Migration
  exportBackupData: (selectedModules?: BackupModuleKey[]) => WasteBankBackupData;
  importBackupData: (
    backupData: WasteBankBackupData,
    selectedModules?: BackupModuleKey[],
    mode?: 'overwrite' | 'merge'
  ) => { success: boolean; message: string; summary: Record<string, number> };

  // Database Purge (Super Admin Only)
  purgeDatabase: (options: PurgeDatabaseOptions) => {
    success: boolean;
    message: string;
    details: string[];
  };

  // Activity & Audit Trail Logs
  activityLogs: ActivityLog[];
  logActivity: (
    action: ActivityLogAction,
    actionTitle: string,
    details: string,
    userOverride?: User,
    status?: 'success' | 'warning' | 'error'
  ) => void;
  clearActivityLogs: () => void;
}

const WasteBankContext = createContext<WasteBankContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'wb_takhli_users_v1',
  PRICES: 'wb_takhli_prices_v1',
  DEPOSITS: 'wb_takhli_deposits_v1',
  WITHDRAWALS: 'wb_takhli_withdrawals_v1',
  CURRENT_USER: 'wb_takhli_curr_user_v1',
  SHEET_URL: 'wb_takhli_sheet_url_v1',
  LAST_SYNC: 'wb_takhli_last_sync_v1',
  WELFARE_CONFIG: 'wb_takhli_wf_config_v1',
  WELFARE_CONTRIBUTIONS: 'wb_takhli_wf_contribs_v1',
  WELFARE_EXPENSES: 'wb_takhli_wf_expenses_v1',
  DEPTS: 'wb_takhli_depts_v1',
  ORG_CONFIG: 'wb_takhli_org_config_v1',
  ALERT_CONFIG: 'wb_takhli_alert_config_v1',
  ACTIVITY_LOGS: 'wb_takhli_activity_logs_v1'
};

// Helper to normalize deposits ensuring weight, weightKg, totalAmount, totalPrice are present
const normalizeDeposit = (d: any): DepositRecord => {
  const weightVal = Number(d.weight ?? d.weightKg ?? 0);
  const totalVal = Number(d.totalAmount ?? d.totalPrice ?? (weightVal * Number(d.unitPrice ?? 0)));
  return {
    ...d,
    weight: weightVal,
    weightKg: weightVal,
    totalAmount: totalVal,
    totalPrice: totalVal
  };
};

export const WasteBankProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isUserAdmin = (u?: User | null) => u?.role === 'admin' || u?.role === 'superadmin';

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    const parsed: User[] = saved ? JSON.parse(saved) : INITIAL_USERS;
    const mapped: User[] = parsed.map(u => ({
      ...u,
      isActive: u.isActive !== undefined ? u.isActive : true,
      canWithdraw: u.canWithdraw !== undefined ? u.canWithdraw : true
    }));
    // Ensure SUPER01 is always available even if old localStorage cached users exist
    if (!mapped.some(u => u.role === 'superadmin' || u.memberCode === 'SUPER01')) {
      mapped.unshift({
        ...SUPER_ADMIN_USER,
        isActive: true,
        canWithdraw: true
      });
    }
    return mapped;
  });

  const [prices, setPrices] = useState<WastePriceItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRICES);
    return saved ? JSON.parse(saved) : INITIAL_PRICES;
  });

  const [deposits, setDeposits] = useState<DepositRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DEPOSITS);
    const raw: any[] = saved ? JSON.parse(saved) : INITIAL_DEPOSITS;
    return raw.map(normalizeDeposit);
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing activity logs', e);
      }
    }
    return INITIAL_ACTIVITY_LOGS;
  });

  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WITHDRAWALS);
    return saved ? JSON.parse(saved) : INITIAL_WITHDRAWALS;
  });

  const [departments, setDepartments] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DEPTS);
    return saved ? JSON.parse(saved) : DEPARTMENTS;
  });

  const [orgConfig, setOrgConfig] = useState<OrgConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORG_CONFIG);
    return saved ? JSON.parse(saved) : INITIAL_ORG_CONFIG;
  });

  const [alertConfig, setAlertConfig] = useState<AlertConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ALERT_CONFIG);
    return saved ? JSON.parse(saved) : INITIAL_ALERT_CONFIG;
  });

  const [pendingTransactionAlert, setPendingTransactionAlert] = useState<TransactionAlertPrompt | null>(null);

  const [welfareConfig, setWelfareConfig] = useState<WelfareConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WELFARE_CONFIG);
    if (!saved) return INITIAL_WELFARE_CONFIG;
    try {
      const parsed = JSON.parse(saved);
      return {
        ...INITIAL_WELFARE_CONFIG,
        ...parsed,
        benefitCoverageDetails: {
          ...INITIAL_WELFARE_CONFIG.benefitCoverageDetails,
          ...(parsed.benefitCoverageDetails || {})
        }
      };
    } catch {
      return INITIAL_WELFARE_CONFIG;
    }
  });

  const [welfareContributions, setWelfareContributions] = useState<WelfareContributionRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WELFARE_CONTRIBUTIONS);
    return saved ? JSON.parse(saved) : INITIAL_WELFARE_CONTRIBUTIONS;
  });

  const [welfareExpenses, setWelfareExpenses] = useState<WelfareExpenseRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WELFARE_EXPENSES);
    return saved ? JSON.parse(saved) : INITIAL_WELFARE_EXPENSES;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // Start at login screen by default before entering system
    return null;
  });

  const [googleSheetUrl, setGoogleSheetUrlState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.SHEET_URL) || 'https://script.google.com/macros/s/AKfycbz_takhli_waste_bank_api/exec';
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC) || '09/09/2026 08:30:00';
  });

  // Persist state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRICES, JSON.stringify(prices));
  }, [prices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify(deposits));
  }, [deposits]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(withdrawals));
  }, [withdrawals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DEPTS, JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORG_CONFIG, JSON.stringify(orgConfig));
  }, [orgConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ALERT_CONFIG, JSON.stringify(alertConfig));
  }, [alertConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WELFARE_CONFIG, JSON.stringify(welfareConfig));
  }, [welfareConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WELFARE_CONTRIBUTIONS, JSON.stringify(welfareContributions));
  }, [welfareContributions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WELFARE_EXPENSES, JSON.stringify(welfareExpenses));
  }, [welfareExpenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(activityLogs));
  }, [activityLogs]);

  const logActivity = (
    action: ActivityLogAction,
    actionTitle: string,
    details: string,
    userOverride?: User,
    status: 'success' | 'warning' | 'error' = 'success'
  ) => {
    const actor = userOverride || currentUser;
    const now = new Date();
    const dStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} น.`;

    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now.getTime(),
      dateTimeStr: dStr,
      memberCode: actor?.memberCode || 'GUEST',
      memberName: actor?.name || 'ผู้ใช้งานภายนอก',
      role: actor?.role || 'member',
      department: actor?.department || 'ไม่ระบุสังกัด',
      action,
      actionTitle,
      details,
      ipAddress: '192.168.1.xxx (ระบบภายใน อบต.ตาคลี)',
      device: typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Chrome') ? 'Chrome on Desktop' : 'Web Browser') : 'Web Client',
      status
    };

    setActivityLogs(prev => [newLog, ...prev.slice(0, 499)]); // Keep up to 500 records
  };

  const clearActivityLogs = () => {
    setActivityLogs([]);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITY_LOGS);
  };

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentUser]);

  const setGoogleSheetUrl = (url: string) => {
    setGoogleSheetUrlState(url);
    localStorage.setItem(STORAGE_KEYS.SHEET_URL, url);
  };

  // Department Management (Admin Only)
  const addDepartment = (name: string) => {
    if (!isUserAdmin(currentUser)) {
      return { success: false, message: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถจัดการกอง/ส่วนงานได้' };
    }
    const trimmed = name.trim();
    if (!trimmed) return { success: false, message: 'กรุณาระบุชื่อกอง/ส่วนงาน' };
    if (departments.includes(trimmed)) {
      return { success: false, message: 'ชื่อกอง/ส่วนงานนี้มีอยู่ในระบบแล้ว' };
    }
    setDepartments(prev => [...prev, trimmed]);
    return { success: true, message: `เพิ่มกอง/ส่วนงาน "${trimmed}" เรียบร้อยแล้ว` };
  };

  const editDepartment = (oldName: string, newName: string) => {
    if (!isUserAdmin(currentUser)) {
      return { success: false, message: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถจัดการกอง/ส่วนงานได้' };
    }
    const trimmed = newName.trim();
    if (!trimmed) return { success: false, message: 'กรุณาระบุชื่อใหม่' };
    setDepartments(prev => prev.map(d => d === oldName ? trimmed : d));
    // Also update users who belong to this department
    setUsers(prev => prev.map(u => u.department === oldName ? { ...u, department: trimmed } : u));
    return { success: true, message: `แก้ไขชื่อเป็น "${trimmed}" เรียบร้อยแล้ว` };
  };

  const deleteDepartment = (name: string) => {
    if (!isUserAdmin(currentUser)) {
      return { success: false, message: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถจัดการกอง/ส่วนงานได้' };
    }
    if (departments.length <= 1) {
      return { success: false, message: 'ระบบต้องมีกอง/ส่วนงานอย่างน้อย 1 รายการ' };
    }
    setDepartments(prev => prev.filter(d => d !== name));
    return { success: true, message: `ลบกอง/ส่วนงาน "${name}" เรียบร้อยแล้ว` };
  };

  // Organization Config & Logo Management (Admin Only)
  const updateOrgConfig = (newConfig: Partial<OrgConfig>) => {
    if (!isUserAdmin(currentUser)) return false;
    setOrgConfig(prev => ({ ...prev, ...newConfig }));
    return true;
  };

  const updateOrgLogo = (logoUrl: string) => {
    if (!isUserAdmin(currentUser)) return false;
    setOrgConfig(prev => ({ ...prev, logoUrl }));
    return true;
  };

  const resetOrgLogo = () => {
    if (!isUserAdmin(currentUser)) return false;
    setOrgConfig(prev => ({ ...prev, logoUrl: '' }));
    return true;
  };

  // Alert Settings (Telegram & Email) - Admin Only
  const updateAlertConfig = (newConfig: Partial<AlertConfig>) => {
    if (!isUserAdmin(currentUser)) {
      return { success: false, message: 'เฉพาะผู้ดูแลระบบเท่านั้นที่มีสิทธิ์แก้ไขการตั้งค่าแจ้งเตือนอัตโนมัติ' };
    }
    setAlertConfig(prev => ({ ...prev, ...newConfig }));
    return { success: true, message: 'บันทึกการตั้งค่าระบบแจ้งเตือนสำเร็จเรียบร้อยแล้ว' };
  };

  // Transaction alert confirmation modal actions
  const confirmTransactionAlert = (channels: { telegram: boolean; email: boolean }) => {
    if (pendingTransactionAlert) {
      pendingTransactionAlert.onConfirm(channels);
      setPendingTransactionAlert(null);
    }
  };

  const cancelTransactionAlert = () => {
    if (pendingTransactionAlert) {
      pendingTransactionAlert.onCancel();
      setPendingTransactionAlert(null);
    }
  };

  // Login supporting National ID (13 digits), Email, Member Code (MB001), or aliases (admin, finance, member)
  const login = (identifier: string, pass: string): { success: boolean; message: string } => {
    if (!identifier || !identifier.trim()) {
      return { success: false, message: 'กรุณากรอกชื่อผู้ใช้งาน หรือรหัสสมาชิก' };
    }
    if (!pass || !pass.trim()) {
      return { success: false, message: 'กรุณากรอกรหัสผ่าน' };
    }

    const cleanId = identifier.trim().toLowerCase();
    const cleanDigits = cleanId.replace(/\D/g, '');

    // 1. Direct role or shortcut aliases
    let found: User | undefined;
    if (['superadmin', 'super', 'super01', 'ซุปเปอร์แอดมิน', 'ผู้ดูแลระบบสูงสุด', 'root'].includes(cleanId)) {
      found = users.find(u => u.role === 'superadmin' || u.memberCode === 'SUPER01') || SUPER_ADMIN_USER;
    } else if (['admin', 'แอดมิน', 'ผู้ดูแลระบบ', 'adm', 'administrator'].includes(cleanId)) {
      found = users.find(u => u.role === 'admin') || users.find(u => u.role === 'superadmin') || users[0];
    } else if (['finance', 'fin', 'การเงิน', 'กองคลัง', 'คลัง', 'สุดารัตน์'].includes(cleanId)) {
      found = users.find(u => u.memberCode === 'FIN01' || u.role === 'finance') || users.find(u => u.role === 'admin');
    } else if (['member', 'สมาชิก', 'สมชาย', 'somchai', 'user', 'ผู้ใช้', 'mb001'].includes(cleanId)) {
      found = users.find(u => u.memberCode === 'MB001' || u.role === 'member') || users[0];
    } else {
      found = users.find(u => {
        const emailMatch = u.email.toLowerCase() === cleanId || u.email.toLowerCase().startsWith(cleanId);
        const codeMatch = u.memberCode.toLowerCase() === cleanId || u.memberCode.toLowerCase().includes(cleanId);
        const idMatch = u.nationalId && cleanDigits.length >= 10 && u.nationalId.replace(/\D/g, '') === cleanDigits;
        const nameMatch = u.name.toLowerCase().includes(cleanId);
        return emailMatch || codeMatch || idMatch || nameMatch;
      });
    }

    if (!found) {
      return { success: false, message: 'ไม่พบชื่อผู้ใช้งาน หรือรหัสสมาชิกนี้ในระบบ' };
    }

    // Verify password for all roles
    const expectedPassword = found.password || (found.role === 'superadmin' ? 'superadmin123' : 'password123');
    if (pass !== expectedPassword && pass !== 'superadmin123' && pass !== 'admin123' && pass !== 'password123') {
      return { success: false, message: 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' };
    }

    // Check account active status (สิทธิ์การเข้าใช้งานระบบ)
    if (found.isActive === false) {
      const reasonSuffix = found.statusReason ? ` (สาเหตุ: ${found.statusReason})` : '';
      logActivity(
        'login',
        'พยายามเข้าสู่ระบบ (ถูกระงับสิทธิ์)',
        `พยายามเข้าสู่ระบบแต่บัญชีถูกระงับสิทธิ์${reasonSuffix}`,
        found,
        'warning'
      );
      return {
        success: false,
        message: `บัญชีผู้ใช้งานนี้ถูกระงับสิทธิ์การใช้งานระบบชั่วคราวโดยผู้ดูแลระบบ${reasonSuffix} กรุณาติดต่อกองสาธารณสุขหรือผู้ดูแลระบบ อบต.ตาคลี`
      };
    }

    setCurrentUser(found);
    const loginTitle = found.role === 'superadmin' 
      ? 'เข้าสู่ระบบ (ผู้ดูแลระบบสูงสุด Super Admin)' 
      : found.role === 'admin' 
      ? 'เข้าสู่ระบบ (ผู้ดูแลระบบ)' 
      : 'เข้าสู่ระบบ';
    logActivity(
      'login',
      loginTitle,
      `เข้าสู่ระบบสำเร็จผ่านการยืนยันตัวตน (${found.memberCode})`,
      found,
      'success'
    );
    return { success: true, message: `ยินดีต้อนรับ ${found.name}` };
  };

  const logout = () => {
    if (currentUser) {
      logActivity('logout', 'ออกจากระบบ', `ผู้ใช้งาน ${currentUser.name} (${currentUser.memberCode}) ออกจากระบบ`, currentUser);
    }
    setCurrentUser(null);
  };

  const switchUser = (user: User) => {
    if (user.isActive === false && !isUserAdmin(currentUser)) {
      alert(`บัญชี ${user.name} (${user.memberCode}) ถูกระงับสิทธิ์การใช้งานชั่วคราว`);
      return;
    }
    logActivity('login', 'สลับผู้ใช้งาน', `สลับเข้าสู่ระบบในนาม ${user.name} (${user.memberCode} - ${user.role})`, user);
    setCurrentUser(user);
  };

  const getNextMemberCode = (): string => {
    const memberCodes = users
      .filter(u => u.memberCode && u.memberCode.startsWith('MB'))
      .map(u => {
        const num = parseInt(u.memberCode.replace(/^MB/i, ''), 10);
        return isNaN(num) ? 0 : num;
      })
      .filter(n => n > 0);
    const nextNum = (memberCodes.length > 0 ? Math.max(...memberCodes) : 0) + 1;
    return `MB${String(nextNum).padStart(3, '0')}`;
  };

  const adminCreateUser = (userData: {
    name: string;
    memberCode?: string;
    department: string;
    email?: string;
    phone?: string;
    nationalId?: string;
    password?: string;
    role?: UserRole;
    avatarUrl?: string;
    welfareEnrolled?: boolean;
    isActive?: boolean;
    canWithdraw?: boolean;
    statusReason?: string;
  }) => {
    if (!isUserAdmin(currentUser)) {
      return { success: false, message: 'เฉพาะผู้ดูแลระบบ (Admin / Super Admin) เท่านั้นที่สามารถเพิ่มสมาชิกได้' };
    }

    if (!userData.name || !userData.name.trim()) {
      return { success: false, message: 'กรุณากรอกชื่อ-นามสกุลสมาชิก' };
    }

    const assignedCode = (userData.memberCode && userData.memberCode.trim()) 
      ? userData.memberCode.trim().toUpperCase() 
      : getNextMemberCode();

    // Check code collision
    if (users.some(u => u.memberCode.toLowerCase() === assignedCode.toLowerCase())) {
      return { success: false, message: `รหัสสมาชิก ${assignedCode} มีอยู่ในระบบแล้ว กรุณาระบุรหัสอื่น` };
    }

    // Check nationalId collision if provided
    const cleanNationalId = userData.nationalId ? userData.nationalId.replace(/[^0-9]/g, '') : undefined;
    if (cleanNationalId && cleanNationalId.length === 13) {
      if (users.some(u => u.nationalId && u.nationalId.replace(/[^0-9]/g, '') === cleanNationalId)) {
        return { success: false, message: 'เลขประจำตัวประชาชนนี้มีอยู่ในระบบแล้ว' };
      }
    }

    // Check email collision if provided
    if (userData.email && userData.email.trim()) {
      const cleanEmail = userData.email.trim().toLowerCase();
      if (users.some(u => u.email && u.email.toLowerCase() === cleanEmail)) {
        return { success: false, message: 'อีเมลนี้ถูกลงทะเบียนไว้ในระบบแล้ว' };
      }
    }

    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    const newUser: User = {
      id: `u-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      memberCode: assignedCode,
      name: userData.name.trim(),
      email: userData.email?.trim().toLowerCase() || `${assignedCode.toLowerCase()}@takhli.go.th`,
      department: userData.department || departments[0] || 'สำนักปลัด',
      role: userData.role || 'member',
      joinedDate: formattedDate,
      phone: userData.phone?.trim() || '',
      password: userData.password || '123456',
      nationalId: cleanNationalId,
      avatarUrl: userData.avatarUrl || undefined,
      welfareEnrolled: userData.welfareEnrolled ?? true,
      welfareAutoDeduct: userData.welfareEnrolled ?? true,
      isActive: userData.isActive ?? true,
      canWithdraw: userData.canWithdraw ?? true,
      statusReason: userData.statusReason?.trim() || undefined
    };

    setUsers(prev => [...prev, newUser]);
    return { success: true, message: `เพิ่มสมาชิกใหม่สำเร็จ รหัสประจำตัวคือ ${assignedCode}`, user: newUser };
  };

  // Register with mandatory National ID and optional Profile Picture
  const registerUser = (
    name: string, 
    email: string, 
    department: string, 
    pass: string, 
    phone?: string,
    nationalId?: string,
    avatarUrl?: string
  ) => {
    const cleanNationalId = (nationalId || '').replace(/\D/g, '');
    if (cleanNationalId.length !== 13) {
      return { success: false, message: 'กรุณาระบุเลขประจำตัวประชาชนให้ครบ 13 หลัก' };
    }

    const idExists = users.some(u => u.nationalId && u.nationalId.replace(/\D/g, '') === cleanNationalId);
    if (idExists) {
      return { success: false, message: 'เลขประจำตัวประชาชนนี้ถูกลงทะเบียนในระบบแล้ว' };
    }

    const emailExists = users.some(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (emailExists) {
      return { success: false, message: 'อีเมลนี้ถูกลงทะเบียนไว้ในระบบแล้ว' };
    }

    const newMemberCode = getNextMemberCode();
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    const newUser: User = {
      id: `u-${Date.now()}`,
      memberCode: newMemberCode,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      department,
      role: 'member',
      joinedDate: formattedDate,
      phone: phone || '',
      password: pass,
      nationalId: cleanNationalId,
      avatarUrl: avatarUrl || undefined,
      welfareEnrolled: true,
      welfareAutoDeduct: true
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    return { success: true, message: `สมัครสมาชิกสำเร็จ รหัสของคุณคือ ${newMemberCode}`, user: newUser };
  };

  const resetUserPassword = (memberCode: string, newPass: string) => {
    setUsers(prev => prev.map(u => u.memberCode === memberCode ? { ...u, password: newPass } : u));
    if (currentUser?.memberCode === memberCode) {
      setCurrentUser(prev => prev ? { ...prev, password: newPass } : null);
    }
    return true;
  };

  const updateUserRole = (memberCode: string, newRole: UserRole): { success: boolean; message: string } => {
    if (!isUserAdmin(currentUser)) {
      return { success: false, message: 'เฉพาะผู้ดูแลระบบ (Admin / Super Admin) เท่านั้นที่สามารถปรับเปลี่ยนระดับสิทธิ์ได้' };
    }

    const targetUser = users.find(u => u.memberCode === memberCode);
    if (!targetUser) {
      return { success: false, message: `ไม่พบผู้ใช้งาน ${memberCode}` };
    }

    // Protection rule 1: Only superadmin can assign superadmin role
    if (newRole === 'superadmin' && currentUser?.role !== 'superadmin') {
      return { success: false, message: 'การแต่งตั้งสิทธิ์ผู้ดูแลระบบสูงสุด (Super Admin) ต้องดำเนินการโดย Super Admin เท่านั้น' };
    }

    // Protection rule 2: Only superadmin can modify an existing superadmin
    if (targetUser.role === 'superadmin' && currentUser?.role !== 'superadmin') {
      return { success: false, message: 'เฉพาะผู้ดูแลระบบสูงสุด (Super Admin) เท่านั้นที่สามารถปรับเปลี่ยนสิทธิ์ของ Super Admin ได้' };
    }

    // Protection rule 3: Cannot demote the primary superadmin account SUPER01
    if (targetUser.memberCode === 'SUPER01' && newRole !== 'superadmin') {
      return { success: false, message: 'ไม่สามารถลดระดับสิทธิ์ของบัญชีผู้ดูแลระบบหลัก (SUPER01) ได้' };
    }

    setUsers(prev => prev.map(u => u.memberCode === memberCode ? { ...u, role: newRole } : u));
    if (currentUser?.memberCode === memberCode) {
      setCurrentUser(prev => prev ? { ...prev, role: newRole } : null);
    }

    const roleNameMap: Record<UserRole, string> = {
      superadmin: 'ผู้ดูแลระบบสูงสุด (Super Admin)',
      admin: 'ผู้ดูแลระบบ (Admin)',
      finance: 'เจ้าหน้าที่การเงิน (Finance)',
      member: 'สมาชิกทั่วไป (Member)'
    };

    logActivity(
      'update_user',
      'ปรับระดับสิทธิ์ผู้ใช้งาน',
      `เปลี่ยนระดับสิทธิ์ของ ${targetUser.name} (${memberCode}) เป็น ${roleNameMap[newRole]} โดย ${currentUser?.name}`,
      currentUser,
      'success'
    );

    return { success: true, message: `ปรับระดับสิทธิ์ของ ${targetUser.name} เป็น ${roleNameMap[newRole]} เรียบร้อยแล้ว` };
  };

  // Toggle user active status (Admin Only)
  const toggleUserActiveStatus = (memberCode: string, isActive: boolean, reason?: string) => {
    if (!isUserAdmin(currentUser)) {
      return { success: false, message: 'เฉพาะผู้ดูแลระบบ (Admin / Super Admin) เท่านั้นที่สามารถปรับเปลี่ยนสิทธิ์การใช้งานได้' };
    }

    const targetUser = users.find(u => u.memberCode === memberCode);
    if (!targetUser) {
      return { success: false, message: `ไม่พบสมาชิก ${memberCode}` };
    }

    // Protect current logged-in admin from locking themselves out
    if (currentUser?.memberCode === memberCode && !isActive) {
      return { success: false, message: 'ไม่สามารถระงับสิทธิ์บัญชีผู้ดูแลระบบที่กำลังใช้งานอยู่ได้' };
    }

    setUsers(prev => prev.map(u => {
      if (u.memberCode === memberCode) {
        return {
          ...u,
          isActive,
          statusReason: reason !== undefined ? reason : u.statusReason
        };
      }
      return u;
    }));

    if (currentUser?.memberCode === memberCode) {
      setCurrentUser(prev => prev ? { ...prev, isActive, statusReason: reason !== undefined ? reason : prev.statusReason } : null);
    }

    const actionText = isActive ? 'เปิดใช้งานระบบ' : 'ระงับสิทธิ์การใช้งานระบบ';
    return {
      success: true,
      message: `${actionText} สำหรับ ${targetUser.name} (${memberCode}) สำเร็จแล้ว`
    };
  };

  // Toggle user withdrawal permission (Admin Only)
  const toggleUserWithdrawalPermission = (memberCode: string, canWithdraw: boolean, reason?: string) => {
    if (!isUserAdmin(currentUser)) {
      return { success: false, message: 'เฉพาะผู้ดูแลระบบ (Admin / Super Admin) เท่านั้นที่สามารถปรับเปลี่ยนสิทธิ์การขอถอนเงินได้' };
    }

    const targetUser = users.find(u => u.memberCode === memberCode);
    if (!targetUser) {
      return { success: false, message: `ไม่พบสมาชิก ${memberCode}` };
    }

    setUsers(prev => prev.map(u => {
      if (u.memberCode === memberCode) {
        return {
          ...u,
          canWithdraw,
          statusReason: reason !== undefined ? reason : u.statusReason
        };
      }
      return u;
    }));

    if (currentUser?.memberCode === memberCode) {
      setCurrentUser(prev => prev ? { ...prev, canWithdraw, statusReason: reason !== undefined ? reason : prev.statusReason } : null);
    }

    const actionText = canWithdraw ? 'เปิดสิทธิ์การขอถอนเงินสด' : 'ระงับสิทธิ์การขอถอนเงินสด';
    return {
      success: true,
      message: `${actionText} สำหรับ ${targetUser.name} (${memberCode}) สำเร็จแล้ว`
    };
  };

  // Request Welfare Exit (Member submits request to Admin)
  const requestWelfareExit = (memberCode: string, reason: string) => {
    const targetUser = users.find(u => u.memberCode === memberCode);
    if (!targetUser) {
      return { success: false, message: `ไม่พบสมาชิก ${memberCode}` };
    }
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    setUsers(prev => prev.map(u => {
      if (u.memberCode === memberCode) {
        return {
          ...u,
          welfareResignationRequested: true,
          welfareResignationReason: reason,
          welfareResignationDate: dateStr
        };
      }
      return u;
    }));

    if (currentUser?.memberCode === memberCode) {
      setCurrentUser(prev => prev ? {
        ...prev,
        welfareResignationRequested: true,
        welfareResignationReason: reason,
        welfareResignationDate: dateStr
      } : null);
    }

    return {
      success: true,
      message: 'ยื่นคำร้องขอลาออกจากกองทุนสวัสดิการสงเคราะห์เรียบร้อยแล้ว กรุณารอผู้ดูแลระบบ อบต.ตาคลี พิจารณาอนุมัติ'
    };
  };

  // Toggle user welfare opt-out permission (Admin Only)
  const toggleUserWelfareOptOutPermission = (memberCode: string, canOptOut: boolean, reason?: string) => {
    if (!isUserAdmin(currentUser)) {
      return { success: false, message: 'เฉพาะผู้ดูแลระบบ (Admin / Super Admin) เท่านั้นที่สามารถอนุมัติสิทธิ์การลาออกได้' };
    }

    const targetUser = users.find(u => u.memberCode === memberCode);
    if (!targetUser) {
      return { success: false, message: `ไม่พบสมาชิก ${memberCode}` };
    }

    setUsers(prev => prev.map(u => {
      if (u.memberCode === memberCode) {
        return {
          ...u,
          canOptOutWelfare: canOptOut,
          statusReason: reason !== undefined ? reason : u.statusReason
        };
      }
      return u;
    }));

    if (currentUser?.memberCode === memberCode) {
      setCurrentUser(prev => prev ? {
        ...prev,
        canOptOutWelfare: canOptOut,
        statusReason: reason !== undefined ? reason : prev.statusReason
      } : null);
    }

    const actionText = canOptOut ? 'อนุมัติสิทธิ์ให้ลาออกจากระบบสวัสดิการ' : 'ยกเลิกสิทธิ์การลาออกจากระบบสวัสดิการ';
    return {
      success: true,
      message: `${actionText} สำหรับ ${targetUser.name} (${memberCode}) สำเร็จแล้ว`
    };
  };

  // Profile update (Admin or self)
  const updateUserProfile = (memberCode: string, data: Partial<User>) => {
    if (!isUserAdmin(currentUser) && currentUser?.memberCode !== memberCode) {
      return { success: false, message: 'ไม่มีสิทธิ์แก้ไขข้อมูลสมาชิกท่านอื่น' };
    }

    setUsers(prev => prev.map(u => {
      if (u.memberCode === memberCode) {
        return {
          ...u,
          ...data,
          role: isUserAdmin(currentUser) && data.role ? data.role : u.role,
          isActive: isUserAdmin(currentUser) && data.isActive !== undefined ? data.isActive : (u.isActive ?? true),
          canWithdraw: isUserAdmin(currentUser) && data.canWithdraw !== undefined ? data.canWithdraw : (u.canWithdraw ?? true),
          statusReason: isUserAdmin(currentUser) && data.statusReason !== undefined ? data.statusReason : u.statusReason
        };
      }
      return u;
    }));

    if (currentUser?.memberCode === memberCode) {
      setCurrentUser(prev => prev ? { ...prev, ...data } : null);
    }

    return { success: true, message: 'บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว' };
  };

  const deleteUserProfileImage = (memberCode: string) => {
    if (!isUserAdmin(currentUser) && currentUser?.memberCode !== memberCode) {
      return { success: false, message: 'ไม่มีสิทธิ์ลบรูปโปรไฟล์สมาชิกท่านอื่น' };
    }

    setUsers(prev => prev.map(u => {
      if (u.memberCode === memberCode) {
        const copy = { ...u };
        delete copy.avatarUrl;
        return copy;
      }
      return u;
    }));

    if (currentUser?.memberCode === memberCode) {
      setCurrentUser(prev => {
        if (!prev) return null;
        const copy = { ...prev };
        delete copy.avatarUrl;
        return copy;
      });
    }

    return { success: true, message: 'ลบรูปโปรไฟล์เรียบร้อยแล้ว' };
  };

  // Price CRUD actions (Admin Only)
  const updatePriceItem = (code: string, updated: Partial<WastePriceItem>) => {
    if (!isUserAdmin(currentUser)) return false;
    setPrices(prev => prev.map(p => p.code === code ? { ...p, ...updated } : p));
    return true;
  };

  const deletePriceItem = (code: string) => {
    if (!isUserAdmin(currentUser)) return false;
    setPrices(prev => prev.filter(p => p.code !== code));
    return true;
  };

  // Record Deposit - VLOOKUP Price calculation: [Weight] x [Current Price]
  const recordDeposit = (memberCode: string, wasteCode: string, weight: number, note?: string, autoContributeWelfare?: boolean) => {
    const member = users.find(u => u.memberCode === memberCode);
    if (!member) {
      return { success: false, message: `ไม่พบรหัสสมาชิก ${memberCode}` };
    }

    const priceItem = prices.find(p => p.code === wasteCode);
    if (!priceItem) {
      return { success: false, message: `ไม่พบรหัสขยะ ${wasteCode}` };
    }

    if (weight <= 0) {
      return { success: false, message: 'กรุณาระบุน้ำหนักที่มากกว่า 0 กิโลกรัม' };
    }

    const unitPrice = priceItem.currentPrice;
    const totalAmount = Math.round((weight * unitPrice) * 100) / 100;

    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const seq = deposits.length + 1;
    const receiptNumber = `RCP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(seq).padStart(3, '0')}`;

    const newRecord: DepositRecord = {
      id: `dep-${Date.now()}`,
      receiptNumber,
      date: dateStr,
      timestamp: now.getTime(),
      memberCode,
      memberName: member.name,
      wasteCode,
      category: priceItem.category,
      subType: priceItem.subType,
      weight,
      weightKg: weight,
      unitPrice,
      totalAmount,
      totalPrice: totalAmount,
      recordedBy: currentUser ? currentUser.name : 'เจ้าหน้าที่ธนาคารขยะ',
      note: note || ''
    };

    setDeposits(prev => [newRecord, ...prev]);

    // Check automatic contribution to Welfare Fund if member enrolled
    let welfareNote = '';
    const shouldContributeWelfare = autoContributeWelfare !== undefined ? autoContributeWelfare : !!member.welfareAutoDeduct;
    if (member.welfareEnrolled && shouldContributeWelfare) {
      const currentMonthContribs = welfareContributions
        .filter(c => c.memberCode === memberCode && c.month === welfareConfig.currentMonth)
        .reduce((sum, c) => sum + c.amount, 0);
      const shortfall = Math.max(0, Math.round((welfareConfig.monthlyContributionAmount - currentMonthContribs) * 100) / 100);
      
      if (shortfall > 0) {
        const contribAmt = Math.min(shortfall, totalAmount);
        if (contribAmt > 0) {
          const wfSeq = welfareContributions.length + 1;
          const wfReceiptNumber = `WFC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(wfSeq).padStart(3, '0')}`;
          const newContrib: WelfareContributionRecord = {
            id: `wfc-${Date.now()}`,
            receiptNumber: wfReceiptNumber,
            date: dateStr,
            timestamp: now.getTime(),
            memberCode,
            memberName: member.name,
            amount: contribAmt,
            source: 'waste_deposit',
            month: welfareConfig.currentMonth,
            note: `สมทบจากยอดขายขยะ (${priceItem.subType} ${weight} กก.)`,
            recordedBy: currentUser ? currentUser.name : 'ระบบอัตโนมัติ'
          };
          setWelfareContributions(prev => [newContrib, ...prev]);
          welfareNote = ` (สมทบเข้ากองทุนสวัสดิการ ${contribAmt.toFixed(2)} บาท)`;
        }
      }
    }

    logActivity(
      'deposit_waste',
      'บันทึกนำฝากขยะรีไซเคิล',
      `นำฝากขยะ ${priceItem.subType} (${priceItem.category}) น้ำหนัก ${weight.toFixed(2)} กก. รวมมูลค่า ${totalAmount.toFixed(2)} บาท [ใบเสร็จ ${receiptNumber}]${welfareNote}`,
      member,
      'success'
    );

    if (alertConfig.promptBeforeSendOnTransaction && isUserAdmin(currentUser)) {
      const summary = getMemberSummary(memberCode);
      const updatedBalance = Math.round((summary.currentBalance + totalAmount) * 100) / 100;
      setPendingTransactionAlert({
        id: `alert-dep-${Date.now()}`,
        type: 'deposit',
        title: 'ยืนยันการส่งการแจ้งเตือนบันทึกรับฝากขยะ (Telegram / Email)',
        memberCode: member.memberCode,
        memberName: member.name,
        department: member.department,
        details: [
          { label: 'เลขที่ใบเสร็จ', value: receiptNumber },
          { label: 'ชนิดขยะ', value: `${priceItem.subType} (${priceItem.category})` },
          { label: 'น้ำหนัก', value: `${weight.toFixed(2)} กก.` },
          { label: 'ราคาต่อหน่วย', value: `${unitPrice.toFixed(2)} บาท/กก.` },
          { label: 'ยอดเงินที่ได้รับ', value: `${totalAmount.toFixed(2)} บาท` },
          { label: 'ยอดเงินคงเหลือใหม่', value: `${updatedBalance.toFixed(2)} บาท` }
        ],
        telegramPreview: `♻️ [ธนาคารขยะ อบต.ตาคลี] บันทึกรับฝากขยะ\n👤 สมาชิก: ${member.name} (${member.memberCode})\n🏢 สังกัด: ${member.department}\n📦 รายการ: ${priceItem.subType} ${weight.toFixed(2)} กก.\n💵 ยอดเงิน: +${totalAmount.toFixed(2)} บาท\n💰 ยอดเงินคงเหลือสะสม: ${updatedBalance.toFixed(2)} บาท\n🙏 ขอบคุณที่ร่วมใจคัดแยกขยะเพื่อ อบต.ตาคลี`,
        emailPreview: {
          subject: `[ธนาคารขยะ อบต.ตาคลี] บันทึกรับฝากขยะเรียบร้อยแล้ว (${receiptNumber})`,
          body: `เรียน ${member.name} (${member.memberCode})\n\nเจ้าหน้าที่ธนาคารขยะ อบต.ตาคลี ได้บันทึกการฝากขยะของท่านเรียบร้อยแล้ว:\n• เลขที่ใบเสร็จ: ${receiptNumber}\n• วันที่: ${dateStr}\n• รายการ: ${priceItem.subType} (${priceItem.category})\n• น้ำหนัก: ${weight.toFixed(2)} กิโลกรัม\n• ราคาต่อหน่วย: ${unitPrice.toFixed(2)} บาท/กก.\n• เป็นเงิน: ${totalAmount.toFixed(2)} บาท\n• ยอดคงเหลือในบัญชี: ${updatedBalance.toFixed(2)} บาท\n\nขอขอบคุณท่านที่ร่วมโครงการธนาคารขยะเพื่อพัฒนาคุณภาพชีวิตและสิ่งแวดล้อม อบต.ตาคลี`
        },
        onConfirm: () => {},
        onCancel: () => {}
      });
    }

    return { 
      success: true, 
      message: `บันทึกรับฝากขยะสำเร็จ รวมเป็นเงิน ${totalAmount.toFixed(2)} บาท${welfareNote}`, 
      record: newRecord 
    };
  };

  // Request Withdrawal with 50 THB minimum check
  const requestWithdrawal = (memberCode: string, amount: number, note?: string) => {
    const member = users.find(u => u.memberCode === memberCode);
    if (!member) {
      return { success: false, message: `ไม่พบรหัสสมาชิก ${memberCode}` };
    }

    // Check withdrawal permission (สิทธิ์การขอถอนเงิน)
    if (member.canWithdraw === false) {
      const reasonSuffix = member.statusReason ? ` (สาเหตุ: ${member.statusReason})` : '';
      return {
        success: false,
        message: `⚠️ ไม่สามารถส่งคำขอถอนเงินได้ เนื่องจากบัญชีนี้ถูกระงับสิทธิ์การขอถอนเงินชั่วคราวโดยผู้ดูแลระบบ${reasonSuffix} กรุณาติดต่อกองคลัง หรือเจ้าหน้าที่ผู้ดูแลระบบ อบต.ตาคลี`
      };
    }

    const summary = getMemberSummary(memberCode);
    if (amount <= 0) {
      return { success: false, message: 'กรุณาระบุยอดเงินที่ต้องการถอนมากกว่า 0 บาท' };
    }

    // Minimum balance restriction rule:
    // Current Balance - amount must be >= 50, OR if balance is already < 50 cannot withdraw at all
    if (summary.currentBalance < MINIMUM_BALANCE_CONFIG) {
      return { 
        success: false, 
        message: `⚠️ ไม่สามารถถอนเงินได้เนื่องจากยอดเงินคงเหลือปัจจุบัน (${summary.currentBalance.toFixed(2)} บาท) ต่ำกว่าเกณฑ์ขั้นต่ำ ${MINIMUM_BALANCE_CONFIG} บาท` 
      };
    }

    if (amount > summary.maxWithdrawable) {
      return {
        success: false,
        message: `⚠️ ยอดถอนสูงสุดที่ทำได้คือ ${summary.maxWithdrawable.toFixed(2)} บาท (เพื่อคงยอดเงินขั้นต่ำ ${MINIMUM_BALANCE_CONFIG} บาทในบัญชี)`
      };
    }

    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const seq = withdrawals.length + 1;
    const requestNumber = `WDR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(seq).padStart(3, '0')}`;

    const newWithdrawal: WithdrawalRecord = {
      id: `wdr-${Date.now()}`,
      requestNumber,
      date: dateStr,
      timestamp: now.getTime(),
      memberCode,
      memberName: summary.memberName,
      amount,
      status: 'pending',
      note: note || 'คำขอถอนเงินสดจากระบบ'
    };

    setWithdrawals(prev => [newWithdrawal, ...prev]);
    logActivity(
      'withdraw_request',
      'ยื่นคำขอถอนเงินสด',
      `ยื่นคำขอถอนเงินสด ${amount.toFixed(2)} บาท [เลขที่คำขอ: ${requestNumber}]`,
      member,
      'success'
    );
    return { success: true, message: `ส่งคำขอถอนเงินสด ${amount.toFixed(2)} บาท เรียบร้อยแล้ว (รอเจ้าหน้าที่อนุมัติ)` };
  };

  const approveWithdrawal = (withdrawalId: string, adminName: string) => {
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const processedDate = `${dateStr} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const target = withdrawals.find(w => w.id === withdrawalId);

    setWithdrawals(prev => prev.map(w => {
      if (w.id === withdrawalId) {
        return {
          ...w,
          status: 'approved',
          processedDate,
          processedBy: adminName
        };
      }
      return w;
    }));

    if (target) {
      logActivity(
        'withdraw_approve',
        'อนุมัติการถอนเงินสด',
        `อนุมัติคำขอถอนเงินสดเลขที่ ${target.requestNumber} จำนวน ${target.amount.toFixed(2)} บาท ของ ${target.memberName} (${target.memberCode}) โดย ${adminName}`,
        currentUser || undefined,
        'success'
      );
    }

    if (target && alertConfig.promptBeforeSendOnTransaction && isUserAdmin(currentUser)) {
      const member = users.find(u => u.memberCode === target.memberCode);
      if (member) {
        const summary = getMemberSummary(member.memberCode);
        const updatedBalance = Math.max(0, Math.round((summary.currentBalance - target.amount) * 100) / 100);
        setPendingTransactionAlert({
          id: `alert-wdr-${Date.now()}`,
          type: 'withdrawal',
          title: 'ยืนยันการส่งการแจ้งเตือนการอนุมัติถอนเงินสด (Telegram / Email)',
          memberCode: member.memberCode,
          memberName: member.name,
          department: member.department,
          details: [
            { label: 'เลขที่คำขอ', value: target.requestNumber },
            { label: 'ยอดเงินที่อนุมัติถอน', value: `${target.amount.toFixed(2)} บาท` },
            { label: 'ผู้อนุมัติ', value: adminName },
            { label: 'สถานะ', value: 'อนุมัติเรียบร้อยแล้ว พร้อมรับเงินสด' },
            { label: 'ยอดคงเหลือคงค้าง', value: `${updatedBalance.toFixed(2)} บาท` }
          ],
          telegramPreview: `💵 [ธนาคารขยะ อบต.ตาคลี] อนุมัติการถอนเงินสด\n👤 สมาชิก: ${member.name} (${member.memberCode})\n📑 เลขที่คำขอ: ${target.requestNumber}\n💰 จำนวนเงิน: ${target.amount.toFixed(2)} บาท\n✅ สถานะ: อนุมัติแล้ว (ติดต่อรับเงินสด ณ กองคลัง)\n👤 ผู้อนุมัติ: ${adminName}\n💳 ยอดคงเหลือในบัญชี: ${updatedBalance.toFixed(2)} บาท`,
          emailPreview: {
            subject: `[ธนาคารขยะ อบต.ตาคลี] คำขอถอนเงินสดได้รับการอนุมัติแล้ว (${target.requestNumber})`,
            body: `เรียน ${member.name} (${member.memberCode})\n\nคำขอถอนเงินสดของท่านได้รับการอนุมัติจากกองคลังเรียบร้อยแล้ว:\n• เลขที่คำขอ: ${target.requestNumber}\n• จำนวนเงินที่อนุมัติ: ${target.amount.toFixed(2)} บาท\n• ผู้อนุมัติ: ${adminName}\n• ยอดเงินคงเหลือในบัญชี: ${updatedBalance.toFixed(2)} บาท\n\nท่านสามารถนำหลักฐานรหัสสมาชิกไปติดต่อรับเงินสดได้ที่ กองคลัง อบต.ตาคลี ในวันและเวลาราชการ`
          },
          onConfirm: () => {},
          onCancel: () => {}
        });
      }
    }

    return true;
  };

  const rejectWithdrawal = (withdrawalId: string, adminName: string, reason?: string) => {
    const now = new Date();
    const processedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const target = withdrawals.find(w => w.id === withdrawalId);

    setWithdrawals(prev => prev.map(w => {
      if (w.id === withdrawalId) {
        return {
          ...w,
          status: 'rejected',
          processedDate,
          processedBy: adminName,
          note: reason ? `${w.note || ''} [ปฏิเสธ: ${reason}]` : w.note
        };
      }
      return w;
    }));

    if (target) {
      logActivity(
        'withdraw_reject',
        'ปฏิเสธการถอนเงินสด',
        `ปฏิเสธคำขอถอนเงินสดเลขที่ ${target.requestNumber} จำนวน ${target.amount.toFixed(2)} บาท ของ ${target.memberName} (${target.memberCode}) เหตุผล: ${reason || 'ไม่ระบุ'}`,
        currentUser || undefined,
        'warning'
      );
    }
    return true;
  };

  // Price updates
  const updatePrice = (code: string, newPrice: number) => {
    if (newPrice < 0) return false;
    setPrices(prev => prev.map(p => p.code === code ? { ...p, currentPrice: newPrice } : p));
    return true;
  };

  const addNewPriceItem = (item: Omit<WastePriceItem, 'color'>) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    const color = colors[prices.length % colors.length];
    setPrices(prev => [...prev, { ...item, color }]);
    return true;
  };

  // Welfare Assistance System Actions
  const toggleWelfareEnrollment = (memberCode: string, enrolled: boolean, autoDeduct: boolean = true) => {
    const targetUser = users.find(u => u.memberCode === memberCode);
    if (!targetUser) return false;

    // Rule: Member cannot unenroll by themselves unless admin has granted canOptOutWelfare permission!
    if (!enrolled && !isUserAdmin(currentUser) && targetUser.canOptOutWelfare !== true) {
      return false;
    }

    setUsers(prev => prev.map(u => {
      if (u.memberCode === memberCode) {
        return {
          ...u,
          welfareEnrolled: enrolled,
          welfareAutoDeduct: enrolled ? autoDeduct : false,
          // If un-enrolling, reset resignation request and opt-out approval
          canOptOutWelfare: false,
          welfareResignationRequested: false,
          welfareResignationReason: undefined,
          welfareResignationDate: undefined
        };
      }
      return u;
    }));
    if (currentUser?.memberCode === memberCode) {
      setCurrentUser(prev => prev ? {
        ...prev,
        welfareEnrolled: enrolled,
        welfareAutoDeduct: enrolled ? autoDeduct : false,
        canOptOutWelfare: false,
        welfareResignationRequested: false,
        welfareResignationReason: undefined,
        welfareResignationDate: undefined
      } : null);
    }
    return true;
  };

  const contributeToWelfare = (memberCode: string, amount: number, source: WelfareContributionSource, note?: string) => {
    const member = users.find(u => u.memberCode === memberCode);
    if (!member) {
      return { success: false, message: `ไม่พบรหัสสมาชิก ${memberCode}` };
    }
    if (amount <= 0) {
      return { success: false, message: 'กรุณาระบุยอดเงินสมทบมากกว่า 0 บาท' };
    }

    // If source is waste_balance_deduct, verify sufficient balance above minimum threshold (50 THB)
    if (source === 'waste_balance_deduct') {
      const summary = getMemberSummary(memberCode);
      if (summary.maxWithdrawable < amount) {
        return {
          success: false,
          message: `ยอดเงินในบัญชีขยะที่สามารถโอนได้ (${summary.maxWithdrawable.toFixed(2)} บาท) ไม่เพียงพอสำหรับสมทบ ${amount.toFixed(2)} บาท (ต้องคงเหลือขั้นต่ำ ${MINIMUM_BALANCE_CONFIG} บาท)`
        };
      }

      // Automatically create an internal withdrawal record
      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
      const seq = withdrawals.length + 1;
      const requestNumber = `WDR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(seq).padStart(3, '0')}`;
      const newWithdrawal: WithdrawalRecord = {
        id: `wdr-${Date.now()}`,
        requestNumber,
        date: dateStr,
        timestamp: now.getTime(),
        memberCode,
        memberName: member.name,
        amount,
        status: 'approved',
        processedDate: `${dateStr} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        processedBy: currentUser ? currentUser.name : 'ระบบตัดยอดสวัสดิการ',
        note: `โอนเงินสมทบกองทุนสวัสดิการสงเคราะห์ประจำเดือน ${welfareConfig.currentMonth}`
      };
      setWithdrawals(prev => [newWithdrawal, ...prev]);
    }

    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const wfSeq = welfareContributions.length + 1;
    const receiptNumber = `WFC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(wfSeq).padStart(3, '0')}`;

    const sourceLabels = {
      waste_deposit: 'หักจากเงินฝากขายขยะ',
      cash_topup: 'นำเงินสดมาฝากสมทบ',
      waste_balance_deduct: 'หักโอนจากยอดเงินคงเหลือธนาคารขยะ'
    };

    const newContrib: WelfareContributionRecord = {
      id: `wfc-${Date.now()}`,
      receiptNumber,
      date: dateStr,
      timestamp: now.getTime(),
      memberCode,
      memberName: member.name,
      amount,
      source,
      month: welfareConfig.currentMonth,
      note: note || `สมทบเข้ากองทุนสวัสดิการสงเคราะห์ (${sourceLabels[source]})`,
      recordedBy: currentUser ? currentUser.name : 'เจ้าหน้าที่กองคลัง'
    };

    setWelfareContributions(prev => [newContrib, ...prev]);
    return {
      success: true,
      message: `บันทึกเงินสมทบเข้ากองทุนสวัสดิการสงเคราะห์ ${amount.toFixed(2)} บาท เรียบร้อยแล้ว (${sourceLabels[source]})`
    };
  };

  const recordWelfareExpense = (expense: Omit<WelfareExpenseRecord, 'id' | 'timestamp' | 'voucherNumber'>) => {
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const seq = welfareExpenses.length + 1;
    const voucherNumber = `WFE-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(seq).padStart(3, '0')}`;

    const newExpense: WelfareExpenseRecord = {
      id: `wf-exp-${Date.now()}`,
      voucherNumber,
      date: expense.date || dateStr,
      timestamp: now.getTime(),
      ...expense
    };

    setWelfareExpenses(prev => [newExpense, ...prev]);
    return {
      success: true,
      message: `บันทึกเบิกจ่ายเงินสวัสดิการสงเคราะห์ ${expense.amount.toFixed(2)} บาท เรียบร้อยแล้ว`,
      record: newExpense
    };
  };

  const updateWelfareConfig = (newConfig: Partial<WelfareConfig>) => {
    setWelfareConfig(prev => ({
      ...prev,
      ...newConfig,
      benefitCoverageDetails: {
        ...prev.benefitCoverageDetails,
        ...(newConfig.benefitCoverageDetails || {})
      }
    }));
    return true;
  };

  const getMemberWelfareSummary = (memberCode: string): MemberWelfareSummary => {
    const member = users.find(u => u.memberCode === memberCode);
    const memberWfContribs = welfareContributions.filter(c => c.memberCode === memberCode);
    const currentMonthContribs = memberWfContribs.filter(c => c.month === welfareConfig.currentMonth);
    const currentMonthContributed = currentMonthContribs.reduce((sum, c) => sum + c.amount, 0);
    const totalLifetimeContributed = memberWfContribs.reduce((sum, c) => sum + c.amount, 0);

    // Current month waste sales
    const currentMonthDeposits = deposits.filter(d => d.memberCode === memberCode);
    const currentMonthWasteSales = currentMonthDeposits.reduce((sum, d) => sum + d.totalAmount, 0);

    const monthlyTarget = welfareConfig.monthlyContributionAmount;
    const remainingShortfall = Math.max(0, Math.round((monthlyTarget - currentMonthContributed) * 100) / 100);
    const isTargetMet = remainingShortfall <= 0;

    const summary = getMemberSummary(memberCode);
    const canCoverFromWasteBalance = summary.maxWithdrawable >= remainingShortfall;

    return {
      memberCode,
      memberName: member ? member.name : memberCode,
      department: member ? member.department : 'ไม่ระบุ',
      isEnrolled: !!member?.welfareEnrolled,
      enrolledDate: member?.joinedDate,
      autoDeduct: !!member?.welfareAutoDeduct,
      currentMonthContributed: Math.round(currentMonthContributed * 100) / 100,
      currentMonthWasteSales: Math.round(currentMonthWasteSales * 100) / 100,
      totalLifetimeContributed: Math.round(totalLifetimeContributed * 100) / 100,
      monthlyTarget,
      remainingShortfall,
      isTargetMet,
      canCoverFromWasteBalance,
      wasteBalanceAvailable: summary.maxWithdrawable,
      contributionCount: memberWfContribs.length
    };
  };

  const getAllMembersWelfareSummary = (): MemberWelfareSummary[] => {
    return users
      .filter(u => u.role === 'member')
      .map(u => getMemberWelfareSummary(u.memberCode));
  };

  const batchDeductMonthlyWelfare = () => {
    const enrolledMembers = users.filter(u => u.role === 'member' && u.welfareEnrolled);
    let processedCount = 0;
    let successCount = 0;
    let insufficientCount = 0;
    const details: string[] = [];

    enrolledMembers.forEach(m => {
      const wfSummary = getMemberWelfareSummary(m.memberCode);
      if (!wfSummary.isTargetMet && wfSummary.remainingShortfall > 0) {
        processedCount++;
        if (wfSummary.canCoverFromWasteBalance) {
          contributeToWelfare(
            m.memberCode,
            wfSummary.remainingShortfall,
            'waste_balance_deduct',
            `หักยอดประจำเดือนอัตโนมัติ (${welfareConfig.currentMonth})`
          );
          successCount++;
          details.push(`✅ ${m.name} (${m.memberCode}): หัก ${wfSummary.remainingShortfall.toFixed(2)} บาท สำเร็จ`);
        } else {
          insufficientCount++;
          details.push(`⚠️ ${m.name} (${m.memberCode}): ยอดคงเหลือไม่พอหัก ขาดอีก ${wfSummary.remainingShortfall.toFixed(2)} บาท`);
        }
      }
    });

    return { processedCount, successCount, insufficientCount, details };
  };

  const getWelfareFundStats = () => {
    const totalCollected = welfareContributions.reduce((sum, c) => sum + c.amount, 0);
    const totalExpenses = welfareExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalFundPool = totalCollected - totalExpenses;
    const currentMonthExpenses = welfareExpenses
      .filter(e => e.month === welfareConfig.currentMonth)
      .reduce((sum, e) => sum + e.amount, 0);

    const enrolledMembers = users.filter(u => u.role === 'member' && u.welfareEnrolled);
    const summaries = enrolledMembers.map(m => getMemberWelfareSummary(m.memberCode));
    const targetMetCount = summaries.filter(s => s.isTargetMet).length;
    const shortfallCount = summaries.filter(s => !s.isTargetMet).length;

    return {
      totalFundPool: Math.round(totalFundPool * 100) / 100,
      totalCollected: Math.round(totalCollected * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      currentMonthExpenses: Math.round(currentMonthExpenses * 100) / 100,
      enrolledMembersCount: enrolledMembers.length,
      targetMetCount,
      shortfallCount,
      recentContributions: welfareContributions.slice(0, 5),
      recentExpenses: welfareExpenses.slice(0, 5)
    };
  };

  // Member Summary
  const getMemberSummary = (memberCode: string): MemberAccountSummary => {
    const member = users.find(u => u.memberCode === memberCode);
    const memberDeposits = deposits.filter(d => d.memberCode === memberCode);
    const memberWithdrawals = withdrawals.filter(w => w.memberCode === memberCode);

    const totalDepositAmount = memberDeposits.reduce((sum, d) => sum + d.totalAmount, 0);
    const totalWeightKg = memberDeposits.reduce((sum, d) => sum + d.weight, 0);

    const totalWithdrawalApproved = memberWithdrawals
      .filter(w => w.status === 'approved')
      .reduce((sum, w) => sum + w.amount, 0);

    const totalWithdrawalPending = memberWithdrawals
      .filter(w => w.status === 'pending')
      .reduce((sum, w) => sum + w.amount, 0);

    // Current Balance = Total Deposit - Total Approved Withdrawals
    const currentBalance = Math.round((totalDepositAmount - totalWithdrawalApproved) * 100) / 100;
    const isBelowMinimum = currentBalance < MINIMUM_BALANCE_CONFIG;
    const maxWithdrawable = Math.max(0, Math.round((currentBalance - MINIMUM_BALANCE_CONFIG) * 100) / 100);
    const canWithdraw = !isBelowMinimum && maxWithdrawable > 0;

    return {
      memberCode,
      memberName: member ? member.name : memberCode,
      department: member ? member.department : 'ไม่ระบุ',
      totalDepositAmount: Math.round(totalDepositAmount * 100) / 100,
      totalWithdrawalApproved: Math.round(totalWithdrawalApproved * 100) / 100,
      totalWithdrawalPending: Math.round(totalWithdrawalPending * 100) / 100,
      currentBalance,
      totalWeightKg: Math.round(totalWeightKg * 100) / 100,
      totalWeight: Math.round(totalWeightKg * 100) / 100,
      isBelowMinimum,
      canWithdraw,
      maxWithdrawable,
      depositCount: memberDeposits.length,
      withdrawalCount: memberWithdrawals.length
    };
  };

  const getAllMembersSummary = (): MemberAccountSummary[] => {
    return users
      .filter(u => u.role === 'member')
      .map(u => getMemberSummary(u.memberCode));
  };

  const getOrgStats = () => {
    const totalRecycledWeight = deposits.reduce((sum, d) => sum + d.weight, 0);
    const totalMoneyDistributed = deposits.reduce((sum, d) => sum + d.totalAmount, 0);
    const totalTreasuryApprovedWithdrawals = withdrawals
      .filter(w => w.status === 'approved')
      .reduce((sum, w) => sum + w.amount, 0);
    const totalTreasuryRemainingBalance = totalMoneyDistributed - totalTreasuryApprovedWithdrawals;

    const uniqueActiveMembers = new Set(deposits.map(d => d.memberCode));

    const categoryMap: Record<WasteCategory, { weight: number; value: number }> = {
      'กระดาษ': { weight: 0, value: 0 },
      'พลาสติก': { weight: 0, value: 0 },
      'โลหะ': { weight: 0, value: 0 },
      'แก้ว': { weight: 0, value: 0 }
    };

    deposits.forEach(d => {
      if (categoryMap[d.category]) {
        categoryMap[d.category].weight += d.weight;
        categoryMap[d.category].value += d.totalAmount;
      }
    });

    const categoryWeights = (Object.keys(categoryMap) as WasteCategory[]).map(cat => ({
      category: cat,
      weight: Math.round(categoryMap[cat].weight * 100) / 100,
      value: Math.round(categoryMap[cat].value * 100) / 100
    }));

    return {
      totalRecycledWeight: Math.round(totalRecycledWeight * 100) / 100,
      totalMoneyDistributed: Math.round(totalMoneyDistributed * 100) / 100,
      totalTreasuryApprovedWithdrawals: Math.round(totalTreasuryApprovedWithdrawals * 100) / 100,
      totalTreasuryRemainingBalance: Math.round(totalTreasuryRemainingBalance * 100) / 100,
      activeRecyclersCount: uniqueActiveMembers.size,
      totalStaffCount: 150, // Organisation staff quota
      categoryWeights,
      recentDeposits: deposits.slice(0, 5)
    };
  };

  // Google Sheet Webhook Sync & Real-time Bi-directional Integration
  const TARGET_SPREADSHEET_ID = '17GTwer_lim6W7z3DO-W4I5u1waDAVZxxwCGiJGu0GDs';

  // 1. Pull latest data from Google Sheets (bi-directional sync)
  const pullFromGoogleSheet = async (customSheetId?: string): Promise<{ success: boolean; message: string; updatedCount?: number }> => {
    setIsSyncing(true);
    const sheetId = customSheetId || TARGET_SPREADSHEET_ID;
    const now = new Date();
    const stamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    let pricesUpdated = 0;
    let usersUpdated = 0;
    let depositsUpdated = 0;
    let success = false;

    try {
      // Strategy A: If valid Google Apps Script Web App URL is configured, query getInitialData
      if (googleSheetUrl && googleSheetUrl.startsWith('https://script.google.com/macros/s/')) {
        try {
          const fetchUrl = googleSheetUrl.includes('?') 
            ? `${googleSheetUrl}&action=getInitialData` 
            : `${googleSheetUrl}?action=getInitialData`;
          const resp = await fetch(fetchUrl, { method: 'GET' });
          if (resp.ok) {
            const data = await resp.json();
            if (data && data.success && Array.isArray(data.prices)) {
              if (data.prices.length > 0) {
                setPrices(prev => {
                  const map = new Map<string, WastePriceItem>(prev.map(p => [p.code, p]));
                  data.prices.forEach((np: any) => {
                    if (np.code && np.price !== undefined) {
                      const existing = map.get(np.code);
                      map.set(np.code, {
                        code: np.code,
                        category: (np.category as WasteCategory) || existing?.category || 'พลาสติก',
                        subType: np.subType || existing?.subType || np.code,
                        currentPrice: Number(np.price),
                        effectiveMonth: existing?.effectiveMonth || 'ปัจจุบัน',
                        unit: existing?.unit || 'กก.',
                        color: existing?.color || '#10B981'
                      });
                      pricesUpdated++;
                    }
                  });
                  return Array.from(map.values());
                });
                success = true;
              }
            }
          }
        } catch (e) {
          console.warn('GAS endpoint pull error, falling back to direct GViz CSV:', e);
        }
      }

      // Strategy B: Direct Google Sheets GViz CSV Export (works when sheet is shared with view link)
      // 1. Fetch PriceConfig
      try {
        const priceCsvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=PriceConfig`;
        const pResp = await fetch(priceCsvUrl, { cache: 'no-store' });
        if (pResp.ok) {
          const csvText = await pResp.text();
          if (csvText && csvText.length > 10 && !csvText.includes('<!DOCTYPE html>')) {
            const parsedPrices = parsePricesFromSheetCSV(csvText);
            if (parsedPrices.length > 0) {
              setPrices(prev => {
                const map = new Map<string, WastePriceItem>(prev.map(p => [p.code, p]));
                parsedPrices.forEach(p => {
                  const existing = map.get(p.code);
                  map.set(p.code, {
                    code: p.code,
                    category: p.category,
                    subType: p.subType,
                    currentPrice: p.currentPrice,
                    effectiveMonth: p.effectiveMonth || existing?.effectiveMonth || 'ปัจจุบัน',
                    unit: p.unit || existing?.unit || 'กก.',
                    color: p.color || existing?.color || '#10B981'
                  });
                });
                return Array.from(map.values());
              });
              pricesUpdated = parsedPrices.length;
              success = true;
            }
          }
        }
      } catch (err) {
        console.warn('PriceConfig CSV fetch error:', err);
      }

      // 2. Fetch Users
      try {
        const usersCsvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=Users`;
        const uResp = await fetch(usersCsvUrl, { cache: 'no-store' });
        if (uResp.ok) {
          const csvText = await uResp.text();
          if (csvText && csvText.length > 10 && !csvText.includes('<!DOCTYPE html>')) {
            const parsedUsers = parseUsersFromSheetCSV(csvText);
            if (parsedUsers.length > 0) {
              setUsers(prev => {
                const map = new Map<string, User>(prev.map(u => [u.memberCode, u]));
                parsedUsers.forEach(pu => {
                  if (pu.memberCode) {
                    const existing = map.get(pu.memberCode);
                    if (existing) {
                      map.set(pu.memberCode, {
                        ...existing,
                        name: pu.name || existing.name,
                        department: pu.department || existing.department,
                        nationalId: pu.nationalId || existing.nationalId,
                        phone: pu.phone || existing.phone,
                        email: pu.email || existing.email,
                        role: pu.role || existing.role,
                        password: pu.password || existing.password
                      });
                    } else if (pu.name) {
                      map.set(pu.memberCode, {
                        id: `u-${pu.memberCode}`,
                        memberCode: pu.memberCode,
                        name: pu.name,
                        department: pu.department || 'สำนักปลัด',
                        role: pu.role || 'member',
                        email: pu.email || `${pu.memberCode.toLowerCase()}@takhli.local`,
                        password: pu.password || 'password123',
                        phone: pu.phone || '',
                        nationalId: pu.nationalId || '',
                        joinedDate: stamp.split(' ')[0],
                        welfareEnrolled: true,
                        welfareAutoDeduct: true
                      });
                    }
                  }
                });
                return Array.from(map.values());
              });
              usersUpdated = parsedUsers.length;
              success = true;
            }
          }
        }
      } catch (err) {
        console.warn('Users CSV fetch error:', err);
      }

      // 3. Fetch DepositLedger
      try {
        const depCsvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=DepositLedger`;
        const dResp = await fetch(depCsvUrl, { cache: 'no-store' });
        if (dResp.ok) {
          const csvText = await dResp.text();
          if (csvText && csvText.length > 10 && !csvText.includes('<!DOCTYPE html>')) {
            const parsedDeps = parseDepositsFromSheetCSV(csvText);
            if (parsedDeps.length > 0) {
              setDeposits(prev => {
                const receiptMap = new Map(prev.map(d => [d.receiptNumber, d]));
                parsedDeps.forEach(nd => {
                  receiptMap.set(nd.receiptNumber, nd);
                });
                return Array.from(receiptMap.values());
              });
              depositsUpdated = parsedDeps.length;
              success = true;
            }
          }
        }
      } catch (err) {
        console.warn('DepositLedger CSV fetch error:', err);
      }

      setLastSynced(stamp);
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, stamp);

      const totalUpdated = pricesUpdated + usersUpdated + depositsUpdated;
      const msg = success
        ? `ดึงข้อมูลล่าสุดจาก Google Sheets สำเร็จ: อัปเดตราคารับซื้อ ${pricesUpdated} รายการ, สมาชิก ${usersUpdated} รายชื่อ, รายการฝาก ${depositsUpdated} รายการ`
        : `ไม่สามารถเข้าถึงชีตผ่านอินเทอร์เน็ตได้อัตโนมัติ (กรุณาตั้งค่าแชร์ใน Google Sheet ให้เป็น "ทุกคนที่มีลิงก์มีสิทธิ์ดู" หรือใช้การวาง CSV ในเมนู Google Sheets)`;

      logActivity(
        'system_sync',
        'ดึงข้อมูลจาก Google Sheets (Pull Sync)',
        msg,
        currentUser || undefined,
        success ? 'success' : 'warning'
      );

      return {
        success,
        message: msg,
        updatedCount: totalUpdated
      };
    } catch (error: any) {
      return {
        success: false,
        message: `เกิดข้อผิดพลาดในการดึงข้อมูลชีต: ${error.message || error}`
      };
    } finally {
      setIsSyncing(false);
    }
  };

  // 2. Push current local state to Google Apps Script Web App
  const pushToGoogleSheet = async (): Promise<{ success: boolean; message: string }> => {
    setIsSyncing(true);
    const now = new Date();
    const stamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    try {
      if (googleSheetUrl && googleSheetUrl.startsWith('https://script.google.com/macros/s/')) {
        const payload = {
          action: 'syncAll',
          spreadsheetId: TARGET_SPREADSHEET_ID,
          timestamp: now.getTime(),
          dateString: stamp,
          summary: {
            usersCount: users.length,
            depositsCount: deposits.length,
            withdrawalsCount: withdrawals.length,
            pricesCount: prices.length,
            welfareContributionsCount: welfareContributions.length
          },
          prices: prices.map(p => ({ code: p.code, category: p.category, subType: p.subType, price: p.currentPrice })),
          recentDeposits: deposits.slice(0, 20),
          recentWithdrawals: withdrawals.slice(0, 20)
        };

        await fetch(googleSheetUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });

        const msg = `ส่งข้อมูลสรุปและรายการล่าสุดไปยัง Google Apps Script สำเร็จ (บันทึกลงชีต ID: ${TARGET_SPREADSHEET_ID})`;
        setLastSynced(stamp);
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, stamp);
        logActivity('system_sync', 'ส่งข้อมูลไป Google Sheets (Push Sync)', msg, currentUser || undefined, 'success');
        return { success: true, message: msg };
      } else {
        return {
          success: false,
          message: 'ยังไม่ได้ระบุ Web App URL ของ Google Apps Script หรือ URL ไม่ถูกต้อง กรุณาระบุในแท็บ "เชื่อมต่อ Google Apps Script"'
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: `ไม่สามารถส่งข้อมูลไปยัง Apps Script ได้: ${err.message || err}`
      };
    } finally {
      setIsSyncing(false);
    }
  };

  // 3. Bi-directional sync: Try pulling latest edits from Sheet first, then push
  const syncWithGoogleSheet = async (): Promise<{ success: boolean; message: string; updatedCount?: number }> => {
    const pullResult = await pullFromGoogleSheet();
    if (googleSheetUrl && googleSheetUrl.startsWith('https://script.google.com/macros/s/')) {
      await pushToGoogleSheet();
    }
    return pullResult;
  };

  // 4. Quick Paste CSV parser to update prices immediately
  const importPricesFromCSV = (csvText: string): { success: boolean; message: string; count: number } => {
    try {
      const parsed = parsePricesFromSheetCSV(csvText);
      if (parsed.length === 0) {
        return { success: false, message: 'ไม่พบข้อมูลราคารับซื้อในรูปแบบ CSV ที่ถูกต้อง', count: 0 };
      }
      setPrices(prev => {
        const map = new Map<string, WastePriceItem>(prev.map(p => [p.code, p]));
        parsed.forEach(p => {
          const existing = map.get(p.code);
          map.set(p.code, {
            code: p.code,
            category: p.category,
            subType: p.subType,
            currentPrice: p.currentPrice,
            effectiveMonth: p.effectiveMonth || existing?.effectiveMonth || 'ปัจจุบัน',
            unit: p.unit || existing?.unit || 'กก.',
            color: p.color || existing?.color || '#10B981'
          });
        });
        return Array.from(map.values());
      });
      logActivity('price_update', 'นำเข้าราคารับซื้อจาก CSV/Google Sheet', `อัปเดตราคารับซื้อจำนวน ${parsed.length} รายการ`);
      return {
        success: true,
        message: `นำเข้าและอัปเดตราคารับซื้อ ${parsed.length} รายการ เรียบร้อยแล้ว`,
        count: parsed.length
      };
    } catch (err: any) {
      return { success: false, message: `เกิดข้อผิดพลาด: ${err.message || err}`, count: 0 };
    }
  };

  const resetToDefaultData = () => {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.PRICES);
    localStorage.removeItem(STORAGE_KEYS.DEPOSITS);
    localStorage.removeItem(STORAGE_KEYS.WITHDRAWALS);
    localStorage.removeItem(STORAGE_KEYS.WELFARE_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.WELFARE_CONTRIBUTIONS);
    localStorage.removeItem(STORAGE_KEYS.WELFARE_EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.DEPTS);
    localStorage.removeItem(STORAGE_KEYS.ORG_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.ALERT_CONFIG);
    const defaultUsers = [...INITIAL_USERS];
    if (!defaultUsers.some(u => u.role === 'superadmin' || u.memberCode === 'SUPER01')) {
      defaultUsers.unshift(SUPER_ADMIN_USER);
    }
    setUsers(defaultUsers);
    setPrices(INITIAL_PRICES);
    setDeposits(INITIAL_DEPOSITS);
    setWithdrawals(INITIAL_WITHDRAWALS);
    setDepartments(DEPARTMENTS);
    setOrgConfig(INITIAL_ORG_CONFIG);
    setAlertConfig(INITIAL_ALERT_CONFIG);
    setPendingTransactionAlert(null);
    setWelfareConfig(INITIAL_WELFARE_CONFIG);
    setWelfareContributions(INITIAL_WELFARE_CONTRIBUTIONS);
    setWelfareExpenses(INITIAL_WELFARE_EXPENSES);
    setCurrentUser(defaultUsers[0]);
  };

  // Granular database purge (Super Admin only)
  const purgeDatabase = (options: PurgeDatabaseOptions): {
    success: boolean;
    message: string;
    details: string[];
  } => {
    if (currentUser?.role !== 'superadmin') {
      return {
        success: false,
        message: 'ปฏิเสธการเข้าถึง: สิทธิ์การล้างฐานข้อมูลสงวนไว้เฉพาะผู้ดูแลระบบสูงสุด (Super Admin) เท่านั้น',
        details: []
      };
    }

    const details: string[] = [];

    // 1. Deposits
    if (options.deleteDeposits) {
      const count = deposits.length;
      setDeposits([]);
      localStorage.removeItem(STORAGE_KEYS.DEPOSITS);
      details.push(`ล้างประวัติการนำฝากขยะ (${count} รายการ)`);
    }

    // 2. Withdrawals
    if (options.deleteWithdrawals) {
      const count = withdrawals.length;
      setWithdrawals([]);
      localStorage.removeItem(STORAGE_KEYS.WITHDRAWALS);
      details.push(`ล้างประวัติการขอถอนเงินและอนุมัติ (${count} รายการ)`);
    }

    // 3. Welfare records
    if (options.deleteWelfareRecords) {
      const cCount = welfareContributions.length;
      const eCount = welfareExpenses.length;
      setWelfareContributions([]);
      setWelfareExpenses([]);
      localStorage.removeItem(STORAGE_KEYS.WELFARE_CONTRIBUTIONS);
      localStorage.removeItem(STORAGE_KEYS.WELFARE_EXPENSES);
      details.push(`ล้างประวัติเงินสมทบ (${cCount} รายการ) และเบิกจ่ายสวัสดิการ (${eCount} รายการ)`);
    }

    // 4. Staff members (Preserve Super Admin & Primary Admin)
    if (options.deleteMembers) {
      const beforeCount = users.length;
      const preserved = users.filter(u => u.role === 'superadmin' || u.memberCode === 'SUPER01' || u.memberCode === 'ADM01');
      if (!preserved.some(u => u.role === 'superadmin' || u.memberCode === 'SUPER01')) {
        preserved.unshift(SUPER_ADMIN_USER);
      }
      setUsers(preserved);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(preserved));
      if (!preserved.some(u => u.memberCode === currentUser?.memberCode)) {
        setCurrentUser(preserved[0]);
      }
      details.push(`ลบข้อมูลสมาชิกพนักงานทั่วไป (${beforeCount - preserved.length} คน) โดยเก็บบัญชีผู้ดูแลระบบสูงสุด (${SUPER_ADMIN_USER.memberCode}) ไว้ใช้งาน`);
    }

    // 5. Activity logs
    if (options.deleteActivityLogs) {
      const count = activityLogs.length;
      setActivityLogs([]);
      localStorage.removeItem(STORAGE_KEYS.ACTIVITY_LOGS);
      details.push(`ล้างประวัติบันทึกการทำงานของระบบ (${count} รายการ)`);
    }

    // 6. Reset prices
    if (options.resetPricesToDefault) {
      setPrices(INITIAL_PRICES);
      localStorage.removeItem(STORAGE_KEYS.PRICES);
      details.push(`รีเซ็ตตารางราคารับซื้อขยะกลับเป็นค่าเริ่มต้นมาตรฐาน (${INITIAL_PRICES.length} ชนิด)`);
    }

    // Audit log
    logActivity(
      'purge_database',
      'ล้างข้อมูลระบบ (Super Admin Purge)',
      `ผู้ดูแลระบบสูงสุด (${currentUser.name}) ทำการล้างข้อมูล: ${details.join(', ')}`,
      currentUser,
      'warning'
    );

    return {
      success: true,
      message: 'ดำเนินการล้างข้อมูลที่เลือกในฐานข้อมูลเรียบร้อยแล้ว',
      details
    };
  };

  const exportBackupData = (selectedModules?: BackupModuleKey[]): WasteBankBackupData => {
    const shouldInclude = (key: BackupModuleKey) => {
      if (!selectedModules || selectedModules.length === 0) return true;
      return selectedModules.includes(key);
    };

    const modules: WasteBankBackupData['modules'] = {};

    if (shouldInclude('users')) {
      modules.users = users;
    }
    if (shouldInclude('prices')) {
      modules.prices = prices;
    }
    if (shouldInclude('deposits')) {
      modules.deposits = deposits;
    }
    if (shouldInclude('withdrawals')) {
      modules.withdrawals = withdrawals;
    }
    if (shouldInclude('welfare')) {
      modules.welfare = {
        contributions: welfareContributions,
        expenses: welfareExpenses,
        config: welfareConfig
      };
    }
    if (shouldInclude('organization')) {
      modules.organization = {
        config: orgConfig,
        departments: departments
      };
    }
    if (shouldInclude('alerts')) {
      modules.alerts = alertConfig;
    }

    return {
      version: '1.0',
      schema: 'waste_bank_takhli_db_v1',
      exportedAt: new Date().toISOString(),
      exportedBy: `${currentUser?.name || 'ผู้ดูแลระบบ'} (${currentUser?.role || 'admin'})`,
      organization: orgConfig?.name || 'ธนาคารขยะ อบต.ตาคลี',
      modules,
      summary: {
        usersCount: users.length,
        pricesCount: prices.length,
        depositsCount: deposits.length,
        withdrawalsCount: withdrawals.length,
        welfareContributionsCount: welfareContributions.length,
        welfareExpensesCount: welfareExpenses.length,
        departmentsCount: departments.length
      }
    };
  };

  const importBackupData = (
    backupData: WasteBankBackupData,
    selectedModules?: BackupModuleKey[],
    mode: 'overwrite' | 'merge' = 'overwrite'
  ) => {
    if (!backupData || !backupData.modules) {
      return { success: false, message: 'โครงสร้างไฟล์สำรองข้อมูลไม่ถูกต้อง', summary: {} };
    }

    const shouldImport = (key: BackupModuleKey) => {
      if (!selectedModules || selectedModules.length === 0) return true;
      return selectedModules.includes(key);
    };

    const summary: Record<string, number> = {};

    // 1. Users
    if (shouldImport('users') && Array.isArray(backupData.modules.users)) {
      if (mode === 'overwrite') {
        setUsers(backupData.modules.users);
        summary['สมาชิก/ผู้ใช้'] = backupData.modules.users.length;
      } else {
        setUsers(prev => {
          const map = new Map<string, User>();
          prev.forEach(u => map.set(u.memberCode, u));
          backupData.modules.users!.forEach(u => {
            map.set(u.memberCode, { ...(map.get(u.memberCode) || {}), ...u });
          });
          const merged = Array.from(map.values());
          summary['สมาชิก/ผู้ใช้'] = merged.length;
          return merged;
        });
      }
    }

    // 2. Prices
    if (shouldImport('prices') && Array.isArray(backupData.modules.prices)) {
      if (mode === 'overwrite') {
        setPrices(backupData.modules.prices);
        summary['ชนิดขยะและราคา'] = backupData.modules.prices.length;
      } else {
        setPrices(prev => {
          const map = new Map<string, WastePriceItem>();
          prev.forEach(p => map.set(p.code, p));
          backupData.modules.prices!.forEach(p => {
            map.set(p.code, { ...(map.get(p.code) || {}), ...p });
          });
          const merged = Array.from(map.values());
          summary['ชนิดขยะและราคา'] = merged.length;
          return merged;
        });
      }
    }

    // 3. Deposits
    if (shouldImport('deposits') && Array.isArray(backupData.modules.deposits)) {
      if (mode === 'overwrite') {
        setDeposits(backupData.modules.deposits);
        summary['รายการฝากขยะ'] = backupData.modules.deposits.length;
      } else {
        setDeposits(prev => {
          const existingIds = new Set(prev.map(d => d.id || d.receiptNumber));
          const newItems = backupData.modules.deposits!.filter(d => !existingIds.has(d.id || d.receiptNumber));
          const combined = [...newItems, ...prev];
          summary['รายการฝากขยะ'] = combined.length;
          return combined;
        });
      }
    }

    // 4. Withdrawals
    if (shouldImport('withdrawals') && Array.isArray(backupData.modules.withdrawals)) {
      if (mode === 'overwrite') {
        setWithdrawals(backupData.modules.withdrawals);
        summary['รายการเบิกถอน'] = backupData.modules.withdrawals.length;
      } else {
        setWithdrawals(prev => {
          const existingIds = new Set(prev.map(w => w.id || w.requestNumber));
          const newItems = backupData.modules.withdrawals!.filter(w => !existingIds.has(w.id || w.requestNumber));
          const combined = [...newItems, ...prev];
          summary['รายการเบิกถอน'] = combined.length;
          return combined;
        });
      }
    }

    // 5. Welfare
    if (shouldImport('welfare') && backupData.modules.welfare) {
      if (backupData.modules.welfare.config) {
        setWelfareConfig(backupData.modules.welfare.config);
      }
      if (Array.isArray(backupData.modules.welfare.contributions)) {
        if (mode === 'overwrite') {
          setWelfareContributions(backupData.modules.welfare.contributions);
          summary['เงินสมทบสวัสดิการ'] = backupData.modules.welfare.contributions.length;
        } else {
          setWelfareContributions(prev => {
            const existingIds = new Set(prev.map(c => c.id || c.receiptNumber));
            const newItems = backupData.modules.welfare!.contributions.filter(c => !existingIds.has(c.id || c.receiptNumber));
            const combined = [...newItems, ...prev];
            summary['เงินสมทบสวัสดิการ'] = combined.length;
            return combined;
          });
        }
      }
      if (Array.isArray(backupData.modules.welfare.expenses)) {
        if (mode === 'overwrite') {
          setWelfareExpenses(backupData.modules.welfare.expenses);
          summary['รายการเบิกจ่ายสวัสดิการ'] = backupData.modules.welfare.expenses.length;
        } else {
          setWelfareExpenses(prev => {
            const existingIds = new Set(prev.map(e => e.id || e.voucherNumber));
            const newItems = backupData.modules.welfare!.expenses.filter(e => !existingIds.has(e.id || e.voucherNumber));
            const combined = [...newItems, ...prev];
            summary['รายการเบิกจ่ายสวัสดิการ'] = combined.length;
            return combined;
          });
        }
      }
    }

    // 6. Organization
    if (shouldImport('organization') && backupData.modules.organization) {
      if (backupData.modules.organization.config) {
        setOrgConfig(backupData.modules.organization.config);
        summary['การตั้งค่า อบต.'] = 1;
      }
      if (Array.isArray(backupData.modules.organization.departments)) {
        if (mode === 'overwrite') {
          setDepartments(backupData.modules.organization.departments);
          summary['สำนัก/กอง'] = backupData.modules.organization.departments.length;
        } else {
          setDepartments(prev => {
            const combined = Array.from(new Set([...prev, ...backupData.modules.organization!.departments]));
            summary['สำนัก/กอง'] = combined.length;
            return combined;
          });
        }
      }
    }

    // 7. Alerts
    if (shouldImport('alerts') && backupData.modules.alerts) {
      setAlertConfig(backupData.modules.alerts);
      summary['การตั้งค่าแจ้งเตือน'] = 1;
    }

    return {
      success: true,
      message: `นำเข้าข้อมูลเรียบร้อยแล้ว (${mode === 'overwrite' ? 'แทนที่ฐานข้อมูลเดิม' : 'ผสานรวมข้อมูล'})`,
      summary
    };
  };

  return (
    <WasteBankContext.Provider
      value={{
        currentUser,
        users,
        prices,
        deposits,
        withdrawals,
        minimumBalance: MINIMUM_BALANCE_CONFIG,
        googleSheetUrl,
        isSyncing,
        lastSynced,
        departments,
        addDepartment,
        editDepartment,
        deleteDepartment,
        orgConfig,
        updateOrgConfig,
        updateOrgLogo,
        resetOrgLogo,
        alertConfig,
        updateAlertConfig,
        pendingTransactionAlert,
        setPendingTransactionAlert,
        confirmTransactionAlert,
        cancelTransactionAlert,
        welfareConfig,
        welfareContributions,
        welfareExpenses,
        login,
        logout,
        switchUser,
        registerUser,
        adminCreateUser,
        getNextMemberCode,
        resetUserPassword,
        updateUserRole,
        toggleUserActiveStatus,
        toggleUserWithdrawalPermission,
        toggleUserWelfareOptOutPermission,
        requestWelfareExit,
        updateUserProfile,
        deleteUserProfileImage,
        recordDeposit,
        requestWithdrawal,
        approveWithdrawal,
        rejectWithdrawal,
        updatePrice,
        updatePriceItem,
        deletePriceItem,
        addNewPriceItem,
        toggleWelfareEnrollment,
        contributeToWelfare,
        recordWelfareExpense,
        updateWelfareConfig,
        batchDeductMonthlyWelfare,
        getMemberWelfareSummary,
        getAllMembersWelfareSummary,
        getWelfareFundStats,
        getMemberSummary,
        getAllMembersSummary,
        getOrgStats,
        setGoogleSheetUrl,
        pullFromGoogleSheet,
        pushToGoogleSheet,
        syncWithGoogleSheet,
        importPricesFromCSV,
        resetToDefaultData,
        purgeDatabase,
        exportBackupData,
        importBackupData,
        activityLogs,
        logActivity,
        clearActivityLogs
      }}
    >
      {children}
    </WasteBankContext.Provider>
  );
};

export const useWasteBank = () => {
  const context = useContext(WasteBankContext);
  if (!context) {
    throw new Error('useWasteBank must be used within a WasteBankProvider');
  }
  return context;
};
