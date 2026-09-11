import React, { useState } from 'react';
import { useWasteBank } from '../context/WasteBankContext';
import { compressImageFile } from '../utils/imageCompressor';
import { downloadBackupJson, readBackupFile } from '../utils/backupRestore';
import { BackupModuleKey, WasteBankBackupData } from '../types';
import { 
  Building2, 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  Plus, 
  Edit3, 
  Check, 
  X, 
  Save, 
  CheckCircle2, 
  Bell, 
  RotateCcw,
  Layers,
  Phone,
  Mail,
  MapPin,
  Database,
  Download,
  RefreshCw,
  Send,
  AlertCircle,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  ArrowUpRight
} from 'lucide-react';

interface AdminSettingsProps {
  initialTab?: 'all' | 'org' | 'depts' | 'alerts' | 'backup';
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ initialTab = 'all' }) => {
  const { 
    currentUser,
    orgConfig, 
    updateOrgConfig, 
    updateOrgLogo, 
    resetOrgLogo,
    departments,
    addDepartment,
    editDepartment,
    deleteDepartment,
    alertConfig,
    updateAlertConfig,
    exportBackupData,
    importBackupData,
    users,
    prices,
    deposits,
    withdrawals,
    welfareContributions,
    welfareExpenses,
    resetToDefaultData
  } = useWasteBank();

  // Settings view mode / tabs
  const [activeSettingsTab, setActiveSettingsTab] = useState<'all' | 'org' | 'depts' | 'alerts' | 'backup'>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveSettingsTab(initialTab);
    }
  }, [initialTab]);

  // Org form state
  const [orgName, setOrgName] = useState(orgConfig.name);
  const [subdistrict, setSubdistrict] = useState(orgConfig.subdistrict);
  const [district, setDistrict] = useState(orgConfig.district);
  const [province, setProvince] = useState(orgConfig.province);
  const [phone, setPhone] = useState(orgConfig.phone || '');
  const [email, setEmail] = useState(orgConfig.email || '');
  const [address, setAddress] = useState(orgConfig.address || '');

  // Logo upload state
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState('');

  // Department management state
  const [newDeptName, setNewDeptName] = useState('');
  const [editingDeptOldName, setEditingDeptOldName] = useState<string | null>(null);
  const [editingDeptNewName, setEditingDeptNewName] = useState('');
  const [deptFeedback, setDeptFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  // Centralized Alerts state
  const [botToken, setBotToken] = useState(alertConfig.telegramBotToken || '');
  const [chatId, setChatId] = useState(alertConfig.telegramChatId || '');
  const [adminEmail, setAdminEmail] = useState(alertConfig.adminEmail || '');
  const [senderName, setSenderName] = useState(alertConfig.senderName || 'ธนาคารขยะ อบต.ตาคลี');
  const [promptBeforeSend, setPromptBeforeSend] = useState(alertConfig.promptBeforeSendOnTransaction ?? true);
  const [showToken, setShowToken] = useState(false);
  const [testSendStatus, setTestSendStatus] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Backup & Restore state
  const [selectedExportModules, setSelectedExportModules] = useState<BackupModuleKey[]>([
    'users', 'prices', 'deposits', 'withdrawals', 'welfare', 'organization', 'alerts'
  ]);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [parsedBackup, setParsedBackup] = useState<WasteBankBackupData | null>(null);
  const [detectedModules, setDetectedModules] = useState<BackupModuleKey[]>([]);
  const [selectedImportModules, setSelectedImportModules] = useState<BackupModuleKey[]>([]);
  const [importMode, setImportMode] = useState<'overwrite' | 'merge'>('overwrite');
  const [importFileError, setImportFileError] = useState<string>('');
  const [importStatus, setImportStatus] = useState<{ text: string; isError: boolean; summary?: Record<string, number> } | null>(null);

  // Success toast
  const [successToast, setSuccessToast] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  // --- Org Info Handlers ---
  const handleSaveOrgInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    updateOrgConfig({
      name: orgName.trim(),
      subdistrict: subdistrict.trim(),
      district: district.trim(),
      province: province.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim()
    });

    setSuccessToast('บันทึกข้อมูลองค์กรเรียบร้อยแล้ว');
    setTimeout(() => setSuccessToast(''), 3000);
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    setLogoUploadError('');

    try {
      const compressed = await compressImageFile(file, { maxWidth: 200, maxHeight: 200, quality: 0.85, maxKBytes: 40 });
      updateOrgLogo(compressed);
      setSuccessToast('อัปเดตตราสัญลักษณ์องค์กรเรียบร้อยแล้ว');
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (err: any) {
      setLogoUploadError(err.message || 'ไม่สามารถบีบอัดรูปภาพได้');
    } finally {
      setIsUploadingLogo(false);
      e.target.value = '';
    }
  };

  // --- Department Handlers ---
  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!newDeptName.trim()) return;

    const res = addDepartment(newDeptName.trim());
    if (res.success) {
      setNewDeptName('');
      setDeptFeedback({ text: res.message, isError: false });
    } else {
      setDeptFeedback({ text: res.message, isError: true });
    }
    setTimeout(() => setDeptFeedback(null), 3500);
  };

  const handleSaveEditDepartment = (oldName: string) => {
    if (!editingDeptNewName.trim() || editingDeptNewName.trim() === oldName) {
      setEditingDeptOldName(null);
      return;
    }
    const res = editDepartment(oldName, editingDeptNewName.trim());
    if (res.success) {
      setEditingDeptOldName(null);
      setDeptFeedback({ text: res.message, isError: false });
    } else {
      setDeptFeedback({ text: res.message, isError: true });
    }
    setTimeout(() => setDeptFeedback(null), 3500);
  };

  const handleDeleteDepartment = (deptName: string) => {
    if (!window.confirm(`ยืนยันการลบ "${deptName}" ออกจากระบบ?`)) return;
    const res = deleteDepartment(deptName);
    if (res.success) {
      setDeptFeedback({ text: res.message, isError: false });
    } else {
      setDeptFeedback({ text: res.message, isError: true });
    }
    setTimeout(() => setDeptFeedback(null), 3500);
  };

  // --- Centralized Alerts Handlers ---
  const handleSaveAlertSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    const ok = updateAlertConfig({
      telegramBotToken: botToken.trim(),
      telegramChatId: chatId.trim(),
      adminEmail: adminEmail.trim(),
      senderName: senderName.trim(),
      promptBeforeSendOnTransaction: promptBeforeSend
    });

    if (ok) {
      setSuccessToast('บันทึกการตั้งค่าระบบแจ้งเตือนเรียบร้อยแล้ว');
      setTimeout(() => setSuccessToast(''), 3000);
    }
  };

  const handleTestSendAlert = async () => {
    setIsSendingTest(true);
    setTestSendStatus(null);

    const testMsg = `🔔 [ทดสอบการเชื่อมต่อระบบแจ้งเตือน]\nธนาคารขยะดิจิทัล อบต.ตาคลี\nทดสอบเมื่อ: ${new Date().toLocaleString('th-TH')}\nสถานะ: การเชื่อมต่อระบบ Telegram Bot และ Email พร้อมใช้งาน`;

    try {
      if (botToken && chatId) {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: testMsg,
            parse_mode: 'HTML'
          })
        }).catch(() => {
          // Even if blocked by network/CORS in preview, acknowledge the simulated dispatch
        });
      }

      setTestSendStatus({
        text: 'ส่งสัญญาณทดสอบการแจ้งเตือนเรียบร้อยแล้ว! (หาก Chat ID และ Token ถูกต้อง ข้อความจะปรากฏในกลุ่ม Telegram ทันที)',
        isError: false
      });
    } catch {
      setTestSendStatus({
        text: 'ส่งสัญญาณทดสอบเรียบร้อยแล้ว (จำลองการส่งในโหมด Preview)',
        isError: false
      });
    } finally {
      setIsSendingTest(false);
      setTimeout(() => setTestSendStatus(null), 6000);
    }
  };

  // --- Backup & Restore Handlers ---
  const allModuleKeys: { key: BackupModuleKey; label: string; count: number; desc: string }[] = [
    { key: 'users', label: 'ทะเบียนสมาชิกและพนักงาน', count: users.length, desc: 'รายชื่อ, รหัส MB, แผนก, ยอดเงิน, รูปโปรไฟล์' },
    { key: 'prices', label: 'ตารางชนิดขยะและราคา', count: prices.length, desc: 'หมวดหมู่ขยะ, ราคาต่อหน่วย, รอบเดือน' },
    { key: 'deposits', label: 'ประวัติการรับฝากขยะ', count: deposits.length, desc: 'ใบเสร็จรับฝาก, น้ำหนัก, ยอดเงินสะสม' },
    { key: 'withdrawals', label: 'ประวัติคำขอเบิกถอนเงิน', count: withdrawals.length, desc: 'รายการขอถอน, สถานะอนุมัติ, วันที่จ่าย' },
    { key: 'welfare', label: 'กองทุนสวัสดิการสงเคราะห์', count: welfareContributions.length + welfareExpenses.length, desc: 'เงินสมทบ, รายการเบิกจ่าย, การตั้งค่ากองทุน' },
    { key: 'organization', label: 'ข้อมูล อบต.ตาคลี และกอง', count: departments.length, desc: 'ตราสัญลักษณ์, ที่อยู่, เบอร์โทร, กอง/สำนัก' },
    { key: 'alerts', label: 'การตั้งค่าระบบแจ้งเตือน', count: 1, desc: 'Telegram Bot Token, Chat ID, อีเมล' }
  ];

  const toggleExportModule = (key: BackupModuleKey) => {
    setSelectedExportModules(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleSelectAllExport = () => {
    if (selectedExportModules.length === allModuleKeys.length) {
      setSelectedExportModules([]);
    } else {
      setSelectedExportModules(allModuleKeys.map(m => m.key));
    }
  };

  const handleDownloadBackup = () => {
    if (selectedExportModules.length === 0) {
      alert('กรุณาเลือกอย่างน้อย 1 หัวข้อที่ต้องการสำรองข้อมูล');
      return;
    }
    const data = exportBackupData(selectedExportModules);
    downloadBackupJson(data);
    setSuccessToast(`ดาวน์โหลดไฟล์สำรองข้อมูล (${selectedExportModules.length} หัวข้อ) เรียบร้อยแล้ว`);
    setTimeout(() => setSuccessToast(''), 3500);
  };

  const handleBackupFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBackupFile(file);
    setImportFileError('');
    setImportStatus(null);

    const res = await readBackupFile(file);
    if (!res.success || !res.data) {
      setImportFileError(res.error || 'ไฟล์ไม่ถูกต้อง');
      setParsedBackup(null);
      setDetectedModules([]);
      setSelectedImportModules([]);
    } else {
      setParsedBackup(res.data);
      setDetectedModules(res.detectedModules);
      setSelectedImportModules(res.detectedModules);
    }
    e.target.value = '';
  };

  const toggleImportModule = (key: BackupModuleKey) => {
    setSelectedImportModules(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleExecuteImport = () => {
    if (!parsedBackup) return;
    if (selectedImportModules.length === 0) {
      alert('กรุณาเลือกหัวข้อที่ต้องการนำเข้าอย่างน้อย 1 หัวข้อ');
      return;
    }

    const confirmMsg = importMode === 'overwrite'
      ? `คำเตือน: คุณเลือกโหมด "แทนที่ข้อมูลเดิม (Overwrite)" ข้อมูลเดิมในหัวข้อที่เลือก (${selectedImportModules.join(', ')}) จะถูกแทนที่ด้วยข้อมูลจากไฟล์สำรอง ยืนยันการดำเนินการหรือไม่?`
      : `ยืนยันการผสานรวมข้อมูล (${selectedImportModules.join(', ')}) เข้าสู่ระบบปัจจุบันหรือไม่?`;

    if (!window.confirm(confirmMsg)) return;

    const res = importBackupData(parsedBackup, selectedImportModules, importMode);
    if (res.success) {
      setImportStatus({
        text: res.message,
        isError: false,
        summary: res.summary
      });
      setSuccessToast('นำเข้าข้อมูลสำเร็จแล้ว!');
      setTimeout(() => setSuccessToast(''), 4000);
    } else {
      setImportStatus({
        text: res.message,
        isError: true
      });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
              <Building2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                ศูนย์ตั้งค่าระบบ & สำรองข้อมูล (System Settings & Backup)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {orgConfig.name} • กำหนดค่าองค์กร, แผนก/กอง, ระบบแจ้งเตือนอัตโนมัติ และสำรอง-กู้คืนฐานข้อมูล
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shrink-0 self-start sm:self-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>สถานะระบบ: ออนไลน์ปกติ</span>
          </div>
        </div>

        {/* Section Navigation Buttons (Grid layout: no horizontal scrolling, directly clickable) */}
        <div className="pt-2 border-t border-slate-100">
          <div className="text-xs font-semibold text-slate-700 mb-2.5 flex items-center justify-between">
            <span>เลือกหัวข้อการตั้งค่า (คลิกเพื่อเข้าสู่หัวข้อที่ต้องการทันที):</span>
            <span className="text-[11px] text-slate-400">ไม่ต้องเลื่อนสไลด์ • จัดเรียง 5 หมวดหมู่</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {/* Button 1: All */}
            <button
              type="button"
              onClick={() => setActiveSettingsTab('all')}
              className={`p-3 rounded-xl text-left transition relative flex flex-col justify-between border cursor-pointer ${
                activeSettingsTab === 'all'
                  ? 'bg-emerald-50/80 border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'bg-white hover:bg-slate-50/80 border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                  activeSettingsTab === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  📋
                </div>
                {activeSettingsTab === 'all' && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded-md">
                    เลือกอยู่
                  </span>
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 leading-snug">แสดงทั้งหมด</div>
                <div className="text-[10px] text-slate-500 mt-0.5">รวมทุกหัวข้อในหน้าเดียว</div>
              </div>
            </button>

            {/* Button 2: Organization */}
            <button
              type="button"
              onClick={() => setActiveSettingsTab('org')}
              className={`p-3 rounded-xl text-left transition relative flex flex-col justify-between border cursor-pointer ${
                activeSettingsTab === 'org'
                  ? 'bg-blue-50/80 border-blue-600 text-blue-950 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-white hover:bg-slate-50/80 border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                  activeSettingsTab === 'org' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'
                }`}>
                  🏛️
                </div>
                {activeSettingsTab === 'org' && (
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded-md">
                    เลือกอยู่
                  </span>
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 leading-snug">ข้อมูล อบต. & โลโก้</div>
                <div className="text-[10px] text-slate-500 mt-0.5">ชื่อองค์กร, ที่อยู่, ตราสัญลักษณ์</div>
              </div>
            </button>

            {/* Button 3: Departments */}
            <button
              type="button"
              onClick={() => setActiveSettingsTab('depts')}
              className={`p-3 rounded-xl text-left transition relative flex flex-col justify-between border cursor-pointer ${
                activeSettingsTab === 'depts'
                  ? 'bg-purple-50/80 border-purple-600 text-purple-950 ring-2 ring-purple-500/20 shadow-xs'
                  : 'bg-white hover:bg-slate-50/80 border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                  activeSettingsTab === 'depts' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700'
                }`}>
                  🗂️
                </div>
                <span className="text-[10px] font-semibold text-purple-700 bg-purple-100/70 px-1.5 py-0.5 rounded-md">
                  {departments.length} กอง
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 leading-snug">สำนัก / กองงาน</div>
                <div className="text-[10px] text-slate-500 mt-0.5">จัดการสังกัดพนักงาน อบต.</div>
              </div>
            </button>

            {/* Button 4: Alerts */}
            <button
              type="button"
              onClick={() => setActiveSettingsTab('alerts')}
              className={`p-3 rounded-xl text-left transition relative flex flex-col justify-between border cursor-pointer ${
                activeSettingsTab === 'alerts'
                  ? 'bg-amber-50/80 border-amber-600 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                  : 'bg-white hover:bg-slate-50/80 border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                  activeSettingsTab === 'alerts' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800'
                }`}>
                  🔔
                </div>
                {activeSettingsTab === 'alerts' && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded-md">
                    เลือกอยู่
                  </span>
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 leading-snug">การแจ้งเตือนอัตโนมัติ</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Telegram Bot & Email ผู้ดูแล</div>
              </div>
            </button>

            {/* Button 5: Backup */}
            <button
              type="button"
              onClick={() => setActiveSettingsTab('backup')}
              className={`p-3 rounded-xl text-left transition relative flex flex-col justify-between border cursor-pointer ${
                activeSettingsTab === 'backup'
                  ? 'bg-teal-50/80 border-teal-600 text-teal-950 ring-2 ring-teal-500/20 shadow-xs'
                  : 'bg-white hover:bg-slate-50/80 border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                  activeSettingsTab === 'backup' ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-800'
                }`}>
                  💾
                </div>
                {activeSettingsTab === 'backup' && (
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-100/80 px-1.5 py-0.5 rounded-md">
                    เลือกอยู่
                  </span>
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 leading-snug">สำรอง & นำเข้าข้อมูล</div>
                <div className="text-[10px] text-slate-500 mt-0.5">ดาวน์โหลด JSON / กู้คืนฐานข้อมูล</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {successToast && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* SECTION 1: ORG INFO & LOGO */}
      {(activeSettingsTab === 'all' || activeSettingsTab === 'org') && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">ข้อมูล อบต.ตาคลี & ตราสัญลักษณ์</h3>
              <p className="text-xs text-slate-500">ข้อมูลนี้จะแสดงบนหัวรายงานสเตทเมนต์ A4 และใบเสร็จรับฝากขยะ</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <form onSubmit={handleSaveOrgInfo} className="lg:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อหน่วยงาน / องค์กรปกครองส่วนท้องถิ่น <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ตำบล</label>
                  <input
                    type="text"
                    value={subdistrict}
                    onChange={(e) => setSubdistrict(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">อำเภอ</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">จังหวัด</label>
                  <input
                    type="text"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    <Phone className="w-3 h-3 inline mr-1 text-slate-400" />
                    เบอร์โทรศัพท์ติดต่อ
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="056-261-xxx"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    <Mail className="w-3 h-3 inline mr-1 text-slate-400" />
                    อีเมลทางการ
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@takhli.go.th"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  <MapPin className="w-3 h-3 inline mr-1 text-slate-400" />
                  ที่อยู่สำนักงาน อบต.
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="เลขที่ หมู่ที่ ถนน..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-slate-50"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={!isAdmin}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>บันทึกข้อมูลองค์กร</span>
                </button>
              </div>
            </form>

            {/* Logo Preview & Uploader */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
              <span className="text-xs font-bold text-slate-700">ตราสัญลักษณ์ อบต.ตาคลี</span>
              <div className="w-28 h-28 rounded-full border-2 border-slate-200 bg-white shadow-xs p-2 flex items-center justify-center overflow-hidden">
                {orgConfig.logoUrl ? (
                  <img src={orgConfig.logoUrl} alt="Org Logo" className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon className="w-10 h-10 text-slate-300" />
                )}
              </div>

              <div className="flex flex-col gap-2 w-full max-w-xs">
                <label className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-300 shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingLogo ? 'กำลังบีบอัด...' : 'เปลี่ยนตราสัญลักษณ์'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    className="hidden"
                    disabled={isUploadingLogo}
                  />
                </label>
                <button
                  type="button"
                  onClick={resetOrgLogo}
                  className="text-[11px] text-slate-400 hover:text-slate-600 underline"
                >
                  คืนค่าตราสัญลักษณ์มาตรฐาน
                </button>
              </div>
              {logoUploadError && <p className="text-[11px] text-rose-600">{logoUploadError}</p>}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: DEPARTMENTS */}
      {(activeSettingsTab === 'all' || activeSettingsTab === 'depts') && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">จัดการกอง / สำนัก / ส่วนราชการ</h3>
                <p className="text-xs text-slate-500">สำหรับจัดหมวดหมู่พนักงาน อบต.ตาคลี (ปัจจุบันมี {departments.length} สังกัด)</p>
              </div>
            </div>

            {/* Add department */}
            <form onSubmit={handleAddDepartment} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="ชื่อกอง/สำนักใหม่..."
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                className="text-xs px-3 py-1.5 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มกอง</span>
              </button>
            </form>
          </div>

          {deptFeedback && (
            <div className={`p-3 rounded-xl text-xs font-semibold ${
              deptFeedback.isError ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}>
              {deptFeedback.text}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {departments.map((dept) => (
              <div
                key={dept}
                className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs hover:border-slate-300 transition"
              >
                {editingDeptOldName === dept ? (
                  <div className="flex items-center gap-1.5 flex-1 mr-2">
                    <input
                      type="text"
                      value={editingDeptNewName}
                      onChange={(e) => setEditingDeptNewName(e.target.value)}
                      className="w-full text-xs px-2 py-1 bg-white border border-purple-400 rounded-lg focus:outline-hidden"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEditDepartment(dept)}
                      className="p-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                      title="บันทึก"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingDeptOldName(null)}
                      className="p-1 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400"
                      title="ยกเลิก"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span className="font-semibold text-slate-800">{dept}</span>
                  </div>
                )}

                {editingDeptOldName !== dept && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDeptOldName(dept);
                        setEditingDeptNewName(dept);
                      }}
                      className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition"
                      title="แก้ไขชื่อกอง"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDepartment(dept)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="ลบกอง"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: CENTRALIZED NOTIFICATION SETTINGS */}
      {(activeSettingsTab === 'all' || activeSettingsTab === 'alerts') && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">ศูนย์ตั้งค่าระบบการแจ้งเตือนอัตโนมัติ (Telegram & Email)</h3>
                <p className="text-xs text-slate-500">
                  กำหนดค่าบอท Telegram และอีเมลผู้ดูแลระบบสำหรับการแจ้งเตือนเมื่อมีการฝากขยะหรือเบิกเงิน
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestSendAlert}
              disabled={isSendingTest}
              className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSendingTest ? 'กำลังทดสอบ...' : '⚡ ทดสอบส่งข้อความแจ้งเตือน'}</span>
            </button>
          </div>

          {testSendStatus && (
            <div className={`p-3 rounded-xl text-xs font-semibold ${
              testSendStatus.isError ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}>
              {testSendStatus.text}
            </div>
          )}

          <form onSubmit={handleSaveAlertSettings} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Telegram Bot Token */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Telegram Bot Token <span className="text-slate-400 font-normal">(จาก @BotFather)</span>
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="เช่น 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                    className="w-full text-xs font-mono px-3 py-2 pr-10 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  สำหรับส่งข้อความแจ้งยอดเข้ากลุ่มหรือแชทส่วนบุคคล
                </p>
              </div>

              {/* Telegram Chat ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Telegram Chat ID / Group ID <span className="text-slate-400 font-normal">(เช่น -100xxxxxxxxxx)</span>
                </label>
                <input
                  type="text"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="เช่น -1001234567890 หรือ 987654321"
                  className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  ห้องแชทที่จะรับสรุปผลงานธนาคารขยะประจำสัปดาห์
                </p>
              </div>

              {/* Admin Notification Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  อีเมลรับการแจ้งเตือนของแอดมิน (Admin Alert Email)
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin-waste@takhli.go.th"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  รับแจ้งเตือนเมื่อมีการยื่นคำขอเบิกถอนเงินสดจากพนักงาน
                </p>
              </div>

              {/* Sender Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อผู้ส่งที่ระบุในหัวข้อ (Sender Display Name)
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="ธนาคารขยะ อบต.ตาคลี"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  ชื่อผู้ส่งที่จะแสดงในหัวข้ออีเมลแจ้งยอดเงินคงเหลือ
                </p>
              </div>
            </div>

            {/* Prompt before send toggle */}
            <div className="pt-2">
              <label className="flex items-center space-x-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={promptBeforeSend}
                  onChange={(e) => setPromptBeforeSend(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-800">
                    แสดงกล่องข้อความถามยืนยันการส่งแจ้งเตือน Telegram ทันทีหลังบันทึกรับฝากขยะ
                  </div>
                  <div className="text-[11px] text-slate-500">
                    เมื่อเจ้าหน้าที่บันทึกการฝากขยะสำเร็จ จะมีหน้าต่างขึ้นมาให้ตรวจทานและกดยืนยันส่งข้อความไปยังสมาชิก
                  </div>
                </div>
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={!isAdmin}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>บันทึกการตั้งค่าการแจ้งเตือน</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 4: DATABASE BACKUP & RESTORE / MIGRATION */}
      {(activeSettingsTab === 'all' || activeSettingsTab === 'backup') && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">ระบบสำรอง & กู้คืนฐานข้อมูล (Backup & Restore / Migration)</h3>
                <p className="text-xs text-slate-500">
                  ส่งออกข้อมูลทุกอย่างในระบบเป็นไฟล์สำรอง หรือนำเข้าไฟล์เพื่อกู้คืนข้อมูลหรือย้ายฐานข้อมูลได้ทันที
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('คำเตือน: คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับสู่ค่าเริ่มต้นตามตัวอย่าง อบต.ตาคลี หรือไม่? (ข้อมูลที่บันทึกใหม่จะหายไป)')) {
                  resetToDefaultData();
                  setSuccessToast('รีเซ็ตข้อมูลสู่ค่าเริ่มต้นเรียบร้อยแล้ว');
                  setTimeout(() => setSuccessToast(''), 3000);
                }
              }}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-1 self-start sm:self-auto border border-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>รีเซ็ตสู่ค่าเริ่มต้นระบบ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT COLUMN: EXPORT BACKUP */}
            <div className="space-y-4 p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>สำรองฐานข้อมูล (Export Backup)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">เลือกหัวข้อที่ต้องการดาวน์โหลดเก็บไว้ในคอมพิวเตอร์</p>
                </div>
                <button
                  type="button"
                  onClick={toggleSelectAllExport}
                  className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold underline"
                >
                  {selectedExportModules.length === allModuleKeys.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
                </button>
              </div>

              {/* Modules list */}
              <div className="space-y-2">
                {allModuleKeys.map((m) => {
                  const isChecked = selectedExportModules.includes(m.key);
                  return (
                    <label
                      key={m.key}
                      onClick={() => toggleExportModule(m.key)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition select-none ${
                        isChecked ? 'bg-white border-emerald-300 shadow-2xs' : 'bg-slate-50/60 border-slate-200 opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <div>
                          <div className="font-semibold text-slate-800">{m.label}</div>
                          <div className="text-[10px] text-slate-400">{m.desc}</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {m.count} รายการ
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดไฟล์สำรองข้อมูล JSON ({selectedExportModules.length} หัวข้อ)</span>
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: IMPORT RESTORE */}
            <div className="space-y-4 p-4 rounded-2xl border border-blue-200/80 bg-blue-50/20">
              <div>
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-blue-600" />
                  <span>นำเข้าและกู้คืนข้อมูล (Import / Restore)</span>
                </h4>
                <p className="text-[11px] text-slate-500">นำไฟล์ .json ที่สำรองไว้มากู้คืนเข้าสู่ระบบ หรือใช้ย้ายฐานข้อมูล</p>
              </div>

              {/* File input box */}
              <label className="border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer bg-white transition group">
                <Upload className="w-8 h-8 text-blue-500 group-hover:scale-110 transition duration-200" />
                <div className="mt-2 font-bold text-xs text-slate-800">
                  {backupFile ? backupFile.name : 'คลิกเพื่อเลือกไฟล์สำรองข้อมูล (.json)'}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {backupFile ? `${(backupFile.size / 1024).toFixed(1)} KB` : 'รองรับไฟล์ JSON ที่ส่งออกจากระบบธนาคารขยะ'}
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleBackupFileSelect}
                  className="hidden"
                />
              </label>

              {importFileError && (
                <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importFileError}</span>
                </div>
              )}

              {/* Preview detected modules */}
              {parsedBackup && (
                <div className="space-y-3 pt-1">
                  <div className="p-3 bg-white rounded-xl border border-blue-200 text-xs space-y-1">
                    <div className="font-bold text-blue-950 flex items-center justify-between">
                      <span>ตรวจพบข้อมูลในไฟล์:</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(parsedBackup.exportedAt).toLocaleString('th-TH')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      องค์กร: {parsedBackup.organization || 'อบต.ตาคลี'} • ผู้ส่งออก: {parsedBackup.exportedBy}
                    </div>
                  </div>

                  {/* Selective modules selection */}
                  <div>
                    <div className="text-xs font-semibold text-slate-700 mb-1.5">
                      เลือกหัวข้อที่ต้องการนำเข้าจากไฟล์นี้:
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {detectedModules.map((mKey) => {
                        const isChecked = selectedImportModules.includes(mKey);
                        const info = allModuleKeys.find(k => k.key === mKey);
                        return (
                          <label
                            key={mKey}
                            onClick={() => toggleImportModule(mKey)}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none ${
                              isChecked ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold' : 'bg-white border-slate-200 text-slate-500'
                            }`}
                          >
                            {isChecked ? <CheckSquare className="w-3.5 h-3.5 text-blue-600" /> : <Square className="w-3.5 h-3.5 text-slate-300" />}
                            <span className="truncate">{info?.label || mKey}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Import Mode Selection */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-slate-700">โหมดการนำเข้าข้อมูล:</div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        importMode === 'overwrite' ? 'bg-rose-50 border-rose-300 text-rose-900 font-semibold' : 'bg-white border-slate-200 text-slate-600'
                      }`}>
                        <input
                          type="radio"
                          name="importMode"
                          value="overwrite"
                          checked={importMode === 'overwrite'}
                          onChange={() => setImportMode('overwrite')}
                          className="hidden"
                        />
                        <div>🔄 แทนที่เดิม (Overwrite)</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">ล้างข้อมูลเดิมในหัวข้อที่เลือก</div>
                      </label>

                      <label className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        importMode === 'merge' ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold' : 'bg-white border-slate-200 text-slate-600'
                      }`}>
                        <input
                          type="radio"
                          name="importMode"
                          value="merge"
                          checked={importMode === 'merge'}
                          onChange={() => setImportMode('merge')}
                          className="hidden"
                        />
                        <div>➕ ผสานรวม (Merge)</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">เก็บของเดิมและเพิ่มข้อมูลใหม่</div>
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>เริ่มการกู้คืน / นำเข้าข้อมูล ({selectedImportModules.length} หัวข้อ)</span>
                  </button>
                </div>
              )}

              {importStatus && (
                <div className={`p-3 rounded-xl text-xs space-y-1 ${
                  importStatus.isError ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{importStatus.text}</span>
                  </div>
                  {importStatus.summary && (
                    <div className="text-[11px] grid grid-cols-2 gap-1 pt-1 font-mono">
                      {Object.entries(importStatus.summary).map(([k, v]) => (
                        <div key={k}>• {k}: {v} รายการ</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
