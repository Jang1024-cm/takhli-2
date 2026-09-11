const fs = require('fs');
const path = require('path');

console.log("Building complete, clean GAS files...");

const gasTemplatesPath = path.resolve('./src/data/gasTemplates.ts');
const rawFile = fs.readFileSync(gasTemplatesPath, 'utf8');

// Extract the HTML part and Code.gs part
const htmlStart = rawFile.indexOf("export const GAS_INDEX_HTML = `");
const codeGsStart = rawFile.indexOf("export const GAS_CODE_GS = `");

let html = rawFile.slice(htmlStart + "export const GAS_INDEX_HTML = `".length, rawFile.lastIndexOf("</html>`") + "</html>".length);
let codeGs = rawFile.slice(codeGsStart + "export const GAS_CODE_GS = `".length, rawFile.lastIndexOf("`;"));

// 1. Fix CSS
html = html.replace(
  /<style>[\s\S]*?<\/style>/,
  `<style>
    body { font-family: 'Sarabun', sans-serif; }
    h1, h2, h3, .font-prompt { font-family: 'Prompt', sans-serif; }
    .hidden { display: none !important; }
    @media print {
      body * { visibility: hidden; }
      .print-area, .print-area * { visibility: visible; }
      .print-area { position: absolute; left: 0; top: 0; width: 100%; }
      .no-print { display: none !important; }
    }
  </style>`
);

// 2. Fix Views and Modals display styles
html = html.replace(
  /<div id="loginScreenView"[^>]*>/,
  `<div id="loginScreenView" style="display: flex !important;" class="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 p-4 sm:p-6 text-slate-800">`
);

html = html.replace(
  /<div id="appMainView"[^>]*>/,
  `<div id="appMainView" style="display: none !important;" class="min-h-screen flex flex-col bg-slate-100 hidden">`
);

const modalList = ['authModal', 'addUserModal', 'addPriceModal', 'thermalReceiptModal', 'passbookModal'];
modalList.forEach(m => {
  const re = new RegExp(`<div id="${m}"([^>]*)>`, 'g');
  html = html.replace(re, (match, attrs) => {
    let clean = attrs.replace(/style="[^"]*"/, '').trim();
    if (!clean.includes('hidden')) clean += ' hidden';
    return `<div id="${m}" style="display: none !important;" ${clean}>`;
  });
});

// 3. Fix input IDs on loginScreenView & authModal
html = html.replace(
  /id="loginIdentifier"/,
  'id="loginScreenIdentifier"'
);
html = html.replace(
  /<input type="password" id="modalLoginPassword" required value="password123"/,
  '<input type="password" id="loginScreenPassword" required value="password123"'
);
html = html.replace(
  /id="loginErrorMsg" class="text-xs text-rose-600 font-bold hidden/,
  'id="loginScreenErrorMsg" style="display: none !important;" class="text-xs text-rose-600 font-bold hidden'
);

html = html.replace(
  /<input type="text" id="loginIdentifier" required placeholder="เช่น ADM01 หรือ MB001"/,
  '<input type="text" id="modalLoginIdentifier" required placeholder="เช่น ADM01 หรือ MB001"'
);
html = html.replace(
  /id="loginErrorMsg" class="text-xs text-rose-600 font-bold hidden"/,
  'id="modalLoginErrorMsg" style="display: none !important;" class="text-xs text-rose-600 font-bold hidden"'
);

// 4. Extract HTML markup up to <script>
const scriptStartIdx = html.indexOf('<script>');
const htmlMarkup = html.slice(0, scriptStartIdx);

