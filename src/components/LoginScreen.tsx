import React, { useState } from 'react';
import { useWasteBank } from '../context/WasteBankContext';
import { 
  LogIn, 
  UserPlus, 
  ArrowRight, 
  AlertCircle,
  Lock,
  User
} from 'lucide-react';

interface LoginScreenProps {
  onOpenRegisterModal: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onOpenRegisterModal,
}) => {
  const { login, orgConfig } = useWasteBank();
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('กรุณากรอกชื่อผู้ใช้งาน, รหัสสมาชิก หรือเลขบัตร ปชช.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('กรุณากรอกรหัสผ่าน');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const res = login(identifier, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.message);
      }
    }, 150);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-slate-800 antialiased p-4 sm:p-6 lg:p-8">
      {/* Top Brand Bar */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between text-white/90 py-2">
        <div className="flex items-center space-x-3">
          {orgConfig?.logoUrl ? (
            <img 
              src={orgConfig.logoUrl} 
              alt="Logo" 
              className="w-10 h-10 rounded-xl bg-white p-1 object-contain shadow-md border border-white/20" 
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-white text-emerald-800 flex items-center justify-center font-bold text-xl shadow-md">
              ♻️
            </div>
          )}
          <div>
            <h2 className="font-bold text-sm sm:text-base text-white font-prompt">ธนาคารขยะดิจิทัล อบต.ตาคลี</h2>
            <p className="text-[11px] text-emerald-300">อ.ตาคลี จ.นครสวรรค์</p>
          </div>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md mx-auto my-auto py-6">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-500/30">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-800 px-6 py-8 text-center text-white relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
            <div className="w-16 h-16 bg-white/10 backdrop-blur-xs rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl shadow-inner border border-white/20">
              ♻️
            </div>
            <h1 className="text-xl font-bold font-prompt tracking-wide">เข้าสู่ระบบธนาคารขยะ</h1>
            <p className="text-xs text-emerald-200 mt-1">
              กรุณาระบุชื่อผู้ใช้งานและรหัสผ่านเพื่อเข้าใช้งานระบบ
            </p>
          </div>

          <div className="p-6 sm:p-7 space-y-5">
            {/* Manual Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>ชื่อผู้ใช้งาน / รหัสสมาชิก / เลขบัตร ปชช.</span>
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="เช่น รหัสสมาชิก หรือเลขบัตร ปชช."
                  autoFocus
                  className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>รหัสผ่าน (Password)</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านของคุณ"
                  className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                />
              </div>

              {/* Error Box */}
              {errorMessage && (
                <div className="text-xs text-rose-700 font-medium p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-75"
              >
                {isLoading ? (
                  <span>กำลังตรวจสอบข้อมูล...</span>
                ) : (
                  <>
                    <span>เข้าสู่ระบบ</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Register New Member Link */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
              <span>ยังไม่มีรหัสสมาชิก หรือพนักงานใหม่?</span>
              <button
                type="button"
                onClick={onOpenRegisterModal}
                className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>ลงทะเบียนสมาชิกใหม่</span>
              </button>
            </div>
          </div>

          {/* Footer Note */}
          <div className="bg-slate-50 p-3 text-center border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>เชื่อมต่อฐานข้อมูล Google Sheets อบต.ตาคลี แบบ Real-time</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="max-w-5xl mx-auto w-full text-center text-xs text-emerald-200/70 py-2">
        <span>© 2026 องค์การบริหารส่วนตำบลตาคลี อ.ตาคลี จ.นครสวรรค์ • สนับสนุนนโยบายลดก๊าซเรือนกระจกและสวัสดิการชุมชน</span>
      </div>
    </div>
  );
};
