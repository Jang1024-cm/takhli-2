export type UserRole = 'superadmin' | 'admin' | 'finance' | 'member';

export interface PurgeDatabaseOptions {
  deleteDeposits: boolean;
  deleteWithdrawals: boolean;
  deleteWelfareRecords: boolean;
  deleteActivityLogs: boolean;
  deleteMembers: boolean;
  resetPricesToDefault: boolean;
}

export type WasteCategory = 'กระดาษ' | 'พลาสติก' | 'โลหะ' | 'แก้ว';

export interface User {
  id: string;
  memberCode: string; // e.g. MB001
  name: string;
  email: string;
  department: string;
  role: UserRole;
  joinedDate: string;
  phone?: string;
  password?: string;
  nationalId?: string; // เลขบัตรประจำตัวประชาชน 13 หลัก
  avatarUrl?: string; // Compressed Base64 Data URL หรือ URL รูปภาพ
  welfareEnrolled?: boolean;
  welfareAutoDeduct?: boolean;
  isActive?: boolean; // สิทธิ์การเข้าใช้งานระบบ (เปิด/ปิดใช้งาน)
  canWithdraw?: boolean; // สิทธิ์การขอถอนเงิน (เปิด/ปิดสิทธิ์ถอนเงิน)
  statusReason?: string; // หมายเหตุ/เหตุผลประกอบสถานะสิทธิ์
  canOptOutWelfare?: boolean; // สิทธิ์อนุญาตให้ลาออกจากกองทุนสวัสดิการสงเคราะห์ (ต้องได้รับอนุญาตจากแอดมินก่อน)
  welfareResignationRequested?: boolean; // สมาชิกยื่นคำร้องขอลาออกจากกองทุนสวัสดิการแล้ว
  welfareResignationReason?: string; // เหตุผลขอยื่นคำร้องลาออก
  welfareResignationDate?: string; // วันที่ยื่นคำร้องขอลาออก
  welfareTotalContributed?: number;
}

export interface AlertConfig {
  telegramBotToken: string;
  telegramChatId: string; // e.g. -1001928374652 (กลุ่ม อบต.ตาคลี)
  telegramGroupEnabled: boolean;
  emailSenderName: string;
  emailSenderAddress: string;
  emailSmtpHost: string;
  emailNotifyEnabled: boolean;
  promptBeforeSendOnTransaction: boolean; // ป็อปอัปถามยืนยันก่อนส่งแจ้งเตือนเมื่อทำรายการ
  autoAlertOnDeposit: boolean;
  autoAlertOnWithdrawal: boolean;
  autoAlertOnWelfare: boolean;
  adminEmail?: string;
  senderName?: string;
}

export interface OrgConfig {
  orgName: string; // "องค์การบริหารส่วนตำบลตาคลี"
  subTitle: string;
  logoUrl: string; // โลโก้หน่วยงาน (Base64 หรือ SVG)
  address: string;
  contactPhone: string;
  name?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  phone?: string;
  email?: string;
}

export interface TransactionAlertPrompt {
  id: string;
  type: 'deposit' | 'withdrawal' | 'welfare';
  title: string;
  memberCode: string;
  memberName: string;
  department: string;
  details: { label: string; value: string }[];
  telegramPreview: string;
  emailPreview: { subject: string; body: string };
  onConfirm: (channels: { telegram: boolean; email: boolean }) => void;
  onCancel: () => void;
}

export type WelfareContributionSource = 'waste_deposit' | 'cash_topup' | 'waste_balance_deduct';

export type WelfareExpenseCategory = 
  | 'ฌาปนกิจสงเคราะห์' 
  | 'รักษาพยาบาล/เจ็บป่วย' 
  | 'คลอดบุตร' 
  | 'ทุนการศึกษาบุตร' 
  | 'ภัยพิบัติฉุกเฉิน' 
  | 'สวัสดิการทั่วไป';

export interface WelfareContributionRecord {
  id: string;
  receiptNumber: string;
  date: string; // e.g. "09/09/2026"
  timestamp: number;
  memberCode: string;
  memberName: string;
  amount: number;
  source: WelfareContributionSource;
  month: string; // e.g. "กันยายน 2026"
  note?: string;
  recordedBy?: string;
}

export interface WelfareExpenseRecord {
  id: string;
  voucherNumber: string;
  date: string; // e.g. "05/09/2026"
  timestamp: number;
  title: string;
  category: WelfareExpenseCategory;
  amount: number;
  recipientName: string;
  recipientMemberCode?: string;
  approvedBy: string;
  month: string; // e.g. "กันยายน 2026"
  note?: string;
}

export interface WelfareConfig {
  monthlyContributionAmount: number; // e.g. 50.00 THB/month
  requiredWasteSalesThreshold: number; // e.g. 50.00 THB/month
  currentMonth: string; // e.g. "กันยายน 2026"
  benefitCoverageDetails: {
    funeralAssistance: number;
    medicalAssistance: number;
    childbirthAssistance: number;
    scholarshipAssistance: number;
  };
}

