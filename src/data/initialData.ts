import { 
  User, 
  WastePriceItem, 
  DepositRecord, 
  WithdrawalRecord, 
  WelfareConfig, 
  WelfareContributionRecord, 
  WelfareExpenseRecord,
  OrgConfig,
  AlertConfig,
  ActivityLog
} from '../types';

export const INITIAL_ORG_CONFIG: OrgConfig = {
  orgName: 'องค์การบริหารส่วนตำบลตาคลี',
  subTitle: 'ระบบจัดการขยะรีไซเคิลและบัญชีสวัสดิการดิจิทัล • อ.ตาคลี จ.นครสวรรค์',
  logoUrl: '', // ค่าว่างหมายถึงใช้สัญลักษณ์ตราสถิตเริ่มต้น อบต.ตาคลี
  address: 'เลขที่ 99 หมู่ 2 ต.ตาคลี อ.ตาคลี จ.นครสวรรค์ 60140',
  contactPhone: '056-261-123'
};

export const INITIAL_ALERT_CONFIG: AlertConfig = {
  telegramBotToken: '7123456789:AAF_takhli_waste_bank_bot',
  telegramChatId: '-1001928374652 (กลุ่ม อบต.ตาคลี)',
  telegramGroupEnabled: true,
  emailSenderName: 'ธนาคารขยะ อบต.ตาคลี (กองสาธารณสุข)',
  emailSenderAddress: 'wastebank@takhli.go.th',
  emailSmtpHost: 'smtp.takhli.go.th:587 (SSL/TLS)',
  emailNotifyEnabled: true,
  promptBeforeSendOnTransaction: true,
  autoAlertOnDeposit: true,
  autoAlertOnWithdrawal: true,
  autoAlertOnWelfare: true
};

export const INITIAL_PRICES: WastePriceItem[] = [
  {
    code: 'P001',
    category: 'กระดาษ',
    subType: 'กระดาษ A4 / ขาว-ดำ',
    currentPrice: 4.50,
    effectiveMonth: 'กันยายน 2026',
    unit: 'กก.',
    color: '#3b82f6'
  },
  {
    code: 'P002',
    category: 'กระดาษ',
    subType: 'กล่องลังกระดาษ',
    currentPrice: 3.00,
    effectiveMonth: 'กันยายน 2026',
    unit: 'กก.',
    color: '#60a5fa'
  },
  {
    code: 'PL01',
    category: 'พลาสติก',
    subType: 'ขวดพลาสติกใส (PET)',
    currentPrice: 8.00,
    effectiveMonth: 'กันยายน 2026',
    unit: 'กก.',
    color: '#10b981'
  },
  {
    code: 'PL02',
    category: 'พลาสติก',
    subType: 'ขวดพลาสติกขุ่น (HDPE)',
    currentPrice: 5.00,
    effectiveMonth: 'กันยายน 2026',
    unit: 'กก.',
    color: '#34d399'
  },
  {
    code: 'M001',
    category: 'โลหะ',
    subType: 'กระป๋องอลูมิเนียม',
    currentPrice: 35.00,
    effectiveMonth: 'กันยายน 2026',
    unit: 'กก.',
    color: '#f59e0b'
  },
  {
    code: 'M002',
    category: 'โลหะ',
    subType: 'เศษเหล็ก / สังกะสี',
    currentPrice: 6.00,
    effectiveMonth: 'กันยายน 2026',
    unit: 'กก.',
    color: '#d97706'
  },
  {
    code: 'G001',
    category: 'แก้ว',
    subType: 'ขวดแก้วใส / สีชา',
    currentPrice: 1.50,
    effectiveMonth: 'กันยายน 2026',
    unit: 'กก.',
    color: '#8b5cf6'
  }
];

export const DEPARTMENTS = [
  'สำนักปลัด อบต.ตาคลี',
  'กองคลัง',
  'กองช่าง',
  'กองสาธารณสุขและสิ่งแวดล้อม',
  'กองการศึกษา ศาสนาและวัฒนธรรม',
  'งานป้องกันและบรรเทาสาธารณภัย'
];

