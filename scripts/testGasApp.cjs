const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

console.log("Running comprehensive JSDOM test suite on GAS_INDEX_HTML...");

// Read public/gas/index.html
const rawHtml = fs.readFileSync(path.resolve('./public/gas/index.html'), 'utf8');

const dom = new JSDOM(rawHtml, {
  runScripts: "dangerously",
  resources: "usable",
  url: "https://script.google.com/macros/s/AKfycbxTest/exec"
});

const { window } = dom;
const { document } = window;

function assert(condition, message) {
  if (!condition) {
    console.error("❌ FAILED:", message);
    process.exit(1);
  } else {
    console.log("✅ PASSED:", message);
  }
}

// 1. Initial State Check
const loginView = document.getElementById('loginScreenView');
const appView = document.getElementById('appMainView');
const authModal = document.getElementById('authModal');
const addUserModal = document.getElementById('addUserModal');
const addPriceModal = document.getElementById('addPriceModal');
const thermalReceiptModal = document.getElementById('thermalReceiptModal');
const passbookModal = document.getElementById('passbookModal');

assert(loginView !== null, "loginScreenView exists in DOM");
assert(appView !== null, "appMainView exists in DOM");
assert(loginView.style.display.includes('flex'), "loginScreenView has display: flex");
assert(appView.style.display.includes('none'), "appMainView has display: none");
assert(authModal.style.display.includes('none'), "authModal has display: none (no overlay)");
assert(addUserModal.style.display.includes('none'), "addUserModal has display: none (no overlay)");
assert(addPriceModal.style.display.includes('none'), "addPriceModal has display: none (no overlay)");
assert(thermalReceiptModal.style.display.includes('none'), "thermalReceiptModal has display: none (no overlay)");
assert(passbookModal.style.display.includes('none'), "passbookModal has display: none (no overlay)");

// 2. Window Globals Check
const requiredGlobals = [
  'quickLogin', 'selectUser', 'handleLoginSubmit', 'openRegisterModal',
  'closeAddUserModal', 'openLoginModal', 'closeLoginModal', 'openAddPriceModal',
  'closeAddPriceModal', 'openThermalModal', 'closeThermalModal', 'openPassbookPrintModal',
  'closePassbookModal', 'switchTab', 'switchAdminSubTab', 'calculateDepositTotal',
  'calculateWithdrawalSummary', 'handleDepositSubmit', 'handleWithdrawalSubmit',
  'handleAddUserSubmit', 'handleAddPriceSubmit', 'logout', 'showLoginScreen', 'showAppScreen'
];

requiredGlobals.forEach(fn => {
  assert(typeof window[fn] === 'function', `Global function window.${fn} is defined`);
});

// 3. Test Quick Login (Admin)
console.log("\n--- Testing Quick Login (Admin) ---");
window.quickLogin('ADM01');

assert(loginView.style.display.includes('none'), "loginScreenView is now hidden after login");
assert(appView.style.display.includes('flex'), "appMainView is now visible after login");
assert(window.currentUser !== null, "currentUser is set");
assert(window.currentUser.code === 'ADM01', "currentUser code is ADM01");
assert(window.currentUser.role === 'admin', "currentUser role is admin");
assert(document.getElementById('userDisplayName').textContent.includes('เฉลิมชัย'), "Header displays admin name");

// 4. Test Tab Switching
console.log("\n--- Testing Tab Switching ---");
window.switchTab('deposit');
assert(document.getElementById('tabContentDeposit').style.display.includes('block'), "Deposit tab is active");
assert(document.getElementById('tabContentDashboard').style.display.includes('none'), "Dashboard tab is hidden");

window.switchTab('withdraw');
assert(document.getElementById('tabContentWithdraw').style.display.includes('block'), "Withdraw tab is active");

window.switchTab('admin');
assert(document.getElementById('tabContentAdmin').style.display.includes('block'), "Admin tab is active");

// 5. Test Register Modal
console.log("\n--- Testing Modal Controls ---");
window.openRegisterModal();
assert(addUserModal.style.display.includes('flex'), "addUserModal opened with display: flex");

window.closeAddUserModal();
assert(addUserModal.style.display.includes('none'), "addUserModal closed with display: none");

// 6. Test Logout
console.log("\n--- Testing Logout ---");
window.logout();
assert(loginView.style.display.includes('flex'), "loginScreenView is visible after logout");
assert(appView.style.display.includes('none'), "appMainView is hidden after logout");
assert(window.currentUser === null, "currentUser is cleared after logout");

// 7. Test Manual Login with Form Submit
console.log("\n--- Testing Manual Form Login ---");
const idInput = document.getElementById('loginScreenIdentifier');
const passInput = document.getElementById('loginScreenPassword');
idInput.value = 'MB001';
passInput.value = 'password123';

const submitEvt = { preventDefault: () => {}, stopPropagation: () => {} };
window.handleLoginSubmit(submitEvt);

assert(appView.style.display.includes('flex'), "appMainView is visible after manual login");
assert(window.currentUser !== null && window.currentUser.code === 'MB001', "currentUser is MB001");
assert(document.getElementById('userDisplayName').textContent.includes('สมชาย'), "Header displays member name");

// 8. Test Quick Login as Finance
console.log("\n--- Testing Quick Login (Finance) ---");
window.quickLogin('FIN01');
assert(window.currentUser.role === 'finance', "Switched to finance user");
assert(document.getElementById('userDisplayName').textContent.includes('สุดารัตน์'), "Header displays finance user name");

console.log("\n🎉 ALL JSDOM BROWSER TESTS PASSED 100%!");