// Build the clean, robust JavaScript engine
const cleanScript = `<script>
    // =========================================================================
    // ระบบบริหารจัดการธนาคารขยะดิจิทัล อบต.ตาคลี จ.นครสวรรค์ (Client Engine)
    // =========================================================================

    // Memory / LocalStorage Safe Wrapper
    var safeStorage = {
      _mem: {},
      get: function(key) {
        try {
          if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
            return window.localStorage.getItem(key);
          }
        } catch(e) {}
        return this._mem[key] || null;
      },
      set: function(key, val) {
        try {
          if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
            window.localStorage.setItem(key, val);
          }
        } catch(e) {}
        this._mem[key] = val;
      },
      remove: function(key) {
        try {
          if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
            window.localStorage.removeItem(key);
          }
        } catch(e) {}
        delete this._mem[key];
      }
    };

    // Safe DOM helper
    function $(id) {
      return document.getElementById(id);
    }

    function setModalVisible(id, isVisible) {
      const el = $(id);
      if (!el) return;
      if (isVisible) {
        el.classList.remove('hidden');
        el.style.setProperty('display', 'flex', 'important');
      } else {
        el.classList.add('hidden');
        el.style.setProperty('display', 'none', 'important');
      }
    }

    // Pre-populated default 150 members and prices
    var initialUsers = [
      { code: 'ADM01', name: 'นายเฉลิมชัย ชนะพาล (แอดมิน)', dept: 'กองสาธารณสุขและสิ่งแวดล้อม', phone: '056-261-111', role: 'admin', nationalId: '1600100000011', email: 'admin@takhli.local', password: 'password123' },
      { code: 'FIN01', name: 'นางสาวสุดารัตน์ การเงิน', dept: 'กองคลัง', phone: '056-261-112', role: 'finance', nationalId: '1600100000022', email: 'finance@takhli.local', password: 'password123' },
      { code: 'MB001', name: 'นายสมชาย ใจดี', dept: 'สำนักปลัด', phone: '081-234-5678', role: 'member', nationalId: '1600100000033', email: 'somchai@takhli.local', password: 'password123' }
    ];

    var deptsList = ['สำนักปลัด', 'กองคลัง', 'กองช่าง', 'กองสาธารณสุขและสิ่งแวดล้อม', 'กองการศึกษา ศาสนาและวัฒนธรรม'];
    var firstNames = ['วิชัย', 'สมบัติ', 'ประสิทธิ์', 'ประเสริฐ', 'มนัส', 'สมพร', 'สมศักดิ์', 'สุวรรณ', 'กฤษดา', 'ชำนาญ', 'สุรชัย', 'บุญมี', 'อรุณ', 'สายัณห์', 'ณรงค์', 'กมล', 'ธีระ', 'นิวัฒน์', 'ทรงศักดิ์', 'ชูชาติ', 'มานพ', 'วิเชียร', 'อนันต์', 'สมเกียรติ', 'พิชัย', 'สุนทร', 'วิโรจน์', 'วรพจน์', 'ไพโรจน์', 'ประจักษ์'];
    var lastNames = ['สุขสมบูรณ์', 'คงเจริญ', 'ทองดี', 'เจริญผล', 'มีโชค', 'ใจมั่น', 'มั่งคั่ง', 'วงษ์สุวรรณ', 'ศิริผล', 'ยอดแก้ว', 'สุขใจ', 'บุญเกิด', 'พุ่มพวง', 'เกิดผล', 'สุขเกษม', 'รัตนพันธ์', 'ชำนาญป่า', 'จันทร์โอสถ', 'มีทรัพย์', 'แสงทอง', 'บัวหลวง', 'พรมมา', 'สีใส', 'คำแก้ว', 'คำแพง', 'ชัยชนะ', 'จันทร์หอม', 'บุญส่ง', 'ทรัพย์สิน', 'พิทักษ์'];

    for (var i = 2; i <= 150; i++) {
      var code = 'MB' + String(i).padStart(3, '0');
      var fName = firstNames[(i - 2) % firstNames.length];
      var lName = lastNames[(i - 2) % lastNames.length];
      var pName = (i % 2 === 0 ? 'นาย' : 'นางสาว') + fName + ' ' + lName;
      var dept = deptsList[(i - 2) % deptsList.length];
      initialUsers.push({
        code: code,
        name: pName,
        dept: dept,
        phone: '08' + String(10000000 + (i * 739)).slice(1, 9),
        nationalId: '16001' + String(10000000 + i).slice(1),
        email: code.toLowerCase() + '@takhli.local',
        role: 'member',
        password: 'password123'
      });
    }

    var appData = {
      prices: [
        { code: 'W-P01', category: 'กระดาษ', subType: 'กระดาษขาวดำ (A4/เอกสาร)', price: 4.50 },
        { code: 'W-P02', category: 'กระดาษ', subType: 'กระดาษลัง/กล่องลูกฟูก', price: 3.00 },
        { code: 'W-PL01', category: 'พลาสติก', subType: 'ขวดพลาสติกใส (PET)', price: 7.00 },
        { code: 'W-PL02', category: 'พลาสติก', subType: 'พลาสติกขุ่น (HDPE)', price: 5.50 },
        { code: 'W-M01', category: 'โลหะ', subType: 'กระป๋องอลูมิเนียม', price: 35.00 },
        { code: 'W-M02', category: 'โลหะ', subType: 'เศษเหล็กหนา/เหล็กรวม', price: 6.00 },
        { code: 'W-G01', category: 'แก้ว', subType: 'ขวดแก้วใส/ขวดเบียร์รวม', price: 1.50 }
      ],
      users: initialUsers,
      deposits: [
        { receipt: 'RCP-20250501-0001', date: '01/05/2025 09:30', memberCode: 'MB001', name: 'นายสมชาย ใจดี', dept: 'สำนักปลัด', wasteCode: 'W-PL01', category: 'พลาสติก', subType: 'ขวดพลาสติกใส (PET)', weight: 12.5, unitPrice: 7.00, total: 87.50, recordedBy: 'เจ้าหน้าที่' },
        { receipt: 'RCP-20250502-0002', date: '02/05/2025 10:15', memberCode: 'MB001', name: 'นายสมชาย ใจดี', dept: 'สำนักปลัด', wasteCode: 'W-P02', category: 'กระดาษ', subType: 'กระดาษลัง/กล่องลูกฟูก', weight: 25.0, unitPrice: 3.00, total: 75.00, recordedBy: 'เจ้าหน้าที่' },
        { receipt: 'RCP-20250503-0003', date: '03/05/2025 14:00', memberCode: 'MB002', name: 'นางสาววิชัย สุขสมบูรณ์', dept: 'กองคลัง', wasteCode: 'W-M01', category: 'โลหะ', subType: 'กระป๋องอลูมิเนียม', weight: 4.0, unitPrice: 35.00, total: 140.00, recordedBy: 'เจ้าหน้าที่' }
      ],
      withdrawals: [
        { reqNo: 'WDR-20250503-001', date: '03/05/2025 15:20', memberCode: 'MB002', name: 'นางสาววิชัย สุขสมบูรณ์', dept: 'กองคลัง', amount: 50.00, status: 'อนุมัติแล้ว', approvedAt: '03/05/2025 15:30', approvedBy: 'นางสาวสุดารัตน์ การเงิน' }
      ],
      memberBalances: {
        'MB001': 162.50,
        'MB002': 90.00
      },
      welfare: { balance: 4250.00 }
    };

    var currentUser = null;

    // View Navigation
    function showLoginScreen() {
      try {
        const loginView = $('loginScreenView');
        const appView = $('appMainView');
        if (loginView) {
          loginView.classList.remove('hidden');
          loginView.style.setProperty('display', 'flex', 'important');
        }
        if (appView) {
          appView.classList.add('hidden');
          appView.style.setProperty('display', 'none', 'important');
        }
        ['authModal', 'addUserModal', 'addPriceModal', 'thermalReceiptModal', 'passbookModal'].forEach(id => {
          setModalVisible(id, false);
        });
      } catch(e) {
        console.warn('showLoginScreen note:', e);
      }
    }

    function showAppScreen() {
      try {
        const loginView = $('loginScreenView');
        const appView = $('appMainView');
        if (loginView) {
          loginView.classList.add('hidden');
          loginView.style.setProperty('display', 'none', 'important');
        }
        if (appView) {
          appView.classList.remove('hidden');
          appView.style.setProperty('display', 'flex', 'important');
        }
        ['authModal', 'addUserModal', 'addPriceModal', 'thermalReceiptModal', 'passbookModal'].forEach(id => {
          setModalVisible(id, false);
        });
      } catch(e) {
        console.warn('showAppScreen note:', e);
      }
    }

    // Modals
    function openLoginModal() { setModalVisible('authModal', true); }
    function closeLoginModal() {
      setModalVisible('authModal', false);
      if (currentUser) showAppScreen(); else showLoginScreen();
    }

    function openRegisterModal() {
      try {
        const modal = $('addUserModal');
        if (!modal) return;
        const nameInput = $('newUserName');
        const deptInput = $('newUserDept');
        const phoneInput = $('newUserPhone');
        const idInput = $('newUserNatId');
        if (nameInput) nameInput.value = '';
        if (deptInput) deptInput.value = 'สำนักปลัด';
        if (phoneInput) phoneInput.value = '';
        if (idInput) idInput.value = '';
        setModalVisible('addUserModal', true);
      } catch(e) {
        console.warn('openRegisterModal note:', e);
      }
    }

    function openAddUserModal() { openRegisterModal(); }
    function closeAddUserModal() {
      setModalVisible('addUserModal', false);
      if (!currentUser) showLoginScreen();
    }

    function openAddPriceModal() { setModalVisible('addPriceModal', true); }
    function closeAddPriceModal() { setModalVisible('addPriceModal', false); }

    function openThermalModal(d) {
      try {
        if (!d) return;
        const rNo = $('receiptNo');
        const rDate = $('receiptDate');
        const rName = $('receiptMemberName');
        const rDept = $('receiptMemberDept');
        const rType = $('receiptWasteType');
        const rWeight = $('receiptWeight');
        const rPrice = $('receiptUnitPrice');
        const rTotal = $('receiptTotalAmount');
        const rStaff = $('receiptStaffName');
        if (rNo) rNo.textContent = d.receipt || '';
        if (rDate) rDate.textContent = d.date || '';
        if (rName) rName.textContent = d.name || '';
        if (rDept) rDept.textContent = d.dept || '';
        if (rType) rType.textContent = (d.category ? '[' + d.category + '] ' : '') + (d.subType || '');
        if (rWeight) rWeight.textContent = Number(d.weight || 0).toFixed(1) + ' กก.';
        if (rPrice) rPrice.textContent = Number(d.unitPrice || 0).toFixed(2) + ' บ.';
        if (rTotal) rTotal.textContent = Number(d.total || 0).toFixed(2) + ' บ.';
        if (rStaff) rStaff.textContent = d.recordedBy || 'เจ้าหน้าที่';
        setModalVisible('thermalReceiptModal', true);
      } catch(e) {
        console.warn('openThermalModal note:', e);
      }
    }

    function closeThermalModal() { setModalVisible('thermalReceiptModal', false); }

    function openPassbookPrintModal() {
      try {
        if (!currentUser) return;
        const pName = $('a4MemberName');
        const pCode = $('a4MemberCode');
        const pDept = $('a4MemberDept');
        const pBal = $('a4MemberBalance');
        if (pName) pName.textContent = currentUser.name || '';
        if (pCode) pCode.textContent = currentUser.code || '';
        if (pDept) pDept.textContent = currentUser.dept || '';
        const bal = (appData.memberBalances && appData.memberBalances[currentUser.code]) ? appData.memberBalances[currentUser.code] : 0;
        if (pBal) pBal.textContent = bal.toFixed(2) + ' บาท';

        const tbody = $('a4StatementTableBody');
        if (tbody) {
          const userDeposits = (appData.deposits || []).filter(d => d.memberCode === currentUser.code);
          let running = 0;
          tbody.innerHTML = userDeposits.map(d => {
            running += Number(d.total);
            return '<tr>' +
              '<td class="p-2 border">' + d.date + '</td>' +
              '<td class="p-2 border">' + d.subType + '</td>' +
              '<td class="p-2 border text-right">' + Number(d.weight).toFixed(1) + '</td>' +
              '<td class="p-2 border text-right text-emerald-700 font-bold">+' + Number(d.total).toFixed(2) + '</td>' +
              '<td class="p-2 border text-right font-bold">' + running.toFixed(2) + '</td>' +
            '</tr>';
          }).join('');
        }
        setModalVisible('passbookModal', true);
      } catch(e) {
        console.warn('openPassbookPrintModal note:', e);
      }
    }

    function openPassbookModal() { openPassbookPrintModal(); }
    function closePassbookModal() { setModalVisible('passbookModal', false); }

    // Tab Switching
    function switchTab(tab) {
      if (tab === 'admin') {
        if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'finance')) {
          quickLogin('ADM01');
          switchTab('admin');
          return;
        }
      }
      ['Dashboard', 'Deposit', 'Statement', 'Withdraw', 'Prices', 'Admin'].forEach(t => {
        const el = $('tabContent' + t);
        const btn = $('btnTab' + t);
        if (el) {
          el.classList.add('hidden');
          el.style.setProperty('display', 'none', 'important');
        }
        if (btn) {
          btn.className = 'py-2.5 px-3.5 border-b-2 border-transparent text-emerald-200 hover:text-white whitespace-nowrap text-sm font-medium';
          if (t === 'Admin') btn.className += ' text-amber-300 font-bold';
        }
      });
      const cap = tab.charAt(0).toUpperCase() + tab.slice(1);
      const targetEl = $('tabContent' + cap);
      const targetBtn = $('btnTab' + cap);
      if (targetEl) {
        targetEl.classList.remove('hidden');
        targetEl.style.setProperty('display', 'block', 'important');
      }
      if (targetBtn) {
        targetBtn.className = 'py-2.5 px-3.5 border-b-2 border-white text-white font-bold whitespace-nowrap text-sm';
        if (tab === 'admin') targetBtn.className += ' text-amber-300 border-amber-300';
      }
    }

    function switchAdminSubTab(sub) {
      ['Members', 'Prices', 'Withdrawals', 'Welfare', 'Export'].forEach(s => {
        const el = $('adminSubSection' + s);
        const btn = $('btnAdminSub' + s);
        if (el) {
          el.classList.add('hidden');
          el.style.setProperty('display', 'none', 'important');
        }
        if (btn) {
          btn.className = 'px-4 py-2 text-sm font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition';
        }
      });
      const cap = sub.charAt(0).toUpperCase() + sub.slice(1);
      const targetEl = $('adminSubSection' + cap);
      const targetBtn = $('btnAdminSub' + cap);
      if (targetEl) {
        targetEl.classList.remove('hidden');
        targetEl.style.setProperty('display', 'block', 'important');
      }
      if (targetBtn) {
        targetBtn.className = 'px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-700 text-white shadow-xs';
      }
    }

    // User Selection & Login
    function selectUser(user) {
      if (!user) return;
      currentUser = user;
      safeStorage.set('takhli_wastebank_user', user.code);
      try {
        const uName = $('userDisplayName');
        if (uName) uName.textContent = user.name;
        const uDept = $('userDisplayDept');
        if (uDept) uDept.textContent = user.dept;
        const uAvatar = $('userAvatarText');
        if (uAvatar) uAvatar.textContent = (user.code || 'MB').substring(0, 2);
        const badge = $('roleHeaderBadge');
        if (badge) {
          if (user.role === 'admin') {
            badge.className = 'bg-amber-500 text-slate-950 text-[10px] px-2 py-0.5 rounded-full font-black';
            badge.textContent = '👑 แอดมิน (Admin)';
          } else if (user.role === 'finance') {
            badge.className = 'bg-teal-500 text-slate-950 text-[10px] px-2 py-0.5 rounded-full font-black';
            badge.textContent = '💼 กองคลัง (Finance)';
          } else {
            badge.className = 'bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold';
            badge.textContent = '👤 สมาชิกพนักงาน';
          }
        }

        const sCode = $('stmtUserCode');
        if (sCode) sCode.textContent = user.code;
        const sName = $('stmtUserName');
        if (sName) sName.textContent = user.name;
        const sDept = $('stmtUserDept');
        if (sDept) sDept.textContent = 'สังกัด: ' + user.dept;
        const bal = (appData.memberBalances && appData.memberBalances[user.code]) ? appData.memberBalances[user.code] : 0;
        const sBal = $('stmtUserBalance');
        if (sBal) sBal.textContent = bal.toFixed(2) + ' บาท';
        const wBal = $('wdrCurrentBalanceDisplay');
        if (wBal) wBal.value = bal.toFixed(2) + ' บาท';

        const tbody = $('stmtTableBody');
        if (tbody) {
          const userDeposits = (appData.deposits || []).filter(d => d.memberCode === user.code);
          if (userDeposits.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-slate-400">ยังไม่มีรายการฝากขยะ</td></tr>';
          } else {
            let runningBal = 0;
            tbody.innerHTML = userDeposits.map(d => {
              runningBal += Number(d.total);
              return '<tr class="hover:bg-slate-50">' +
                '<td class="p-2.5 text-slate-500">' + d.date + '</td>' +
                '<td class="p-2.5 font-bold">' + d.subType + '</td>' +
                '<td class="p-2.5">' + Number(d.weight).toFixed(1) + '</td>' +
                '<td class="p-2.5">' + Number(d.unitPrice).toFixed(2) + '</td>' +
                '<td class="p-2.5 text-right font-bold text-emerald-700">+' + Number(d.total).toFixed(2) + '</td>' +
                '<td class="p-2.5 text-right font-bold">' + runningBal.toFixed(2) + '</td>' +
              '</tr>';
            }).join('');
          }
        }

        const btnAdmin = $('btnTabAdmin');
        if (btnAdmin && (user.role === 'admin' || user.role === 'finance')) {
          btnAdmin.classList.remove('opacity-50');
        }
      } catch (err) {
        console.warn('selectUser DOM note:', err);
      }
      showAppScreen();
    }

    function quickLogin(code) {
      try {
        let u = (appData.users || []).find(x => x.code === code);
        if (!u) {
          if (code === 'ADM01') {
            u = { code: 'ADM01', name: 'นายเฉลิมชัย ชนะพาล (แอดมิน)', dept: 'กองสาธารณสุขและสิ่งแวดล้อม', phone: '056-261-111', role: 'admin', password: 'password123' };
          } else if (code === 'FIN01') {
            u = { code: 'FIN01', name: 'นางสาวสุดารัตน์ การเงิน', dept: 'กองคลัง', phone: '056-261-112', role: 'finance', password: 'password123' };
          } else if (code === 'MB001') {
            u = { code: 'MB001', name: 'นายสมชาย ใจดี', dept: 'สำนักปลัด', phone: '081-234-5678', role: 'member', password: 'password123' };
          }
        }
        if (u) {
          selectUser(u);
          showAppScreen();
        }
      } catch(err) {
        console.error('quickLogin error:', err);
      }
    }

    function handleLoginSubmit(e) {
      if (e) {
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
      }
      const sIdEl = $('loginScreenIdentifier');
      const mIdEl = $('modalLoginIdentifier');
      
      let id = '';
      let err = $('loginScreenErrorMsg');

      if (sIdEl && sIdEl.value.trim()) {
        id = sIdEl.value.trim();
        err = $('loginScreenErrorMsg');
      } else if (mIdEl && mIdEl.value.trim()) {
        id = mIdEl.value.trim();
        err = $('modalLoginErrorMsg');
      } else if (sIdEl) {
        id = sIdEl.value.trim();
        err = $('loginScreenErrorMsg');
      }

      if (!id) {
        if (err) {
          err.textContent = "⚠️ กรุณากรอกรหัสสมาชิก เช่น ADM01 หรือ MB001";
          err.classList.remove('hidden');
          err.style.setProperty('display', 'block', 'important');
        }
        return false;
      }

      const found = (appData.users || []).find(u => 
        (u.code && u.code.toLowerCase() === id.toLowerCase()) || 
        (u.nationalId && String(u.nationalId).trim() === id) ||
        (u.email && u.email.toLowerCase() === id.toLowerCase()) ||
        (u.phone && String(u.phone).trim() === id) ||
        (u.name && u.name.includes(id))
      );

      if (!found) {
        if (err) {
          err.textContent = "❌ ไม่พบชื่อผู้ใช้งาน หรือรหัสสมาชิกนี้ในระบบ (กดเลือกเข้าสู่ระบบด่วน 1-Click ด้านบนได้ทันที)";
          err.classList.remove('hidden');
          err.style.setProperty('display', 'block', 'important');
        }
        return false;
      }

      if (err) {
        err.classList.add('hidden');
        err.style.setProperty('display', 'none', 'important');
      }

      selectUser(found);
      showAppScreen();
      return false;
    }

    function handleModalLoginSubmit(e) {
      return handleLoginSubmit(e);
    }

    function logout() {
      currentUser = null;
      safeStorage.remove('takhli_wastebank_user');
      showLoginScreen();
    }

    // Calculations & Form Handlers
    function onWasteCategoryChanged() {
      renderWasteSelector();
    }

    function onWasteSelected() {
      calculateDepositTotal();
    }

    function calculateDepositTotal() {
      const sel = $('depWasteSelect');
      const wIn = $('depWeightInput');
      const pDis = $('depUnitPriceDisplay');
      const tDis = $('depTotalDisplay');
      if (!sel || !wIn || !pDis || !tDis) return;
      const code = sel.value;
      const pObj = (appData.prices || []).find(p => p.code === code);
      const price = pObj ? Number(pObj.price) : 0;
      const weight = Number(wIn.value) || 0;
      const total = weight * price;
      pDis.value = price.toFixed(2);
      tDis.value = total.toFixed(2);
    }

    function calculateSubTotal() {
      calculateDepositTotal();
    }

    function calculateWithdrawalSummary() {
      const amtInput = $('wdrAmountInput');
      const sumAmt = $('wdrSummaryAmount');
      const sumRem = $('wdrSummaryRemaining');
      if (!amtInput) return;
      const amt = Number(amtInput.value) || 0;
      const bal = (currentUser && appData.memberBalances[currentUser.code]) ? appData.memberBalances[currentUser.code] : 0;
      if (sumAmt) sumAmt.textContent = amt.toFixed(2) + ' บาท';
      if (sumRem) sumRem.textContent = (bal - amt).toFixed(2) + ' บาท';
    }

    // Deposit Submit
    function handleDepositSubmit(e) {
      if (e) {
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
      }
      const mSel = $('depMemberSelect');
      const wSel = $('depWasteSelect');
      const wIn = $('depWeightInput');
      if (!mSel || !wSel || !wIn) return false;
      const mCode = mSel.value;
      const wCode = wSel.value;
      const weight = Number(wIn.value) || 0;

      if (!mCode) { alert('กรุณาเลือกสมาชิกผู้ฝาก'); return false; }
      if (!wCode) { alert('กรุณาเลือกชนิดขยะ'); return false; }
      if (weight <= 0) { alert('กรุณาระบุปริมาณน้ำหนักให้ถูกต้อง (มากกว่า 0 กก.)'); return false; }

      const user = (appData.users || []).find(u => u.code === mCode);
      const priceObj = (appData.prices || []).find(p => p.code === wCode);
      const unitPrice = priceObj ? Number(priceObj.price) : 0;
      const total = weight * unitPrice;

      const now = new Date();
      const dateStr = now.toLocaleDateString('th-TH') + ' ' + now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const receiptNo = 'RCP-' + now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '-' + String((appData.deposits.length || 0) + 1).padStart(4, '0');

      const depositData = {
        receipt: receiptNo,
        date: dateStr,
        memberCode: mCode,
        name: user ? user.name : mCode,
        dept: user ? user.dept : 'อบต.ตาคลี',
        wasteCode: wCode,
        category: priceObj ? priceObj.category : 'ขยะรีไซเคิล',
        subType: priceObj ? priceObj.subType : wCode,
        weight: weight,
        unitPrice: unitPrice,
        total: total,
        recordedBy: currentUser ? currentUser.name : 'เจ้าหน้าที่'
      };

      appData.deposits.unshift(depositData);
      appData.memberBalances[mCode] = (appData.memberBalances[mCode] || 0) + total;

      // Sync with Google Sheets if in GAS
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            console.log('Recorded to Google Sheets successfully:', res);
          })
          .withFailureHandler(function(err) {
            console.warn('Sheets record warning:', err);
          })
          .recordDeposit({
            memberCode: mCode,
            memberName: depositData.name,
            dept: depositData.dept,
            wasteCode: wCode,
            category: depositData.category,
            subType: depositData.subType,
            weight: weight,
            unitPrice: unitPrice,
            recordedBy: depositData.recordedBy
          });
      }

      initApp();
      if (currentUser && currentUser.code === mCode) {
        selectUser(currentUser);
      }

      wIn.value = '';
      const tDis = $('depTotalDisplay');
      if (tDis) tDis.value = '0.00';

      openThermalModal(depositData);
      return false;
    }

    // Withdrawal Submit
    function handleWithdrawalSubmit(e) {
      if (e) {
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
      }
      if (!currentUser) { alert('กรุณาเข้าสู่ระบบก่อน'); return false; }
      const amtInput = $('wdrAmountInput');
      if (!amtInput) return false;
      const amt = Number(amtInput.value) || 0;
      const currentBal = appData.memberBalances[currentUser.code] || 0;

      if (amt <= 0) { alert('กรุณาระบุจำนวนเงินที่ต้องการถอนให้ถูกต้อง'); return false; }
      if ((currentBal - amt) < 50.00) {
        alert('ไม่สามารถถอนได้: ต้องมียอดเงินคงเหลือติดบัญชีไม่น้อยกว่า 50.00 บาท (ยอดคงเหลือปัจจุบัน: ' + currentBal.toFixed(2) + ' บาท)');
        return false;
      }

      const now = new Date();
      const reqNo = 'WDR-' + now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '-' + String((appData.withdrawals.length || 0) + 1).padStart(3, '0');
      const dateStr = now.toLocaleDateString('th-TH') + ' ' + now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

      const wdrData = {
        reqNo: reqNo,
        date: dateStr,
        memberCode: currentUser.code,
        name: currentUser.name,
        dept: currentUser.dept,
        amount: amt,
        status: 'รออนุมัติกองคลัง',
        approvedAt: '',
        approvedBy: ''
      };

      appData.withdrawals.unshift(wdrData);

      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            console.log('Withdrawal requested in Google Sheets:', res);
          })
          .withFailureHandler(function(err) {
            console.warn('Sheets withdraw warning:', err);
          })
          .submitWithdrawal({
            memberCode: currentUser.code,
            memberName: currentUser.name,
            dept: currentUser.dept,
            amount: amt
          });
      }

      amtInput.value = '';
      initApp();
      selectUser(currentUser);
      alert('✅ ส่งคำขอถอนเงินสดจำนวน ' + amt.toFixed(2) + ' บาท เรียบร้อยแล้ว (โปรดรอเจ้าหน้าที่กองคลังตรวจสอบและอนุมัติ)');
      return false;
    }

    // Register User Submit
    function handleAddUserSubmit(e) {
      if (e) {
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
      }
      const nameInput = $('newUserName');
      const deptInput = $('newUserDept');
      const phoneInput = $('newUserPhone');
      const idInput = $('newUserNatId');
      if (!nameInput || !deptInput) return false;

      const name = nameInput.value.trim();
      const dept = deptInput.value;
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const natId = idInput ? idInput.value.trim() : '';

      if (!name) { alert('กรุณาระบุชื่อ-นามสกุล'); return false; }

      const newCode = 'MB' + String((appData.users.length || 0) + 1).padStart(3, '0');
      const newUser = {
        code: newCode,
        name: name,
        dept: dept,
        phone: phone || '08x-xxx-xxxx',
        nationalId: natId,
        email: newCode.toLowerCase() + '@takhli.local',
        role: 'member',
        password: 'password123'
      };

      appData.users.push(newUser);
      appData.memberBalances[newCode] = 0;

      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            console.log('User registered in Google Sheets:', res);
          })
          .withFailureHandler(function(err) {
            console.warn('Sheets user register warning:', err);
          })
          .registerUser({
            code: newCode,
            name: name,
            dept: dept,
            nationalId: natId,
            phone: phone
          });
      }

      closeAddUserModal();
      initApp();
      selectUser(newUser);
      alert('🎉 ลงทะเบียนสมาชิกสำเร็จ! รหัสสมาชิกของคุณคือ: ' + newCode + ' (สามารถใช้เข้าสู่ระบบได้ทันที)');
      return false;
    }

    // Add / Update Price Submit
    function handleAddPriceSubmit(e) {
      if (e) {
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
      }
      const catInput = $('newPriceCategory');
      const subInput = $('newPriceSubType');
      const valInput = $('newPriceValue');
      if (!catInput || !subInput || !valInput) return false;

      const cat = catInput.value;
      const sub = subInput.value.trim();
      const val = Number(valInput.value) || 0;

      if (!sub) { alert('กรุณาระบุชนิดขยะย่อย'); return false; }
      if (val <= 0) { alert('กรุณาระบุราคาที่ถูกต้อง'); return false; }

      const codePrefix = cat === 'กระดาษ' ? 'W-P' : (cat === 'พลาสติก' ? 'W-PL' : (cat === 'โลหะ' ? 'W-M' : 'W-G'));
      const newCode = codePrefix + String(appData.prices.length + 1).padStart(2, '0');

      const newPrice = {
        code: newCode,
        category: cat,
        subType: sub,
        price: val
      };

      appData.prices.push(newPrice);

      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            console.log('Price saved to Sheets:', res);
          })
          .withFailureHandler(function(err) {
            console.warn('Sheets price warning:', err);
          })
          .updatePrice({
            code: newCode,
            category: cat,
            subType: sub,
            price: val,
            updatedBy: currentUser ? currentUser.name : 'แอดมิน'
          });
      }

      closeAddPriceModal();
      initApp();
      alert('✅ บันทึกราคารับซื้อขยะเรียบร้อยแล้ว');
      return false;
    }

    // Renderers
    function renderUserSelector() {
      const depSel = $('depMemberSelect');
      if (!depSel) return;
      depSel.innerHTML = '<option value="">-- กรุณาเลือกสมาชิก --</option>';
      (appData.users || []).forEach(u => {
        const dOpt = document.createElement('option');
        dOpt.value = u.code;
        dOpt.textContent = '[' + u.code + '] ' + u.name + ' - ' + u.dept;
        depSel.appendChild(dOpt);
      });
    }

    function renderWasteSelector() {
      const sel = $('depWasteSelect');
      if (!sel) return;
      sel.innerHTML = '<option value="">-- เลือกชนิดขยะ --</option>';
      (appData.prices || []).forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.code;
        opt.textContent = '[' + p.category + '] ' + p.subType + ' (' + Number(p.price).toFixed(2) + ' บ./กก.)';
        sel.appendChild(opt);
      });
    }

    function renderDepositTable() {
      const tbody = $('depositTableBody');
      if (!tbody) return;
      if ((appData.deposits || []).length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-slate-400">ยังไม่มีรายการ</td></tr>';
        return;
      }
      tbody.innerHTML = appData.deposits.slice(0, 15).map(d =>
        '<tr class="hover:bg-slate-50">' +
          '<td class="p-2.5 font-mono text-[11px] font-bold text-slate-500">' + d.receipt + '</td>' +
          '<td class="p-2.5">' + d.date + '</td>' +
          '<td class="p-2.5 font-bold">' + d.name + '</td>' +
          '<td class="p-2.5"><span class="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md text-[11px] font-bold">' + d.subType + '</span></td>' +
          '<td class="p-2.5 text-right font-bold">' + Number(d.weight).toFixed(1) + '</td>' +
          '<td class="p-2.5 text-right font-bold text-emerald-700">+' + Number(d.total).toFixed(2) + '</td>' +
          '<td class="p-2.5 text-center"><button onclick=\\'openThermalModal(' + JSON.stringify(d) + ')\\' class="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg">🧾 สลิป</button></td>' +
        '</tr>'
      ).join('');
    }

    function renderPrices() {
      const container = $('priceCardsContainer');
      if (!container) return;
      container.innerHTML = (appData.prices || []).map(p =>
        '<div class="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">' +
          '<div>' +
            '<div class="text-[10px] font-bold text-emerald-700 uppercase">' + p.category + '</div>' +
            '<div class="font-bold text-slate-800 text-sm mt-0.5">' + p.subType + '</div>' +
            '<div class="text-[10px] text-slate-400 font-mono mt-0.5">' + p.code + '</div>' +
          '</div>' +
          '<div class="text-right">' +
            '<div class="text-lg font-bold text-emerald-800">' + Number(p.price).toFixed(2) + '</div>' +
            '<div class="text-[10px] text-slate-500">บาท/กก.</div>' +
          '</div>' +
        '</div>'
      ).join('');
    }

    function renderDashboard() {
      let totalW = 0, totalM = 0;
      const deptData = { 'สำนักปลัด': 0, 'กองคลัง': 0, 'กองช่าง': 0, 'กองสาธารณสุข': 0, 'กองการศึกษา': 0 };
      (appData.deposits || []).forEach(d => {
        totalW += Number(d.weight) || 0;
        totalM += Number(d.total) || 0;
        for (let k in deptData) {
          if (d.dept && d.dept.includes(k)) deptData[k] += Number(d.weight) || 0;
        }
      });
      const co2 = totalW * 1.85;
      const sW = $('statTotalWeight');
      if (sW) sW.innerHTML = totalW.toFixed(1) + ' <span class="text-xs text-slate-500">กก.</span>';
      const sM = $('statTotalMoney');
      if (sM) sM.innerHTML = totalM.toFixed(2) + ' <span class="text-xs text-slate-500">บาท</span>';
      const sC = $('statTotalCO2');
      if (sC) sC.innerHTML = co2.toFixed(1) + ' <span class="text-xs text-slate-500">kgCO2e</span>';
      const sT = $('statTotalTrees');
      if (sT) sT.innerHTML = Math.round(co2 / 9) + ' <span class="text-xs text-slate-500">ต้น</span>';
      const dCont = $('deptStatsContainer');
      if (dCont) {
        dCont.innerHTML = Object.keys(deptData).map(k =>
          '<div class="p-3 bg-slate-50 rounded-xl border border-slate-200">' +
            '<div class="text-[11px] font-bold text-slate-600 truncate">' + k + '</div>' +
            '<div class="text-lg font-bold text-emerald-800 mt-1">' + deptData[k].toFixed(1) + ' <span class="text-[10px] text-slate-500 font-normal">กก.</span></div>' +
          '</div>'
        ).join('');
      }
    }

    function filterAdminUserList() {
      const q = ($('adminUserSearchInput')?.value || '').toLowerCase();
      const dept = $('adminUserDeptFilter')?.value || 'ALL';
      const tbody = $('adminUserListBody');
      if (!tbody) return;
      const filtered = (appData.users || []).filter(u => {
        const matchQ = !q || u.name.toLowerCase().includes(q) || u.code.toLowerCase().includes(q) || (u.phone && u.phone.includes(q));
        const matchD = dept === 'ALL' || u.dept.includes(dept);
        return matchQ && matchD;
      });
      tbody.innerHTML = filtered.map((u, idx) => {
        const bal = (appData.memberBalances && appData.memberBalances[u.code]) ? appData.memberBalances[u.code] : 0;
        return '<tr class="hover:bg-slate-50">' +
          '<td class="p-2.5 font-mono text-[11px] font-bold text-slate-500">' + (idx + 1) + '</td>' +
          '<td class="p-2.5 font-mono font-bold text-emerald-800">' + u.code + '</td>' +
          '<td class="p-2.5 font-bold text-slate-800">' + u.name + '</td>' +
          '<td class="p-2.5 text-xs text-slate-600">' + u.dept + '</td>' +
          '<td class="p-2.5 font-mono text-xs">' + (u.phone || '-') + '</td>' +
          '<td class="p-2.5 text-right font-bold text-emerald-800">' + bal.toFixed(2) + '</td>' +
          '<td class="p-2.5 text-center"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ' + (u.role === 'admin' ? 'bg-amber-100 text-amber-800' : (u.role === 'finance' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-600')) + '">' + u.role + '</span></td>' +
        '</tr>';
      }).join('');
    }

    function renderAdminUserList() { filterAdminUserList(); }

    function filterAdminPriceList() { renderAdminPriceList(); }

    function renderAdminPriceList() {
      const tbody = $('adminPriceListBody');
      if (!tbody) return;
      tbody.innerHTML = (appData.prices || []).map((p, idx) =>
        '<tr class="hover:bg-slate-50">' +
          '<td class="p-2.5 font-mono font-bold text-emerald-800">' + p.code + '</td>' +
          '<td class="p-2.5 font-semibold text-slate-700">' + p.category + '</td>' +
          '<td class="p-2.5 font-bold text-slate-800">' + p.subType + '</td>' +
          '<td class="p-2.5 text-right font-bold text-emerald-700 text-base">' + Number(p.price).toFixed(2) + '</td>' +
        '</tr>'
      ).join('');
    }

    function filterAdminWithdrawalList() { renderAdminWithdrawalList(); }

    function renderAdminWithdrawalList() {
      const tbody = $('adminWithdrawalListBody');
      if (!tbody) return;
      if ((appData.withdrawals || []).length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-slate-400">ยังไม่มีรายการคำขอถอนเงิน</td></tr>';
        return;
      }
      tbody.innerHTML = appData.withdrawals.map((w, idx) =>
        '<tr class="hover:bg-slate-50">' +
          '<td class="p-2.5 font-mono text-[11px] font-bold text-slate-500">' + w.reqNo + '</td>' +
          '<td class="p-2.5 text-slate-500 text-xs">' + w.date + '</td>' +
          '<td class="p-2.5"><span class="font-bold">' + w.name + '</span> <span class="text-xs text-slate-400">(' + w.memberCode + ')</span></td>' +
          '<td class="p-2.5 text-right font-bold text-rose-700 text-base">' + Number(w.amount).toFixed(2) + '</td>' +
          '<td class="p-2.5 text-center"><span class="px-2.5 py-1 rounded-full text-xs font-bold ' + (w.status === 'อนุมัติแล้ว' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800') + '">' + w.status + '</span></td>' +
          '<td class="p-2.5 text-center">' +
            (w.status === 'รออนุมัติกองคลัง' ?
              '<button onclick="approveWithdrawalReq(\\'' + w.reqNo + '\\', true)" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold mr-1">อนุมัติ</button>' +
              '<button onclick="approveWithdrawalReq(\\'' + w.reqNo + '\\', false)" class="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-xs font-bold">ปฏิเสธ</button>' :
              '<span class="text-xs text-slate-400">เสร็จสิ้น</span>') +
          '</td>' +
        '</tr>'
      ).join('');
    }

    function approveWithdrawalReq(reqNo, isApproved) {
      const w = (appData.withdrawals || []).find(x => x.reqNo === reqNo);
      if (!w) return;
      const status = isApproved ? 'อนุมัติแล้ว' : 'ไม่อนุมัติ';
      w.status = status;
      w.approvedBy = currentUser ? currentUser.name : 'เจ้าหน้าที่กองคลัง';
      w.approvedAt = new Date().toLocaleDateString('th-TH');

      if (isApproved) {
        appData.memberBalances[w.memberCode] = (appData.memberBalances[w.memberCode] || 0) - Number(w.amount);
      }

      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            console.log('Withdrawal status updated in Sheets:', res);
          })
          .withFailureHandler(function(err) {
            console.warn('Sheets withdrawal status warning:', err);
          })
          .approveWithdrawal(reqNo, isApproved, currentUser ? currentUser.name : 'กองคลัง');
      }

      initApp();
      if (currentUser) selectUser(currentUser);
      alert('✅ ' + status + ' คำขอถอนเงินเลขที่ ' + reqNo + ' เรียบร้อยแล้ว');
    }

    function exportDataToCsv(sheetType) {
      let csv = '';
      let filename = 'Takhli_WasteBank.csv';
      if (sheetType === 'users') {
        csv = 'รหัสสมาชิก,ชื่อ-นามสกุล,สังกัด,เบอร์โทร,สิทธิ์,ยอดเงินคงเหลือ\\n' +
          (appData.users || []).map(u => '"' + u.code + '","' + u.name + '","' + u.dept + '","' + (u.phone || '') + '","' + u.role + '",' + ((appData.memberBalances && appData.memberBalances[u.code]) || 0)).join('\\n');
        filename = 'Sheet4_Users_Takhli.csv';
      } else if (sheetType === 'prices') {
        csv = 'รหัสขยะ,หมวดหมู่,ชนิดขยะย่อย,ราคาต่อหน่วย_บาท_กก\\n' +
          (appData.prices || []).map(p => '"' + p.code + '","' + p.category + '","' + p.subType + '",' + p.price).join('\\n');
        filename = 'Sheet1_PriceConfig_Takhli.csv';
      } else if (sheetType === 'deposits') {
        csv = 'เลขที่ใบเสร็จ,วันเวลา,รหัสสมาชิก,ชื่อสมาชิก,หมวดหมู่,ชนิดขยะ,น้ำหนัก_กก,ราคา,จำนวนเงิน_บาท,ผู้บันทึก\\n' +
          (appData.deposits || []).map(d => '"' + d.receipt + '","' + d.date + '","' + d.memberCode + '","' + d.name + '","' + d.category + '","' + d.subType + '",' + d.weight + ',' + d.unitPrice + ',' + d.total + ',"' + d.recordedBy + '"').join('\\n');
        filename = 'Sheet2_DepositLedger_Takhli.csv';
      } else if (sheetType === 'withdrawals') {
        csv = 'เลขที่คำขอ,วันเวลา,รหัสสมาชิก,ชื่อสมาชิก,จำนวนเงิน,สถานะ,ผู้อนุมัติ\\n' +
          (appData.withdrawals || []).map(w => '"' + w.reqNo + '","' + w.date + '","' + w.memberCode + '","' + w.name + '",' + w.amount + ',"' + w.status + '","' + (w.approvedBy || '') + '"').join('\\n');
        filename = 'Sheet3_WithdrawalLedger_Takhli.csv';
      }

      const blob = new Blob(['\\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    }

    function initApp() {
      try { renderUserSelector(); } catch(e) {}
      try { renderWasteSelector(); } catch(e) {}
      try { renderDashboard(); } catch(e) {}
      try { renderDepositTable(); } catch(e) {}
      try { renderPrices(); } catch(e) {}
      try { renderAdminUserList(); } catch(e) {}
      try { renderAdminPriceList(); } catch(e) {}
      try { renderAdminWithdrawalList(); } catch(e) {}
    }

    // Attach all functions explicitly to window for Google Apps Script HtmlService
    window.quickLogin = quickLogin;
    window.selectUser = selectUser;
    window.handleLoginSubmit = handleLoginSubmit;
    window.handleModalLoginSubmit = handleModalLoginSubmit;
    window.logout = logout;
    window.showLoginScreen = showLoginScreen;
    window.showAppScreen = showAppScreen;
    window.openRegisterModal = openRegisterModal;
    window.openAddUserModal = openAddUserModal;
    window.closeAddUserModal = closeAddUserModal;
    window.openLoginModal = openLoginModal;
    window.closeLoginModal = closeLoginModal;
    window.openAddPriceModal = openAddPriceModal;
    window.closeAddPriceModal = closeAddPriceModal;
    window.openThermalModal = openThermalModal;
    window.closeThermalModal = closeThermalModal;
    window.openPassbookPrintModal = openPassbookPrintModal;
    window.openPassbookModal = openPassbookModal;
    window.closePassbookModal = closePassbookModal;
    window.switchTab = switchTab;
    window.switchAdminSubTab = switchAdminSubTab;
    window.onWasteCategoryChanged = onWasteCategoryChanged;
    window.onWasteSelected = onWasteSelected;
    window.calculateDepositTotal = calculateDepositTotal;
    window.calculateSubTotal = calculateSubTotal;
    window.calculateWithdrawalSummary = calculateWithdrawalSummary;
    window.handleDepositSubmit = handleDepositSubmit;
    window.handleWithdrawalSubmit = handleWithdrawalSubmit;
    window.handleAddUserSubmit = handleAddUserSubmit;
    window.handleAddPriceSubmit = handleAddPriceSubmit;
    window.filterAdminUserList = filterAdminUserList;
    window.filterAdminPriceList = filterAdminPriceList;
    window.filterAdminWithdrawalList = filterAdminWithdrawalList;
    window.approveWithdrawalReq = approveWithdrawalReq;
    window.exportDataToCsv = exportDataToCsv;

    // Bootstrap function executed AFTER all declarations
    function bootstrap() {
      try {
        initApp();
      } catch(e) {
        console.warn('initApp note:', e);
      }

      try {
        const savedUserCode = safeStorage.get('takhli_wastebank_user');
        if (savedUserCode) {
          const found = (appData.users || []).find(u => u.code === savedUserCode);
          if (found) {
            selectUser(found);
          } else {
            showLoginScreen();
          }
        } else {
          showLoginScreen();
        }
      } catch(e) {
        showLoginScreen();
      }

      // Sync with Google Apps Script
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(serverData) {
            try {
              if (serverData && serverData.users && serverData.users.length > 0) {
                appData = serverData;
                initApp();
                if (currentUser) {
                  const refreshed = appData.users.find(u => u.code === currentUser.code);
                  if (refreshed) selectUser(refreshed);
                }
              }
            } catch(e) {
              console.warn('serverData handle error:', e);
            }
          })
          .withFailureHandler(function(err) {
            console.log('Background sheets sync note:', err);
          })
          .getInitialData();
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
      bootstrap();
    }
  </script>
</body>
</html>`;