const SAMPLE_NAMES = [
  { name: 'คุณสมชาย ใจดี', dept: 'สำนักปลัด อบต.ตาคลี', phone: '081-234-5678', email: 'somchai.j@office.com' },
  { name: 'คุณวิภา ร่ำรวย', dept: 'กองคลัง', phone: '089-876-5432', email: 'wipha.r@office.com' },
  { name: 'คุณสมศรี มีสุข', dept: 'กองการศึกษา ศาสนาและวัฒนธรรม', phone: '086-555-1234', email: 'somsri.m@office.com' },
  { name: 'นายประสิทธิ์ ช่างดี', dept: 'กองช่าง', phone: '084-333-7890', email: 'prasit.c@office.com' },
  { name: 'น.ส.กานดา รักสิ่งแวดล้อม', dept: 'กองสาธารณสุขและสิ่งแวดล้อม', phone: '082-999-4455', email: 'kanda.e@office.com' },
  { name: 'จ.ส.อ.ธวัชชัย ระวังภัย', dept: 'งานป้องกันและบรรเทาสาธารณภัย', phone: '083-444-9988', email: 'thawatchai.d@office.com' },
  { name: 'นางมาลี บัญชีทรัพย์', dept: 'กองคลัง', phone: '085-777-6655', email: 'malee.b@office.com' },
  { name: 'นายอนุชา พัฒนาตำบล', dept: 'สำนักปลัด อบต.ตาคลี', phone: '087-111-2233', email: 'anucha.p@office.com' }
];

const THAI_FIRSTNAMES = [
  'กิตติ', 'นภา', 'ธีระ', 'สุภาภรณ์', 'พิชัย', 'วรรณา', 'สุนิสา', 'วีระ', 'พัชรี',
  'ประเสริฐ', 'ศิริพร', 'สมศักดิ์', 'อารียา', 'อรรถพล', 'ดวงใจ', 'ปรีชา', 'จงรัก',
  'ทวีศักดิ์', 'ยุพิน', 'ชัชวาล', 'ศิริชัย', 'รุ่งทิวา', 'อำนาจ', 'ชลธิชา', 'พงษ์ศักดิ์',
  'สุรชัย', 'พรทิพย์', 'เกรียงไกร', 'ศิริรัตน์', 'ณัฐวุฒิ', 'ดารณี', 'อัครเดช', 'วิลาวัลย์'
];

const THAI_SURNAMES = [
  'มั่นคง', 'เจริญผล', 'บริสุทธิ์', 'สดใส', 'ยอดเยี่ยม', 'ทองดี', 'วงศ์สวัสดิ์', 'ชื่นชม',
  'บุญชู', 'แก้วตา', 'เกตุคง', 'รักษ์ตาคลี', 'สมบูรณ์', 'พูลทรัพย์', 'ประเสริฐยิ่ง', 'ศรีสุข',
  'วัฒนศักดิ์', 'บุญเรือง', 'ใจบุญ', 'พานิชย์เจริญ', 'คงกะพัน', 'ทองธรรมชาติ'
];

