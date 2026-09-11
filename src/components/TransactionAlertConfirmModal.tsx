import React, { useState } from 'react';
import { 
  Bell, 
  Send, 
  X, 
  CheckCircle2, 
  Mail, 
  MessageSquare, 
  User as UserIcon, 
  AlertTriangle,
  FileText
} from 'lucide-react';
import { useWasteBank } from '../context/WasteBankContext';

export const TransactionAlertConfirmModal: React.FC = () => {
  const { pendingTransactionAlert, confirmTransactionAlert, cancelTransactionAlert } = useWasteBank();
  const [sendTelegram, setSendTelegram] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [activePreviewTab, setActivePreviewTab] = useState<'telegram' | 'email'>('telegram');
  const [isSuccessToast, setIsSuccessToast] = useState(false);

  if (!pendingTransactionAlert) return null;

  const handleConfirm = () => {
    confirmTransactionAlert({
      telegram: sendTelegram,
      email: sendEmail
    });
    setIsSuccessToast(true);
    setTimeout(() => {
      setIsSuccessToast(false);
    }, 3500);
  };

  const isDeposit = pendingTransactionAlert.type === 'deposit';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="transaction-alert-confirm-modal"
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className={`p-4 sm:p-5 flex items-center justify-between text-white ${
          isDeposit ? 'bg-gradient-to-r from-emerald-600 to-teal-700' : 'bg-gradient-to-r from-blue-600 to-indigo-700'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Bell className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">แจ้งเตือนรายการบันทึกทันที</h3>
                <span className="px-2 py-0.5 text-xs rounded-full bg-white/25 font-medium">
                  {isDeposit ? 'บันทึกฝากขยะ' : 'อนุมัติถอนเงิน'}
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 sm:text-slate-100">
                ตรวจสอบข้อมูลก่อนยืนยันการส่งการแจ้งเตือนไปยังสมาชิก
              </p>
            </div>
          </div>
          <button
            onClick={cancelTransactionAlert}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-slate-800 text-sm">
          {/* Member Card Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shadow-sm">
                <UserIcon className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm sm:text-base">
                  {pendingTransactionAlert.memberName}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">
                    {pendingTransactionAlert.memberCode}
                  </span>
                  <span>•</span>
                  <span>{pendingTransactionAlert.department}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Key Details */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-xs">
            <div className="px-3.5 py-2 bg-slate-50/80 font-medium text-xs text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>รายละเอียดรายการที่บันทึก</span>
              <span className="text-emerald-700 font-semibold lowercase">สถานะ: บันทึกสำเร็จแล้ว</span>
            </div>
            <div className="p-3 sm:p-4 grid grid-cols-2 gap-3 text-xs sm:text-sm">
              {pendingTransactionAlert.details.map((item, idx) => (
                <div key={idx} className="flex flex-col">
                  <span className="text-slate-500 text-xs">{item.label}</span>
                  <span className="font-medium text-slate-800 break-words">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Channels Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              เลือกช่องทางการแจ้งเตือนที่ต้องการส่ง:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label 
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  sendTelegram 
                    ? 'bg-sky-50/70 border-sky-300 text-sky-950 shadow-xs' 
                    : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={sendTelegram}
                  onChange={(e) => setSendTelegram(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                />
                <div className="flex items-center gap-2">
                  <MessageSquare className={`w-4 h-4 ${sendTelegram ? 'text-sky-600' : 'text-slate-400'}`} />
                  <div>
                    <div className="text-xs font-semibold">Telegram Alert</div>
                    <div className="text-[11px] text-slate-500">แจ้งเตือนผ่านบอท/กลุ่ม อบต.</div>
                  </div>
                </div>
              </label>

              <label 
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  sendEmail 
                    ? 'bg-amber-50/70 border-amber-300 text-amber-950 shadow-xs' 
                    : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <div className="flex items-center gap-2">
                  <Mail className={`w-4 h-4 ${sendEmail ? 'text-amber-600' : 'text-slate-400'}`} />
                  <div>
                    <div className="text-xs font-semibold">Email Notification</div>
                    <div className="text-[11px] text-slate-500">ส่งอีเมลใบเสร็จ/ข้อความ</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Message Preview Tabs */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 text-slate-100 text-xs">
            <div className="flex border-b border-slate-800 bg-slate-950/80 px-2 pt-1 gap-1">
              <button
                type="button"
                onClick={() => setActivePreviewTab('telegram')}
                className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors flex items-center gap-1.5 ${
                  activePreviewTab === 'telegram'
                    ? 'bg-slate-900 text-sky-400 border-t-2 border-sky-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>ตัวอย่างข้อความ Telegram</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('email')}
                className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors flex items-center gap-1.5 ${
                  activePreviewTab === 'email'
                    ? 'bg-slate-900 text-amber-400 border-t-2 border-amber-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>ตัวอย่างข้อความ Email</span>
              </button>
            </div>

            <div className="p-3.5 font-mono text-[12px] leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
              {activePreviewTab === 'telegram' ? (
                pendingTransactionAlert.telegramPreview
              ) : (
                <>
                  <div className="text-amber-300 font-bold mb-1">
                    หัวข้อ: {pendingTransactionAlert.emailPreview.subject}
                  </div>
                  <div className="text-slate-300">
                    {pendingTransactionAlert.emailPreview.body}
                  </div>
                </>
              )}
            </div>
          </div>

          {(!sendTelegram && !sendEmail) && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>ท่านไม่ได้เลือกช่องทางใดเลย หากกดยืนยัน ระบบจะไม่ส่งข้อความแจ้งเตือน</span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            id="btn-cancel-transaction-alert"
            onClick={cancelTransactionAlert}
            className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-all shadow-xs"
          >
            ยกเลิก (ไม่ส่งการแจ้งเตือน)
          </button>

          <button
            type="button"
            id="btn-confirm-transaction-alert"
            onClick={handleConfirm}
            className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md flex items-center gap-2 transition-all ${
              isDeposit 
                ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-98' 
                : 'bg-blue-600 hover:bg-blue-700 active:scale-98'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>ยืนยันการส่งการแจ้งเตือน</span>
          </button>
        </div>
      </div>
    </div>
  );
};