const finalIndexHtml = htmlMarkup + cleanScript;

// 5. Build clean Code.gs
const cleanCodeGs = `/**
 * ====================================================================
 * โครงการธนาคารขยะดิจิทัล องค์การบริหารส่วนตำบลตาคลี จ.นครสวรรค์
 * รหัสไอดี Google Sheets: 17GTwer_lim6W7z3DO-W4I5u1waDAVZxxwCGiJGu0GDs
 * ====================================================================
 * 📁 ไฟล์ที่ 1: Code.gs (Apps Script Backend Logic)
 * มีฟังก์ชัน initializeSheets() สร้าง 5 แผ่นงานอัตโนมัติ
 * และฟังก์ชัน API รับ-ส่งข้อมูลกับหน้าเว็บ index.html
 * ====================================================================
 */

const SPREADSHEET_ID = "17GTwer_lim6W7z3DO-W4I5u1waDAVZxxwCGiJGu0GDs";
const MINIMUM_BALANCE = 50.00;

/**
 * ฟังก์ชันตรวจสอบและเชื่อมต่อกับ Google Spreadsheet
 * รองรับทั้งกรณี Script ผูกกับแผ่นงานโดยตรง หรือระบุ SPREADSHEET_ID
 */
function getSpreadsheet() {
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}

  try {
    if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "" && SPREADSHEET_ID !== "YOUR_SPREADSHEET_ID_HERE") {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      if (ss) return ss;
    }
  } catch (e) {}

  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * ⭐ 1. ฟังก์ชันสร้าง 5 แผ่นงานอัตโนมัติ (initializeSheets)
 * เลือกฟังก์ชันนี้แล้วกดปุ่ม "เรียกใช้ (Run)" 1 ครั้ง
 * ระบบจะเนรมิตโครงสร้างชีต 5 แผ่นงาน พร้อมรายชื่อพนักงาน 150 คนให้ทันที
 */
function initializeSheets() {
  const ss = getSpreadsheet();
  if (!ss) {
    throw new Error("ไม่สามารถเข้าถึง Google Spreadsheet ได้ กรุณาตรวจสอบสิทธิ์หรือ ID ของชีต");
  }

  // 1. Sheet: PriceConfig (ราคารับซื้อขยะ 4 หมวด)
  const priceSheet = getOrCreateSheet(ss, "PriceConfig", [
    "รหัสขยะ", "หมวดหมู่", "ชนิดขยะย่อย", "ราคาต่อหน่วย_บาท_กก", "วันที่อัปเดต", "ผู้แก้ไขล่าสุด"
  ]);
  if (priceSheet.getLastRow() <= 1) {
    priceSheet.appendRow(["W-P01", "กระดาษ", "กระดาษขาวดำ (A4/เอกสาร)", 4.50, new Date(), "ระบบ"]);
    priceSheet.appendRow(["W-P02", "กระดาษ", "กระดาษลัง/กล่องลูกฟูก", 3.00, new Date(), "ระบบ"]);
    priceSheet.appendRow(["W-PL01", "พลาสติก", "ขวดพลาสติกใส (PET)", 7.00, new Date(), "ระบบ"]);
    priceSheet.appendRow(["W-PL02", "พลาสติก", "พลาสติกขุ่น (HDPE)", 5.50, new Date(), "ระบบ"]);
    priceSheet.appendRow(["W-M01", "โลหะ", "กระป๋องอลูมิเนียม", 35.00, new Date(), "ระบบ"]);
    priceSheet.appendRow(["W-M02", "โลหะ", "เศษเหล็กหนา/เหล็กรวม", 6.00, new Date(), "ระบบ"]);
    priceSheet.appendRow(["W-G01", "แก้ว", "ขวดแก้วใส/ขวดเบียร์รวม", 1.50, new Date(), "ระบบ"]);
  }

  // 2. Sheet: DepositLedger (สมุดบัญชีรับฝากขยะ)
  getOrCreateSheet(ss, "DepositLedger", [
    "เลขที่ใบเสร็จ", "วันเวลา", "รหัสสมาชิก", "ชื่อสมาชิก", "สังกัด_กอง",
    "รหัสขยะ", "หมวดหมู่", "ชนิดขยะ", "น้ำหนัก_กก", "ราคาต่อหน่วย",
    "จำนวนเงิน_บาท", "ผู้บันทึก", "หมายเหตุ"
  ]);

  // 3. Sheet: WithdrawalLedger (ทะเบียนคำขอถอนเงินสด)
  getOrCreateSheet(ss, "WithdrawalLedger", [
    "เลขที่คำขอ", "วันเวลาที่ขอ", "รหัสสมาชิก", "ชื่อสมาชิก", "สังกัด_กอง",
    "จำนวนเงินที่ขอถอน", "ยอดคงเหลือก่อนถอน", "ยอดคงเหลือสุทธิ", "สถานะ",
    "วันเวลาอนุมัติ", "ผู้อนุมัติ_กองคลัง", "หมายเหตุ"
  ]);

  // 4. Sheet: Users (ฐานข้อมูลพนักงาน อบต.ตาคลี 150 คน)
  const usersSheet = getOrCreateSheet(ss, "Users", [
    "รหัสสมาชิก", "ชื่อ_นามสกุล", "สังกัด_กอง_สำนัก", "เลขบัตรประชาชน",
    "เบอร์โทรศัพท์", "อีเมล", "สิทธิ์ในระบบ", "รหัสผ่าน", "วันที่ลงทะเบียน", "สถานะ"
  ]);
  if (usersSheet.getLastRow() <= 1) {
    // 3 บัญชีหลักสำหรับทดสอบระบบ
    usersSheet.appendRow(["ADM01", "นายเฉลิมชัย ชนะพาล (แอดมิน)", "กองสาธารณสุขและสิ่งแวดล้อม", "1600100000011", "056-261-111", "admin@takhli.local", "admin", "password123", new Date(), "ปกติ"]);
    usersSheet.appendRow(["FIN01", "นางสาวสุดารัตน์ การเงิน", "กองคลัง", "1600100000022", "056-261-112", "finance@takhli.local", "finance", "password123", new Date(), "ปกติ"]);
    usersSheet.appendRow(["MB001", "นายสมชาย ใจดี", "สำนักปลัด", "1600100000033", "081-234-5678", "somchai@takhli.local", "member", "password123", new Date(), "ปกติ"]);

    // รายชื่อพนักงาน อบต.ตาคลี 150 คน กระจาย 5 กอง/สำนัก
    const depts = [
      "สำนักปลัด",
      "กองคลัง",
      "กองช่าง",
      "กองสาธารณสุขและสิ่งแวดล้อม",
      "กองการศึกษา ศาสนาและวัฒนธรรม"
    ];
    const firstNames = ["วิชัย", "สมบัติ", "ประสิทธิ์", "ประเสริฐ", "มนัส", "สมพร", "สมศักดิ์", "สุวรรณ", "กฤษดา", "ชำนาญ", "สุรชัย", "บุญมี", "อรุณ", "สายัณห์", "ณรงค์", "กมล", "ธีระ", "นิวัฒน์", "ทรงศักดิ์", "ชูชาติ", "มานพ", "วิเชียร", "อนันต์", "สมเกียรติ", "พิชัย", "สุนทร", "วิโรจน์", "วรพจน์", "ไพโรจน์", "ประจักษ์"];
    const lastNames = ["สุขสมบูรณ์", "คงเจริญ", "ทองดี", "เจริญผล", "มีโชค", "ใจมั่น", "มั่งคั่ง", "วงษ์สุวรรณ", "ศิริผล", "ยอดแก้ว", "สุขใจ", "บุญเกิด", "พุ่มพวง", "เกิดผล", "สุขเกษม", "รัตนพันธ์", "ชำนาญป่า", "จันทร์โอสถ", "มีทรัพย์", "แสงทอง", "บัวหลวง", "พรมมา", "สีใส", "คำแก้ว", "คำแพง", "ชัยชนะ", "จันทร์หอม", "บุญส่ง", "ทรัพย์สิน", "พิทักษ์"];

    const sampleUsers = [];
    for (let i = 2; i <= 150; i++) {
      const code = "MB" + String(i).padStart(3, "0");
      const fName = firstNames[(i - 2) % firstNames.length];
      const lName = lastNames[(i - 2) % lastNames.length];
      const name = (i % 2 === 0 ? "นาย" : "นางสาว") + fName + " " + lName;
      const dept = depts[(i - 2) % depts.length];
      const natId = "16001" + String(10000000 + i).slice(1);
      const phone = "08" + String(10000000 + (i * 739)).slice(1, 9);
      sampleUsers.push([code, name, dept, natId, phone, code.toLowerCase() + "@takhli.local", "member", "password123", new Date(), "ปกติ"]);
    }
    usersSheet.getRange(usersSheet.getLastRow() + 1, 1, sampleUsers.length, 10).setValues(sampleUsers);
  }

  // 5. Sheet: WelfareLedger (กองทุนสวัสดิการฌาปนกิจ)
  const welfareSheet = getOrCreateSheet(ss, "WelfareLedger", [
    "ลำดับ", "วันเวลา", "ประเภทรายการ", "รหัสสมาชิก", "ชื่อสมาชิก",
    "จำนวนเงิน_บาท", "ยอดคงเหลือกองทุน", "ผู้บันทึก", "หมายเหตุ"
  ]);
  if (welfareSheet.getLastRow() <= 1) {
    welfareSheet.appendRow([1, new Date(), "ยอดยกมาเริ่มต้น", "SYSTEM", "กองทุนสวัสดิการ อบต.ตาคลี", 4250.00, 4250.00, "กองคลัง", "กองทุนสมทบเริ่มต้น"]);
  }

  Logger.log("✅ สร้าง 5 แผ่นงานสำเร็จเรียบร้อยแล้ว!");
  return "✅ สร้าง 5 แผ่นงานสำหรับระบบธนาคารขยะดิจิทัล อบต.ตาคลี พร้อมรายชื่อสมาชิก 150 คน สำเร็จเรียบร้อยแล้ว!";
}

/**
 * 2. ฟังก์ชันแสดงหน้าเว็บ Web App (doGet)
 * โหลดไฟล์ index.html สำหรับรัน Web App
 */
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile("index")
    .setTitle("ระบบธนาคารขยะดิจิทัล องค์การบริหารส่วนตำบลตาคลี")
    .addMetaTag("viewport", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * 3. ฟังก์ชันรับข้อมูลผ่าน Webhook / POST จากภายนอก (doPost)
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: "No post data" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;

    if (action === "recordDeposit") {
      const res = recordDeposit(postData.data);
      return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === "submitWithdrawal") {
      const res = submitWithdrawal(postData.data);
      return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === "approveWithdrawal") {
      const res = approveWithdrawal(postData.reqNo, postData.isApproved, postData.approvedBy);
      return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === "registerUser") {
      const res = registerUser(postData.data);
      return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === "getInitialData") {
      const res = getInitialData();
      return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Unknown action: " + action }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 4. ฟังก์ชันดึงข้อมูลทั้งหมดสำหรับหน้าเว็บ (getInitialData)
 */
function getInitialData() {
  try {
    const ss = getSpreadsheet();
    if (!ss) {
      return { success: false, error: "Cannot access spreadsheet" };
    }

    // Auto-create sheets if missing
    if (!ss.getSheetByName("PriceConfig") || !ss.getSheetByName("Users")) {
      initializeSheets();
    }

    // 1. ราคารับซื้อ
    const priceSheet = ss.getSheetByName("PriceConfig");
    const prices = [];
    if (priceSheet && priceSheet.getLastRow() > 1) {
      const data = priceSheet.getRange(2, 1, priceSheet.getLastRow() - 1, 4).getValues();
      data.forEach(r => {
        if (r[0]) prices.push({ code: String(r[0]), category: String(r[1] || ""), subType: String(r[2] || ""), price: Number(r[3]) || 0 });
      });
    }

    // 2. สมาชิก 150 คน
    const usersSheet = ss.getSheetByName("Users");
    const users = [];
    if (usersSheet && usersSheet.getLastRow() > 1) {
      const data = usersSheet.getRange(2, 1, usersSheet.getLastRow() - 1, 8).getValues();
      data.forEach(r => {
        if (r[0]) {
          users.push({
            code: String(r[0]),
            name: String(r[1] || ""),
            dept: String(r[2] || ""),
            nationalId: String(r[3] || ""),
            phone: String(r[4] || ""),
            email: String(r[5] || ""),
            role: String(r[6] || "member"),
            password: String(r[7] || "password123")
          });
        }
      });
    }

    // 3. รายการฝากขยะ
    const depSheet = ss.getSheetByName("DepositLedger");
    const deposits = [];
    const memberBalances = {};
    if (depSheet && depSheet.getLastRow() > 1) {
      const data = depSheet.getRange(2, 1, depSheet.getLastRow() - 1, 12).getValues();
      data.forEach(r => {
        if (r[0]) {
          const amt = Number(r[10]) || 0;
          const uCode = String(r[2]);
          let dStr = "";
          if (r[1] instanceof Date) {
            dStr = Utilities.formatDate(r[1], "Asia/Bangkok", "dd/MM/yyyy HH:mm");
          } else {
            dStr = String(r[1] || "");
          }
          deposits.unshift({
            receipt: String(r[0]),
            date: dStr,
            memberCode: uCode,
            name: String(r[3] || ""),
            dept: String(r[4] || ""),
            wasteCode: String(r[5] || ""),
            category: String(r[6] || ""),
            subType: String(r[7] || ""),
            weight: Number(r[8]) || 0,
            unitPrice: Number(r[9]) || 0,
            total: amt,
            recordedBy: String(r[11] || "")
          });
          memberBalances[uCode] = (memberBalances[uCode] || 0) + amt;
        }
      });
    }

    // 4. คำขอถอนเงิน
    const wdrSheet = ss.getSheetByName("WithdrawalLedger");
    const withdrawals = [];
    if (wdrSheet && wdrSheet.getLastRow() > 1) {
      const data = wdrSheet.getRange(2, 1, wdrSheet.getLastRow() - 1, 11).getValues();
      data.forEach(r => {
        if (r[0]) {
          const amt = Number(r[5]) || 0;
          const uCode = String(r[2]);
          const status = String(r[8] || "");
          let dStr = r[1] instanceof Date ? Utilities.formatDate(r[1], "Asia/Bangkok", "dd/MM/yyyy HH:mm") : String(r[1] || "");
          let appStr = r[9] instanceof Date ? Utilities.formatDate(r[9], "Asia/Bangkok", "dd/MM/yyyy HH:mm") : String(r[9] || "");
          withdrawals.unshift({
            reqNo: String(r[0]),
            date: dStr,
            memberCode: uCode,
            name: String(r[3] || ""),
            dept: String(r[4] || ""),
            amount: amt,
            status: status,
            approvedAt: appStr,
            approvedBy: String(r[10] || "")
          });
          if (status === "อนุมัติแล้ว" || status === "จ่ายเงินสดเรียบร้อย") {
            memberBalances[uCode] = (memberBalances[uCode] || 0) - amt;
          }
        }
      });
    }

    // 5. สวัสดิการ
    const welfareSheet = ss.getSheetByName("WelfareLedger");
    let welfareBal = 4250.00;
    if (welfareSheet && welfareSheet.getLastRow() > 1) {
      const lastRowVal = welfareSheet.getRange(welfareSheet.getLastRow(), 7).getValue();
      if (lastRowVal) welfareBal = Number(lastRowVal) || 4250.00;
    }

    return {
      success: true,
      prices: prices,
      users: users,
      deposits: deposits,
      withdrawals: withdrawals,
      memberBalances: memberBalances,
      welfare: { balance: welfareBal }
    };
  } catch(err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * 5. ฟังก์ชันบันทึกการฝากขยะ (recordDeposit)
 */
function recordDeposit(data) {
  try {
    const ss = getSpreadsheet();
    const sheet = getOrCreateSheet(ss, "DepositLedger", [
      "เลขที่ใบเสร็จ", "วันเวลา", "รหัสสมาชิก", "ชื่อสมาชิก", "สังกัด_กอง",
      "รหัสขยะ", "หมวดหมู่", "ชนิดขยะ", "น้ำหนัก_กก", "ราคาต่อหน่วย",
      "จำนวนเงิน_บาท", "ผู้บันทึก", "หมายเหตุ"
    ]);

    const receiptNo = generateReceiptNumber(sheet);
    const date = new Date();
    const dateStr = Utilities.formatDate(date, "Asia/Bangkok", "dd/MM/yyyy HH:mm");
    const weight = Number(data.weight) || 0;
    const unitPrice = Number(data.unitPrice) || 0;
    const total = Math.round(weight * unitPrice * 100) / 100;

    sheet.appendRow([
      receiptNo,
      date,
      data.memberCode,
      data.memberName,
      data.dept || "อบต.ตาคลี",
      data.wasteCode,
      data.category,
      data.subType,
      weight,
      unitPrice,
      total,
      data.recordedBy || "เจ้าหน้าที่",
      data.note || ""
    ]);

    return {
      success: true,
      receiptNumber: receiptNo,
      totalAmount: total,
      date: dateStr
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * 6. ฟังก์ชันส่งคำขอถอนเงินสด (submitWithdrawal)
 */
function submitWithdrawal(data) {
  try {
    const ss = getSpreadsheet();
    const depSheet = ss.getSheetByName("DepositLedger");
    const wdrSheet = getOrCreateSheet(ss, "WithdrawalLedger", [
      "เลขที่คำขอ", "วันเวลาที่ขอ", "รหัสสมาชิก", "ชื่อสมาชิก", "สังกัด_กอง",
      "จำนวนเงินที่ขอถอน", "ยอดคงเหลือก่อนถอน", "ยอดคงเหลือสุทธิ", "สถานะ",
      "วันเวลาอนุมัติ", "ผู้อนุมัติ_กองคลัง", "หมายเหตุ"
    ]);

    const currentBalance = calculateUserBalance(depSheet, wdrSheet, data.memberCode);
    const withdrawAmount = Number(data.amount) || 0;

    if (withdrawAmount <= 0) {
      return { success: false, error: "จำนวนเงินที่ขอถอนต้องมากกว่า 0 บาท" };
    }
    if ((currentBalance - withdrawAmount) < MINIMUM_BALANCE) {
      return {
        success: false,
        error: "ยอดเงินคงเหลือหลังการถอนต้องไม่น้อยกว่า " + MINIMUM_BALANCE.toFixed(2) + " บาท (ยอดคงเหลือปัจจุบัน: " + currentBalance.toFixed(2) + " บาท)"
      };
    }

    const reqNo = "WDR-" + Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyyMMdd") + "-" + String(wdrSheet.getLastRow()).padStart(3, "0");
    const netBalance = Math.round((currentBalance - withdrawAmount) * 100) / 100;

    wdrSheet.appendRow([
      reqNo,
      new Date(),
      data.memberCode,
      data.memberName,
      data.dept || "อบต.ตาคลี",
      withdrawAmount,
      currentBalance,
      netBalance,
      "รออนุมัติกองคลัง",
      "",
      "",
      data.note || "ขอรับเงินสด ณ กองคลัง อบต.ตาคลี"
    ]);

    return {
      success: true,
      reqNo: reqNo,
      currentBalance: currentBalance,
      withdrawAmount: withdrawAmount,
      netBalance: netBalance
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * 7. ฟังก์ชันอนุมัติการถอนเงิน (approveWithdrawal)
 */
function approveWithdrawal(reqNo, isApproved, approvedBy) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName("WithdrawalLedger");
    if (!sheet) return { success: false, error: "ไม่พบแผ่นงาน WithdrawalLedger" };

    const data = sheet.getDataRange().getValues();
    let foundRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(reqNo).trim()) {
        foundRow = i + 1;
        break;
      }
    }

    if (foundRow === -1) {
      return { success: false, error: "ไม่พบคำขอเลขที่: " + reqNo };
    }

    const newStatus = isApproved ? "อนุมัติแล้ว" : "ไม่อนุมัติ";
    sheet.getRange(foundRow, 9).setValue(newStatus);
    sheet.getRange(foundRow, 10).setValue(new Date());
    sheet.getRange(foundRow, 11).setValue(approvedBy || "เจ้าหน้าที่กองคลัง");

    return { success: true, reqNo: reqNo, status: newStatus };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * 8. ฟังก์ชันลงทะเบียนสมาชิกใหม่ (registerUser)
 */
function registerUser(data) {
  try {
    const ss = getSpreadsheet();
    const sheet = getOrCreateSheet(ss, "Users", [
      "รหัสสมาชิก", "ชื่อ_นามสกุล", "สังกัด_กอง_สำนัก", "เลขบัตรประชาชน",
      "เบอร์โทรศัพท์", "อีเมล", "สิทธิ์ในระบบ", "รหัสผ่าน", "วันที่ลงทะเบียน", "สถานะ"
    ]);

    const newRow = sheet.getLastRow();
    const newCode = data.code || ("MB" + String(newRow).padStart(3, "0"));
    sheet.appendRow([
      newCode,
      data.name,
      data.dept,
      data.nationalId || "",
      data.phone || "",
      data.email || (newCode.toLowerCase() + "@takhli.local"),
      data.role || "member",
      data.password || "password123",
      new Date(),
      "ปกติ"
    ]);

    return {
      success: true,
      user: {
        code: newCode,
        name: data.name,
        dept: data.dept,
        role: data.role || "member",
        password: data.password || "password123"
      }
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * 9. ฟังก์ชันอัปเดตราคารับซื้อ (updatePrice)
 */
function updatePrice(data) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName("PriceConfig");
    if (!sheet) return { success: false, error: "ไม่พบแผ่นงาน PriceConfig" };

    const rows = sheet.getDataRange().getValues();
    let updated = false;

    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === String(data.code).trim()) {
        sheet.getRange(i + 1, 4).setValue(Number(data.price) || 0);
        sheet.getRange(i + 1, 5).setValue(new Date());
        sheet.getRange(i + 1, 6).setValue(data.updatedBy || "แอดมิน");
        updated = true;
        break;
      }
    }

    if (!updated) {
      sheet.appendRow([data.code, data.category, data.subType, Number(data.price) || 0, new Date(), data.updatedBy || "แอดมิน"]);
    }

    return { success: true, code: data.code, price: Number(data.price) || 0 };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * ฟังก์ชันผู้ช่วย: ดึงหรือสร้างชีต
 */
function getOrCreateSheet(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#d1fae5");
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

/**
 * ฟังก์ชันผู้ช่วย: สร้างเลขที่ใบเสร็จ RCP-
 */
function generateReceiptNumber(sheet) {
  const dateStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyyMMdd");
  const count = sheet ? Math.max(1, sheet.getLastRow()) : 1;
  return "RCP-" + dateStr + "-" + String(count).padStart(4, "0");
}

/**
 * ฟังก์ชันผู้ช่วย: คำนวณยอดเงินคงเหลือของสมาชิก
 */
function calculateUserBalance(depSheet, wdrSheet, userCode) {
  let totalDeposits = 0;
  let totalWithdrawals = 0;

  if (depSheet && depSheet.getLastRow() > 1) {
    const depData = depSheet.getRange(2, 1, depSheet.getLastRow() - 1, 11).getValues();
    depData.forEach(r => {
      if (String(r[2]).trim() === String(userCode).trim()) {
        totalDeposits += Number(r[10]) || 0;
      }
    });
  }

  if (wdrSheet && wdrSheet.getLastRow() > 1) {
    const wdrData = wdrSheet.getRange(2, 1, wdrSheet.getLastRow() - 1, 9).getValues();
    wdrData.forEach(r => {
      if (String(r[2]).trim() === String(userCode).trim() && (r[8] === "อนุมัติแล้ว" || r[8] === "จ่ายเงินสดเรียบร้อย")) {
        totalWithdrawals += Number(r[5]) || 0;
      }
    });
  }

  return Math.round((totalDeposits - totalWithdrawals) * 100) / 100;
}`;

// Combine into gasTemplates.ts
const newTemplatesContent = `/**
 * Google Apps Script Templates (All-in-One and Separated versions)
 */

export const GAS_INDEX_HTML = \`${finalIndexHtml.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`;

export const GAS_CODE_GS = \`${cleanCodeGs.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`;
`;

fs.writeFileSync(gasTemplatesPath, newTemplatesContent, 'utf8');
console.log("Updated gasTemplates.ts successfully!");

// Write standalone files into public/gas/
fs.mkdirSync(path.resolve('./public/gas'), { recursive: true });
fs.writeFileSync(path.resolve('./public/gas/index.html'), finalIndexHtml, 'utf8');
fs.writeFileSync(path.resolve('./public/gas/Code.gs'), cleanCodeGs, 'utf8');
console.log("Written public/gas/index.html and public/gas/Code.gs!");