function generate150StaffMembers(): User[] {
  const staff: User[] = [
    {
      id: 'u-admin',
      memberCode: 'ADM01',
      name: 'นายชาญชัย รักษ์ตาคลี (ผู้ดูแลระบบ)',
      email: 'admin@takhli.go.th',
      department: 'กองสาธารณสุขและสิ่งแวดล้อม',
      role: 'admin',
      joinedDate: '01/01/2026',
      phone: '056-261-123',
      password: 'password123',
      nationalId: '1600100000000',
      welfareEnrolled: true,
      welfareAutoDeduct: true
    }
  ];

  for (let i = 1; i <= 150; i++) {
    const code = `MB${String(i).padStart(3, '0')}`;
    const sample = SAMPLE_NAMES[i - 1];

    if (sample) {
      staff.push({
        id: `u-${String(i).padStart(3, '0')}`,
        memberCode: code,
        name: sample.name,
        email: sample.email,
        department: sample.dept,
        role: 'member',
        joinedDate: '15/01/2026',
        phone: sample.phone,
        password: 'password123',
        nationalId: `16001${String(i).padStart(8, '0')}`,
        welfareEnrolled: i !== 4, // MB004 opted out initially
        welfareAutoDeduct: i % 2 !== 0
      });
    } else {
      const fn = THAI_FIRSTNAMES[(i - 1) % THAI_FIRSTNAMES.length];
      const ln = THAI_SURNAMES[(i - 1) % THAI_SURNAMES.length];
      const dept = DEPARTMENTS[(i - 1) % DEPARTMENTS.length];
      const prefix = (i % 2 === 0) ? 'นางสาว' : 'นาย';

      staff.push({
        id: `u-${String(i).padStart(3, '0')}`,
        memberCode: code,
        name: `${prefix}${fn} ${ln}`,
        email: `staff${i}@takhli.go.th`,
        department: dept,
        role: 'member',
        joinedDate: `${String((i % 28) + 1).padStart(2, '0')}/02/2026`,
        phone: `08${(i % 9) + 1}-${String(100 + i).padStart(3, '0')}-${String(1000 + i).padStart(4, '0')}`,
        password: 'password123',
        nationalId: `16001${String(i).padStart(8, '0')}`,
        welfareEnrolled: i % 5 !== 0, // roughly 80% enrolled
        welfareAutoDeduct: i % 3 === 0
      });
    }
  }

  return staff;
}

export const INITIAL_USERS: User[] = generate150StaffMembers();