export interface MemberWelfareSummary {
  memberCode: string;
  memberName: string;
  department: string;
  isEnrolled: boolean;
  enrolledDate?: string;
  autoDeduct: boolean;
  currentMonthContributed: number;
  currentMonthWasteSales: number;
  totalLifetimeContributed: number;
  monthlyTarget: number;
  remainingShortfall: number; // monthlyTarget - (currentMonthContributed)
  isTargetMet: boolean; // currentMonthContributed >= monthlyTarget
  canCoverFromWasteBalance: boolean;
  wasteBalanceAvailable: number;
  contributionCount: number;
}

export interface WastePriceItem {
  code: string; // e.g. P001, PL01, M001, G001
  category: WasteCategory;
  subType: string;
  currentPrice: number; // บาท / กก.
  effectiveMonth: string; // e.g. "กันยายน 2026"
  unit: string; // "กก."
  color: string;
  pointsPerKg?: number;
}

export interface DepositRecord {
  id: string;
  receiptNumber: string;
  date: string; // e.g. "09/09/2026"
  timestamp: number;
  memberCode: string;
  memberName: string;
  wasteCode: string;
  category: WasteCategory;
  subType: string;
  weight: number; // กิโลกรัม
  unitPrice: number; // บาท / กิโลกรัม
  totalAmount: number; // น้ำหนัก x ราคา
  recordedBy: string;
  note?: string;
  // Compatibility & convenience aliases
  weightKg?: number;
  totalPrice?: number;
  welfareContributed?: number;
}

export interface WithdrawalRecord {
  id: string;
  requestNumber: string;
  date: string;
  timestamp: number;
  memberCode: string;
  memberName: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  processedDate?: string;
  processedBy?: string;
  note?: string;
  accountNumber?: string;
}

export interface MemberAccountSummary {
  memberCode: string;
  memberName: string;
  department: string;
  totalDepositAmount: number;
  totalWithdrawalApproved: number;
  totalWithdrawalPending: number;
  currentBalance: number;
  totalWeightKg: number;
  totalWeight?: number; // fallback alias for backward compatibility
  isBelowMinimum: boolean; // < 50 THB
  canWithdraw: boolean; // currentBalance >= 50 && (currentBalance - 50) > 0
  maxWithdrawable: number; // currentBalance - 50
  depositCount: number;
  withdrawalCount: number;
}

export type BackupModuleKey = 
  | 'users'
  | 'prices'
  | 'deposits'
  | 'withdrawals'
  | 'welfare'
  | 'organization'
  | 'alerts';

export interface BackupModuleInfo {
  key: BackupModuleKey;
  label: string;
  description: string;
  count: number;
  iconName: string;
}

export interface ScheduledEmailReport {
  id: string;
  reportType: 'executive_summary_a4';
  title: string;
  recipients: { name: string; email: string; role: string }[];
  dataStartDate: string;
  dataEndDate: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  frequency: 'once' | 'monthly' | 'weekly' | 'scheduled';
  status: 'scheduled' | 'sent';
  lastSentAt?: string;
  createdAt: string;
  createdBy: string;
}

export interface WasteBankBackupData {
  version: string;
  schema: string;
  exportedAt: string;
  exportedBy: string;
  organization: string;
  modules: {
    users?: User[];
    prices?: WastePriceItem[];
    deposits?: DepositRecord[];
    withdrawals?: WithdrawalRecord[];
    welfare?: {
      contributions: WelfareContributionRecord[];
      expenses: WelfareExpenseRecord[];
      config: WelfareConfig;
    };
    organization?: {
      config: OrgConfig;
      departments: string[];
    };
    alerts?: AlertConfig;
    activityLogs?: ActivityLog[];
  };
  summary: {
    usersCount?: number;
    pricesCount?: number;
    depositsCount?: number;
    withdrawalsCount?: number;
    welfareContributionsCount?: number;
    welfareExpensesCount?: number;
    departmentsCount?: number;
    activityLogsCount?: number;
  };
}

export type ActivityLogAction = 
  | 'login' 
  | 'logout' 
  | 'deposit_waste' 
  | 'withdraw_request' 
  | 'withdraw_approve' 
  | 'withdraw_reject' 
  | 'welfare_contribute' 
  | 'welfare_expense' 
  | 'print_document' 
  | 'profile_update' 
  | 'user_status_change'
  | 'role_change'
  | 'update_user'
  | 'price_update'
  | 'system_sync'
  | 'backup_action'
  | 'purge_database';

export interface ActivityLog {
  id: string;
  timestamp: number;
  dateTimeStr: string; // e.g. "11/09/2026 10:15:30 น."
  memberCode: string;
  memberName: string;
  role: UserRole;
  department: string;
  action: ActivityLogAction;
  actionTitle: string; // e.g. "เข้าสู่ระบบ", "บันทึกนำฝากขยะ", "พิมพ์ใบเสร็จรับเงิน A4"
  details: string; // คำอธิบายรายละเอียด
  ipAddress?: string; // เครือข่าย/IP Address
  device?: string; // เบราว์เซอร์/อุปกรณ์
  status?: 'success' | 'warning' | 'error';
}


