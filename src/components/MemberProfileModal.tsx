import React, { useState, useEffect } from 'react';
import { useWasteBank } from '../context/WasteBankContext';
import { compressImageFile } from '../utils/imageCompressor';
import { User } from '../types';
import { 
  X, 
  Upload, 
  Trash2, 
  User as UserIcon, 
  CreditCard, 
  Mail, 
  Phone, 
  Building, 
  CheckCircle2, 
  Save, 
  AlertCircle,
  Camera,
  ShieldCheck,
  ShieldAlert,
  Banknote
} from 'lucide-react';

interface MemberProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: User | null;
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  isOpen,
  onClose,
  targetUser
}) => {
  const { 
    currentUser, 
    departments, 
    updateUserProfile, 
    deleteUserProfileImage 
  } = useWasteBank();

  // If targetUser is not specified, default to currentUser
  const user = targetUser || currentUser;

  const [name, setName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [canWithdraw, setCanWithdraw] = useState<boolean>(true);
  const [statusReason, setStatusReason] = useState<string>('');
  
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressMsg, setCompressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setNationalId(user.nationalId || '');
      setDepartment(user.department);
      setEmail(user.email);
      setPhone(user.phone || '');
      setAvatarUrl(user.avatarUrl);
      setIsActive(user.isActive !== false);
      setCanWithdraw(user.canWithdraw !== false);
      setStatusReason(user.statusReason || '');
      setCompressMsg('');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setCompressMsg('กำลังประมวลผลและบีบอัดรูปภาพ...');
    setErrorMsg('');

    try {
      const compressed = await compressImageFile(file, {
        maxWidth: 200,
        maxHeight: 200,
        quality: 0.8,
        maxKBytes: 35
      });
      setAvatarUrl(compressed);
      setCompressMsg('บีบอัดรูปภาพสำเร็จ (<35KB) พร้อมบันทึก');
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถประมวลผลรูปภาพได้');
      setCompressMsg('');
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const handleRemoveAvatar = () => {
    if (window.confirm('ต้องการลบรูปโปรไฟล์นี้ใช่หรือไม่?')) {
      setAvatarUrl(undefined);
      deleteUserProfileImage(user.memberCode);
      setCompressMsg('ลบรูปภาพแล้ว (จะใช้ไอคอนตัวอักษรแทน)');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanNationalId = nationalId.replace(/\D/g, '');
    if (cleanNationalId && cleanNationalId.length !== 13) {
      setErrorMsg('เลขประจำตัวประชาชนต้องมี 13 หลัก');
      return;
    }

    if (!name.trim()) {
      setErrorMsg('กรุณากรอกชื่อ-นามสกุล');
      return;
    }

    const profileData: Partial<User> = {
      name: name.trim(),
      nationalId: cleanNationalId || undefined,
      department: department || user.department,
      email: email.trim(),
      phone: phone.trim(),
      avatarUrl: avatarUrl
    };

    if (currentUser?.role === 'admin') {
      profileData.isActive = isActive;
      profileData.canWithdraw = canWithdraw;
      profileData.statusReason = statusReason.trim() || undefined;
    }

    const res = updateUserProfile(user.memberCode, profileData);

    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        id="member-profile-modal"
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-emerald-200" />
            <div>
              <h3 className="font-bold text-base">แก้ไขข้อมูลโปรไฟล์และรูปถ่ายสมาชิก</h3>
              <p className="text-[11px] text-emerald-100">
                รหัสสมาชิก: <span className="font-mono font-bold">{user.memberCode}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-emerald-200 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Avatar Upload Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
            <div className="relative shrink-0">
              {avatarUrl ? (
                <div className="relative group">
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500 shadow-md bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="absolute -top-1 -right-1 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-md transition"
                    title="ลบรูปภาพ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xl flex items-center justify-center border-2 border-emerald-200 shadow-inner">
                  {user.memberCode}
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <div className="font-semibold text-slate-800">รูปประจำตัวสมาชิก / พนักงาน</div>
              <p className="text-[11px] text-slate-500">
                สามารถถ่ายจากกล้องมือถือ หรือเลือกไฟล์ภาพจากคอมพิวเตอร์ ระบบจะบีบอัดลงฐานข้อมูล Google Sheets ให้อัตโนมัติ (ไม่เกิน 35KB)
              </p>
              <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isCompressing ? 'กำลังบีบอัด...' : 'เลือก/ถ่ายรูปใหม่'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    disabled={isCompressing}
                    className="hidden"
                  />
                </label>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium transition"
                  >
                    ลบรูปโปรไฟล์
                  </button>
                )}
              </div>
              {compressMsg && (
                <p className="text-[11px] text-emerald-700 font-medium">{compressMsg}</p>
              )}
            </div>
          </div>

          {/* User Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>ชื่อ - นามสกุล <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                required
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <span>เลขประจำตัวประชาชน 13 หลัก</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {nationalId.replace(/\D/g, '').length}/13
                </span>
              </label>
              <input
                type="text"
                maxLength={17}
                placeholder="เช่น 3-6001-00123-45-6"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <p className="text-[10px] text-slate-400">
                สามารถใช้เลข 13 หลักนี้สำหรับเข้าสู่ระบบธนาคารขยะได้ทันที
              </p>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>สังกัดกอง / ส่วนราชการ</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>เบอร์โทรศัพท์</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08X-XXX-XXXX"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>อีเมลสำหรับรับแจ้งเตือน</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                required
              />
            </div>
          </div>

          {/* Admin Permission Controls (สิทธิ์การเข้าใช้งาน & สิทธิ์การขอถอนเงิน) */}
          {currentUser?.role === 'admin' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>การเปิด/ปิดสิทธิ์การใช้งานของสมาชิก (ผู้ดูแลระบบ อบต.ตาคลี)</span>
                </span>
                <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 font-mono">
                  {user.memberCode}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Active Switch */}
                <div className={`p-3 rounded-xl border transition ${isActive ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-xs text-slate-800 flex items-center gap-1">
                      {isActive ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> : <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />}
                      <span>สิทธิ์เข้าใช้งานระบบ</span>
                    </span>
                    <button
                      type="button"
                      disabled={user.memberCode === currentUser.memberCode && isActive}
                      onClick={() => setIsActive(!isActive)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-hidden ${
                        isActive ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          isActive ? 'translate-x-4.5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {isActive ? '🟢 เปิดใช้งาน: เข้าสู่ระบบได้ปกติ' : '🔴 ระงับการใช้งาน: ไม่สามารถล็อกอินได้'}
                  </p>
                </div>

                {/* Withdraw Switch */}
                <div className={`p-3 rounded-xl border transition ${canWithdraw ? 'bg-emerald-50/70 border-emerald-200' : 'bg-amber-50/70 border-amber-200'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-xs text-slate-800 flex items-center gap-1">
                      <Banknote className={`w-3.5 h-3.5 ${canWithdraw ? 'text-emerald-600' : 'text-amber-600'}`} />
                      <span>สิทธิ์การขอถอนเงิน</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setCanWithdraw(!canWithdraw)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-hidden ${
                        canWithdraw ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          canWithdraw ? 'translate-x-4.5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {canWithdraw ? '🟢 อนุญาตให้ถอน: ส่งคำขอถอนเงินได้' : '🟠 ระงับสิทธิ์ถอน: ไม่อนุญาตให้ถอนเงิน'}
                  </p>
                </div>
              </div>

              {/* Reason input */}
              {(!isActive || !canWithdraw) && (
                <div className="pt-1">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    เหตุผล / หมายเหตุประกอบการระงับสิทธิ์ (จะแสดงให้สมาชิกทราบ):
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น เอกสารยังไม่ครบถ้วน, รอตรวจสอบข้อมูลส่วนบุคคล"
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium rounded-xl border border-slate-200 hover:bg-slate-50 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกข้อมูล</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
