import React, { useState } from 'react';
import { useWasteBank } from '../context/WasteBankContext';
import { compressImageFile } from '../utils/imageCompressor';
import { 
  LogIn, 
  UserPlus, 
  KeyRound, 
  Shield, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  Trash2, 
  CreditCard, 
  Camera,
  User as UserIcon 
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { login, registerUser, departments } = useWasteBank();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);

  // Login form state (National ID, Email, or Member Code)
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Register form state
  const [regName, setRegName] = useState<string>('');
  const [regNationalId, setRegNationalId] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regDept, setRegDept] = useState<string>(departments[0] || 'สำนักปลัด อบต.');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('password123');
  const [regAvatarUrl, setRegAvatarUrl] = useState<string>('');
  const [isCompressingAvatar, setIsCompressingAvatar] = useState<boolean>(false);
  const [avatarError, setAvatarError] = useState<string>('');
  const [regMsg, setRegMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotMsg, setForgotMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = login(identifier, password);
    if (res.success) {
      onClose();
    } else {
      setLoginError(res.message);
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingAvatar(true);
    setAvatarError('');

    try {
      const compressed = await compressImageFile(file, {
        maxWidth: 160,
        maxHeight: 160,
        quality: 0.8,
        maxKBytes: 35
      });
      setRegAvatarUrl(compressed);
    } catch (err: any) {
      setAvatarError(err.message || 'ไม่สามารถบีบอัดรูปภาพได้');
    } finally {
      setIsCompressingAvatar(false);
      e.target.value = '';
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegMsg(null);

    const cleanId = regNationalId.replace(/\D/g, '');
    if (cleanId.length !== 13) {
      setRegMsg({ text: 'กรุณากรอกเลขประจำตัวประชาชนให้ครบ 13 หลัก', isError: true });
      return;
    }

    if (!regName || !regEmail || !regDept || !regPassword) {
      setRegMsg({ text: 'กรุณากรอกข้อมูลให้ครบถ้วนทุกช่องที่มีเครื่องหมายดอกจัน (*)', isError: true });
      return;
    }

    const res = registerUser(
      regName, 
      regEmail, 
      regDept, 
      regPassword, 
      regPhone,
      cleanId,
      regAvatarUrl || undefined
    );

    if (res.success) {
      setRegMsg({ text: res.message, isError: false });
      setTimeout(() => {
        onClose();
      }, 1800);
    } else {
      setRegMsg({ text: res.message, isError: true });
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotMsg(`ระบบได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปยัง ${forgotEmail} แล้ว`);
    setTimeout(() => {
      setForgotMsg('');
      setMode('login');
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        id="auth-modal"
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            {mode === 'login' && <LogIn className="w-5 h-5 text-emerald-200" />}
            {mode === 'register' && <UserPlus className="w-5 h-5 text-emerald-200" />}
            {mode === 'forgot' && <KeyRound className="w-5 h-5 text-emerald-200" />}
            <h3 className="font-bold text-base">
              {mode === 'login' && 'เข้าสู่ระบบธนาคารขยะ อบต.ตาคลี'}
              {mode === 'register' && 'ลงทะเบียนสมาชิกใหม่ (พร้อมบัตร ปชช. & รูปถ่าย)'}
              {mode === 'forgot' && 'กู้คืนรหัสผ่าน'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-emerald-200 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-3 text-center border-b-2 transition ${
              mode === 'login' ? 'border-emerald-600 text-emerald-800 bg-white font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            เข้าสู่ระบบ
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-3 text-center border-b-2 transition ${
              mode === 'register' ? 'border-emerald-600 text-emerald-800 bg-white font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            สมัครสมาชิกใหม่
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Mode: LOGIN */}
          {mode === 'login' && (
            <div className="space-y-4">
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เลขประจำตัวประชาชน (13 หลัก), รหัสสมาชิก หรือ อีเมล
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="เช่น 3600100123456 หรือ MB001 หรือ email"
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    * สามารถล็อกอินด้วยเลขบัตรประชาชน 13 หลักของพนักงานได้ทันที
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      รหัสผ่าน
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] text-emerald-600 hover:underline"
                    >
                      ลืมรหัสผ่าน?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="รหัสผ่าน"
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
                    required
                  />
                </div>

                {loginError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  id="btn-login-submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  เข้าสู่ระบบ
                </button>
              </form>
            </div>
          )}

          {/* Mode: REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Profile Image Upload & Compression Section */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                <div className="relative">
                  {regAvatarUrl ? (
                    <div className="relative group">
                      <img
                        src={regAvatarUrl}
                        alt="Profile Preview"
                        className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setRegAvatarUrl('')}
                        className="absolute -top-1 -right-1 p-1 bg-rose-600 text-white rounded-full shadow-md hover:bg-rose-700 transition"
                        title="ลบรูปภาพ"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200">
                      <UserIcon className="w-7 h-7 text-emerald-600" />
                    </div>
                  )}
                </div>

                <div className="flex-1 text-xs">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                    <span>รูปโปรไฟล์พนักงาน</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ดึงจากกล้องมือถือหรือคอมฯ (บีบอัดลง Sheet อัตโนมัติ &lt;35KB)
                  </p>
                  <label className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 text-[11px] font-medium cursor-pointer shadow-2xs mt-1.5">
                    <Upload className="w-3 h-3 text-slate-500" />
                    <span>{isCompressingAvatar ? 'กำลังบีบอัด...' : 'เลือกรูปถ่าย'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      disabled={isCompressingAvatar}
                      className="hidden"
                    />
                  </label>
                  {avatarError && (
                    <p className="text-[10px] text-rose-600 mt-0.5">{avatarError}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อ - นามสกุล <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น นายรักดี มั่นคง"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>เลขประจำตัวประชาชน 13 หลัก <span className="text-rose-500">*</span></span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {regNationalId.replace(/\D/g, '').length}/13
                  </span>
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    maxLength={17}
                    placeholder="เช่น 3-6001-00123-45-6"
                    value={regNationalId}
                    onChange={(e) => setRegNationalId(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  ใช้สำหรับอ้างอิงสถานะพนักงานและเข้าสู่ระบบ
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  อีเมลหน่วยงาน / อีเมลส่วนตัว <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="rakdee.m@takhli.go.th"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  สังกัดกอง / ส่วนงาน อบต.ตาคลี <span className="text-rose-500">*</span>
                </label>
                <select
                  value={regDept}
                  onChange={(e) => setRegDept(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เบอร์โทรศัพท์ติดต่อ
                </label>
                <input
                  type="tel"
                  placeholder="08X-XXX-XXXX"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  กำหนดรหัสผ่าน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  required
                />
              </div>

              {regMsg && (
                <div
                  className={`p-2.5 rounded-xl text-xs ${
                    regMsg.isError
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold flex items-center space-x-1.5'
                  }`}
                >
                  {!regMsg.isError && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  <span>{regMsg.text}</span>
                </div>
              )}

              <button
                type="submit"
                id="btn-register-submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                ยืนยันการสมัครสมาชิก
              </button>
            </form>
          )}

          {/* Mode: FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                กรอกอีเมลของคุณที่ลงทะเบียนไว้ ระบบจะจำลองการส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยังกล่องข้อความ
              </p>

              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    อีเมลสมาชิก
                  </label>
                  <input
                    type="email"
                    placeholder="somchai.j@office.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>

                {forgotMsg && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{forgotMsg}</span>
                  </div>
                )}

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="flex-1 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-xl"
                  >
                    ย้อนกลับ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                  >
                    ส่งคำขอกู้รหัสผ่าน
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