export const INITIAL_DEPOSITS: DepositRecord[] = [
  {
    id: 'dep-101',
    receiptNumber: 'RCP-20260909-001',
    date: '09/09/2026',
    timestamp: new Date('2026-09-09T08:15:00').getTime(),
    memberCode: 'MB001',
    memberName: 'คุณสมชาย ใจดี',
    wasteCode: 'PL01',
    category: 'พลาสติก',
    subType: 'ขวดพลาสติกใส (PET)',
    weight: 5.5,
    unitPrice: 8.00,
    totalAmount: 44.00,
    recordedBy: 'จนท.กองสาธารณสุข',
    note: 'ขวดแกะฉลาก ล้างสะอาด บีบแบนเรียบร้อย'
  },
  {
    id: 'dep-102',
    receiptNumber: 'RCP-20260909-002',
    date: '09/09/2026',
    timestamp: new Date('2026-09-09T08:25:00').getTime(),
    memberCode: 'MB001',
    memberName: 'คุณสมชาย ใจดี',
    wasteCode: 'M001',
    category: 'โลหะ',
    subType: 'กระป๋องอลูมิเนียม',
    weight: 2.0,
    unitPrice: 35.00,
    totalAmount: 70.00,
    recordedBy: 'จนท.กองสาธารณสุข',
    note: 'กระป๋องเครื่องดื่มอัดแบน'
  },
  {
    id: 'dep-103',
    receiptNumber: 'RCP-20260909-003',
    date: '09/09/2026',
    timestamp: new Date('2026-09-09T08:40:00').getTime(),
    memberCode: 'MB002',
    memberName: 'คุณวิภา ร่ำรวย',
    wasteCode: 'P002',
    category: 'กระดาษ',
    subType: 'กล่องลังกระดาษ',
    weight: 50.0,
    unitPrice: 3.00,
    totalAmount: 150.00,
    recordedBy: 'จนท.กองสาธารณสุข',
    note: 'กล่องพัสดุและลังเอกสารมัดเชือก'
  },
  {
    id: 'dep-104',
    receiptNumber: 'RCP-20260909-004',
    date: '09/09/2026',
    timestamp: new Date('2026-09-09T09:10:00').getTime(),
    memberCode: 'MB002',
    memberName: 'คุณวิภา ร่ำรวย',
    wasteCode: 'PL01',
    category: 'พลาสติก',
    subType: 'ขวดพลาสติกใส (PET)',
    weight: 8.0,
    unitPrice: 8.00,
    totalAmount: 64.00,
    recordedBy: 'จนท.กองสาธารณสุข',
    note: 'ขวดน้ำดื่มขนาด 1.5L'
  },
  {
    id: 'dep-105',
    receiptNumber: 'RCP-20260909-005',
    date: '09/09/2026',
    timestamp: new Date('2026-09-09T09:30:00').getTime(),
    memberCode: 'MB003',
    memberName: 'คุณสมศรี มีสุข',
    wasteCode: 'M001',
    category: 'โลหะ',
    subType: 'กระป๋องอลูมิเนียม',
    weight: 3.0,
    unitPrice: 35.00,
    totalAmount: 105.00,
    recordedBy: 'จนท.กองสาธารณสุข',
    note: 'กระป๋องกาแฟและน้ำอัดลม'
  },
  {
    id: 'dep-106',
    receiptNumber: 'RCP-20260908-001',
    date: '08/09/2026',
    timestamp: new Date('2026-09-08T10:00:00').getTime(),
    memberCode: 'MB004',
    memberName: 'นายประสิทธิ์ ช่างดี',
    wasteCode: 'M002',
    category: 'โลหะ',
    subType: 'เศษเหล็ก / สังกะสี',
    weight: 15.0,
    unitPrice: 6.00,
    totalAmount: 90.00,
    recordedBy: 'จนท.กองสาธารณสุข',
    note: 'เศษท่อเหล็กและสังกะสีเก่าจากงานซ่อม'
  },
  {
    id: 'dep-107',
    receiptNumber: 'RCP-20260908-002',
    date: '08/09/2026',
    timestamp: new Date('2026-09-08T11:15:00').getTime(),
    memberCode: 'MB005',
    memberName: 'น.ส.กานดา รักสิ่งแวดล้อม',
    wasteCode: 'P001',
    category: 'กระดาษ',
    subType: 'กระดาษ A4 / ขาว-ดำ',
    weight: 20.0,
    unitPrice: 4.50,
    totalAmount: 90.00,
    recordedBy: 'จนท.กองสาธารณสุข',
    note: 'กระดาษรียูสและเอกสารทำลายหมดอายุ'
  },
  {
    id: 'dep-108',
    receiptNumber: 'RCP-20260908-003',
    date: '08/09/2026',
    timestamp: new Date('2026-09-08T14:00:00').getTime(),
    memberCode: 'MB005',
    memberName: 'น.ส.กานดา รักสิ่งแวดล้อม',
    wasteCode: 'G001',
    category: 'แก้ว',
    subType: 'ขวดแก้วใส / สีชา',
    weight: 12.0,
    unitPrice: 1.50,
    totalAmount: 18.00,
    recordedBy: 'จนท.กองสาธารณสุข',
    note: 'ขวดเครื่องดื่มชูกำลังสีชา'
  }
];

export const INITIAL_WITHDRAWALS: WithdrawalRecord[] = [
  {
    id: 'wdr-001',
    requestNumber: 'WDR-20260909-001',
    date: '09/09/2026',
    timestamp: new Date('2026-09-09T10:15:00').getTime(),
    memberCode: 'MB003',
    memberName: 'คุณสมศรี มีสุข',
    amount: 70.00,
    status: 'approved',
    processedDate: '09/09/2026 10:30',
    processedBy: 'นายชาญชัย รักษ์ตาคลี',
    note: 'ถอนเงินสดสวัสดิการเข้ากระเป๋า'
  },
  {
    id: 'wdr-002',
    requestNumber: 'WDR-20260909-002',
    date: '09/09/2026',
    timestamp: new Date('2026-09-09T11:00:00').getTime(),
    memberCode: 'MB002',
    memberName: 'คุณวิภา ร่ำรวย',
    amount: 100.00,
    status: 'pending',
    note: 'คำขอถอนเงินสดประจำสัปดาห์ (รอแอดมินอนุมัติ)'
  }
];

