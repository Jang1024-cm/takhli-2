import React, { useState } from 'react';
import { useWasteBank } from '../context/WasteBankContext';
import { PurgeDatabaseOptions } from '../types';
import { 
  ShieldAlert, 
  Trash2, 
  AlertTriangle, 
  CheckSquare, 
  Square, 
  Download, 
  X, 
  CheckCircle2, 
  Lock, 
  Scale, 
  Coins, 
  HeartHandshake, 
  Users, 
  History, 
  Tag, 
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

interface PurgeDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PurgeDatabaseModal: React.FC<PurgeDatabaseModalProps> = ({
  isOpen,
  onClose
}) => {
  const { 
    currentUser, 
    deposits, 
    withdrawals, 
    welfareContributions, 
    welfareExpenses, 
    users, 
    prices, 
    activityLogs, 
    purgeDatabase,
    exportBackupData 
  } = useWasteBank();

  // Selection states
  const [options, setOptions] = useState<PurgeDatabaseOptions>({
    deleteDeposits: true,
    deleteWithdrawals: true,
    deleteWelfareRecords: true,
    deleteActivityLogs: false,
    deleteMembers: false,
    resetPricesToDefault: false
  });

  // Safeguard states
  const [confirmCheckbox, setConfirmCheckbox] = useState<boolean>(false);
  const [confirmInput, setConfirmInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [purgeResult, setPurgeResult] = useState<{
    success: boolean;
    message: string;
    details: string[];
  } | null>(null);

  if (!isOpen) return null;

  // Security barrier: only superadmin can see this modal
  if (currentUser?.role !== 'superadmin') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl border border-rose-200">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">ปฏิเสธการเข้าถึง (Access Denied)</h3>
          <p className="text-xs text-slate-600">
            ฟังก์ชันการล้างฐานข้อมูลระบบสงวนสิทธิ์เฉพาะผู้ดูแลระบบระดับสูง (Super Admin) เท่านั้น
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    );
  }

  const regularMembersCount = users.filter(u => u.role !== 'superadmin').length;

  const handleSelectAll = (select: boolean) => {
    setOptions({
      deleteDeposits: select,
      deleteWithdrawals: select,
      deleteWelfareRecords: select,
      deleteActivityLogs: select,
      deleteMembers: select,
      resetPricesToDefault: select
    });
  };

  const handleDownloadEmergencyBackup = () => {
    try {
      const data = exportBackupData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `waste-bank-backup-before-purge-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('ไม่สามารถดาวน์โหลดไฟล์สำรองได้: ' + e);
    }
  };

  const hasSelectedAny = Object.values(options).some(v => v === true);
  const isInputVerified = confirmInput.trim() === 'ลบข้อมูล' || confirmInput.trim().toUpperCase() === 'CONFIRM';
  const canSubmit = hasSelectedAny && confirmCheckbox && isInputVerified && !isProcessing;

  const handleExecutePurge = () => {
    if (!canSubmit) return;

    setIsProcessing(true);
    setTimeout(() => {
      const result = purgeDatabase(options);
      setPurgeResult(result);
      setIsProcessing(false);
    }, 400);
  };

  const handleCloseSuccess = () => {
    setPurgeResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-rose-300/80 max-w-2xl w-full overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/30 border border-rose-300/40 flex items-center justify-center text-rose-200 shrink-0 shadow-inner">
              <ShieldAlert className="w-5 h-5 text-rose-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold font-prompt leading-tight">
                  ศูนย์ล้างข้อมูลฐานข้อมูล (Database Purge)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/40 text-rose-100 border border-rose-300/30">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-xs text-rose-200/90 mt-0.5">
                องค์การบริหารส่วนตำบลตาคลี • ผู้ดูแลระบบสูงสุด: {currentUser.name} ({currentUser.memberCode})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {purgeResult ? (
          /* Completion State */
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                ล้างข้อมูลในฐานข้อมูลสำเร็จแล้ว
              </h3>
              <p className="text-xs text-slate-500">
                {purgeResult.message}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2">
              <div className="text-xs font-bold text-slate-700 mb-1">
                สรุปรายการที่ถูกจัดการ:
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {purgeResult.details.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-left flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900">
                <span className="font-bold">สถานะบัญชีผู้ดูแลระบบ:</span> บัญชีผู้ดูแลระบบสูงสุด (Super Admin: {currentUser.memberCode}) ได้รับการเก็บรักษาไว้เรียบร้อยแล้ว ท่านสามารถใช้งานและบริหารจัดการระบบได้ตามปกติทันที
              </div>
            </div>

            <button
              type="button"
              onClick={handleCloseSuccess}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              รับทราบและปิดหน้าต่าง
            </button>
          </div>
        ) : (
          /* Selection & Confirmation State */
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Warning & Emergency Backup Banner */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <span className="font-bold">ข้อควรระวังสำคัญ:</span> ข้อมูลที่เลือกจะถูกลบออกจากฐานข้อมูลของระบบทันที กรุณาตรวจสอบให้แน่ใจก่อนกดยืนยัน
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadEmergencyBackup}
                className="shrink-0 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>สำรอง JSON ไว้ก่อนลบ</span>
              </button>
            </div>

            {/* Select All Controls */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-slate-700">
                เลือกประเภทข้อมูลที่ต้องการล้าง:
              </span>
              <div className="flex items-center space-x-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  className="text-emerald-700 hover:text-emerald-800 font-semibold hover:underline cursor-pointer"
                >
                  เลือกทั้งหมด
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  className="text-slate-500 hover:text-slate-700 font-semibold hover:underline cursor-pointer"
                >
                  ยกเลิกทั้งหมด
                </button>
              </div>
            </div>

            {/* Options Checklist */}
            <div className="space-y-2.5">
              {/* Option 1: Deposits */}
              <label 
                className={`p-3.5 rounded-2xl border transition-all flex items-start space-x-3 cursor-pointer ${
                  options.deleteDeposits 
                    ? 'bg-rose-50/70 border-rose-300 shadow-2xs' 
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={options.deleteDeposits}
                  onChange={(e) => setOptions(prev => ({ ...prev, deleteDeposits: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-rose-600" />
                      <span>ประวัติรายการนำฝากขยะ (Deposits)</span>
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                      {deposits.length} รายการ
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ล้างประวัติใบเสร็จการชั่งขยะ ปริมาณน้ำหนัก และยอดเงินสะสมจากการฝากขยะทั้งหมด
                  </p>
                </div>
              </label>

              {/* Option 2: Withdrawals */}
              <label 
                className={`p-3.5 rounded-2xl border transition-all flex items-start space-x-3 cursor-pointer ${
                  options.deleteWithdrawals 
                    ? 'bg-rose-50/70 border-rose-300 shadow-2xs' 
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={options.deleteWithdrawals}
                  onChange={(e) => setOptions(prev => ({ ...prev, deleteWithdrawals: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-amber-600" />
                      <span>ประวัติการขอถอนเงิน (Withdrawals)</span>
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                      {withdrawals.length} รายการ
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ล้างรายการคำขอถอนเงิน ทั้งที่รออนุมัติ อนุมัติแล้ว และที่ถูกปฏิเสธทั้งหมด
                  </p>
                </div>
              </label>

              {/* Option 3: Welfare Records */}
              <label 
                className={`p-3.5 rounded-2xl border transition-all flex items-start space-x-3 cursor-pointer ${
                  options.deleteWelfareRecords 
                    ? 'bg-rose-50/70 border-rose-300 shadow-2xs' 
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={options.deleteWelfareRecords}
                  onChange={(e) => setOptions(prev => ({ ...prev, deleteWelfareRecords: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <HeartHandshake className="w-4 h-4 text-emerald-600" />
                      <span>ประวัติกองทุนสวัสดิการสงเคราะห์ (Welfare Records)</span>
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                      สมทบ {welfareContributions.length} / จ่าย {welfareExpenses.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ล้างประวัติการหักเงินสมทบรายเดือน และประวัติใบสำคัญจ่ายสวัสดิการทั้งหมด
                  </p>
                </div>
              </label>

              {/* Option 4: Members (Preserving Super Admin) */}
              <label 
                className={`p-3.5 rounded-2xl border transition-all flex items-start space-x-3 cursor-pointer ${
                  options.deleteMembers 
                    ? 'bg-rose-50/70 border-rose-300 shadow-2xs' 
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={options.deleteMembers}
                  onChange={(e) => setOptions(prev => ({ ...prev, deleteMembers: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span>รายชื่อสมาชิกพนักงานทั่วไป (Members)</span>
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                      {regularMembersCount} คน
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ลบข้อมูลสมาชิกพนักงานทั่วไปทั้งหมด
                  </p>
                  <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      <strong className="font-bold">ระบบจะคงบัญชีผู้ดูแลระบบสูงสุด (SUPER01) ไว้เสมอ:</strong> เพื่อให้ท่านมีสิทธิ์ล็อกอินและบริหารระบบต่อได้หลังการล้างข้อมูล
                    </span>
                  </div>
                </div>
              </label>

              {/* Option 5: Activity Logs */}
              <label 
                className={`p-3.5 rounded-2xl border transition-all flex items-start space-x-3 cursor-pointer ${
                  options.deleteActivityLogs 
                    ? 'bg-rose-50/70 border-rose-300 shadow-2xs' 
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={options.deleteActivityLogs}
                  onChange={(e) => setOptions(prev => ({ ...prev, deleteActivityLogs: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <History className="w-4 h-4 text-slate-600" />
                      <span>ประวัติกิจกรรมระบบ (Activity Audit Logs)</span>
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                      {activityLogs.length} รายการ
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ล้างประวัติการเข้าสู่ระบบ การทำรายการ และบันทึกประวัติความปลอดภัยทั้งหมด
                  </p>
                </div>
              </label>

              {/* Option 6: Reset Prices to default */}
              <label 
                className={`p-3.5 rounded-2xl border transition-all flex items-start space-x-3 cursor-pointer ${
                  options.resetPricesToDefault 
                    ? 'bg-rose-50/70 border-rose-300 shadow-2xs' 
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={options.resetPricesToDefault}
                  onChange={(e) => setOptions(prev => ({ ...prev, resetPricesToDefault: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-teal-600" />
                      <span>รีเซ็ตตารางราคารับซื้อขยะกลับสู่ค่าเริ่มต้นมาตรฐาน</span>
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                      {prices.length} ชนิด
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    รีเซ็ตราคารับซื้อขยะกลับไปเป็นราคากลางเริ่มต้นของ อบต.ตาคลี
                  </p>
                </div>
              </label>
            </div>

            {/* Double Confirmation Guard Box */}
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
              <div className="text-xs font-bold text-rose-900">
                🔒 ขั้นตอนยืนยันความปลอดภัย 2 ชั้น (Double Confirmation):
              </div>

              {/* Checkbox */}
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmCheckbox}
                  onChange={(e) => setConfirmCheckbox(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-rose-600 rounded border-rose-300 focus:ring-rose-500 cursor-pointer"
                />
                <span className="text-xs text-rose-900 leading-snug">
                  ข้าพเจ้ายืนยันว่าต้องการล้างข้อมูลที่เลือกไว้ข้างต้น และเข้าใจว่าข้อมูลที่ลบจะไม่สามารถกู้คืนได้
                </span>
              </label>

              {/* Text Match Input */}
              <div className="space-y-1 pt-1">
                <label className="block text-[11px] font-semibold text-rose-800">
                  กรุณาพิมพ์คำว่า <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-rose-300 text-rose-700 select-all">ลบข้อมูล</span> หรือ <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-rose-300 text-rose-700 select-all">CONFIRM</span> เพื่อยืนยัน:
                </label>
                <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder="พิมพ์ ลบข้อมูล เพื่อยืนยัน"
                  className="w-full text-xs px-3 py-2 bg-white border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-hidden font-medium text-slate-800"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={handleExecutePurge}
                disabled={!canSubmit}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {isProcessing ? 'กำลังล้างข้อมูล...' : 'ยืนยันการล้างข้อมูลที่เลือก'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
