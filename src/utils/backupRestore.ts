import { WasteBankBackupData, BackupModuleKey, User, MemberAccountSummary } from '../types';

/**
 * Downloads data as an Excel-friendly CSV with UTF-8 BOM (\uFEFF)
 * so that Thai characters render correctly without encoding problems in Microsoft Excel.
 */
export const downloadCsvForExcel = (csvContent: string, filename: string) => {
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Converts members list with account summaries to CSV formatted string
 */
export const exportMembersToCsv = (
  users: User[],
  getMemberSummary: (memberCode: string) => MemberAccountSummary
): string => {
  const headers = [
    'ลำดับ',
    'รหัสสมาชิก',
    'ชื่อ-นามสกุล',
    'สังกัด/กอง',
    'เลขประจำตัวประชาชน',
    'อีเมล',
    'เบอร์โทรศัพท์',
    'ยอดเงินคงเหลือ (บาท)',
    'น้ำหนักขยะสะสม (กก.)',
    'จำนวนครั้งที่นำฝาก',
    'จำนวนครั้งที่เบิกถอน',
    'สถานะบัญชี',
    'สิทธิ์การใช้งานระบบ',
    'สิทธิ์การขอถอนเงิน',
    'สมาชิกกองทุนสวัสดิการ',
    'ระดับสิทธิ์',
    'วันที่เริ่มเข้าโครงการ'
  ];

  const rows = users.map((u, idx) => {
    const s = getMemberSummary(u.memberCode);
    const idFormatted = u.nationalId ? `="${u.nationalId}"` : '-';
    const statusText = s.isBelowMinimum ? 'ต่ำกว่าขั้นต่ำ 50 บาท' : 'ปกติ';
    const accessText = u.isActive === false ? 'ระงับสิทธิ์ใช้งาน' : 'เปิดใช้งาน';
    const withdrawText = u.canWithdraw === false ? 'ระงับสิทธิ์ถอน' : 'อนุญาตให้ถอนเงิน';
    const welfareText = u.welfareEnrolled ? 'เข้าร่วมกองทุน' : 'ไม่ได้เข้าร่วม';
    const roleText = u.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'สมาชิกพนักงาน (Member)';

    return [
      idx + 1,
      `="${u.memberCode}"`,
      `"${(u.name || '').replace(/"/g, '""')}"`,
      `"${(u.department || '').replace(/"/g, '""')}"`,
      idFormatted,
      `"${(u.email || '').replace(/"/g, '""')}"`,
      `"${(u.phone || '').replace(/"/g, '""')}"`,
      s.currentBalance.toFixed(2),
      (s.totalWeightKg ?? s.totalWeight ?? 0).toFixed(2),
      s.depositCount,
      s.withdrawalCount,
      `"${statusText}"`,
      `"${accessText}"`,
      `"${withdrawText}"`,
      `"${welfareText}"`,
      `"${roleText}"`,
      `"${u.joinedDate || '-'}"`
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
};

/**
 * Downloads a backup JSON file to the user's computer
 */
export const downloadBackupJson = (backupData: WasteBankBackupData, customFilename?: string) => {
  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const filename = customFilename || `wastebank_takhli_backup_${dateStr}.json`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Reads and parses a backup JSON file, with schema validation
 */
export const readBackupFile = (file: File): Promise<{
  success: boolean;
  data?: WasteBankBackupData;
  error?: string;
  detectedModules: BackupModuleKey[];
}> => {
  return new Promise((resolve) => {
    if (!file.name.toLowerCase().endsWith('.json')) {
      resolve({
        success: false,
        error: 'กรุณาเลือกไฟล์สำรองข้อมูลนามสกุล .json เท่านั้น',
        detectedModules: []
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text) as WasteBankBackupData;

        if (!parsed || typeof parsed !== 'object' || !parsed.modules) {
          resolve({
            success: false,
            error: 'โครงสร้างไฟล์ไม่ถูกต้อง หรือไม่ใช่ไฟล์สำรองข้อมูลของระบบธนาคารขยะ',
            detectedModules: []
          });
          return;
        }

        const detectedModules: BackupModuleKey[] = [];
        if (Array.isArray(parsed.modules.users) && parsed.modules.users.length > 0) detectedModules.push('users');
        if (Array.isArray(parsed.modules.prices) && parsed.modules.prices.length > 0) detectedModules.push('prices');
        if (Array.isArray(parsed.modules.deposits) && parsed.modules.deposits.length > 0) detectedModules.push('deposits');
        if (Array.isArray(parsed.modules.withdrawals) && parsed.modules.withdrawals.length > 0) detectedModules.push('withdrawals');
        if (parsed.modules.welfare && (parsed.modules.welfare.config || parsed.modules.welfare.contributions || parsed.modules.welfare.expenses)) detectedModules.push('welfare');
        if (parsed.modules.organization && (parsed.modules.organization.config || parsed.modules.organization.departments)) detectedModules.push('organization');
        if (parsed.modules.alerts) detectedModules.push('alerts');

        resolve({
          success: true,
          data: parsed,
          detectedModules
        });
      } catch (err: any) {
        resolve({
          success: false,
          error: `เกิดข้อผิดพลาดในการอ่านไฟล์: ${err.message || 'ไฟล์ JSON เสียหายหรือไม่ถูกต้อง'}`,
          detectedModules: []
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        error: 'ไม่สามารถเปิดอ่านไฟล์ที่ระบุได้',
        detectedModules: []
      });
    };

    reader.readAsText(file);
  });
};