export const MINIMUM_BALANCE_CONFIG = 50.00; // บาท

export const INITIAL_WELFARE_CONFIG: WelfareConfig = {
  monthlyContributionAmount: 50.00, // อัตราเงินสมทบสวัสดิการสงเคราะห์ 50 บาท/เดือน
  requiredWasteSalesThreshold: 50.00, // ต้องขายขยะหรือนำเงินมาฝากอย่างน้อย 50 บาท/เดือน จึงจะพอหักยอดสวัสดิการ
  currentMonth: 'กันยายน 2026',
  benefitCoverageDetails: {
    funeralAssistance: 3000, // เงินช่วยเหลือฌาปนกิจสงเคราะห์
    medicalAssistance: 1000, // เงินช่วยเหลือค่ารักษาพยาบาล/เจ็บป่วย
    childbirthAssistance: 1500, // เงินขวัญถุงคลอดบุตร
    scholarshipAssistance: 1000 // ทุนการศึกษาบุตรพนักงาน
  }
};

export const INITIAL_WELFARE_CONTRIBUTIONS: WelfareContributionRecord[] = [
  {
    id: 'wf-c-001',
    receiptNumber: 'WFC-20260901-001',
    date: '01/09/2026',
    timestamp: new Date('2026-09-01T09:00:00').getTime(),
    memberCode: 'MB001',
    memberName: 'คุณสมชาย ใจดี',
    amount: 50.00,
    source: 'waste_deposit',
    month: 'กันยายน 2026',
    note: 'หักสมทบอัตโนมัติจากยอดขายขยะรีไซเคิลรอบต้นเดือน',
    recordedBy: 'ระบบอัตโนมัติ'
  },
  {
    id: 'wf-c-002',
    receiptNumber: 'WFC-20260903-002',
    date: '03/09/2026',
    timestamp: new Date('2026-09-03T10:30:00').getTime(),
    memberCode: 'MB003',
    memberName: 'คุณสมศรี มีสุข',
    amount: 50.00,
    source: 'cash_topup',
    month: 'กันยายน 2026',
    note: 'นำเงินสดมาฝากสมทบกองทุนสวัสดิการ ณ กองคลัง อบต.ตาคลี',
    recordedBy: 'จนท.กองคลัง'
  },
  {
    id: 'wf-c-003',
    receiptNumber: 'WFC-20260905-003',
    date: '05/09/2026',
    timestamp: new Date('2026-09-05T14:15:00').getTime(),
    memberCode: 'MB005',
    memberName: 'น.ส.กานดา รักสิ่งแวดล้อม',
    amount: 50.00,
    source: 'waste_deposit',
    month: 'กันยายน 2026',
    note: 'หักจากเงินขายกระดาษ A4 เข้ากองทุนสวัสดิการ',
    recordedBy: 'ระบบอัตโนมัติ'
  },
  {
    id: 'wf-c-004',
    receiptNumber: 'WFC-20260906-004',
    date: '06/09/2026',
    timestamp: new Date('2026-09-06T11:00:00').getTime(),
    memberCode: 'MB002',
    memberName: 'คุณวิภา ร่ำรวย',
    amount: 30.00,
    source: 'waste_deposit',
    month: 'กันยายน 2026',
    note: 'สมทบเงินจากการขายขวดแก้ว (ยังขาดอีก 20 บาทเพื่อให้พอหักรอบเดือนนี้)',
    recordedBy: 'ระบบอัตโนมัติ'
  }
];

