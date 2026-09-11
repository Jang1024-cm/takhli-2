import React, { useState } from 'react';
import { useWasteBank } from '../context/WasteBankContext';
import { 
  Bell, 
  Mail, 
  Send, 
  Copy, 
  Check, 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  Users, 
  UserCheck, 
  Settings, 
  Search,
  Filter,
  CheckSquare,
  Square,
  AlertCircle
} from 'lucide-react';

interface TelegramEmailAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedMemberCode?: string;
  preselectedDepositId?: string;
}

export const TelegramEmailAlertModal: React.FC<TelegramEmailAlertModalProps> = ({
  isOpen,
  onClose,
  preselectedMemberCode,
  preselectedDepositId
}) => {
  const { 
    currentUser, 
    users, 
    deposits, 
    getMemberSummary, 
    getOrgStats, 
    alertConfig, 
    updateAlertConfig 
  } = useWasteBank();

  const isAdmin = currentUser?.role === 'admin';

  // Navigation tab: 'group' | 'individual' | 'settings'
  const [activeTab, setActiveTab] = useState<'group' | 'individual' | 'settings'>('group');
  const [channel, setChannel] = useState<'both' | 'telegram' | 'email'>('both');

  // Member Selection State for Individual alert
  const [searchMember, setSearchMember] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [selectedMemberCodes, setSelectedMemberCodes] = useState<string[]>(() => {
    if (preselectedMemberCode) return [preselectedMemberCode];
    return ['MB001'];
  });

  // Settings form state (Admin editable)
  const [botToken, setBotToken] = useState(alertConfig.telegramBotToken);
  const [chatId, setChatId] = useState(alertConfig.telegramChatId);
  const [adminEmail, setAdminEmail] = useState(alertConfig.adminEmail);
  const [senderName, setSenderName] = useState(alertConfig.senderName);
  const [promptBeforeSend, setPromptBeforeSend] = useState(alertConfig.promptBeforeSendOnTransaction);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState('');

  // UI state
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState('');

  // Synchronize state when alertConfig changes or modal opens
  React.useEffect(() => {
    if (alertConfig) {
      setBotToken(alertConfig.telegramBotToken || '');
      setChatId(alertConfig.telegramChatId || '');
      setAdminEmail(alertConfig.adminEmail || '');
      setSenderName(alertConfig.senderName || 'ธนาคารขยะ อบต.ตาคลี');
      setPromptBeforeSend(alertConfig.promptBeforeSendOnTransaction ?? true);
    }
  }, [alertConfig, isOpen]);

  // Synchronize preselected member
  React.useEffect(() => {
    if (preselectedMemberCode) {
      setSelectedMemberCodes([preselectedMemberCode]);
    }
  }, [preselectedMemberCode]);

  if (!isOpen) return null;

  const orgStats = getOrgStats() || { totalRecycledWeight: 0, totalMoneyDistributed: 0 };
  const membersOnly = users.filter(u => u.role === 'member');

  // Filter members list for selection
  const filteredMembers = membersOnly.filter(m => {
    const matchQuery = (m.name || '').toLowerCase().includes(searchMember.toLowerCase()) ||
                       (m.memberCode || '').toLowerCase().includes(searchMember.toLowerCase()) ||
                       (m.nationalId && m.nationalId.includes(searchMember));
    const matchDept = selectedDeptFilter === 'all' || m.department === selectedDeptFilter;
    return matchQuery && matchDept;
  });

  const allFilteredCodes = filteredMembers.map(m => m.memberCode);
  const isAllFilteredSelected = allFilteredCodes.length > 0 && allFilteredCodes.every(code => selectedMemberCodes.includes(code));

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      setSelectedMemberCodes(prev => prev.filter(code => !allFilteredCodes.includes(code)));
    } else {
      setSelectedMemberCodes(prev => Array.from(new Set([...prev, ...allFilteredCodes])));
    }
  };

  const handleToggleMember = (code: string) => {
    if (selectedMemberCodes.includes(code)) {
      setSelectedMemberCodes(prev => prev.filter(c => c !== code));
    } else {
      setSelectedMemberCodes(prev => [...prev, code]);
    }
  };

  // Top 3 Recyclers for Telegram Group summary
  const memberWeightMap: Record<string, { memberCode: string; name: string; totalWeight: number; totalAmount: number; mainWaste: string }> = {};
  deposits.forEach(d => {
    if (!memberWeightMap[d.memberCode]) {
      memberWeightMap[d.memberCode] = {
        memberCode: d.memberCode,
        name: d.memberName,
        totalWeight: 0,
        totalAmount: 0,
        mainWaste: d.subType
      };
    }
    memberWeightMap[d.memberCode].totalWeight += (d.weight || 0);
    memberWeightMap[d.memberCode].totalAmount += (d.totalAmount || 0);
  });

  const sortedTop3 = Object.values(memberWeightMap)
    .sort((a, b) => b.totalWeight - a.totalWeight)
    .slice(0, 3);

  // Group Message (Broadcast)
  const groupTelegramMessage = `📢 [ประกาศสรุปผลงานธนาคารขยะประจำสัปดาห์] 🌳
อบต.ตาคลี ขอขอบคุณสมาชิกพนักงานทุกท่านที่ร่วมใจคัดแยกขยะ!
📊 ยอดรวมรีไซเคิลสะสมทั้งองค์กร: ${(orgStats.totalRecycledWeight || 0).toFixed(1)} กิโลกรัม
💰 เงินปันผลและสวัสดิการหมุนเวียนรวม: ${(orgStats.totalMoneyDistributed || 0).toFixed(2)} บาท

🏆 3 อันดับผู้รักษ์โลกที่มีผลงานคัดแยกสูงสุด:
${sortedTop3.length > 0 ? sortedTop3.map((m, idx) => `${idx + 1}. ${m.name} (${m.mainWaste} ${(m.totalWeight || 0).toFixed(1)} กก.) ➡️ เงินสะสม +${(m.totalAmount || 0).toFixed(2)} บ.`).join('\n') : 'อยู่ระหว่างรวบรวมข้อมูลอันดับประจำสัปดาห์'}

♻️ มาร่วมกันเปลี่ยนขยะให้เป็นทุนได้ทุกสัปดาห์ ณ จุดรับฝากธนาคารขยะ อบต.ตาคลี!`;

  // Individual Message Sample with safe fallbacks
  const sampleTargetMember = 
    users.find(u => u.memberCode === selectedMemberCodes[0]) ||
    users.find(u => u.memberCode === (preselectedMemberCode || 'MB001')) ||
    users.find(u => u.role === 'member') ||
    users[0] || {
      id: 'default',
      memberCode: 'MB001',
      name: 'สมาชิกตัวอย่าง',
      department: 'สำนักปลัด',
      email: 'member@takhli.go.th',
      role: 'member' as const
    };

  const sampleSummary = getMemberSummary(sampleTargetMember.memberCode) || {
    currentBalance: 0,
    totalWeightKg: 0,
    totalWeight: 0,
    isBelowMinimum: false,
    maxWithdrawable: 0
  };

  const individualEmailSubject = `[ธนาคารขยะ อบต.ตาคลี] แจ้งสถานะบัญชีเงินฝากและสวัสดิการ (${sampleTargetMember.memberCode})`;
  const individualEmailBody = `เรียน ${sampleTargetMember.name} (${sampleTargetMember.memberCode})\nสังกัด: ${sampleTargetMember.department}\n\nสรุปยอดสะสมในโครงการธนาคารขยะ อบต.ตาคลี:\n• ยอดเงินสะสมสุทธิ: ${(sampleSummary.currentBalance || 0).toFixed(2)} บาท\n• น้ำหนักขยะที่ร่วมคัดแยกสะสม: ${(sampleSummary.totalWeightKg ?? sampleSummary.totalWeight ?? 0).toFixed(2)} กิโลกรัม\n• สถานะบัญชี: ${sampleSummary.isBelowMinimum ? '⚠️ ต่ำกว่าเกณฑ์ 50 บาท (ไม่สามารถถอนได้)' : '✅ ปกติ (สามารถถอนได้สูงสุด ' + (sampleSummary.maxWithdrawable || 0).toFixed(2) + ' บาท)'}\n\nขอขอบคุณท่านที่ร่วมมือสร้างสรรค์ อบต.ตาคลี สู่องค์กรต้นแบบสิ่งแวดล้อม`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    const res = updateAlertConfig({
      telegramBotToken: botToken,
      telegramChatId: chatId,
      adminEmail,
      senderName,
      promptBeforeSendOnTransaction: promptBeforeSend
    });

    if (res.success) {
      setSettingsSavedMessage(res.message);
      setTimeout(() => setSettingsSavedMessage(''), 3500);
    }
  };

  const handleSimulateSend = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      let msg = '';
      if (activeTab === 'group') {
        msg = `ส่งการแจ้งเตือนสรุปภาพรวมเข้ากลุ่ม Telegram (${chatId}) และส่งอีเมลประกาศถึงพนักงานทุกคนเรียบร้อยแล้ว`;
      } else {
        msg = `ส่งการแจ้งเตือนไปยังสมาชิกที่เลือกจำนวน ${selectedMemberCodes.length} ท่านเรียบร้อยแล้ว`;
      }
      setSendSuccessMessage(msg);
      setTimeout(() => setSendSuccessMessage(''), 4500);
    }, 900);
  };

  // Unique departments for filter
  const departmentsList = Array.from(new Set(membersOnly.map(m => m.department)));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        id="telegram-email-alert-modal"
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-sky-700 via-indigo-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Bell className="w-5 h-5 text-sky-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base sm:text-lg">ระบบแจ้งเตือนอัตโนมัติ (Telegram & Email Alert)</h2>
                {isAdmin ? (
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/25 border border-emerald-300/40 rounded-full text-emerald-100 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> แอดมิน (มีสิทธิ์จัดการ)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[11px] font-medium bg-amber-500/20 border border-amber-300/30 rounded-full text-amber-200 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> ผู้ใช้ทั่วไป (อ่านอย่างเดียว)
                  </span>
                )}
              </div>
              <p className="text-xs text-sky-100">
                รองรับการแจ้งเตือนกลุ่มรวม สรุปผลงานประจำสัปดาห์ และเลือกส่งรายบุคคล
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-sky-200 hover:text-white rounded-lg hover:bg-white/10 transition"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 pt-2.5 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('group')}
            className={`pb-2.5 px-3.5 font-semibold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'group'
                ? 'border-sky-600 text-sky-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-sky-600" />
            <span>📢 แจ้งเตือนกลุ่มรวม (Broadcast)</span>
          </button>

          <button
            onClick={() => setActiveTab('individual')}
            className={`pb-2.5 px-3.5 font-semibold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'individual'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <span>👤 แจ้งเตือนสมาชิกรายบุคคล ({selectedMemberCodes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2.5 px-3.5 font-semibold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-slate-800 text-slate-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-700" />
            <span>⚙️ ตั้งค่าระบบแจ้งเตือน {isAdmin ? '' : '(แอดมินเท่านั้น)'}</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: GROUP BROADCAST */}
          {activeTab === 'group' && (
            <div className="space-y-4">
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 text-xs text-sky-950 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">โหมดส่งแจ้งเตือนกลุ่มรวม:</span>{' '}
                  ระบบจะสรุปยอดการคัดแยกขยะสะสมทั้งองค์กร พร้อมจัดอันดับ <strong>Top 3 สมาชิกผู้รักษ์โลก</strong> ยิงตรงเข้ากลุ่ม Telegram หรือแจ้งประกาศผ่าน Email ทั่วทั้ง อบต.ตาคลี
                </div>
              </div>

              {/* Target Channel Selector */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-slate-700">ช่องทางที่จะส่ง:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setChannel('both')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      channel === 'both' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    ทั้ง Telegram และ Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel('telegram')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      channel === 'telegram' ? 'bg-sky-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Telegram กลุ่มเท่านั้น
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel('email')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      channel === 'email' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Email รวมเท่านั้น
                  </button>
                </div>
              </div>

              {/* Message Preview */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold text-slate-700">ตัวอย่างข้อความ Telegram กลุ่มที่จะส่ง:</span>
                  <button
                    onClick={() => handleCopy(groupTelegramMessage)}
                    className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-800 font-medium"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกข้อความ'}</span>
                  </button>
                </div>
                <div className="bg-[#242f3d] text-[#f5f5f5] p-4 rounded-xl font-mono text-xs whitespace-pre-wrap leading-relaxed border border-slate-700 shadow-inner">
                  {groupTelegramMessage}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INDIVIDUAL MEMBER SELECTION */}
          {activeTab === 'individual' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 text-xs text-indigo-950 flex items-start gap-3">
                <UserCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">โหมดเลือกสมาชิกเพื่อแจ้งเตือน (ก่อนส่ง):</span>{' '}
                  แอดมินสามารถเลือกติ๊กส่งให้สมาชิกเฉพาะคนที่ต้องการ หรือกดปุ่ม <strong>"เลือกทั้งหมด"</strong> เพื่อแจ้งเตือนทุกคน โดยระบบจะดึงยอดเงินคงเหลือและสถานะเงินขั้นต่ำ 50 บาท ของแต่ละคนมารายงานอัตโนมัติ
                </div>
              </div>

              {/* Search and Dept Filter toolbar */}
              <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อ, รหัส MB, เลขบัตรประชาชน..."
                    value={searchMember}
                    onChange={(e) => setSearchMember(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={selectedDeptFilter}
                    onChange={(e) => setSelectedDeptFilter(e.target.value)}
                    className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700"
                  >
                    <option value="all">ทุกกอง/สำนัก ({membersOnly.length})</option>
                    {departmentsList.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition flex items-center gap-1.5 whitespace-nowrap"
                  >
                    {isAllFilteredSelected ? (
                      <>
                        <Square className="w-3.5 h-3.5" />
                        <span>ยกเลิกที่เลือก</span>
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>เลือกทั้งหมด ({filteredMembers.length})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Members Checklist */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-100 bg-white">
                {filteredMembers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    ไม่พบสมาชิกตามเงื่อนไขการค้นหา
                  </div>
                ) : (
                  filteredMembers.map(member => {
                    const isChecked = selectedMemberCodes.includes(member.memberCode);
                    const summary = getMemberSummary(member.memberCode);
                    return (
                      <label
                        key={member.id}
                        className={`flex items-center justify-between p-2.5 hover:bg-slate-50 cursor-pointer transition text-xs ${
                          isChecked ? 'bg-indigo-50/50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleMember(member.memberCode)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                          />
                          <div className="flex items-center gap-2">
                            {member.avatarUrl ? (
                              <img 
                                src={member.avatarUrl} 
                                alt="" 
                                className="w-7 h-7 rounded-full object-cover border border-slate-200" 
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                                {member.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                                <span>{member.name}</span>
                                <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1 rounded">
                                  {member.memberCode}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {member.department} {member.email ? `• ${member.email}` : ''}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-slate-800">
                            {(summary.currentBalance || 0).toFixed(2)} บาท
                          </div>
                          <div className="text-[10px] text-slate-400">
                            สะสม {(summary.totalWeightKg ?? summary.totalWeight ?? 0).toFixed(1)} กก.
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>เลือกแล้ว <strong>{selectedMemberCodes.length}</strong> จากทั้งหมด {membersOnly.length} ท่าน</span>
                <button
                  type="button"
                  onClick={() => setSelectedMemberCodes([])}
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  ล้างรายการที่เลือกทั้งหมด
                </button>
              </div>

              {/* Preview of individual email template */}
              <div>
                <div className="text-xs font-semibold text-slate-700 mb-1">
                  ตัวอย่างข้อความแจ้งเตือนส่วนบุคคลที่จะส่ง (อ้างอิง {sampleTargetMember.name}):
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
                  <strong>หัวข้อ:</strong> {individualEmailSubject}
                  {'\n\n'}
                  {individualEmailBody}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ADMIN SETTINGS ONLY */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              {!isAdmin && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>
                    <strong>การตั้งค่านี้ถูกจำกัดสิทธิ์:</strong> เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถแก้ไขโทเค็น บอทเทเลแกรม และระบบแจ้งเตือนได้
                  </span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Telegram Bot Token */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <span>Telegram Bot Token</span>
                      <span className="text-[10px] text-slate-400">(จาก @BotFather)</span>
                    </label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono disabled:opacity-60 text-xs"
                      placeholder="เช่น 7123456789:AAF_..."
                    />
                  </div>

                  {/* Telegram Group Chat ID */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <span>Telegram Group Chat ID</span>
                      <span className="text-[10px] text-slate-400">(ห้องกลุ่ม อบต.)</span>
                    </label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={chatId}
                      onChange={(e) => setChatId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono disabled:opacity-60 text-xs"
                      placeholder="เช่น -1001928374652"
                    />
                  </div>

                  {/* Admin Alert Email */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">
                      อีเมลแอดมินสำหรับรับสำเนาแจ้งเตือน
                    </label>
                    <input
                      type="email"
                      disabled={!isAdmin}
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl disabled:opacity-60 text-xs"
                      placeholder="admin@takhli.go.th"
                    />
                  </div>

                  {/* Sender Name */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">
                      ชื่อผู้ส่งที่แสดงในอีเมล (Sender Display Name)
                    </label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl disabled:opacity-60 text-xs"
                      placeholder="ธนาคารขยะ อบต.ตาคลี"
                    />
                  </div>
                </div>

                {/* Popup Confirmation Toggle Requirement */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-emerald-600" />
                    <span>การแจ้งเตือนทันทีเมื่อมีการทำรายการ (Instant Notification Trigger)</span>
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      disabled={!isAdmin}
                      checked={promptBeforeSend}
                      onChange={(e) => setPromptBeforeSend(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5 disabled:opacity-60"
                    />
                    <div>
                      <span className="font-medium text-slate-900">
                        แสดงป็อปอัปยืนยันก่อนส่งการแจ้งเตือนทุกครั้งที่มีการบันทึกรายการ
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        เมื่อแอดมินบันทึกรับฝากขยะหรืออนุมัติการถอนเงิน ระบบจะแสดงหน้าต่างตรวจสอบรายละเอียด พร้อมปุ่มให้เลือกส่ง Telegram, Email หรือกดยกเลิกได้
                      </p>
                    </div>
                  </label>
                </div>

                {isAdmin && (
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>บันทึกการตั้งค่าระบบแจ้งเตือน</span>
                    </button>
                  </div>
                )}
              </form>

              {settingsSavedMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{settingsSavedMessage}</span>
                </div>
              )}
            </div>
          )}

          {sendSuccessMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{sendSuccessMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-[11px] text-slate-500 text-center sm:text-left">
            * สคริปต์ Google Apps Script รองรับ <span className="font-mono text-slate-700 font-semibold">MailApp.sendEmail()</span> และ <span className="font-mono text-slate-700 font-semibold">UrlFetchApp</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition shadow-xs"
            >
              ปิด
            </button>

            {activeTab !== 'settings' && (
              <button
                type="button"
                id="btn-trigger-alert-broadcast"
                onClick={handleSimulateSend}
                disabled={isSending || (activeTab === 'individual' && selectedMemberCodes.length === 0)}
                className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition ${
                  activeTab === 'group'
                    ? 'bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300'
                    : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300'
                }`}
              >
                <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-bounce' : ''}`} />
                <span>
                  {isSending 
                    ? 'กำลังส่งการแจ้งเตือน...' 
                    : activeTab === 'group' 
                      ? 'ยิงประกาศกลุ่มรวม' 
                      : `ส่งแจ้งเตือนสมาชิก (${selectedMemberCodes.length} ท่าน)`
                  }
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
