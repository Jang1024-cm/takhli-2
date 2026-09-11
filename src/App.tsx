import React, { useState, useEffect } from 'react';
import { WasteBankProvider, useWasteBank } from './context/WasteBankContext';
import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/LoginScreen';
import { MemberPortal } from './components/MemberPortal';
import { AdminPanel } from './components/AdminPanel';
import { GoogleSheetsHubModal } from './components/GoogleSheetsHubModal';
import { A4StatementModal } from './components/A4StatementModal';
import { TelegramEmailAlertModal } from './components/TelegramEmailAlertModal';
import { AuthModal } from './components/AuthModal';
import { WelfareStatementModal } from './components/WelfareStatementModal';
import { WelfareAlertModal } from './components/WelfareAlertModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FileSpreadsheet, ShieldCheck, Leaf, HeartHandshake } from 'lucide-react';

function WasteBankApp() {
  const { currentUser } = useWasteBank();

  // Tab: 'member' or 'admin'
  const [activeTab, setActiveTab] = useState<'member' | 'admin'>('member');

  // Determine user role
  const isAdminOrFinance = currentUser?.role === 'admin' || currentUser?.role === 'superadmin' || currentUser?.role === 'finance';

  // Sync activeTab strictly when user logs in: members get 'member', admins get 'admin'
  useEffect(() => {
    if (currentUser) {
      setActiveTab(isAdminOrFinance ? 'admin' : 'member');
    }
  }, [currentUser, isAdminOrFinance]);

  // Modal open states
  const [isSheetsHubOpen, setIsSheetsHubOpen] = useState<boolean>(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [isStatementModalOpen, setIsStatementModalOpen] = useState<boolean>(false);
  const [isWelfareStatementOpen, setIsWelfareStatementOpen] = useState<boolean>(false);
  const [isWelfareAlertsOpen, setIsWelfareAlertsOpen] = useState<boolean>(false);

  // Modal targeting parameters
  const [statementTargetMember, setStatementTargetMember] = useState<string | undefined>(undefined);
  const [alertsTargetMember, setAlertsTargetMember] = useState<string | undefined>(undefined);
  const [alertsDepositId, setAlertsDepositId] = useState<string | undefined>(undefined);
  const [welfareTargetMember, setWelfareTargetMember] = useState<string | undefined>(undefined);

  const handleOpenStatementForUser = (memberCode?: string) => {
    setStatementTargetMember(memberCode || currentUser?.memberCode || 'MB001');
    setIsStatementModalOpen(true);
  };

  const handleOpenAlertsForUser = (memberCode?: string, depositId?: string) => {
    setAlertsTargetMember(memberCode || currentUser?.memberCode || 'MB001');
    setAlertsDepositId(depositId);
    setIsAlertsModalOpen(true);
  };

  const handleOpenWelfareStatementForUser = (memberCode?: string) => {
    setWelfareTargetMember(memberCode || currentUser?.memberCode || 'MB001');
    setIsWelfareStatementOpen(true);
  };

  const handleOpenWelfareAlertsForUser = (memberCode?: string) => {
    setWelfareTargetMember(memberCode || currentUser?.memberCode || 'MB001');
    setIsWelfareAlertsOpen(true);
  };

  // If user is not logged in, render the dedicated Login Screen first!
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900">
        <LoginScreen
          onOpenRegisterModal={() => {
            setAuthModalMode('register');
            setIsAuthModalOpen(true);
          }}
        />

        {isAuthModalOpen && (
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            initialMode={authModalMode}
          />
        )}

        {isSheetsHubOpen && (
          <GoogleSheetsHubModal
            isOpen={isSheetsHubOpen}
            onClose={() => setIsSheetsHubOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSheetsHub={() => setIsSheetsHubOpen(true)}
        onOpenAlertsModal={() => handleOpenAlertsForUser()}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenStatementModal={() => handleOpenStatementForUser()}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {(!isAdminOrFinance || activeTab === 'member') && (
          <MemberPortal
            onOpenStatementModal={() => handleOpenStatementForUser()}
            onOpenAlertsModal={() => handleOpenAlertsForUser()}
            onOpenWelfareStatement={() => handleOpenWelfareStatementForUser()}
            onOpenWelfareAlerts={() => handleOpenWelfareAlertsForUser()}
          />
        )}
        {isAdminOrFinance && activeTab === 'admin' && (
          <AdminPanel
            onOpenStatementModalForMember={(code) => handleOpenStatementForUser(code)}
            onOpenWelfareStatementForMember={(code) => handleOpenWelfareStatementForUser(code)}
            onOpenAlertsModalForMember={(code, depId) => handleOpenAlertsForUser(code, depId)}
            onOpenSheetsHub={() => setIsSheetsHubOpen(true)}
          />
        )}
      </main>

      {/* Sticky Bottom Bar for Sheet Architecture (ONLY visible for Admin/Finance) */}
      {isAdminOrFinance && (
        <aside className="no-print bg-white border-t border-slate-200 py-3.5 px-4 text-xs text-slate-600 shadow-inner">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2">
              <span className="p-1 bg-emerald-100 text-emerald-800 rounded-md">
                <Leaf className="w-4 h-4" />
              </span>
              <span className="font-semibold text-slate-800">
                โครงการธนาคารขยะดิจิทัล องค์การบริหารส่วนตำบลตาคลี
              </span>
              <span className="hidden sm:inline text-slate-400">•</span>
              <span className="hidden sm:inline text-slate-500">
                พ่วงกองทุนสวัสดิการสงเคราะห์พนักงาน (สมัครใจ)
              </span>
            </div>

            <div className="flex items-center space-x-3 text-[11px]">
              <button
                onClick={() => setIsSheetsHubOpen(true)}
                className="inline-flex items-center space-x-1 font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>เปิด 3 แผ่นงาน Google Sheets & Code.gs</span>
              </button>
              <button
                onClick={() => handleOpenWelfareStatementForUser()}
                className="inline-flex items-center space-x-1 font-semibold text-emerald-800 hover:text-emerald-950 transition"
              >
                <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
                <span>ใบรับรองสวัสดิการ A4</span>
              </button>
              <button
                onClick={() => handleOpenStatementForUser()}
                className="font-medium text-slate-600 hover:text-slate-900 transition"
              >
                ยอดฝากขยะ A4
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Modals */}
      <GoogleSheetsHubModal
        isOpen={isSheetsHubOpen}
        onClose={() => setIsSheetsHubOpen(false)}
      />

      <A4StatementModal
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        selectedMemberCode={statementTargetMember}
      />

      <TelegramEmailAlertModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        preselectedMemberCode={alertsTargetMember}
        preselectedDepositId={alertsDepositId}
      />

      <WelfareStatementModal
        isOpen={isWelfareStatementOpen}
        onClose={() => setIsWelfareStatementOpen(false)}
        selectedMemberCode={welfareTargetMember}
      />

      <WelfareAlertModal
        isOpen={isWelfareAlertsOpen}
        onClose={() => setIsWelfareAlertsOpen(false)}
        preselectedMemberCode={welfareTargetMember}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <WasteBankProvider>
        <WasteBankApp />
      </WasteBankProvider>
    </ErrorBoundary>
  );
}
