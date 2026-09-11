import React, { useState, useMemo } from 'react';
import { useWasteBank } from '../context/WasteBankContext';
import { 
  History, Search, Filter, Download, Trash2, Calendar, 
  User, CheckCircle2, AlertTriangle, Printer, 
  DollarSign, Recycle, ArrowRightLeft, Shield, Laptop, RefreshCw
} from 'lucide-react';
import { ActivityLog, ActivityLogAction } from '../types';

interface ActivityLogsViewProps {
  filterMemberCode?: string; // If provided, limits or defaults to this member
  title?: string;
  description?: string;
  isCompact?: boolean;
}

export const ActivityLogsView: React.FC<ActivityLogsViewProps> = ({
  filterMemberCode,
  title = 'บันทึกล็อกการเข้าใช้งานและประวัติกิจกรรม (Audit Trail & Activity Logs)',
  description = 'เก็บบันทึกประวัติการเข้าใช้งานระบบของสมาชิกและเจ้าหน้าที่เพื่อเป็นหลักฐานอ้างอิงอย่างโปร่งใส ตรวจสอบย้อนหลังได้ทุกรายการ',
  isCompact = false
}) => {
  const { activityLogs, users, currentUser, clearActivityLogs } = useWasteBank();

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [memberFilter, setMemberFilter] = useState<string>(filterMemberCode || 'all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      // Member Filter
      if (filterMemberCode && log.memberCode !== filterMemberCode) return false;
      if (!filterMemberCode && memberFilter !== 'all' && log.memberCode !== memberFilter) return false;

      // Action Filter
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;

      // Status Filter
      if (statusFilter !== 'all' && log.status !== statusFilter) return false;

      // Date Range Filter
      if (startDate) {
        const logDate = new Date(log.timestamp);
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (logDate < start) return false;
      }
      if (endDate) {
        const logDate = new Date(log.timestamp);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (logDate > end) return false;
      }

      // Keyword Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = log.memberName?.toLowerCase().includes(q);
        const matchCode = log.memberCode?.toLowerCase().includes(q);
        const matchAction = log.actionTitle?.toLowerCase().includes(q);
        const matchDetails = log.details?.toLowerCase().includes(q);
        const matchDevice = log.device?.toLowerCase().includes(q);
        return matchName || matchCode || matchAction || matchDetails || matchDevice;
      }

      return true;
    });
  }, [activityLogs, filterMemberCode, memberFilter, actionFilter, statusFilter, startDate, endDate, searchQuery]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('ไม่มีข้อมูลล็อกที่ตรงกับเงื่อนไขการค้นหาเพื่อส่งออก');
      return;
    }

    const headers = ['ลำดับ', 'วันเวลา', 'รหัสสมาชิก', 'ชื่อ-นามสกุล', 'บทบาท', 'ฝ่าย/สำนัก', 'การกระทำ', 'รายละเอียด', 'สถานะ', 'อุปกรณ์/เบราว์เซอร์', 'IP Address'];
    const rows = filteredLogs.map((log, index) => [
      index + 1,
      `"${log.dateTimeStr}"`,
      `"${log.memberCode}"`,
      `"${log.memberName}"`,
      `"${log.role}"`,
      `"${log.department || '-'}"`,
      `"${log.actionTitle}"`,
      `"${log.details.replace(/"/g, '""')}"`,
      `"${log.status || 'success'}"`,
      `"${log.device || '-'}"`,
      `"${log.ipAddress || '-'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `WasteBank_Activity_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadge = (action: ActivityLogAction, title: string) => {
    switch (action) {
      case 'login':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <User className="w-3 h-3" />
            <span>{title}</span>
          </span>
        );
      case 'logout':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <ArrowRightLeft className="w-3 h-3" />
            <span>{title}</span>
          </span>
        );
      case 'deposit_waste':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Recycle className="w-3 h-3" />
            <span>{title}</span>
          </span>
        );
      case 'withdraw_request':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <DollarSign className="w-3 h-3" />
            <span>{title}</span>
          </span>
        );
      case 'withdraw_approve':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>{title}</span>
          </span>
        );
      case 'withdraw_reject':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3 h-3" />
            <span>{title}</span>
          </span>
        );
      case 'print_document':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <Printer className="w-3 h-3" />
            <span>{title}</span>
          </span>
        );
      case 'price_update':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
            <RefreshCw className="w-3 h-3" />
            <span>{title}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Shield className="w-3 h-3" />
            <span>{title}</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header Banner */}
      <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
              <History className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="font-bold text-base sm:text-lg text-white">
              {title}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
              ระบบตรวจสอบย้อนหลัง (Audit Trail)
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl">
            {description}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
            title="ดาวน์โหลดประวัติล็อกเป็นไฟล์ CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ส่งออก CSV ({filteredLogs.length})</span>
          </button>

          {currentUser?.role === 'admin' && !filterMemberCode && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างประวัติล็อกกิจกรรมทั้งหมด? การดำเนินการนี้ไม่สามารถย้อนกลับได้')) {
                  clearActivityLogs();
                }
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-700/80 hover:bg-rose-600/80 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              title="ล้างล็อกกิจกรรม (เฉพาะผู้ดูแลระบบ)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ล้างล็อก</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          {/* Keyword Search */}
          <div className="relative sm:col-span-2 lg:col-span-2">
            <input
              type="text"
              placeholder="ค้นหาชื่อสมาชิก, รหัส, กิจกรรม, หรือรายละเอียด..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Action Filter */}
          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">กิจกรรมทั้งหมด (All Actions)</option>
              <option value="login">เข้าสู่ระบบ (Login)</option>
              <option value="logout">ออกจากระบบ (Logout)</option>
              <option value="deposit_waste">บันทึกฝากขยะ (Deposit)</option>
              <option value="withdraw_request">ขอถอนเงิน (Withdraw Request)</option>
              <option value="withdraw_approve">อนุมัติถอนเงิน (Approve)</option>
              <option value="withdraw_reject">ปฏิเสธถอนเงิน (Reject)</option>
              <option value="print_document">พิมพ์เอกสารทางการ A4</option>
              <option value="price_update">ปรับราคารับซื้อ</option>
            </select>
          </div>

          {/* Member Filter (if not fixed) */}
          {!filterMemberCode && (
            <div>
              <select
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">สมาชิกทุกคน ({users.length} ท่าน)</option>
                {users.map(u => (
                  <option key={u.id} value={u.memberCode}>
                    {u.memberCode}: {u.name} ({u.role === 'admin' ? 'แอดมิน' : 'สมาชิก'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="success">สำเร็จ (Success)</option>
              <option value="warning">แจ้งเตือน (Warning)</option>
              <option value="error">ข้อผิดพลาด (Error)</option>
            </select>
          </div>
        </div>

        {/* Date Filters & Quick Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-600 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>ช่วงวันที่:</span>
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-700 font-mono"
              title="ตั้งแต่วันที่"
            />
            <span className="text-slate-400">ถึง</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-700 font-mono"
              title="ถึงวันที่"
            />

            {(startDate || endDate || searchQuery || actionFilter !== 'all' || (!filterMemberCode && memberFilter !== 'all')) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActionFilter('all');
                  if (!filterMemberCode) setMemberFilter('all');
                  setStatusFilter('all');
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold underline ml-1 cursor-pointer"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-500">
            แสดง <strong>{filteredLogs.length}</strong> จากทั้งหมด {activityLogs.length} รายการล็อก
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
              <th className="p-3 w-12 text-center">#</th>
              <th className="p-3 w-40">วันและเวลาที่ทำรายการ</th>
              <th className="p-3 w-48">สมาชิก / ผู้ใช้งาน</th>
              <th className="p-3 w-40">กิจกรรม (Action)</th>
              <th className="p-3 min-w-[280px]">รายละเอียดกิจกรรม (Details)</th>
              <th className="p-3 w-44">อุปกรณ์ / เครือข่าย</th>
              <th className="p-3 w-24 text-center">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.map((log, index) => (
              <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3 text-center font-mono text-slate-400 text-[11px]">
                  {index + 1}
                </td>
                <td className="p-3">
                  <div className="font-mono font-medium text-slate-900 text-xs">
                    {log.dateTimeStr}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    ID: {log.id}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                      {log.memberName?.slice(0, 1) || 'U'}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">
                        {log.memberName}
                      </div>
                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-500">
                        <span className="font-mono font-bold text-emerald-700">{log.memberCode}</span>
                        <span>•</span>
                        <span className="px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                          {log.role === 'admin' ? 'ผู้ดูแลระบบ' : 'สมาชิก'}
                        </span>
                      </div>
                      {log.department && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[160px]" title={log.department}>
                          {log.department}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  {getActionBadge(log.action, log.actionTitle)}
                </td>
                <td className="p-3">
                  <div className="text-slate-800 text-xs font-normal leading-relaxed">
                    {log.details}
                  </div>
                </td>
                <td className="p-3 text-[11px]">
                  <div className="flex items-center space-x-1 text-slate-700">
                    <Laptop className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate max-w-[150px]" title={log.device || 'ระบบเว็บบราวเซอร์'}>
                      {log.device || 'ระบบเว็บ'}
                    </span>
                  </div>
                  {log.ipAddress && (
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {log.ipAddress}
                    </div>
                  )}
                </td>
                <td className="p-3 text-center">
                  <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    log.status === 'error'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : log.status === 'warning'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>สำเร็จ</span>
                  </span>
                </td>
              </tr>
            ))}

            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400 text-xs italic">
                  <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <div>ไม่พบข้อมูลบันทึกล็อกกิจกรรมตามเงื่อนไขที่เลือก</div>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setActionFilter('all');
                      if (!filterMemberCode) setMemberFilter('all');
                      setStatusFilter('all');
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="mt-2 text-emerald-600 font-semibold not-italic hover:underline cursor-pointer"
                  >
                    คลิกเพื่อล้างตัวกรองและแสดงทั้งหมด
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 gap-2">
        <div className="flex items-center space-x-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>บันทึกความปลอดภัยตาม พ.ร.บ. ว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์ และระเบียบ อบต.ตาคลี</span>
        </div>
        <div className="font-mono text-slate-400">
          เก็บบันทึกสูงสุด 500 รายการล่าสุด
        </div>
      </div>
    </div>
  );
};