export const INITIAL_WELFARE_EXPENSES: WelfareExpenseRecord[] = [
  {
    id: 'wf-exp-001',
    voucherNumber: 'WFE-202609-001',
    date: '03/09/2026',
    timestamp: new Date('2026-09-03T15:00:00').getTime(),
    title: 'เงินช่วยเหลือฌาปนกิจสงเคราะห์ (บิดาสมาชิกเสียชีวิต)',
    category: 'ฌาปนกิจสงเคราะห์',
    amount: 3000.00,
    recipientName: 'นายพงษ์ศักดิ์ ขยันงาน (ครอบครัวสมาชิก)',
    recipientMemberCode: 'MB007',
    approvedBy: 'นายก อบต.ตาคลี',
    month: 'กันยายน 2026',
    note: 'อนุมัติตามระเบียบกองทุนสวัสดิการสงเคราะห์พนักงาน ข้อ 12'
  },
  {
    id: 'wf-exp-002',
    voucherNumber: 'WFE-202609-002',
    date: '06/09/2026',
    timestamp: new Date('2026-09-06T16:30:00').getTime(),
    title: 'เงินช่วยเหลือสวัสดิการนอนพักรักษาตัวในโรงพยาบาลตาคลี',
    category: 'รักษาพยาบาล/เจ็บป่วย',
    amount: 1000.00,
    recipientName: 'คุณวิภา ร่ำรวย',
    recipientMemberCode: 'MB002',
    approvedBy: 'ปลัด อบต.ตาคลี',
    month: 'กันยายน 2026',
    note: 'ใบรับรองแพทย์ รพ.ตาคลี นอนพักรักษาตัว 3 คืน'
  }
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'log-001',
    timestamp: new Date('2026-09-09T08:15:20').getTime(),
    dateTimeStr: '09/09/2026 08:15:20 น.',
    memberCode: 'MB001',
    memberName: 'คุณสมชาย ใจดี',
    role: 'member',
    department: 'สำนักปลัด อบต.ตาคลี',
    action: 'login',
    actionTitle: 'เข้าสู่ระบบ',
    details: 'เข้าสู่ระบบสำเร็จผ่านระบบยืนยันตัวตนสมาชิก',
    ipAddress: '192.168.1.45 (เครือข่ายภายใน อบต.)',
    device: 'Chrome on Windows 11',
    status: 'success'
  },
  {
    id: 'log-002',
    timestamp: new Date('2026-09-09T08:20:00').getTime(),
    dateTimeStr: '09/09/2026 08:20:00 น.',
    memberCode: 'MB001',
    memberName: 'คุณสมชาย ใจดี',
    role: 'member',
    department: 'สำนักปลัด อบต.ตาคลี',
    action: 'deposit_waste',
    actionTitle: 'บันทึกนำฝากขยะรีไซเคิล',
    details: 'นำฝากขวดพลาสติกใส (PET) 5.00 กก. เป็นเงิน 40.00 บาท (รหัส: dep-101)',
    ipAddress: '192.168.1.45 (เครือข่ายภายใน อบต.)',
    device: 'Chrome on Windows 11',
    status: 'success'
  },
  {
    id: 'log-003',
    timestamp: new Date('2026-09-09T08:26:00').getTime(),
    dateTimeStr: '09/09/2026 08:26:00 น.',
    memberCode: 'MB001',
    memberName: 'คุณสมชาย ใจดี',
    role: 'member',
    department: 'สำนักปลัด อบต.ตาคลี',
    action: 'deposit_waste',
    actionTitle: 'บันทึกนำฝากขยะรีไซเคิล',
    details: 'นำฝากกระป๋องอลูมิเนียม 2.00 กก. เป็นเงิน 70.00 บาท (รหัส: dep-102)',
    ipAddress: '192.168.1.45 (เครือข่ายภายใน อบต.)',
    device: 'Chrome on Windows 11',
    status: 'success'
  },
  {
    id: 'log-004',
    timestamp: new Date('2026-09-09T08:35:10').getTime(),
    dateTimeStr: '09/09/2026 08:35:10 น.',
    memberCode: 'MB001',
    memberName: 'คุณสมชาย ใจดี',
    role: 'member',
    department: 'สำนักปลัด อบต.ตาคลี',
    action: 'print_document',
    actionTitle: 'พิมพ์เอกสารทางการ A4',
    details: 'พิมพ์ใบชั่งน้ำหนักขยะรีไซเคิล (ใบเสร็จเลขที่: RCP-20260909-001)',
    ipAddress: '192.168.1.45 (เครือข่ายภายใน อบต.)',
    device: 'Chrome on Windows 11',
    status: 'success'
  },
  {
    id: 'log-005',
    timestamp: new Date('2026-09-09T08:38:00').getTime(),
    dateTimeStr: '09/09/2026 08:38:00 น.',
    memberCode: 'MB002',
    memberName: 'คุณวิภา ร่ำรวย',
    role: 'member',
    department: 'กองคลัง',
    action: 'login',
    actionTitle: 'เข้าสู่ระบบ',
    details: 'เข้าสู่ระบบสำเร็จผ่านระบบยืนยันตัวตนสมาชิก',
    ipAddress: '192.168.1.52 (เครือข่ายภายใน อบต.)',
    device: 'Edge on Windows 10',
    status: 'success'
  },
  {
    id: 'log-006',
    timestamp: new Date('2026-09-09T08:42:00').getTime(),
    dateTimeStr: '09/09/2026 08:42:00 น.',
    memberCode: 'MB002',
    memberName: 'คุณวิภา ร่ำรวย',
    role: 'member',
    department: 'กองคลัง',
    action: 'deposit_waste',
    actionTitle: 'บันทึกนำฝากขยะรีไซเคิล',
    details: 'นำฝากกล่องลังกระดาษ 50.00 กก. เป็นเงิน 150.00 บาท (รหัส: dep-103)',
    ipAddress: '192.168.1.52 (เครือข่ายภายใน อบต.)',
    device: 'Edge on Windows 10',
    status: 'success'
  },
  {
    id: 'log-007',
    timestamp: new Date('2026-09-09T08:45:00').getTime(),
    dateTimeStr: '09/09/2026 08:45:00 น.',
    memberCode: 'MB002',
    memberName: 'คุณวิภา ร่ำรวย',
    role: 'member',
    department: 'กองคลัง',
    action: 'print_document',
    actionTitle: 'พิมพ์เอกสารทางการ A4',
    details: 'พิมพ์ใบเสร็จรับเงินขายขยะประจำเดือนพร้อมยอดเงินคงเหลือ',
    ipAddress: '192.168.1.52 (เครือข่ายภายใน อบต.)',
    device: 'Edge on Windows 10',
    status: 'success'
  },
  {
    id: 'log-008',
    timestamp: new Date('2026-09-09T09:00:00').getTime(),
    dateTimeStr: '09/09/2026 09:00:00 น.',
    memberCode: 'ADM01',
    memberName: 'นายชาญชัย รักษ์ตาคลี (ผู้ดูแลระบบ)',
    role: 'admin',
    department: 'กองสาธารณสุขและสิ่งแวดล้อม',
    action: 'login',
    actionTitle: 'เข้าสู่ระบบ (ผู้ดูแลระบบ)',
    details: 'เข้าสู่ระบบสำเร็จในฐานะเจ้าหน้าที่ผู้ดูแลระบบ',
    ipAddress: '192.168.1.10 (สถานีจัดการขยะกลาง)',
    device: 'Chrome on Windows 11',
    status: 'success'
  },
  {
    id: 'log-009',
    timestamp: new Date('2026-09-09T09:05:00').getTime(),
    dateTimeStr: '09/09/2026 09:05:00 น.',
    memberCode: 'ADM01',
    memberName: 'นายชาญชัย รักษ์ตาคลี (ผู้ดูแลระบบ)',
    role: 'admin',
    department: 'กองสาธารณสุขและสิ่งแวดล้อม',
    action: 'withdraw_approve',
    actionTitle: 'อนุมัติการขอถอนเงินสด',
    details: 'อนุมัติคำขอถอนเงินสดของ คุณสมชาย ใจดี (MB001) จำนวน 30.00 บาท',
    ipAddress: '192.168.1.10 (สถานีจัดการขยะกลาง)',
    device: 'Chrome on Windows 11',
    status: 'success'
  }
];


