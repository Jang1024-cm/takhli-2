import React, { useState } from 'react';
import { useWasteBank } from '../context/WasteBankContext';
import { 
  HeartHandshake, 
  Mail, 
  Send, 
  Copy, 
  Check, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Smartphone, 
  Sparkles,
  Users,
  Calendar,
  Wallet
} from 'lucide-react';

interface WelfareAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedMemberCode?: string;
}

export const WelfareAlertModal: React.FC<WelfareAlertModalProps> = ({
  isOpen,
  onClose,
  preselectedMemberCode
}) => {
  const { 
    currentUser, 
    users, 
    welfareConfig, 
    getMemberWelfareSummary, 
    getWelfareFundStats, 
    getMemberSummary 
  } = useWasteBank();

  const [activeTab, setActiveTab] = useState<'telegram' | 'email' | 'group'>('telegram');
  const [selectedMemberCode, setSelectedMemberCode] = useState<string>(
    preselectedMemberCode || currentUser?.memberCode || 'MB001'
  );
  const [copied, setCopied] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendSuccess, setSendSuccess] = useState<boolean>(false);

  // Telegram Config state
  const [telegramBotToken, setTelegramBotToken] = useState<string>('7123456789:AAF_takhli_welfare_bot');
  const [telegramChatId, setTelegramChatId] = useState<string>('-1001928374652 (กลุ่ม อบต.ตาคลี)');

  if (!isOpen) return null;

  const targetMember = users.find(u => u.memberCode === selectedMemberCode) || users[1];
  const wfSummary = getMemberWelfareSummary(selectedMemberCode);
  const wasteSummary = getMemberSummary(selectedMemberCode);
  const fundStats = getWelfareFundStats();

  // Telegram Individual Alert Message
  const telegramIndividualMessage = wfSummary.isTargetMet
    ? `🤝 [แจ้งเตือนกองทุนสวัสดิการสงเคราะห์ อบต.ตาคลี] 
เรียน ${targetMember?.name} (${targetMember?.memberCode})
✅ คุณได้สมทบเงินเข้ากองทุนสวัสดิการประจำเดือน ${welfareConfig.currentMonth} ครบถ้วนแล้ว!
• ยอดสมทบเดือนนี้: ${wfSummary.currentMonthContributed.toFixed(2)} บาท
• สิทธิคุ้มครอง: ฌาปนกิจ 3,000 บ. | รักษาพยาบาล 1,000 บ. | คลอดบุตร 1,500 บ. | ทุนการศึกษา 1,000 บ.
• ยอดเงินในบัญชีธนาคารขยะคงเหลือ: ${wasteSummary.currentBalance.toFixed(2)} บาท
ขอขอบคุณที่ร่วมสร้างหลักประกันสวัสดิการชุมชนครับ ♻️`
    : `⚠️ [แจ้งเตือนยอดสมทบกองทุนสวัสดิการสงเคราะห์ อบต.ตาคลี]
เรียน ${targetMember?.name} (${targetMember?.memberCode})
🔔 ประจำรอบเดือน: ${welfareConfig.currentMonth}
• เกณฑ์สมทบประจำเดือน: ${wfSummary.monthlyTarget.toFixed(2)} บาท
• สมทบแล้ว: ${wfSummary.currentMonthContributed.toFixed(2)} บาท
• 🔴 ยังขาดอีก: ${wfSummary.remainingShortfall.toFixed(2)} บาท

💡 คำแนะนำสำหรับสมาชิก:
1. นำขยะรีไซเคิลมาขายที่จุดบริการ อบต.ตาคลี เพื่อหักเข้ากองทุนอัตโนมัติ
2. หรือโอนหักจากยอดเงินคงเหลือธนาคารขยะ (ปัจจุบันคงเหลือ ${wasteSummary.currentBalance.toFixed(2)} ฿ / ถอนได้ ${wasteSummary.maxWithdrawable.toFixed(2)} ฿)
3. หรือนำเงินสดมาฝากสมทบ ณ กองคลัง ได้ทุกวันทำการ`;

  // Telegram Group Fund Status Message
  const telegramGroupMessage = `📢 [สรุปสถานะกองทุนสวัสดิการสงเคราะห์ อบต.ตาคลี] 🌳
รอบประจำเดือน: ${welfareConfig.currentMonth}
🤝 สมาชิกที่เข้าร่วมกองทุน: ${fundStats.enrolledMembersCount} ท่าน
💰 ยอดเงินกองทุนสะสมสุทธิ: ${fundStats.totalFundPool.toFixed(2)} บาท
• ยอดเงินสมทบสะสมตลอดโครงการ: ${fundStats.totalCollected.toFixed(2)} บาท
• ยอดจ่ายสวัสดิการช่วยเหลือสะสม: ${fundStats.totalExpenses.toFixed(2)} บาท (เดือนนี้จ่ายไป ${fundStats.currentMonthExpenses.toFixed(2)} บาท)
• สมาชิกที่สมทบครบตามเกณฑ์รอบนี้: ${fundStats.targetMetCount} ท่าน
• สมาชิกที่ยังมียอดค้างสมทบ: ${fundStats.shortfallCount} ท่าน

มาร่วมกันเปลี่ยนขยะให้เป็นสวัสดิการที่มั่นคงเพื่อพนักงาน อบต.ตาคลี ทุกคน! ♻️`;

  // Email Alert Message
  const emailSubject = `[อบต.ตาคลี] แจ้งสถานะเงินกองทุนสวัสดิการสงเคราะห์ รอบเดือน ${welfareConfig.currentMonth} - ${targetMember?.name}`;
  const emailBody = `เรียน ${targetMember?.name} (รหัสสมาชิก: ${targetMember?.memberCode})

กองทุนสวัสดิการสงเคราะห์ องค์การบริหารส่วนตำบลตาคลี ขอแจ้งสรุปสถานะการสมทบกองทุนประจำเดือน ${welfareConfig.currentMonth}:

• สถานะการเข้าร่วม: ${wfSummary.isEnrolled ? 'เข้าร่วมโครงการสวัสดิการสงเคราะห์ (สมัครใจ)' : 'ยังไม่ได้เข้าร่วม'}
• เกณฑ์ยอดสมทบประจำเดือน: ${wfSummary.monthlyTarget.toFixed(2)} บาท
• ยอดสมทบที่ได้รับแล้วในเดือนนี้: ${wfSummary.currentMonthContributed.toFixed(2)} บาท
• สถานะรอบนี้: ${wfSummary.isTargetMet ? '✅ สมทบครบตามเกณฑ์แล้ว (ได้รับสิทธิประโยชน์เต็มรูปแบบ)' : `⚠️ ยังขาดอีก ${wfSummary.remainingShortfall.toFixed(2)} บาท`}
• ยอดขายขยะสะสมในเดือนนี้: ${wfSummary.currentMonthWasteSales.toFixed(2)} บาท (เกณฑ์ขายขยะพอหัก: ${welfareConfig.requiredWasteSalesThreshold.toFixed(2)} บาท)
• ยอดเงินคงเหลือในบัญชีธนาคารขยะ: ${wasteSummary.currentBalance.toFixed(2)} บาท (ถอน/โอนสมทบได้ ${wasteSummary.maxWithdrawable.toFixed(2)} บาท)

สิทธิประโยชน์ที่คุ้มครองเมื่อสมทบครบ:
1. เงินช่วยเหลือฌาปนกิจสงเคราะห์ (สมาชิกหรือบิดามารดา): 3,000 บาท
2. เงินช่วยเหลือค่ารักษาพยาบาล/นอนพักรักษาตัว: 1,000 บาท
3. เงินขวัญถุงคลอดบุตร: 1,500 บาท
4. ทุนการศึกษาบุตรพนักงานประจำปี: 1,000 บาท

ติดต่อสอบถามเพิ่มเติม: กองคลัง / คณะกรรมการกองทุนสวัสดิการ อบต.ตาคลี`;

  const currentDisplayMessage = activeTab === 'telegram' 
    ? telegramIndividualMessage 
    : activeTab === 'group' 
    ? telegramGroupMessage 
    : emailBody;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentDisplayMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateSend = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <HeartHandshake className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg">
                ระบบแจ้งเตือนเงินสวัสดิการสงเคราะห์ (Alerts & Notifications)
              </h2>
              <p className="text-xs text-emerald-200">
                แจ้งเตือนผ่าน Telegram Bot, Email พนักงาน และกลุ่ม อบต.ตาคลี
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member Selector Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-700">สมาชิกเป้าหมาย:</span>
            <select
              value={selectedMemberCode}
              onChange={(e) => setSelectedMemberCode(e.target.value)}
              className="bg-white text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-slate-300 shadow-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              {users.filter(u => u.role === 'member').map(u => (
                <option key={u.id} value={u.memberCode}>
                  {u.memberCode} - {u.name} ({u.department}) {u.welfareEnrolled ? '✓ สวัสดิการ' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500">สถานะเดือนนี้:</span>
            {wfSummary.isTargetMet ? (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                ✓ สมทบครบแล้ว
              </span>
            ) : (
              <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300">
                ⚠️ ขาดอีก {wfSummary.remainingShortfall.toFixed(2)} ฿
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 flex space-x-2">
          <button
            onClick={() => setActiveTab('telegram')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'telegram'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Telegram ส่วนตัว</span>
          </button>
          <button
            onClick={() => setActiveTab('group')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'group'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Telegram สรุปยอดกลุ่ม อบต.</span>
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'email'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email พนักงาน</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {activeTab === 'email' && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div className="flex justify-between text-slate-600 mb-1">
                <span className="font-semibold">ถึง:</span>
                <span className="font-mono text-slate-800">{targetMember?.email}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-semibold">หัวข้อ:</span>
                <span className="font-medium text-slate-800">{emailSubject}</span>
              </div>
            </div>
          )}

          {activeTab === 'telegram' && (
            <div className="bg-sky-50/50 p-3 rounded-xl border border-sky-200 text-xs flex items-center justify-between">
              <div>
                <span className="font-semibold text-sky-900">Telegram Bot: </span>
                <span className="font-mono text-sky-700">{telegramBotToken}</span>
              </div>
              <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded-full font-bold text-[10px]">
                Active
              </span>
            </div>
          )}

          {activeTab === 'group' && (
            <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200 text-xs flex items-center justify-between">
              <div>
                <span className="font-semibold text-emerald-900">กลุ่มเป้าหมาย: </span>
                <span className="font-bold text-emerald-800">{telegramChatId}</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                {fundStats.enrolledMembersCount} สมาชิก
              </span>
            </div>
          )}

          {/* Message Preview Box */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-600">ข้อความตัวอย่างที่จะถูกส่ง:</span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center space-x-1 text-xs font-medium text-slate-500 hover:text-emerald-700 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกข้อความ'}</span>
              </button>
            </div>
            <pre className="w-full bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto border border-slate-800 shadow-inner">
              {currentDisplayMessage}
            </pre>
          </div>

          {/* Quick Explanation */}
          <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <div className="font-semibold text-slate-700">การทำงานของระบบแจ้งเตือนสวัสดิการ:</div>
            <div>• สมาชิกสามารถรับข้อความแจ้งเตือนอัตโนมัติเมื่อมีการตัดยอดเงินจากการขายขยะเข้ากองทุน</div>
            <div>• ระบบจะส่งข้อความแจ้งเตือนล่วงหน้า 5 วันก่อนสิ้นเดือน หากยอดขายขยะหรือเงินสมทบยังไม่ครบเกณฑ์ {welfareConfig.monthlyContributionAmount} บาท</div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {sendSuccess && (
              <span className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>ส่งข้อความแจ้งเตือนเรียบร้อยแล้ว (จำลองสำเร็จ)</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition"
            >
              ปิดหน้าต่าง
            </button>

            <button
              onClick={handleSimulateSend}
              disabled={isSending}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'กำลังส่งข้อมูล...' : 'ส่งแจ้งเตือนทันที (จำลอง)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
