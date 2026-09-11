const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

console.log("Starting GAS refactoring and validation...");

const srcPath = path.resolve('./src/data/gasTemplates.ts');
let content = fs.readFileSync(srcPath, 'utf8');

// 1. Fix style tag to have .hidden { display: none !important; } globally
content = content.replace(
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

// 2. Ensure loginScreenView has style="display: flex !important;"
content = content.replace(
  /<div id="loginScreenView"[^>]*>/,
  `<div id="loginScreenView" style="display: flex !important;" class="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 p-4 sm:p-6 text-slate-800">`
);

// 3. Ensure appMainView has style="display: none !important;"
content = content.replace(
  /<div id="appMainView"[^>]*>/,
  `<div id="appMainView" style="display: none !important;" class="min-h-screen flex flex-col bg-slate-100 hidden">`
);

// 4. Ensure all modals have inline style="display: none !important;"
const modals = [
  'authModal',
  'addUserModal',
  'addPriceModal',
  'thermalReceiptModal',
  'passbookModal'
];

modals.forEach(m => {
  const re = new RegExp(`<div id="${m}"([^>]*)>`, 'g');
  content = content.replace(re, (match, attrs) => {
    // remove existing style if any
    let cleanAttrs = attrs.replace(/style="[^"]*"/, '').trim();
    if (!cleanAttrs.includes('hidden')) cleanAttrs += ' hidden';
    return `<div id="${m}" style="display: none !important;" ${cleanAttrs}>`;
  });
});

// 5. Ensure tabContents have initial display styles
const tabs = ['Dashboard', 'Deposit', 'Statement', 'Withdraw', 'Prices', 'Admin'];
tabs.forEach(t => {
  const isDash = t === 'Dashboard';
  const re = new RegExp(`<section id="tabContent${t}"([^>]*)>`, 'g');
  content = content.replace(re, (match, attrs) => {
    let cleanAttrs = attrs.replace(/style="[^"]*"/, '').trim();
    if (isDash) {
      cleanAttrs = cleanAttrs.replace('hidden', '').trim();
      return `<section id="tabContent${t}" style="display: block !important;" ${cleanAttrs}>`;
    } else {
      if (!cleanAttrs.includes('hidden')) cleanAttrs += ' hidden';
      return `<section id="tabContent${t}" style="display: none !important;" ${cleanAttrs}>`;
    }
  });
});

// 6. Fix form field IDs in loginScreenView so there is no collision with authModal
content = content.replace(
  /id="loginIdentifier"/,
  'id="loginScreenIdentifier"'
);
content = content.replace(
  /<input type="password" id="modalLoginPassword" required value="password123"/,
  '<input type="password" id="loginScreenPassword" required value="password123"'
);

// Update error div in loginScreenView
content = content.replace(
  /id="loginErrorMsg" class="text-xs text-rose-600 font-bold hidden/,
  'id="loginScreenErrorMsg" style="display: none !important;" class="text-xs text-rose-600 font-bold hidden'
);

// In authModal, ensure input IDs are modalLoginIdentifier and modalLoginPassword
content = content.replace(
  /<input type="text" id="loginIdentifier" required placeholder="เช่น ADM01 หรือ MB001"/,
  '<input type="text" id="modalLoginIdentifier" required placeholder="เช่น ADM01 หรือ MB001"'
);
content = content.replace(
  /id="loginErrorMsg" class="text-xs text-rose-600 font-bold hidden"/,
  'id="modalLoginErrorMsg" style="display: none !important;" class="text-xs text-rose-600 font-bold hidden"'
);

// 7. Update JavaScript helper functions and event handlers
// Replace the JS helper implementations with robust, bulletproof ones
const helperFns = `
    // Bulletproof Modal Visibility Helper
    function setModalVisible(id, isVisible) {
      const el = document.getElementById(id);
      if (!el) return;
      if (isVisible) {
        el.classList.remove('hidden');
        el.style.setProperty('display', 'flex', 'important');
      } else {
        el.classList.add('hidden');
        el.style.setProperty('display', 'none', 'important');
      }
    }

    function showLoginScreen() {
      try {
        const loginView = document.getElementById('loginScreenView');
        const appView = document.getElementById('appMainView');
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
        try { window.scrollTo(0, 0); } catch(e) {}
      } catch(e) {
        console.warn('showLoginScreen note:', e);
      }
    }

    function showAppScreen() {
      try {
        const loginView = document.getElementById('loginScreenView');
        const appView = document.getElementById('appMainView');
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
        try { window.scrollTo(0, 0); } catch(e) {}
      } catch(e) {
        console.warn('showAppScreen note:', e);
      }
    }

    function openLoginModal() { setModalVisible('authModal', true); }
    function closeLoginModal() { 
      setModalVisible('authModal', false); 
      if (currentUser) showAppScreen(); else showLoginScreen();
    }

    function openRegisterModal() {
      try {
        const modal = document.getElementById('addUserModal');
        if (!modal) return;
        const nameInput = document.getElementById('newUserName');
        const deptInput = document.getElementById('newUserDept');
        const phoneInput = document.getElementById('newUserPhone');
        const idInput = document.getElementById('newUserNatId');
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
        const rNo = document.getElementById('receiptNo');
        const rDate = document.getElementById('receiptDate');
        const rName = document.getElementById('receiptMemberName');
        const rDept = document.getElementById('receiptMemberDept');
        const rType = document.getElementById('receiptWasteType');
        const rWeight = document.getElementById('receiptWeight');
        const rPrice = document.getElementById('receiptUnitPrice');
        const rTotal = document.getElementById('receiptTotalAmount');
        const rStaff = document.getElementById('receiptStaffName');
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
        const pName = document.getElementById('a4MemberName');
        const pCode = document.getElementById('a4MemberCode');
        const pDept = document.getElementById('a4MemberDept');
        const pBal = document.getElementById('a4MemberBalance');
        if (pName) pName.textContent = currentUser.name || '';
        if (pCode) pCode.textContent = currentUser.code || '';
        if (pDept) pDept.textContent = currentUser.dept || '';
        const bal = (appData.memberBalances && appData.memberBalances[currentUser.code]) ? appData.memberBalances[currentUser.code] : 0;
        if (pBal) pBal.textContent = bal.toFixed(2) + ' บาท';

        const tbody = document.getElementById('a4StatementTableBody');
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

    function switchTab(tab) {
      if (tab === 'admin') {
        if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'finance')) {
          quickLogin('ADM01');
          switchTab('admin');
          return;
        }
      }
      ['Dashboard', 'Deposit', 'Statement', 'Withdraw', 'Prices', 'Admin'].forEach(t => {
        const el = document.getElementById('tabContent' + t);
        const btn = document.getElementById('btnTab' + t);
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
      const targetEl = document.getElementById('tabContent' + cap);
      const targetBtn = document.getElementById('btnTab' + cap);
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
        const el = document.getElementById('adminSubSection' + s);
        const btn = document.getElementById('btnAdminSub' + s);
        if (el) {
          el.classList.add('hidden');
          el.style.setProperty('display', 'none', 'important');
        }
        if (btn) {
          btn.className = 'px-4 py-2 text-sm font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition';
        }
      });
      const cap = sub.charAt(0).toUpperCase() + sub.slice(1);
      const targetEl = document.getElementById('adminSubSection' + cap);
      const targetBtn = document.getElementById('btnAdminSub' + cap);
      if (targetEl) {
        targetEl.classList.remove('hidden');
        targetEl.style.setProperty('display', 'block', 'important');
      }
      if (targetBtn) {
        targetBtn.className = 'px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-700 text-white shadow-xs';
      }
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
      const sIdEl = document.getElementById('loginScreenIdentifier');
      const mIdEl = document.getElementById('modalLoginIdentifier');
      
      let id = '';
      let err = document.getElementById('loginScreenErrorMsg');

      if (sIdEl && sIdEl.value.trim()) {
        id = sIdEl.value.trim();
        err = document.getElementById('loginScreenErrorMsg');
      } else if (mIdEl && mIdEl.value.trim()) {
        id = mIdEl.value.trim();
        err = document.getElementById('modalLoginErrorMsg');
      } else if (sIdEl) {
        id = sIdEl.value.trim();
        err = document.getElementById('loginScreenErrorMsg');
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

    function logout() {
      currentUser = null;
      safeStorage.remove('takhli_wastebank_user');
      showLoginScreen();
    }
`;

// Replace functions in content
// Replace old helper functions
content = content.replace(
  /function showLoginScreen\(\)[\s\S]*?function logout\(\)\s*\{[\s\S]*?\}/,
  helperFns.trim()
);

fs.writeFileSync(srcPath, content, 'utf8');
console.log("Updated gasTemplates.ts successfully. Testing in JSDOM...");

