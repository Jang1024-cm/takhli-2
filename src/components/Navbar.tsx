import React, { useState } from 'react';
import { useWasteBank } from '../context/WasteBankContext';
import { 
  Recycle, 
  UserCheck, 
  Shield, 
  ShieldAlert,
  FileSpreadsheet, 
  Bell, 
  RefreshCw, 
  LogOut, 
  Printer, 
  Users,
  Menu,
  X,
  HeartHandshake,
  ChevronDown,
  Sparkles,
  Layers,
  ChevronUp
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'member' | 'admin';
  setActiveTab: (tab: 'member' | 'admin') => void;
  onOpenSheetsHub: () => void;
  onOpenAlertsModal: () => void;
  onOpenAuthModal: () => void;
  onOpenStatementModal: () => void;
  isCompactMode?: boolean;
  onToggleCompactMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSheetsHub,
  onOpenAlertsModal,
  onOpenAuthModal,
  onOpenStatementModal,
  isCompactMode = false,
  onToggleCompactMode
}) => {
  const { currentUser, users, switchUser, logout, isSyncing, syncWithGoogleSheet, lastSynced, orgConfig } = useWasteBank();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState<boolean>(false);
  const isAdminOrFinance = currentUser?.role === 'admin' || currentUser?.role === 'superadmin' || currentUser?.role === 'finance';

  const handleMobileNav = (action: () => void) => {
    action();
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs no-print transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between ${isCompactMode ? 'h-13' : 'h-16 sm:h-18'} transition-all`}>
          {/* Logo & Title */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            {orgConfig?.logoUrl ? (
              <img
                src={orgConfig.logoUrl}
                alt="Logo"
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl object-contain border border-slate-200 shadow-xs bg-white p-0.5 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 shrink-0">
                <Recycle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-bold text-base sm:text-lg text-slate-800 tracking-tight line-clamp-1">
                  {orgConfig?.orgName || 'ธนาคารขยะ อบต.ตาคลี'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                ระบบจัดการขยะรีไซเคิล & บัญชีสวัสดิการดิจิทัล • อ.ตาคลี จ.นครสวรรค์
              </p>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-2 sm:space-x-2.5">
            {/* Google Sheets Status & Sync Button (Admin/Finance Only) */}
            {isAdminOrFinance && (
              <>
                <button
                  type="button"
                  onClick={() => syncWithGoogleSheet()}
                  disabled={isSyncing}
                  title={`ซิงค์กับ Google Sheets ID: 17GTwer_lim6W7z3DO-W4I5u1waDAVZxxwCGiJGu0GDs (ครั้งล่าสุด: ${lastSynced || 'ยังไม่เคยซิงค์'})`}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>ซิงค์ Sheets</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </button>

                <button
                  type="button"
                  onClick={onOpenSheetsHub}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition"
                  title="ดูโครงสร้างตาราง 3 ชีต, คู่มือติดตั้ง และโค้ด Google Apps Script"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden lg:inline">Google Sheets Hub</span>
                  <span className="lg:hidden">Sheets Hub</span>
                </button>
              </>
            )}

            {/* Statement A4 Print Button (Admin Only) */}
            {isAdminOrFinance && (
              <button
                type="button"
                onClick={onOpenStatementModal}
                className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl border border-slate-200 transition"
                title="พิมพ์ใบแจ้งยอด A4 / PDF"
              >
                <Printer className="w-4 h-4" />
              </button>
            )}

            {/* Toggle Full Screen / Compact View button */}
            {onToggleCompactMode && (
              <button
                type="button"
                onClick={onToggleCompactMode}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
                title={isCompactMode ? 'ขยายเมนูหัวเว็บ' : 'ซ่อนเมนูหัวเว็บเพื่อเพิ่มพื้นที่ตาราง'}
              >
                {isCompactMode ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            )}

            {/* User Profile Menu */}
            {currentUser ? (
              <div className="relative pl-1 border-l border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  onBlur={() => setTimeout(() => setIsAccountMenuOpen(false), 250)}
                  className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 text-left transition"
                >
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-full object-cover border border-emerald-400 shadow-2xs bg-white shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-300 shrink-0">
                      {currentUser.memberCode.substring(0, 3)}
                    </div>
                  )}
                  <div className="text-left">
                    <div className="text-xs font-semibold text-slate-800 leading-none">
                      {currentUser.name.split(' ')[0]}
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight flex items-center space-x-1 mt-0.5">
                      <span className="font-mono text-emerald-700 font-bold">{currentUser.memberCode}</span>
                      <span>•</span>
                      <span className="capitalize text-slate-600 font-medium">
                        {currentUser.role === 'admin' ? 'แอดมิน' : 'สมาชิก'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu (No account switching for regular members) */}
                {isAccountMenuOpen && (
                  <div className="absolute right-0 mt-1 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <div className="font-semibold text-xs text-slate-800">{currentUser.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {currentUser.memberCode} • {currentUser.department}
                      </div>
                      <div className="mt-1">
                        <span className={`inline-flex items-center space-x-1 text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          currentUser.role === 'superadmin'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : currentUser.role === 'admin'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          {currentUser.role === 'superadmin' ? (
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                          ) : currentUser.role === 'admin' ? (
                            <Shield className="w-3 h-3 text-amber-600" />
                          ) : (
                            <UserCheck className="w-3 h-3 text-emerald-600" />
                          )}
                          <span>
                            {currentUser.role === 'superadmin'
                              ? 'ผู้ดูแลระบบสูงสุด (Super Admin)'
                              : currentUser.role === 'admin'
                              ? 'ผู้ดูแลระบบ (Admin)'
                              : 'พนักงาน / สมาชิกทั่วไป'}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Quick Switcher only shown if admin wants to switch */}
                    {isAdminOrFinance && (
                      <>
                        <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          ทดสอบสลับบัญชี (เฉพาะแอดมิน / Super Admin)
                        </div>
                        {users.slice(0, 6).map(u => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              switchUser(u);
                              setIsAccountMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                              u.id === currentUser.id ? 'bg-emerald-50 text-emerald-900 font-medium' : 'text-slate-700'
                            }`}
                          >
                            <div className="flex items-center space-x-2 truncate">
                              {u.avatarUrl ? (
                                <img src={u.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                  {u.memberCode.substring(0, 2)}
                                </div>
                              )}
                              <div className="truncate">
                                <div className="truncate font-medium">{u.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{u.memberCode} • {u.department}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </>
                    )}

                    <div className="p-2 border-t border-slate-100 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setIsAccountMenuOpen(false);
                        }}
                        className="w-full text-center text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg flex items-center justify-center space-x-1.5 py-1.5 font-semibold transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>ออกจากระบบ</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
              >
                <Users className="w-3.5 h-3.5" />
                <span>เข้าสู่ระบบ / สมาชิก</span>
              </button>
            )}
          </div>

          {/* Mobile Right Controls: Sync button (Admin Only) + Hamburger Menu Toggle */}
          <div className="flex md:hidden items-center space-x-1.5">
            {isAdminOrFinance && (
              <button
                type="button"
                onClick={() => syncWithGoogleSheet()}
                disabled={isSyncing}
                title="ซิงค์ Google Sheets"
                className="p-2.5 text-slate-700 hover:bg-slate-100 active:bg-slate-200 rounded-xl transition flex items-center justify-center min-w-[44px] min-h-[44px]"
              >
                <RefreshCw className={`w-4 h-4 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            )}

            {/* Mobile Menu Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 text-slate-700 hover:bg-slate-100 active:bg-slate-200 rounded-xl transition flex items-center justify-center min-w-[44px] min-h-[44px] border border-slate-200"
              aria-label={isMobileMenuOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-rose-600" /> : <Menu className="w-5 h-5 text-slate-800" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Indicator: Strictly separated by Role */}
        {!isCompactMode && (
          <div className="hidden md:flex border-t border-slate-100 pt-1">
            {isAdminOrFinance ? (
              <div className="flex items-center space-x-2 py-2 px-4 text-sm font-bold text-emerald-800 bg-emerald-50/80 border-b-2 border-emerald-600 rounded-t-lg">
                <Shield className="w-4 h-4 text-emerald-700" />
                <span>ศูนย์ควบคุมผู้ดูแลระบบ (Admin Panel)</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 py-2 px-4 text-sm font-bold text-emerald-800 bg-emerald-50/80 border-b-2 border-emerald-600 rounded-t-lg">
                <UserCheck className="w-4 h-4 text-emerald-700" />
                <span>หน้าพนักงาน / สมาชิก (Member Portal)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MOBILE DRAWER / SLIDE-OUT MENU (Full UX on Mobile Devices) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[52px] sm:top-[64px] z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-start">
          <div className="bg-white border-b border-slate-200 shadow-2xl max-h-[85vh] overflow-y-auto p-4 space-y-4 animate-in slide-in-from-top-4 duration-150">
            {/* User Profile Card on Mobile */}
            {currentUser ? (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center border border-emerald-300 shrink-0">
                      {currentUser.memberCode.substring(0, 3)}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{currentUser.name}</div>
                    <div className="text-xs text-slate-500 flex items-center space-x-1.5 mt-0.5">
                      <span className="font-mono text-emerald-700 font-bold">{currentUser.memberCode}</span>
                      <span>•</span>
                      <span>{currentUser.department}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleMobileNav(logout)}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleMobileNav(onOpenAuthModal)}
                className="w-full py-3 bg-emerald-700 text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 shadow-xs"
              >
                <Users className="w-4 h-4" />
                <span>เข้าสู่ระบบ / สมัครสมาชิกใหม่</span>
              </button>
            )}

            {/* Portal Indicator for Mobile (Separated by role) */}
            <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center space-x-2">
              {isAdminOrFinance ? <Shield className="w-4 h-4 text-emerald-700" /> : <UserCheck className="w-4 h-4 text-emerald-700" />}
              <span>{isAdminOrFinance ? 'ศูนย์ควบคุมผู้ดูแลระบบ (Admin Panel)' : 'หน้าพนักงาน / สมาชิก (Member Portal)'}</span>
            </div>

            {/* Quick Action List on Mobile */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                เมนูลัด & บริการระบบ
              </div>

              {/* Google Sheets Hub Shortcut (Admin Only) */}
              {isAdminOrFinance && (
                <button
                  type="button"
                  onClick={() => handleMobileNav(onOpenSheetsHub)}
                  className="w-full p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-left flex items-center justify-between transition min-h-[44px]"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-950">Google Sheets Hub</div>
                      <div className="text-[10px] text-emerald-700 font-mono">ID: 17GTwer_lim6W7z3DO-W4I5u1waDAVZxxwCGiJGu0GDs</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-200/70 px-2 py-0.5 rounded-lg">
                    เปิดดู
                  </span>
                </button>
              )}

              {/* Statement A4 Print (Admin Only) */}
              {isAdminOrFinance && (
                <button
                  type="button"
                  onClick={() => handleMobileNav(onOpenStatementModal)}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left flex items-center justify-between transition min-h-[44px]"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0">
                      <Printer className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">พิมพ์ใบแจ้งยอดสเตทเม้นต์ A4</div>
                      <div className="text-[10px] text-slate-500">พิมพ์หรือส่งออกไฟล์ PDF สรุปบัญชี</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600">พิมพ์</span>
                </button>
              )}

              {/* Switch User Accounts Shortcut (Admin Only) */}
              {isAdminOrFinance && (
                <button
                  type="button"
                  onClick={() => handleMobileNav(onOpenAuthModal)}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left flex items-center justify-between transition min-h-[44px]"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">สลับบัญชีผู้ใช้ / พนักงาน</div>
                      <div className="text-[10px] text-slate-500">เลือกทดลองเข้าสู่ระบบเป็นแอดมินหรือสมาชิก</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600">เปลี่ยน</span>
                </button>
              )}
            </div>

            {/* Close Drawer Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-2.5 border border-slate-300 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-100 transition"
            >
              ปิดแถบเมนู
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
