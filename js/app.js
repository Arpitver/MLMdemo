(() => {
  "use strict";

  const STORE_KEY = "npmlm2";
  const app = document.getElementById("app");
  const toast = document.getElementById("toast");
  const packages = { Starter: 2500, Silver: 5000, Gold: 10000, Platinum: 25000, Diamond: 50000, Elite: 100000 };
  const plans = [
    { name: "30 Day Builder", days: 30, rate: 3, featured: false },
    { name: "60 Day Growth", days: 60, rate: 7, featured: true },
    { name: "90 Day Premier", days: 90, rate: 12, featured: false }
  ];
  const navItems = [
    ["dashboard", "⌂", "Dashboard"], ["network", "⌘", "My Network"],
    ["wallet", "◈", "Wallet"], ["investments", "◷", "Investments"],
    ["activity", "↕", "Activity"], ["notices", "▤", "Notice Board"],
    ["profile", "◉", "My Profile"], ["admin", "⚙", "Admin Console"]
  ];
  let state;
  let currentUser = null;
  let page = "dashboard";
  let pendingLogin = null;
  let toastTimer;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
  const money = (value) => new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0
  }).format(Number(value) || 0);
  const dateLabel = (value) => new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const initials = (name) => String(name || "?").split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
  const activeUser = () => state.users.find((user) => user.id === currentUser.id);
  const allMembers = () => state.users.filter((user) => user.role === "member");
  const isAdmin = () => currentUser && currentUser.role === "admin";
  const uid = (prefix) => `${prefix}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const now = () => new Date().toISOString();

  async function hashPassword(value) {
    if (!window.crypto?.subtle) throw new Error("Secure password hashing is unavailable. Open the app from a local web server.");
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function seedState() {
    const users = [
      { id: "admin", name: "NetPro Admin", role: "admin", passHash: "", balance: 0, package: "Admin", sponsor: "", parent: "", side: "", bank: "", phone: "—", address: "HQ" },
      { id: "NP1002", name: "Aarav Sharma", role: "member", passHash: "", balance: 18450, package: "Gold", sponsor: "admin", parent: "", side: "", bank: "HDFC •••• 4821", phone: "+91 98765 43210", address: "Pune, Maharashtra" },
      { id: "NP1003", name: "Diya Patel", role: "member", passHash: "", balance: 12700, package: "Silver", sponsor: "NP1002", parent: "NP1002", side: "left", bank: "ICICI •••• 1692", phone: "+91 98765 10003", address: "Ahmedabad, Gujarat" },
      { id: "NP1005", name: "Kabir Verma", role: "member", passHash: "", balance: 9200, package: "Starter", sponsor: "NP1002", parent: "NP1002", side: "right", bank: "SBI •••• 5105", phone: "+91 98765 10005", address: "Jaipur, Rajasthan" },
      { id: "NP1006", name: "Meera Iyer", role: "member", passHash: "", balance: 6400, package: "Starter", sponsor: "NP1003", parent: "NP1003", side: "left", bank: "", phone: "+91 98765 10006", address: "Chennai, Tamil Nadu" },
      { id: "NP1007", name: "Ishaan Rao", role: "member", passHash: "", balance: 3750, package: "Silver", sponsor: "NP1005", parent: "NP1005", side: "right", bank: "", phone: "+91 98765 10007", address: "Bengaluru, Karnataka" }
    ];
    const today = Date.now();
    return {
      users,
      adminHash: "",
      transactions: [
        { id: "TX-2048", userId: "NP1002", type: "Direct referral bonus", amount: 1000, direction: "credit", status: "Completed", date: new Date(today - 86400000 * 1).toISOString() },
        { id: "TX-2047", userId: "NP1002", type: "Binary match bonus", amount: 500, direction: "credit", status: "Completed", date: new Date(today - 86400000 * 2).toISOString() },
        { id: "TX-2046", userId: "NP1002", type: "Wallet withdrawal", amount: 2500, direction: "debit", status: "Completed", date: new Date(today - 86400000 * 3).toISOString() },
        { id: "TX-2045", userId: "NP1003", type: "Level income", amount: 200, direction: "credit", status: "Completed", date: new Date(today - 86400000 * 4).toISOString() }
      ],
      investments: [
        { id: "IN-3201", userId: "NP1002", plan: "60 Day Growth", amount: 10000, days: 60, rate: 7, start: new Date(today - 86400000 * 20).toISOString(), status: "Active" },
        { id: "IN-3202", userId: "NP1003", plan: "30 Day Builder", amount: 5000, days: 30, rate: 3, start: new Date(today - 86400000 * 13).toISOString(), status: "Active" },
        { id: "IN-3203", userId: "NP1005", plan: "90 Day Premier", amount: 7500, days: 90, rate: 12, start: new Date(today - 86400000 * 38).toISOString(), status: "Active" }
      ],
      withdrawals: [
        { id: "WD-1001", userId: "NP1003", amount: 1500, bank: "ICICI •••• 1692", status: "Pending", date: new Date(today - 3600000 * 8).toISOString() }
      ],
      notices: [
        { id: "NT-01", title: "Welcome to NetPro Demo", body: "Explore the member dashboard, binary network, wallet and investment screens. All values are illustrative.", date: new Date(today - 86400000 * 2).toISOString(), author: "Admin" },
        { id: "NT-02", title: "Demo mode reminder", body: "No payment, bank transfer, or real investment is processed by this browser-only prototype.", date: new Date(today - 86400000 * 5).toISOString(), author: "Admin" }
      ],
      audit: [{ id: "AU-01", message: "Demo workspace initialized", date: now(), actor: "System" }],
      loginAttempts: {},
      otpEnabled: true
    };
  }

  async function loadState() {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved) {
      try {
        state = JSON.parse(saved);
        if (!Array.isArray(state.users) || !Array.isArray(state.transactions)) throw new Error("Invalid saved demo data.");
      } catch (error) {
        console.error("Could not load saved demo data.", error);
        throw new Error("Saved demo data could not be read. Use Reset demo data to restore it.");
      }
      return;
    }
    state = seedState();
    const memberHash = await hashPassword("1234");
    const adminHash = await hashPassword("admin123");
    state.users.forEach((user) => { user.passHash = user.role === "admin" ? adminHash : memberHash; });
    state.adminHash = adminHash;
    saveState();
  }

  function saveState() {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }

  function logAudit(message) {
    state.audit.unshift({ id: uid("AU-"), message, date: now(), actor: currentUser?.id || "System" });
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
  }

  function renderAuth() {
    app.innerHTML = `
      <div class="demo-ribbon">DEMO MODE · NO REAL PAYMENTS</div>
      <main class="auth-shell">
        <section class="auth-art">
          <div class="brand"><span class="brand-mark">N</span> NETPRO</div>
          <div>
            <div class="eyebrow" style="color:#9eadd0;margin-bottom:18px">CLIENT DEMONSTRATION</div>
            <h1>Build your network.<br>See every connection.</h1>
            <p>A transparent preview of member tools, binary placement, wallet activity and team progress — all running locally in your browser.</p>
          </div>
          <div class="auth-art-footer">© 2026 NetPro · Browser-only prototype</div>
        </section>
        <section class="auth-panel">
          <div class="auth-card">
            ${pendingLogin ? renderOtp() : renderLogin()}
            <div class="notice-demo">This demo does not process payments or provide financial services. Figures and returns are illustrative only.</div>
          </div>
        </section>
      </main>`;
    const form = document.getElementById(pendingLogin ? "otp-form" : "login-form");
    form?.addEventListener("submit", pendingLogin ? submitOtp : submitLogin);
    document.getElementById("reset-demo")?.addEventListener("click", resetDemo);
  }

  function renderLogin() {
    return `<h2>Welcome back</h2>
      <p>Sign in to your NetPro demo account to continue.</p>
      <form id="login-form">
        <div class="form-field"><label for="login-id">Member ID</label><input id="login-id" name="userId" autocomplete="username" placeholder="Enter your member ID" required></div>
        <div class="form-field"><label for="login-password">Password</label><input id="login-password" name="password" type="password" autocomplete="current-password" placeholder="Enter your password" required></div>
        <button class="primary-btn full" type="submit">Continue to account <span aria-hidden="true">→</span></button>
      </form>
      <div class="demo-credentials"><b>Demo sign in</b><br>Admin: <b>admin</b> / <b>admin123</b><br>Member: <b>NP1002</b> / <b>1234</b></div>
      <button class="text-btn" id="reset-demo" type="button">Reset demo data</button>`;
  }

  function renderOtp() {
    return `<h2>Verify it’s you</h2>
      <p>Enter the one-time code below. It is shown here because this prototype runs in demo mode.</p>
      <form id="otp-form">
        <div class="otp-display"><div class="eyebrow">DEMO ONE-TIME CODE</div><div class="otp-code">${escapeHtml(pendingLogin.otp)}</div></div>
        <div class="form-field"><label for="otp-input">6-digit code</label><input id="otp-input" name="otp" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="Enter the code above" required></div>
        <button class="primary-btn full" type="submit">Verify and sign in</button>
      </form>
      <button class="text-btn" id="back-login" type="button">← Back to sign in</button>`;
  }

  async function submitLogin(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const id = String(form.get("userId")).trim();
    const password = String(form.get("password"));
    const attemptKey = id.toLowerCase();
    const attempts = state.loginAttempts[attemptKey] || { count: 0, lockedUntil: 0 };
    if (Date.now() < attempts.lockedUntil) return showToast("Too many attempts. Try again in 30 seconds.");
    const user = state.users.find((entry) => entry.id.toLowerCase() === id.toLowerCase());
    if (!user || user.blocked) return failedLogin(attemptKey, attempts, user?.blocked ? "This demo account is blocked." : "Member ID or password is incorrect.");
    const hash = await hashPassword(password);
    if (hash !== user.passHash) return failedLogin(attemptKey, attempts, "Member ID or password is incorrect.");
    delete state.loginAttempts[attemptKey];
    saveState();
    pendingLogin = { userId: user.id, otp: String(Math.floor(100000 + Math.random() * 900000)) };
    renderAuth();
    document.getElementById("back-login")?.addEventListener("click", () => { pendingLogin = null; renderAuth(); });
  }

  function failedLogin(key, attempts, message) {
    attempts.count += 1;
    if (attempts.count >= 3) {
      attempts.count = 0;
      attempts.lockedUntil = Date.now() + 30000;
      message += " Sign-in is locked for 30 seconds.";
    }
    state.loginAttempts[key] = attempts;
    saveState();
    showToast(message);
  }

  function submitOtp(event) {
    event.preventDefault();
    const otp = new FormData(event.currentTarget).get("otp");
    if (String(otp).trim() !== pendingLogin?.otp) return showToast("That demo code does not match.");
    currentUser = state.users.find((user) => user.id === pendingLogin.userId);
    pendingLogin = null;
    logAudit("Signed in");
    saveState();
    renderApp();
  }

  function renderApp() {
    if (!currentUser) return renderAuth();
    const user = activeUser();
    if (!user || user.blocked) { logout(); return; }
    const visibleNav = navItems.filter(([key]) => key !== "admin" || isAdmin());
    if (page === "admin" && !isAdmin()) page = "dashboard";
    app.innerHTML = `
      <div class="demo-ribbon">DEMO MODE · NO REAL PAYMENTS</div>
      <div class="app-shell">
        <aside class="sidebar" id="sidebar">
          <div class="brand"><span class="brand-mark">N</span> NETPRO</div>
          <div class="nav-label">Workspace</div>
          <nav class="nav-list" aria-label="Main navigation">
            ${visibleNav.map(([key, icon, label]) => `<button class="nav-item ${page === key ? "active" : ""}" data-page="${key}" type="button"><span class="nav-icon">${icon}</span>${label}</button>`).join("")}
          </nav>
          <div class="sidebar-bottom">
            <div class="profile-chip"><div class="avatar dark">${escapeHtml(initials(user.name))}</div><div class="who"><strong>${escapeHtml(user.name)}</strong><span>${escapeHtml(user.id)} · ${isAdmin() ? "Administrator" : escapeHtml(user.package)}</span></div></div>
            <button class="logout" data-action="logout" type="button">↪ &nbsp; Sign out</button>
          </div>
        </aside>
        <main class="main-area">
          <header class="topbar">
            <div style="display:flex;align-items:center"><button class="mobile-menu" data-action="menu" aria-label="Open menu" type="button">☰</button><div class="breadcrumb">Workspace <strong>/ ${escapeHtml(pageTitle(page))}</strong></div></div>
            <div class="topbar-right"><span class="topbar-date">${new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span><div class="avatar">${escapeHtml(initials(user.name))}</div></div>
          </header>
          <section class="content">${renderPage()}</section>
        </main>
      </div>
      <div id="modal-root"></div>`;
    app.querySelectorAll("[data-page]").forEach((button) => button.addEventListener("click", () => { page = button.dataset.page; renderApp(); }));
    app.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => handleAction(button.dataset.action, button.dataset.id)));
    app.querySelectorAll("[data-modal]").forEach((button) => button.addEventListener("click", () => openModal(button.dataset.modal)));
    app.querySelectorAll("form[data-form]").forEach((form) => form.addEventListener("submit", handleForm));
    app.querySelectorAll("[data-member-action]").forEach((button) => button.addEventListener("click", () => memberAction(button.dataset.memberAction, button.dataset.id)));
  }

  function pageTitle(key) {
    return navItems.find((item) => item[0] === key)?.[2] || "Dashboard";
  }

  function heading(title, description, actions = "") {
    return `<div class="page-heading"><div><h1>${title}</h1><p>${description}</p></div><div class="heading-actions">${actions}</div></div>`;
  }

  function stat(label, value, icon, foot = "", color = "") {
    return `<article class="stat-card"><div class="stat-head">${label}<span class="stat-icon" style="${color ? `background:${color}` : ""}">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-foot">${foot}</div></article>`;
  }

  function renderPage() {
    switch (page) {
      case "network": return renderNetwork();
      case "wallet": return renderWallet();
      case "investments": return renderInvestments();
      case "activity": return renderActivity();
      case "notices": return renderNotices();
      case "profile": return renderProfile();
      case "admin": return renderAdmin();
      default: return renderDashboard();
    }
  }

  function renderDashboard() {
    const user = activeUser();
    const members = allMembers();
    const team = isAdmin() ? members.length : downlineCount(user.id);
    const txns = state.transactions.filter((txn) => isAdmin() || txn.userId === user.id).slice(0, 5);
    const activeInvestments = state.investments.filter((entry) => entry.status === "Active" && (isAdmin() || entry.userId === user.id));
    const earned = state.transactions.filter((txn) => txn.userId === user.id && txn.direction === "credit").reduce((sum, txn) => sum + txn.amount, 0);
    const actions = `<button class="secondary-btn" data-page="network" type="button">View network</button><button class="primary-btn" data-modal="register" type="button">＋ Add member</button>`;
    return `${heading(`Good day, ${escapeHtml(user.name.split(" ")[0])} 👋`, "Here’s what’s happening with your demo account today.", actions)}
      <div class="stats-grid">
        ${stat("Available wallet", money(user.balance), "◈", `<span class="positive">● Available</span> to use in demo`, "background:#e8f7f1;color:#199b76")}
        ${stat("Team members", team, "⌘", isAdmin() ? "Members in this demo workspace" : "In your placement network")}
        ${stat("Active investments", activeInvestments.length, "◷", "Demo plans currently running", "background:#fff3e5;color:#d48b3b")}
        ${stat("Lifetime earnings", money(earned), "↗", "Illustrative demo earnings", "background:#eef0ff;color:#526be8")}
      </div>
      <div class="content-grid">
        <div>
          <section class="panel"><div class="panel-head"><h2>Recent activity</h2><button class="text-btn" data-page="activity" type="button">View all →</button></div>
            ${txns.length ? `<div class="activity-list">${txns.map(activityRow).join("")}</div>` : `<div class="empty-state">Your recent activity will appear here.</div>`}
          </section>
          <section class="panel"><div class="panel-head"><h2>Team overview</h2><button class="text-btn" data-page="network" type="button">Open binary tree →</button></div><div class="panel-body">${renderTeamSummary(user.id)}</div></section>
        </div>
        <div>
          ${renderRankCard(user.id)}
          <section class="panel" style="margin-top:18px"><div class="panel-head"><h2>Quick actions</h2></div><div class="panel-body"><div class="quick-grid">
            <button class="quick-action" data-modal="withdraw" type="button"><i>↗</i><span>Withdraw</span></button>
            <button class="quick-action" data-modal="transfer" type="button"><i>⇄</i><span>Transfer</span></button>
            <button class="quick-action" data-modal="add-funds" type="button"><i>＋</i><span>Add funds</span></button>
            <button class="quick-action" data-page="investments" type="button"><i>◷</i><span>Invest</span></button>
          </div></div></section>
          <section class="panel"><div class="panel-head"><h2>Demo notice</h2></div><div class="panel-body"><div class="warning-box">This is a local demo. Balances, earnings, and investment rates are illustrative; no real funds move and no returns are promised.</div></div></section>
        </div>
      </div>`;
  }

  function activityRow(txn) {
    const credit = txn.direction === "credit";
    return `<div class="activity-row"><div class="activity-symbol ${credit ? "" : "out"}">${credit ? "↙" : "↗"}</div><div class="activity-copy"><strong>${escapeHtml(txn.type)}</strong><span>${dateLabel(txn.date)} · ${escapeHtml(txn.status)}</span></div><div class="activity-amount ${credit ? "credit" : ""}">${credit ? "+" : "−"}${money(txn.amount)}</div></div>`;
  }

  function directChildren(id) {
    return state.users.filter((member) => member.parent === id);
  }

  function downlineCount(id, seen = new Set()) {
    if (seen.has(id)) return 0;
    seen.add(id);
    const children = directChildren(id);
    return children.length + children.reduce((sum, child) => sum + downlineCount(child.id, seen), 0);
  }

  function renderTeamSummary(id) {
    const left = state.users.find((member) => member.parent === id && member.side === "left");
    const right = state.users.find((member) => member.parent === id && member.side === "right");
    const total = downlineCount(id);
    return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px"><div><div class="eyebrow">TOTAL DOWNLINE</div><strong style="font:800 21px Manrope">${total}</strong></div><div style="display:flex;gap:21px"><div><div class="eyebrow">LEFT LEG</div><strong style="font:700 15px Manrope">${left ? downlineCount(left.id) + 1 : 0}</strong></div><div><div class="eyebrow">RIGHT LEG</div><strong style="font:700 15px Manrope">${right ? downlineCount(right.id) + 1 : 0}</strong></div></div></div><div class="progress-track"><span style="width:${total ? Math.min(100, 25 + total * 7) : 0}%"></span></div><div class="small muted" style="margin-top:8px">Counts are based on the demo placement tree.</div>`;
  }

  function renderRankCard(id) {
    const total = downlineCount(id);
    const ranks = [{ name: "Associate", count: 0 }, { name: "Builder", count: 5 }, { name: "Leader", count: 12 }, { name: "Director", count: 25 }];
    const current = [...ranks].reverse().find((rank) => total >= rank.count) || ranks[0];
    const next = ranks[ranks.indexOf(current) + 1];
    const progress = next ? Math.min(100, total / next.count * 100) : 100;
    return `<section class="rank-card"><div class="eyebrow">DEMO TEAM RANK</div><h3>${current.name}</h3><p>${next ? `${Math.max(0, next.count - total)} more member${next.count - total === 1 ? "" : "s"} to ${next.name}` : "Highest demo rank reached"}</p><div class="progress-track"><span style="width:${progress}%"></span></div><div class="rank-footer"><span>${total} team members</span><span>${next ? `${next.count} for next rank` : "Complete"}</span></div></section>`;
  }

  function renderNetwork() {
    const user = activeUser();
    const people = isAdmin() ? allMembers() : [user, ...state.users.filter((member) => member.role === "member" && hasAncestor(member, user.id))];
    const root = isAdmin() ? (people.find((member) => member.id === "NP1002") || user) : user;
    const left = state.users.find((member) => member.parent === root.id && member.side === "left");
    const right = state.users.find((member) => member.parent === root.id && member.side === "right");
    const actions = `<button class="primary-btn" data-modal="register" type="button">＋ Register member</button>`;
    return `${heading("My Network", isAdmin() ? "Explore the demo placement tree and member list." : "Your binary placement tree and direct team.", actions)}
      <section class="panel"><div class="panel-head"><h2>Binary placement</h2><span class="pill">${people.length} visible members</span></div>
        <div class="tree-wrap"><div class="tree">
          ${treeNode(root, true)}
          <div class="tree-link"></div><div class="tree-connectors"></div>
          <div class="tree-level tree-children">${treeNode(left)}${treeNode(right)}</div>
          <div class="tree-level" style="gap:48px;margin-top:24px">${left ? treeNode(state.users.find((member) => member.parent === left.id && member.side === "left")) : treeNode(null)}${left ? treeNode(state.users.find((member) => member.parent === left.id && member.side === "right")) : treeNode(null)}${right ? treeNode(state.users.find((member) => member.parent === right.id && member.side === "left")) : treeNode(null)}${right ? treeNode(state.users.find((member) => member.parent === right.id && member.side === "right")) : treeNode(null)}</div>
        </div></div></section>
      <section class="panel"><div class="panel-head"><h2>Team members</h2><span class="small muted">${people.length} accounts</span></div>
        ${people.length ? `<div class="table-wrap"><table><thead><tr><th>Member</th><th>Package</th><th>Sponsor</th><th>Placement</th><th>Status</th></tr></thead><tbody>${people.map((member) => `<tr><td><div class="member-cell"><div class="avatar">${escapeHtml(initials(member.name))}</div><div><strong>${escapeHtml(member.name)}</strong><div class="small muted">${escapeHtml(member.id)}</div></div></div></td><td>${escapeHtml(member.package)}</td><td>${escapeHtml(member.sponsor || "—")}</td><td>${member.parent ? `${escapeHtml(member.side)} · ${escapeHtml(member.parent)}` : "Root"}</td><td><span class="pill ${member.blocked ? "red" : "green"}">${member.blocked ? "Blocked" : "Active"}</span></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state">No members found.</div>`}
      </section>`;
  }

  function hasAncestor(member, ancestorId) {
    const seen = new Set();
    let parent = member.parent;
    while (parent && !seen.has(parent)) {
      if (parent === ancestorId) return true;
      seen.add(parent);
      parent = state.users.find((entry) => entry.id === parent)?.parent;
    }
    return false;
  }

  function treeNode(member, root = false) {
    if (!member) return `<div class="tree-node"><div class="tree-empty">Open placement</div><small>Available slot</small></div>`;
    return `<div class="tree-node ${root ? "root" : ""}"><div class="avatar">${escapeHtml(initials(member.name))}</div><strong>${escapeHtml(member.name)}</strong><small>${escapeHtml(member.id)} · ${escapeHtml(member.package)}</small></div>`;
  }

  function renderWallet() {
    const user = activeUser();
    const txns = state.transactions.filter((txn) => isAdmin() || txn.userId === user.id);
    const actions = `<button class="secondary-btn" data-modal="transfer" type="button">⇄ Transfer</button><button class="secondary-btn" data-modal="withdraw" type="button">↗ Withdraw</button><button class="primary-btn" data-modal="add-funds" type="button">＋ Add funds</button>`;
    return `${heading("Wallet", "Manage demo funds and review your wallet ledger.", actions)}
      <div class="stats-grid">${stat("Available balance", money(user.balance), "◈", "Demo wallet balance", "background:#e8f7f1;color:#199b76")}${stat("Total credited", money(txns.filter((x) => x.direction === "credit").reduce((s, x) => s + x.amount, 0)), "↙", "Illustrative demo credits")}${stat("Total debited", money(txns.filter((x) => x.direction === "debit").reduce((s, x) => s + x.amount, 0)), "↗", "Illustrative demo debits")}${stat("Pending withdrawals", state.withdrawals.filter((x) => x.userId === user.id && x.status === "Pending").length, "◷", "Awaiting demo approval")}</div>
      <section class="panel"><div class="panel-head"><h2>Wallet ledger</h2><span class="pill">${txns.length} transactions</span></div>${txns.length ? `<div class="activity-list">${txns.map(activityRow).join("")}</div>` : `<div class="empty-state">No wallet activity yet. Try adding demo funds.</div>`}</section>
      <div class="warning-box">All actions update local browser data only. No real money is accepted, sent, or withdrawn.</div>`;
  }

  function renderInvestments() {
    const user = activeUser();
    const investments = state.investments.filter((entry) => isAdmin() || entry.userId === user.id);
    const cards = plans.map((plan) => `<article class="plan-card ${plan.featured ? "featured" : ""}"><h3>${plan.name}</h3><div class="term">${plan.days} day demo term</div><div class="plan-rate">${plan.rate}% <small>illustrative demo rate</small></div><ul><li>One-time demo contribution</li><li>Progress tracked in this browser</li><li>Maturity credit is simulated</li></ul><button class="primary-btn" data-action="invest" data-id="${plan.name}" type="button">Choose demo plan</button></article>`).join("");
    const rows = investments.map((entry) => investmentRow(entry)).join("");
    return `${heading("Investments", "Review simulated plans and track demo maturity dates.", `<button class="secondary-btn" data-action="advance-days" type="button">＋10 demo days</button>`)}
      <div class="warning-box" style="margin-bottom:18px"><strong>Illustrative only:</strong> plan rates and maturity values are not real offers, guaranteed returns, or financial advice. This demo does not accept or invest funds.</div>
      <div class="plans-grid">${cards}</div>
      <section class="panel" style="margin-top:20px"><div class="panel-head"><h2>${isAdmin() ? "All demo investments" : "My demo investments"}</h2><span class="pill">${investments.length} plans</span></div><div class="panel-body">${rows ? `<div class="investment-list">${rows}</div>` : `<div class="empty-state">You have no demo investments yet.</div>`}</div></section>`;
  }

  function investmentRow(entry) {
    const due = new Date(new Date(entry.start).getTime() + entry.days * 86400000);
    const elapsed = Math.max(0, (Date.now() - new Date(entry.start).getTime()) / 86400000);
    const progress = Math.min(100, elapsed / entry.days * 100);
    const left = state.users.find((user) => user.id === entry.userId);
    const maturity = entry.amount + Math.round(entry.amount * entry.rate / 100);
    return `<div class="investment-row"><div class="activity-symbol">◷</div><div class="activity-copy"><strong>${escapeHtml(entry.plan)} ${isAdmin() ? `· ${escapeHtml(left?.id || "")}` : ""}</strong><span>${money(entry.amount)} contributed · ${entry.days} days</span><div class="progress-track" style="margin-top:8px"><span style="width:${progress}%"></span></div></div><div class="right"><strong>${money(maturity)}</strong><span>${entry.status === "Active" ? `Matures ${dateLabel(due)}` : "Matured"}</span></div></div>`;
  }

  function renderActivity() {
    const user = activeUser();
    const txns = state.transactions.filter((txn) => isAdmin() || txn.userId === user.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    return `${heading("Activity", "A complete history of demo wallet transactions.", `<span class="pill">${txns.length} transactions</span>`)}
      <section class="panel"><div class="panel-head"><h2>Transaction history</h2><span class="small muted">Most recent first</span></div>${txns.length ? `<div class="activity-list">${txns.map(activityRow).join("")}</div>` : `<div class="empty-state">No transactions recorded yet.</div>`}</section>`;
  }

  function renderNotices() {
    const notices = [...state.notices].sort((a, b) => new Date(b.date) - new Date(a.date));
    return `${heading("Notice Board", "Updates and announcements for the NetPro demo.", isAdmin() ? `<button class="primary-btn" data-modal="notice" type="button">＋ Post notice</button>` : "")}
      <div style="display:grid;gap:13px">${notices.map((notice) => `<article class="panel"><div class="panel-body"><div style="display:flex;justify-content:space-between;gap:12px"><h2 style="margin:0;font:700 15px Manrope">${escapeHtml(notice.title)}</h2><span class="small muted">${dateLabel(notice.date)}</span></div><p style="color:#66748a;font-size:12px;line-height:1.75;margin:12px 0">${escapeHtml(notice.body)}</p><span class="pill">Posted by ${escapeHtml(notice.author)}</span></div></article>`).join("") || `<div class="empty-state">There are no notices.</div>`}</div>`;
  }

  function renderProfile() {
    const user = activeUser();
    return `${heading("My Profile", "Manage your demo account details and security settings.", `<button class="secondary-btn" data-modal="password" type="button">Change password</button>`)}
      <div class="content-grid">
        <section class="panel"><div class="panel-head"><h2>Account details</h2><span class="pill green">Active</span></div><div class="panel-body">
          <form data-form="profile">
            <div class="form-field"><label>Full name</label><input name="name" value="${escapeHtml(user.name)}" required></div>
            <div class="form-field"><label>Member ID</label><input value="${escapeHtml(user.id)}" disabled></div>
            <div class="form-field"><label>Phone</label><input name="phone" value="${escapeHtml(user.phone || "")}"></div>
            <div class="form-field"><label>Address</label><input name="address" value="${escapeHtml(user.address || "")}"></div>
            <div class="form-field"><label>Bank account (masked demo value)</label><input name="bank" value="${escapeHtml(user.bank || "")}" placeholder="Bank name •••• last 4 digits"></div>
            <button class="primary-btn" type="submit">Save profile</button>
          </form>
        </div></section>
        <section><div class="setting-card"><h3>Membership</h3><p>Package and sponsor details in your demo account.</p><div class="separator"></div><div class="eyebrow">CURRENT PACKAGE</div><strong>${escapeHtml(user.package)}</strong><div class="separator"></div><div class="eyebrow">SPONSOR</div><strong>${escapeHtml(user.sponsor || "—")}</strong><div class="separator"></div><div class="eyebrow">MEMBER SINCE</div><strong>Demo workspace</strong></div>
          <div class="setting-card" style="margin-top:14px"><h3>Security notice</h3><p>Account data is saved in this browser only. Do not enter real bank details, passwords, or personal information.</p></div></section>
      </div>`;
  }

  function renderAdmin() {
    if (!isAdmin()) return "";
    const members = allMembers();
    const withdrawals = state.withdrawals.filter((item) => item.status === "Pending");
    return `${heading("Admin Console", "Demo member management, payout requests and audit log.", `<button class="primary-btn" data-modal="register" type="button">＋ Add member</button>`)}
      <div class="stats-grid">${stat("Total members", members.length, "⌘", "Registered demo accounts")}${stat("Pending withdrawals", withdrawals.length, "◷", "Awaiting admin action", "background:#fff3e5;color:#d48b3b")}${stat("Active plans", state.investments.filter((item) => item.status === "Active").length, "◈", "Across the demo workspace")}${stat("Demo notices", state.notices.length, "▤", "Visible to all accounts")}</div>
      <section class="panel"><div class="panel-head"><h2>Member accounts</h2><span class="pill">${members.length} members</span></div><div class="table-wrap"><table><thead><tr><th>Member</th><th>Package</th><th>Wallet</th><th>Placement</th><th>Status</th><th>Action</th></tr></thead><tbody>${members.map((member) => `<tr><td><div class="member-cell"><div class="avatar">${escapeHtml(initials(member.name))}</div><div><strong>${escapeHtml(member.name)}</strong><div class="small muted">${escapeHtml(member.id)}</div></div></div></td><td>${escapeHtml(member.package)}</td><td>${money(member.balance)}</td><td>${member.parent ? `${escapeHtml(member.parent)} · ${escapeHtml(member.side)}` : "Root"}</td><td><span class="pill ${member.blocked ? "red" : "green"}">${member.blocked ? "Blocked" : "Active"}</span></td><td><button class="${member.blocked ? "secondary-btn" : "danger-btn"}" data-member-action="block" data-id="${escapeHtml(member.id)}" type="button">${member.blocked ? "Unblock" : "Block"}</button></td></tr>`).join("")}</tbody></table></div></section>
      <section class="panel"><div class="panel-head"><h2>Withdrawal approvals</h2><span class="pill orange">${withdrawals.length} pending</span></div>${withdrawals.length ? `<div class="table-wrap"><table><thead><tr><th>Request</th><th>Member</th><th>Amount</th><th>Bank</th><th>Date</th><th>Action</th></tr></thead><tbody>${withdrawals.map((item) => `<tr><td>${escapeHtml(item.id)}</td><td>${escapeHtml(item.userId)}</td><td>${money(item.amount)}</td><td>${escapeHtml(item.bank)}</td><td>${dateLabel(item.date)}</td><td><button class="secondary-btn" data-member-action="approve" data-id="${escapeHtml(item.id)}" type="button">Approve demo</button></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state">No withdrawal requests need approval.</div>`}</section>
      <section class="panel"><div class="panel-head"><h2>Audit log</h2><span class="small muted">Recent demo actions</span></div><div class="activity-list">${state.audit.slice(0, 8).map((entry) => `<div class="activity-row"><div class="activity-symbol">•</div><div class="activity-copy"><strong>${escapeHtml(entry.message)}</strong><span>${escapeHtml(entry.actor)} · ${dateLabel(entry.date)}</span></div></div>`).join("")}</div></section>`;
  }

  function openModal(kind) {
    const root = document.getElementById("modal-root");
    const user = activeUser();
    const common = (title, description, body) => `<div class="modal-backdrop" id="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><h2 id="modal-title">${title}</h2><button class="modal-close" data-action="close-modal" aria-label="Close" type="button">×</button></div><p>${description}</p>${body}</section></div>`;
    let content = "";
    if (kind === "add-funds") {
      content = common("Add demo funds", "Simulate a top-up. No payment or UPI transaction will be made.", `<form data-form="add-funds"><div class="form-field"><label>Amount (₹)</label><input name="amount" type="number" min="100" max="100000" step="100" required placeholder="e.g. 1,000"></div><div class="form-field"><label>Demo reference</label><input name="reference" value="DEMO-UPI" maxlength="30"></div><div class="modal-actions"><button class="primary-btn" type="submit">Add demo funds</button></div></form>`);
    } else if (kind === "withdraw") {
      content = common("Request withdrawal", "Create a local demo request. A real bank payout will not occur.", `<form data-form="withdraw"><div class="form-field"><label>Amount (₹) · available ${money(user.balance)}</label><input name="amount" type="number" min="100" max="${Math.max(100, user.balance)}" step="100" required></div><div class="form-field"><label>Masked bank account</label><input name="bank" value="${escapeHtml(user.bank || "")}" placeholder="Add a masked demo bank value" required></div><div class="modal-actions"><button class="primary-btn" type="submit">Submit demo request</button></div></form>`);
    } else if (kind === "transfer") {
      content = common("Wallet transfer", "Move illustrative balance to another active demo member.", `<form data-form="transfer"><div class="form-field"><label>Recipient member ID</label><select name="recipient" required>${allMembers().filter((member) => member.id !== user.id && !member.blocked).map((member) => `<option value="${escapeHtml(member.id)}">${escapeHtml(member.name)} · ${escapeHtml(member.id)}</option>`).join("")}</select></div><div class="form-field"><label>Amount (₹) · available ${money(user.balance)}</label><input name="amount" type="number" min="100" max="${Math.max(100, user.balance)}" step="100" required></div><div class="modal-actions"><button class="primary-btn" type="submit">Transfer demo funds</button></div></form>`);
    } else if (kind === "register") {
      const placements = allMembers().flatMap((member) => ["left", "right"]
        .filter((side) => !member.blocked && !state.users.some((entry) => entry.parent === member.id && entry.side === side))
        .map((side) => ({ member, side })));
      content = common("Register a demo member", "Create a local demo account and choose its sponsor and binary placement. Package credits simulate demo commissions only.", `<form data-form="register"><div class="form-field"><label>Full name</label><input name="name" maxlength="60" required></div><div class="form-field"><label>Member ID</label><input name="memberId" placeholder="e.g. NP1008" required></div><div class="form-field"><label>Temporary password</label><input name="password" type="password" minlength="4" required></div><div class="form-field"><label>Sponsor</label><select name="sponsor">${allMembers().filter((member) => !member.blocked).map((member) => `<option value="${escapeHtml(member.id)}" ${member.id === user.id ? "selected" : ""}>${escapeHtml(member.name)} · ${escapeHtml(member.id)}</option>`).join("")}</select></div><div class="form-field"><label>Placement slot</label><select name="placement" required>${placements.map(({ member, side }) => `<option value="${escapeHtml(member.id)}|${side}">${escapeHtml(member.name)} · ${escapeHtml(member.id)} / ${side}</option>`).join("")}</select></div><div class="form-field"><label>Package</label><select name="package">${Object.entries(packages).map(([name, amount]) => `<option value="${name}">${name} · ${money(amount)}</option>`).join("")}</select></div><div class="modal-actions"><button class="primary-btn" type="submit" ${placements.length ? "" : "disabled"}>Create demo member</button></div></form>`);
    } else if (kind === "notice") {
      content = common("Post a notice", "Share a demo announcement with all members.", `<form data-form="notice"><div class="form-field"><label>Title</label><input name="title" maxlength="80" required></div><div class="form-field"><label>Message</label><input name="body" maxlength="300" required></div><div class="modal-actions"><button class="primary-btn" type="submit">Post notice</button></div></form>`);
    } else if (kind === "password") {
      content = common("Change password", "Update the demo password for this browser account.", `<form data-form="password"><div class="form-field"><label>Current password</label><input name="current" type="password" required></div><div class="form-field"><label>New password</label><input name="next" type="password" minlength="4" required></div><div class="modal-actions"><button class="primary-btn" type="submit">Update password</button></div></form>`);
    }
    root.innerHTML = content;
    root.querySelector(".modal-backdrop")?.addEventListener("click", (event) => {
      if (event.target.id === "modal-backdrop") root.innerHTML = "";
    });
    root.querySelector("form")?.addEventListener("submit", handleForm);
    root.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => { root.innerHTML = ""; }));
  }

  async function handleForm(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const kind = event.currentTarget.dataset.form;
    const amount = Number(form.get("amount"));
    const user = activeUser();
    if (kind === "profile") {
      user.name = String(form.get("name")).trim();
      user.phone = String(form.get("phone")).trim();
      user.address = String(form.get("address")).trim();
      user.bank = String(form.get("bank")).trim();
      logAudit("Updated profile details");
    }
    if (kind === "add-funds") {
      if (!Number.isFinite(amount) || amount < 100 || amount > 100000) return showToast("Enter an amount between ₹100 and ₹100,000.");
      user.balance += amount;
      state.transactions.unshift({ id: uid("TX-"), userId: user.id, type: `Demo funds added · ${String(form.get("reference")).slice(0, 30)}`, amount, direction: "credit", status: "Completed", date: now() });
      logAudit(`Added ${money(amount)} in demo funds`);
    }
    if (kind === "withdraw") {
      const bank = String(form.get("bank")).trim();
      if (!Number.isFinite(amount) || amount < 100 || amount > user.balance || !bank) return showToast("Check the amount and masked bank details.");
      user.balance -= amount;
      const withdrawal = { id: uid("WD-"), userId: user.id, amount, bank: bank.slice(0, 45), status: "Pending", date: now() };
      state.withdrawals.unshift(withdrawal);
      state.transactions.unshift({ id: uid("TX-"), userId: user.id, type: `Withdrawal request ${withdrawal.id}`, amount, direction: "debit", status: "Pending approval", date: now() });
      logAudit(`Requested demo withdrawal ${withdrawal.id}`);
    }
    if (kind === "transfer") {
      const recipient = state.users.find((entry) => entry.id === form.get("recipient") && !entry.blocked);
      if (!recipient || recipient.id === user.id || !Number.isFinite(amount) || amount < 100 || amount > user.balance) return showToast("Check the recipient and transfer amount.");
      user.balance -= amount;
      recipient.balance += amount;
      state.transactions.unshift({ id: uid("TX-"), userId: user.id, type: `Wallet transfer to ${recipient.id}`, amount, direction: "debit", status: "Completed", date: now() });
      state.transactions.unshift({ id: uid("TX-"), userId: recipient.id, type: `Wallet transfer from ${user.id}`, amount, direction: "credit", status: "Completed", date: now() });
      logAudit(`Transferred ${money(amount)} to ${recipient.id}`);
    }
    if (kind === "register") {
      const id = String(form.get("memberId")).trim().toUpperCase();
      const name = String(form.get("name")).trim();
      const [parent, side] = String(form.get("placement")).split("|");
      if (state.users.some((entry) => entry.id.toLowerCase() === id.toLowerCase())) return showToast("That member ID already exists.");
      if (!name || !/^[A-Z0-9-]{4,16}$/.test(id)) return showToast("Use a valid name and member ID.");
      if (!["left", "right"].includes(side) || !state.users.some((entry) => entry.id === parent && entry.role === "member" && !entry.blocked) || state.users.some((entry) => entry.parent === parent && entry.side === side)) return showToast("That placement slot is no longer available.");
      const password = String(form.get("password"));
      if (password.length < 4) return showToast("Temporary password must be at least 4 characters.");
      const passHash = await hashPassword(password);
      const member = { id, name, role: "member", passHash, balance: 0, package: String(form.get("package")), sponsor: String(form.get("sponsor")), parent, side, bank: "", phone: "", address: "" };
      state.users.push(member);
      creditRegistrationCommissions(member);
      logAudit(`Registered demo member ${id}`);
    }
    if (kind === "notice") {
      if (!isAdmin()) return showToast("Only the admin can post notices.");
      state.notices.unshift({ id: uid("NT-"), title: String(form.get("title")).trim(), body: String(form.get("body")).trim(), date: now(), author: user.name });
      logAudit("Posted a notice");
    }
    if (kind === "password") {
      const current = await hashPassword(String(form.get("current")));
      if (current !== user.passHash) return showToast("Current password is incorrect.");
      user.passHash = await hashPassword(String(form.get("next")));
      if (user.role === "admin") state.adminHash = user.passHash;
      logAudit("Changed account password");
    }
    if (kind === "invest") {
      const plan = plans.find((entry) => entry.name === form.get("plan"));
      if (!plan || !Number.isFinite(amount) || amount < 500 || amount > user.balance) return showToast("Check the demo contribution amount and available wallet.");
      user.balance -= amount;
      const investment = { id: uid("IN-"), userId: user.id, plan: plan.name, amount, days: plan.days, rate: plan.rate, start: now(), status: "Active" };
      state.investments.unshift(investment);
      state.transactions.unshift({ id: uid("TX-"), userId: user.id, type: `Demo contribution · ${plan.name}`, amount, direction: "debit", status: "Completed", date: now() });
      logAudit(`Started demo investment ${investment.id}`);
    }
    saveState();
    renderApp();
    showToast("Demo account updated.");
  }

  function creditRegistrationCommissions(member) {
    const packageAmount = packages[member.package] || 0;
    const credit = (recipientId, type, rate, base = packageAmount) => {
      const recipient = state.users.find((entry) => entry.id === recipientId && entry.role === "member");
      const amount = Math.round(base * rate);
      if (!recipient || amount <= 0) return;
      recipient.balance += amount;
      state.transactions.unshift({ id: uid("TX-"), userId: recipient.id, type, amount, direction: "credit", status: "Completed · demo", date: now() });
    };
    if (member.sponsor) credit(member.sponsor, "Direct referral bonus · demo", 0.10);

    let ancestor = state.users.find((entry) => entry.id === member.sponsor);
    for (const [level, rate] of [[2, 0.02], [3, 0.01]]) {
      if (!ancestor) break;
      credit(ancestor.sponsor, `Level ${level} income · demo`, rate);
      ancestor = state.users.find((entry) => entry.id === ancestor.sponsor);
    }

    const parent = state.users.find((entry) => entry.id === member.parent);
    if (!parent) return;
    const leftVolume = legVolume(parent.id, "left");
    const rightVolume = legVolume(parent.id, "right");
    const matchedVolume = Math.min(leftVolume, rightVolume);
    const newlyMatched = Math.max(0, matchedVolume - (parent.matchedVolume || 0));
    parent.matchedVolume = matchedVolume;
    if (newlyMatched) credit(parent.id, "Binary matching bonus · demo", 0.10, newlyMatched);
  }

  function legVolume(parentId, side) {
    const first = state.users.find((entry) => entry.parent === parentId && entry.side === side);
    if (!first) return 0;
    const visit = (member) => packages[member.package] + state.users
      .filter((entry) => entry.parent === member.id)
      .reduce((sum, child) => sum + visit(child), 0);
    return visit(first);
  }

  function handleAction(action, id) {
    if (action === "logout") return logout();
    if (action === "close-modal") return document.getElementById("modal-root").innerHTML = "";
    if (action === "menu") return document.getElementById("sidebar").classList.toggle("open");
    if (action === "invest") return investInPlan(id);
    if (action === "advance-days") return advanceDays();
  }

  function investInPlan(name) {
    const plan = plans.find((entry) => entry.name === name);
    if (!plan) return showToast("That demo plan is unavailable.");
    openModal(`invest-${plan.name}`);
    const root = document.getElementById("modal-root");
    root.innerHTML = `<div class="modal-backdrop" id="modal-backdrop"><section class="modal" role="dialog" aria-modal="true"><div class="modal-head"><h2>${escapeHtml(plan.name)}</h2><button class="modal-close" data-action="close-modal" type="button">×</button></div><p>Illustrative only. No real money is invested and no return is promised.</p><form data-form="invest"><input type="hidden" name="plan" value="${escapeHtml(plan.name)}"><div class="form-field"><label>Demo contribution (₹) · wallet ${money(activeUser().balance)}</label><input name="amount" type="number" min="500" max="${Math.max(500, activeUser().balance)}" step="500" required></div><div class="modal-actions"><button class="primary-btn" type="submit">Start demo plan</button></div></form></section></div>`;
    root.querySelector("form").addEventListener("submit", handleForm);
    root.querySelector("[data-action]").addEventListener("click", () => { root.innerHTML = ""; });
    root.querySelector(".modal-backdrop").addEventListener("click", (event) => { if (event.target.id === "modal-backdrop") root.innerHTML = ""; });
  }

  function advanceDays() {
    state.investments.forEach((entry) => {
      if (entry.status !== "Active") return;
      entry.start = new Date(new Date(entry.start).getTime() - 10 * 86400000).toISOString();
    });
    matureInvestments();
    logAudit("Advanced the demo clock by 10 days");
    saveState();
    renderApp();
    showToast("Demo clock advanced by 10 days.");
  }

  function matureInvestments() {
    const timestamp = Date.now();
    state.investments.forEach((entry) => {
      const maturity = new Date(entry.start).getTime() + entry.days * 86400000;
      if (entry.status !== "Active" || timestamp < maturity) return;
      const user = state.users.find((member) => member.id === entry.userId);
      if (!user) throw new Error(`Investment ${entry.id} has no member account.`);
      const payout = entry.amount + Math.round(entry.amount * entry.rate / 100);
      user.balance += payout;
      entry.status = "Matured";
      state.transactions.unshift({ id: uid("TX-"), userId: user.id, type: `Demo maturity credit · ${entry.plan}`, amount: payout, direction: "credit", status: "Completed", date: now() });
      logAudit(`Matured demo investment ${entry.id}`);
    });
  }

  function memberAction(action, id) {
    if (!isAdmin()) return;
    if (action === "block") {
      const user = state.users.find((entry) => entry.id === id);
      if (!user) return showToast("Member not found.");
      user.blocked = !user.blocked;
      logAudit(`${user.blocked ? "Blocked" : "Unblocked"} member ${user.id}`);
    }
    if (action === "approve") {
      const withdrawal = state.withdrawals.find((entry) => entry.id === id && entry.status === "Pending");
      if (!withdrawal) return showToast("Pending withdrawal not found.");
      withdrawal.status = "Approved";
      withdrawal.utr = uid("DEMO-UTR-");
      const txn = state.transactions.find((entry) => entry.type === `Withdrawal request ${withdrawal.id}`);
      if (txn) txn.status = `Approved · ${withdrawal.utr}`;
      logAudit(`Approved demo withdrawal ${withdrawal.id}`);
    }
    saveState();
    renderApp();
    showToast(action === "approve" ? "Demo withdrawal approved (no payout sent)." : "Member status updated.");
  }

  function logout() {
    currentUser = null;
    pendingLogin = null;
    page = "dashboard";
    renderAuth();
  }

  async function resetDemo() {
    if (!window.confirm("Reset all demo data in this browser?")) return;
    localStorage.removeItem(STORE_KEY);
    state = null;
    currentUser = null;
    await loadState();
    renderAuth();
    showToast("Demo data restored.");
  }

  async function boot() {
    try {
      await loadState();
      matureInvestments();
      saveState();
      renderAuth();
      const noteActivity = () => { if (currentUser) lastActivity = Date.now(); };
      window.addEventListener("pointerdown", noteActivity);
      window.addEventListener("keydown", noteActivity);
      setInterval(() => {
        if (currentUser && Date.now() - lastActivity > 15 * 60 * 1000) {
          logout();
          showToast("You were signed out after 15 minutes of inactivity.");
        }
      }, 60000);
    } catch (error) {
      console.error(error);
      app.innerHTML = `<main class="auth-panel"><div class="auth-card"><h2>Demo could not start</h2><p>${escapeHtml(error.message)}</p></div></main>`;
    }
  }

  let lastActivity = Date.now();
  boot();
})();
