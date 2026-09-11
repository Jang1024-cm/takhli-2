const fs = require("fs");

let html = fs.readFileSync("public/gas/index.html", "utf8");

// 1. Fix error msg element styling
html = html.replace(
  'id="loginScreenErrorMsg" style="display: none !important;" class="text-xs text-rose-600 font-bold hidden p-2.5 bg-rose-50 border border-rose-200 rounded-xl"',
  'id="loginScreenErrorMsg" style="display: none;" class="text-xs text-rose-600 font-bold hidden p-3 bg-rose-50 border border-rose-200 rounded-xl"'
);

// 2. Change submit button in login form to type="submit" so Enter key works seamlessly
html = html.replace(
  '<button type="button" onclick="handleLoginSubmit(event)" class="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer flex items-center justify-center space-x-2">',
  '<button id="btnLoginSubmit" type="submit" class="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer flex items-center justify-center space-x-2">'
);

// 3. Update quickLogin & handleLoginSubmit logic
const startTarget = "function quickLogin(code) {";
const endTarget = "function handleModalLoginSubmit(e) {";

const startIndex = html.indexOf(startTarget);
const endIndex = html.indexOf(endTarget);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `function findUserByIdentifier(rawId) {
      const users = (appData && appData.users && appData.users.length > 0) ? appData.users : initialUsers;
      if (!rawId || String(rawId).trim() === '') {
        return users.find(u => u.code === 'ADM01') || users[0];
      }
      const id = String(rawId).trim().toLowerCase();

      // 1. Alias & Keyword shortcuts
      if (['admin', 'แอดมิน', 'ผู้ดูแลระบบ', 'adm', 'administrator', 'root', 'เฉลิมชัย'].includes(id)) {
        return users.find(u => u.code === 'ADM01') || { code: 'ADM01', name: 'นายเฉลิมชัย ชนะพาล (แอดมิน)', dept: 'กองสาธารณสุขและสิ่งแวดล้อม', phone: '056-261-111', role: 'admin', password: 'password123' };
      }
      if (['finance', 'fin', 'การเงิน', 'กองคลัง', 'คลัง', 'สุดารัตน์', 'cashier'].includes(id)) {
        return users.find(u => u.code === 'FIN01') || { code: 'FIN01', name: 'นางสาวสุดารัตน์ การเงิน', dept: 'กองคลัง', phone: '056-261-112', role: 'finance', password: 'password123' };
      }
      if (['member', 'สมาชิก', 'สมชาย', 'somchai', 'user', 'ผู้ใช้', 'mb', 'mb001', '1', '01', '001'].includes(id)) {
        return users.find(u => u.code === 'MB001') || { code: 'MB001', name: 'นายสมชาย ใจดี', dept: 'สำนักปลัด', phone: '081-234-5678', role: 'member', password: 'password123' };
      }

      // 2. Exact matches
      let found = users.find(u => 
        (u.code && u.code.toLowerCase() === id) ||
        (u.nationalId && String(u.nationalId).trim() === id) ||
        (u.phone && String(u.phone).trim() === id) ||
        (u.email && u.email.toLowerCase() === id)
      );
      if (found) return found;

      // 3. Numeric ID (e.g. 2 -> MB002)
      if (/^\\d+$/.test(id)) {
        const padded = 'MB' + id.padStart(3, '0');
        found = users.find(u => u.code === padded);
        if (found) return found;
      }

      // 4. Fuzzy / partial match
      found = users.find(u => 
        (u.name && u.name.toLowerCase().includes(id)) ||
        (u.email && u.email.toLowerCase().startsWith(id)) ||
        (u.role && u.role.toLowerCase() === id) ||
        (u.code && u.code.toLowerCase().includes(id))
      );
      if (found) return found;

      return null;
    }

    function quickLogin(code) {
      try {
        const sIdEl = $('loginScreenIdentifier');
        if (sIdEl) sIdEl.value = code;
        const u = findUserByIdentifier(code);
        if (u) {
          selectUser(u);
          showAppScreen();
          switchTab('dashboard');
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

      const found = findUserByIdentifier(id);

      if (!found) {
        if (err) {
          err.textContent = '❌ ไม่พบชื่อผู้ใช้งาน หรือรหัสสมาชิกนี้ในระบบ (กดเลือก 1-Click Login ด้านบน หรือพิมพ์ admin)';
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
      switchTab('dashboard');
      return false;
    }

    `;

  html = html.substring(0, startIndex) + replacement + html.substring(endIndex);
  console.log("Replaced login functions successfully!");
} else {
  console.error("Could not find start/end markers for login logic!");
}

// 4. Add window.handleLogout and window.reloadAllData
const oldWindowAttach = "window.exportDataToCsv = exportDataToCsv;";
const newWindowAttach = `window.exportDataToCsv = exportDataToCsv;
    window.handleLogout = logout;
    window.reloadAllData = function() {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(serverData) {
            if (serverData && serverData.users && serverData.users.length > 0) {
              appData = serverData;
              initApp();
              if (currentUser) {
                const ref = appData.users.find(u => u.code === currentUser.code);
                if (ref) selectUser(ref);
              }
              alert('✅ รีเฟรชและซิงค์ข้อมูลชีตล่าสุดเรียบร้อยแล้ว');
            }
          })
          .withFailureHandler(function(e) {
            alert('⚠️ ซิงค์ข้อมูล: ' + (e.message || e));
          })
          .getInitialData();
      } else {
        initApp();
        alert('✅ อัปเดตข้อมูลระบบเรียบร้อย');
      }
    };`;

if (html.includes(oldWindowAttach)) {
  html = html.replace(oldWindowAttach, newWindowAttach);
  console.log("Added window.handleLogout and reloadAllData!");
}

fs.writeFileSync("public/gas/index.html", html, "utf8");
console.log("Successfully wrote public/gas/index.html!");
