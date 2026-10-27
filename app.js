// ====================================================================
// CraftFlow - Hand Embroidery Production & Inventory SaaS
// Main Application Controller & View Renderer
// Multi-Line Inward/Outward Challans & Strict (Style + Category) Mapping
// ====================================================================

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

function initApp() {
  // 1. Initialize Theme, Auth System & User Management FIRST (Guaranteed Login availability)
  try { initTheme(); } catch (e) { console.error("Theme init error:", e); }
  try { initAuthSystem(); } catch (e) { console.error("Auth init error:", e); }
  try { initUserManagementHandlers(); } catch (e) { console.error("User Mgmt init error:", e); }

  // 2. Initialize Navigation & View Handlers (Isolated so no single view failure blocks the app)
  try { initNavigation(); } catch (e) { console.error("Navigation init error:", e); }
  try { initDashboardView(); } catch (e) { console.error("Dashboard init error:", e); }
  try { initMasterInventoryView(); } catch (e) { console.error("Master Inventory init error:", e); }
  try { initReceivingLogView(); } catch (e) { console.error("Receiving Log init error:", e); }
  try { initDispatchLogView(); } catch (e) { console.error("Dispatch Log init error:", e); }
  try { initFinalStyleView(); } catch (e) { console.error("Final Style init error:", e); }
  try { initContractorsView(); } catch (e) { console.error("Contractors init error:", e); }
  try { initPaymentSheetView(); } catch (e) { console.error("Payment Sheet init error:", e); }
  try { initWorkDistributionView(); } catch (e) { console.error("Work Distribution init error:", e); }
  try { initNeonSyncView(); } catch (e) { console.error("Neon Sync init error:", e); }
  try { initModalHandlers(); } catch (e) { console.error("Modal Handlers init error:", e); }
  try { initPaymentModalHandlers(); } catch (e) { console.error("Payment Modal Handlers init error:", e); }
  try { initPrintStudio(); } catch (e) { console.error("Print Studio init error:", e); }

  // 3. If a valid session exists, apply permissions and render
  try {
    const currentUser = (window.db && typeof window.db.getCurrentUser === "function") 
      ? window.db.getCurrentUser() 
      : null;
    if (currentUser) {
      if (typeof window.db.rebuildAllMastersFromLogs === "function") {
        window.db.rebuildAllMastersFromLogs();
      }
      applyUserPermissions(currentUser);
      renderAll();
    }
  } catch (e) {
    console.error("Session restoration error:", e);
  }

  // 4. Always restore and activate Neon connection on startup/refresh
  try {
    checkNeonStatus();
    startLiveNeonConnection();
  } catch (e) {
    console.error("Neon startup connection error:", e);
  }
}

// -------------------------------------------------------------
// High-Performance Debounce Utility (Silky Smooth UI Typing & Navigation)
// -------------------------------------------------------------
function debounce(fn, delay = 120) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// -------------------------------------------------------------
// Global Toast System
// -------------------------------------------------------------
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  let icon = `✓`;
  if (type === "error") icon = `✕`;
  if (type === "info") icon = `ℹ`;

  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(50px)";
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

// -------------------------------------------------------------
// Theme Management (Dark / Light)
// -------------------------------------------------------------
function initTheme() {
  const savedTheme = localStorage.getItem("hand_emb_theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);

  const toggleBtn = document.getElementById("btn-theme-toggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "dark";
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("hand_emb_theme", next);
      updateThemeIcon(next);
      showToast(`Switched to ${next} theme`, "info");
    });
  }
}

function updateThemeIcon(theme) {
  const icon = document.getElementById("theme-icon");
  if (!icon) return;
  if (theme === "dark") {
    icon.innerHTML = `
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    `;
  } else {
    icon.innerHTML = `
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    `;
  }
}

// -------------------------------------------------------------
// Navigation Tabs & Mobile Drawer
// -------------------------------------------------------------
function initNavigation() {
  const tabBtns = document.querySelectorAll(".nav-tab-btn");
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");
      switchTab(targetTab);
    });
  });

  const neonPill = document.getElementById("neon-quick-status");
  if (neonPill) {
    neonPill.addEventListener("click", () => switchTab("neon-sync"));
  }

  initMobileNav();
}

function initMobileNav() {
  const toggleBtn = document.getElementById("btn-mobile-menu-toggle");
  const closeBtn = document.getElementById("btn-close-mobile-nav");
  const backdrop = document.getElementById("mobile-nav-backdrop");
  const drawer = document.getElementById("mobile-nav-drawer");
  const chipBtn = document.getElementById("mobile-current-tab-chip");
  const mobileNewEntryBtn = document.getElementById("btn-open-new-entry-mobile");
  const drawerNewEntryBtn = document.getElementById("btn-drawer-new-entry");

  function openDrawer() {
    if (drawer) drawer.classList.add("open");
    if (backdrop) backdrop.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    if (drawer) drawer.classList.remove("open");
    if (backdrop) backdrop.classList.remove("open");
    document.body.style.overflow = "";
  }

  if (toggleBtn) toggleBtn.addEventListener("click", openDrawer);
  if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
  if (backdrop) backdrop.addEventListener("click", closeDrawer);
  if (chipBtn) chipBtn.addEventListener("click", openDrawer);

  document.querySelectorAll(".mobile-nav-item").forEach(item => {
    item.addEventListener("click", () => {
      const targetTab = item.getAttribute("data-tab");
      if (targetTab) {
        switchTab(targetTab);
        closeDrawer();
      }
    });
  });

  // Mobile Bottom Navigation Dock Item Click Listeners
  document.querySelectorAll(".mobile-bottom-nav-item").forEach(item => {
    item.addEventListener("click", () => {
      const targetTab = item.getAttribute("data-tab");
      if (targetTab) {
        switchTab(targetTab);
      }
    });
  });

  if (mobileNewEntryBtn) {
    mobileNewEntryBtn.addEventListener("click", () => {
      const mainBtn = document.getElementById("btn-open-new-entry");
      if (mainBtn) mainBtn.click();
    });
  }

  if (drawerNewEntryBtn) {
    drawerNewEntryBtn.addEventListener("click", () => {
      closeDrawer();
      const mainBtn = document.getElementById("btn-open-new-entry");
      if (mainBtn) mainBtn.click();
    });
  }
}

// -------------------------------------------------------------
// View State & Lazy Rendering Manager (Zero Lag & Instant Tab Switch)
// -------------------------------------------------------------
const dirtyViews = new Set([
  "dashboard",
  "master-inventory",
  "receiving-log",
  "dispatch-log",
  "final-style",
  "contractors",
  "work-distribution",
  "payment-sheet"
]);

function markViewsDirty(tabId = null) {
  if (tabId) {
    dirtyViews.add(tabId);
  } else {
    ["dashboard", "master-inventory", "receiving-log", "dispatch-log", "final-style", "contractors", "work-distribution", "payment-sheet"].forEach(t => dirtyViews.add(t));
  }
}

function getActiveTabId() {
  const activeView = document.querySelector(".tab-view.active");
  if (activeView && activeView.id) {
    return activeView.id.replace("-view", "");
  }
  return "dashboard";
}

function renderTargetView(tabId) {
  try {
    if (tabId === "dashboard") renderDashboardView();
    else if (tabId === "master-inventory") renderMasterInventory();
    else if (tabId === "receiving-log") renderReceivingLog();
    else if (tabId === "dispatch-log") renderDispatchLog();
    else if (tabId === "final-style") renderFinalStyleSheet();
    else if (tabId === "contractors") renderContractorsView();
    else if (tabId === "work-distribution") {
      populateDistributionPeriods();
      renderWorkDistribution();
    }
    else if (tabId === "payment-sheet") {
      populateRateApprovalPeriods();
      renderPaymentSheet();
    }
    dirtyViews.delete(tabId);
  } catch (err) {
    console.warn("Target view render error:", tabId, err);
  }
}

function switchTab(tabId) {
  const permKey = tabId.replace(/-/g, '_');
  if (!window.db.canUserAccessTab(permKey)) {
    showToast("Access Restricted: You do not have permission to view this tab.", "error");
    return;
  }

  document.querySelectorAll(".nav-tab-btn").forEach(b => {
    b.classList.toggle("active", b.getAttribute("data-tab") === tabId);
  });

  document.querySelectorAll(".mobile-nav-item").forEach(item => {
    item.classList.toggle("active", item.getAttribute("data-tab") === tabId);
  });

  document.querySelectorAll(".mobile-bottom-nav-item").forEach(item => {
    item.classList.toggle("active", item.getAttribute("data-tab") === tabId);
  });

  const tabTitles = {
    "dashboard": "⚡ Dashboard",
    "master-inventory": "📦 Master Inventory",
    "receiving-log": "📥 Receiving Log",
    "dispatch-log": "📤 Dispatch Log",
    "final-style": "📋 Daily Sheet",
    "work-distribution": "📑 Work Distribution",
    "payment-sheet": "💰 Payment Sheet",
    "contractors": "👥 Contractors Hub",
    "neon-sync": "☁️ Neon Cloud"
  };
  const activeTabNameEl = document.getElementById("mobile-active-tab-name");
  if (activeTabNameEl) {
    activeTabNameEl.textContent = tabTitles[tabId] || tabId;
  }

  // 1. Instantly switch visibility in DOM (0ms response, zero white screen)
  document.querySelectorAll(".tab-view").forEach(view => {
    view.classList.remove("active");
    view.setAttribute("aria-hidden", "true");
    view.style.display = "none";
  });

  const activeView = document.getElementById(`${tabId}-view`);
  if (activeView) {
    activeView.classList.add("active");
    activeView.setAttribute("aria-hidden", "false");
    activeView.style.display = "block";
    activeView.style.opacity = "1";
    activeView.style.visibility = "visible";
  }

  // Safe universal scroll reset across all mobile & desktop browsers
  try { window.scrollTo(0, 0); } catch (e) {}
  try { document.documentElement.scrollTop = 0; } catch (e) {}
  try { document.body.scrollTop = 0; } catch (e) {}

  // 2. Render target view immediately
  if (dirtyViews.has(tabId)) {
    try {
      renderTargetView(tabId);
    } catch (err) {
      console.warn("renderTargetView error:", tabId, err);
    }
  }
}

// -------------------------------------------------------------
// Master Render Orchestrator
// -------------------------------------------------------------
function renderAll(forceAll = false) {
  // Lightweight global updates: KPIs, Dropdowns and Permissions
  try { renderKPIs(); } catch (e) { console.error("renderKPIs error:", e); }
  try { populateDropdowns(); } catch (e) { console.error("populateDropdowns error:", e); }
  try { renderNavigation(); } catch (e) { console.error("renderNavigation error:", e); }

  // Mark all tabs dirty so inactive tabs don't re-render until opened
  markViewsDirty();

  const currentTab = getActiveTabId();

  if (forceAll) {
    ["dashboard", "master-inventory", "receiving-log", "dispatch-log", "final-style", "contractors", "work-distribution", "payment-sheet"].forEach(t => {
      renderTargetView(t);
    });
  } else {
    // Render only the active tab immediately
    renderTargetView(currentTab);
  }
}

function renderNavigation() {
  const currentUser = (window.db && typeof window.db.getCurrentUser === "function") 
    ? window.db.getCurrentUser() 
    : null;
  if (currentUser) {
    applyUserPermissions(currentUser);
  }
}

// -------------------------------------------------------------
// KPI Summary Calculations
// -------------------------------------------------------------
function renderKPIs() {
  const master = window.db.getMasterInventory();
  const recLogs = window.db.getReceivingLogs();
  const disLogs = window.db.getDispatchLogs();

  let totalCut = 0;
  let totalReceived = 0;
  let totalDispatched = 0;
  let totalBalHemb = 0;
  let totalBalStock = 0;

  master.forEach(item => {
    totalCut += item.cut_qty;
    totalReceived += item.received_qty;
    totalDispatched += item.dispatch_from_hemb;
    totalBalHemb += item.balance_from_hemb;
    totalBalStock += item.balance_from_stock;
  });

  document.getElementById("kpi-total-cut").textContent = totalCut.toLocaleString();
  document.getElementById("kpi-total-received").textContent = totalReceived.toLocaleString();
  document.getElementById("kpi-total-dispatched").textContent = totalDispatched.toLocaleString();
  document.getElementById("kpi-total-balance-hemb").textContent = totalBalHemb.toLocaleString();
  document.getElementById("kpi-total-balance-stock").textContent = totalBalStock.toLocaleString();

  // Navigation Badges (Desktop & Mobile Drawer Sync)
  const setBadgeText = (id, count) => {
    const el = document.getElementById(id);
    if (el) el.textContent = count;
  };

  setBadgeText("badge-master-count", master.length);
  setBadgeText("badge-master-count-mobile", master.length);
  setBadgeText("mobile-bottom-badge-master", master.length);

  setBadgeText("badge-rec-count", recLogs.length);
  setBadgeText("badge-rec-count-mobile", recLogs.length);
  setBadgeText("mobile-bottom-badge-rec", recLogs.length);

  setBadgeText("badge-dis-count", disLogs.length);
  setBadgeText("badge-dis-count-mobile", disLogs.length);
  setBadgeText("mobile-bottom-badge-dis", disLogs.length);

  setBadgeText("badge-final-count", window.db.getFinalStyles().length);
  setBadgeText("badge-final-count-mobile", window.db.getFinalStyles().length);
  setBadgeText("mobile-bottom-badge-final", window.db.getFinalStyles().length);

  setBadgeText("badge-payment-count", window.db.getPaymentSheets().length);
  setBadgeText("badge-payment-count-mobile", window.db.getPaymentSheets().length);
}

// =============================================================
// TAB 0: EXECUTIVE DASHBOARD & REAL-TIME OPERATIONS CENTER
// =============================================================
let currentDashboardStreamFilter = "all";

function initDashboardView() {
  // Quick Action: New Style Entry
  const btnNewStyle = document.getElementById("dash-act-new-style");
  if (btnNewStyle) {
    btnNewStyle.addEventListener("click", () => {
      if (typeof openMasterEntryModal === "function") {
        openMasterEntryModal();
      } else {
        const topBtn = document.getElementById("btn-open-new-entry");
        if (topBtn) topBtn.click();
      }
    });
  }

  // Quick Action: Log Inward Challan
  const btnReceiving = document.getElementById("dash-act-receiving");
  if (btnReceiving) {
    btnReceiving.addEventListener("click", () => {
      if (typeof openMasterEntryModal === "function") {
        openMasterEntryModal(null, "receiving");
      } else {
        switchTab("receiving-log");
      }
    });
  }

  // Quick Action: Log Outward Challan
  const btnDispatch = document.getElementById("dash-act-dispatch");
  if (btnDispatch) {
    btnDispatch.addEventListener("click", () => {
      if (typeof openMasterEntryModal === "function") {
        openMasterEntryModal(null, "dispatch");
      } else {
        switchTab("dispatch-log");
      }
    });
  }

  // Quick Action: Daily Floor Sheet
  const btnDailySheet = document.getElementById("dash-act-daily-sheet");
  if (btnDailySheet) {
    btnDailySheet.addEventListener("click", () => {
      switchTab("final-style");
    });
  }

  // Quick Action: Refresh
  const btnRefresh = document.getElementById("btn-dash-refresh");
  if (btnRefresh) {
    btnRefresh.addEventListener("click", () => {
      renderDashboardView();
      showToast("Dashboard metrics refreshed!", "info");
    });
  }

  // KPI Cards Click to Jump
  const kpiCards = document.querySelectorAll(".dash-kpi-card[data-jump]");
  kpiCards.forEach(card => {
    card.addEventListener("click", () => {
      const target = card.getAttribute("data-jump");
      if (target) switchTab(target);
    });
  });

  // Recent Activity Stream Filter Pills
  const filterPills = document.querySelectorAll("#dash-stream-filter-pills .dash-pill-btn");
  filterPills.forEach(pill => {
    pill.addEventListener("click", () => {
      filterPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      currentDashboardStreamFilter = pill.getAttribute("data-stream") || "all";
      renderDashboardRecentActivity();
    });
  });
}

function renderDashboardView() {
  try {
    const master = window.db.getMasterInventory() || [];
    const recLogs = window.db.getReceivingLogs() || [];
    const disLogs = window.db.getDispatchLogs() || [];
    const finalStyles = window.db.getFinalStyles() || [];
    const contractors = window.db.getContractors() || [];
    const workloads = (typeof window.db.getContractorWorkload === "function") 
      ? window.db.getContractorWorkload() 
      : [];

    // 1. GREETING & METADATA
    const currentUser = (window.db && typeof window.db.getCurrentUser === "function")
      ? window.db.getCurrentUser()
      : null;
    const greetingEl = document.getElementById("dash-greeting-text");
    if (greetingEl) {
      const name = currentUser ? (currentUser.full_name || currentUser.username) : "Operations Team";
      const now = new Date();
      const hr = now.getHours();
      let timeOfDay = "Good morning";
      if (hr >= 12 && hr < 17) timeOfDay = "Good afternoon";
      else if (hr >= 17) timeOfDay = "Good evening";
      greetingEl.innerHTML = `${timeOfDay}, <strong>${escapeHtml(name)}</strong>. Real-time factory overview of cutting demand, embroidery floor WIP, and contractor workloads.`;
    }

    const dateEl = document.getElementById("dash-current-date");
    if (dateEl) {
      const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
      dateEl.textContent = `📅 ${new Date().toLocaleDateString('en-GB', options)}`;
    }

    // 2. PRIMARY KPIS
    let totalCut = 0;
    let totalReceived = 0;
    let totalDispatched = 0;
    let totalBalHemb = 0;
    let totalBalStock = 0;

    master.forEach(item => {
      totalCut += (parseInt(item.cut_qty, 10) || 0);
      totalReceived += (parseInt(item.received_qty, 10) || 0);
      totalDispatched += (parseInt(item.dispatch_from_hemb, 10) || 0);
      totalBalHemb += (parseInt(item.balance_from_hemb, 10) || 0);
      totalBalStock += (parseInt(item.balance_from_stock, 10) || 0);
    });

    const elCut = document.getElementById("dash-kpi-cut");
    if (elCut) elCut.textContent = totalCut.toLocaleString();

    const elStylesCount = document.getElementById("dash-kpi-styles-count");
    if (elStylesCount) elStylesCount.textContent = `${master.length} Styles`;

    const elRec = document.getElementById("dash-kpi-received");
    if (elRec) elRec.textContent = totalReceived.toLocaleString();

    const elRecPct = document.getElementById("dash-kpi-rec-pct");
    const recPct = totalCut > 0 ? ((totalReceived / totalCut) * 100).toFixed(1) : "0";
    if (elRecPct) elRecPct.textContent = `${recPct}% of Cut`;

    const elRecChallans = document.getElementById("dash-kpi-rec-challans");
    if (elRecChallans) elRecChallans.textContent = `${recLogs.length} Inward Challans`;

    const elDis = document.getElementById("dash-kpi-dispatched");
    if (elDis) elDis.textContent = totalDispatched.toLocaleString();

    const elFulfillment = document.getElementById("dash-kpi-fulfillment-rate");
    const disPct = totalCut > 0 ? ((totalDispatched / totalCut) * 100).toFixed(1) : "0";
    if (elFulfillment) elFulfillment.textContent = `${disPct}% Fulfilled`;

    const elDisChallans = document.getElementById("dash-kpi-dis-challans");
    if (elDisChallans) elDisChallans.textContent = `${disLogs.length} Outward Challans`;

    const elWip = document.getElementById("dash-kpi-wip");
    if (elWip) elWip.textContent = totalBalHemb.toLocaleString();

    const elStockBal = document.getElementById("dash-kpi-stock-bal");
    if (elStockBal) elStockBal.textContent = totalBalStock.toLocaleString();

    const elStockPct = document.getElementById("dash-kpi-stock-pct");
    const stockPct = totalCut > 0 ? ((totalBalStock / totalCut) * 100).toFixed(1) : "0";
    if (elStockPct) elStockPct.textContent = `${stockPct}% Pending`;

    const elContractors = document.getElementById("dash-kpi-contractors");
    if (elContractors) elContractors.textContent = contractors.length;

    const activeWorkloadContractors = workloads.filter(w => w.total_balance > 0);
    const elContActive = document.getElementById("dash-kpi-cont-active");
    if (elContActive) elContActive.textContent = `${activeWorkloadContractors.length} With WIP`;

    // 3. PRODUCTION PIPELINE MULTI-SEGMENT PROGRESS BAR
    const barDis = document.getElementById("dash-bar-dispatched");
    const barWip = document.getElementById("dash-bar-wip");
    const barStock = document.getElementById("dash-bar-stock");

    const totalPipelineVolume = Math.max(1, totalDispatched + Math.max(0, totalBalHemb) + Math.max(0, totalBalStock));
    const pctDis = ((totalDispatched / totalPipelineVolume) * 100).toFixed(1);
    const pctWip = ((Math.max(0, totalBalHemb) / totalPipelineVolume) * 100).toFixed(1);
    const pctStock = ((Math.max(0, totalBalStock) / totalPipelineVolume) * 100).toFixed(1);

    if (barDis) barDis.style.width = `${pctDis}%`;
    if (barWip) barWip.style.width = `${pctWip}%`;
    if (barStock) barStock.style.width = `${pctStock}%`;

    const legDis = document.getElementById("dash-legend-dispatched");
    if (legDis) legDis.textContent = `${totalDispatched.toLocaleString()} pcs (${pctDis}%)`;

    const legWip = document.getElementById("dash-legend-wip");
    if (legWip) legWip.textContent = `${Math.max(0, totalBalHemb).toLocaleString()} pcs (${pctWip}%)`;

    const legStock = document.getElementById("dash-legend-stock");
    if (legStock) legStock.textContent = `${Math.max(0, totalBalStock).toLocaleString()} pcs (${pctStock}%)`;

    const doneTag = document.getElementById("dash-metric-done-tag");
    if (doneTag) doneTag.textContent = `Completed: ${pctDis}%`;

    const wipTag = document.getElementById("dash-metric-wip-tag");
    if (wipTag) wipTag.textContent = `Floor WIP: ${pctWip}%`;

    // 4. CONTRACTOR WORKLOAD MATRIX
    renderDashboardContractorWorkload(workloads, totalBalHemb);

    // 5. FLOOR REMARKS & BOTTLENECK ALERTS
    renderDashboardFloorRemarks(finalStyles, master);

    // 6. GARMENT CATEGORY BREAKDOWN
    renderDashboardCategoryBreakdown(master);

    // 7. RECENT ACTIVITY STREAM
    renderDashboardRecentActivity();

  } catch (err) {
    console.error("renderDashboardView error:", err);
  }
}

// -------------------------------------------------------------
// Sub-Renderer: Contractor Workload Matrix
// -------------------------------------------------------------
function renderDashboardContractorWorkload(workloads, totalBalHemb) {
  const container = document.getElementById("dash-contractor-workload-list");
  if (!container) return;

  if (!workloads || workloads.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">👥</div>
        <strong style="color: var(--text-main);">No Contractor Workload Available</strong>
        <p style="font-size: 0.775rem; margin-top: 4px;">Assign cut pieces to contractors in Work Distribution or Master Inventory.</p>
      </div>
    `;
    return;
  }

  // Sort by total balance pieces descending
  const sorted = [...workloads].sort((a, b) => (b.total_balance || 0) - (a.total_balance || 0));

  container.innerHTML = sorted.map(c => {
    const bal = c.total_balance || 0;
    const stylesCount = (c.styles || []).length;
    const safeTotalBal = Math.max(1, totalBalHemb);
    const pctOfFloor = bal > 0 ? Math.min(100, Math.round((bal / safeTotalBal) * 100)) : 0;
    const initial = (c.name || "C").charAt(0).toUpperCase();

    return `
      <div class="dash-cont-card" onclick="switchTab('contractors')" style="cursor: pointer;" title="View ${escapeHtml(c.name)} details in Contractors Hub">
        <div class="dash-cont-avatar">
          ${initial}
        </div>
        <div class="dash-cont-info">
          <div class="dash-cont-name-row">
            <span class="dash-cont-name">${escapeHtml(c.name)}</span>
            <span class="dash-cont-styles-badge">${stylesCount} Style${stylesCount === 1 ? '' : 's'}</span>
          </div>
          <div class="dash-cont-bar-track">
            <div class="dash-cont-bar-fill" style="width: ${pctOfFloor}%;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.675rem; color: var(--text-muted); margin-top: 3px;">
            <span>${pctOfFloor}% of Floor WIP</span>
            <span>${c.phone ? escapeHtml(c.phone) : 'Direct'}</span>
          </div>
        </div>
        <div class="dash-cont-right">
          ${bal > 0 
            ? `<div class="dash-cont-pcs">${bal.toLocaleString()} pcs</div>
               <div class="dash-cont-pcs-sub">Pending WIP</div>`
            : `<div class="dash-cont-pcs-zero">✓ 0 pcs</div>
               <div class="dash-cont-pcs-sub" style="color: var(--primary);">Cleared</div>`
          }
        </div>
      </div>
    `;
  }).join("");
}

// -------------------------------------------------------------
// Sub-Renderer: Floor Remarks & Bottlenecks
// -------------------------------------------------------------
function renderDashboardFloorRemarks(finalStyles, master) {
  const container = document.getElementById("dash-floor-remarks-list");
  if (!container) return;

  const alerts = [];
  const seenKeys = new Set();

  // 1. Gather explicit floor remarks from Final Styles Daily Sheet
  finalStyles.forEach(item => {
    const remarks = (item.time_remarks || "").trim();
    const styleCode = (item.style_code || "").trim();
    const category = (item.category || "").trim();
    const key = `${styleCode.toUpperCase()}|${category.toUpperCase()}`;

    if (remarks && !seenKeys.has(key)) {
      seenKeys.add(key);
      let issueType = "inline";
      const rUpper = remarks.toUpperCase();
      if (rUpper.includes("MATERIAL NOT AVAILABLE") || rUpper.includes("MATERIAL ISSUE") || rUpper.includes("NOT AVAILABLE")) {
        issueType = "mat";
      } else if (rUpper.includes("ALTER") || rUpper.includes("REPAIR") || rUpper.includes("REWORK")) {
        issueType = "alter";
      }

      alerts.push({
        style_code: styleCode,
        category: category,
        contractor: item.contractor_name || "Contractor",
        balance: item.balance_from_hemb || item.total_balance || 0,
        remarks: remarks,
        issueType: issueType,
        source: "Daily Sheet"
      });
    }
  });

  // 2. Gather top pending WIP styles from Master Inventory
  const activeMaster = master
    .filter(m => (m.balance_from_hemb || 0) > 0)
    .sort((a, b) => (b.balance_from_hemb || 0) - (a.balance_from_hemb || 0));

  activeMaster.forEach(item => {
    const key = `${(item.style_code || "").trim().toUpperCase()}|${(item.category || "").trim().toUpperCase()}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      let issueType = "inline";
      const rUpper = (item.remarks || "").toUpperCase();
      if (rUpper.includes("MATERIAL")) issueType = "mat";
      else if (rUpper.includes("ALTER")) issueType = "alter";

      alerts.push({
        style_code: item.style_code,
        category: item.category,
        contractor: item.contractor_name || "Floor",
        balance: item.balance_from_hemb || 0,
        remarks: item.remarks || "Active Production on Adda",
        issueType: issueType,
        source: "Master WIP"
      });
    }
  });

  if (alerts.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">✨</div>
        <strong style="color: var(--primary);">✓ All Floor Operations Running Smoothly</strong>
        <p style="font-size: 0.775rem; margin-top: 4px;">Zero material bottlenecks or alterations flagged today.</p>
      </div>
    `;
    return;
  }

  // Sort issues first (mat, then alter, then inline), then by balance descending
  const priorityRank = { mat: 1, alter: 2, inline: 3 };
  alerts.sort((a, b) => {
    const rankDiff = (priorityRank[a.issueType] || 4) - (priorityRank[b.issueType] || 4);
    if (rankDiff !== 0) return rankDiff;
    return (b.balance || 0) - (a.balance || 0);
  });

  // Display top 8 critical alerts
  const displayAlerts = alerts.slice(0, 8);

  container.innerHTML = displayAlerts.map(a => {
    let tagText = "Inline";
    if (a.issueType === "mat") tagText = "Material Issue";
    else if (a.issueType === "alter") tagText = "Alter / Rework";

    return `
      <div class="dash-alert-row issue-${a.issueType}" onclick="switchTab('final-style')" style="cursor: pointer;" title="View ${escapeHtml(a.style_code)} in Daily Sheet">
        <div class="dash-alert-left">
          <span class="dash-alert-tag ${a.issueType}">${tagText}</span>
          <div class="dash-alert-details">
            <span class="dash-alert-style-title">${escapeHtml(a.style_code)} <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: normal;">[${escapeHtml(a.category)}]</span></span>
            <span class="dash-alert-meta">${escapeHtml(a.contractor)} • <em>${escapeHtml(a.remarks)}</em></span>
          </div>
        </div>
        <div class="dash-alert-right">
          <div class="dash-alert-bal">${a.balance.toLocaleString()} pcs</div>
          <span style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase;">WIP Balance</span>
        </div>
      </div>
    `;
  }).join("");
}

// -------------------------------------------------------------
// Sub-Renderer: Garment Category Breakdown
// -------------------------------------------------------------
function renderDashboardCategoryBreakdown(master) {
  const container = document.getElementById("dash-category-breakdown-grid");
  if (!container) return;

  const catMap = new Map();

  master.forEach(item => {
    const cat = (item.category || "OTHER").trim().toUpperCase();
    if (!catMap.has(cat)) {
      catMap.set(cat, {
        category: cat,
        cut: 0,
        received: 0,
        dispatched: 0,
        wip: 0,
        stock_bal: 0,
        styles: 0
      });
    }

    const data = catMap.get(cat);
    data.cut += (parseInt(item.cut_qty, 10) || 0);
    data.received += (parseInt(item.received_qty, 10) || 0);
    data.dispatched += (parseInt(item.dispatch_from_hemb, 10) || 0);
    data.wip += (parseInt(item.balance_from_hemb, 10) || 0);
    data.stock_bal += (parseInt(item.balance_from_stock, 10) || 0);
    data.styles += 1;
  });

  const list = Array.from(catMap.values()).sort((a, b) => b.cut - a.cut);

  if (list.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); grid-column: 1 / -1;">
        No category breakdown available.
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(c => {
    const pctCompleted = c.cut > 0 ? Math.min(100, Math.round((c.dispatched / c.cut) * 100)) : 0;
    return `
      <div class="dash-cat-card" onclick="switchTab('master-inventory')" style="cursor: pointer;" title="View ${escapeHtml(c.category)} in Master Inventory">
        <div class="dash-cat-header">
          <span class="dash-cat-name">${escapeHtml(c.category)}</span>
          <span class="dash-cat-styles">${c.styles} Styles</span>
        </div>
        <div class="dash-cat-main-val">
          ${c.cut.toLocaleString()} <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: normal;">pcs cut</span>
        </div>
        <div class="dash-cat-bar-track">
          <div class="dash-cat-bar-fill" style="width: ${pctCompleted}%;"></div>
        </div>
        <div class="dash-cat-footer">
          <span>✓ ${c.dispatched.toLocaleString()} done (${pctCompleted}%)</span>
          <span style="color: var(--accent-rose); font-weight: 700;">${c.wip.toLocaleString()} WIP</span>
        </div>
      </div>
    `;
  }).join("");
}

// -------------------------------------------------------------
// Sub-Renderer: Recent Activity Stream (Inward & Outward)
// -------------------------------------------------------------
function renderDashboardRecentActivity() {
  const container = document.getElementById("dash-activity-stream-list");
  if (!container) return;

  const recLogs = window.db.getReceivingLogs() || [];
  const disLogs = window.db.getDispatchLogs() || [];

  const stream = [];

  recLogs.forEach(r => {
    stream.push({
      type: "rec",
      date: r.date_receive || "Today",
      challan: r.challan_rec || `REC-${r.id}`,
      style_code: r.style_code,
      category: r.category,
      qty: parseInt(r.received_qty, 10) || 0,
      contractor: r.contractor_name || "Stock/Cutting",
      remarks: r.remarks || "Inward from stock",
      id: r.id || 0
    });
  });

  disLogs.forEach(d => {
    stream.push({
      type: "dis",
      date: d.date_dispatch || "Today",
      challan: d.challan_dis || `DIS-${d.id}`,
      style_code: d.style_code,
      category: d.category,
      qty: parseInt(d.dispatch_qty, 10) || 0,
      contractor: d.contractor_name || "Embroidery Floor",
      remarks: d.remarks || "Outward to unit",
      id: d.id || 0
    });
  });

  // Filter based on active tab
  let filtered = stream;
  if (currentDashboardStreamFilter === "rec") {
    filtered = stream.filter(s => s.type === "rec");
  } else if (currentDashboardStreamFilter === "dis") {
    filtered = stream.filter(s => s.type === "dis");
  }

  // Sort latest first (by id descending)
  filtered.sort((a, b) => (b.id || 0) - (a.id || 0));

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">📋</div>
        <strong style="color: var(--text-main);">No Challan Activity Recorded</strong>
        <p style="font-size: 0.775rem; margin-top: 4px;">Log an inward or outward challan using the quick action buttons above.</p>
      </div>
    `;
    return;
  }

  // Display latest 8 activity records
  const recent = filtered.slice(0, 8);

  container.innerHTML = recent.map(act => {
    const isRec = act.type === "rec";
    const icon = isRec ? "📥" : "📤";
    const typeLabel = isRec ? "Inward Received" : "Outward Dispatched";
    const targetTab = isRec ? "receiving-log" : "dispatch-log";

    return `
      <div class="dash-stream-row" onclick="switchTab('${targetTab}')" style="cursor: pointer;" title="View in ${isRec ? 'Receiving' : 'Dispatch'} Log">
        <div class="dash-stream-left">
          <div class="dash-stream-icon-box ${act.type}">
            ${icon}
          </div>
          <div class="dash-stream-info">
            <div class="dash-stream-title">
              <strong>${escapeHtml(act.style_code)}</strong>
              <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: normal;">[${escapeHtml(act.category)}]</span>
              <span class="badge-tag inline" style="font-size: 0.65rem; margin-left: 4px;">#${escapeHtml(act.challan)}</span>
            </div>
            <div class="dash-stream-sub">
              ${escapeHtml(act.contractor)} • <span style="color: var(--text-faint);">${typeLabel}</span>
            </div>
          </div>
        </div>
        <div class="dash-stream-right">
          <div class="dash-stream-qty ${act.type}">
            ${isRec ? '+' : '-'}${act.qty.toLocaleString()} pcs
          </div>
          <div class="dash-stream-date">${escapeHtml(act.date)}</div>
        </div>
      </div>
    `;
  }).join("");
}

// -------------------------------------------------------------
// TAB 1: MASTER INVENTORY TABLE (Aggregated per Style + Category)
// -------------------------------------------------------------
function initMasterInventoryView() {
  const searchInput = document.getElementById("master-search-input");
  const contractorFilter = document.getElementById("filter-contractor");
  const categoryFilter = document.getElementById("filter-category");
  const balanceFilter = document.getElementById("filter-balance-status");

  const debouncedRenderMaster = debounce(() => renderMasterInventory(), 120);

  if (searchInput) {
    searchInput.addEventListener("input", debouncedRenderMaster);
  }
  [contractorFilter, categoryFilter, balanceFilter].forEach(el => {
    if (el) {
      el.addEventListener("change", () => renderMasterInventory());
    }
  });

  document.getElementById("btn-export-master-csv")?.addEventListener("click", exportMasterInventoryToCSV);
  
  // Navigation buttons inside toolbar
  document.getElementById("btn-goto-receiving")?.addEventListener("click", () => switchTab("receiving-log"));
  document.getElementById("btn-goto-dispatch")?.addEventListener("click", () => switchTab("dispatch-log"));

  // Quick Open Modal
  document.getElementById("btn-quick-receiving")?.addEventListener("click", () => {
    openMasterEntryModal(null, "receiving");
  });

  document.getElementById("btn-quick-dispatch")?.addEventListener("click", () => {
    openMasterEntryModal(null, "dispatch");
  });

  document.getElementById("btn-open-new-entry")?.addEventListener("click", () => {
    openMasterEntryModal(null, "receiving");
  });

  // Clear all data (Locally and on Neon)
  document.getElementById("btn-clear-all")?.addEventListener("click", async () => {
    if (confirm("Are you sure you want to clear all data? This will wipe the local cache AND truncate Neon cloud database tables so both stay completely in sync.")) {
      await window.db.clearAllData(true);
      renderAll();
      showToast("All data cleared from local cache and Neon Cloud database!", "info");
      syncLiveFromNeon(true);
    }
  });
}

function renderMasterInventory() {
  const tbody = document.getElementById("tbody-master-inventory");
  if (!tbody) return;

  const canEdit = window.db.canUserPerformAction("can_edit");
  const canDelete = window.db.canUserPerformAction("can_delete");
  const canCreate = window.db.canUserPerformAction("can_create");

  const searchQuery = (document.getElementById("master-search-input")?.value || "").toLowerCase().trim();
  const selectedContractor = document.getElementById("filter-contractor")?.value || "";
  const selectedCategory = document.getElementById("filter-category")?.value || "";
  const selectedBalance = document.getElementById("filter-balance-status")?.value || "";

  let list = window.db.getMasterInventory();

  // Filter
  list = list.filter(item => {
    const codeMatch = (item.style_code || "").toLowerCase().includes(searchQuery);
    const catMatch = (item.category || "").toLowerCase().includes(searchQuery);
    const contMatch = (item.contractor_name || "").toLowerCase().includes(searchQuery);
    const challanRecMatch = (item.challan_rec || "").toLowerCase().includes(searchQuery);
    const challanDisMatch = (item.challan_dis || "").toLowerCase().includes(searchQuery);
    const dateRecMatch = (item.date_receive || "").toLowerCase().includes(searchQuery);
    const dateDisMatch = (item.date_dispatch || "").toLowerCase().includes(searchQuery);
    const queryPassed = !searchQuery || codeMatch || catMatch || contMatch || challanRecMatch || challanDisMatch || dateRecMatch || dateDisMatch;

    const contractorPassed = !selectedContractor || (item.contractor_name || "").toLowerCase() === selectedContractor.toLowerCase();
    const categoryPassed = !selectedCategory || (item.category || "").toLowerCase() === selectedCategory.toLowerCase();

    let balancePassed = true;
    if (selectedBalance === "pending_hemb") balancePassed = item.balance_from_hemb > 0;
    if (selectedBalance === "pending_stock") balancePassed = item.balance_from_stock > 0;
    if (selectedBalance === "completed") balancePassed = item.balance_from_hemb === 0 && item.balance_from_stock === 0;

    return queryPassed && contractorPassed && categoryPassed && balancePassed;
  });

  if (list.length === 0) {
    const isFiltered = !!(searchQuery || selectedContractor || selectedCategory || selectedBalance);
    tbody.innerHTML = `
      <tr>
        <td colspan="16" style="text-align: center; padding: 3rem 1.5rem; color: var(--text-muted);">
          <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.35rem;">
            ${isFiltered ? "No matching styles or categories found" : "No styles in Master Inventory yet"}
          </div>
          <p style="font-size: 0.85rem; margin-bottom: 1rem;">
            ${isFiltered ? "Try clearing search or filter selections." : "Ready for fresh entries! Click '+ New Style Entry' to record your styles, cut pieces & challans."}
          </p>
          ${!isFiltered && canCreate ? `<button class="btn btn-primary btn-sm" onclick="openMasterEntryModal(null, 'receiving')">📥 + Record Receiving</button>` : ""}
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(item => {
    const balStockClass = item.balance_from_stock > 0 ? "balance-highlight-pink" : "balance-zero-green";
    const balHembClass = item.balance_from_hemb > 0 ? "balance-highlight-pink" : "balance-zero-green";
    const totalBalClass = item.total_balance > 0 ? "balance-highlight-pink" : "balance-zero-green";

    const displayCont = (item.contractor_name && item.contractor_name !== "Unassigned" && item.contractor_name !== "-")
      ? item.contractor_name
      : (window.db.getContractorForStyle(item.style_code, item.category)?.contractor_name || "Unassigned");

    return `
      <tr>
        <td style="text-align: center; font-weight: 700; color: var(--text-muted); font-family: var(--font-mono);">${item.sr_no || item.id}</td>
        <td>
          <span class="style-code-badge">${escapeHtml(item.style_code)}</span>
        </td>
        <td class="cell-ship">${escapeHtml(item.ship || '-')}</td>
        <td><span class="badge-tag inline">${escapeHtml(item.category)}</span></td>
        <td style="font-weight: 700; font-family: var(--font-mono);">${item.cut_qty.toLocaleString()}</td>
        
        <!-- Receiving Summary -->
        <td class="cell-rec-qty">${item.received_qty.toLocaleString()}</td>
        <td class="${balStockClass}">${item.balance_from_stock.toLocaleString()}</td>
        <td style="min-width: 90px; max-width: 130px;">${formatMultiCellContent(item.date_receive, 'receiving', item.style_code, item.category, 'date')}</td>
        <td style="min-width: 90px; max-width: 130px;">${formatMultiCellContent(item.challan_rec, 'receiving', item.style_code, item.category, 'challan')}</td>
        
        <!-- Dispatch Summary -->
        <td class="cell-dis-qty">${item.dispatch_from_hemb.toLocaleString()}</td>
        <td class="${balHembClass}">${item.balance_from_hemb.toLocaleString()}</td>
        <td class="${totalBalClass}">${item.total_balance.toLocaleString()}</td>
        <td style="min-width: 90px; max-width: 130px;">${formatMultiCellContent(item.date_dispatch, 'dispatch', item.style_code, item.category, 'date')}</td>
        <td style="min-width: 90px; max-width: 130px;">${formatMultiCellContent(item.challan_dis, 'dispatch', item.style_code, item.category, 'challan')}</td>
        <td>
          <span class="contractor-tag">
            <span class="avatar-dot"></span>
            ${escapeHtml(displayCont)}
          </span>
        </td>
        
        <td style="text-align: center;">
          <div style="display: flex; gap: 0.35rem; justify-content: center; align-items: center;">
            ${canEdit ? `<button class="btn btn-secondary btn-sm" onclick="editMasterEntry(${item.id})" title="Edit style entry">Edit</button>` : ''}
            ${canDelete ? `<button class="btn btn-secondary btn-sm" style="color: var(--accent-rose);" onclick="deleteMasterEntry(${item.id})" title="Delete entry">✕</button>` : ''}
            ${!canEdit && !canDelete ? `<span style="color: var(--text-faint); font-size: 0.75rem;">View Only</span>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// -------------------------------------------------------------
// MULTI-CHALLAN COMPACT 2-LINE DISPLAY & MODAL QUICK-VIEW
// -------------------------------------------------------------
function formatMultiCellContent(rawString, type, styleCode, category, fieldKind = 'challan') {
  if (!rawString || rawString === "-" || String(rawString).trim() === "") {
    return `<span style="color: var(--text-faint); font-size: 0.76rem;">-</span>`;
  }

  const cleanStr = String(rawString).trim();
  const items = cleanStr.split('/').map(s => s.trim()).filter(Boolean);
  const isMono = fieldKind === 'challan';
  const fontStyle = isMono ? 'font-family: var(--font-mono); font-size: 0.76rem; font-weight: 700;' : 'font-size: 0.76rem; color: var(--text-muted);';

  if (items.length <= 1) {
    return `<div style="${fontStyle} line-height: 1.25;" title="${escapeHtml(cleanStr)}">${escapeHtml(cleanStr)}</div>`;
  }

  // Multi-item formatting:
  // Break only at slash boundaries with non-breaking items so challan numbers / dates NEVER cut in half!
  const formattedHtml = items.map(escapeHtml).join(' <span style="color: var(--text-muted); opacity: 0.65;">/</span> ');
  const badgeClass = type === 'dispatch' ? 'badge-dispatch' : '';
  const countBadge = `<span class="multi-cell-badge ${badgeClass}" title="${items.length} items. Click cell to view all in window">${items.length} ↗</span>`;

  return `
    <div class="multi-cell-clickable" onclick="openChallanHistoryModal('${escapeHtml(styleCode)}', '${escapeHtml(category)}', '${type}')" title="Click to view all ${items.length} ${type} ${fieldKind}s in popup window">
      <div class="multi-cell-scroll" style="${fontStyle}">
        ${formattedHtml} ${countBadge}
      </div>
    </div>
  `;
}

function openChallanHistoryModal(styleCode, category, type = "receiving") {
  const cleanCode = (styleCode || "").trim();
  const cleanCat = (category || "Shirt").trim();
  const isReceiving = type === "receiving";

  const modal = document.getElementById("modal-challan-history");
  if (!modal) return;

  const iconBox = document.getElementById("challan-history-icon-box");
  const titleEl = document.getElementById("challan-history-title");
  const styleTag = document.getElementById("challan-history-style-tag");
  const catTag = document.getElementById("challan-history-cat-tag");
  const countBadge = document.getElementById("challan-history-count-badge");
  const totalQtyEl = document.getElementById("challan-history-total-qty");
  const contractorEl = document.getElementById("challan-history-contractor");
  const tbody = document.getElementById("challan-history-tbody");
  const copyChallansInput = document.getElementById("challan-history-copy-challans");
  const copyDatesInput = document.getElementById("challan-history-copy-dates");

  // Fetch all matching logs
  let logs = [];
  if (isReceiving) {
    logs = window.db.getReceivingLogs().filter(r =>
      (r.style_code || "").trim().toLowerCase() === cleanCode.toLowerCase() &&
      (r.category || "").trim().toLowerCase() === cleanCat.toLowerCase()
    );
    if (typeof window.db.sortLogsChronologically === "function") {
      logs = window.db.sortLogsChronologically(logs, 'date_receive');
    }
  } else {
    logs = window.db.getDispatchLogs().filter(d =>
      (d.style_code || "").trim().toLowerCase() === cleanCode.toLowerCase() &&
      (d.category || "").trim().toLowerCase() === cleanCat.toLowerCase()
    );
    if (typeof window.db.sortLogsChronologically === "function") {
      logs = window.db.sortLogsChronologically(logs, 'date_dispatch');
    }
  }

  // Master record for fallbacks
  const master = window.db.findMasterByStyleAndCategory(cleanCode, cleanCat);

  // Update Header
  if (iconBox) {
    iconBox.innerHTML = isReceiving ? "📥" : "📤";
    iconBox.style.background = isReceiving ? "rgba(16, 185, 129, 0.15)" : "rgba(168, 85, 247, 0.15)";
    iconBox.style.borderColor = isReceiving ? "rgba(16, 185, 129, 0.4)" : "rgba(168, 85, 247, 0.4)";
  }
  if (titleEl) {
    titleEl.innerHTML = `<span>${isReceiving ? "📥 Inward Receiving Challan History" : "📤 Outward Dispatch Challan History"}</span>`;
  }
  if (styleTag) styleTag.textContent = cleanCode;
  if (catTag) catTag.textContent = cleanCat;

  const contractorName = (master && master.contractor_name) || (logs[0] && logs[0].contractor_name) || "Unassigned";
  if (contractorEl) {
    contractorEl.innerHTML = `Contractor: <strong style="color: var(--text-main);">${escapeHtml(contractorName)}</strong>`;
  }

  let totalQty = 0;
  let challanList = [];
  let dateList = [];

  if (logs.length > 0) {
    tbody.innerHTML = logs.map((log, idx) => {
      const challan = isReceiving ? (log.challan_rec || '-') : (log.challan_dis || '-');
      const dateVal = isReceiving ? (log.date_receive || '-') : (log.date_dispatch || '-');
      const qty = isReceiving ? (parseInt(log.received_qty, 10) || 0) : (parseInt(log.dispatch_qty, 10) || 0);
      totalQty += qty;

      if (challan && challan !== '-') challanList.push(challan);
      if (dateVal && dateVal !== '-') dateList.push(dateVal);

      return `
        <tr style="border-bottom: 1px solid var(--border-color); ${idx % 2 === 1 ? 'background: rgba(255,255,255,0.02);' : ''}">
          <td style="padding: 6px 10px; text-align: center; color: var(--text-muted); font-family: var(--font-mono); font-weight: 700;">${idx + 1}</td>
          <td style="padding: 6px 10px; font-family: var(--font-mono); font-weight: 700; color: ${isReceiving ? '#38bdf8' : '#c084fc'};">${escapeHtml(challan)}</td>
          <td style="padding: 6px 10px; color: var(--text-muted);">${escapeHtml(dateVal)}</td>
          <td style="padding: 6px 10px; text-align: right; font-family: var(--font-mono); font-weight: 800; color: var(--text-main);">${qty.toLocaleString()} pcs</td>
          <td style="padding: 6px 10px; color: var(--text-muted); font-size: 0.75rem;">${escapeHtml(log.remarks || '-')}</td>
        </tr>
      `;
    }).join("");
  } else {
    // If no individual logs found, parse from master record
    const rawChallans = isReceiving ? (master?.challan_rec || '') : (master?.challan_dis || '');
    const rawDates = isReceiving ? (master?.date_receive || '') : (master?.date_dispatch || '');
    totalQty = isReceiving ? (master?.received_qty || 0) : (master?.dispatch_from_hemb || 0);

    const cArr = rawChallans.split('/').map(s => s.trim()).filter(Boolean);
    const dArr = rawDates.split('/').map(s => s.trim()).filter(Boolean);
    challanList = cArr;
    dateList = dArr;

    const maxRows = Math.max(cArr.length, dArr.length, 1);
    let rowsHtml = '';
    for (let i = 0; i < maxRows; i++) {
      rowsHtml += `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 6px 10px; text-align: center; color: var(--text-muted); font-family: var(--font-mono);">${i + 1}</td>
          <td style="padding: 6px 10px; font-family: var(--font-mono); font-weight: 700; color: ${isReceiving ? '#38bdf8' : '#c084fc'};">${escapeHtml(cArr[i] || '-')}</td>
          <td style="padding: 6px 10px; color: var(--text-muted);">${escapeHtml(dArr[i] || '-')}</td>
          <td style="padding: 6px 10px; text-align: right; font-family: var(--font-mono);">-</td>
          <td style="padding: 6px 10px; color: var(--text-muted);">-</td>
        </tr>
      `;
    }
    tbody.innerHTML = rowsHtml;
  }

  const countVal = logs.length > 0 ? logs.length : Math.max(challanList.length, 1);
  if (countBadge) countBadge.textContent = `${countVal} ${countVal === 1 ? 'Challan' : 'Challans'}`;
  if (totalQtyEl) totalQtyEl.textContent = `${totalQty.toLocaleString()} pcs`;

  if (copyChallansInput) copyChallansInput.value = challanList.join('/');
  if (copyDatesInput) copyDatesInput.value = dateList.join('/');

  openModal("modal-challan-history");
}

function copyChallanHistoryString(inputId, label) {
  const input = document.getElementById(inputId);
  if (!input || !input.value) {
    showToast(`No ${label} to copy!`, "info");
    return;
  }
  navigator.clipboard.writeText(input.value).then(() => {
    showToast(`✓ Copied ${label}: ${input.value}`);
  }).catch(() => {
    input.select();
    document.execCommand("copy");
    showToast(`✓ Copied ${label}!`);
  });
}

window.openChallanHistoryModal = openChallanHistoryModal;
window.copyChallanHistoryString = copyChallanHistoryString;

// -------------------------------------------------------------
// TAB 2: INWARD RECEIVING LOG VIEW (Discrete Challan Lines)
// -------------------------------------------------------------
function initReceivingLogView() {
  const searchInput = document.getElementById("rec-search-input");
  const catFilter = document.getElementById("filter-rec-category");
  const contFilter = document.getElementById("filter-rec-contractor");

  const debouncedRenderRec = debounce(() => renderReceivingLog(), 120);

  if (searchInput) {
    searchInput.addEventListener("input", debouncedRenderRec);
  }
  [catFilter, contFilter].forEach(el => {
    if (el) el.addEventListener("change", () => renderReceivingLog());
  });

  document.getElementById("btn-open-rec-modal")?.addEventListener("click", () => {
    openMasterEntryModal(null, "receiving");
  });

  document.getElementById("btn-export-rec-csv")?.addEventListener("click", exportReceivingLogToCSV);
}

function renderReceivingLog() {
  const tbody = document.getElementById("tbody-receiving-log");
  const tfoot = document.getElementById("tfoot-receiving-log");
  if (!tbody) return;

  const canEdit = window.db.canUserPerformAction("can_edit");
  const canDelete = window.db.canUserPerformAction("can_delete");

  const searchQuery = (document.getElementById("rec-search-input")?.value || "").toLowerCase().trim();
  const selectedCat = document.getElementById("filter-rec-category")?.value || "";
  const selectedCont = document.getElementById("filter-rec-contractor")?.value || "";

  let list = window.db.getReceivingLogs();

  // Filter
  list = list.filter(item => {
    const codeMatch = (item.style_code || "").toLowerCase().includes(searchQuery);
    const catMatch = (item.category || "").toLowerCase().includes(searchQuery);
    const challanMatch = (item.challan_rec || "").toLowerCase().includes(searchQuery);
    const contMatch = (item.contractor_name || "").toLowerCase().includes(searchQuery);
    const remarksMatch = (item.remarks || "").toLowerCase().includes(searchQuery);
    const queryPassed = !searchQuery || codeMatch || catMatch || challanMatch || contMatch || remarksMatch;

    const catPassed = !selectedCat || (item.category || "").toLowerCase() === selectedCat.toLowerCase();
    const contPassed = !selectedCont || (item.contractor_name || "").toLowerCase() === selectedCont.toLowerCase();

    return queryPassed && catPassed && contPassed;
  });

  // KPIs
  const allLogs = window.db.getReceivingLogs();
  const totalPieces = allLogs.reduce((acc, r) => acc + (parseInt(r.received_qty, 10) || 0), 0);
  const distinctVarieties = new Set(allLogs.map(r => `${r.style_code}:::${r.category}`)).size;

  const elEntries = document.getElementById("rec-kpi-entries");
  if (elEntries) elEntries.textContent = allLogs.length.toLocaleString();
  const elPieces = document.getElementById("rec-kpi-pieces");
  if (elPieces) elPieces.textContent = totalPieces.toLocaleString();
  const elDistinct = document.getElementById("rec-kpi-distinct");
  if (elDistinct) elDistinct.textContent = distinctVarieties.toLocaleString();
  const elBadge = document.getElementById("rec-kpi-count-badge");
  if (elBadge) elBadge.textContent = `${allLogs.length} Challans`;

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          No receiving challan entries found. Click <strong>"📥 + New Receiving Entry"</strong> to record incoming goods from cutting.
        </td>
      </tr>
    `;
    if (tfoot) tfoot.innerHTML = "";
    return;
  }

  let sumCut = 0;
  let sumRec = 0;

  tbody.innerHTML = list.map((item) => {
    sumCut += (item.cut_qty || 0);
    sumRec += (item.received_qty || 0);

    const displayCont = (item.contractor_name && item.contractor_name !== "-")
      ? item.contractor_name
      : (window.db.getContractorForStyle(item.style_code, item.category)?.contractor_name || "-");

    return `
      <tr>
        <td style="text-align: center; font-weight: 700; color: var(--text-muted); font-family: var(--font-mono);">${item.sr_no || item.id}</td>
        <td style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(item.date_receive || '-')}</td>
        <td class="cell-challan-rec">${escapeHtml(item.challan_rec || '-')}</td>
        <td><span class="style-code-badge">${escapeHtml(item.style_code)}</span></td>
        <td><span class="badge-tag inline">${escapeHtml(item.category)}</span></td>
        <td>
          <span class="contractor-tag">
            <span class="avatar-dot"></span>
            ${escapeHtml(displayCont)}
          </span>
        </td>
        <td style="text-align: right; font-family: var(--font-mono); font-weight: 600;">${(item.cut_qty || 0).toLocaleString()}</td>
        <td class="cell-rec-qty">${(item.received_qty || 0).toLocaleString()}</td>
        <td style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(item.remarks || '-')}</td>
        <td style="text-align: center; white-space: nowrap;">
          ${canEdit ? `<button class="btn btn-secondary btn-sm" style="color: var(--primary); padding: 2px 8px; margin-right: 4px;" onclick="editReceivingLogEntry(${item.id})" title="Edit receiving challan">✏️ Edit</button>` : ''}
          ${canDelete ? `<button class="btn btn-secondary btn-sm" style="color: var(--accent-rose); padding: 2px 7px;" onclick="deleteReceivingLogEntry(${item.id})" title="Delete receiving challan">✕</button>` : ''}
          ${!canEdit && !canDelete ? `<span style="color: var(--text-faint); font-size: 0.75rem;">View Only</span>` : ''}
        </td>
      </tr>
    `;
  }).join("");

  if (tfoot) {
    tfoot.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: right; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.8rem; padding: 0.85rem 1rem;">Filtered Totals (${list.length} Challans):</td>
        <td style="text-align: right; font-family: var(--font-mono);">${sumCut.toLocaleString()}</td>
        <td class="cell-rec-qty">${sumRec.toLocaleString()}</td>
        <td colspan="2"></td>
      </tr>
    `;
  }
}

async function deleteReceivingLogEntry(id) {
  if (!window.db.canUserPerformAction("can_delete")) {
    showToast("Permission Denied: You do not have permission to delete receiving challans.", "error");
    return;
  }
  if (confirm("Delete this receiving challan entry? Master inventory balance will be automatically recalculated.")) {
    window.lastUserActionTime = Date.now();
    await window.db.deleteReceivingLog(id);
    renderAll();
    showToast("Receiving challan deleted and balance recalculated.");
  }
}

// -------------------------------------------------------------
// TAB 3: OUTWARD DISPATCH LOG VIEW (Discrete Challan Lines)
// -------------------------------------------------------------
function initDispatchLogView() {
  const searchInput = document.getElementById("dis-search-input");
  const catFilter = document.getElementById("filter-dis-category");
  const contFilter = document.getElementById("filter-dis-contractor");

  const debouncedRenderDis = debounce(() => renderDispatchLog(), 120);

  if (searchInput) {
    searchInput.addEventListener("input", debouncedRenderDis);
  }
  [catFilter, contFilter].forEach(el => {
    if (el) el.addEventListener("change", () => renderDispatchLog());
  });

  document.getElementById("btn-open-dis-modal")?.addEventListener("click", () => {
    openMasterEntryModal(null, "dispatch");
  });

  document.getElementById("btn-export-dis-csv")?.addEventListener("click", exportDispatchLogToCSV);
}

function renderDispatchLog() {
  const tbody = document.getElementById("tbody-dispatch-log");
  const tfoot = document.getElementById("tfoot-dispatch-log");
  if (!tbody) return;

  const canEdit = window.db.canUserPerformAction("can_edit");
  const canDelete = window.db.canUserPerformAction("can_delete");

  const searchQuery = (document.getElementById("dis-search-input")?.value || "").toLowerCase().trim();
  const selectedCat = document.getElementById("filter-dis-category")?.value || "";
  const selectedCont = document.getElementById("filter-dis-contractor")?.value || "";

  let list = window.db.getDispatchLogs();

  // Filter
  list = list.filter(item => {
    const codeMatch = (item.style_code || "").toLowerCase().includes(searchQuery);
    const catMatch = (item.category || "").toLowerCase().includes(searchQuery);
    const challanMatch = (item.challan_dis || "").toLowerCase().includes(searchQuery);
    const contMatch = (item.contractor_name || "").toLowerCase().includes(searchQuery);
    const remarksMatch = (item.remarks || "").toLowerCase().includes(searchQuery);
    const queryPassed = !searchQuery || codeMatch || catMatch || challanMatch || contMatch || remarksMatch;

    const catPassed = !selectedCat || (item.category || "").toLowerCase() === selectedCat.toLowerCase();
    const contPassed = !selectedCont || (item.contractor_name || "").toLowerCase() === selectedCont.toLowerCase();

    return queryPassed && catPassed && contPassed;
  });

  // KPIs
  const allLogs = window.db.getDispatchLogs();
  const totalPieces = allLogs.reduce((acc, d) => acc + (parseInt(d.dispatch_qty, 10) || 0), 0);
  const distinctVarieties = new Set(allLogs.map(d => `${d.style_code}:::${d.category}`)).size;

  const elEntries = document.getElementById("dis-kpi-entries");
  if (elEntries) elEntries.textContent = allLogs.length.toLocaleString();
  const elPieces = document.getElementById("dis-kpi-pieces");
  if (elPieces) elPieces.textContent = totalPieces.toLocaleString();
  const elDistinct = document.getElementById("dis-kpi-distinct");
  if (elDistinct) elDistinct.textContent = distinctVarieties.toLocaleString();
  const elBadge = document.getElementById("dis-kpi-count-badge");
  if (elBadge) elBadge.textContent = `${allLogs.length} Challans`;

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          No dispatch challan entries found. Click <strong>"📤 + New Dispatch Entry"</strong> to record finished embroidery dispatches.
        </td>
      </tr>
    `;
    if (tfoot) tfoot.innerHTML = "";
    return;
  }

  let sumDis = 0;

  tbody.innerHTML = list.map((item) => {
    sumDis += (item.dispatch_qty || 0);

    let remarkBadge = "";
    const rLower = (item.remarks || "").toLowerCase();
    if (rLower.includes("alter")) remarkBadge = `<span class="badge-tag alter">ALTER</span> `;
    else if (rLower.includes("inline")) remarkBadge = `<span class="badge-tag inline">INLINE</span> `;
    else if (rLower.includes("issue") || rLower.includes("m-na")) remarkBadge = `<span class="badge-tag issue">ISSUE</span> `;

    const displayCont = (item.contractor_name && item.contractor_name !== "-")
      ? item.contractor_name
      : (window.db.getContractorForStyle(item.style_code, item.category)?.contractor_name || "-");

    return `
      <tr>
        <td style="text-align: center; font-weight: 700; color: var(--text-muted); font-family: var(--font-mono);">${item.sr_no || item.id}</td>
        <td style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(item.date_dispatch || '-')}</td>
        <td class="cell-challan-dis">${escapeHtml(item.challan_dis || '-')}</td>
        <td><span class="style-code-badge">${escapeHtml(item.style_code)}</span></td>
        <td><span class="badge-tag inline">${escapeHtml(item.category)}</span></td>
        <td>
          <span class="contractor-tag">
            <span class="avatar-dot"></span>
            ${escapeHtml(displayCont)}
          </span>
        </td>
        <td class="cell-dis-qty">${(item.dispatch_qty || 0).toLocaleString()}</td>
        <td style="font-size: 0.8rem;">${remarkBadge}${escapeHtml(item.remarks || '-')}</td>
        <td style="text-align: center; white-space: nowrap;">
          ${canEdit ? `<button class="btn btn-secondary btn-sm" style="color: var(--primary); padding: 2px 8px; margin-right: 4px;" onclick="editDispatchLogEntry(${item.id})" title="Edit dispatch challan">✏️ Edit</button>` : ''}
          ${canDelete ? `<button class="btn btn-secondary btn-sm" style="color: var(--accent-rose); padding: 2px 7px;" onclick="deleteDispatchLogEntry(${item.id})" title="Delete dispatch challan">✕</button>` : ''}
          ${!canEdit && !canDelete ? `<span style="color: var(--text-faint); font-size: 0.75rem;">View Only</span>` : ''}
        </td>
      </tr>
    `;
  }).join("");

  if (tfoot) {
    tfoot.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: right; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.8rem; padding: 0.85rem 1rem;">Filtered Totals (${list.length} Challans):</td>
        <td class="cell-dis-qty">${sumDis.toLocaleString()}</td>
        <td colspan="2"></td>
      </tr>
    `;
  }
}

async function deleteDispatchLogEntry(id) {
  if (!window.db.canUserPerformAction("can_delete")) {
    showToast("Permission Denied: You do not have permission to delete dispatch challans.", "error");
    return;
  }
  if (confirm("Delete this dispatch challan entry? Master inventory balance will be automatically recalculated.")) {
    window.lastUserActionTime = Date.now();
    await window.db.deleteDispatchLog(id);
    renderAll();
    showToast("Dispatch challan deleted and balance recalculated.");
  }
}

// -------------------------------------------------------------
// TAB 4: DAILY FINAL STYLE REPORT (Strict Style + Category)
// -------------------------------------------------------------
function initFinalStyleView() {
  const datePicker = document.getElementById("report-date-picker");
  if (datePicker) {
    datePicker.value = window.db.getReportDate();
    updateDateDisplay(datePicker.value);

    datePicker.addEventListener("change", (e) => {
      window.db.setReportDate(e.target.value);
      updateDateDisplay(e.target.value);
    });
  }

  // When Style Code is selected, update available categories
  const quickSelect = document.getElementById("quick-style-select");
  if (quickSelect) {
    quickSelect.addEventListener("change", (e) => {
      const selectedCode = e.target.value;
      if (selectedCode) {
        const categories = window.db.getCategoriesForStyle(selectedCode);
        const catSelect = document.getElementById("quick-category-select");
        if (catSelect && categories.length > 0) {
          catSelect.value = categories[0];
        }
      }
    });
  }

  // Add to daily sheet button
  document.getElementById("btn-add-final-style")?.addEventListener("click", () => {
    const styleSelect = document.getElementById("quick-style-select");
    const catSelect = document.getElementById("quick-category-select");
    const remarksInput = document.getElementById("quick-remarks-input");

    const code = styleSelect?.value?.trim();
    const cat = catSelect?.value?.trim() || "Shirt";
    const remarks = remarksInput?.value?.trim() || "";

    if (!code) {
      showToast("Please select a Style Code first!", "error");
      return;
    }

    window.db.addFinalStyle(code, cat, remarks);
    renderFinalStyleSheet();
    showToast(`Added ${code} (${cat}) to Daily Sheet!`);

    if (remarksInput) remarksInput.value = "";
  });

  // Auto-populate active styles with pending H-Emb balance
  document.getElementById("btn-auto-populate-active")?.addEventListener("click", () => {
    const master = window.db.getMasterInventory();
    const activeStyles = master.filter(m => m.balance_from_hemb > 0);

    if (activeStyles.length === 0) {
      showToast("No active styles with pending H-Emb balance found.", "info");
      return;
    }

    const currentFinal = window.db.getFinalStyles();
    let addedCount = 0;

    activeStyles.forEach(s => {
      // STRICT MATCH on both style_code AND category
      const alreadyInSheet = currentFinal.some(f => 
        f.style_code.toLowerCase() === s.style_code.toLowerCase() && 
        f.category.toLowerCase() === s.category.toLowerCase()
      );
      if (!alreadyInSheet) {
        window.db.addFinalStyle(s.style_code, s.category, s.remarks || "");
        addedCount++;
      }
    });

    renderFinalStyleSheet();
    showToast(`Added ${addedCount} active running styles to today's sheet!`);
  });

  // Print button
  document.getElementById("btn-print-report")?.addEventListener("click", () => {
    openPrintStudio("daily");
  });

  // Export report
  document.getElementById("btn-export-final-csv")?.addEventListener("click", exportFinalStylesToCSV);
}

function updateDateDisplay(dateStr) {
  if (!dateStr) return;
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthName = months[parseInt(parts[1], 10) - 1] || parts[1];
    const formatted = `${parts[2]}-${monthName}-${parts[0]}`;
    document.getElementById("report-formatted-date").textContent = formatted;
    document.getElementById("print-date-display").textContent = `Date: ${formatted}`;
  }
}

function setQuickRemark(tag) {
  const input = document.getElementById("quick-remarks-input");
  if (input) {
    input.value = tag;
    input.focus();
  }
}

function renderFinalStyleSheet() {
  const tbody = document.getElementById("tbody-final-styles");
  const tfoot = document.getElementById("tfoot-final-styles");
  if (!tbody) return;

  const canEdit = window.db.canUserPerformAction("can_edit");
  const canDelete = window.db.canUserPerformAction("can_delete");

  const list = window.db.getFinalStyles();

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          No styles added to this sheet yet. Select a Style Code & Category above or click <strong>"Auto-Add Active Styles"</strong>.
        </td>
      </tr>
    `;
    if (tfoot) tfoot.innerHTML = "";
    renderContractorSummarySidebar();
    return;
  }

  let totalCut = 0;
  let totalRec = 0;
  let totalBalStock = 0;
  let totalBalHemb = 0;

  tbody.innerHTML = list.map((item, index) => {
    totalCut += item.cut_qty;
    totalRec += item.received_qty;
    totalBalStock += item.balance_from_stock;
    totalBalHemb += item.balance_from_hemb;

    const balStockClass = item.balance_from_stock > 0 ? "balance-highlight-pink" : "";
    const balHembClass = item.balance_from_hemb > 0 ? "balance-highlight-pink" : "";

    let remarkBadge = "";
    const rLower = (item.time_remarks || "").toLowerCase();
    if (rLower.includes("not available") || rLower.includes("issue") || rLower.includes("m-na")) {
      remarkBadge = `<span class="badge-tag issue" style="margin-right: 4px;">MATERIAL ISSUE</span>`;
    } else if (rLower.includes("inline")) {
      remarkBadge = `<span class="badge-tag inline" style="margin-right: 4px;">INLINE</span>`;
    } else if (rLower.includes("alter")) {
      remarkBadge = `<span class="badge-tag alter" style="margin-right: 4px;">ALTER</span>`;
    }

    const displayCont = (item.contractor_name && item.contractor_name !== "-")
      ? item.contractor_name
      : (window.db.getContractorForStyle(item.style_code, item.category)?.contractor_name || "-");

    return `
      <tr>
        <td style="text-align: center; font-weight: 700; font-family: var(--font-mono); color: var(--text-muted);">${item.s_no || index + 1}</td>
        <td>
          <span class="style-code-badge">${escapeHtml(item.style_code)}</span>
        </td>
        <td><span class="badge-tag inline">${escapeHtml(item.category)}</span></td>
        <td style="font-weight: 600;">
          <span class="contractor-tag">
            <span class="avatar-dot"></span>
            ${escapeHtml(displayCont)}
          </span>
        </td>
        <td style="font-weight: 700; font-family: var(--font-mono); text-align: right;">${item.cut_qty.toLocaleString()}</td>
        <td style="font-weight: 600; font-family: var(--font-mono); text-align: right;">${item.received_qty.toLocaleString()}</td>
        <td class="${balStockClass}" style="text-align: right; font-family: var(--font-mono);">${item.balance_from_stock.toLocaleString()}</td>
        <td class="${balHembClass}" style="text-align: right; font-family: var(--font-mono);">${item.balance_from_hemb.toLocaleString()}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.35rem;">
            ${remarkBadge}
            <input 
              type="text" 
              class="inline-remark-input" 
              value="${escapeHtml(item.time_remarks || '')}" 
              placeholder="${canEdit ? 'Click to add remarks/date/time...' : 'Read only'}" 
              ${!canEdit ? 'disabled' : ''}
              onchange="updateFinalStyleRemark(${item.s_no}, this.value)"
            >
          </div>
        </td>
        <td style="text-align: center;">
          ${canDelete ? `
          <button class="btn btn-secondary btn-sm" style="color: var(--accent-rose); padding: 2px 7px;" onclick="removeFinalStyleRow(${item.s_no})" title="Remove from sheet">
            ✕
          </button>` : `<span style="color: var(--text-faint); font-size: 0.75rem;">—</span>`}
        </td>
      </tr>
    `;
  }).join("");

  if (tfoot) {
    tfoot.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: right; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.8rem; padding: 0.85rem 1rem;">Total Styles (${list.length}):</td>
        <td style="text-align: right; font-family: var(--font-mono);">${totalCut.toLocaleString()}</td>
        <td style="text-align: right; font-family: var(--font-mono);">${totalRec.toLocaleString()}</td>
        <td style="text-align: right; font-family: var(--font-mono);">${totalBalStock.toLocaleString()}</td>
        <td style="text-align: right; font-family: var(--font-mono); color: var(--accent-rose);">${totalBalHemb.toLocaleString()}</td>
        <td colspan="2"></td>
      </tr>
    `;
  }

  renderContractorSummarySidebar();
}

function updateFinalStyleRemark(sNo, val) {
  if (!window.db.canUserPerformAction("can_edit")) {
    showToast("Permission Denied: You do not have permission to edit remarks.", "error");
    return;
  }
  window.db.updateFinalStyleRemarks(sNo, val);
}

function removeFinalStyleRow(sNo) {
  if (!window.db.canUserPerformAction("can_delete")) {
    showToast("Permission Denied: You do not have permission to remove rows.", "error");
    return;
  }
  window.db.removeFinalStyle(sNo);
  renderFinalStyleSheet();
  showToast("Style removed from daily sheet.", "info");
}

function renderContractorSummarySidebar() {
  const container = document.getElementById("contractor-summary-list");
  const countBadge = document.getElementById("cont-summary-count");
  if (!container) return;

  const summaries = window.db.getContractorSummaries();
  const activeWithBalance = summaries.filter(c => c.balanceInHemb > 0);

  if (countBadge) {
    countBadge.textContent = `${activeWithBalance.length} Active Conts`;
  }

  if (activeWithBalance.length === 0) {
    container.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 1.5rem;">No contractors with pending embroidery balance.</div>`;
    return;
  }

  container.innerHTML = activeWithBalance.map(c => `
    <div class="summary-item">
      <div>
        <div style="font-weight: 700; font-size: 0.875rem;">${escapeHtml(c.name)}</div>
        <div style="font-size: 0.725rem; color: var(--text-faint);">${c.styleCount || 0} Styles | Cut: ${(c.totalCut || 0).toLocaleString()}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-weight: 800; font-family: var(--font-mono); color: var(--accent-rose); font-size: 0.95rem;">
          ${(c.balanceInHemb || 0).toLocaleString()}
        </div>
        <div style="font-size: 0.7rem; color: var(--text-muted);">Pcs in H-Emb</div>
      </div>
    </div>
  `).join("");
}

// -------------------------------------------------------------
// TAB 5: CONTRACTORS DIRECTORY VIEW
// -------------------------------------------------------------
// TAB 5: CONTRACTORS WORKLOAD & DIRECTORY VIEW
// -------------------------------------------------------------
let currentContractorFilterMode = "both"; // "workload", "directory", "both"

function initContractorsView() {
  document.getElementById("btn-open-new-contractor")?.addEventListener("click", () => {
    document.getElementById("form-contractor").reset();
    const title = document.getElementById("modal-cont-title");
    if (title) title.textContent = "Add New Contractor";
    const alertBox = document.getElementById("modal-cont-alert");
    if (alertBox) alertBox.style.display = "none";
    openModal("modal-contractor");
  });

  // Filter mode toggle buttons
  document.getElementById("btn-cont-mode-workload")?.addEventListener("click", () => {
    currentContractorFilterMode = "workload";
    updateContractorModeButtons();
    renderContractorsView();
  });
  document.getElementById("btn-cont-mode-directory")?.addEventListener("click", () => {
    currentContractorFilterMode = "directory";
    updateContractorModeButtons();
    renderContractorsView();
  });
  document.getElementById("btn-cont-mode-both")?.addEventListener("click", () => {
    currentContractorFilterMode = "both";
    updateContractorModeButtons();
    renderContractorsView();
  });

  const form = document.getElementById("form-contractor");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("cont-name")?.value.trim();
      const phone = document.getElementById("cont-phone")?.value.trim();
      const status = document.getElementById("cont-status")?.value || "Active";

      if (!name) {
        showToast("Contractor Name is required!", "error");
        return;
      }

      const saveBtn = form.querySelector("button[type='submit']");
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";
      }

      const res = await window.db.addContractorWithNeon({ name, phone, status });

      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save Contractor";
      }

      closeModal("modal-contractor");
      form.reset();
      renderAll();

      if (res.neonSynced) {
        showToast(`✓ Contractor "${name}" saved & synced to Neon Cloud!`);
      } else if (res.error) {
        showToast(`Contractor saved locally (Neon: ${res.error})`, "error");
      } else {
        showToast(`Contractor "${name}" saved locally!`);
      }
    });
  }
}

function updateContractorModeButtons() {
  const btnWorkload = document.getElementById("btn-cont-mode-workload");
  const btnDir = document.getElementById("btn-cont-mode-directory");
  const btnBoth = document.getElementById("btn-cont-mode-both");

  if (btnWorkload) {
    if (currentContractorFilterMode === "workload") {
      btnWorkload.classList.add("active");
    } else {
      btnWorkload.classList.remove("active");
    }
  }
  if (btnDir) {
    if (currentContractorFilterMode === "directory") {
      btnDir.classList.add("active");
    } else {
      btnDir.classList.remove("active");
    }
  }
  if (btnBoth) {
    if (currentContractorFilterMode === "both") {
      btnBoth.classList.add("active");
    } else {
      btnBoth.classList.remove("active");
    }
  }
}

window.openEditContractorModal = function(name) {
  const contractors = window.db.getContractors();
  const c = contractors.find(item => (item.name || "").toLowerCase() === name.toLowerCase());
  if (!c) return;

  const form = document.getElementById("form-contractor");
  if (!form) return;
  form.reset();

  const title = document.getElementById("modal-cont-title");
  if (title) title.textContent = `Edit Contractor: ${c.name}`;

  const nameInp = document.getElementById("cont-name");
  if (nameInp) nameInp.value = c.name;

  const phoneInp = document.getElementById("cont-phone");
  if (phoneInp) phoneInp.value = c.phone || "";

  const statusInp = document.getElementById("cont-status");
  if (statusInp) statusInp.value = c.status || "Active";

  const alertBox = document.getElementById("modal-cont-alert");
  if (alertBox) alertBox.style.display = "none";

  openModal("modal-contractor");
};

function renderContractorsView() {
  const container = document.getElementById("contractors-card-grid");
  if (!container) return;

  const allWorkloads = window.db.getContractorWorkload();
  const allContractors = window.db.getContractors();

  // Filter ONLY contractors who have pending balance pieces > 0
  const activeWorkloadContractors = allWorkloads.filter(c => c.total_balance > 0);

  // Update badge counters
  const badgeWorkload = document.getElementById("badge-workload-count");
  if (badgeWorkload) badgeWorkload.textContent = activeWorkloadContractors.length;
  const badgeDir = document.getElementById("badge-directory-count");
  if (badgeDir) badgeDir.textContent = allContractors.length;

  let html = "";

  // 1. SECTION: Active Workload (Only Contractors with Pending Balances)
  if (currentContractorFilterMode === "workload" || currentContractorFilterMode === "both") {
    html += `
      <div style="margin-bottom: 2.25rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; border-bottom: 1.5px solid var(--border-color); padding-bottom: 0.65rem;">
          <div>
            <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.2rem; display: flex; align-items: center; gap: 0.5rem;">
              <span>⚖️ Active Contractor Workload</span>
              <span class="badge-tag rose inline">${activeWorkloadContractors.length} Contractors with Pending Pieces</span>
            </h3>
            <p style="font-size: 0.775rem; color: var(--text-muted); margin: 0;">
              Exclusively showing contractors who currently have balance pieces, displaying their style names and balance pieces.
            </p>
          </div>
        </div>
    `;

    if (activeWorkloadContractors.length === 0) {
      html += `
        <div style="text-align: center; padding: 2.5rem 1.5rem; background: var(--bg-card); border: 1.5px dashed var(--border-color); border-radius: var(--radius-lg); color: var(--text-muted);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🎉</div>
          <strong style="color: var(--text-main); font-size: 0.95rem;">No Pending Balance Pieces!</strong>
          <p style="font-size: 0.8rem; margin-top: 0.25rem;">All distributed styles and embroidery orders currently have 0 balance.</p>
        </div>
      `;
    } else {
      html += `
        <div class="kpi-grid" style="grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.25rem;">
          ${activeWorkloadContractors.map(c => `
            <div class="contractor-summary-card" style="border-top: 3.5px solid var(--accent-rose); display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <!-- Card Header -->
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                  <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: linear-gradient(135deg, rgba(244, 63, 94, 0.2), rgba(244, 63, 94, 0.05)); color: var(--accent-rose); border: 1px solid rgba(244, 63, 94, 0.3); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.25rem;">
                      ${escapeHtml((c.name || "C").substring(0, 1).toUpperCase())}
                    </div>
                    <div>
                      <h3 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 0; padding-bottom: 0; border-bottom: none; color: var(--text-main);">
                        ${escapeHtml(c.name)}
                      </h3>
                      <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.4rem; margin-top: 2px;">
                        <span>📞 ${escapeHtml(c.phone || "No phone")}</span>
                      </div>
                    </div>
                  </div>

                  <div style="text-align: right;">
                    <span class="badge-tag rose inline" style="font-size: 0.85rem; font-weight: 800; padding: 4px 8px; letter-spacing: 0.03em;">
                      ${c.total_balance.toLocaleString()} PCS
                    </span>
                    <div style="font-size: 0.675rem; color: var(--text-faint); margin-top: 2px; text-transform: uppercase;">Total Balance</div>
                  </div>
                </div>

                <!-- Active Styles with Pending Pieces Breakdown -->
                <div style="margin-top: 0.85rem;">
                  <div style="font-size: 0.725rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: space-between;">
                    <span>Active Styles (${c.styles.length})</span>
                    <span>Balance Pcs</span>
                  </div>

                  <div style="display: flex; flex-direction: column; gap: 0.4rem; max-height: 220px; overflow-y: auto; padding-right: 4px;">
                    ${c.styles.map(s => `
                      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.45rem 0.65rem; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                        <div style="display: flex; align-items: center; gap: 0.4rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                          <span class="style-code-badge" style="font-size: 0.75rem; font-weight: 800;">${escapeHtml(s.style_code)}</span>
                          <span style="font-size: 0.7rem; color: var(--text-muted);">${escapeHtml(s.category)}</span>
                          ${s.floor ? `<span style="font-size: 0.675rem; color: #a5b4fc; background: rgba(99, 102, 241, 0.1); padding: 1px 4px; border-radius: 3px;">Fl: ${escapeHtml(s.floor)}</span>` : ''}
                        </div>
                        <div style="font-weight: 800; color: var(--accent-rose); font-family: var(--font-mono); font-size: 0.85rem; white-space: nowrap; margin-left: 0.5rem;">
                          ${s.balance_pcs.toLocaleString()} pcs
                        </div>
                      </div>
                    `).join("")}
                  </div>
                </div>
              </div>

              <!-- Card Footer -->
              <div style="margin-top: 1rem; padding-top: 0.65rem; border-top: 1px dashed var(--border-color); display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem;">
                <span style="color: var(--text-muted); font-weight: 600;">
                  ${c.styles.length} Style${c.styles.length === 1 ? '' : 's'} Assigned
                </span>
                <span style="font-weight: 700; color: var(--accent-rose); font-family: var(--font-mono);">
                  Pending: ${c.total_balance.toLocaleString()} pcs
                </span>
              </div>
            </div>
          `).join("")}
        </div>
      `;
    }
    html += `</div>`;
  }

  // 2. SECTION: Registered Contractors Directory (Neon PostgreSQL Master)
  if (currentContractorFilterMode === "directory" || currentContractorFilterMode === "both") {
    html += `
      <div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; border-bottom: 1.5px solid var(--border-color); padding-bottom: 0.65rem;">
          <div>
            <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.2rem; display: flex; align-items: center; gap: 0.5rem;">
              <span>👥 Registered Contractors Directory</span>
              <span class="badge-tag" style="background: rgba(0, 229, 153, 0.12); color: #00e599; border: 1px solid rgba(0, 229, 153, 0.3); font-size: 0.725rem;">Neon Table (${allContractors.length})</span>
            </h3>
            <p style="font-size: 0.775rem; color: var(--text-muted); margin: 0;">
              All registered contractors saved in Neon PostgreSQL. Every form strictly validates and accepts only these names.
            </p>
          </div>
        </div>

        <div class="kpi-grid" style="grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 1.25rem;">
          ${allContractors.map(c => {
            const workloadInfo = allWorkloads.find(w => w.name.toLowerCase() === c.name.toLowerCase()) || { total_balance: 0, style_count: 0 };
            return `
              <div class="contractor-summary-card" style="border: 1px solid var(--border-color); transition: all 0.2s ease;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.85rem;">
                  <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="width: 42px; height: 42px; border-radius: var(--radius-md); background: var(--primary-glow); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.15rem;">
                      ${escapeHtml(c.name.substring(0, 1).toUpperCase())}
                    </div>
                    <div>
                      <h4 style="font-size: 1.05rem; font-weight: 800; margin: 0; color: var(--text-main);">${escapeHtml(c.name)}</h4>
                      <span style="font-size: 0.7rem; color: var(--text-muted);">ID #${c.id || '-'} • Neon Cloud</span>
                    </div>
                  </div>
                  <span class="badge-tag inline">${escapeHtml(c.status || "Active")}</span>
                </div>

                <div style="background: var(--bg-surface); padding: 0.75rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: 0.85rem; font-size: 0.8rem;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem;">
                    <span style="color: var(--text-muted);">Phone / Contact:</span>
                    <strong style="color: var(--text-main); font-family: var(--font-mono);">${escapeHtml(c.phone || "Not Set")}</strong>
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span style="color: var(--text-muted);">Current Balance:</span>
                    ${workloadInfo.total_balance > 0 
                      ? `<strong style="color: var(--accent-rose); font-family: var(--font-mono); font-weight: 800;">${workloadInfo.total_balance.toLocaleString()} pcs (${workloadInfo.style_count} styles)</strong>` 
                      : `<strong style="color: var(--accent-emerald);">✓ 0 pcs balance</strong>`}
                  </div>
                </div>

                <div style="display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem;">
                  ${c.phone ? `<a href="tel:${escapeHtml(c.phone)}" class="btn btn-secondary btn-sm" style="font-size: 0.75rem; text-decoration: none;" title="Call Contractor">📞 Call</a>` : ''}
                  <button class="btn btn-secondary btn-sm" onclick="openEditContractorModal('${escapeHtml(c.name)}')" style="font-size: 0.75rem;">
                    ✏️ Edit
                  </button>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

// -------------------------------------------------------------
// TAB 6: NEON POSTGRESQL CLOUD SYNC & SETTINGS
// -------------------------------------------------------------
function initNeonSyncView() {
  const cfg = window.db.getConfig();
  const connInput = document.getElementById("neon-conn-string");
  const endInput = document.getElementById("neon-endpoint-url");
  const keyInput = document.getElementById("neon-api-key");
  const autoSyncChk = document.getElementById("chk-auto-sync");
  const autoSyncBadge = document.getElementById("auto-sync-status-badge");

  function updateAutoSyncUI(isEnabled) {
    if (autoSyncChk) autoSyncChk.checked = isEnabled;
    if (autoSyncBadge) {
      autoSyncBadge.textContent = isEnabled ? "✓ Auto-Sync ON" : "Off";
      autoSyncBadge.className = isEnabled ? "badge-tag inline" : "badge-tag alter";
    }
  }

  if (connInput) connInput.value = cfg.neonConnectionString || "";
  if (endInput) endInput.value = cfg.neonEndpointUrl || "";
  if (keyInput) keyInput.value = cfg.neonApiKey || "";
  
  // Set persistent checkbox state
  const isAuto = window.db.isAutoSyncEnabled();
  updateAutoSyncUI(isAuto);

  if (cfg.lastSyncTime) {
    const el = document.getElementById("last-sync-time");
    if (el) el.textContent = `Last synced: ${new Date(cfg.lastSyncTime).toLocaleString()}`;
  }

  // Toggle password visibility
  document.getElementById("btn-toggle-neon-pw")?.addEventListener("click", () => {
    if (connInput) {
      connInput.type = connInput.type === "password" ? "text" : "password";
    }
  });

  // IMMEDIATE AUTO-SYNC PERSISTENCE
  if (autoSyncChk) {
    autoSyncChk.addEventListener("change", (e) => {
      const isChecked = e.target.checked;
      window.db.setAutoSync(isChecked);
      updateAutoSyncUI(isChecked);

      if (isChecked) {
        showToast("✓ Live Auto-Sync enabled and permanently saved!", "success");
        startLiveNeonConnection();
      } else {
        showToast("Auto-sync disabled.", "info");
        startLiveNeonConnection();
      }
    });
  }

  // Save Settings
  document.getElementById("btn-save-neon-cfg")?.addEventListener("click", () => {
    const val = connInput.value.trim();
    if (val.includes("****")) {
      showToast("Notice: In Neon Console, click 'Show password' to copy your real password instead of '****'!", "error");
    }

    const isChecked = autoSyncChk ? autoSyncChk.checked : window.db.isAutoSyncEnabled();
    window.db.saveConfig({
      neonConnectionString: val,
      neonEndpointUrl: endInput.value.trim(),
      neonApiKey: keyInput.value.trim(),
      autoSync: isChecked
    });
    updateAutoSyncUI(isChecked);
    showToast("Neon settings saved!");
    startLiveNeonConnection();
  });

  // Test Connection
  document.getElementById("btn-test-neon")?.addEventListener("click", async () => {
    const resBox = document.getElementById("neon-test-result");
    if (resBox) {
      resBox.style.display = "block";
      resBox.innerHTML = `<span style="color: var(--primary);">Connecting to Neon PostgreSQL...</span>`;
    }

    const connVal = connInput ? connInput.value.trim() : "";
    const endVal = endInput ? endInput.value.trim() : "";
    const keyVal = keyInput ? keyInput.value.trim() : "";
    const isChecked = autoSyncChk ? autoSyncChk.checked : window.db.isAutoSyncEnabled();

    // Persist configuration permanently when testing so user doesn't lose it on refresh
    if (connVal || endVal) {
      window.db.saveConfig({
        neonConnectionString: connVal,
        neonEndpointUrl: endVal,
        neonApiKey: keyVal,
        autoSync: isChecked
      });
      updateAutoSyncUI(isChecked);
    }

    const res = await window.db.testNeonConnection(connVal || null);
    if (res.success) {
      if (resBox) {
        resBox.innerHTML = `
          <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid var(--accent-emerald); padding: 0.75rem; border-radius: var(--radius-md); color: var(--accent-emerald); font-size: 0.85rem;">
            ✓ Successfully connected to Neon PostgreSQL!<br>
            <span style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">${JSON.stringify(res.data)}</span>
          </div>
        `;
      }
      showToast("Neon Connection Verified!");
      checkNeonStatus(true);
      startLiveNeonConnection();
    } else {
      if (resBox) {
        resBox.innerHTML = `
          <div style="background: rgba(244, 63, 94, 0.12); border: 1px solid var(--accent-rose); padding: 0.75rem; border-radius: var(--radius-md); color: var(--accent-rose); font-size: 0.85rem;">
            ✕ Neon Connection Failed: ${escapeHtml(res.error)}
          </div>
        `;
      }
      showToast("Neon Connection Failed", "error");
      checkNeonStatus(false);
    }
  });

  // Initialize Tables
  document.getElementById("btn-init-neon-tables")?.addEventListener("click", async () => {
    try {
      showToast("Initializing tables on Neon...", "info");
      await window.db.initNeonTables();
      showToast("PostgreSQL tables successfully created on Neon!");
      startLiveNeonConnection();
    } catch (err) {
      showToast(`Error initializing tables: ${err.message}`, "error");
    }
  });

  // Clean & Upgrade Table Columns on Neon
  document.getElementById("btn-migrate-neon-tables")?.addEventListener("click", async () => {
    const btn = document.getElementById("btn-migrate-neon-tables");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Upgrading Columns...";
    }
    try {
      showToast("Upgrading payment_sheet columns on Neon...", "info");
      const res = await window.db.migrateNeonPaymentSchema();
      if (res && res.success) {
        showToast("✓ Neon table successfully upgraded! Useless columns removed & period column active.", "success");
      } else {
        showToast(res && res.error ? `Notice: ${res.error}` : "Schema migration finished.", "info");
      }
      startLiveNeonConnection();
    } catch (err) {
      showToast(`Error upgrading columns: ${err.message}`, "error");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "🔧 Clean & Upgrade Table Columns";
      }
    }
  });

  // Push to Neon
  document.getElementById("btn-push-to-neon")?.addEventListener("click", async () => {
    showToast("Pushing data to Neon PostgreSQL...", "info");
    const res = await window.db.syncToNeon();
    if (res.success) {
      showToast(res.message);
      document.getElementById("last-sync-time").textContent = `Last synced: ${new Date().toLocaleString()}`;
    } else {
      showToast(`Push failed: ${res.error}`, "error");
    }
  });

  // Pull from Neon
  document.getElementById("btn-pull-from-neon")?.addEventListener("click", async () => {
    showToast("Pulling data from Neon...", "info");
    await syncLiveFromNeon(false);
  });

  // View Schema Modal
  document.getElementById("btn-view-schema-modal")?.addEventListener("click", () => {
    openSchemaModal();
  });
}

// -------------------------------------------------------------
// REAL-TIME LIVE NEON CONNECTION (Bi-directional Polling & Focus)
// -------------------------------------------------------------
let liveSyncTimer = null;
let isLiveSyncing = false;
window.lastUserActionTime = 0;

function getDataSignature() {
  try {
    const m = (window.db.getMasterInventory() || []).length;
    const r = (window.db.getReceivingLogs() || []).length;
    const d = (window.db.getDispatchLogs() || []).length;
    const p = (window.db.getPaymentSheets() || []).length;
    const w = (window.db.getWorkDistribution() || []).length;
    const c = (window.db.getContractors() || []).length;
    const del = localStorage.getItem("hand_emb_deleted_records_v1") || "";
    const mFirst = (window.db.getMasterInventory() || [])[0]?.id || "";
    const rFirst = (window.db.getReceivingLogs() || [])[0]?.id || "";
    const dFirst = (window.db.getDispatchLogs() || [])[0]?.id || "";
    return `${m}_${r}_${d}_${p}_${w}_${c}_${del}_${mFirst}_${rFirst}_${dFirst}`;
  } catch (e) {
    return "";
  }
}

function startLiveNeonConnection() {
  const cfg = window.db.getConfig();

  if (liveSyncTimer) {
    clearInterval(liveSyncTimer);
    liveSyncTimer = null;
  }

  // Only start active polling if connection string or endpoint is configured
  if (!cfg.neonConnectionString && !cfg.neonEndpointUrl) {
    checkNeonStatus();
    return;
  }

  // Immediately reflect ready/connected status in the top bar
  checkNeonStatus();

  // Ensure Neon schema is migrated so period column is available
  window.db.migrateNeonPaymentSchema().catch(() => null);

  // 1. Initial immediate background sync on startup / refresh
  syncLiveFromNeon(true);

  // 2. Continuous real-time polling every 90 seconds (lightweight, zero PC lag, pauses when tab hidden)
  if (cfg.autoSync !== false) {
    liveSyncTimer = setInterval(() => {
      if (document.hidden) return; // Zero background CPU/network load when tab is minimized
      const currentCfg = window.db.getConfig();
      if (currentCfg.autoSync !== false && (currentCfg.neonConnectionString || currentCfg.neonEndpointUrl)) {
        syncLiveFromNeon(true);
      }
    }, 90000);
  }
}

// 3. Gentle sync whenever user switches back to this tab (throttled to 30s)
let lastWindowFocusSync = 0;
window.addEventListener("focus", () => {
  if (Date.now() - lastWindowFocusSync < 30000) return;
  lastWindowFocusSync = Date.now();
  const currentCfg = window.db.getConfig();
  if (currentCfg.autoSync !== false && (currentCfg.neonConnectionString || currentCfg.neonEndpointUrl)) {
    syncLiveFromNeon(true);
  }
});

async function syncLiveFromNeon(isBackground = true) {
  if (isLiveSyncing) return;

  // Don't disturb user if they are currently typing in an open modal or active input/select
  const activeModal = document.querySelector(".modal-backdrop.open");
  const isInputActive = document.activeElement && 
    (document.activeElement.tagName === "INPUT" || 
     document.activeElement.tagName === "SELECT" || 
     document.activeElement.tagName === "TEXTAREA");
  if ((activeModal || isInputActive) && isBackground) return;

  // Pause background sync for 10 seconds if user just performed an action (deleted/edited/added data)
  if (isBackground && window.lastUserActionTime && (Date.now() - window.lastUserActionTime < 10000)) {
    return;
  }

  isLiveSyncing = true;
  try {
    const preSig = getDataSignature();
    const res = await window.db.fetchFromNeon();
    const postSig = getDataSignature();

    const dot = document.getElementById("neon-status-dot");
    const label = document.getElementById("neon-status-label");

    if (res && res.success) {
      // ONLY re-render DOM if data actually changed AND user is not actively typing
      const currentlyTyping = document.activeElement && 
        (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA");
      if ((!isBackground || preSig !== postSig) && !currentlyTyping) {
        renderAll();
      }

      if (dot && label) {
        dot.className = "status-dot connected";
        label.textContent = `⚡ Live Connected (${res.count})`;
      }

      const lastSyncEl = document.getElementById("last-sync-time");
      if (lastSyncEl) {
        lastSyncEl.textContent = `Live synced: ${new Date().toLocaleTimeString()}`;
      }

      if (!isBackground) {
        showToast(`✓ Synced from Neon Cloud (${res.count} styles in database)`);
      }
    } else {
      console.warn("Live sync polling notice:", res?.error);
      if (!isBackground) {
        showToast(`Sync notice: ${res?.error || "Could not sync"}`, "info");
      }
    }
  } catch (err) {
    console.warn("Live sync polling error:", err);
  } finally {
    isLiveSyncing = false;
  }
}

async function checkNeonStatus(forcedOnlineState) {
  const dot = document.getElementById("neon-status-dot");
  const label = document.getElementById("neon-status-label");
  if (!dot || !label) return;

  if (forcedOnlineState === true) {
    dot.className = "status-dot connected";
    label.textContent = "⚡ Neon Online";
    return;
  }
  if (forcedOnlineState === false) {
    dot.className = "status-dot disconnected";
    label.textContent = "Offline (Local)";
    return;
  }

  const cfg = window.db.getConfig();
  const hasConn = Boolean(cfg.neonConnectionString || cfg.neonEndpointUrl);
  if (hasConn) {
    dot.className = "status-dot connected";
    const masterLen = (window.db && typeof window.db.getMasterInventory === "function") 
      ? window.db.getMasterInventory().length 
      : 0;
    label.textContent = (cfg.autoSync !== false) 
      ? `⚡ Live Connected (${masterLen})` 
      : "Neon Ready";
  } else {
    dot.className = "status-dot";
    label.textContent = "Neon Local";
  }
}

// -------------------------------------------------------------
// Populating Dynamic Select Elements & Autocomplete Lists
// -------------------------------------------------------------
function populateDropdowns() {
  const contractors = window.db.getContractors();
  const master = window.db.getMasterInventory();

  // Contractor Filters across views
  const filterConts = [
    document.getElementById("filter-contractor"),
    document.getElementById("filter-rec-contractor"),
    document.getElementById("filter-dis-contractor"),
    document.getElementById("filter-payment-contractor")
  ];

  filterConts.forEach(filterEl => {
    if (filterEl) {
      const cur = filterEl.value;
      filterEl.innerHTML = `<option value="">All Contractors</option>` + 
        contractors.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join("");
      filterEl.value = cur;
    }
  });

  // Datalist in Modals (Contractors & Work Distribution)
  const regNames = contractors.map(c => c.name).filter(Boolean);
  const combNames = (typeof INITIAL_CONTRACTOR_COMBINATIONS !== "undefined") ? INITIAL_CONTRACTOR_COMBINATIONS : [];
  const allContOptions = [...new Set([...regNames, ...combNames])];

  const datalistCont = document.getElementById("contractors-datalist");
  if (datalistCont) {
    datalistCont.innerHTML = allContOptions.map(n => `<option value="${escapeHtml(n)}">`).join("");
  }

  const datalistDist = document.getElementById("dist-contractors-datalist");
  if (datalistDist) {
    datalistDist.innerHTML = allContOptions.map(n => `<option value="${escapeHtml(n)}">`).join("");
  }

  // Datalist in Modal (Style Codes - Fast O(N) single-pass)
  const datalistStyles = document.getElementById("styles-master-datalist");
  if (datalistStyles) {
    const styleCatsMap = new Map();
    master.forEach(m => {
      const code = (m.style_code || "").trim();
      if (!code) return;
      if (!styleCatsMap.has(code)) styleCatsMap.set(code, new Set());
      if (m.category) styleCatsMap.get(code).add(m.category);
    });
    let html = "";
    styleCatsMap.forEach((cats, code) => {
      const catList = Array.from(cats).join(", ");
      const label = catList ? `${code} (${catList})` : code;
      html += `<option value="${escapeHtml(code)}">${escapeHtml(label)}</option>`;
    });
    datalistStyles.innerHTML = html;
  }

  // Style Code dropdown in Final Style quick add bar
  const quickStyleSelect = document.getElementById("quick-style-select");
  if (quickStyleSelect) {
    const curVal = quickStyleSelect.value;
    const uniqueStyles = [...new Set(master.map(m => m.style_code))].filter(Boolean);
    quickStyleSelect.innerHTML = `<option value="">-- Choose Style Code --</option>` +
      uniqueStyles.map(code => `<option value="${escapeHtml(code)}">${escapeHtml(code)}</option>`).join("");
    quickStyleSelect.value = curVal;
  }
}

// -------------------------------------------------------------
// MODALS LOGIC & LIVE FORM AUTO-FETCH (Strict Style + Category)
// -------------------------------------------------------------
function initModalHandlers() {
  // Mode toggle tabs inside modal (Receiving vs Dispatch vs Both)
  const modeTabs = document.querySelectorAll(".form-toggle-tab");
  modeTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetMode = tab.getAttribute("data-mode");
      setFormMode(targetMode);
    });
  });

  // Live calculation & auto-fetch listeners
  const styleCodeInput = document.getElementById("entry-style-code");
  const categorySelect = document.getElementById("entry-category");
  const cutInput = document.getElementById("entry-cut-qty");
  const recInput = document.getElementById("entry-received-qty");
  const disInput = document.getElementById("entry-dispatch-qty");
  const remarksInput = document.getElementById("entry-remarks");

  // When style code or category changes -> STRICT LIVE FETCH (Debounced for silky typing)
  const debouncedLiveFetch = debounce(() => handleLiveStyleFetch(), 80);
  const debouncedModalPreview = debounce(() => updateModalPreviewBalances(), 50);

  if (styleCodeInput) {
    styleCodeInput.addEventListener("input", debouncedLiveFetch);
    styleCodeInput.addEventListener("change", () => handleLiveStyleFetch());
  }

  if (categorySelect) {
    categorySelect.addEventListener("change", () => handleLiveStyleFetch());
  }

  // Live KPI preview calculation as quantities change (excluding remarks to prevent typing stutter)
  [cutInput, recInput, disInput].forEach(inp => {
    if (inp) {
      inp.addEventListener("input", debouncedModalPreview);
    }
  });

  // Master Entry Form Submit
  const form = document.getElementById("form-master-entry");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      saveMasterEntryFromForm();
    });
  }

  // Edit Log Entry Form Submit
  const editLogForm = document.getElementById("form-edit-log-entry");
  if (editLogForm) {
    editLogForm.addEventListener("submit", (e) => {
      e.preventDefault();
      saveEditLogFromForm();
    });
  }

  // Live preview for Edit Log Modal (Debounced for silky typing)
  const debouncedEditLogPreview = debounce(() => updateEditLogModalPreview(), 60);
  ["edit-log-style-code", "edit-log-category", "edit-log-qty", "edit-log-cut-qty"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", debouncedEditLogPreview);
      el.addEventListener("change", () => updateEditLogModalPreview());
    }
  });
}

function setFormMode(mode) {
  const targetMode = (mode === "dispatch") ? "dispatch" : "receiving";
  document.querySelectorAll(".form-toggle-tab").forEach(tab => {
    tab.classList.toggle("active", tab.getAttribute("data-mode") === targetMode);
  });

  const hiddenMode = document.getElementById("current-form-mode");
  if (hiddenMode) hiddenMode.value = targetMode;

  const recSection = document.getElementById("form-section-receiving");
  const disSection = document.getElementById("form-section-dispatch");
  const saveBtn = document.getElementById("btn-save-master-entry");

  if (targetMode === "receiving") {
    if (recSection) recSection.style.display = "block";
    if (disSection) disSection.style.display = "none";
    if (saveBtn) {
      saveBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
        Save Receiving Challan & Next
      `;
    }
  } else {
    if (recSection) recSection.style.display = "none";
    if (disSection) disSection.style.display = "block";
    if (saveBtn) {
      saveBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
        Save Dispatch Challan & Next
      `;
    }
  }

  updateModalPreviewBalances();
}

// STRICT Auto-Fetch matching on BOTH Style Code AND Category
function handleLiveStyleFetch() {
  const code = (document.getElementById("entry-style-code")?.value || "").trim();
  const cat = (document.getElementById("entry-category")?.value || "Shirt").trim();
  const badge = document.getElementById("style-fetch-status");

  if (!code) {
    if (badge) badge.style.display = "none";
    updateModalPreviewBalances();
    return;
  }

  // STRICT LOOKUP: requires BOTH code AND category to match!
  const existing = window.db.findMasterByStyleAndCategory(code, cat);

  if (existing) {
    if (badge) {
      badge.style.display = "inline-block";
      badge.className = "badge-tag inline";
      badge.textContent = `✓ Found: ${existing.style_code} [${existing.category}] (Cut: ${existing.cut_qty}, Rec: ${existing.received_qty}, Dis: ${existing.dispatch_from_hemb})`;
    }

    // Auto-fetch master details
    document.getElementById("entry-id").value = existing.id;
    if (existing.sr_no) document.getElementById("entry-sr").value = existing.sr_no;
    
    // Auto-fill contractor (check master first, then distribution sheet!)
    const contInp = document.getElementById("entry-contractor");
    if (existing.contractor_name && existing.contractor_name !== "Unassigned" && existing.contractor_name !== "-") {
      if (contInp) contInp.value = existing.contractor_name;
    } else {
      const distInfo = window.db.getContractorForStyle(code, cat);
      if (distInfo && distInfo.contractor_name && contInp) {
        contInp.value = distInfo.contractor_name;
      }
    }

    if (existing.cut_qty) document.getElementById("entry-cut-qty").value = existing.cut_qty;
    if (existing.ship) document.getElementById("entry-ship").value = existing.ship;
    if (existing.remarks) document.getElementById("entry-remarks").value = existing.remarks;
  } else {
    if (badge) {
      badge.style.display = "inline-block";
      badge.className = "badge-tag alter";
      badge.textContent = `+ New Category for Style: ${code} [${cat}] (Ready to add)`;
    }
    // New category - clear ID so it doesn't overwrite another category
    document.getElementById("entry-id").value = "";

    // Auto-fill contractor from Distribution Sheet for new style!
    const distInfo = window.db.getContractorForStyle(code, cat);
    const contInp = document.getElementById("entry-contractor");
    if (distInfo && distInfo.contractor_name && contInp) {
      contInp.value = distInfo.contractor_name;
    }
  }

  updateModalPreviewBalances();
}

// Update all 6 Live KPIs in the modal reflecting Style Code + Category
function updateModalPreviewBalances() {
  const code = (document.getElementById("entry-style-code")?.value || "").trim();
  const cat = (document.getElementById("entry-category")?.value || "Shirt").trim();
  const existing = window.db.findMasterByStyleAndCategory(code, cat);

  const cut = parseInt(document.getElementById("entry-cut-qty")?.value, 10) || (existing ? existing.cut_qty : 0) || 0;
  const currentMode = document.getElementById("current-form-mode")?.value || "receiving";

  let rec = parseInt(document.getElementById("entry-received-qty")?.value, 10) || 0;
  let dis = parseInt(document.getElementById("entry-dispatch-qty")?.value, 10) || 0;

  if (currentMode === "receiving" && existing) {
    rec = existing.received_qty + rec;
    dis = existing.dispatch_from_hemb;
  } else if (currentMode === "dispatch" && existing) {
    rec = existing.received_qty;
    dis = existing.dispatch_from_hemb + dis;
  } else if (existing) {
    if (!rec) rec = existing.received_qty;
    if (!dis) dis = existing.dispatch_from_hemb;
  }

  const balStock = Math.max(0, cut - rec);
  const balHemb = rec - dis; // True WIP balance
  const balTotal = Math.max(0, cut - dis);

  // 1. Cut
  const elCut = document.getElementById("preview-total-cut");
  if (elCut) elCut.textContent = cut.toLocaleString();

  // 2. Total Received
  const elRec = document.getElementById("preview-total-received");
  if (elRec) elRec.textContent = rec.toLocaleString();

  // 3. Balance From Stock
  const elBalStock = document.getElementById("preview-bal-stock");
  if (elBalStock) {
    if (cut > 0 && rec > cut) {
      elBalStock.style.color = "#f43f5e";
      elBalStock.textContent = `${(cut - rec).toLocaleString()} (EXCESS!)`;
    } else {
      elBalStock.style.color = "var(--accent-amber)";
      elBalStock.textContent = balStock.toLocaleString();
    }
  }

  // 4. Total Dispatched
  const elDis = document.getElementById("preview-total-dispatched");
  if (elDis) elDis.textContent = dis.toLocaleString();

  // 5. Balance in H-Emb
  const elBalHemb = document.getElementById("preview-bal-hemb");
  if (elBalHemb) {
    if (balHemb < 0) {
      elBalHemb.style.color = "#f43f5e";
      elBalHemb.textContent = `${balHemb.toLocaleString()} (OVER-DISPATCH!)`;
      if (elBalHemb.parentElement) elBalHemb.parentElement.style.borderColor = "rgba(244, 63, 94, 0.6)";
    } else {
      elBalHemb.style.color = "var(--accent-pink)";
      elBalHemb.textContent = balHemb.toLocaleString();
      if (elBalHemb.parentElement) elBalHemb.parentElement.style.borderColor = "";
    }
  }

  // 6. Total Pending Balance
  const elBalTotal = document.getElementById("preview-bal-total");
  if (elBalTotal) elBalTotal.textContent = balTotal.toLocaleString();
}

// -------------------------------------------------------------
// Promise-based Warning & Confirmation Dialog (Over-Dispatch / Excess)
// -------------------------------------------------------------
function showWarningConfirmModal({
  title = "Over-Dispatch Warning",
  subtitle = "Quantity exceeds available stock",
  message = "The entered quantity exceeds available balance.",
  details = [],
  urduNote = "Stock say jitna maal aya hay, dispatch ussay zyada ho raha hay. Kya aap waqai is entry ko save karna chahtay hain?",
  confirmText = "✓ Yes, Allow Excess Entry",
  cancelText = "✕ Cancel & Adjust Qty"
}) {
  return new Promise((resolve) => {
    const modal = document.getElementById("modal-confirm-dialog");
    if (!modal) {
      resolve(confirm(`${message}\n\nDo you want to proceed anyway?`));
      return;
    }

    document.getElementById("confirm-dialog-title").textContent = title;
    document.getElementById("confirm-dialog-subtitle").textContent = subtitle;
    document.getElementById("confirm-dialog-message").innerHTML = message;
    document.getElementById("confirm-dialog-urdu-note").textContent = urduNote;

    const detailsBox = document.getElementById("confirm-dialog-details");
    if (detailsBox) {
      detailsBox.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem 1rem;">
          ${details.map(d => `
            <div>
              <span style="color: var(--text-muted); font-size: 0.75rem;">${d.label}:</span>
              <div style="font-weight: 700; font-family: var(--font-mono); color: ${d.color || 'var(--text-main)'}; font-size: 0.95rem;">
                ${d.value}
              </div>
            </div>
          `).join("")}
        </div>
      `;
    }

    const btnProceed = document.getElementById("confirm-dialog-btn-proceed");
    const btnCancel = document.getElementById("confirm-dialog-btn-cancel");
    const btnX = document.getElementById("confirm-dialog-btn-x");

    btnProceed.textContent = confirmText;
    btnCancel.textContent = cancelText;

    const cleanup = () => {
      btnProceed.removeEventListener("click", onProceed);
      btnCancel.removeEventListener("click", onCancel);
      btnX.removeEventListener("click", onCancel);
      closeModal("modal-confirm-dialog");
    };

    const onProceed = () => {
      cleanup();
      resolve(true);
    };

    const onCancel = () => {
      cleanup();
      resolve(false);
    };

    btnProceed.addEventListener("click", onProceed);
    btnCancel.addEventListener("click", onCancel);
    btnX.addEventListener("click", onCancel);

    openModal("modal-confirm-dialog");
  });
}

function openMasterEntryModal(itemToEdit = null, preferredMode = "receiving") {
  if (itemToEdit && !window.db.canUserPerformAction("can_edit")) {
    showToast("Permission Denied: You do not have permission to edit records.", "error");
    return;
  }
  if (!itemToEdit && !window.db.canUserPerformAction("can_create")) {
    showToast("Permission Denied: You do not have permission to create records.", "error");
    return;
  }

  const form = document.getElementById("form-master-entry");
  form.reset();

  const title = document.getElementById("modal-entry-title");
  const idInput = document.getElementById("entry-id");
  const badge = document.getElementById("style-fetch-status");
  if (badge) badge.style.display = "none";

  populateDropdowns();

  if (itemToEdit) {
    title.textContent = `Edit Style Entry (${itemToEdit.style_code} [${itemToEdit.category}])`;
    idInput.value = itemToEdit.id;
    document.getElementById("entry-sr").value = itemToEdit.sr_no || "";
    document.getElementById("entry-style-code").value = itemToEdit.style_code || "";
    document.getElementById("entry-ship").value = itemToEdit.ship || "";
    document.getElementById("entry-category").value = itemToEdit.category || "Shirt";
    document.getElementById("entry-contractor").value = itemToEdit.contractor_name || "";
    document.getElementById("entry-cut-qty").value = itemToEdit.cut_qty || 0;
    document.getElementById("entry-received-qty").value = itemToEdit.received_qty || 0;
    document.getElementById("entry-date-receive").value = itemToEdit.date_receive || "";
    document.getElementById("entry-challan-rec").value = itemToEdit.challan_rec || "";
    document.getElementById("entry-dispatch-qty").value = itemToEdit.dispatch_from_hemb || 0;
    document.getElementById("entry-date-dispatch").value = itemToEdit.date_dispatch || "";
    document.getElementById("entry-challan-dis").value = itemToEdit.challan_dis || "";
    document.getElementById("entry-remarks").value = itemToEdit.remarks || "";
    setFormMode(preferredMode === "dispatch" ? "dispatch" : "receiving");
  } else {
    title.textContent = "Style Production & Balance Entry";
    idInput.value = "";
    const list = window.db.getMasterInventory();
    const maxSr = list.length > 0 ? Math.max(...list.map(i => parseInt(i.sr_no, 10) || 0)) : 0;
    document.getElementById("entry-sr").value = maxSr + 1;
    document.getElementById("entry-date-receive").value = getCurrentDateShort();
    document.getElementById("entry-date-dispatch").value = getCurrentDateShort();
    setFormMode(preferredMode === "dispatch" ? "dispatch" : "receiving");
  }

  const alertBox = document.getElementById("modal-form-alert");
  if (alertBox) alertBox.style.display = "none";

  updateModalPreviewBalances();
  openModal("modal-master-entry");
}

function showFormError(msg) {
  const alertBox = document.getElementById("modal-form-alert");
  if (alertBox) {
    alertBox.style.display = "block";
    alertBox.style.background = "rgba(244, 63, 94, 0.15)";
    alertBox.style.border = "1px solid #f43f5e";
    alertBox.style.color = "#fda4af";
    alertBox.innerHTML = msg;
  }
}

function showFormSuccess(msg) {
  const alertBox = document.getElementById("modal-form-alert");
  if (alertBox) {
    alertBox.style.display = "block";
    alertBox.style.background = "rgba(16, 185, 129, 0.15)";
    alertBox.style.border = "1px solid #10b981";
    alertBox.style.color = "#34d399";
    alertBox.innerHTML = `${msg}<br><span style='font-size:0.75rem; opacity:0.85;'>Form cleared. Date preserved. Ready for next entry!</span>`;
  }
}

async function saveMasterEntryFromForm() {
  window.lastUserActionTime = Date.now();
  const currentMode = document.getElementById("current-form-mode")?.value || "receiving";
  const idVal = document.getElementById("entry-id")?.value;

  const styleCode = (document.getElementById("entry-style-code")?.value || "").trim();
  const category = (document.getElementById("entry-category")?.value || "Shirt").trim();
  const contractor = (document.getElementById("entry-contractor")?.value || "").trim();
  const ship = (document.getElementById("entry-ship")?.value || "").trim();
  const cutQty = parseInt(document.getElementById("entry-cut-qty")?.value, 10) || 0;
  const remarks = (document.getElementById("entry-remarks")?.value || "").trim();

  // 1. Validations
  if (!styleCode) {
    showFormError("✕ Error: Please enter a <strong>Style Code</strong>!");
    document.getElementById("entry-style-code")?.focus();
    return;
  }

  if (!contractor) {
    showFormError("✕ Error: Please specify a <strong>Contractor Name</strong>!");
    document.getElementById("entry-contractor")?.focus();
    return;
  }

  if (!window.db.isValidContractorName(contractor)) {
    const regList = window.db.getRegisteredContractorNames().join(", ");
    showFormError(`⚠️ Error: Contractor "<strong>${escapeHtml(contractor)}</strong>" is not registered! Only contractors saved in your table are accepted:<br><small style="color: #6ee7b7; font-weight: 700;">(${regList})</small>`);
    document.getElementById("entry-contractor")?.focus();
    return;
  }

  const saveBtn = document.getElementById("btn-save-master-entry");
  if (saveBtn) {
    saveBtn.style.transform = "scale(0.96)";
    setTimeout(() => { if (saveBtn) saveBtn.style.transform = ""; }, 120);
  }

  try {
    if (currentMode === "receiving") {
      const recQty = parseInt(document.getElementById("entry-received-qty")?.value, 10) || 0;
      const dateRec = (document.getElementById("entry-date-receive")?.value || "").trim() || getCurrentDateShort();
      const challanRec = (document.getElementById("entry-challan-rec")?.value || "").trim();

      if (recQty <= 0) {
        showFormError("✕ Error: Please enter Received Quantity (greater than 0) for this receiving challan!");
        document.getElementById("entry-received-qty")?.focus();
        return;
      }

      // Check excess receiving over cut order
      const existing = window.db.findMasterByStyleAndCategory(styleCode, category);
      const effectiveCut = cutQty || (existing ? existing.cut_qty : 0);
      const alreadyRec = existing ? existing.received_qty : 0;
      if (effectiveCut > 0 && (alreadyRec + recQty) > effectiveCut) {
        const remainingCut = Math.max(0, effectiveCut - alreadyRec);
        const excess = (alreadyRec + recQty) - effectiveCut;
        const confirmed = await showWarningConfirmModal({
          title: "⚠️ Excess Receiving Warning",
          subtitle: `Style: ${styleCode} [${category}]`,
          message: `Stock say aany wala maal Cut Order say zyada hay!<br>You are receiving <strong>${recQty.toLocaleString()} pcs</strong>, which exceeds the remaining Cut Order balance (<strong>${remainingCut.toLocaleString()} pcs</strong>) by <strong style="color: #f43f5e;">+${excess.toLocaleString()} pcs</strong>!`,
          details: [
            { label: "Style & Category", value: `${styleCode} [${category}]` },
            { label: "Total Cut Order", value: `${effectiveCut.toLocaleString()} pcs` },
            { label: "Already Received", value: `${alreadyRec.toLocaleString()} pcs` },
            { label: "Remaining from Cut", value: `${remainingCut.toLocaleString()} pcs`, color: "#38bdf8" },
            { label: "Entered Receiving", value: `${recQty.toLocaleString()} pcs`, color: "#f59e0b" },
            { label: "Excess over Cut", value: `+${excess.toLocaleString()} pcs`, color: "#f43f5e" }
          ],
          urduNote: `Cutting/Stock say total cut order ${effectiveCut.toLocaleString()} pcs tha aur ${alreadyRec.toLocaleString()} pcs pehle aa chukay hain. Aap ${recQty.toLocaleString()} pcs enter kar rahay hain jo cut order say zyada hay. Kya aap waqai save karna chahtay hain?`,
          confirmText: "✓ Yes, Allow Excess Receiving",
          cancelText: "✕ Cancel & Adjust Qty"
        });

        if (!confirmed) {
          showFormError(`⚠️ Receiving entry cancelled. Remaining cut order is <strong>${remainingCut.toLocaleString()} pcs</strong>.`);
          document.getElementById("entry-received-qty")?.focus();
          return;
        }
      }

      const res = await window.db.addReceivingLog({
        style_code: styleCode,
        category: category,
        contractor_name: contractor,
        cut_qty: cutQty,
        received_qty: recQty,
        date_receive: dateRec,
        challan_rec: challanRec,
        ship: ship,
        remarks: remarks
      });

      const syncText = res.neonSynced ? " <span class='badge-tag inline'>⚡ Instant Saved (Cloud Syncing)</span>" : "";
      showFormSuccess(`✓ Receiving Challan #${challanRec || 'Logged'} (${recQty.toLocaleString()} pcs) saved for <strong>${escapeHtml(styleCode)} [${category}]</strong>! Total received to date: ${res.masterRecord.received_qty.toLocaleString()} pcs.${syncText}`);

    } else if (currentMode === "dispatch") {
      const disQty = parseInt(document.getElementById("entry-dispatch-qty")?.value, 10) || 0;
      const dateDis = (document.getElementById("entry-date-dispatch")?.value || "").trim() || getCurrentDateShort();
      const challanDis = (document.getElementById("entry-challan-dis")?.value || "").trim();

      if (disQty <= 0) {
        showFormError("✕ Error: Please enter Dispatch Quantity (greater than 0) for this dispatch challan!");
        document.getElementById("entry-dispatch-qty")?.focus();
        return;
      }

      // Check available WIP balance in Hand Embroidery
      const existing = window.db.findMasterByStyleAndCategory(styleCode, category);
      const totalRec = existing ? existing.received_qty : 0;
      const alreadyDis = existing ? existing.dispatch_from_hemb : 0;
      const availableHemb = totalRec - alreadyDis;

      if (disQty > availableHemb) {
        const excess = disQty - availableHemb;
        const confirmed = await showWarningConfirmModal({
          title: "⚠️ Over-Dispatch Warning",
          subtitle: `Style: ${styleCode} [${category}]`,
          message: `Stock say Hand-Embroidery may total <strong>${totalRec.toLocaleString()} pcs</strong> ai thay aur pehle say <strong>${alreadyDis.toLocaleString()} pcs</strong> dispatch ho chukay hain.<br><br>Available Balance sirf <strong style="color: #38bdf8;">${Math.max(0, availableHemb).toLocaleString()} pcs</strong> hay, lekin aap <strong>${disQty.toLocaleString()} pcs</strong> dispatch kar rahay hain (<strong style="color: #f43f5e;">+${excess.toLocaleString()} pcs zyada</strong>)!`,
          details: [
            { label: "Style & Category", value: `${styleCode} [${category}]` },
            { label: "Total Received (Stock)", value: `${totalRec.toLocaleString()} pcs` },
            { label: "Already Dispatched", value: `${alreadyDis.toLocaleString()} pcs` },
            { label: "Available in H-Emb", value: `${Math.max(0, availableHemb).toLocaleString()} pcs`, color: "#38bdf8" },
            { label: "Attempted Dispatch", value: `${disQty.toLocaleString()} pcs`, color: "#f59e0b" },
            { label: "Excess / Deficit", value: `+${excess.toLocaleString()} pcs`, color: "#f43f5e" }
          ],
          urduNote: `Stock say jitna maal aya hay (${totalRec.toLocaleString()} pcs), dispatch ussay zyada ho raha hay (${(alreadyDis + disQty).toLocaleString()} pcs). Kya aap waqai is over-dispatch entry ko confirm kar ke save karna chahtay hain?`,
          confirmText: "✓ Yes, Allow Excess Dispatch",
          cancelText: "✕ Cancel & Adjust Qty"
        });

        if (!confirmed) {
          showFormError(`⚠️ Dispatch entry cancelled. Maximum available balance in Hand-Embroidery is <strong>${Math.max(0, availableHemb).toLocaleString()} pcs</strong>.`);
          document.getElementById("entry-dispatch-qty")?.focus();
          return;
        }
      }

      const res = await window.db.addDispatchLog({
        style_code: styleCode,
        category: category,
        contractor_name: contractor,
        dispatch_qty: disQty,
        date_dispatch: dateDis,
        challan_dis: challanDis,
        ship: ship,
        remarks: remarks
      });

      const syncText = res.neonSynced ? " <span class='badge-tag inline'>⚡ Instant Saved (Cloud Syncing)</span>" : "";
      showFormSuccess(`✓ Dispatch Challan #${challanDis || 'Logged'} (${disQty.toLocaleString()} pcs) saved for <strong>${escapeHtml(styleCode)} [${category}]</strong>! Remaining H-Emb WIP: ${res.masterRecord.balance_from_hemb.toLocaleString()} pcs.${syncText}`);

    } else {
      // Both / Master Full Edit
      const recQty = parseInt(document.getElementById("entry-received-qty")?.value, 10) || 0;
      const disQty = parseInt(document.getElementById("entry-dispatch-qty")?.value, 10) || 0;
      const dateRec = (document.getElementById("entry-date-receive")?.value || "").trim();
      const challanRec = (document.getElementById("entry-challan-rec")?.value || "").trim();
      const dateDis = (document.getElementById("entry-date-dispatch")?.value || "").trim();
      const challanDis = (document.getElementById("entry-challan-dis")?.value || "").trim();

      if (disQty > recQty) {
        const excess = disQty - recQty;
        const confirmed = await showWarningConfirmModal({
          title: "⚠️ Over-Dispatch Warning",
          subtitle: `Style: ${styleCode} [${category}]`,
          message: `Dispatch quantity (<strong>${disQty.toLocaleString()} pcs</strong>) exceeds Received quantity (<strong>${recQty.toLocaleString()} pcs</strong>) by <strong style="color: #f43f5e;">+${excess.toLocaleString()} pcs</strong>!`,
          details: [
            { label: "Style & Category", value: `${styleCode} [${category}]` },
            { label: "Received in H-Emb", value: `${recQty.toLocaleString()} pcs`, color: "#38bdf8" },
            { label: "Dispatch from H-Emb", value: `${disQty.toLocaleString()} pcs`, color: "#f59e0b" },
            { label: "Excess / Deficit", value: `+${excess.toLocaleString()} pcs`, color: "#f43f5e" }
          ],
          urduNote: `Received maal say zyada dispatch enter ho raha hay. Kya aap waqai save karna chahtay hain?`,
          confirmText: "✓ Yes, Allow Excess Dispatch",
          cancelText: "✕ Cancel & Adjust Qty"
        });

        if (!confirmed) {
          showFormError(`⚠️ Master entry cancelled. Dispatch quantity exceeds received quantity.`);
          document.getElementById("entry-dispatch-qty")?.focus();
          return;
        }
      }

      await window.db.saveMasterEntryWithNeon({
        id: idVal ? parseInt(idVal, 10) : undefined,
        style_code: styleCode,
        category: category,
        contractor_name: contractor,
        cut_qty: cutQty,
        received_qty: recQty,
        date_receive: dateRec,
        challan_rec: challanRec,
        dispatch_from_hemb: disQty,
        date_dispatch: dateDis,
        challan_dis: challanDis,
        ship: ship,
        remarks: remarks
      });

      showFormSuccess(`✓ Master Record for <strong>${escapeHtml(styleCode)} [${category}]</strong> saved successfully!`);
    }

  } catch (err) {
    showFormError(`✕ Error saving entry: ${err.message}`);
    return;
  }

  // Refresh all background tables and navigation badges immediately
  renderAll();

  // PRESERVE DATES, CONTRACTOR & CHALLAN FOR ULTRA-FAST BATCH ENTRY
  const preserveDateRec = document.getElementById("entry-date-receive")?.value || getCurrentDateShort();
  const preserveDateDis = document.getElementById("entry-date-dispatch")?.value || getCurrentDateShort();
  const preserveContractor = document.getElementById("entry-contractor")?.value || "";
  const preserveChallanRec = document.getElementById("entry-challan-rec")?.value || "";
  const preserveChallanDis = document.getElementById("entry-challan-dis")?.value || "";

  // CLEAR FIELDS FOR RAPID SUCCESSIVE ENTRY (Modal stays open!)
  document.getElementById("entry-id").value = "";
  document.getElementById("entry-style-code").value = "";
  document.getElementById("entry-ship").value = "";
  document.getElementById("entry-cut-qty").value = "";
  document.getElementById("entry-received-qty").value = 0;
  document.getElementById("entry-dispatch-qty").value = 0;
  document.getElementById("entry-remarks").value = "";

  // RESTORE WORKFLOW CONTEXT (Dates, Contractor, Challan preserved so user only types Style Code & Qty)
  if (document.getElementById("entry-date-receive")) document.getElementById("entry-date-receive").value = preserveDateRec;
  if (document.getElementById("entry-date-dispatch")) document.getElementById("entry-date-dispatch").value = preserveDateDis;
  if (document.getElementById("entry-contractor") && preserveContractor) document.getElementById("entry-contractor").value = preserveContractor;
  if (document.getElementById("entry-challan-rec") && preserveChallanRec) document.getElementById("entry-challan-rec").value = preserveChallanRec;
  if (document.getElementById("entry-challan-dis") && preserveChallanDis) document.getElementById("entry-challan-dis").value = preserveChallanDis;

  // Next SR Number
  const list = window.db.getMasterInventory();
  const recList = window.db.getReceivingLogs();
  const disList = window.db.getDispatchLogs();
  const maxSr = Math.max(
    ...list.map(i => parseInt(i.sr_no, 10) || 0),
    ...recList.map(i => parseInt(i.sr_no, 10) || 0),
    ...disList.map(i => parseInt(i.sr_no, 10) || 0),
    0
  );
  if (document.getElementById("entry-sr")) document.getElementById("entry-sr").value = maxSr + 1;

  // Reset live badge & KPIs
  const badge = document.getElementById("style-fetch-status");
  if (badge) badge.style.display = "none";
  updateModalPreviewBalances();

  // INSTANT FOCUS & SELECT on Style Code for immediate next entry!
  const styleInp = document.getElementById("entry-style-code");
  if (styleInp) {
    styleInp.focus();
    styleInp.select();
  }
  setTimeout(() => {
    if (styleInp) {
      styleInp.focus();
      styleInp.select();
    }
  }, 10);
}

function editMasterEntry(id) {
  if (!window.db.canUserPerformAction("can_edit")) {
    showToast("Permission Denied: You do not have permission to edit records.", "error");
    return;
  }
  const item = window.db.getMasterInventory().find(i => i.id === id);
  if (item) {
    openMasterEntryModal(item, "receiving");
  }
}

async function deleteMasterEntry(id) {
  if (!window.db.canUserPerformAction("can_delete")) {
    showToast("Permission Denied: You do not have permission to delete records.", "error");
    return;
  }
  const numId = Number(id);
  const item = window.db.getMasterInventory().find(i => Number(i.id) === numId || String(i.id) === String(id));
  if (!item) return;

  if (confirm(`Are you sure you want to delete Style ${item.style_code} [${item.category}]?`)) {
    window.lastUserActionTime = Date.now();
    await window.db.deleteMasterInventory(id);
    renderAll();
    showToast(`Style ${item.style_code} [${item.category}] deleted.`);
  }
}

// -------------------------------------------------------------
// EDIT CHALLAN LOG MODAL (Receiving & Dispatch Logs)
// -------------------------------------------------------------
let currentEditingLog = null;

function editReceivingLogEntry(id) {
  if (!window.db.canUserPerformAction("can_edit")) {
    showToast("Permission Denied: You do not have permission to edit receiving challans.", "error");
    return;
  }
  const item = window.db.getReceivingLogs().find(r => r.id === id);
  if (!item) {
    showToast("Receiving challan not found!", "error");
    return;
  }

  currentEditingLog = { type: "receiving", ...item };
  openEditLogModal(currentEditingLog);
}

function editDispatchLogEntry(id) {
  if (!window.db.canUserPerformAction("can_edit")) {
    showToast("Permission Denied: You do not have permission to edit dispatch challans.", "error");
    return;
  }
  const item = window.db.getDispatchLogs().find(d => d.id === id);
  if (!item) {
    showToast("Dispatch challan not found!", "error");
    return;
  }

  currentEditingLog = { type: "dispatch", ...item };
  openEditLogModal(currentEditingLog);
}

function openEditLogModal(entry) {
  populateDropdowns();

  document.getElementById("edit-log-id").value = entry.id;
  document.getElementById("edit-log-type").value = entry.type;

  const titleEl = document.getElementById("edit-log-title");
  const subEl = document.getElementById("edit-log-subtitle");
  const cutGroup = document.getElementById("edit-group-cut-qty");
  const labelQty = document.getElementById("edit-label-qty");
  const alertBox = document.getElementById("modal-edit-alert");
  if (alertBox) alertBox.style.display = "none";

  if (entry.type === "receiving") {
    titleEl.textContent = `✏️ Edit Inward Receiving Challan #${entry.challan_rec || entry.id}`;
    subEl.textContent = "Update incoming goods from cutting/stock & recalculate balances";
    if (cutGroup) cutGroup.style.display = "block";
    if (labelQty) labelQty.textContent = "Received Quantity *:";
    document.getElementById("edit-log-challan").value = entry.challan_rec || "";
    document.getElementById("edit-log-date").value = entry.date_receive || "";
    document.getElementById("edit-log-cut-qty").value = entry.cut_qty || 0;
    document.getElementById("edit-log-qty").value = entry.received_qty || 0;
  } else {
    titleEl.textContent = `✏️ Edit Outward Dispatch Challan #${entry.challan_dis || entry.id}`;
    subEl.textContent = "Update finished embroidery dispatch to unit & recalculate balances";
    if (cutGroup) cutGroup.style.display = "none";
    if (labelQty) labelQty.textContent = "Dispatch Quantity *:";
    document.getElementById("edit-log-challan").value = entry.challan_dis || "";
    document.getElementById("edit-log-date").value = entry.date_dispatch || "";
    document.getElementById("edit-log-cut-qty").value = 0;
    document.getElementById("edit-log-qty").value = entry.dispatch_qty || 0;
  }

  document.getElementById("edit-log-style-code").value = entry.style_code || "";
  document.getElementById("edit-log-category").value = entry.category || "Shirt";
  document.getElementById("edit-log-contractor").value = entry.contractor_name || "";
  document.getElementById("edit-log-remarks").value = entry.remarks || "";

  updateEditLogModalPreview();
  openModal("modal-edit-log-entry");
}

function updateEditLogModalPreview() {
  const code = (document.getElementById("edit-log-style-code")?.value || "").trim();
  const cat = (document.getElementById("edit-log-category")?.value || "Shirt").trim();
  const type = document.getElementById("edit-log-type")?.value || "receiving";
  const qty = parseInt(document.getElementById("edit-log-qty")?.value, 10) || 0;

  const existing = window.db.findMasterByStyleAndCategory(code, cat);
  let rec = existing ? existing.received_qty : 0;
  let dis = existing ? existing.dispatch_from_hemb : 0;

  // Account for the entry currently being edited
  if (currentEditingLog && currentEditingLog.style_code === code && currentEditingLog.category === cat) {
    if (type === "receiving") {
      rec = (rec - (currentEditingLog.received_qty || 0)) + qty;
    } else {
      dis = (dis - (currentEditingLog.dispatch_qty || 0)) + qty;
    }
  }

  const balHemb = rec - dis;

  const elRec = document.getElementById("edit-preview-total-rec");
  if (elRec) elRec.textContent = rec.toLocaleString();

  const elDis = document.getElementById("edit-preview-total-dis");
  if (elDis) elDis.textContent = dis.toLocaleString();

  const elBal = document.getElementById("edit-preview-bal-hemb");
  if (elBal) {
    if (balHemb < 0) {
      elBal.style.color = "#f43f5e";
      elBal.textContent = `${balHemb.toLocaleString()} (OVER!)`;
    } else {
      elBal.style.color = "var(--accent-pink)";
      elBal.textContent = balHemb.toLocaleString();
    }
  }
}

async function saveEditLogFromForm() {
  const id = parseInt(document.getElementById("edit-log-id")?.value, 10);
  const type = document.getElementById("edit-log-type")?.value;
  const challan = (document.getElementById("edit-log-challan")?.value || "").trim();
  const dateStr = (document.getElementById("edit-log-date")?.value || "").trim();
  const styleCode = (document.getElementById("edit-log-style-code")?.value || "").trim();
  const category = (document.getElementById("edit-log-category")?.value || "Shirt").trim();
  const contractor = (document.getElementById("edit-log-contractor")?.value || "").trim();
  const cutQty = parseInt(document.getElementById("edit-log-cut-qty")?.value, 10) || 0;
  const qty = parseInt(document.getElementById("edit-log-qty")?.value, 10) || 0;
  const remarks = (document.getElementById("edit-log-remarks")?.value || "").trim();

  const alertBox = document.getElementById("modal-edit-alert");
  const showAlert = (msg) => {
    if (alertBox) {
      alertBox.style.display = "block";
      alertBox.style.background = "rgba(244, 63, 94, 0.15)";
      alertBox.style.border = "1px solid #f43f5e";
      alertBox.style.color = "#fda4af";
      alertBox.innerHTML = msg;
    }
  };

  if (!styleCode) return showAlert("✕ Error: Style Code is required!");
  if (!contractor) return showAlert("✕ Error: Contractor Name is required!");
  if (!window.db.isValidContractorName(contractor)) {
    const regList = window.db.getRegisteredContractorNames().join(", ");
    return showAlert(`✕ Error: Contractor "<strong>${escapeHtml(contractor)}</strong>" is not registered! Only saved contractors are accepted: (${regList})`);
  }
  if (!challan) return showAlert("✕ Error: Challan Number is required!");
  if (!dateStr) return showAlert("✕ Error: Date is required!");
  if (qty <= 0) return showAlert("✕ Error: Quantity must be greater than 0!");

  const saveBtn = document.getElementById("btn-save-edit-log");
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "Updating & Recalculating...";
  }

  try {
    if (type === "receiving") {
      // Check excess receiving over cut order if cut is specified
      const existing = window.db.findMasterByStyleAndCategory(styleCode, category);
      const effectiveCut = cutQty || (existing ? existing.cut_qty : 0);
      let alreadyRec = existing ? existing.received_qty : 0;
      if (currentEditingLog && currentEditingLog.style_code === styleCode && currentEditingLog.category === category) {
        alreadyRec -= (currentEditingLog.received_qty || 0);
      }

      if (effectiveCut > 0 && (alreadyRec + qty) > effectiveCut) {
        const remainingCut = Math.max(0, effectiveCut - alreadyRec);
        const excess = (alreadyRec + qty) - effectiveCut;
        const confirmed = await showWarningConfirmModal({
          title: "⚠️ Excess Receiving Warning",
          subtitle: `Style: ${styleCode} [${category}]`,
          message: `Updated received quantity (<strong>${qty.toLocaleString()} pcs</strong>) exceeds remaining Cut Order (<strong>${remainingCut.toLocaleString()} pcs</strong>) by <strong style="color: #f43f5e;">+${excess.toLocaleString()} pcs</strong>!`,
          details: [
            { label: "Style & Category", value: `${styleCode} [${category}]` },
            { label: "Total Cut Order", value: `${effectiveCut.toLocaleString()} pcs` },
            { label: "Other Received", value: `${alreadyRec.toLocaleString()} pcs` },
            { label: "Remaining Cut", value: `${remainingCut.toLocaleString()} pcs`, color: "#38bdf8" },
            { label: "New Receiving", value: `${qty.toLocaleString()} pcs`, color: "#f59e0b" },
            { label: "Excess over Cut", value: `+${excess.toLocaleString()} pcs`, color: "#f43f5e" }
          ],
          urduNote: `Cutting say aya hua maal cut order say zyada ho raha hay. Kya aap waqai is change ko save karna chahtay hain?`,
          confirmText: "✓ Yes, Update Excess Receiving",
          cancelText: "✕ Cancel & Adjust Qty"
        });

        if (!confirmed) {
          if (saveBtn) saveBtn.disabled = false;
          saveBtn.textContent = "✓ Update Challan & Recalculate";
          return;
        }
      }

      await window.db.updateReceivingLog(id, {
        challan_rec: challan,
        date_receive: dateStr,
        style_code: styleCode,
        category: category,
        contractor_name: contractor,
        cut_qty: cutQty,
        received_qty: qty,
        remarks: remarks
      });

      showToast(`✓ Inward Challan #${challan} updated successfully!`);

    } else {
      // Dispatch Over-Check
      const existing = window.db.findMasterByStyleAndCategory(styleCode, category);
      const totalRec = existing ? existing.received_qty : 0;
      let otherDis = existing ? existing.dispatch_from_hemb : 0;
      if (currentEditingLog && currentEditingLog.style_code === styleCode && currentEditingLog.category === category) {
        otherDis -= (currentEditingLog.dispatch_qty || 0);
      }
      const availableHemb = totalRec - otherDis;

      if (qty > availableHemb) {
        const excess = qty - availableHemb;
        const confirmed = await showWarningConfirmModal({
          title: "⚠️ Over-Dispatch Warning",
          subtitle: `Style: ${styleCode} [${category}]`,
          message: `Stock say Hand-Embroidery may total <strong>${totalRec.toLocaleString()} pcs</strong> ai thay aur baaqi dispatches <strong>${otherDis.toLocaleString()} pcs</strong> hain.<br><br>Available Balance sirf <strong style="color: #38bdf8;">${Math.max(0, availableHemb).toLocaleString()} pcs</strong> hay, lekin aap <strong>${qty.toLocaleString()} pcs</strong> update kar rahay hain (<strong style="color: #f43f5e;">+${excess.toLocaleString()} pcs zyada</strong>)!`,
          details: [
            { label: "Style & Category", value: `${styleCode} [${category}]` },
            { label: "Total Received (Stock)", value: `${totalRec.toLocaleString()} pcs` },
            { label: "Other Dispatched", value: `${otherDis.toLocaleString()} pcs` },
            { label: "Available in H-Emb", value: `${Math.max(0, availableHemb).toLocaleString()} pcs`, color: "#38bdf8" },
            { label: "Updated Dispatch", value: `${qty.toLocaleString()} pcs`, color: "#f59e0b" },
            { label: "Excess / Deficit", value: `+${excess.toLocaleString()} pcs`, color: "#f43f5e" }
          ],
          urduNote: `Stock say jitna maal aya hay, dispatch ussay zyada ho raha hay. Kya aap waqai is over-dispatch ko update karna chahtay hain?`,
          confirmText: "✓ Yes, Allow Excess Dispatch",
          cancelText: "✕ Cancel & Adjust Qty"
        });

        if (!confirmed) {
          if (saveBtn) saveBtn.disabled = false;
          saveBtn.textContent = "✓ Update Challan & Recalculate";
          return;
        }
      }

      await window.db.updateDispatchLog(id, {
        challan_dis: challan,
        date_dispatch: dateStr,
        style_code: styleCode,
        category: category,
        contractor_name: contractor,
        dispatch_qty: qty,
        remarks: remarks
      });

      showToast(`✓ Outward Challan #${challan} updated successfully!`);
    }

    closeModal("modal-edit-log-entry");
    renderAll();

  } catch (err) {
    showAlert(`✕ Error: ${err.message}`);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "✓ Update Challan & Recalculate";
    }
  }
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add("open");
    document.body.classList.add("modal-open");
    document.body.style.overflow = "hidden";
    if (!modal.dataset.backdropBound) {
      modal.dataset.backdropBound = "true";
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          closeModal(id);
        }
      });
    }
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("open");
  const openModals = document.querySelectorAll(".modal-backdrop.open");
  if (!openModals || openModals.length === 0) {
    document.body.classList.remove("modal-open");
    document.body.style.overflow = "";
  }
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const openModals = document.querySelectorAll(".modal-backdrop.open");
    openModals.forEach(m => m.classList.remove("open"));
    document.body.classList.remove("modal-open");
    document.body.style.overflow = "";
  }
});

window.openModal = openModal;
window.closeModal = closeModal;

function openSchemaModal() {
  const codeBlock = document.getElementById("schema-code-block");
  if (codeBlock) {
    codeBlock.textContent = `
-- Neon PostgreSQL Schema for Hand Embroidery System
-- 1. Contractors Master Table
CREATE TABLE IF NOT EXISTS contractors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(50),
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Master Inventory (Aggregated summary per Style Code + Category)
CREATE TABLE IF NOT EXISTS master_inventory (
  id SERIAL PRIMARY KEY,
  sr_no INT,
  style_code VARCHAR(100) NOT NULL,
  ship VARCHAR(50) DEFAULT '',
  category VARCHAR(50) NOT NULL,
  cut_qty INT NOT NULL DEFAULT 0,
  received_qty INT NOT NULL DEFAULT 0,
  date_receive TEXT,
  challan_rec TEXT,
  dispatch_from_hemb INT NOT NULL DEFAULT 0,
  date_dispatch TEXT,
  challan_dis TEXT,
  contractor_name VARCHAR(100),
  status VARCHAR(30) DEFAULT 'In Progress',
  remarks TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_style_category UNIQUE (style_code, category)
);

-- 3. Individual Receiving Log (Every receiving challan saved on a new line)
CREATE TABLE IF NOT EXISTS receiving_log (
  id SERIAL PRIMARY KEY,
  sr_no INT,
  style_code VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  contractor_name VARCHAR(100),
  cut_qty INT DEFAULT 0,
  received_qty INT NOT NULL DEFAULT 0,
  date_receive VARCHAR(100) NOT NULL,
  challan_rec VARCHAR(100),
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Individual Dispatch Log (Every dispatch challan saved on a new line)
CREATE TABLE IF NOT EXISTS dispatch_log (
  id SERIAL PRIMARY KEY,
  sr_no INT,
  style_code VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  contractor_name VARCHAR(100),
  dispatch_qty INT NOT NULL DEFAULT 0,
  date_dispatch VARCHAR(100) NOT NULL,
  challan_dis VARCHAR(100),
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Daily Final Style Report
CREATE TABLE IF NOT EXISTS final_style_report (
  id SERIAL PRIMARY KEY,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  serial_no INT NOT NULL,
  style_code VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  contractor_name VARCHAR(100),
  cut_qty INT DEFAULT 0,
  received_qty INT DEFAULT 0,
  balance_from_stock INT DEFAULT 0,
  balance_from_hemb INT DEFAULT 0,
  time_remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. User Accounts & RBAC Permissions
CREATE TABLE IF NOT EXISTS app_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(150),
  role VARCHAR(50) DEFAULT 'Operator',
  permissions JSONB,
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
    `.trim();
  }
  openModal("modal-schema");
}

function copySchemaToClipboard() {
  const codeBlock = document.getElementById("schema-code-block");
  if (codeBlock) {
    navigator.clipboard.writeText(codeBlock.textContent).then(() => {
      showToast("Schema SQL copied to clipboard!");
    });
  }
}

// -------------------------------------------------------------
// CSV / Excel Export Utilities
// -------------------------------------------------------------
function exportMasterInventoryToCSV() {
  const list = window.db.getMasterInventory();
  if (list.length === 0) {
    showToast("No data to export", "info");
    return;
  }

  const headers = [
    "SR", "STYLE CODE", "SHIP", "CATEGORY", "CUT QTY", 
    "RECEIVED QTY", "BALANCE FROM STOCK", "DATE RECEIVE", "CHALLAN REC", 
    "DISPATCH FROM H-EMB", "BALNCE FROM H-EMB", "TOTAL BALANCE", 
    "DATE DISPATCH", "CHALLAN DIS", "CONT NAME", "REMARKS"
  ];

  const rows = list.map(item => [
    item.sr_no,
    `"${item.style_code}"`,
    `"${item.ship || ''}"`,
    `"${item.category}"`,
    item.cut_qty,
    item.received_qty,
    item.balance_from_stock,
    `"${item.date_receive || ''}"`,
    `"${item.challan_rec || ''}"`,
    item.dispatch_from_hemb,
    item.balance_from_hemb,
    item.total_balance,
    `"${item.date_dispatch || ''}"`,
    `"${item.challan_dis || ''}"`,
    `"${item.contractor_name || ''}"`,
    `"${item.remarks || ''}"`
  ]);

  downloadCSV("Master_Inventory_Summary.csv", [headers, ...rows]);
}

function exportReceivingLogToCSV() {
  const list = window.db.getReceivingLogs();
  if (list.length === 0) {
    showToast("No receiving entries to export", "info");
    return;
  }

  const headers = [
    "SR", "DATE RECEIVE", "CHALLAN REC", "STYLE CODE", "CATEGORY", "CONTRACTOR", "CUT QTY", "RECEIVED QTY", "REMARKS"
  ];

  const rows = list.map(item => [
    item.sr_no || item.id,
    `"${item.date_receive || ''}"`,
    `"${item.challan_rec || ''}"`,
    `"${item.style_code}"`,
    `"${item.category}"`,
    `"${item.contractor_name}"`,
    item.cut_qty || 0,
    item.received_qty,
    `"${item.remarks || ''}"`
  ]);

  downloadCSV("Inward_Receiving_Challans.csv", [headers, ...rows]);
}

function exportDispatchLogToCSV() {
  const list = window.db.getDispatchLogs();
  if (list.length === 0) {
    showToast("No dispatch entries to export", "info");
    return;
  }

  const headers = [
    "SR", "DATE DISPATCH", "CHALLAN DIS", "STYLE CODE", "CATEGORY", "CONTRACTOR", "DISPATCH QTY", "STATUS / REMARKS"
  ];

  const rows = list.map(item => [
    item.sr_no || item.id,
    `"${item.date_dispatch || ''}"`,
    `"${item.challan_dis || ''}"`,
    `"${item.style_code}"`,
    `"${item.category}"`,
    `"${item.contractor_name}"`,
    item.dispatch_qty,
    `"${item.remarks || ''}"`
  ]);

  downloadCSV("Outward_Dispatch_Challans.csv", [headers, ...rows]);
}

function exportFinalStylesToCSV() {
  const list = window.db.getFinalStyles();
  const dateStr = window.db.getReportDate();

  const headers = [
    "S NO", "STYLE CODE", "CATEGORY", "CONT NAME", "CUT QTY", 
    "RECEIVED QTY", "BALANCE FROM STOCK", "BALNCE FROM H-EMB", "TIME / REMARKS"
  ];

  const rows = list.map(item => [
    item.s_no,
    `"${item.style_code}"`,
    `"${item.category}"`,
    `"${item.contractor_name}"`,
    item.cut_qty,
    item.received_qty,
    item.balance_from_stock,
    item.balance_from_hemb,
    `"${item.time_remarks || ''}"`
  ]);

  downloadCSV(`Final_Style_Report_${dateStr}.csv`, [headers, ...rows]);
}

function downloadCSV(filename, rows) {
  const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast(`Downloaded ${filename}!`);
}

// -------------------------------------------------------------
// Helpers
// -------------------------------------------------------------
function getCurrentDateShort() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ====================================================================
// AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC) CONTROLLERS
// ====================================================================

// -------------------------------------------------------------
// 5-MINUTE AUTO LOGOUT INACTIVITY SYSTEM
// -------------------------------------------------------------
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes (300,000 ms)
let inactivityTimer = null;
let lastUserActivity = Date.now();
let activityListenersAttached = false;

function recordUserActivity() {
  const now = Date.now();
  if (now - lastUserActivity < 1000) return; // throttle 1s
  lastUserActivity = now;
  try {
    localStorage.setItem("craftflow_last_activity", String(now));
  } catch (e) {}
  resetInactivityTimer();
}

function resetInactivityTimer() {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }

  // Only track when user is logged in
  if (!window.db || !window.db.getCurrentUser()) return;

  inactivityTimer = setTimeout(() => {
    checkAndTriggerInactivityLogout();
  }, INACTIVITY_TIMEOUT_MS);
}

function checkAndTriggerInactivityLogout() {
  if (!window.db || !window.db.getCurrentUser()) return;

  let storedActivity = lastUserActivity;
  try {
    const s = parseInt(localStorage.getItem("craftflow_last_activity"), 10);
    if (s && !isNaN(s)) storedActivity = Math.max(storedActivity, s);
  } catch (e) {}

  const elapsed = Date.now() - storedActivity;
  if (elapsed >= INACTIVITY_TIMEOUT_MS) {
    performInactivityAutoLogout();
  } else {
    // Re-arm timer for remaining time
    const remaining = Math.max(1000, INACTIVITY_TIMEOUT_MS - elapsed);
    inactivityTimer = setTimeout(checkAndTriggerInactivityLogout, remaining);
  }
}

function performInactivityAutoLogout() {
  if (!window.db || !window.db.getCurrentUser()) return;

  stopInactivityTimer();

  // Close all open modals
  document.querySelectorAll(".modal-backdrop.open").forEach(m => m.classList.remove("open"));

  // Log user out from database / local storage session
  window.db.logoutUser();

  // Show login screen overlay
  const overlay = document.getElementById("auth-screen-overlay");
  if (overlay) overlay.style.display = "flex";

  const passInput = document.getElementById("login-password");
  if (passInput) {
    passInput.value = "";
    passInput.setAttribute("type", "password");
  }

  const togglePassBtn = document.getElementById("btn-toggle-login-pass");
  if (togglePassBtn) {
    const eyeOpen = togglePassBtn.querySelector(".eye-open");
    const eyeClosed = togglePassBtn.querySelector(".eye-closed");
    if (eyeOpen) eyeOpen.style.display = "block";
    if (eyeClosed) eyeClosed.style.display = "none";
  }

  // Display timeout warning on the login screen
  const errorAlert = document.getElementById("auth-error-alert");
  if (errorAlert) {
    errorAlert.style.display = "block";
    errorAlert.style.background = "rgba(245, 158, 11, 0.15)";
    errorAlert.style.border = "1.5px solid #f59e0b";
    errorAlert.style.color = "#fbbf24";
    errorAlert.innerHTML = `⏱️ <strong>Session Expired (Auto-Logout)</strong><br><span style="font-size: 0.8rem; opacity: 0.9;">5 minute tak koi activity na honay ki wajah say software automatically logout ho gaya hai. Dobara login karein.</span>`;
  }

  const userInput = document.getElementById("login-username");
  //const passInput = document.getElementById("login-password");
  if (userInput) {
    userInput.value = "";
    userInput.focus();
  }
  const passEl = document.getElementById("login-password");
  if (passEl) passEl.value = "";

  showToast("⏱️ Inactivity Timeout: 5 minutes idle — logged out automatically.", "warning");
}

function initInactivityTimer() {
  lastUserActivity = Date.now();
  try {
    localStorage.setItem("craftflow_last_activity", String(lastUserActivity));
  } catch (e) {}

  if (!activityListenersAttached) {
    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach(evt => {
      window.addEventListener(evt, recordUserActivity, { passive: true });
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        checkAndTriggerInactivityLogout();
      }
    });

    window.addEventListener("focus", () => {
      checkAndTriggerInactivityLogout();
    });

    activityListenersAttached = true;
  }

  resetInactivityTimer();
}

function stopInactivityTimer() {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
}

function initAuthSystem() {
  const overlay = document.getElementById("auth-screen-overlay");
  const loginForm = document.getElementById("form-login");
  const togglePassBtn = document.getElementById("btn-toggle-login-pass");
  const logoutBtn = document.getElementById("btn-user-logout");
  const passInput = document.getElementById("login-password");
  const errorAlert = document.getElementById("auth-error-alert");

  // Show/Hide Password Toggle
  if (togglePassBtn && passInput) {
    togglePassBtn.addEventListener("click", () => {
      const isPass = passInput.getAttribute("type") === "password";
      passInput.setAttribute("type", isPass ? "text" : "password");
      const eyeOpen = togglePassBtn.querySelector(".eye-open");
      const eyeClosed = togglePassBtn.querySelector(".eye-closed");
      if (eyeOpen && eyeClosed) {
        eyeOpen.style.display = isPass ? "none" : "block";
        eyeClosed.style.display = isPass ? "block" : "none";
      } else {
        togglePassBtn.textContent = isPass ? "Hide" : "Show";
      }
      togglePassBtn.setAttribute("title", isPass ? "Hide password" : "Show password");
      togglePassBtn.setAttribute("aria-label", isPass ? "Hide password" : "Show password");
    });
  }

  // Check current session
  const currentUser = window.db.getCurrentUser();
  if (currentUser) {
    if (overlay) overlay.style.display = "none";
    updateHeaderUserProfile(currentUser);
    applyUserPermissions(currentUser);
    initInactivityTimer(); // Start 5-minute inactivity tracker
  } else {
    if (overlay) overlay.style.display = "flex";
    const uInp = document.getElementById("login-username");
    const pInp = document.getElementById("login-password");
    if (uInp) uInp.value = "";
    if (pInp) pInp.value = "";
    // Prevent browser autofill from popping in saved credentials automatically
    setTimeout(() => {
      if (!window.db.getCurrentUser()) {
        if (uInp) uInp.value = "";
        if (pInp) pInp.value = "";
      }
    }, 60);
  }

  // Handle Login Submission
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const usernameInput = document.getElementById("login-username");
      const username = usernameInput ? usernameInput.value.trim() : "";
      const password = passInput ? passInput.value : "";
      const submitBtn = document.getElementById("btn-submit-login");

      if (errorAlert) {
        errorAlert.style.display = "none";
        errorAlert.textContent = "";
      }

      if (!username || !password) {
        if (errorAlert) {
          errorAlert.style.display = "block";
          errorAlert.textContent = "Please enter both username and password.";
        }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Verifying...";
      }

      let result;
      try {
        result = await window.db.authenticateUser(username, password);
      } catch (authErr) {
        result = { success: false, error: authErr.message || "Authentication error." };
      }

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "🔐 Sign In to Workspace";
      }

      if (result.success) {
        if (overlay) overlay.style.display = "none";
        if (passInput) {
          passInput.value = "";
          passInput.setAttribute("type", "password");
          const eyeOpen = togglePassBtn ? togglePassBtn.querySelector(".eye-open") : null;
          const eyeClosed = togglePassBtn ? togglePassBtn.querySelector(".eye-closed") : null;
          if (eyeOpen && eyeClosed) {
            eyeOpen.style.display = "block";
            eyeClosed.style.display = "none";
          }
        }
        updateHeaderUserProfile(result.user);
        applyUserPermissions(result.user);
        renderAll();
        checkNeonStatus();
        startLiveNeonConnection();
        initInactivityTimer(); // Start 5-minute inactivity tracker on login
        showToast(`Welcome back, ${result.user.full_name || result.user.username}!`, "success");
      } else {
        if (errorAlert) {
          errorAlert.style.display = "block";
          errorAlert.textContent = result.error || "Invalid username or password.";
        }
        if (passInput) {
          passInput.value = "";
          passInput.focus();
        }
      }
    });
  }

  // Handle Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to sign out of CraftFlow?")) {
        stopInactivityTimer();
        window.db.logoutUser();
        if (overlay) overlay.style.display = "flex";
        if (passInput) {
          passInput.value = "";
          passInput.setAttribute("type", "password");
          const eyeOpen = togglePassBtn ? togglePassBtn.querySelector(".eye-open") : null;
          const eyeClosed = togglePassBtn ? togglePassBtn.querySelector(".eye-closed") : null;
          if (eyeOpen && eyeClosed) {
            eyeOpen.style.display = "block";
            eyeClosed.style.display = "none";
          }
          if (togglePassBtn) {
            togglePassBtn.setAttribute("title", "Show password");
            togglePassBtn.setAttribute("aria-label", "Show password");
          }
        }
        if (errorAlert) errorAlert.style.display = "none";
        const userInput = document.getElementById("login-username");
        if (userInput) {
          userInput.value = "";
          userInput.focus();
        }
        if (passInput) passInput.value = "";
        showToast("Signed out successfully.", "info");
      }
    });
  }
}

function updateHeaderUserProfile(user) {
  if (!user) return;
  const avatarEl = document.getElementById("header-user-avatar");
  const nameEl = document.getElementById("header-user-name");
  const roleEl = document.getElementById("header-user-role");
  const mgmtBtn = document.getElementById("btn-open-user-mgmt");

  // Mobile Drawer Profile Elements
  const mobileDrawerAvatar = document.getElementById("mobile-drawer-avatar");
  const mobileDrawerName = document.getElementById("mobile-drawer-username");
  const mobileDrawerRole = document.getElementById("mobile-drawer-role");

  if (avatarEl) {
    const names = (user.full_name || user.username || "U").trim().split(" ");
    let initials = names[0].charAt(0).toUpperCase();
    if (names.length > 1) initials += names[names.length - 1].charAt(0).toUpperCase();
    avatarEl.textContent = initials;
    if (mobileDrawerAvatar) mobileDrawerAvatar.textContent = initials;
  }

  if (nameEl) nameEl.textContent = user.full_name || user.username;
  if (mobileDrawerName) mobileDrawerName.textContent = user.full_name || user.username;

  if (roleEl) {
    const roleCapitalized = (user.role || "User").charAt(0).toUpperCase() + (user.role || "User").slice(1);
    roleEl.textContent = roleCapitalized;
    if (mobileDrawerRole) mobileDrawerRole.textContent = roleCapitalized;
  }

  if (mgmtBtn) {
    // Only Admin can open User Management & Permissions
    mgmtBtn.style.display = (user.role === "admin") ? "inline-flex" : "none";
  }
}

function applyUserPermissions(user) {
  if (!user) return;

  const tabButtons = document.querySelectorAll(".nav-tab-btn");
  const mobileNavItems = document.querySelectorAll(".mobile-nav-item");
  let firstVisibleTab = null;
  let currentActiveAllowed = false;

  tabButtons.forEach(btn => {
    const dataTab = btn.getAttribute("data-tab");
    const permKey = dataTab.replace(/-/g, "_");
    const isAllowed = window.db.canUserAccessTab(permKey, user);

    btn.style.display = isAllowed ? "" : "none";

    if (isAllowed && !firstVisibleTab) {
      firstVisibleTab = dataTab;
    }

    if (btn.classList.contains("active")) {
      currentActiveAllowed = isAllowed;
    }
  });

  mobileNavItems.forEach(item => {
    const dataTab = item.getAttribute("data-tab");
    if (dataTab) {
      const permKey = dataTab.replace(/-/g, "_");
      const isAllowed = window.db.canUserAccessTab(permKey, user);
      item.style.display = isAllowed ? "" : "none";
    }
  });

  // If active tab is forbidden for this user, jump to first allowed tab
  if (!currentActiveAllowed && firstVisibleTab) {
    switchTab(firstVisibleTab);
  }

  // Action Permissions (Create, Edit, Delete)
  const canCreate = window.db.canUserPerformAction("can_create", user);
  const canDelete = window.db.canUserPerformAction("can_delete", user);

  // Toggle Create Buttons
  const createBtnIds = [
    "btn-open-new-entry",
    "btn-quick-receiving",
    "btn-quick-dispatch",
    "btn-open-rec-modal",
    "btn-open-dis-modal",
    "btn-open-new-contractor",
    "btn-add-final-style",
    "btn-auto-populate-active",
    "btn-open-payment-modal",
    "btn-auto-populate-payment"
  ];
  createBtnIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = canCreate ? "" : "none";
  });

  // Toggle Wipe Data Button
  const clearBtn = document.getElementById("btn-clear-all");
  if (clearBtn) clearBtn.style.display = canDelete ? "" : "none";
}

// -------------------------------------------------------------
// USER MANAGEMENT MODAL CONTROLLER (ADMIN ONLY)
// -------------------------------------------------------------
function initUserManagementHandlers() {
  const openMgmtBtn = document.getElementById("btn-open-user-mgmt");
  const createNewUserBtn = document.getElementById("btn-create-new-user");
  const userForm = document.getElementById("form-user-account");
  const roleSelect = document.getElementById("user-form-role");
  const btnSelectAll = document.getElementById("btn-select-all-tabs");
  const btnDeselectAll = document.getElementById("btn-deselect-all-tabs");

  if (openMgmtBtn) {
    openMgmtBtn.addEventListener("click", () => {
      renderUsersTable();
      openModal("modal-user-management");
    });
  }

  if (createNewUserBtn) {
    createNewUserBtn.addEventListener("click", () => {
      openUserFormModal(null);
    });
  }

  if (btnSelectAll) {
    btnSelectAll.addEventListener("click", () => {
      setAllTabCheckboxes(true);
    });
  }

  if (btnDeselectAll) {
    btnDeselectAll.addEventListener("click", () => {
      setAllTabCheckboxes(false);
    });
  }

  if (roleSelect) {
    roleSelect.addEventListener("change", (e) => {
      applyRolePreset(e.target.value);
    });
  }

  if (userForm) {
    userForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await saveUserAccountFromForm();
    });
  }
}

function renderUsersTable() {
  const tbody = document.getElementById("tbody-users-list");
  if (!tbody) return;

  const users = window.db.getUsers();
  const currentSession = window.db.getCurrentUser();

  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">No users found.</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map((u, idx) => {
    const isPrimaryAdmin = u.id === 1;
    const isSelf = currentSession && currentSession.id === u.id;

    // Tab badges
    const tabs = u.permissions?.tabs || {};
    const allowedTabNames = [];
    if (tabs.master_inventory) allowedTabNames.push("Master");
    if (tabs.receiving_log) allowedTabNames.push("Receiving");
    if (tabs.dispatch_log) allowedTabNames.push("Dispatch");
    if (tabs.final_style) allowedTabNames.push("Daily Sheet");
    if (tabs.contractors) allowedTabNames.push("Contractors");
    if (tabs.work_distribution || (u.role === "admin")) allowedTabNames.push("Distribution");
    if (tabs.payment_sheet || (u.role === "admin")) allowedTabNames.push("Payment");
    if (tabs.neon_sync) allowedTabNames.push("Neon");

    const tabsHtml = u.role === "admin" 
      ? `<span class="badge-tag inline" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">All Tabs (8/8)</span>`
      : allowedTabNames.length > 0 
        ? `<div style="display: flex; flex-wrap: wrap; gap: 3px;">${allowedTabNames.map(t => `<span class="badge-tag" style="font-size: 0.675rem; padding: 1px 6px;">${t}</span>`).join("")}</div>`
        : `<span style="color: var(--text-faint); font-size: 0.75rem;">None</span>`;

    // Action rights badges
    const actions = u.permissions?.actions || {};
    let actionsHtml = "";
    if (u.role === "admin") {
      actionsHtml = `<span class="badge-tag inline" style="color: #38bdf8;">Full Access (C, E, D)</span>`;
    } else {
      const rights = [];
      if (actions.can_create) rights.push(`<span class="badge-tag inline" style="padding: 1px 5px; font-size: 0.675rem;">➕ Create</span>`);
      if (actions.can_edit) rights.push(`<span class="badge-tag alter" style="padding: 1px 5px; font-size: 0.675rem;">✏️ Edit</span>`);
      if (actions.can_delete) rights.push(`<span class="badge-tag issue" style="padding: 1px 5px; font-size: 0.675rem;">✕ Delete</span>`);
      if (rights.length === 0) rights.push(`<span class="badge-tag" style="background: rgba(148,163,184,0.1); color: #94a3b8; font-size: 0.675rem; padding: 1px 6px;">👁️ View Only</span>`);
      actionsHtml = `<div style="display: flex; flex-wrap: wrap; gap: 3px;">${rights.join("")}</div>`;
    }

    const statusBadge = (u.status === "Active")
      ? `<span class="badge-tag inline" style="font-size: 0.7rem;">Active</span>`
      : `<span class="badge-tag issue" style="font-size: 0.7rem;">Disabled</span>`;

    const roleColor = u.role === "admin" ? "#818cf8" : (u.role === "manager" ? "#38bdf8" : (u.role === "operator" ? "#34d399" : "#fbbf24"));

    return `
      <tr>
        <td style="text-align: center; font-weight: 700; color: var(--text-muted); font-family: var(--font-mono);">${idx + 1}</td>
        <td>
          <div style="font-weight: 700; color: var(--text-main);">${escapeHtml(u.full_name || u.username)} ${isSelf ? `<span class="badge-tag inline" style="font-size: 0.65rem; margin-left: 4px;">You</span>` : ""}</div>
          <div style="font-size: 0.725rem; color: var(--text-muted); font-family: var(--font-mono);">@${escapeHtml(u.username)}</div>
        </td>
        <td>
          <span style="font-weight: 700; color: ${roleColor}; text-transform: capitalize; font-size: 0.8rem;">
            ${escapeHtml(u.role || 'user')}
          </span>
        </td>
        <td>${tabsHtml}</td>
        <td>${actionsHtml}</td>
        <td style="text-align: center;">${statusBadge}</td>
        <td style="text-align: center; white-space: nowrap;">
          <button class="btn btn-secondary btn-sm" style="color: var(--primary); padding: 2px 7px; margin-right: 4px;" onclick="openUserFormModal(${u.id})" title="Edit user permissions">
            ✏️ Edit
          </button>
          ${!isPrimaryAdmin ? `
            <button class="btn btn-secondary btn-sm" style="color: var(--accent-rose); padding: 2px 6px;" onclick="deleteUserAccountAction(${u.id})" title="Delete user">
              ✕
            </button>
          ` : `
            <button class="btn btn-secondary btn-sm" style="opacity: 0.3; cursor: not-allowed; padding: 2px 6px;" disabled title="Primary Admin protected">
              🔒
            </button>
          `}
        </td>
      </tr>
    `;
  }).join("");
}

function openUserFormModal(userId = null) {
  const form = document.getElementById("form-user-account");
  if (form) form.reset();

  const alertBox = document.getElementById("modal-user-alert");
  if (alertBox) alertBox.style.display = "none";

  const titleEl = document.getElementById("user-form-modal-title");
  const subEl = document.getElementById("user-form-modal-subtitle");
  const idInput = document.getElementById("user-form-id");
  const usernameInput = document.getElementById("user-form-username");
  const passHint = document.getElementById("user-password-hint");
  const passInput = document.getElementById("user-form-password");
  const roleSelect = document.getElementById("user-form-role");
  const statusSelect = document.getElementById("user-form-status");

  if (userId) {
    const user = window.db.getUserById(userId);
    if (!user) return;

    if (titleEl) titleEl.textContent = `Edit User: ${user.full_name}`;
    if (subEl) subEl.textContent = `Modify account details, roles, and granular access rights for @${user.username}`;
    if (idInput) idInput.value = user.id;
    if (usernameInput) {
      usernameInput.value = user.username;
      usernameInput.disabled = (user.id === 1);
    }
    const fullnameInput = document.getElementById("user-form-fullname");
    if (fullnameInput) fullnameInput.value = user.full_name;

    if (passInput) {
      passInput.value = "";
      passInput.placeholder = "•••••••• (Leave blank to keep unchanged)";
      passInput.required = false;
    }
    if (passHint) passHint.textContent = "(Leave blank to keep current)";

    if (roleSelect) {
      roleSelect.value = user.role || "operator";
      roleSelect.disabled = (user.id === 1);
    }
    if (statusSelect) {
      statusSelect.value = user.status || "Active";
      statusSelect.disabled = (user.id === 1);
    }

    const tabs = user.permissions?.tabs || {};
    const checkEl = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };

    checkEl("perm-tab-dashboard", tabs.dashboard !== undefined ? tabs.dashboard : true);
    checkEl("perm-tab-master", tabs.master_inventory);
    checkEl("perm-tab-rec", tabs.receiving_log);
    checkEl("perm-tab-dis", tabs.dispatch_log);
    checkEl("perm-tab-final", tabs.final_style);
    checkEl("perm-tab-cont", tabs.contractors);
    checkEl("perm-tab-dist", tabs.work_distribution !== undefined ? tabs.work_distribution : true);
    checkEl("perm-tab-payment", tabs.payment_sheet !== undefined ? tabs.payment_sheet : true);
    checkEl("perm-tab-neon", tabs.neon_sync);

    const actions = user.permissions?.actions || {};
    checkEl("perm-action-create", actions.can_create);
    checkEl("perm-action-edit", actions.can_edit);
    checkEl("perm-action-delete", actions.can_delete);

  } else {
    if (titleEl) titleEl.textContent = "Add New User Account";
    if (subEl) subEl.textContent = "Create login credentials and customize access permissions";
    if (idInput) idInput.value = "";
    if (usernameInput) {
      usernameInput.value = "";
      usernameInput.disabled = false;
    }
    const fullnameInput = document.getElementById("user-form-fullname");
    if (fullnameInput) fullnameInput.value = "";

    if (passInput) {
      passInput.value = "";
      passInput.placeholder = "Enter initial password";
      passInput.required = true;
    }
    if (passHint) passHint.textContent = "(Required for new user)";

    if (roleSelect) {
      roleSelect.value = "operator";
      roleSelect.disabled = false;
    }
    if (statusSelect) {
      statusSelect.value = "Active";
      statusSelect.disabled = false;
    }

    applyRolePreset("operator");
  }

  openModal("modal-user-form");
}

function applyRolePreset(role) {
  const checkEl = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };

  if (role === "admin") {
    setAllTabCheckboxes(true);
    checkEl("perm-action-create", true);
    checkEl("perm-action-edit", true);
    checkEl("perm-action-delete", true);
  } else if (role === "manager") {
    checkEl("perm-tab-dashboard", true);
    checkEl("perm-tab-master", true);
    checkEl("perm-tab-rec", true);
    checkEl("perm-tab-dis", true);
    checkEl("perm-tab-final", true);
    checkEl("perm-tab-dist", true);
    checkEl("perm-tab-cont", true);
    checkEl("perm-tab-payment", true);
    checkEl("perm-tab-neon", false);
    checkEl("perm-action-create", true);
    checkEl("perm-action-edit", true);
    checkEl("perm-action-delete", false);
  } else if (role === "operator") {
    checkEl("perm-tab-dashboard", true);
    checkEl("perm-tab-master", true);
    checkEl("perm-tab-rec", true);
    checkEl("perm-tab-dis", true);
    checkEl("perm-tab-final", false);
    checkEl("perm-tab-dist", true);
    checkEl("perm-tab-cont", false);
    checkEl("perm-tab-payment", true);
    checkEl("perm-tab-neon", false);
    checkEl("perm-action-create", true);
    checkEl("perm-action-edit", false);
    checkEl("perm-action-delete", false);
  } else if (role === "viewer") {
    checkEl("perm-tab-dashboard", true);
    checkEl("perm-tab-master", true);
    checkEl("perm-tab-rec", true);
    checkEl("perm-tab-dis", true);
    checkEl("perm-tab-final", true);
    checkEl("perm-tab-dist", true);
    checkEl("perm-tab-cont", true);
    checkEl("perm-tab-payment", true);
    checkEl("perm-tab-neon", false);
    checkEl("perm-action-create", false);
    checkEl("perm-action-edit", false);
    checkEl("perm-action-delete", false);
  }
}

function setAllTabCheckboxes(val) {
  const ids = ["perm-tab-dashboard", "perm-tab-master", "perm-tab-rec", "perm-tab-dis", "perm-tab-final", "perm-tab-dist", "perm-tab-cont", "perm-tab-payment", "perm-tab-neon"];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = val;
  });
}

function showUserFormAlert(msg, type = "error") {
  const alertBox = document.getElementById("modal-user-alert");
  if (!alertBox) return;
  alertBox.style.display = "block";
  if (type === "error") {
    alertBox.style.background = "rgba(244, 63, 94, 0.15)";
    alertBox.style.border = "1px solid #f43f5e";
    alertBox.style.color = "#fda4af";
  } else {
    alertBox.style.background = "rgba(16, 185, 129, 0.15)";
    alertBox.style.border = "1px solid #10b981";
    alertBox.style.color = "#34d399";
  }
  alertBox.textContent = msg;
}

async function saveUserAccountFromForm() {
  const alertBox = document.getElementById("modal-user-alert");
  if (alertBox) alertBox.style.display = "none";

  const idVal = document.getElementById("user-form-id")?.value;
  const username = (document.getElementById("user-form-username")?.value || "").trim();
  const fullname = (document.getElementById("user-form-fullname")?.value || "").trim();
  const password = (document.getElementById("user-form-password")?.value || "").trim();
  const role = document.getElementById("user-form-role")?.value || "operator";
  const status = document.getElementById("user-form-status")?.value || "Active";

  if (!username) {
    showUserFormAlert("Username is required.", "error");
    return;
  }
  if (!fullname) {
    showUserFormAlert("Full Name / Designation is required.", "error");
    return;
  }
  if (!idVal && !password) {
    showUserFormAlert("Password is required for new accounts.", "error");
    return;
  }

  const isChecked = (id) => !!document.getElementById(id)?.checked;

  const permissions = {
    tabs: {
      dashboard: isChecked("perm-tab-dashboard"),
      master_inventory: isChecked("perm-tab-master"),
      receiving_log: isChecked("perm-tab-rec"),
      dispatch_log: isChecked("perm-tab-dis"),
      final_style: isChecked("perm-tab-final"),
      work_distribution: isChecked("perm-tab-dist"),
      contractors: isChecked("perm-tab-cont"),
      payment_sheet: isChecked("perm-tab-payment"),
      neon_sync: isChecked("perm-tab-neon")
    },
    actions: {
      can_create: isChecked("perm-action-create"),
      can_edit: isChecked("perm-action-edit"),
      can_delete: isChecked("perm-action-delete")
    }
  };

  // If role is admin, ensure full access
  if (role === "admin") {
    Object.keys(permissions.tabs).forEach(k => permissions.tabs[k] = true);
    Object.keys(permissions.actions).forEach(k => permissions.actions[k] = true);
  }

  const saveBtn = document.getElementById("btn-save-user-account");
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";
  }

  try {
    const saved = await window.db.saveUserAccount({
      id: idVal ? parseInt(idVal, 10) : undefined,
      username,
      full_name: fullname,
      password: password || undefined,
      role,
      status,
      permissions
    });

    closeModal("modal-user-form");
    renderUsersTable();

    // If current user modified their own profile, refresh session view
    const cur = window.db.getCurrentUser();
    if (cur && cur.id === saved.id) {
      updateHeaderUserProfile(saved);
      applyUserPermissions(saved);
      renderAll();
    }

    showToast(`✓ User account "${saved.username}" saved successfully!`);
  } catch (err) {
    showUserFormAlert(err.message, "error");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "✓ Save User Account";
    }
  }
}

async function deleteUserAccountAction(id) {
  const user = window.db.getUserById(id);
  if (!user) return;

  if (id === 1) {
    showToast("Primary Admin account (Amir Ghouri) cannot be deleted.", "error");
    return;
  }

  if (confirm(`Are you sure you want to delete user account "${user.full_name} (@${user.username})"?`)) {
    try {
      await window.db.deleteUserAccount(id);
      renderUsersTable();
      showToast(`User account "@${user.username}" deleted successfully.`);
    } catch (err) {
      showToast(err.message, "error");
    }
  }
}

// ====================================================================
// PAYMENT & DEDUCTION MANAGEMENT SHEET CONTROLLER
// Image Uploads, Cutoff Deadlines, Deductions, Dorie & Floor Challans
// ====================================================================

function getActiveRateApprovalPeriod() {
  const periodSelect = document.getElementById("select-rate-approval-period");
  const periodInput = document.getElementById("input-rate-approval-period");
  if (periodInput && periodInput.style.display !== "none" && periodInput.value.trim()) {
    return periodInput.value.trim();
  }
  if (periodSelect && periodSelect.value) {
    return periodSelect.value.trim();
  }
  return "11-SEP-2026 TO 25-SEP-2026";
}

function formatPeriodDate(dStr) {
  if (!dStr) return "";
  const parts = dStr.split("-");
  if (parts.length !== 3) return dStr;
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const day = parts[2];
  const month = months[parseInt(parts[1], 10) - 1] || "M";
  const year = parts[0];
  return `${day}-${month}-${year}`;
}

function populateRateApprovalPeriods() {
  const periodSelect = document.getElementById("select-rate-approval-period");
  const periodDatalist = document.getElementById("datalist-rate-approval-periods");
  const periods = window.db.getRateApprovalPeriods();

  if (periodSelect) {
    const curVal = periodSelect.value;
    periodSelect.innerHTML = periods.map(p => 
      `<option value="${escapeHtml(p.period_name)}">${escapeHtml(p.period_name)}${p.status === "Active" ? " (Current Active)" : ` (${escapeHtml(p.status)})`}</option>`
    ).join("") + `<option value="all">All Periods (Combined)</option>`;

    if (curVal && Array.from(periodSelect.options).some(o => o.value === curVal)) {
      periodSelect.value = curVal;
    }
  }

  if (periodDatalist) {
    periodDatalist.innerHTML = periods.map(p => 
      `<option value="${escapeHtml(p.period_name)}">`
    ).join("");
  }
}

function openSheetSetupModal() {
  const form = document.getElementById("form-sheet-setup");
  if (form) form.reset();

  const activePeriod = getActiveRateApprovalPeriod();
  const allPeriods = window.db.getRateApprovalPeriods();
  const currentObj = allPeriods.find(p => p.period_name.toLowerCase() === activePeriod.toLowerCase());

  if (currentObj) {
    if (document.getElementById("sheet-setup-start-date")) document.getElementById("sheet-setup-start-date").value = currentObj.start_date || "";
    if (document.getElementById("sheet-setup-end-date")) document.getElementById("sheet-setup-end-date").value = currentObj.end_date || "";
    if (document.getElementById("sheet-setup-name")) document.getElementById("sheet-setup-name").value = currentObj.period_name || "";
    if (document.getElementById("sheet-setup-dept")) document.getElementById("sheet-setup-dept").value = currentObj.department || "Hand Embroidery Department";
    if (document.getElementById("sheet-setup-status")) document.getElementById("sheet-setup-status").value = currentObj.status || "Active";
    if (document.getElementById("sheet-setup-notes")) document.getElementById("sheet-setup-notes").value = currentObj.notes || "";
  } else {
    if (document.getElementById("sheet-setup-dept")) document.getElementById("sheet-setup-dept").value = "Hand Embroidery Department";
    if (document.getElementById("sheet-setup-status")) document.getElementById("sheet-setup-status").value = "Active";
  }

  renderSheetSetupExistingList();
  openModal("modal-sheet-setup");
}

function renderSheetSetupExistingList() {
  const listBox = document.getElementById("sheet-setup-list-box");
  const countBadge = document.getElementById("sheet-setup-count-badge");
  if (!listBox) return;

  const periods = window.db.getRateApprovalPeriods();
  const allSheets = window.db.getPaymentSheets();
  const activePeriod = getActiveRateApprovalPeriod();

  if (countBadge) {
    countBadge.textContent = `${periods.length} Sheet${periods.length === 1 ? "" : "s"}`;
  }

  if (periods.length === 0) {
    listBox.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 0.75rem;">No sheets configured yet.</div>`;
    return;
  }

  listBox.innerHTML = periods.map(p => {
    const count = allSheets.filter(s => (s.period || "").trim().toLowerCase() === p.period_name.trim().toLowerCase()).length;
    const isCurrentActive = p.period_name.toLowerCase() === activePeriod.toLowerCase();

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.45rem 0.65rem; border-bottom: 1px solid var(--border-color); font-size: 0.8rem; ${isCurrentActive ? 'background: rgba(16, 185, 129, 0.08); border-left: 3px solid #10b981;' : ''}">
        <div>
          <div style="font-weight: 800; font-family: var(--font-mono); color: var(--text-main);">
            ${escapeHtml(p.period_name)}
            ${isCurrentActive ? '<span class="badge-tag success" style="font-size: 0.65rem; margin-left: 4px;">Active View</span>' : ''}
          </div>
          <div style="font-size: 0.725rem; color: var(--text-muted); margin-top: 1px;">
            ${escapeHtml(p.department || 'Hand Embroidery')} | ${count} styles recorded ${p.status ? `| Status: ${escapeHtml(p.status)}` : ''}
          </div>
        </div>
        <div style="display: flex; gap: 0.35rem;">
          <button type="button" class="btn btn-secondary btn-xs" onclick="selectSheetPeriodFromSetup('${escapeHtml(p.period_name)}')" title="Switch to this sheet">
            Open Sheet
          </button>
          <button type="button" class="btn btn-secondary btn-xs" onclick="deleteSheetPeriodAction('${escapeHtml(p.id)}')" title="Delete this sheet" style="color: var(--accent-rose);">
            🗑️
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function selectSheetPeriodFromSetup(periodName) {
  const periodSelect = document.getElementById("select-rate-approval-period");
  const periodInput = document.getElementById("input-rate-approval-period");
  if (periodSelect) periodSelect.value = periodName;
  if (periodInput) periodInput.value = periodName;
  closeModal("modal-sheet-setup");
  renderPaymentSheet();
  showToast(`✓ Opened sheet for "${periodName}"`, "success");
}

async function deleteSheetPeriodAction(periodId) {
  if (confirm("Are you sure you want to delete this sheet period? Any entries recorded for this period will also be removed permanently.")) {
    const success = await window.db.deleteRateApprovalPeriod(periodId);
    if (success) {
      // If the currently active sheet was deleted, switch to the first remaining sheet or "all"
      const remaining = window.db.getRateApprovalPeriods();
      const currentActive = getActiveRateApprovalPeriod();
      if (!remaining.some(r => r.period_name.toLowerCase() === currentActive.toLowerCase())) {
        const nextPeriod = remaining.length > 0 ? remaining[0].period_name : "all";
        const periodSelect = document.getElementById("select-rate-approval-period");
        const periodInput = document.getElementById("input-rate-approval-period");
        if (periodSelect) periodSelect.value = nextPeriod;
        if (periodInput) periodInput.value = nextPeriod;
      }

      populateRateApprovalPeriods();
      renderSheetSetupExistingList();
      renderPaymentSheet();
      showToast("✓ Sheet period deleted permanently from local cache & Neon Cloud database", "success");
    } else {
      showToast("Could not delete sheet period", "error");
    }
  }
}

function saveSheetSetupForm() {
  const periodName = (document.getElementById("sheet-setup-name")?.value || "").trim();
  const startDate = document.getElementById("sheet-setup-start-date")?.value || "";
  const endDate = document.getElementById("sheet-setup-end-date")?.value || "";
  const dept = (document.getElementById("sheet-setup-dept")?.value || "Hand Embroidery Department").trim();
  const status = document.getElementById("sheet-setup-status")?.value || "Active";
  const notes = (document.getElementById("sheet-setup-notes")?.value || "").trim();

  if (!periodName) {
    showToast("Please provide a period name.", "error");
    return;
  }

  window.db.addRateApprovalPeriod({
    period_name: periodName,
    start_date: startDate,
    end_date: endDate,
    department: dept,
    status: status,
    notes: notes
  });

  populateRateApprovalPeriods();

  const periodSelect = document.getElementById("select-rate-approval-period");
  const periodInput = document.getElementById("input-rate-approval-period");
  if (periodSelect) periodSelect.value = periodName;
  if (periodInput) periodInput.value = periodName;

  closeModal("modal-sheet-setup");
  renderPaymentSheet();
  showToast(`✓ Sheet "${periodName}" configured and opened successfully!`, "success");
}

function initPaymentSheetView() {
  const searchInput = document.getElementById("payment-search-input");
  const channelFilter = document.getElementById("filter-payment-channel");
  const statusFilter = document.getElementById("filter-payment-status");
  const contractorFilter = document.getElementById("filter-payment-contractor");
  const periodSelect = document.getElementById("select-rate-approval-period");
  const periodInput = document.getElementById("input-rate-approval-period");

  // Populate Rate Approval Periods
  populateRateApprovalPeriods();

  // Populate contractor filter dropdown
  populatePaymentContractorFilter();

  // Populate autocomplete styles datalist
  populateAuditStylesDatalist();

  // Toggle between period dropdown and text input
  document.getElementById("btn-toggle-period-input")?.addEventListener("click", () => {
    const sel = document.getElementById("select-rate-approval-period");
    const inp = document.getElementById("input-rate-approval-period");
    const btn = document.getElementById("btn-toggle-period-input");
    if (inp.style.display === "none") {
      inp.style.display = "inline-block";
      sel.style.display = "none";
      inp.value = sel.value === "all" ? "" : sel.value;
      if (btn) btn.textContent = "📋 Dropdown";
      inp.focus();
    } else {
      inp.style.display = "none";
      sel.style.display = "inline-block";
      if (btn) btn.textContent = "✏️ Type Period";
      if (inp.value.trim()) {
        sel.value = inp.value.trim();
      }
    }
    renderPaymentSheet();
  });

  // Open Sheet Setup Modal
  document.getElementById("btn-open-sheet-setup-modal")?.addEventListener("click", () => {
    openSheetSetupModal();
  });
  document.getElementById("btn-quick-new-period")?.addEventListener("click", () => {
    openSheetSetupModal();
  });

  // Auto-format dates to Period Name in Sheet Setup
  const setupStartDate = document.getElementById("sheet-setup-start-date");
  const setupEndDate = document.getElementById("sheet-setup-end-date");
  const setupName = document.getElementById("sheet-setup-name");

  const autoFormatPeriodDates = () => {
    if (setupStartDate && setupEndDate && setupName) {
      const sVal = setupStartDate.value;
      const eVal = setupEndDate.value;
      if (sVal && eVal) {
        setupName.value = `${formatPeriodDate(sVal)} TO ${formatPeriodDate(eVal)}`;
      }
    }
  };

  if (setupStartDate) setupStartDate.addEventListener("change", autoFormatPeriodDates);
  if (setupEndDate) setupEndDate.addEventListener("change", autoFormatPeriodDates);

  // Submit Sheet Setup Form
  const formSetup = document.getElementById("form-sheet-setup");
  if (formSetup) {
    formSetup.addEventListener("submit", (e) => {
      e.preventDefault();
      saveSheetSetupForm();
    });
  }

  const debouncedRenderPayment = debounce(() => renderPaymentSheet(), 120);

  if (searchInput) {
    searchInput.addEventListener("input", debouncedRenderPayment);
  }
  if (periodInput) {
    periodInput.addEventListener("input", debouncedRenderPayment);
    periodInput.addEventListener("change", () => renderPaymentSheet());
  }
  [channelFilter, statusFilter, contractorFilter, periodSelect].forEach(el => {
    if (el) {
      el.addEventListener("change", () => renderPaymentSheet());
    }
  });

  // Toggle View Mode (Excel View vs Detailed Cards View)
  document.getElementById("btn-toggle-view-mode")?.addEventListener("click", () => {
    const excelContainer = document.getElementById("container-excel-table");
    const detailedContainer = document.getElementById("container-detailed-table");
    const label = document.getElementById("label-view-mode");

    if (excelContainer && detailedContainer) {
      if (excelContainer.style.display === "none") {
        excelContainer.style.display = "block";
        detailedContainer.style.display = "none";
        if (label) label.textContent = "📊 Excel Sheet View";
      } else {
        excelContainer.style.display = "none";
        detailedContainer.style.display = "block";
        if (label) label.textContent = "💳 Detailed Cards View";
      }
    }
  });

  // Clear Table / Sheet entries
  document.getElementById("btn-reset-excel-sample")?.addEventListener("click", () => {
    const activePeriod = getActiveRateApprovalPeriod();
    const promptMsg = (activePeriod && activePeriod !== "all")
      ? `Clear all entries from the current sheet ("${activePeriod}")?`
      : `Clear all entries from all payment sheets?`;

    if (confirm(promptMsg)) {
      if (activePeriod && activePeriod !== "all") {
        const remaining = window.db.getPaymentSheets().filter(p => (p.period || "").trim().toLowerCase() !== activePeriod.trim().toLowerCase());
        window.db.savePaymentSheets(remaining);
      } else {
        window.db.savePaymentSheets([]);
        window.db.executeNeonQuery("TRUNCATE TABLE payment_sheet;").catch(() => null);
      }
      populatePaymentContractorFilter();
      populateAuditStylesDatalist();
      renderPaymentSheet();
      renderKPIs();
      showToast("✓ Payment sheet entries cleared successfully!", "success");
    }
  });

  // Smart Style Audit Inputs Listeners
  const auditStyleInput = document.getElementById("audit-input-style");
  const auditCatSelect = document.getElementById("audit-input-category");
  const btnRunAudit = document.getElementById("btn-execute-smart-audit");

  if (auditStyleInput) {
    auditStyleInput.addEventListener("input", () => {
      triggerSmartAuditFromInputs();
    });
    auditStyleInput.addEventListener("change", () => {
      triggerSmartAuditFromInputs();
    });
  }

  if (auditCatSelect) {
    auditCatSelect.addEventListener("change", () => {
      triggerSmartAuditFromInputs();
    });
  }

  if (btnRunAudit) {
    btnRunAudit.addEventListener("click", () => {
      triggerSmartAuditFromInputs(true);
    });
  }

  // Quick test buttons for user convenience
  document.getElementById("btn-audit-quick-test")?.addEventListener("click", () => {
    if (auditStyleInput) auditStyleInput.value = "JGP-26-1746";
    if (auditCatSelect) auditCatSelect.value = "SHIRT";
    triggerSmartAuditFromInputs(true);
  });

  document.getElementById("btn-audit-dorie-test")?.addEventListener("click", () => {
    if (auditStyleInput) auditStyleInput.value = "JLS-26-3018";
    if (auditCatSelect) auditCatSelect.value = "SHIRT";
    triggerSmartAuditFromInputs(true);
  });

  document.getElementById("btn-audit-floor-test")?.addEventListener("click", () => {
    if (auditStyleInput) auditStyleInput.value = "JPS-ROX-26-3918";
    if (auditCatSelect) auditCatSelect.value = "SHIRT";
    triggerSmartAuditFromInputs(true);
  });

  document.getElementById("btn-open-payment-modal")?.addEventListener("click", () => {
    openPaymentEntryModal(null);
  });

  document.getElementById("btn-print-payment-sheet")?.addEventListener("click", printPaymentSheet);
  document.getElementById("btn-export-payment-csv")?.addEventListener("click", exportPaymentSheetToCSV);

  // Table Horizontal Scroll Navigation Buttons
  const btnScrollLeft = document.getElementById("btn-scroll-table-left");
  const btnScrollRight = document.getElementById("btn-scroll-table-right");
  const excelContainer = document.getElementById("container-excel-table");

  btnScrollLeft?.addEventListener("click", () => {
    excelContainer?.scrollBy({ left: -350, behavior: "smooth" });
  });
  btnScrollRight?.addEventListener("click", () => {
    excelContainer?.scrollBy({ left: 350, behavior: "smooth" });
  });

  // Initial render
  renderPaymentSheet();
}

// Populate Contractors in Payment filter
function populatePaymentContractorFilter() {
  const filterSelect = document.getElementById("filter-payment-contractor");
  if (!filterSelect) return;

  const currentVal = filterSelect.value;
  const list = window.db.getPaymentSheets();
  const contractors = Array.from(new Set(list.map(p => p.contractor_name).filter(Boolean))).sort();

  filterSelect.innerHTML = `<option value="">All Contractors</option>` +
    contractors.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");

  if (currentVal) filterSelect.value = currentVal;
}

// Populate Styles Datalist for fast autocomplete
function populateAuditStylesDatalist() {
  const datalist = document.getElementById("audit-styles-datalist");
  if (!datalist) return;

  const master = window.db.getMasterInventory();
  const payments = window.db.getPaymentSheets();

  const allStyles = Array.from(new Set([
    ...master.map(m => m.style_code),
    ...payments.map(p => p.style_code)
  ].filter(Boolean))).sort();

  datalist.innerHTML = allStyles.map(s => `<option value="${escapeHtml(s)}">`).join("");
}

// Helper to trigger audit from the UI inputs
function triggerSmartAuditFromInputs(focusResult = false) {
  const styleCode = (document.getElementById("audit-input-style")?.value || "").trim();
  const category = (document.getElementById("audit-input-category")?.value || "SHIRT").trim();

  if (!styleCode) {
    const box = document.getElementById("smart-audit-result-display");
    if (box) box.style.display = "none";
    return;
  }

  runSmartStyleAudit(styleCode, category, focusResult);
}

// ====================================================================
// CORE REQUIREMENT: DUAL-CONDITION SMART STYLE & CATEGORY AUDIT
// Checks how many pcs payment taken, how many remaining, Dorie & Floor checks
// ====================================================================
function runSmartStyleAudit(styleCode, category, shouldScroll = false) {
  const box = document.getElementById("smart-audit-result-display");
  if (!box) return;

  const audit = window.db.auditStylePaymentHistory(styleCode, category);
  if (!audit) {
    box.style.display = "none";
    return;
  }

  box.style.display = "block";

  // Build Status Badge
  let statusBannerHtml = "";
  if (audit.is_fully_paid) {
    statusBannerHtml = `
      <div class="audit-status-banner complete">
        <div style="display: flex; align-items: center; gap: 0.65rem;">
          <span style="font-size: 1.4rem;">🎉</span>
          <div>
            <div style="font-size: 1.05rem; font-weight: 800;">
              STYLE 100% CLOSED / FULLY PAID
            </div>
            <div style="font-size: 0.775rem; opacity: 0.9; margin-top: 2px;">
              Total Cut: <strong>${audit.cut_qty.toLocaleString()}</strong> pcs | Total Paid: <strong>${audit.total_paid_pcs.toLocaleString()}</strong> pcs | Remaining Balance: <strong>0 pcs</strong>
            </div>
          </div>
        </div>
        <span class="badge-tag success" style="font-size: 0.8rem; padding: 4px 10px;">✓ 100% Cleared</span>
      </div>
    `;
  } else {
    statusBannerHtml = `
      <div class="audit-status-banner partial">
        <div style="display: flex; align-items: center; gap: 0.65rem;">
          <span style="font-size: 1.4rem;">⚡</span>
          <div>
            <div style="font-size: 1.05rem; font-weight: 800;">
              Partial Payment: ${audit.total_paid_pcs.toLocaleString()} pcs paid so far
            </div>
            <div style="font-size: 0.775rem; opacity: 0.9; margin-top: 2px;">
              Total Cut: <strong>${audit.cut_qty.toLocaleString()}</strong> pcs | Already Received: <strong>${audit.total_paid_pcs.toLocaleString()}</strong> pcs | Pending Balance: <strong style="color: #f43f5e; font-size: 0.9rem;">${audit.remaining_balance_pcs.toLocaleString()} pcs</strong>
            </div>
          </div>
        </div>
        <span class="badge-tag warning" style="font-size: 0.8rem; padding: 4px 10px;">⏳ ${audit.remaining_balance_pcs.toLocaleString()} pcs Remaining</span>
      </div>
    `;
  }

  // Dorie Alert Banner
  let dorieAlertHtml = "";
  if (audit.is_dorie) {
    const details = audit.dorie_findings.map(f => `<strong>${f.pcs.toLocaleString()} pcs</strong> on period <em>${escapeHtml(f.period)}</em> (Remarks: "${escapeHtml(f.remarks)}")`).join("<br>");
    dorieAlertHtml = `
      <div class="audit-alert-box dorie-warning">
        <span style="font-size: 1.3rem;">🚨</span>
        <div>
          <div style="font-weight: 800; font-size: 0.925rem;">
            ⚠️ Warning! Dorie Claim Found: Payment already recorded on DORIE
          </div>
          <div style="font-size: 0.775rem; margin-top: 3px; opacity: 0.95;">
            ${details}
          </div>
        </div>
      </div>
    `;
  } else {
    dorieAlertHtml = `
      <div class="audit-alert-box dorie-clean">
        <span style="font-size: 1.15rem;">✅</span>
        <div>
          <strong>No Dorie payment claimed</strong> - Style has no record of Dorie voucher claims.
        </div>
      </div>
    `;
  }

  // Floor Transfer Alert Banner
  let floorAlertHtml = "";
  if (audit.is_floor_transfer) {
    const details = audit.floor_findings.map(f => `<strong>${escapeHtml(f.floor_name || 'Other Floor')}</strong> (${f.pcs.toLocaleString()} pcs) - Remarks: "${escapeHtml(f.remarks)}"${f.challan ? ` | Challan #${escapeHtml(f.challan)}` : ""}`).join("<br>");
    floorAlertHtml = `
      <div class="audit-alert-box floor-warning">
        <span style="font-size: 1.3rem;">🏢</span>
        <div>
          <div style="font-weight: 800; font-size: 0.925rem;">
            ⚠️ Floor Alert: Goods transferred/received at another floor
          </div>
          <div style="font-size: 0.775rem; margin-top: 3px; opacity: 0.95;">
            ${details}
          </div>
        </div>
      </div>
    `;
  } else {
    floorAlertHtml = `
      <div class="audit-alert-box floor-clean">
        <span style="font-size: 1.15rem;">✅</span>
        <div>
          <strong>No other floor transfer recorded</strong> - Dispatched directly through main stock route.
        </div>
      </div>
    `;
  }

  // History Breakdown Table of Past Sheets
  let historyRowsHtml = "";
  if (audit.records && audit.records.length > 0) {
    historyRowsHtml = audit.records.map((r, i) => {
      const prod = parseInt(r.prod_pcs_qty != null ? r.prod_pcs_qty : r.paid_pcs, 10) || 0;
      const prevPay = parseInt(r.previous_paid_pcs, 10) || 0;
      const stockBal = r.balance_from_stock != null ? r.balance_from_stock : 0;
      const hembBal = r.balance_from_hemb != null ? r.balance_from_hemb : 0;
      const totBal = r.total_balance != null ? r.total_balance : 0;
      const isClosed = (r.remarks_2 || '').toLowerCase().includes('close') || totBal === 0;

      return `
        <tr class="${isClosed ? 'row-closed' : ''}">
          <td style="text-align: center; vertical-align: middle; font-family: var(--font-mono); font-size: 0.75rem;">${escapeHtml(r.period || '11-SEP-2026 TO 25-SEP-2026')}</td>
          <td style="text-align: center; vertical-align: middle;"><strong>${escapeHtml(r.contractor_name || '-')}</strong></td>
          <td style="text-align: center; vertical-align: middle; font-family: var(--font-mono); font-weight: 800; color: #10b981;">${prod.toLocaleString()}</td>
          <td style="text-align: center; vertical-align: middle; font-family: var(--font-mono);">${prevPay > 0 ? prevPay.toLocaleString() : '-'}</td>
          <td style="text-align: center; vertical-align: middle; font-family: var(--font-mono);" class="${stockBal > 0 ? 'cell-balance-positive' : 'cell-balance-zero'}">${stockBal}</td>
          <td style="text-align: center; vertical-align: middle; font-family: var(--font-mono);" class="${hembBal > 0 ? 'cell-balance-positive' : 'cell-balance-zero'}">${hembBal}</td>
          <td style="text-align: center; vertical-align: middle; font-family: var(--font-mono);" class="${totBal > 0 ? 'cell-balance-positive' : 'cell-balance-zero'}">${totBal}</td>
          <td style="text-align: center; vertical-align: middle; font-size: 0.75rem;">${escapeHtml(r.remarks_1 || r.remarks || '-')}</td>
          <td style="text-align: center; vertical-align: middle; font-size: 0.75rem; font-weight: 700; color: ${isClosed ? '#10b981' : '#f43f5e'};">${escapeHtml(r.remarks_2 || r.status || '-')}</td>
          <td style="text-align: center; vertical-align: middle; font-size: 0.725rem; font-family: var(--font-mono);">${r.payment_channel === 'dorie' ? '🧵 DORIE' : (r.payment_channel === 'floor_transfer' ? `🏢 ${escapeHtml(r.target_floor || 'Floor')}` : '📦 Stock')}</td>
        </tr>
      `;
    }).join("");
  } else {
    historyRowsHtml = `
      <tr>
        <td colspan="10" style="text-align: center; vertical-align: middle; padding: 1rem; color: var(--text-muted);">
          No Rate Approval entries recorded for this style yet. Master inventory cut: ${audit.cut_qty} pcs.
        </td>
      </tr>
    `;
  }

  box.innerHTML = `
    <div class="audit-result-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
        <div style="display: flex; align-items: center; gap: 0.65rem;">
          <span class="style-code-badge" style="font-size: 1.15rem; padding: 4px 12px;">${escapeHtml(audit.style_code)}</span>
          <span class="badge-tag category" style="font-size: 0.8rem;">${escapeHtml(audit.category)}</span>
          ${audit.contractor_name ? `<span class="badge-tag inline" style="font-size: 0.8rem;">${escapeHtml(audit.contractor_name)}</span>` : ""}
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button type="button" class="btn btn-primary btn-sm" onclick="openPaymentEntryModal(null, { style_code: '${escapeHtml(audit.style_code)}', category: '${escapeHtml(audit.category)}', contractor_name: '${escapeHtml(audit.contractor_name || '')}', total_pcs: ${audit.cut_qty}, prod_pcs: ${audit.remaining_balance_pcs} })">
            + Add Style To Sheet
          </button>
        </div>
      </div>

      ${statusBannerHtml}

      <!-- 4-Card Hero Metrics Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 0.75rem; margin-bottom: 1rem;">
        <div class="form-kpi-card cyan" style="text-align: center;">
          <span class="form-kpi-label">Master Cut Quantity</span>
          <div class="form-kpi-val" style="font-size: 1.4rem;">${audit.cut_qty.toLocaleString()} pcs</div>
          <span class="form-kpi-sub">Total cutting pieces</span>
        </div>

        <div class="form-kpi-card emerald" style="text-align: center;">
          <span class="form-kpi-label">Paid Pieces (Approved)</span>
          <div class="form-kpi-val" style="font-size: 1.4rem; color: #10b981;">${audit.total_paid_pcs.toLocaleString()} pcs</div>
          <span class="form-kpi-sub">${audit.previous_sheets_paid_pcs.toLocaleString()} old + ${audit.current_sheet_prod_pcs.toLocaleString()} current</span>
        </div>

        <div class="form-kpi-card rose" style="text-align: center;">
          <span class="form-kpi-label">Remaining Unpaid Balance</span>
          <div class="form-kpi-val" style="font-size: 1.4rem; color: ${audit.remaining_balance_pcs > 0 ? '#f43f5e' : '#10b981'};">${audit.remaining_balance_pcs.toLocaleString()} pcs</div>
          <span class="form-kpi-sub">${audit.remaining_balance_pcs === 0 ? 'Clear / 0 balance' : 'Remaining balance'}</span>
        </div>

        <div class="form-kpi-card amber" style="text-align: center;">
          <span class="form-kpi-label">Total Balance from Stock/H-Emb</span>
          <div class="form-kpi-val" style="font-size: 1.4rem;">${audit.total_balance.toLocaleString()} pcs</div>
          <span class="form-kpi-sub">Stock: ${audit.balance_from_stock} | WIP: ${audit.balance_from_hemb}</span>
        </div>
      </div>

      <!-- Critical Condition Banners -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.75rem; margin-bottom: 1.15rem;">
        ${dorieAlertHtml}
        ${floorAlertHtml}
      </div>

      <!-- Historical Breakdown Table -->
      <div style="margin-top: 1rem;">
        <div style="font-size: 0.85rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: space-between;">
          <span>📜 Historical Breakdown Across Sheets</span>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${audit.records.length} records found</span>
        </div>
        <div class="table-container" style="max-height: 250px; overflow-y: auto;">
          <table class="table-rate-approval" style="font-size: 0.775rem;">
            <thead>
              <tr>
                <th style="text-align: center; vertical-align: middle;">Sheet Period</th>
                <th style="text-align: center; vertical-align: middle;">Cont Name</th>
                <th style="text-align: center; vertical-align: middle;">Prod Pcs</th>
                <th style="text-align: center; vertical-align: middle;">Pay Receive</th>
                <th style="text-align: center; vertical-align: middle;">Stock Bal</th>
                <th style="text-align: center; vertical-align: middle;">H-Emb Bal</th>
                <th style="text-align: center; vertical-align: middle;">Total Bal</th>
                <th style="text-align: center; vertical-align: middle;">Remarks 1</th>
                <th style="text-align: center; vertical-align: middle;">REMARKS (Status)</th>
                <th style="text-align: center; vertical-align: middle;">Route</th>
              </tr>
            </thead>
            <tbody>
              ${historyRowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  if (shouldScroll) {
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

// ====================================================================
// RENDER RATE APPROVAL SUMMARY SHEET (Exact to Image 1 & 2)
// Default total: 51,004 pcs
// ====================================================================
function renderPaymentSheet() {
  const tbodyExcel = document.getElementById("tbody-rate-approval");
  const tfootExcel = document.getElementById("tfoot-rate-approval");
  const tbodyDetailed = document.getElementById("tbody-payment-sheet");
  const tfootDetailed = document.getElementById("tfoot-payment-sheet");

  const canEdit = window.db.canUserPerformAction("can_edit");
  const canDelete = window.db.canUserPerformAction("can_delete");
  const canCreate = window.db.canUserPerformAction("can_create");

  const query = (document.getElementById("payment-search-input")?.value || "").toLowerCase().trim();
  const channelFilter = document.getElementById("filter-payment-channel")?.value || "";
  const statusFilter = document.getElementById("filter-payment-status")?.value || "";
  const contractorFilter = (document.getElementById("filter-payment-contractor")?.value || "").toLowerCase().trim();
  const periodFilter = getActiveRateApprovalPeriod() || "11-SEP-2026 TO 25-SEP-2026";

  const list = window.db.getPaymentSheets();

  // Find active period metadata (department, notes, etc.)
  const allPeriods = (window.db && typeof window.db.getRateApprovalPeriods === "function") 
    ? window.db.getRateApprovalPeriods() 
    : [];
  const activePeriodObj = allPeriods.find(p => (p.period_name || "").toLowerCase() === periodFilter.toLowerCase());

  // Update department subtitle in excel banner
  const deptLabel = document.getElementById("excel-dept-label");
  if (deptLabel) {
    deptLabel.textContent = (activePeriodObj && activePeriodObj.department) 
      ? activePeriodObj.department 
      : "Hand Embroidery Department";
  }

  // Calculate entries specifically for the active period (or all if "all" is selected)
  const targetPeriodItems = (periodFilter && periodFilter !== "all")
    ? list.filter(item => (item.period || "").trim().toLowerCase() === periodFilter.trim().toLowerCase())
    : list;

  // When searching, search across ALL sheets and periods; otherwise view active period sheet
  const sourceItems = query ? list : targetPeriodItems;

  // Summary tallies over the active sheet / period (or search results if query active)
  let kpiCut = 0;
  let kpiProd = 0;
  let kpiPrevReceive = 0;
  let kpiCumulative = 0;
  let kpiBal = 0;

  const kpiItems = query ? sourceItems : targetPeriodItems;
  kpiItems.forEach(item => {
    const cut = item.cut_qty != null ? item.cut_qty : (item.total_pcs || 0);
    const prod = parseInt(item.prod_pcs_qty != null ? item.prod_pcs_qty : item.paid_pcs, 10) || 0;
    const prevReceive = parseInt(item.previous_paid_pcs, 10) || 0;
    const totBal = item.total_balance != null ? item.total_balance : (item.balance_pcs || 0);

    kpiCut += cut;
    kpiProd += prod;
    kpiPrevReceive += prevReceive;
    kpiCumulative += (prod + prevReceive);
    kpiBal += totBal;
  });

  // Update top KPI Summary Cards
  const elCut = document.getElementById("kpi-pay-total-cut");
  if (elCut) elCut.textContent = kpiCut.toLocaleString();

  const elProd = document.getElementById("kpi-pay-prod-pcs");
  if (elProd) elProd.textContent = kpiProd.toLocaleString();

  const elPrev = document.getElementById("kpi-pay-prev-receive");
  if (elPrev) elPrev.textContent = kpiPrevReceive.toLocaleString();

  const elCumul = document.getElementById("kpi-pay-cumulative-total");
  if (elCumul) elCumul.textContent = kpiCumulative.toLocaleString();

  const elBal = document.getElementById("kpi-pay-total-balance");
  if (elBal) elBal.textContent = kpiBal.toLocaleString();

  // Update navigation badge for payment sheet
  const badgePayment = document.getElementById("badge-payment-count");
  if (badgePayment) badgePayment.textContent = list.length;

  // Filter list for active view (sub-filters query, channel, status, contractor)
  const filtered = sourceItems.filter(item => {
    // Query match
    const qMatch = !query ||
      (item.style_code || "").toLowerCase().includes(query) ||
      (item.contractor_name || "").toLowerCase().includes(query) ||
      (item.working || item.category || "").toLowerCase().includes(query) ||
      (item.remarks_1 || item.remarks || "").toLowerCase().includes(query) ||
      (item.remarks_2 || item.status_remarks || "").toLowerCase().includes(query) ||
      (item.target_floor || "").toLowerCase().includes(query) ||
      (item.period || "").toLowerCase().includes(query);

    // Channel filter
    const cMatch = !channelFilter || item.payment_channel === channelFilter;

    // Status filter
    let sMatch = true;
    const rem2 = (item.remarks_2 || item.status_remarks || item.status || "").toLowerCase();
    const totBal = item.total_balance != null ? item.total_balance : 0;
    if (statusFilter === "close") sMatch = rem2.includes("close") || totBal === 0;
    else if (statusFilter === "deduction") sMatch = rem2.includes("deduction");
    else if (statusFilter === "balance") sMatch = totBal > 0;

    // Contractor filter
    const contMatch = !contractorFilter || (item.contractor_name || "").toLowerCase() === contractorFilter;

    return qMatch && cMatch && sMatch && contMatch;
  });

  // -------------------------------------------------------------
  // RENDER 1: EXCEL RATE APPROVAL TABLE
  // -------------------------------------------------------------
  if (tbodyExcel) {
    if (filtered.length === 0) {
      const isSearchActive = !!query;
      const displayPeriod = (periodFilter && periodFilter !== "all") ? periodFilter : "All Periods";
      tbodyExcel.innerHTML = `
        <tr>
          <td colspan="16" style="text-align: center; vertical-align: middle; padding: 3rem 1.5rem; color: var(--text-muted);">
            <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">📋</div>
            <div style="font-weight: 700; font-size: 1.05rem; margin-bottom: 0.35rem; color: var(--text-main);">
              ${isSearchActive ? `No rate approval / payment records match "${escapeHtml(query)}" across all time periods.` : `Rate Approval Sheet for "${escapeHtml(displayPeriod)}" is empty.`}
            </div>
            <p style="font-size: 0.85rem; margin-bottom: 1rem; color: var(--text-muted); max-width: 480px; margin-left: auto; margin-right: auto;">
              ${isSearchActive ? "Try clearing or changing your search style name or filters above." : 'No entries have been recorded yet for this period. Click "+ New Entry" to record style rate approvals or "⚙️ Sheet Setup" to manage sheets.'}
            </p>
            <div style="display: flex; gap: 0.6rem; justify-content: center; align-items: center; flex-wrap: wrap;">
              ${isSearchActive ? `
                <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('payment-search-input').value=''; renderPaymentSheet();">
                  ✕ Clear Search
                </button>
              ` : `
                <button type="button" class="btn btn-primary btn-sm" onclick="openPaymentEntryModal(null)">
                  + New Entry
                </button>
              `}
            </div>
          </td>
        </tr>
      `;
      if (tfootExcel) tfootExcel.innerHTML = "";
    } else {
      let fCut = 0, fProd = 0, fStockBal = 0, fHembBal = 0, fTotBal = 0, fCumulative = 0;

      // Master Inventory lookup map for live auto-sync balances
      const masterList = window.db.getMasterInventory();
      const masterLookupMap = new Map();
      masterList.forEach(m => {
        const code = (m.style_code || "").trim().toLowerCase();
        const cat = (m.category || "").trim().toLowerCase();
        if (code) {
          if (cat) masterLookupMap.set(`${code}__${cat}`, m);
          if (!masterLookupMap.has(code)) masterLookupMap.set(code, m);
        }
      });

      tbodyExcel.innerHTML = filtered.map((item, idx) => {
        const srNo = item.sr_no || (idx + 1);
        const styleCode = item.style_code || "";
        const working = item.working || item.category || "SHIRT";
        const distAssigned = (window.db && typeof window.db.getContractorForStyle === "function") 
          ? window.db.getContractorForStyle(styleCode, working) 
          : null;
        const contName = item.contractor_name || (distAssigned ? distAssigned.contractor_name : "");
        const rate = item.rate_per_pc || (distAssigned && distAssigned.rate ? distAssigned.rate : "");
        const cutQty = item.cut_qty != null ? item.cut_qty : (item.total_pcs || 0);
        const prodQty = parseInt(item.prod_pcs_qty != null ? item.prod_pcs_qty : item.paid_pcs, 10) || 0;
        const carigarRate = item.carigar_rate != null ? item.carigar_rate : 0;
        const commission = item.commission != null ? item.commission : 0;
        const rateTotal = item.rate_total != null ? item.rate_total : (item.rate_per_pc || 0);
        const prevPaid = parseInt(item.previous_paid_pcs, 10) || 0;
        const remarks1 = item.remarks_1 || item.remarks || "";

        // Auto-fetch balances from Master Inventory matching this style
        const cleanCode = styleCode.trim().toLowerCase();
        const cleanWork = working.trim().toLowerCase();
        const masterItem = masterLookupMap.get(`${cleanCode}__${cleanWork}`) || masterLookupMap.get(cleanCode);

        const stockBal = masterItem ? masterItem.balance_from_stock : (item.balance_from_stock != null ? item.balance_from_stock : 0);
        const hembBal = masterItem ? masterItem.balance_from_hemb : (item.balance_from_hemb != null ? item.balance_from_hemb : 0);
        const totalBal = masterItem ? masterItem.total_balance : (item.total_balance != null ? item.total_balance : 0);
        const remarks2 = item.remarks_2 || item.status_remarks || item.status || "";

        fCut += cutQty;
        fProd += prodQty;
        fStockBal += stockBal;
        fHembBal += hembBal;
        fTotBal += totalBal;
        fCumulative += (prodQty + prevPaid);

        const isClosed = remarks2.toLowerCase().includes("close") || totalBal === 0;
        const isFlagged = Boolean(item.is_flagged);

        return `
          <tr class="${isClosed ? 'row-closed' : ''}">
            <td style="text-align: center; vertical-align: middle; font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">${srNo}</td>
            <td class="${isFlagged ? 'cell-style-flagged' : ''}" style="text-align: center; vertical-align: middle; cursor: pointer;" onclick="runSmartStyleAudit('${escapeHtml(styleCode)}', '${escapeHtml(working)}', true)" title="Click to view full smart audit">
              <strong>${escapeHtml(styleCode)}</strong>
            </td>
            <td style="text-align: center; vertical-align: middle; font-size: 0.775rem;">${escapeHtml(working)}</td>
            <td style="text-align: center; vertical-align: middle; font-weight: 600;">${escapeHtml(contName)}</td>
            <td style="text-align: center; vertical-align: middle; font-family: var(--font-mono);">${rate || '-'}</td>
            <td style="text-align: center; vertical-align: middle; font-family: var(--font-mono); font-weight: 700;">${cutQty.toLocaleString()}</td>
            <td style="text-align: center; vertical-align: middle; font-family: var(--font-mono); font-weight: 800; color: #10b981; font-size: 0.875rem;">${prodQty.toLocaleString()}</td>
            <td style="text-align: center; vertical-align: middle; font-family: var(--font-mono);">${carigarRate > 0 ? carigarRate.toLocaleString() : '-'}</td>
            <td style="text-align: center; vertical-align: middle; font-family: var(--font-mono);">${commission > 0 ? commission.toLocaleString() : '-'}</td>
            <td style="text-align: center; vertical-align: middle; font-family: var(--font-mono); font-weight: 700; color: #10b981;">${rateTotal > 0 ? rateTotal.toLocaleString() : (carigarRate + commission > 0 ? (carigarRate + commission).toLocaleString() : '-')}</td>
            <td class="cell-rate-remarks" style="text-align: center; vertical-align: middle; font-size: 0.72rem; line-height: 1.05; padding: 2px 4px !important;">
              <div class="remarks-text" style="line-height: 1.05; word-break: break-word;">
                ${escapeHtml(remarks1)}
              </div>
              ${item.payment_channel === 'floor_transfer' ? `
                <div style="margin-top: 2px;">
                  <span class="badge-tag inline" style="font-size: 0.65rem; line-height: 1; padding: 1px 4px; background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);">
                    🏢 ${escapeHtml(item.target_floor || 'Other Floor')}${item.floor_challan_no ? ` | Ch #${escapeHtml(item.floor_challan_no)}` : ''}${item.floor_received_by ? ` (${escapeHtml(item.floor_received_by)})` : ''}
                  </span>
                </div>
              ` : ''}
              ${item.payment_channel === 'dorie' ? `
                <div style="margin-top: 2px;">
                  <span class="badge-tag inline" style="font-size: 0.65rem; line-height: 1; padding: 1px 4px; background: rgba(245, 158, 11, 0.12); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);">
                    🧵 DORIE
                  </span>
                </div>
              ` : ''}
            </td>
            <td style="text-align: center; vertical-align: middle;" class="${stockBal > 0 ? 'cell-balance-positive' : 'cell-balance-zero'}">${stockBal}</td>
            <td style="text-align: center; vertical-align: middle;" class="${hembBal > 0 ? 'cell-balance-positive' : 'cell-balance-zero'}">${hembBal}</td>
            <td style="text-align: center; vertical-align: middle;" class="${totalBal > 0 ? 'cell-balance-positive' : 'cell-balance-zero'}">${totalBal}</td>
            <td style="text-align: center; vertical-align: middle; white-space: nowrap;">
              <span class="badge-tag inline" style="font-size: 0.72rem; font-weight: 700; background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);">
                ${escapeHtml(item.period || periodFilter || '-')}
              </span>
            </td>
            <td style="text-align: center; vertical-align: middle; white-space: nowrap; padding: 2px 4px !important;">
              <div style="display: flex; gap: 0.2rem; justify-content: center; align-items: center;">
                <button type="button" class="btn btn-secondary btn-icon" style="width: 22px; height: 22px; min-height: 22px; font-size: 0.72rem; padding: 0;" onclick="runSmartStyleAudit('${escapeHtml(styleCode)}', '${escapeHtml(working)}', true)" title="Smart Audit Check">🔍</button>
                ${canEdit ? `<button type="button" class="btn btn-secondary btn-icon" style="width: 22px; height: 22px; min-height: 22px; font-size: 0.72rem; padding: 0;" onclick="openPaymentEntryModal(${item.id})" title="Edit Entry">✏️</button>` : ""}
                ${canDelete ? `<button type="button" class="btn btn-secondary btn-icon" style="width: 22px; height: 22px; min-height: 22px; font-size: 0.72rem; padding: 0; color: var(--accent-rose);" onclick="deletePaymentEntryAction(${item.id})" title="Delete Entry">🗑️</button>` : ""}
              </div>
            </td>
          </tr>
        `;
      }).join("");

      if (tfootExcel) {
        tfootExcel.innerHTML = `
          <tr>
            <td colspan="6" class="total-label-cell" style="padding: 4px 6px; font-weight: 850; font-size: 0.825rem; text-align: center; vertical-align: middle;">
              Total Pcs Qt:
            </td>
            <td class="total-qty-cell" style="padding: 4px 6px; font-size: 0.925rem; font-weight: 900; color: #10b981; border: 2px solid #000; text-align: center; vertical-align: middle;">
              ${fCumulative.toLocaleString()}
            </td>
            <td style="text-align: center; vertical-align: middle; color: var(--text-muted); font-size: 0.75rem; padding: 3px 4px;">-</td>
            <td style="text-align: center; vertical-align: middle; color: var(--text-muted); font-size: 0.75rem; padding: 3px 4px;">-</td>
            <td style="text-align: center; vertical-align: middle; color: var(--text-muted); font-size: 0.75rem; padding: 3px 4px;">-</td>
            <td style="font-size: 0.72rem; font-weight: 600; color: var(--text-muted); vertical-align: middle; text-align: center; padding: 3px 4px;">
              (Prod: ${fProd.toLocaleString()} pcs)
            </td>
            <td style="text-align: center; vertical-align: middle; font-family: var(--font-mono); font-weight: 800; padding: 3px 4px;">${fStockBal.toLocaleString()}</td>
            <td style="text-align: center; vertical-align: middle; font-family: var(--font-mono); font-weight: 800; padding: 3px 4px;">${fHembBal.toLocaleString()}</td>
            <td style="text-align: center; vertical-align: middle; font-family: var(--font-mono); font-weight: 800; color: ${fTotBal > 0 ? '#f43f5e' : '#10b981'}; padding: 3px 4px;">${fTotBal.toLocaleString()}</td>
            <td style="text-align: center; vertical-align: middle; font-size: 0.72rem; font-weight: 700; color: #38bdf8; padding: 3px 4px;">
              ${query ? '🌐 All Periods' : escapeHtml(periodFilter)}
            </td>
            <td style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-align: center; vertical-align: middle; padding: 3px 4px;">
              ${filtered.length} styles
            </td>
          </tr>
        `;
      }
    }
  }

  // -------------------------------------------------------------
  // RENDER 2: DETAILED CARDS / PHOTO TABLE (TOGGLEABLE VIEW)
  // -------------------------------------------------------------
  if (tbodyDetailed) {
    if (filtered.length === 0) {
      tbodyDetailed.innerHTML = `<tr><td colspan="15" style="text-align: center; vertical-align: middle; padding: 2rem;">No entries found</td></tr>`;
      if (tfootDetailed) tfootDetailed.innerHTML = "";
    } else {
      tbodyDetailed.innerHTML = filtered.map((item, idx) => {
        let thumbHtml = item.image_data 
          ? `<div class="payment-thumb-wrapper" onclick="openImageLightbox('${item.id}')"><img src="${item.image_data}" class="payment-thumb-img"/></div>`
          : `<div class="payment-thumb-placeholder">📷</div>`;

        let channelBadge = item.payment_channel === "dorie"
          ? `<span class="channel-badge dorie">🧵 DORIE</span>`
          : (item.payment_channel === "floor_transfer" 
              ? `<span class="channel-badge floor">🏢 ${escapeHtml(item.target_floor || '28 floor')}</span>`
              : `<span class="channel-badge stock">📦 Stock</span>`);

        const isPending = (item.total_balance || 0) > 0;

        return `
          <tr>
            <td style="text-align: center; vertical-align: middle;">${thumbHtml}</td>
            <td style="text-align: center; vertical-align: middle; font-family: var(--font-mono); font-size: 0.8rem;">${item.sr_no || (idx + 1)}</td>
            <td style="text-align: center; vertical-align: middle;">
              <span class="style-code-badge">${escapeHtml(item.style_code)}</span>
              ${item.ship ? `<span class="badge-tag inline" style="font-size: 0.65rem;">${escapeHtml(item.ship)}</span>` : ""}
            </td>
            <td style="text-align: center; vertical-align: middle;"><span class="badge-tag category">${escapeHtml(item.category || item.working || "SHIRT")}</span></td>
            <td style="text-align: center; vertical-align: middle;"><strong>${escapeHtml(item.contractor_name || "-")}</strong></td>
            <td style="text-align: center; vertical-align: middle;">${channelBadge}</td>
            <td style="text-align: center; vertical-align: middle; font-size: 0.75rem; font-family: var(--font-mono);">${escapeHtml(item.period || '-')}</td>
            <td style="text-align: center; vertical-align: middle; font-family: var(--font-mono);"><strong>${(item.cut_qty || item.total_pcs || 0).toLocaleString()}</strong> pcs</td>
            <td style="text-align: center; vertical-align: middle; font-family: var(--font-mono); color: #38bdf8;">Rs. ${(item.total_amount || 0).toLocaleString()}</td>
            <td style="text-align: center; vertical-align: middle; font-family: var(--font-mono); color: #10b981; font-weight: 700;">${(item.prod_pcs_qty || 0).toLocaleString()} pcs</td>
            <td style="text-align: center; vertical-align: middle; font-family: var(--font-mono); color: ${isPending ? '#f43f5e' : '#10b981'}; font-weight: 700;">${(item.total_balance || 0).toLocaleString()} pcs</td>
            <td style="text-align: center; vertical-align: middle; font-size: 0.75rem;">${escapeHtml(item.remarks_2 || '-')}</td>
            <td style="text-align: center; vertical-align: middle;"><span class="badge-tag ${isPending ? 'warning' : 'success'}">${isPending ? 'Pending' : 'Closed'}</span></td>
            <td style="text-align: center; vertical-align: middle; white-space: nowrap;">
              <span class="badge-tag inline" style="font-size: 0.72rem; font-weight: 700; background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);">
                ${escapeHtml(item.period || '-')}
              </span>
            </td>
            <td style="text-align: center; vertical-align: middle;">
              <div style="display: flex; gap: 0.25rem; justify-content: center; align-items: center;">
                ${canEdit ? `<button class="btn btn-secondary btn-xs btn-icon" onclick="openPaymentEntryModal(${item.id})">✏️</button>` : ""}
                ${canDelete ? `<button class="btn btn-secondary btn-xs btn-icon" onclick="deletePaymentEntryAction(${item.id})" style="color: var(--accent-rose);">🗑️</button>` : ""}
              </div>
            </td>
          </tr>
        `;
      }).join("");
    }
  }
}

// -------------------------------------------------------------
// Payment Modal Helpers & Image Handling
// -------------------------------------------------------------
function togglePaymentFloorFields(channel) {
  const floorBox = document.getElementById("payment-floor-fields-box");
  if (!floorBox) return;
  if (channel === "floor_transfer") {
    floorBox.style.display = "block";
  } else {
    floorBox.style.display = "none";
  }
}

function clearUploadedPaymentImage() {
  const hiddenData = document.getElementById("payment-image-data");
  const fileInput = document.getElementById("payment-file-input");
  const promptBox = document.getElementById("payment-upload-prompt");
  const previewBox = document.getElementById("payment-preview-box");
  const previewImg = document.getElementById("payment-preview-img");
  const filenameEl = document.getElementById("payment-preview-filename");

  if (hiddenData) hiddenData.value = "";
  if (fileInput) fileInput.value = "";
  if (previewImg) previewImg.src = "";
  if (filenameEl) filenameEl.textContent = "Sample Image";
  if (promptBox) promptBox.style.display = "flex";
  if (previewBox) previewBox.style.display = "none";
}

function setPaymentImagePreview(base64Data, filename = "Uploaded Image") {
  const hiddenData = document.getElementById("payment-image-data");
  const promptBox = document.getElementById("payment-upload-prompt");
  const previewBox = document.getElementById("payment-preview-box");
  const previewImg = document.getElementById("payment-preview-img");
  const filenameEl = document.getElementById("payment-preview-filename");

  if (hiddenData) hiddenData.value = base64Data;
  if (previewImg) previewImg.src = base64Data;
  if (filenameEl) filenameEl.textContent = filename;
  if (promptBox) promptBox.style.display = "none";
  if (previewBox) previewBox.style.display = "flex";
}

function initPaymentModalHandlers() {
  // Payment Entry Form Submit
  const formEntry = document.getElementById("form-payment-entry");
  if (formEntry) {
    formEntry.addEventListener("submit", (e) => {
      e.preventDefault();
      savePaymentEntryFromForm();
    });
  }

  // Payment Receipt / Installment Form Submit
  const formReceipt = document.getElementById("form-payment-receipt");
  if (formReceipt) {
    formReceipt.addEventListener("submit", (e) => {
      e.preventDefault();
      savePaymentReceipt();
    });
  }

  // Payment Channel selector change (e.g. floor_transfer vs stock_direct)
  const channelSelect = document.getElementById("payment-channel-select");
  if (channelSelect) {
    channelSelect.addEventListener("change", (e) => {
      togglePaymentFloorFields(e.target.value);
    });
  }

  // Live Style & Category auto-fetch inside Payment Entry modal
  const styleCodeInput = document.getElementById("payment-style-code");
  const categorySelect = document.getElementById("payment-category");
  if (styleCodeInput) {
    styleCodeInput.addEventListener("input", handlePaymentStyleAutoFetch);
    styleCodeInput.addEventListener("change", handlePaymentStyleAutoFetch);
  }
  if (categorySelect) {
    categorySelect.addEventListener("change", handlePaymentStyleAutoFetch);
  }

  // Live Rate Auto-calculation: Total Rate = Carigar Rate + Commission
  const carigarInput = document.getElementById("payment-carigar-rate");
  const commissionInput = document.getElementById("payment-commission");
  const rateTotalInput = document.getElementById("payment-rate-total");
  const poRateInput = document.getElementById("payment-rate-per-pc");

  const recalcRateTotal = () => {
    const cRate = parseFloat(carigarInput?.value) || 0;
    const comm = parseFloat(commissionInput?.value) || 0;
    if (cRate > 0 || comm > 0) {
      const sum = cRate + comm;
      if (rateTotalInput) rateTotalInput.value = sum;
      if (poRateInput && (!poRateInput.value || parseFloat(poRateInput.value) === 0)) {
        poRateInput.value = sum;
      }
    }
  };

  if (carigarInput) carigarInput.addEventListener("input", recalcRateTotal);
  if (commissionInput) commissionInput.addEventListener("input", recalcRateTotal);

  // Live Balance calculation: TOTAL BALANCE = BALANCE FROM STOCK + BALANCE FROM H-EMB
  const balStockInput = document.getElementById("payment-bal-stock");
  const balHembInput = document.getElementById("payment-bal-hemb");
  const totalBalInput = document.getElementById("payment-total-balance");

  const recalcTotalBalance = () => {
    if (!totalBalInput) return;
    const stock = parseInt(balStockInput?.value, 10) || 0;
    const hemb = parseInt(balHembInput?.value, 10) || 0;
    totalBalInput.value = stock + hemb;
  };

  if (balStockInput) balStockInput.addEventListener("input", recalcTotalBalance);
  if (balHembInput) balHembInput.addEventListener("input", recalcTotalBalance);

  // Image Upload Handling
  const fileInput = document.getElementById("payment-file-input");
  const triggerUploadBtn = document.getElementById("btn-trigger-upload");
  const changeImageBtn = document.getElementById("btn-change-image");
  const removeImageBtn = document.getElementById("btn-remove-image");
  const uploadZone = document.getElementById("payment-image-zone");

  if (triggerUploadBtn && fileInput) {
    triggerUploadBtn.addEventListener("click", () => fileInput.click());
  }

  if (changeImageBtn && fileInput) {
    changeImageBtn.addEventListener("click", () => fileInput.click());
  }

  if (removeImageBtn) {
    removeImageBtn.addEventListener("click", () => clearUploadedPaymentImage());
  }

  const handleSelectedFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      showToast("Please select a valid image file.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      setPaymentImagePreview(evt.target.result, file.name);
    };
    reader.readAsDataURL(file);
  };

  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) handleSelectedFile(file);
    });
  }

  if (uploadZone) {
    uploadZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadZone.classList.add("dragover");
    });

    uploadZone.addEventListener("dragleave", () => {
      uploadZone.classList.remove("dragover");
    });

    uploadZone.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadZone.classList.remove("dragover");
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) handleSelectedFile(file);
    });
  }
}

// ====================================================================
// MODAL CONTROLLER: OPEN, AUTO-FETCH & SAVE
// ====================================================================
function openPaymentEntryModal(id = null, prefillData = null) {
  if (id && !window.db.canUserPerformAction("can_edit")) {
    showToast("Permission Denied: You do not have permission to edit records.", "error");
    return;
  }
  if (!id && !window.db.canUserPerformAction("can_create")) {
    showToast("Permission Denied: You do not have permission to create records.", "error");
    return;
  }

  const form = document.getElementById("form-payment-entry");
  if (form) form.reset();

  const idInp = document.getElementById("payment-entry-id");
  const title = document.getElementById("modal-payment-title");
  const alertBox = document.getElementById("payment-form-alert");
  if (alertBox) alertBox.style.display = "none";

  clearUploadedPaymentImage();

  if (id) {
    const item = window.db.getPaymentSheetById(id);
    if (!item) {
      showToast("Record not found.", "error");
      return;
    }
    if (idInp) idInp.value = item.id;
    if (title) title.textContent = `Edit Rate Approval Entry - Style ${item.style_code}`;

    document.getElementById("payment-style-code").value = item.style_code || "";
    document.getElementById("payment-category").value = (item.working || item.category || "SHIRT").toUpperCase();
    document.getElementById("payment-contractor").value = item.contractor_name || "";
    if (document.getElementById("payment-ship")) document.getElementById("payment-ship").value = item.ship || "";
    document.getElementById("payment-sr").value = item.sr_no || "";
    
    const entryPeriod = item.period || "11-SEP-2026 TO 25-SEP-2026";
    const periodInp = document.getElementById("payment-period-input");
    if (periodInp) periodInp.value = entryPeriod;
    const periodBadge = document.getElementById("payment-modal-period-badge");
    if (periodBadge) periodBadge.textContent = entryPeriod;

    const channelSelect = document.getElementById("payment-channel-select");
    if (channelSelect) channelSelect.value = item.payment_channel || "stock_direct";
    togglePaymentFloorFields(item.payment_channel || "stock_direct");

    document.getElementById("payment-target-floor").value = item.target_floor || item.floor_name || "";
    document.getElementById("payment-floor-challan-no").value = item.floor_challan_no || "";
    document.getElementById("payment-floor-received-by").value = item.floor_received_by || "";

    document.getElementById("payment-total-pcs").value = item.cut_qty != null ? item.cut_qty : (item.total_pcs || 0);
    document.getElementById("payment-prod-pcs").value = item.prod_pcs_qty != null ? item.prod_pcs_qty : (item.paid_pcs || 0);
    if (document.getElementById("payment-rate-per-pc")) document.getElementById("payment-rate-per-pc").value = item.rate_per_pc || 0;

    if (document.getElementById("payment-carigar-rate")) document.getElementById("payment-carigar-rate").value = item.carigar_rate != null ? item.carigar_rate : "";
    if (document.getElementById("payment-commission")) document.getElementById("payment-commission").value = item.commission != null ? item.commission : "";
    if (document.getElementById("payment-rate-total")) document.getElementById("payment-rate-total").value = item.rate_total != null ? item.rate_total : (item.rate_per_pc || "");

    document.getElementById("payment-bal-stock").value = item.balance_from_stock != null ? item.balance_from_stock : 0;
    document.getElementById("payment-bal-hemb").value = item.balance_from_hemb != null ? item.balance_from_hemb : 0;
    document.getElementById("payment-total-balance").value = item.total_balance != null ? item.total_balance : 0;

    document.getElementById("payment-remarks-1").value = item.remarks_1 || item.remarks || "";
    if (document.getElementById("payment-remarks-2")) document.getElementById("payment-remarks-2").value = item.remarks_2 || item.status_remarks || "";

    const flagCheck = document.getElementById("payment-is-flagged");
    if (flagCheck) flagCheck.checked = Boolean(item.is_flagged);

    if (item.image_data) {
      setPaymentImagePreview(item.image_data, `${item.style_code}-photo.jpg`);
    }

    handlePaymentStyleAutoFetch();
  } else {
    if (idInp) idInp.value = "";
    if (title) title.textContent = "New Rate Approval Entry";

    // Next SR No & Default Period based on active sheet
    const currentList = window.db.getPaymentSheets();
    const activePeriod = getActiveRateApprovalPeriod();
    const allConfiguredPeriods = (window.db && typeof window.db.getRateApprovalPeriods === "function")
      ? window.db.getRateApprovalPeriods()
      : [];
    const defaultPeriodName = (activePeriod && activePeriod !== "all") 
      ? activePeriod 
      : (allConfiguredPeriods[0]?.period_name || "11-SEP-2026 TO 25-SEP-2026");

    const periodItems = currentList.filter(it => (it.period || "").trim().toLowerCase() === defaultPeriodName.trim().toLowerCase());
    document.getElementById("payment-sr").value = periodItems.length + 1;
    
    const periodInp = document.getElementById("payment-period-input");
    if (periodInp) periodInp.value = defaultPeriodName;
    const periodBadge = document.getElementById("payment-modal-period-badge");
    if (periodBadge) periodBadge.textContent = defaultPeriodName;

    if (document.getElementById("payment-ship")) document.getElementById("payment-ship").value = "";
    if (document.getElementById("payment-carigar-rate")) document.getElementById("payment-carigar-rate").value = "";
    if (document.getElementById("payment-commission")) document.getElementById("payment-commission").value = "";
    if (document.getElementById("payment-rate-total")) document.getElementById("payment-rate-total").value = "";
    if (document.getElementById("payment-rate-per-pc")) document.getElementById("payment-rate-per-pc").value = "0";
    if (document.getElementById("payment-remarks-2")) document.getElementById("payment-remarks-2").value = "";

    if (prefillData) {
      if (prefillData.style_code) document.getElementById("payment-style-code").value = prefillData.style_code;
      if (prefillData.category) document.getElementById("payment-category").value = prefillData.category.toUpperCase();
      if (prefillData.contractor_name) document.getElementById("payment-contractor").value = prefillData.contractor_name;
      if (prefillData.total_pcs) document.getElementById("payment-total-pcs").value = prefillData.total_pcs;
      if (prefillData.prod_pcs != null) document.getElementById("payment-prod-pcs").value = prefillData.prod_pcs;
    }

    togglePaymentFloorFields("stock_direct");
    handlePaymentStyleAutoFetch();
  }

  openModal("modal-payment-entry");
}

function handlePaymentStyleAutoFetch() {
  const styleCode = (document.getElementById("payment-style-code")?.value || "").trim();
  const category = (document.getElementById("payment-category")?.value || "SHIRT").trim();
  const feedbackBox = document.getElementById("modal-audit-feedback");
  const hintEl = document.getElementById("payment-style-hint");

  if (!styleCode) {
    if (feedbackBox) feedbackBox.style.display = "none";
    if (hintEl) hintEl.style.display = "none";
    return;
  }

  const audit = window.db.auditStylePaymentHistory(styleCode, category);
  if (!audit) {
    if (feedbackBox) feedbackBox.style.display = "none";
    return;
  }

  // Look up contractor & rate from Work Distribution or Style History
  const distAssigned = (window.db && typeof window.db.getContractorForStyle === "function") 
    ? window.db.getContractorForStyle(styleCode, category) 
    : null;
  const assignedCont = (distAssigned && distAssigned.contractor_name) || (audit && audit.contractor_name) || "";

  // Pre-fill contractor if empty
  const contInp = document.getElementById("payment-contractor");
  if (contInp && !contInp.value && assignedCont) {
    contInp.value = assignedCont;
  }

  // Pre-fill rate if empty
  const rateInp = document.getElementById("payment-rate-per-pc");
  if (rateInp && (!rateInp.value || parseFloat(rateInp.value) === 0) && distAssigned && distAssigned.rate > 0) {
    rateInp.value = distAssigned.rate;
  }

  // Pre-fill cut qty if empty
  const cutInp = document.getElementById("payment-total-pcs");
  if (cutInp && (!cutInp.value || parseInt(cutInp.value, 10) === 0) && audit.cut_qty > 0) {
    cutInp.value = audit.cut_qty;
  }

  // Pre-fill suggested prod pcs to remaining balance if empty
  const prodInp = document.getElementById("payment-prod-pcs");
  if (prodInp && (!prodInp.value || parseInt(prodInp.value, 10) === 0)) {
    prodInp.value = audit.remaining_balance_pcs > 0 ? audit.remaining_balance_pcs : audit.cut_qty;
  }

  // Auto-fetch balances directly from Master Inventory into the entry inputs!
  const balStockInp = document.getElementById("payment-bal-stock");
  if (balStockInp) {
    balStockInp.value = audit.balance_from_stock != null ? audit.balance_from_stock : 0;
  }

  const balHembInp = document.getElementById("payment-bal-hemb");
  if (balHembInp) {
    balHembInp.value = audit.balance_from_hemb != null ? audit.balance_from_hemb : 0;
  }

  const totalBalInp = document.getElementById("payment-total-balance");
  if (totalBalInp) {
    totalBalInp.value = audit.total_balance != null ? audit.total_balance : ((audit.balance_from_stock || 0) + (audit.balance_from_hemb || 0));
  }

  // Show live feedback card inside modal
  if (feedbackBox) {
    feedbackBox.style.display = "block";
    feedbackBox.innerHTML = `
      <div style="font-weight: 800; font-size: 0.85rem; color: #38bdf8; margin-bottom: 0.35rem; display: flex; align-items: center; justify-content: space-between;">
        <span>🔍 Live Style Audit: ${escapeHtml(audit.style_code)} (${escapeHtml(audit.category)})</span>
        <span class="badge-tag ${audit.is_fully_paid ? 'success' : 'warning'}" style="font-size: 0.7rem;">
          ${audit.is_fully_paid ? '✓ Fully Cleared' : `⏳ ${audit.remaining_balance_pcs.toLocaleString()} pcs Pending`}
        </span>
      </div>
      <div style="display: flex; gap: 0.85rem; flex-wrap: wrap; font-size: 0.8rem; margin-bottom: 0.4rem;">
        <span>Cut Qty: <strong>${audit.cut_qty.toLocaleString()}</strong></span>
        <span>Stock Bal: <strong style="color: #f59e0b;">${(audit.balance_from_stock || 0).toLocaleString()}</strong></span>
        <span>H-Emb Bal: <strong style="color: #38bdf8;">${(audit.balance_from_hemb || 0).toLocaleString()}</strong></span>
        <span>Total Bal: <strong style="color: #f43f5e;">${(audit.total_balance || 0).toLocaleString()}</strong></span>
        <span>Already Paid: <strong style="color: #10b981;">${audit.total_paid_pcs.toLocaleString()}</strong></span>
      </div>
      <div style="font-size: 0.725rem; color: #10b981; font-weight: 600; margin-top: 0.2rem;">
        ⚡ Balances auto-fetched from Master Inventory (Stock: ${audit.balance_from_stock || 0}, H-Emb: ${audit.balance_from_hemb || 0}, Total: ${audit.total_balance || 0})
      </div>
      ${audit.is_dorie ? `<div style="color: #fda4af; font-size: 0.75rem; font-weight: 700; margin-top: 0.25rem;">⚠️ DORIE ALERT: Payment for this style was previously claimed on DORIE!</div>` : ""}
      ${audit.is_floor_transfer ? `<div style="color: #7dd3fc; font-size: 0.75rem; font-weight: 700; margin-top: 0.25rem;">🏢 FLOOR ALERT: Goods for this style were transferred to another floor!</div>` : ""}
    `;
  }
}

function appendModalRemark1(text) {
  const inp = document.getElementById("payment-remarks-1");
  if (!inp) return;
  if (!inp.value.trim()) {
    inp.value = text;
  } else {
    inp.value = `${inp.value} / ${text}`;
  }
}

async function savePaymentEntryFromForm() {
  const id = document.getElementById("payment-entry-id")?.value;
  const styleCode = (document.getElementById("payment-style-code")?.value || "").trim().toUpperCase();
  const category = (document.getElementById("payment-category")?.value || "SHIRT").trim().toUpperCase();
  const contractor = (document.getElementById("payment-contractor")?.value || "").trim();
  const period = (document.getElementById("payment-period-input")?.value || "11-SEP-2026 TO 25-SEP-2026").trim();
  const ship = (document.getElementById("payment-ship")?.value || "").trim();
  const srNo = parseInt(document.getElementById("payment-sr")?.value, 10) || 0;

  const paymentChannel = document.getElementById("payment-channel-select")?.value || "stock_direct";
  const targetFloor = (document.getElementById("payment-target-floor")?.value || "").trim();
  const floorChallanNo = (document.getElementById("payment-floor-challan-no")?.value || "").trim();
  const floorReceivedBy = (document.getElementById("payment-floor-received-by")?.value || "").trim();

  const cutQty = parseInt(document.getElementById("payment-total-pcs")?.value, 10) || 0;
  const prodPcs = parseInt(document.getElementById("payment-prod-pcs")?.value, 10) || 0;
  const ratePerPc = parseFloat(document.getElementById("payment-rate-per-pc")?.value) || 0;

  const carigarRate = parseFloat(document.getElementById("payment-carigar-rate")?.value) || 0;
  const commission = parseFloat(document.getElementById("payment-commission")?.value) || 0;
  let rateTotal = parseFloat(document.getElementById("payment-rate-total")?.value);
  if (isNaN(rateTotal) || rateTotal === 0) {
    rateTotal = (carigarRate + commission) > 0 ? (carigarRate + commission) : ratePerPc;
  }
  let finalRatePerPc = ratePerPc > 0 ? ratePerPc : rateTotal;

  const balStock = parseInt(document.getElementById("payment-bal-stock")?.value, 10) || 0;
  const balHemb = parseInt(document.getElementById("payment-bal-hemb")?.value, 10) || 0;
  let totalBal = parseInt(document.getElementById("payment-total-balance")?.value, 10);
  if (isNaN(totalBal)) {
    totalBal = balStock + balHemb;
  }

  const remarks1 = (document.getElementById("payment-remarks-1")?.value || "").trim();
  const remarks2 = (document.getElementById("payment-remarks-2")?.value || "").trim();
  const isFlagged = document.getElementById("payment-is-flagged")?.checked || false;
  const imageData = document.getElementById("payment-image-data")?.value || "";

  if (!styleCode) {
    showPaymentFormError("Style Code is required.");
    document.getElementById("payment-style-code")?.focus();
    return;
  }
  if (!contractor) {
    showPaymentFormError("Contractor Name is required.");
    document.getElementById("payment-contractor")?.focus();
    return;
  }
  if (!window.db.isValidContractorName(contractor)) {
    const regList = window.db.getRegisteredContractorNames().join(", ");
    showPaymentFormError(`Contractor "${contractor}" is not registered! Only saved contractors (${regList}) are accepted.`);
    document.getElementById("payment-contractor")?.focus();
    return;
  }

  const saveBtn = document.getElementById("btn-save-payment-entry");
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";
  }

  try {
    const entryData = {
      sr_no: srNo,
      period: period,
      style_code: styleCode,
      working: category,
      category: category,
      ship: ship,
      contractor_name: contractor,
      cut_qty: cutQty,
      total_pcs: cutQty,
      prod_pcs_qty: prodPcs,
      carigar_rate: carigarRate,
      commission: commission,
      rate_total: rateTotal,
      rate_per_pc: finalRatePerPc,
      balance_from_stock: balStock,
      balance_from_hemb: balHemb,
      total_balance: totalBal,
      remarks_1: remarks1,
      remarks_2: remarks2,
      remarks: remarks1,
      payment_channel: paymentChannel,
      target_floor: targetFloor,
      floor_challan_no: floorChallanNo,
      floor_received_by: floorReceivedBy,
      is_flagged: isFlagged,
      image_data: imageData
    };

    if (id) {
      await window.db.updatePaymentSheet(parseInt(id, 10), entryData);
      showToast(`✓ Rate approval entry for "${styleCode}" updated successfully!`);
    } else {
      await window.db.addPaymentSheet(entryData);
      showToast(`✓ New Rate approval entry for "${styleCode}" recorded successfully!`);
    }

    closeModal("modal-payment-entry");

    // Automatically align the view period to the entry's period so user sees it right away
    if (period) {
      const pSel = document.getElementById("select-rate-approval-period");
      const pInp = document.getElementById("input-rate-approval-period");
      if (pSel) pSel.value = period;
      if (pInp) pInp.value = period;
    }

    populateRateApprovalPeriods();
    populatePaymentContractorFilter();
    populateAuditStylesDatalist();
    renderPaymentSheet();
    renderKPIs();
    renderNavigation();
  } catch (err) {
    showPaymentFormError(`Error saving entry: ${err.message}`);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "✓ Save Rate Approval Entry";
    }
  }
}

function showPaymentFormError(msg) {
  const alertBox = document.getElementById("modal-payment-alert");
  if (alertBox) {
    alertBox.style.display = "block";
    alertBox.style.background = "rgba(244, 63, 94, 0.15)";
    alertBox.style.color = "#fda4af";
    alertBox.style.border = "1px solid rgba(244, 63, 94, 0.35)";
    alertBox.textContent = msg;
  }
}

async function deletePaymentEntryAction(id) {
  if (!window.db.canUserPerformAction("can_delete")) {
    showToast("Permission Denied: You do not have permission to delete records.", "error");
    return;
  }
  const item = window.db.getPaymentSheetById(id);
  if (!item) return;

  if (confirm(`Are you sure you want to delete Rate Approval entry for Style "${item.style_code}"?`)) {
    try {
      window.lastUserActionTime = Date.now();
      await window.db.deletePaymentSheet(id);
      renderPaymentSheet();
      renderKPIs();
      renderNavigation();
      showToast(`✓ Entry for Style "${item.style_code}" deleted.`);
    } catch (err) {
      showToast(err.message, "error");
    }
  }
}

function openPaymentReceiptModal(paymentId) {
  if (!window.db.canUserPerformAction("can_edit")) {
    showToast("Permission Denied: You do not have permission to record payments.", "error");
    return;
  }
  const item = window.db.getPaymentSheetById(paymentId);
  if (!item) {
    showToast("Payment record not found.", "error");
    return;
  }

  const form = document.getElementById("form-payment-receipt");
  if (form) form.reset();

  document.getElementById("receipt-payment-id").value = item.id;
  document.getElementById("receipt-summary-style").textContent = item.style_code;
  document.getElementById("receipt-summary-cat").textContent = item.category;
  document.getElementById("receipt-summary-contractor").textContent = item.contractor_name || "Contractor";
  document.getElementById("receipt-summary-total").textContent = `Rs. ${item.total_amount.toLocaleString()}`;
  document.getElementById("receipt-summary-paid").textContent = `Rs. ${item.paid_amount.toLocaleString()}`;
  document.getElementById("receipt-summary-due").textContent = `Rs. ${item.balance_amount.toLocaleString()}`;

  // Default installment amount & pieces = entire remaining balance
  document.getElementById("receipt-amount").value = item.balance_amount > 0 ? item.balance_amount : "";
  document.getElementById("receipt-pcs").value = item.balance_pcs > 0 ? item.balance_pcs : "";
  document.getElementById("receipt-date").value = new Date().toISOString().split("T")[0];

  openModal("modal-payment-receipt");
}

async function savePaymentReceipt() {
  const paymentId = document.getElementById("receipt-payment-id")?.value;
  const amount = parseFloat(document.getElementById("receipt-amount")?.value) || 0;
  const pcs = parseInt(document.getElementById("receipt-pcs")?.value, 10) || 0;
  const date = document.getElementById("receipt-date")?.value;
  const mode = document.getElementById("receipt-mode")?.value || "Cash";
  const receiptNo = (document.getElementById("receipt-no")?.value || "").trim();
  const notes = (document.getElementById("receipt-notes")?.value || "").trim();

  if (!paymentId) return;
  if (amount <= 0) {
    showToast("Received Amount must be greater than 0.", "error");
    return;
  }
  if (!date) {
    showToast("Payment date is required.", "error");
    return;
  }

  const saveBtn = document.getElementById("btn-save-receipt");
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "Recording...";
  }

  try {
    const updated = await window.db.recordPaymentReceipt(paymentId, {
      amount,
      pcs,
      date,
      mode,
      receipt_no: receiptNo,
      notes
    });

    closeModal("modal-payment-receipt");
    renderPaymentSheet();
    renderKPIs();
    showToast(`✓ Received Rs. ${amount.toLocaleString()} for Style "${updated.style_code}" recorded!`);
  } catch (err) {
    showToast(`Error: ${err.message}`, "error");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "✓ Add Payment Receipt";
    }
  }
}

function openImageLightbox(id) {
  const item = window.db.getPaymentSheetById(id);
  if (!item || !item.image_data) {
    showToast("No image attached to this payment record.", "info");
    return;
  }

  const imgEl = document.getElementById("lightbox-full-img");
  if (imgEl) imgEl.src = item.image_data;

  const styleBadge = document.getElementById("lightbox-style-badge");
  if (styleBadge) styleBadge.textContent = item.style_code;

  const catText = document.getElementById("lightbox-category-text");
  if (catText) catText.textContent = `${item.category} | Contractor: ${item.contractor_name || '-'}`;

  const channelBadge = document.getElementById("lightbox-channel-badge");
  if (channelBadge) {
    if (item.payment_channel === "dorie") {
      channelBadge.innerHTML = `<span class="channel-badge dorie" style="font-size: 0.7rem;">🧵 Dorie Claim</span>`;
    } else if (item.payment_channel === "floor_transfer") {
      channelBadge.innerHTML = `<span class="channel-badge floor" style="font-size: 0.7rem;">🏢 Floor: ${escapeHtml(item.floor_name || 'Other')} (Ch #${escapeHtml(item.floor_challan_no || '-')})</span>`;
    } else {
      channelBadge.innerHTML = `<span class="channel-badge stock" style="font-size: 0.7rem;">📦 Direct Stock</span>`;
    }
  }

  const detailsBar = document.getElementById("lightbox-details-bar");
  if (detailsBar) {
    detailsBar.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Total Order & Rate:</div>
          <div style="font-weight: 800; font-family: var(--font-mono); color: #38bdf8;">
            ${item.total_pcs.toLocaleString()} pcs @ Rs. ${item.rate_per_pc} = Rs. ${item.total_amount.toLocaleString()}
          </div>
        </div>
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Paid Amount:</div>
          <div style="font-weight: 800; font-family: var(--font-mono); color: #10b981;">
            Rs. ${item.paid_amount.toLocaleString()} (${item.paid_pcs.toLocaleString()} pcs)
          </div>
        </div>
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Remaining Balance:</div>
          <div style="font-weight: 800; font-family: var(--font-mono); color: ${item.balance_amount > 0 ? '#f43f5e' : '#10b981'};">
            Rs. ${item.balance_amount.toLocaleString()} (${item.balance_pcs.toLocaleString()} pcs)
          </div>
        </div>
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Cutoff Deduction:</div>
          <div style="font-weight: 800; font-family: var(--font-mono); color: #fda4af;">
            ${item.deducted_pcs > 0 ? `${item.deducted_pcs.toLocaleString()} pcs (Rs. ${item.deduction_loss_amount.toLocaleString()})` : "0 (Full)"}
          </div>
        </div>
      </div>
    `;
  }

  openModal("modal-image-preview");
}

function printPaymentSheet() {
  openPrintStudio("payment");
}

function exportPaymentSheetToCSV() {
  const list = window.db.getPaymentSheets();
  if (list.length === 0) {
    showToast("No payment sheet records to export", "info");
    return;
  }

  const headers = [
    "SR", "STYLE CODE", "CATEGORY", "SHIP", "CONTRACTOR",
    "CUT QTY", "PROD PCS QTY", "CARIGAR RATE", "COMMISSION", "TOTAL RATE", "RATE PER PC",
    "BALANCE FROM STOCK", "BALANCE FROM H-EMB", "TOTAL BALANCE", "TIME PERIOD",
    "PAYMENT CHANNEL", "FLOOR NAME", "FLOOR CHALLAN NO", "FLOOR RECEIVED BY",
    "CUTOFF DATE", "SUBMISSION DATE", "TOTAL AMOUNT", "DELIVERED IN TIME PCS", "DEDUCTED PCS",
    "DEDUCTION LOSS AMOUNT", "PAID PCS", "PAID AMOUNT",
    "BALANCE PCS", "BALANCE AMOUNT", "STATUS", "REMARKS"
  ];

  const rows = list.map((item, idx) => [
    item.sr_no || (idx + 1),
    `"${item.style_code}"`,
    `"${item.category || ''}"`,
    `"${item.ship || ''}"`,
    `"${item.contractor_name || ''}"`,
    item.total_pcs || 0,
    item.prod_pcs_qty != null ? item.prod_pcs_qty : (item.paid_pcs || 0),
    item.carigar_rate || 0,
    item.commission || 0,
    item.rate_total || 0,
    item.rate_per_pc || 0,
    item.balance_from_stock || 0,
    item.balance_from_hemb || 0,
    item.total_balance || 0,
    `"${item.period || ''}"`,
    `"${item.payment_channel || ''}"`,
    `"${item.floor_name || ''}"`,
    `"${item.floor_challan_no || ''}"`,
    `"${item.floor_received_by || ''}"`,
    `"${item.cutoff_date || ''}"`,
    `"${item.submission_date || ''}"`,
    item.total_amount || 0,
    item.delivered_in_time_pcs || 0,
    item.deducted_pcs || 0,
    item.deduction_loss_amount || 0,
    item.paid_pcs || 0,
    item.paid_amount || 0,
    item.balance_pcs || 0,
    item.balance_amount || 0,
    `"${item.status || ''}"`,
    `"${(item.remarks || '').replace(/"/g, '""')}"`
  ]);

  downloadCSV(`Payment_Sheet_Report_${new Date().toISOString().split("T")[0]}.csv`, [headers, ...rows]);
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return "-";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const mIdx = parseInt(month, 10) - 1;
      if (mIdx >= 0 && mIdx < 12) {
        return `${day}-${monthNames[mIdx]}-${year}`;
      }
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
}

// ====================================================================
// WORK DISTRIBUTION MODULE (Exact to User's Bi-Monthly Cycle Sheet)
// 6 Base Contractors: IMTIAZ, ASIM, ASIF, NAVEED, TOUSEEF, SHOAIB & Joint
// Auto-links contractor across Master Inventory, Receiving, Dispatch, Daily & Payment
// ====================================================================

let activeDistContractorFilter = "";

function initWorkDistributionView() {
  // 1. Period dropdown change
  const periodSelect = document.getElementById("select-distribution-period");
  if (periodSelect) {
    periodSelect.addEventListener("change", () => {
      renderWorkDistribution();
    });
  }

  // 2. Type Period Toggle button (Switch between dropdown and custom typed period)
  const togglePeriodBtn = document.getElementById("btn-toggle-dist-period-input");
  if (togglePeriodBtn) {
    togglePeriodBtn.addEventListener("click", () => {
      const sel = document.getElementById("select-distribution-period");
      const inp = document.getElementById("input-distribution-period");
      if (inp.style.display === "none") {
        inp.style.display = "inline-block";
        sel.style.display = "none";
        inp.value = sel.value === "all" ? "" : sel.value;
        togglePeriodBtn.textContent = "📋 Dropdown";
        inp.focus();
      } else {
        inp.style.display = "none";
        sel.style.display = "inline-block";
        togglePeriodBtn.textContent = "✏️ Type Period";
        if (inp.value.trim()) {
          sel.value = inp.value.trim();
        }
      }
      renderWorkDistribution();
    });
  }

  const debouncedRenderWorkDist = debounce(() => renderWorkDistribution(), 120);

  const periodInput = document.getElementById("input-distribution-period");
  if (periodInput) {
    periodInput.addEventListener("input", debouncedRenderWorkDist);
    periodInput.addEventListener("change", () => renderWorkDistribution());
  }

  // 3. New distribution entry button
  const newEntryBtn = document.getElementById("btn-open-dist-entry-modal");
  if (newEntryBtn) {
    newEntryBtn.addEventListener("click", () => {
      openDistributionEntryModal(null);
    });
  }

  // 4. Sheet Setup button (Manage bi-monthly distribution periods)
  const setupToolbarBtn = document.getElementById("btn-open-dist-setup-toolbar");
  if (setupToolbarBtn) {
    setupToolbarBtn.addEventListener("click", () => {
      openDistPeriodSetupModal(false);
    });
  }

  // 5. Print & Export buttons
  const printBtn = document.getElementById("btn-print-dist-sheet");
  if (printBtn) {
    printBtn.addEventListener("click", printDistributionSheet);
  }

  const exportBtn = document.getElementById("btn-export-dist-csv");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportDistributionCsv);
  }

  // 5. Search and filter listeners
  const searchInput = document.getElementById("search-dist-input");
  if (searchInput) {
    searchInput.addEventListener("input", debouncedRenderWorkDist);
  }

  const contFilter = document.getElementById("filter-dist-contractor");
  if (contFilter) {
    contFilter.addEventListener("change", () => {
      activeDistContractorFilter = contFilter.value;
      renderWorkDistribution();
    });
  }

  const floorFilter = document.getElementById("filter-dist-floor");
  if (floorFilter) {
    floorFilter.addEventListener("change", () => renderWorkDistribution());
  }

  const itemFilter = document.getElementById("filter-dist-item");
  if (itemFilter) {
    itemFilter.addEventListener("change", () => renderWorkDistribution());
  }

  const clearFiltersBtn = document.getElementById("btn-clear-dist-filters");
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (contFilter) contFilter.value = "";
      if (floorFilter) floorFilter.value = "";
      if (itemFilter) itemFilter.value = "";
      activeDistContractorFilter = "";
      renderWorkDistribution();
      showToast("Distribution filters reset", "info");
    });
  }

  // 6. Distribution Entry Form calculations & listeners
  const pcsInput = document.getElementById("dist-entry-pcs-qty");
  const rateInput = document.getElementById("dist-entry-rate");
  if (pcsInput) pcsInput.addEventListener("input", calculateDistEntryTotal);
  if (rateInput) rateInput.addEventListener("input", calculateDistEntryTotal);

  const styleInput = document.getElementById("dist-entry-style-code");
  if (styleInput) {
    styleInput.addEventListener("input", handleDistStyleAutoFetch);
    styleInput.addEventListener("change", handleDistStyleAutoFetch);
  }

  const distEntryForm = document.getElementById("form-distribution-entry");
  if (distEntryForm) {
    distEntryForm.addEventListener("submit", saveDistributionEntryAction);
  }

  // 7. Period Setup Form listeners
  const distPeriodForm = document.getElementById("form-dist-period-setup");
  if (distPeriodForm) {
    distPeriodForm.addEventListener("submit", saveDistPeriodAction);
  }

  const startDateInp = document.getElementById("dist-setup-start-date");
  const endDateInp = document.getElementById("dist-setup-end-date");
  const nameInp = document.getElementById("dist-setup-name");

  function autoGeneratePeriodName() {
    if (startDateInp && endDateInp && startDateInp.value && endDateInp.value && nameInp) {
      const sFmt = formatDateDisplay(startDateInp.value);
      const eFmt = formatDateDisplay(endDateInp.value);
      nameInp.value = `${sFmt} TO ${eFmt}`;
    }
  }

  if (startDateInp) startDateInp.addEventListener("change", autoGeneratePeriodName);
  if (endDateInp) endDateInp.addEventListener("change", autoGeneratePeriodName);
}

function getActiveDistributionPeriod() {
  const periodInput = document.getElementById("input-distribution-period");
  if (periodInput && periodInput.style.display !== "none" && periodInput.value.trim()) {
    return periodInput.value.trim();
  }
  const select = document.getElementById("select-distribution-period");
  if (select && select.value) return select.value.trim();
  const periods = (window.db && typeof window.db.getDistributionPeriods === "function")
    ? window.db.getDistributionPeriods()
    : [];
  return periods.length > 0 ? periods[0].period_name : "26-Sep-2026 TO 10-Oct-2026";
}

function populateDistributionPeriods() {
  const select = document.getElementById("select-distribution-period");
  const entryPeriodSelect = document.getElementById("dist-entry-period");
  const dataList = document.getElementById("datalist-distribution-periods");
  if (!select) return;

  const periods = (window.db && typeof window.db.getDistributionPeriods === "function")
    ? window.db.getDistributionPeriods()
    : [];

  const currentVal = select.value;

  select.innerHTML = periods.map(p => {
    return `<option value="${escapeHtml(p.period_name)}">${escapeHtml(p.period_name)}</option>`;
  }).join("");

  if (dataList) {
    dataList.innerHTML = periods.map(p => `<option value="${escapeHtml(p.period_name)}">`).join("");
  }

  if (entryPeriodSelect) {
    entryPeriodSelect.innerHTML = periods.map(p => {
      return `<option value="${escapeHtml(p.period_name)}">${escapeHtml(p.period_name)}</option>`;
    }).join("");
  }

  if (currentVal && periods.some(p => p.period_name === currentVal)) {
    select.value = currentVal;
    if (entryPeriodSelect) entryPeriodSelect.value = currentVal;
  } else if (periods.length > 0) {
    select.value = periods[0].period_name;
    if (entryPeriodSelect) entryPeriodSelect.value = periods[0].period_name;
  }
}

function calculateDistEntryTotal() {
  const pcs = parseInt(document.getElementById("dist-entry-pcs-qty")?.value, 10) || 0;
  const rate = parseFloat(document.getElementById("dist-entry-rate")?.value) || 0;
  const total = pcs * rate;

  const totalInput = document.getElementById("dist-entry-total");
  if (totalInput) {
    totalInput.value = total > 0 ? `Rs. ${total.toLocaleString()}` : "Rs. 0";
  }
}

function handleDistStyleAutoFetch() {
  const styleCode = (document.getElementById("dist-entry-style-code")?.value || "").trim().toUpperCase();
  if (!styleCode) return;

  const itemInput = document.getElementById("dist-entry-item");
  const contInput = document.getElementById("dist-entry-contractor");
  const rateInput = document.getElementById("dist-entry-rate");
  const floorInput = document.getElementById("dist-entry-floor");

  // 1. Check existing work distribution entries
  const existingDist = (window.db && typeof window.db.getWorkDistribution === "function")
    ? window.db.getWorkDistribution()
    : [];
  const foundDist = existingDist.find(e => (e.style_code || "").trim().toUpperCase() === styleCode);

  if (foundDist) {
    if (contInput && !contInput.value && foundDist.contractor_name) contInput.value = foundDist.contractor_name;
    if (rateInput && (!rateInput.value || parseFloat(rateInput.value) === 0) && foundDist.rate) rateInput.value = foundDist.rate;
    if (itemInput && foundDist.item) itemInput.value = foundDist.item;
    if (floorInput && !floorInput.value && foundDist.floor) floorInput.value = foundDist.floor;
    calculateDistEntryTotal();
    return;
  }

  // 2. Check Master Inventory
  const master = (window.db && typeof window.db.getMasterInventory === "function")
    ? window.db.getMasterInventory()
    : [];
  const foundMaster = master.find(m => (m.style_code || "").trim().toUpperCase() === styleCode);

  if (foundMaster) {
    if (contInput && !contInput.value && foundMaster.contractor_name && foundMaster.contractor_name !== "Unassigned") {
      contInput.value = foundMaster.contractor_name;
    }
    if (itemInput && foundMaster.category) {
      itemInput.value = foundMaster.category.toUpperCase();
    }
  }

  calculateDistEntryTotal();
}

function renderWorkDistribution() {
  const tbody = document.getElementById("work-distribution-tbody");
  const tfoot = document.getElementById("work-distribution-tfoot");
  if (!tbody) return;

  const canEdit = window.db.canUserPerformAction("can_edit");
  const canDelete = window.db.canUserPerformAction("can_delete");
  const canCreate = window.db.canUserPerformAction("can_create");

  const activePeriod = getActiveDistributionPeriod();
  const allEntries = (window.db && typeof window.db.getWorkDistribution === "function")
    ? window.db.getWorkDistribution()
    : [];

  // Filter entries for the selected bi-monthly distribution period
  const periodEntries = (activePeriod && activePeriod !== "all")
    ? allEntries.filter(e => (e.period || "").trim().toLowerCase() === activePeriod.trim().toLowerCase())
    : allEntries;

  // 1. Compute KPIs for the active period
  let periodPcs = 0;
  let periodAmount = 0;
  const distinctStylesSet = new Set();

  periodEntries.forEach(e => {
    const qty = parseInt(e.pcs_qty, 10) || 0;
    const rate = parseFloat(e.rate) || 0;
    const tot = (e.total_amount != null && !isNaN(Number(e.total_amount))) ? Number(e.total_amount) : (qty * rate);

    periodPcs += qty;
    periodAmount += tot;
    if (e.style_code) distinctStylesSet.add(e.style_code.trim().toUpperCase());
  });

  const avgRate = periodPcs > 0 ? Math.round(periodAmount / periodPcs) : 0;

  // Update Top KPI Cards
  const elTotalPcs = document.getElementById("kpi-dist-total-pcs");
  if (elTotalPcs) elTotalPcs.textContent = periodPcs.toLocaleString();

  const elTotalAmount = document.getElementById("kpi-dist-total-amount");
  if (elTotalAmount) elTotalAmount.textContent = `Rs. ${Math.round(periodAmount).toLocaleString()}`;

  const elTotalStyles = document.getElementById("kpi-dist-total-styles");
  if (elTotalStyles) elTotalStyles.textContent = distinctStylesSet.size.toLocaleString();

  const elAvgRate = document.getElementById("kpi-dist-avg-rate");
  if (elAvgRate) elAvgRate.textContent = `Rs. ${avgRate.toLocaleString()}`;

  // Update Nav Badge (Desktop & Mobile Drawer)
  const distBadge = document.getElementById("badge-dist-count");
  if (distBadge) distBadge.textContent = allEntries.length.toString();
  const distBadgeMob = document.getElementById("badge-dist-count-mobile");
  if (distBadgeMob) distBadgeMob.textContent = allEntries.length.toString();

  // 2. Render 6 Base Contractors Breakdown Bar
  renderDistributionContractorChips(periodEntries);

  // 3. Apply Search & Table Filters
  const query = (document.getElementById("search-dist-input")?.value || "").toLowerCase().trim();
  const contFilterVal = (document.getElementById("filter-dist-contractor")?.value || activeDistContractorFilter || "").toLowerCase().trim();
  const floorFilterVal = (document.getElementById("filter-dist-floor")?.value || "").toLowerCase().trim();
  const itemFilterVal = (document.getElementById("filter-dist-item")?.value || "").toLowerCase().trim();

  // If query is present, search across ALL entries across all time periods!
  // If query is empty, filter within periodEntries (the active selected period).
  const sourceEntries = query ? allEntries : periodEntries;

  const filtered = sourceEntries.filter(item => {
    // Search query (checks style_code, contractor, item, floor, period, remarks)
    const qMatch = !query ||
      (item.style_code || "").toLowerCase().includes(query) ||
      (item.contractor_name || "").toLowerCase().includes(query) ||
      (item.item || "").toLowerCase().includes(query) ||
      (item.floor || "").toLowerCase().includes(query) ||
      (item.period || "").toLowerCase().includes(query) ||
      (item.remarks || "").toLowerCase().includes(query);

    // Contractor filter
    let cMatch = true;
    if (contFilterVal) {
      if (contFilterVal === "joint") {
        cMatch = (item.contractor_name || "").includes("/");
      } else {
        cMatch = (item.contractor_name || "").toLowerCase().includes(contFilterVal);
      }
    }

    // Floor filter
    const fMatch = !floorFilterVal || (item.floor || "").toLowerCase() === floorFilterVal;

    // Item filter
    const iMatch = !itemFilterVal || (item.item || "").toLowerCase() === itemFilterVal;

    return qMatch && cMatch && fMatch && iMatch;
  });

  // 4. Render Table Rows
  if (filtered.length === 0) {
    const isSearchActive = !!query;
    const isFiltered = !!(query || contFilterVal || floorFilterVal || itemFilterVal);
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; vertical-align: middle; padding: 3rem 1.5rem; color: var(--text-muted);">
          <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">📦</div>
          <div style="font-weight: 700; font-size: 1.05rem; margin-bottom: 0.35rem; color: var(--text-main);">
            ${isSearchActive ? `No distribution records match "${escapeHtml(query)}" across all time periods.` : (isFiltered ? "No styles match your filter criteria" : `Distribution sheet for "${escapeHtml(activePeriod)}" is empty.`)}
          </div>
          <p style="font-size: 0.85rem; margin-bottom: 1rem; color: var(--text-muted); max-width: 480px; margin-left: auto; margin-right: auto;">
            ${isSearchActive ? "Try clearing or changing your search style code or filters above." : (isFiltered ? "Try resetting your search query or filters above." : "Distribute styles to contractors for this bi-monthly cycle. Styles added here auto-link to Master Inventory, Receiving, Dispatch, Daily & Payment sheets!")}
          </p>
          <div style="display: flex; gap: 0.6rem; justify-content: center; align-items: center; flex-wrap: wrap;">
            ${isSearchActive ? `
              <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('search-dist-input').value=''; renderWorkDistribution();">
                ✕ Clear Search
              </button>
            ` : (!isFiltered && canCreate ? `
              <button type="button" class="btn btn-primary btn-sm" onclick="openDistributionEntryModal(null)">
                + New Distribution Entry
              </button>
            ` : "")}
          </div>
        </td>
      </tr>
    `;
    if (tfoot) tfoot.innerHTML = "";
    return;
  }

  let tablePcs = 0;
  let tableAmount = 0;

  tbody.innerHTML = filtered.map((item, idx) => {
    const srNo = item.sr_no || (idx + 1);
    const styleCode = item.style_code || "";
    const contName = item.contractor_name || "";
    const qty = parseInt(item.pcs_qty, 10) || 0;
    const rate = parseFloat(item.rate) || 0;
    const total = (item.total_amount != null && !isNaN(Number(item.total_amount))) ? Number(item.total_amount) : (qty * rate);
    const itemType = item.item || "SHIRT";
    const floor = item.floor || "";

    tablePcs += qty;
    tableAmount += total;

    return `
      <tr>
        <td style="text-align: center; vertical-align: middle; font-family: var(--font-mono); font-size: 0.825rem; color: var(--text-muted); font-weight: 600;">${srNo}</td>
        <td style="text-align: left; vertical-align: middle; cursor: pointer;" onclick="runSmartStyleAudit('${escapeHtml(styleCode)}', '${escapeHtml(itemType)}', true)" title="Click to view style audit across system">
          <span class="style-code-badge" style="font-weight: 800; font-size: 0.875rem;">${escapeHtml(styleCode)}</span>
        </td>
        <td style="text-align: left; vertical-align: middle;">
          <span class="contractor-tag" style="font-weight: 700; font-size: 0.85rem;">
            <span class="avatar-dot"></span>
            ${escapeHtml(contName)}
          </span>
        </td>
        <td style="text-align: right; vertical-align: middle; font-family: var(--font-mono); font-weight: 800; font-size: 0.9rem; color: var(--text-main);">${qty.toLocaleString()}</td>
        <td style="text-align: right; vertical-align: middle; font-family: var(--font-mono); font-weight: 600; font-size: 0.85rem; color: var(--text-muted);">${rate > 0 ? rate.toLocaleString() : '-'}</td>
        <td style="text-align: center; vertical-align: middle;">
          <span class="badge-tag inline" style="font-weight: 600; font-size: 0.75rem;">${escapeHtml(itemType)}</span>
        </td>
        <td style="text-align: center; vertical-align: middle; font-weight: 700; font-family: var(--font-mono); color: #38bdf8;">${escapeHtml(floor || '-')}</td>
        <td class="col-total" style="text-align: right; vertical-align: middle; font-family: var(--font-mono); font-weight: 800; font-size: 0.875rem; color: #10b981; width: 110px; max-width: 125px; white-space: nowrap;">${total > 0 ? Math.round(total).toLocaleString() : '-'}</td>
        <td style="text-align: center; vertical-align: middle; white-space: nowrap;">
          <span class="badge-tag inline" style="font-size: 0.72rem; font-weight: 700; background: rgba(16, 185, 129, 0.12); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);">
            ${escapeHtml(item.period || activePeriod || '-')}
          </span>
        </td>
        <td style="text-align: center; vertical-align: middle; white-space: nowrap;">
          ${canEdit ? `<button class="btn btn-secondary btn-sm" style="color: var(--primary); padding: 3px 8px; margin-right: 4px; font-size: 0.75rem;" onclick="openDistributionEntryModal(${item.id})" title="Edit distribution row">✏️ Edit</button>` : ''}
          ${canDelete ? `<button class="btn btn-secondary btn-sm" style="color: var(--accent-rose); padding: 3px 7px; font-size: 0.75rem;" onclick="deleteDistributionEntryAction(${item.id})" title="Delete row">✕</button>` : ''}
          ${!canEdit && !canDelete ? `<span style="color: var(--text-faint); font-size: 0.75rem;">—</span>` : ''}
        </td>
      </tr>
    `;
  }).join("");

  // 5. Render Table Footer with Totals
  const tableAvgRate = tablePcs > 0 ? Math.round(tableAmount / tablePcs) : 0;
  if (tfoot) {
    tfoot.innerHTML = `
      <tr style="background: rgba(16, 185, 129, 0.08); font-weight: 800; border-top: 2px solid rgba(16, 185, 129, 0.4);">
        <td colspan="3" style="text-align: right; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.85rem; padding: 0.85rem 1rem;">
          Total Distributed (${filtered.length} Styles):
        </td>
        <td style="text-align: right; font-family: var(--font-mono); font-size: 0.95rem; font-weight: 900; color: #10b981;">${tablePcs.toLocaleString()}</td>
        <td style="text-align: right; font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-muted);">Avg ${tableAvgRate > 0 ? tableAvgRate.toLocaleString() : '-'}</td>
        <td colspan="2"></td>
        <td class="col-total" style="text-align: right; font-family: var(--font-mono); font-size: 0.95rem; font-weight: 900; color: #10b981; width: 110px; max-width: 125px; white-space: nowrap;">Rs. ${Math.round(tableAmount).toLocaleString()}</td>
        <td style="text-align: center; vertical-align: middle; font-size: 0.75rem; font-weight: 700; color: #10b981;">
          ${query ? '🌐 All Periods' : escapeHtml(activePeriod)}
        </td>
        <td></td>
      </tr>
    `;
  }
}

function renderDistributionContractorChips(entries) {
  const container = document.getElementById("dist-contractor-chips-container");
  if (!container) return;

  const baseContractors = ["IMTIAZ", "ASIM", "ASIF", "NAVEED", "TOUSEEF", "SHOAIB"];
  const contPcsMap = new Map();
  let jointPcs = 0;
  let allPcs = 0;

  baseContractors.forEach(c => contPcsMap.set(c, 0));

  entries.forEach(e => {
    const name = (e.contractor_name || "").trim().toUpperCase();
    const qty = parseInt(e.pcs_qty, 10) || 0;
    allPcs += qty;

    if (name.includes("/")) {
      jointPcs += qty;
    } else if (contPcsMap.has(name)) {
      contPcsMap.set(name, contPcsMap.get(name) + qty);
    } else {
      // Find matching base contractor
      let matched = false;
      for (const b of baseContractors) {
        if (name.includes(b)) {
          contPcsMap.set(b, contPcsMap.get(b) + qty);
          matched = true;
          break;
        }
      }
      if (!matched) jointPcs += qty;
    }
  });

  const active = activeDistContractorFilter.toUpperCase();

  let html = `
    <button type="button" class="contractor-chip ${!active ? 'active' : ''}" onclick="filterDistByContractorChip('')">
      <span>ALL CONTRACTORS</span>
      <span class="chip-count">${allPcs.toLocaleString()} pcs</span>
    </button>
  `;

  baseContractors.forEach(c => {
    const pcs = contPcsMap.get(c) || 0;
    const isAct = active === c;
    html += `
      <button type="button" class="contractor-chip ${isAct ? 'active' : ''}" onclick="filterDistByContractorChip('${c}')">
        <span>${c}</span>
        <span class="chip-count">${pcs.toLocaleString()} pcs</span>
      </button>
    `;
  });

  if (jointPcs > 0) {
    const isAct = active === "JOINT";
    html += `
      <button type="button" class="contractor-chip ${isAct ? 'active' : ''}" onclick="filterDistByContractorChip('JOINT')">
        <span>JOINT / COMBINED</span>
        <span class="chip-count">${jointPcs.toLocaleString()} pcs</span>
      </button>
    `;
  }

  container.innerHTML = html;
}

function filterDistByContractorChip(contName) {
  activeDistContractorFilter = contName;
  const select = document.getElementById("filter-dist-contractor");
  if (select) {
    select.value = contName;
  }
  renderWorkDistribution();
}

function openDistributionEntryModal(id) {
  if (id && !window.db.canUserPerformAction("can_edit")) {
    showToast("Permission Denied: You cannot edit distribution entries.", "error");
    return;
  }
  if (!id && !window.db.canUserPerformAction("can_create")) {
    showToast("Permission Denied: You cannot create distribution entries.", "error");
    return;
  }

  const titleEl = document.getElementById("dist-entry-modal-title");
  const idInput = document.getElementById("dist-entry-id");
  const periodInput = document.getElementById("dist-entry-period");
  const srInput = document.getElementById("dist-entry-sr");
  const styleInput = document.getElementById("dist-entry-style-code");
  const contInput = document.getElementById("dist-entry-contractor");
  const pcsInput = document.getElementById("dist-entry-pcs-qty");
  const rateInput = document.getElementById("dist-entry-rate");
  const totalInput = document.getElementById("dist-entry-total");
  const itemInput = document.getElementById("dist-entry-item");
  const floorInput = document.getElementById("dist-entry-floor");
  const remarksInput = document.getElementById("dist-entry-remarks");

  populateDistributionPeriods();

  if (id) {
    const all = window.db.getWorkDistribution();
    const item = all.find(e => e.id === id);
    if (!item) {
      showToast("Distribution entry not found", "error");
      return;
    }

    if (titleEl) titleEl.textContent = "✏️ Edit Distribution Entry";
    if (idInput) idInput.value = item.id;
    if (periodInput) periodInput.value = item.period || getActiveDistributionPeriod();
    if (srInput) srInput.value = item.sr_no || "";
    if (styleInput) styleInput.value = item.style_code || "";
    if (contInput) contInput.value = item.contractor_name || "";
    if (pcsInput) pcsInput.value = item.pcs_qty || "";
    if (rateInput) rateInput.value = item.rate || "";
    if (itemInput) itemInput.value = item.item || "SHIRT";
    if (floorInput) floorInput.value = item.floor || "";
    if (remarksInput) remarksInput.value = item.remarks || "";
    calculateDistEntryTotal();
  } else {
    if (titleEl) titleEl.textContent = "📦 Work Distribution Entry";
    if (idInput) idInput.value = "";
    if (periodInput) periodInput.value = getActiveDistributionPeriod();

    const activePeriod = getActiveDistributionPeriod();
    const currentList = window.db.getWorkDistribution().filter(e => (e.period || "").trim().toLowerCase() === activePeriod.trim().toLowerCase());
    const nextSr = currentList.length + 1;

    if (srInput) srInput.value = nextSr;
    if (styleInput) styleInput.value = "";
    if (contInput) contInput.value = "";
    if (pcsInput) pcsInput.value = "";
    if (rateInput) rateInput.value = "";
    if (totalInput) totalInput.value = "Rs. 0";
    if (itemInput) itemInput.value = "SHIRT";
    if (floorInput) floorInput.value = "";
    if (remarksInput) remarksInput.value = "";
  }

  openModal("modal-distribution-entry");
}

function saveDistributionEntryAction(e) {
  if (e && e.preventDefault) e.preventDefault();

  const idVal = document.getElementById("dist-entry-id")?.value;
  const isEdit = Boolean(idVal);

  if (isEdit && !window.db.canUserPerformAction("can_edit")) {
    showToast("Permission Denied: You cannot edit distribution entries.", "error");
    return;
  }
  if (!isEdit && !window.db.canUserPerformAction("can_create")) {
    showToast("Permission Denied: You cannot create distribution entries.", "error");
    return;
  }

  const period = document.getElementById("dist-entry-period")?.value || getActiveDistributionPeriod();
  const sr_no = parseInt(document.getElementById("dist-entry-sr")?.value, 10) || null;
  const style_code = (document.getElementById("dist-entry-style-code")?.value || "").trim().toUpperCase();
  const contractor_name = (document.getElementById("dist-entry-contractor")?.value || "").trim().toUpperCase();
  const pcs_qty = parseInt(document.getElementById("dist-entry-pcs-qty")?.value, 10) || 0;
  const rate = parseFloat(document.getElementById("dist-entry-rate")?.value) || 0;
  const item = document.getElementById("dist-entry-item")?.value || "SHIRT";
  const floor = (document.getElementById("dist-entry-floor")?.value || "").trim();
  const remarks = (document.getElementById("dist-entry-remarks")?.value || "").trim();

  if (!style_code) {
    showToast("Please enter a Style Code", "error");
    return;
  }
  if (!contractor_name) {
    showToast("Please enter a Contractor Name", "error");
    return;
  }
  if (!window.db.isValidContractorName(contractor_name)) {
    const regList = window.db.getRegisteredContractorNames().join(", ");
    showToast(`Contractor "${contractor_name}" is not registered! Only saved contractors (${regList}) are accepted.`, "error");
    document.getElementById("dist-entry-contractor")?.focus();
    return;
  }
  if (pcs_qty <= 0) {
    showToast("Please enter valid PCS QTY (> 0)", "error");
    return;
  }
  if (rate < 0) {
    showToast("Rate cannot be negative", "error");
    return;
  }

  const total_amount = Math.round(pcs_qty * rate);

  const payload = {
    period,
    sr_no,
    style_code,
    contractor_name,
    pcs_qty,
    rate,
    total_amount,
    item,
    floor,
    remarks
  };

  try {
    if (isEdit) {
      window.db.updateWorkDistributionEntry(parseInt(idVal, 10), payload);
      showToast(`✓ Distribution entry for ${style_code} (${contractor_name}) updated!`);
    } else {
      window.db.addWorkDistributionEntry(payload);
      showToast(`✓ Allocated ${pcs_qty} pcs of ${style_code} to ${contractor_name}!`);
    }

    closeModal("modal-distribution-entry");

    // CRITICAL: Re-render ALL views so contractor name is auto-linked across
    // Master Inventory, Receiving, Dispatch, Daily Sheet, and Payment Sheet!
    renderAll();
  } catch (err) {
    showToast(`Error: ${err.message}`, "error");
  }
}

async function deleteDistributionEntryAction(id) {
  if (!window.db.canUserPerformAction("can_delete")) {
    showToast("Permission Denied: You cannot delete distribution entries.", "error");
    return;
  }

  const all = window.db.getWorkDistribution();
  const numId = Number(id);
  const item = all.find(e => Number(e.id) === numId || String(e.id) === String(id));
  const styleLabel = item ? `Style ${item.style_code} (${item.contractor_name})` : "this distribution entry";

  if (confirm(`Are you sure you want to delete ${styleLabel}?`)) {
    try {
      window.lastUserActionTime = Date.now();
      await window.db.deleteWorkDistributionEntry(id);
      showToast(`✓ Deleted ${styleLabel} successfully!`, "info");
      renderAll();
    } catch (err) {
      showToast(`Error deleting entry: ${err.message}`, "error");
    }
  }
}

function openDistPeriodSetupModal(isNew = false) {
  const setupId = document.getElementById("dist-setup-id");
  const sDate = document.getElementById("dist-setup-start-date");
  const eDate = document.getElementById("dist-setup-end-date");
  const title = document.getElementById("dist-setup-name");
  const dept = document.getElementById("dist-setup-dept");
  const status = document.getElementById("dist-setup-status");
  const notes = document.getElementById("dist-setup-notes");

  if (setupId) setupId.value = "";
  if (sDate) sDate.value = "";
  if (eDate) eDate.value = "";
  if (title) title.value = isNew ? "" : getActiveDistributionPeriod();
  if (dept) dept.value = "Hand Embroidery Department";
  if (status) status.value = "Active";
  if (notes) notes.value = "";

  renderDistPeriodSetupList();
  openModal("modal-dist-period-setup");
}

function renderDistPeriodSetupList() {
  const container = document.getElementById("dist-setup-list-box");
  const countBadge = document.getElementById("dist-setup-count-badge");
  if (!container) return;

  const periods = (window.db && typeof window.db.getDistributionPeriods === "function")
    ? window.db.getDistributionPeriods()
    : [];
  const entries = (window.db && typeof window.db.getWorkDistribution === "function")
    ? window.db.getWorkDistribution()
    : [];

  const activePeriod = getActiveDistributionPeriod();

  if (countBadge) countBadge.textContent = `${periods.length} Periods`;

  if (periods.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 1rem; font-size: 0.8rem;">No distribution periods configured yet.</div>`;
    return;
  }

  container.innerHTML = periods.map(p => {
    const pEntries = entries.filter(e => (e.period || "").trim().toLowerCase() === p.period_name.trim().toLowerCase());
    const isAct = p.period_name.trim().toLowerCase() === activePeriod.trim().toLowerCase();

    return `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 0.75rem; border-bottom: 1px solid var(--border-color); background: ${isAct ? 'rgba(16, 185, 129, 0.08)' : 'transparent'};">
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <strong style="font-family: var(--font-mono); font-size: 0.85rem; color: ${isAct ? '#10b981' : 'var(--text-main)'};">${escapeHtml(p.period_name)}</strong>
            ${isAct ? '<span class="badge-tag success" style="font-size: 0.65rem; padding: 1px 6px;">Active</span>' : ''}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
            ${p.department || 'Hand Embroidery'} • ${pEntries.length} Style Allocations
          </div>
        </div>
        <div style="display: flex; gap: 0.4rem; align-items: center;">
          ${!isAct ? `
            <button type="button" class="btn btn-secondary btn-xs" style="padding: 2px 7px; font-size: 0.725rem;" onclick="selectDistPeriodFromSetup('${escapeHtml(p.period_name)}')">
              Switch To
            </button>
          ` : ''}
          <button type="button" class="btn btn-secondary btn-xs" style="color: var(--accent-rose); padding: 2px 6px; font-size: 0.725rem;" onclick="deleteDistPeriodAction('${escapeHtml(p.id || p.period_name)}')" title="Delete period sheet">
            ✕
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function selectDistPeriodFromSetup(periodName) {
  const select = document.getElementById("select-distribution-period");
  if (select) {
    select.value = periodName;
  }
  closeModal("modal-dist-period-setup");
  renderWorkDistribution();
  showToast(`Switched to distribution period "${periodName}"`, "info");
}

function saveDistPeriodAction(e) {
  if (e && e.preventDefault) e.preventDefault();

  const titleInp = document.getElementById("dist-setup-name");
  const sDateInp = document.getElementById("dist-setup-start-date");
  const eDateInp = document.getElementById("dist-setup-end-date");
  const deptInp = document.getElementById("dist-setup-dept");
  const statusInp = document.getElementById("dist-setup-status");
  const notesInp = document.getElementById("dist-setup-notes");

  const period_name = (titleInp?.value || "").trim();
  if (!period_name) {
    showToast("Please specify a period title", "error");
    return;
  }

  const periodObj = {
    period_name,
    start_date: sDateInp?.value || "",
    end_date: eDateInp?.value || "",
    department: deptInp?.value || "Hand Embroidery Department",
    status: statusInp?.value || "Active",
    notes: notesInp?.value || ""
  };

  try {
    window.db.saveDistributionPeriod(periodObj);
    populateDistributionPeriods();

    const select = document.getElementById("select-distribution-period");
    if (select) select.value = period_name;

    closeModal("modal-dist-period-setup");
    renderWorkDistribution();
    showToast(`✓ Distribution period "${period_name}" created & active!`);
  } catch (err) {
    showToast(`Error saving period: ${err.message}`, "error");
  }
}

function deleteDistPeriodAction(periodKey) {
  if (!window.db.canUserPerformAction("can_delete")) {
    showToast("Permission Denied: You cannot delete distribution periods.", "error");
    return;
  }

  const periods = window.db.getDistributionPeriods();
  const target = periods.find(p => p.id === periodKey || p.period_name === periodKey);
  const name = target ? target.period_name : periodKey;

  const entries = window.db.getWorkDistribution().filter(e => (e.period || "").trim().toLowerCase() === name.trim().toLowerCase());

  let promptMsg = `Delete distribution period sheet "${name}"?`;
  if (entries.length > 0) {
    promptMsg += ` WARNING: This period contains ${entries.length} style allocations!`;
  }

  if (confirm(promptMsg)) {
    try {
      window.db.deleteDistributionPeriod(periodKey);
      populateDistributionPeriods();
      renderDistPeriodSetupList();
      renderWorkDistribution();
      showToast(`Distribution period "${name}" removed.`, "info");
    } catch (err) {
      showToast(`Error: ${err.message}`, "error");
    }
  }
}

function exportDistributionCsv() {
  const activePeriod = getActiveDistributionPeriod();
  const allEntries = window.db.getWorkDistribution();
  const list = (activePeriod && activePeriod !== "all")
    ? allEntries.filter(e => (e.period || "").trim().toLowerCase() === activePeriod.trim().toLowerCase())
    : allEntries;

  if (list.length === 0) {
    showToast("No distribution entries to export", "info");
    return;
  }

  const headers = ["SR NO", "STYLE CODE", "CONT NAME", "PCS QTY", "RATE", "ITEM", "Floor", "Total", "Period", "Remarks"];
  const rows = list.map((item, idx) => {
    const qty = parseInt(item.pcs_qty, 10) || 0;
    const rate = parseFloat(item.rate) || 0;
    const tot = item.total_amount != null ? item.total_amount : (qty * rate);

    return [
      item.sr_no || (idx + 1),
      `"${item.style_code}"`,
      `"${item.contractor_name}"`,
      qty,
      rate,
      `"${item.item || 'SHIRT'}"`,
      `"${item.floor || ''}"`,
      tot,
      `"${item.period || activePeriod}"`,
      `"${(item.remarks || '').replace(/"/g, '""')}"`
    ];
  });

  const safePeriod = activePeriod.replace(/[^a-zA-Z0-9_-]/g, "_");
  downloadCSV(`Work_Distribution_${safePeriod}_${new Date().toISOString().split("T")[0]}.csv`, [headers, ...rows]);
}

function printDistributionSheet() {
  openPrintStudio("distribution");
}

// ====================================================================
// ADVANCED PRINT STUDIO & COLUMN CUSTOMIZER CONTROLLER
// Zero Clipping • Excel-like Width Sizing • Real-time A4 Preview • Saved Presets
// ====================================================================

const PRINT_STUDIO_DEFAULTS = {
  daily: {
    title: "Daily Running Style Status Sheet",
    subtitle: "Daily Inward / Outward Embroidery Floor Tracking",
    defaultOrientation: "landscape",
    defaultFontSize: "normal",
    columns: [
      { id: "sr_no", label: "S NO", defaultWidth: 5, currentWidth: 5, enabled: true, align: "center" },
      { id: "style_code", label: "STYLE CODE", defaultWidth: 15, currentWidth: 15, enabled: true, align: "left" },
      { id: "category", label: "CATEGORY", defaultWidth: 11, currentWidth: 11, enabled: true, align: "center" },
      { id: "contractor", label: "CONT NAME", defaultWidth: 16, currentWidth: 16, enabled: true, align: "left" },
      { id: "cut_qty", label: "CUT QTY", defaultWidth: 8, currentWidth: 8, enabled: true, align: "right" },
      { id: "received_qty", label: "REC QTY", defaultWidth: 8, currentWidth: 8, enabled: true, align: "right" },
      { id: "balance_stock", label: "BAL STOCK", defaultWidth: 10, currentWidth: 10, enabled: true, align: "right" },
      { id: "balance_hemb", label: "BAL H-EMB", defaultWidth: 10, currentWidth: 10, enabled: true, align: "right" },
      { id: "remarks", label: "REMARKS / STATUS", defaultWidth: 17, currentWidth: 17, enabled: true, align: "left" }
    ],
    presets: [
      {
        id: "default",
        name: "Standard Full Sheet (تمام کالم)",
        orientation: "landscape",
        fontSize: "normal",
        autoFit: true,
        columns: [
          { id: "sr_no", enabled: true, width: 5 },
          { id: "style_code", enabled: true, width: 15 },
          { id: "category", enabled: true, width: 11 },
          { id: "contractor", enabled: true, width: 16 },
          { id: "cut_qty", enabled: true, width: 8 },
          { id: "received_qty", enabled: true, width: 8 },
          { id: "balance_stock", enabled: true, width: 10 },
          { id: "balance_hemb", enabled: true, width: 10 },
          { id: "remarks", enabled: true, width: 17 }
        ]
      },
      {
        id: "floor_balance",
        name: "Floor & Cutting Balances (فلور بیلنس)",
        orientation: "portrait",
        fontSize: "normal",
        autoFit: true,
        columns: [
          { id: "sr_no", enabled: true, width: 6 },
          { id: "style_code", enabled: true, width: 18 },
          { id: "contractor", enabled: true, width: 20 },
          { id: "cut_qty", enabled: true, width: 12 },
          { id: "received_qty", enabled: true, width: 12 },
          { id: "balance_stock", enabled: true, width: 16 },
          { id: "balance_hemb", enabled: true, width: 16 },
          { id: "category", enabled: false, width: 10 },
          { id: "remarks", enabled: false, width: 15 }
        ]
      },
      {
        id: "contractor_work",
        name: "Contractor Pending Work (ٹھیکیدار ورک لسٹ)",
        orientation: "landscape",
        fontSize: "normal",
        autoFit: true,
        columns: [
          { id: "sr_no", enabled: true, width: 6 },
          { id: "style_code", enabled: true, width: 18 },
          { id: "category", enabled: true, width: 12 },
          { id: "contractor", enabled: true, width: 22 },
          { id: "balance_hemb", enabled: true, width: 16 },
          { id: "remarks", enabled: true, width: 26 },
          { id: "cut_qty", enabled: false, width: 10 },
          { id: "received_qty", enabled: false, width: 10 },
          { id: "balance_stock", enabled: false, width: 12 }
        ]
      },
      {
        id: "executive_summary",
        name: "Executive Summary (مختصر رپورٹ)",
        orientation: "portrait",
        fontSize: "large",
        autoFit: true,
        columns: [
          { id: "sr_no", enabled: true, width: 7 },
          { id: "style_code", enabled: true, width: 22 },
          { id: "contractor", enabled: true, width: 23 },
          { id: "cut_qty", enabled: true, width: 16 },
          { id: "received_qty", enabled: true, width: 16 },
          { id: "balance_hemb", enabled: true, width: 16 },
          { id: "category", enabled: false, width: 10 },
          { id: "balance_stock", enabled: false, width: 10 },
          { id: "remarks", enabled: false, width: 10 }
        ]
      }
    ]
  },
  distribution: {
    title: "Work Distribution Sheet",
    subtitle: "Bi-Monthly Contractor Garment Allocation",
    defaultOrientation: "landscape",
    defaultFontSize: "normal",
    columns: [
      { id: "sr_no", label: "SR NO", defaultWidth: 5, currentWidth: 5, enabled: true, align: "center" },
      { id: "style_code", label: "STYLE CODE", defaultWidth: 15, currentWidth: 15, enabled: true, align: "left" },
      { id: "contractor_name", label: "CONT NAME", defaultWidth: 16, currentWidth: 16, enabled: true, align: "left" },
      { id: "pcs_qty", label: "PCS QTY", defaultWidth: 9, currentWidth: 9, enabled: true, align: "right" },
      { id: "rate", label: "RATE", defaultWidth: 8, currentWidth: 8, enabled: true, align: "right" },
      { id: "item", label: "ITEM", defaultWidth: 8, currentWidth: 8, enabled: true, align: "center" },
      { id: "floor", label: "FLOOR", defaultWidth: 8, currentWidth: 8, enabled: true, align: "center" },
      { id: "total", label: "TOTAL", defaultWidth: 12, currentWidth: 12, enabled: true, align: "right" },
      { id: "period", label: "TIME PERIOD", defaultWidth: 11, currentWidth: 11, enabled: true, align: "center" },
      { id: "remarks", label: "REMARKS", defaultWidth: 8, currentWidth: 8, enabled: false, align: "left" }
    ],
    presets: [
      {
        id: "default",
        name: "Standard Distribution (مکمل لسٹ)",
        orientation: "landscape",
        fontSize: "normal",
        autoFit: true,
        columns: [
          { id: "sr_no", enabled: true, width: 5 },
          { id: "style_code", enabled: true, width: 15 },
          { id: "contractor_name", enabled: true, width: 16 },
          { id: "pcs_qty", enabled: true, width: 9 },
          { id: "rate", enabled: true, width: 8 },
          { id: "item", enabled: true, width: 8 },
          { id: "floor", enabled: true, width: 8 },
          { id: "total", enabled: true, width: 12 },
          { id: "period", enabled: true, width: 11 },
          { id: "remarks", enabled: false, width: 8 }
        ]
      },
      {
        id: "gate_pass",
        name: "Contractor Gate Pass / Handover (گیٹ پاس)",
        orientation: "portrait",
        fontSize: "normal",
        autoFit: true,
        columns: [
          { id: "sr_no", enabled: true, width: 8 },
          { id: "style_code", enabled: true, width: 24 },
          { id: "contractor_name", enabled: true, width: 26 },
          { id: "pcs_qty", enabled: true, width: 16 },
          { id: "item", enabled: true, width: 12 },
          { id: "floor", enabled: true, width: 14 },
          { id: "rate", enabled: false, width: 8 },
          { id: "total", enabled: false, width: 10 },
          { id: "period", enabled: false, width: 10 },
          { id: "remarks", enabled: false, width: 8 }
        ]
      }
    ]
  },
  payment: {
    title: "Rate Approval & Payment Sheet",
    subtitle: "Bi-Monthly Contractor Production & Payment Reconciliation",
    defaultOrientation: "landscape",
    defaultFontSize: "compact",
    columns: [
      { id: "sr_no", label: "S.NO", defaultWidth: 4, currentWidth: 4, enabled: true, align: "center" },
      { id: "style_code", label: "STYLE NAME", defaultWidth: 13, currentWidth: 13, enabled: true, align: "left" },
      { id: "working", label: "WORKING", defaultWidth: 7, currentWidth: 7, enabled: true, align: "center" },
      { id: "contractor_name", label: "CONT NAME", defaultWidth: 12, currentWidth: 12, enabled: true, align: "left" },
      { id: "rate", label: "H-EMB FIX RATE", defaultWidth: 7, currentWidth: 7, enabled: true, align: "right" },
      { id: "cut_qty", label: "CUT QTY", defaultWidth: 7, currentWidth: 7, enabled: true, align: "right" },
      { id: "prod_pcs_qty", label: "PROD PCS", defaultWidth: 8, currentWidth: 8, enabled: true, align: "right" },
      { id: "carigar_rate", label: "CARIGAR", defaultWidth: 7, currentWidth: 7, enabled: true, align: "right" },
      { id: "commission", label: "COMM", defaultWidth: 6, currentWidth: 6, enabled: true, align: "right" },
      { id: "rate_total", label: "TOTAL RATE", defaultWidth: 7, currentWidth: 7, enabled: true, align: "right" },
      { id: "remarks", label: "REMARKS", defaultWidth: 9, currentWidth: 9, enabled: true, align: "left" },
      { id: "balance_stock", label: "BAL STOCK", defaultWidth: 6, currentWidth: 6, enabled: true, align: "right" },
      { id: "balance_hemb", label: "BAL H-EMB", defaultWidth: 6, currentWidth: 6, enabled: true, align: "right" },
      { id: "total_balance", label: "TOTAL BAL", defaultWidth: 6, currentWidth: 6, enabled: true, align: "right" },
      { id: "period", label: "TIME PERIOD", defaultWidth: 8, currentWidth: 8, enabled: true, align: "center" }
    ],
    presets: [
      {
        id: "default",
        name: "Standard Full Approval (مکمل ریٹ شیٹ)",
        orientation: "landscape",
        fontSize: "compact",
        autoFit: true,
        columns: [
          { id: "sr_no", enabled: true, width: 4 },
          { id: "style_code", enabled: true, width: 13 },
          { id: "working", enabled: true, width: 7 },
          { id: "contractor_name", enabled: true, width: 12 },
          { id: "rate", enabled: true, width: 7 },
          { id: "cut_qty", enabled: true, width: 7 },
          { id: "prod_pcs_qty", enabled: true, width: 8 },
          { id: "carigar_rate", enabled: true, width: 7 },
          { id: "commission", enabled: true, width: 6 },
          { id: "rate_total", enabled: true, width: 7 },
          { id: "remarks", enabled: true, width: 9 },
          { id: "balance_stock", enabled: true, width: 6 },
          { id: "balance_hemb", enabled: true, width: 6 },
          { id: "total_balance", enabled: true, width: 6 },
          { id: "period", enabled: true, width: 8 }
        ]
      },
      {
        id: "payment_summary",
        name: "Payment Audit & Rates (اکاؤنٹس پےمنٹ سمری)",
        orientation: "landscape",
        fontSize: "normal",
        autoFit: true,
        columns: [
          { id: "sr_no", enabled: true, width: 5 },
          { id: "style_code", enabled: true, width: 18 },
          { id: "contractor_name", enabled: true, width: 18 },
          { id: "prod_pcs_qty", enabled: true, width: 12 },
          { id: "carigar_rate", enabled: true, width: 10 },
          { id: "commission", enabled: true, width: 10 },
          { id: "rate_total", enabled: true, width: 12 },
          { id: "total_balance", enabled: true, width: 15 },
          { id: "working", enabled: false, width: 7 },
          { id: "rate", enabled: false, width: 7 },
          { id: "cut_qty", enabled: false, width: 7 },
          { id: "remarks", enabled: false, width: 9 },
          { id: "balance_stock", enabled: false, width: 6 },
          { id: "balance_hemb", enabled: false, width: 6 },
          { id: "period", enabled: false, width: 8 }
        ]
      }
    ]
  }
};

let printStudioActiveSheet = "daily";
let printStudioOrientation = "landscape";
let printStudioHeaderFontSize = 10;
let printStudioHeaderBold = true;
let printStudioHeaderPadding = 8;
let printStudioRowPadding = 6;
let printStudioTotalPadding = 8;
let printStudioBodyFontSize = 9;
let printStudioTextAlign = "auto";
let printStudioAutoFit = true;
let printStudioColumns = [];
let printStudioCurrentPresetId = "default";
let printStudioInitialized = false;

function setPrintStudioTextAlign(align, triggerPreview = true) {
  printStudioTextAlign = align || "auto";
  ["auto", "left", "center", "right"].forEach(a => {
    const btn = document.getElementById(`btn-align-${a}`);
    if (btn) {
      if (a === printStudioTextAlign) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    }
  });
  if (triggerPreview) {
    renderLiveA4Preview();
  }
}

function showPrintStudioStatus(msgText, isSuccess = true) {
  // 1. Visible Side Feedback (under preset buttons in left panel)
  const sideMsgEl = document.getElementById("print-preset-status-msg");
  if (sideMsgEl) {
    sideMsgEl.textContent = msgText;
    sideMsgEl.style.display = "block";
    sideMsgEl.style.background = isSuccess ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)";
    sideMsgEl.style.borderColor = isSuccess ? "#10b981" : "#f43f5e";
    sideMsgEl.style.color = isSuccess ? "#10b981" : "#f43f5e";
    
    if (window._printSideMsgTimer) clearTimeout(window._printSideMsgTimer);
    window._printSideMsgTimer = setTimeout(() => {
      if (sideMsgEl) sideMsgEl.style.display = "none";
    }, 4500);
  }

  // 2. Visible Bottom Feedback (in modal footer right next to guarantee)
  const footerMsgEl = document.getElementById("print-modal-footer-msg");
  const footerTextEl = document.getElementById("print-modal-footer-text");
  if (footerMsgEl && footerTextEl) {
    footerTextEl.textContent = msgText;
    footerMsgEl.style.display = "flex";
    footerMsgEl.style.background = isSuccess ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)";
    footerMsgEl.style.borderColor = isSuccess ? "#10b981" : "#f43f5e";
    footerMsgEl.style.color = isSuccess ? "#10b981" : "#f43f5e";
    
    if (window._printFooterMsgTimer) clearTimeout(window._printFooterMsgTimer);
    window._printFooterMsgTimer = setTimeout(() => {
      if (footerMsgEl) footerMsgEl.style.display = "none";
    }, 4500);
  }

  // 3. System Toast for universal notification
  showToast(msgText, isSuccess ? "success" : "error");
}

function initPrintStudio() {
  if (printStudioInitialized) return;
  printStudioInitialized = true;

  // Sheet change
  const sheetSel = document.getElementById("print-sheet-selector");
  if (sheetSel) {
    sheetSel.addEventListener("change", (e) => {
      loadSheetIntoPrintStudio(e.target.value);
    });
  }

  // Preset change
  const presetSel = document.getElementById("print-preset-selector");
  if (presetSel) {
    presetSel.addEventListener("change", (e) => {
      applyPrintPreset(e.target.value);
    });
  }

  // Preset Action Buttons
  document.getElementById("btn-save-current-preset")?.addEventListener("click", saveActivePrintPreset);
  document.getElementById("btn-save-new-preset")?.addEventListener("click", saveNewPrintPreset);
  document.getElementById("btn-delete-preset")?.addEventListener("click", deleteActivePrintPreset);
  document.getElementById("btn-reset-preset-defaults")?.addEventListener("click", resetPrintPresetsToDefault);

  // Orientation toggles
  document.getElementById("btn-orient-landscape")?.addEventListener("click", () => {
    setPrintStudioOrientation("landscape");
  });
  document.getElementById("btn-orient-portrait")?.addEventListener("click", () => {
    setPrintStudioOrientation("portrait");
  });

  // Text Alignment Buttons (Auto, Left, Center, Right)
  ["auto", "left", "center", "right"].forEach(align => {
    document.getElementById(`btn-align-${align}`)?.addEventListener("click", () => {
      setPrintStudioTextAlign(align);
    });
  });

  // Heading Font Size Slider
  const headerFontSlider = document.getElementById("print-header-font-size");
  if (headerFontSlider) {
    headerFontSlider.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      printStudioHeaderFontSize = isNaN(val) ? 10 : val;
      const valDisplay = document.getElementById("val-header-font-size");
      if (valDisplay) valDisplay.textContent = `${e.target.value}pt`;
      renderLiveA4Preview();
    });
  }

  // Heading Row Height Slider
  const headerPadSlider = document.getElementById("print-header-padding");
  if (headerPadSlider) {
    headerPadSlider.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      printStudioHeaderPadding = isNaN(val) ? 0 : Math.max(0, val);
      const valDisplay = document.getElementById("val-header-padding");
      if (valDisplay) valDisplay.textContent = `${e.target.value}px`;
      renderLiveA4Preview();
    });
  }

  // Heading Bold Toggle
  const btnHeaderBold = document.getElementById("btn-toggle-header-bold");
  if (btnHeaderBold) {
    btnHeaderBold.addEventListener("click", () => {
      printStudioHeaderBold = !printStudioHeaderBold;
      updateHeaderBoldButtonUI();
      renderLiveA4Preview();
    });
  }

  // Data Row Height / Padding Slider
  const rowPadSlider = document.getElementById("print-row-padding");
  if (rowPadSlider) {
    rowPadSlider.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      printStudioRowPadding = isNaN(val) ? 0 : Math.max(0, val);
      const valDisplay = document.getElementById("val-row-padding");
      if (valDisplay) valDisplay.textContent = `${e.target.value}px`;
      renderLiveA4Preview();
    });
  }

  // Total Row Height Slider
  const totalPadSlider = document.getElementById("print-total-padding");
  if (totalPadSlider) {
    totalPadSlider.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      printStudioTotalPadding = isNaN(val) ? 0 : Math.max(0, val);
      const valDisplay = document.getElementById("val-total-padding");
      if (valDisplay) valDisplay.textContent = `${e.target.value}px`;
      renderLiveA4Preview();
    });
  }

  // Body Data Font Size Slider
  const bodyFontSlider = document.getElementById("print-body-font-size");
  if (bodyFontSlider) {
    bodyFontSlider.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      printStudioBodyFontSize = isNaN(val) ? 9 : val;
      const valDisplay = document.getElementById("val-body-font-size");
      if (valDisplay) valDisplay.textContent = `${e.target.value}pt`;
      renderLiveA4Preview();
    });
  }

  // Auto-fit toggle
  document.getElementById("print-auto-fit-toggle")?.addEventListener("change", (e) => {
    printStudioAutoFit = Boolean(e.target.checked);
    renderPrintColumnControls();
    renderLiveA4Preview();
  });

  // Column bulk buttons
  document.getElementById("btn-print-select-all")?.addEventListener("click", () => {
    printStudioColumns.forEach(c => c.enabled = true);
    renderPrintColumnControls();
    renderLiveA4Preview();
  });

  document.getElementById("btn-print-deselect-all")?.addEventListener("click", () => {
    printStudioColumns.forEach((c, i) => c.enabled = (i < 2)); // keep first 2 active
    renderPrintColumnControls();
    renderLiveA4Preview();
  });

  document.getElementById("btn-print-equalize-widths")?.addEventListener("click", () => {
    const activeCols = printStudioColumns.filter(c => c.enabled);
    if (activeCols.length > 0) {
      const eq = Math.floor(100 / activeCols.length);
      activeCols.forEach(c => c.currentWidth = eq);
      renderPrintColumnControls();
      renderLiveA4Preview();
      showToast("Selected column widths equalized across 100%!");
    }
  });

  // Zoom select
  document.getElementById("preview-zoom-select")?.addEventListener("change", updatePreviewZoom);

  // Print execution button
  document.getElementById("btn-execute-studio-print")?.addEventListener("click", executeStudioPrint);
}

function updateHeaderBoldButtonUI() {
  const btn = document.getElementById("btn-toggle-header-bold");
  if (!btn) return;
  if (printStudioHeaderBold) {
    btn.classList.add("active");
    btn.innerHTML = `<strong>𝐁 Bold</strong>`;
    btn.style.color = "#38bdf8";
    btn.style.borderColor = "#38bdf8";
  } else {
    btn.classList.remove("active");
    btn.innerHTML = `Regular`;
    btn.style.color = "var(--text-muted)";
    btn.style.borderColor = "var(--border-color)";
  }
}

function openPrintStudio(sheetType = "daily") {
  initPrintStudio();
  loadSheetIntoPrintStudio(sheetType);
  openModal("modal-print-studio");
  setTimeout(updatePreviewZoom, 150);
}

function loadSheetIntoPrintStudio(sheetType) {
  if (!PRINT_STUDIO_DEFAULTS[sheetType]) sheetType = "daily";
  printStudioActiveSheet = sheetType;

  const sheetSel = document.getElementById("print-sheet-selector");
  if (sheetSel) sheetSel.value = sheetType;

  // Populate presets dropdown
  populatePrintPresetsDropdown(sheetType);

  // Load first / default preset
  const presets = getPrintPresetsForSheet(sheetType);
  const targetPreset = presets.find(p => p.id === printStudioCurrentPresetId) || presets[0] || null;

  if (targetPreset) {
    applyPrintPreset(targetPreset.id);
  } else {
    resetPrintPresetsToDefault();
  }
}

function getPrintPresetsForSheet(sheetType) {
  const key = `craftflow_print_presets_${sheetType}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.warn("Error reading presets:", e);
    }
  }
  const defaults = PRINT_STUDIO_DEFAULTS[sheetType]?.presets || [];
  return JSON.parse(JSON.stringify(defaults));
}

function savePrintPresetsForSheet(sheetType, presets) {
  const key = `craftflow_print_presets_${sheetType}`;
  try {
    localStorage.setItem(key, JSON.stringify(presets));
  } catch (e) {
    console.error("Failed saving presets:", e);
  }
}

function populatePrintPresetsDropdown(sheetType) {
  const sel = document.getElementById("print-preset-selector");
  if (!sel) return;

  const presets = getPrintPresetsForSheet(sheetType);
  sel.innerHTML = presets.map(p => 
    `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`
  ).join("");
}

function applyPrintPreset(presetId) {
  const presets = getPrintPresetsForSheet(printStudioActiveSheet);
  const preset = presets.find(p => p.id === presetId) || presets[0];
  if (!preset) return;

  printStudioCurrentPresetId = preset.id;
  const sel = document.getElementById("print-preset-selector");
  if (sel) sel.value = preset.id;

  // Update Orientation
  setPrintStudioOrientation(preset.orientation || "landscape", false);

  // Update Heading Font Size & Bold & Row Height
  printStudioHeaderFontSize = preset.headerFontSize != null ? parseFloat(preset.headerFontSize) : 10;
  printStudioHeaderBold = (preset.headerBold !== false);
  printStudioHeaderPadding = preset.headerPadding != null ? parseInt(preset.headerPadding, 10) : 8;
  const headerFontSlider = document.getElementById("print-header-font-size");
  if (headerFontSlider) headerFontSlider.value = printStudioHeaderFontSize;
  const valHeaderDisplay = document.getElementById("val-header-font-size");
  if (valHeaderDisplay) valHeaderDisplay.textContent = `${printStudioHeaderFontSize}pt`;
  const headerPadSlider = document.getElementById("print-header-padding");
  if (headerPadSlider) headerPadSlider.value = printStudioHeaderPadding;
  const valHeaderPadDisplay = document.getElementById("val-header-padding");
  if (valHeaderPadDisplay) valHeaderPadDisplay.textContent = `${printStudioHeaderPadding}px`;
  updateHeaderBoldButtonUI();

  // Update Data Row Height / Padding
  printStudioRowPadding = preset.rowPadding != null ? parseInt(preset.rowPadding, 10) : 6;
  const rowPadSlider = document.getElementById("print-row-padding");
  if (rowPadSlider) rowPadSlider.value = printStudioRowPadding;
  const valRowDisplay = document.getElementById("val-row-padding");
  if (valRowDisplay) valRowDisplay.textContent = `${printStudioRowPadding}px`;

  // Update Total Row Height / Padding
  printStudioTotalPadding = preset.totalPadding != null ? parseInt(preset.totalPadding, 10) : 8;
  const totalPadSlider = document.getElementById("print-total-padding");
  if (totalPadSlider) totalPadSlider.value = printStudioTotalPadding;
  const valTotalPadDisplay = document.getElementById("val-total-padding");
  if (valTotalPadDisplay) valTotalPadDisplay.textContent = `${printStudioTotalPadding}px`;

  // Update Body Data Font Size
  printStudioBodyFontSize = preset.bodyFontSize != null ? parseFloat(preset.bodyFontSize) : 9;
  const bodyFontSlider = document.getElementById("print-body-font-size");
  if (bodyFontSlider) bodyFontSlider.value = printStudioBodyFontSize;
  const valBodyDisplay = document.getElementById("val-body-font-size");
  if (valBodyDisplay) valBodyDisplay.textContent = `${printStudioBodyFontSize}pt`;

  // Update Table Text Alignment (Auto, Left, Center, Right)
  setPrintStudioTextAlign(preset.textAlign || "auto", false);

  // Update Auto Fit
  printStudioAutoFit = (preset.autoFit !== false);
  const autoFitChk = document.getElementById("print-auto-fit-toggle");
  if (autoFitChk) autoFitChk.checked = printStudioAutoFit;

  // Build Column List
  const baseCols = PRINT_STUDIO_DEFAULTS[printStudioActiveSheet].columns;
  printStudioColumns = baseCols.map(base => {
    const saved = preset.columns ? preset.columns.find(c => c.id === base.id) : null;
    return {
      ...base,
      enabled: saved ? Boolean(saved.enabled) : base.enabled,
      currentWidth: saved && saved.width ? parseInt(saved.width, 10) : base.defaultWidth,
      bold: saved && saved.bold != null ? Boolean(saved.bold) : (base.id === "style_code")
    };
  });

  renderPrintColumnControls();
  renderLiveA4Preview();
}

function setPrintStudioOrientation(orientation, triggerPreview = true) {
  printStudioOrientation = orientation;
  const btnLand = document.getElementById("btn-orient-landscape");
  const btnPort = document.getElementById("btn-orient-portrait");
  const previewPaper = document.getElementById("a4-sheet-preview");

  if (orientation === "landscape") {
    btnLand?.classList.add("active");
    btnPort?.classList.remove("active");
    if (previewPaper) {
      previewPaper.classList.add("orientation-landscape");
      previewPaper.classList.remove("orientation-portrait");
      previewPaper.style.width = "297mm";
      previewPaper.style.minHeight = "210mm";
    }
  } else {
    btnPort?.classList.add("active");
    btnLand?.classList.remove("active");
    if (previewPaper) {
      previewPaper.classList.add("orientation-portrait");
      previewPaper.classList.remove("orientation-landscape");
      previewPaper.style.width = "210mm";
      previewPaper.style.minHeight = "297mm";
    }
  }

  updatePreviewZoom();
  if (triggerPreview) {
    renderLiveA4Preview();
  }
}

function updatePreviewZoom() {
  const zoomSelect = document.getElementById("preview-zoom-select");
  const paper = document.getElementById("a4-sheet-preview");
  const viewport = document.getElementById("preview-paper-viewport");
  if (!zoomSelect || !paper || !viewport) return;

  const val = zoomSelect.value;
  if (val === "fit") {
    const availableWidth = viewport.clientWidth - 48;
    const baseWidth = (printStudioOrientation === "landscape") ? 1122 : 794;
    const scale = Math.min(1, Math.max(0.35, availableWidth / baseWidth));
    paper.style.transform = `scale(${scale.toFixed(2)})`;
  } else {
    paper.style.transform = `scale(${val})`;
  }
}

function renderPrintColumnControls() {
  const container = document.getElementById("print-columns-list-container");
  if (!container) return;

  // Calculate sum of active weights
  const activeCols = printStudioColumns.filter(c => c.enabled);
  const totalWeight = activeCols.reduce((sum, c) => sum + (c.currentWidth || 10), 0) || 1;

  container.innerHTML = printStudioColumns.map((col) => {
    const normPct = col.enabled ? Math.round((col.currentWidth / totalWeight) * 100) : 0;
    const isBold = Boolean(col.bold);
    return `
      <div class="print-col-item ${col.enabled ? 'is-enabled' : 'is-disabled'}" data-col-id="${col.id}">
        <div class="print-col-meta">
          <input type="checkbox" id="chk-col-${col.id}" ${col.enabled ? 'checked' : ''} onchange="togglePrintStudioCol('${col.id}', this.checked)">
          <label for="chk-col-${col.id}" title="${escapeHtml(col.label)}">${escapeHtml(col.label)}</label>
        </div>
        <div class="print-col-width-box">
          <button type="button" 
                  class="btn-col-bold-toggle ${isBold ? 'active' : ''}" 
                  onclick="togglePrintStudioColBold('${col.id}')" 
                  title="${isBold ? 'Data is BOLD — click to make normal' : 'Data is NORMAL — click to make bold'}" 
                  ${!col.enabled ? 'disabled' : ''}>
            ${isBold ? '𝐁' : 'B'}
          </button>
          <input type="range" class="print-col-slider" min="3" max="50" value="${col.currentWidth}" ${!col.enabled ? 'disabled' : ''} oninput="updatePrintStudioColWidth('${col.id}', this.value)">
          <input type="number" class="print-col-num-input" min="3" max="50" value="${col.currentWidth}" ${!col.enabled ? 'disabled' : ''} onchange="updatePrintStudioColWidth('${col.id}', this.value)">
          <span class="print-col-pct" title="Effective normalized width on paper">${col.enabled ? `${normPct}%` : '—'}</span>
        </div>
      </div>
    `;
  }).join("");

  const badge = document.getElementById("preview-col-count-badge");
  if (badge) {
    badge.textContent = `${activeCols.length} Columns Selected`;
  }
}

window.togglePrintStudioColBold = function(colId) {
  const col = printStudioColumns.find(c => c.id === colId);
  if (col) {
    col.bold = !col.bold;
    renderPrintColumnControls();
    renderLiveA4Preview();
  }
};

window.togglePrintStudioCol = function(colId, isChecked) {
  const col = printStudioColumns.find(c => c.id === colId);
  if (col) {
    const activeCount = printStudioColumns.filter(c => c.enabled).length;
    if (!isChecked && activeCount <= 1) {
      showToast("At least one column must remain enabled for printing.", "info");
      renderPrintColumnControls();
      return;
    }
    col.enabled = isChecked;
    renderPrintColumnControls();
    renderLiveA4Preview();
  }
};

window.updatePrintStudioColWidth = function(colId, newWidth) {
  const widthVal = Math.max(3, Math.min(60, parseInt(newWidth, 10) || 10));
  const col = printStudioColumns.find(c => c.id === colId);
  if (col) {
    col.currentWidth = widthVal;
    renderPrintColumnControls();
    renderLiveA4Preview();
  }
};

function saveActivePrintPreset() {
  const presets = getPrintPresetsForSheet(printStudioActiveSheet);
  const preset = presets.find(p => p.id === printStudioCurrentPresetId);
  if (!preset) return;

  preset.orientation = printStudioOrientation;
  preset.headerFontSize = printStudioHeaderFontSize;
  preset.headerBold = printStudioHeaderBold;
  preset.headerPadding = printStudioHeaderPadding;
  preset.rowPadding = printStudioRowPadding;
  preset.totalPadding = printStudioTotalPadding;
  preset.bodyFontSize = printStudioBodyFontSize;
  preset.textAlign = printStudioTextAlign;
  preset.autoFit = printStudioAutoFit;
  preset.columns = printStudioColumns.map(c => ({
    id: c.id,
    enabled: c.enabled,
    width: c.currentWidth,
    bold: Boolean(c.bold)
  }));

  savePrintPresetsForSheet(printStudioActiveSheet, presets);
  showPrintStudioStatus(`✓ Layout "${preset.name}" کامیابی سے محفوظ ہوگیا!`, true);
}

function saveNewPrintPreset() {
  const name = prompt("Enter a name for your custom layout alignment (e.g. Daily Balance Print / کاریگر لسٹ):");
  if (!name || !name.trim()) return;

  const presets = getPrintPresetsForSheet(printStudioActiveSheet);
  const newId = "preset_" + Date.now();
  const newPreset = {
    id: newId,
    name: name.trim(),
    orientation: printStudioOrientation,
    headerFontSize: printStudioHeaderFontSize,
    headerBold: printStudioHeaderBold,
    headerPadding: printStudioHeaderPadding,
    rowPadding: printStudioRowPadding,
    totalPadding: printStudioTotalPadding,
    bodyFontSize: printStudioBodyFontSize,
    textAlign: printStudioTextAlign,
    autoFit: printStudioAutoFit,
    columns: printStudioColumns.map(c => ({
      id: c.id,
      enabled: c.enabled,
      width: c.currentWidth,
      bold: Boolean(c.bold)
    }))
  };

  presets.push(newPreset);
  savePrintPresetsForSheet(printStudioActiveSheet, presets);
  populatePrintPresetsDropdown(printStudioActiveSheet);
  applyPrintPreset(newId);
  showPrintStudioStatus(`✓ نیا Layout "${newPreset.name}" محفوظ ہوگیا!`, true);
}

function deleteActivePrintPreset() {
  if (printStudioCurrentPresetId === "default") {
    showPrintStudioStatus("ڈیفالٹ لے آؤٹ کو ڈیلیٹ نہیں کیا جاسکتا۔", false);
    return;
  }

  const presets = getPrintPresetsForSheet(printStudioActiveSheet);
  const target = presets.find(p => p.id === printStudioCurrentPresetId);
  if (!target) return;

  if (confirm(`Are you sure you want to delete the alignment "${target.name}"?`)) {
    const updated = presets.filter(p => p.id !== printStudioCurrentPresetId);
    savePrintPresetsForSheet(printStudioActiveSheet, updated);
    populatePrintPresetsDropdown(printStudioActiveSheet);
    applyPrintPreset(updated[0]?.id || "default");
    showPrintStudioStatus(`لے آؤٹ "${target.name}" ڈیلیٹ ہوگیا۔`, false);
  }
}

function resetPrintPresetsToDefault() {
  if (confirm("Reset layout alignments for this sheet back to factory defaults?")) {
    const defaults = PRINT_STUDIO_DEFAULTS[printStudioActiveSheet]?.presets || [];
    savePrintPresetsForSheet(printStudioActiveSheet, defaults);
    populatePrintPresetsDropdown(printStudioActiveSheet);
    applyPrintPreset("default");
    showPrintStudioStatus("Layouts ڈیفالٹ سیٹنگز پر بحال ہوگئے۔", true);
  }
}

function getPrintHeaderDate() {
  if (printStudioActiveSheet === "daily") {
    const reportDateEl = document.getElementById("daily-sheet-date");
    if (reportDateEl && reportDateEl.value) {
      const parts = reportDateEl.value.split("-");
      if (parts.length === 3) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const m = months[parseInt(parts[1], 10) - 1] || parts[1];
        return `${parts[2]}-${m}-${parts[0]}`;
      }
      return reportDateEl.value;
    }
  } else if (printStudioActiveSheet === "distribution") {
    const activePeriod = getActiveDistributionPeriod();
    if (activePeriod && activePeriod !== "all") return activePeriod;
  } else if (printStudioActiveSheet === "payment") {
    const periodFilter = (document.getElementById("filter-payment-period")?.value || "").trim();
    if (periodFilter && periodFilter !== "all") return periodFilter;
  }

  const d = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = String(d.getDate()).padStart(2, "0");
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

function getPrintHeaderTime() {
  const d = new Date();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

// -------------------------------------------------------------
// REAL-TIME A4 PREVIEW & RENDER ENGINE
// -------------------------------------------------------------
function renderLiveA4Preview() {
  const previewContainer = document.getElementById("a4-sheet-preview");
  if (!previewContainer) return;

  // Active Columns & Normalized Widths
  const activeCols = printStudioColumns.filter(c => c.enabled);
  if (activeCols.length === 0) {
    previewContainer.innerHTML = `<div style="text-align: center; padding: 3rem; color: #64748b;">No columns selected for printing. Please enable at least 1 column.</div>`;
    return;
  }

  const totalWeight = activeCols.reduce((sum, c) => sum + (c.currentWidth || 10), 0) || 1;
  const colsWithEffectiveWidth = activeCols.map(col => {
    const pct = printStudioAutoFit
      ? ((col.currentWidth / totalWeight) * 100).toFixed(2) + "%"
      : `${col.currentWidth}%`;
    return { ...col, effectiveWidth: pct };
  });

  // Pull active data according to sheet
  let rows = [];
  let totals = {};

  if (printStudioActiveSheet === "daily") {
    const finalStyles = window.db.getFinalStyles();
    const master = window.db.getMasterInventory();

    let sumCut = 0;
    let sumRec = 0;
    let sumStock = 0;
    let sumHemb = 0;

    rows = finalStyles.map((item, idx) => {
      const sMatch = master.find(m => 
        m.style_code.toLowerCase() === item.style_code.toLowerCase() &&
        m.category.toLowerCase() === item.category.toLowerCase()
      );
      const cut = sMatch ? (sMatch.cut_qty || 0) : 0;
      const rec = sMatch ? (sMatch.received_qty || 0) : 0;
      const stock = sMatch ? (sMatch.balance_from_stock || 0) : 0;
      const hemb = sMatch ? (sMatch.balance_from_hemb || 0) : 0;

      sumCut += cut;
      sumRec += rec;
      sumStock += stock;
      sumHemb += hemb;

      return {
        sr_no: idx + 1,
        style_code: item.style_code || "",
        category: item.category || "SHIRT",
        contractor: sMatch ? (sMatch.contractor_name || "-") : "-",
        cut_qty: cut,
        received_qty: rec,
        balance_stock: stock,
        balance_hemb: hemb,
        remarks: item.remarks || (sMatch ? (sMatch.remarks || "") : "")
      };
    });

    totals = {
      cut_qty: sumCut,
      received_qty: sumRec,
      balance_stock: sumStock,
      balance_hemb: sumHemb,
      count: rows.length
    };

  } else if (printStudioActiveSheet === "distribution") {
    const activePeriod = getActiveDistributionPeriod();
    const searchInput = document.getElementById("search-dist-input");
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

    let distList = window.db.getWorkDistribution();
    if (query) {
      distList = distList.filter(item => 
        (item.style_code && item.style_code.toLowerCase().includes(query)) ||
        (item.contractor_name && item.contractor_name.toLowerCase().includes(query)) ||
        (item.floor && item.floor.toLowerCase().includes(query)) ||
        (item.item && item.item.toLowerCase().includes(query)) ||
        (item.remarks && item.remarks.toLowerCase().includes(query)) ||
        (item.period && item.period.toLowerCase().includes(query))
      );
    } else if (activePeriod && activePeriod !== "all") {
      distList = distList.filter(item => (item.period || "").trim().toLowerCase() === activePeriod.trim().toLowerCase());
    }

    let sumPcs = 0;
    let sumTotal = 0;

    rows = distList.map((item, idx) => {
      const qty = parseInt(item.pcs_qty, 10) || 0;
      const rate = parseFloat(item.rate) || 0;
      const total = (item.total_amount != null && !isNaN(Number(item.total_amount))) ? Number(item.total_amount) : (qty * rate);

      sumPcs += qty;
      sumTotal += total;

      return {
        sr_no: item.sr_no || (idx + 1),
        style_code: item.style_code || "",
        contractor_name: item.contractor_name || "",
        pcs_qty: qty,
        rate: rate > 0 ? rate : "-",
        item: item.item || "SHIRT",
        floor: item.floor || "-",
        total: total > 0 ? Math.round(total) : 0,
        period: item.period || activePeriod || "-",
        remarks: item.remarks || ""
      };
    });

    totals = {
      pcs_qty: sumPcs,
      total: sumTotal,
      count: rows.length
    };

  } else if (printStudioActiveSheet === "payment") {
    const periodFilter = (document.getElementById("filter-payment-period")?.value || "").trim();
    const query = (document.getElementById("search-payment-style")?.value || "").trim().toLowerCase();

    let payList = window.db.getPaymentSheets();
    if (query) {
      payList = payList.filter(item =>
        (item.style_code && item.style_code.toLowerCase().includes(query)) ||
        (item.contractor_name && item.contractor_name.toLowerCase().includes(query)) ||
        (item.category && item.category.toLowerCase().includes(query)) ||
        (item.remarks && item.remarks.toLowerCase().includes(query)) ||
        (item.period && item.period.toLowerCase().includes(query))
      );
    } else if (periodFilter && periodFilter !== "all") {
      payList = payList.filter(item => (item.period || "").trim().toLowerCase() === periodFilter.trim().toLowerCase());
    }

    let sumCut = 0;
    let sumProd = 0;
    let sumStock = 0;
    let sumHemb = 0;
    let sumTotBal = 0;

    rows = payList.map((item, idx) => {
      const cutQty = item.cut_qty != null ? item.cut_qty : (item.total_pcs || 0);
      const prodQty = parseInt(item.prod_pcs_qty != null ? item.prod_pcs_qty : item.paid_pcs, 10) || 0;
      const carigarRate = parseFloat(item.carigar_rate) || 0;
      const commission = parseFloat(item.commission) || 0;
      const rateTotal = item.rate_total != null ? parseFloat(item.rate_total) : (carigarRate + commission);
      const stockBal = item.balance_from_stock != null ? item.balance_from_stock : 0;
      const hembBal = item.balance_from_hemb != null ? item.balance_from_hemb : 0;
      const totalBal = item.total_balance != null ? item.total_balance : (stockBal + hembBal);

      sumCut += cutQty;
      sumProd += prodQty;
      sumStock += stockBal;
      sumHemb += hembBal;
      sumTotBal += totalBal;

      return {
        sr_no: item.sr_no || (idx + 1),
        style_code: item.style_code || "",
        working: item.category || "SHIRT",
        contractor_name: item.contractor_name || "",
        rate: item.rate_per_pc || "-",
        cut_qty: cutQty,
        prod_pcs_qty: prodQty,
        carigar_rate: carigarRate > 0 ? carigarRate : "-",
        commission: commission > 0 ? commission : "-",
        rate_total: rateTotal > 0 ? rateTotal : "-",
        remarks: item.remarks || "",
        balance_stock: stockBal,
        balance_hemb: hembBal,
        total_balance: totalBal,
        period: item.period || periodFilter || "-"
      };
    });

    totals = {
      cut_qty: sumCut,
      prod_pcs_qty: sumProd,
      balance_stock: sumStock,
      balance_hemb: sumHemb,
      total_balance: sumTotBal,
      count: rows.length
    };
  }

  // Exact Header Strip Requested by User: Left Time, Center Hand Embroidery, Right Date
  const headerHtml = `
    <div class="print-strip-header" style="display: flex !important; justify-content: space-between !important; align-items: flex-end !important; padding-bottom: 5px !important; margin-bottom: 8px !important; border-bottom: 2px solid #000000 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif !important; color: #000000 !important; width: 100% !important;">
      <div style="font-size: 9.5pt; font-weight: 700; width: 30%; text-align: left; white-space: nowrap;">
        Time: ${getPrintHeaderTime()}
      </div>
      <div style="font-size: 13pt; font-weight: 900; letter-spacing: 0.06em; text-transform: uppercase; text-align: center; width: 40%; white-space: nowrap;">
        Hand Embroidery
      </div>
      <div style="font-size: 9.5pt; font-weight: 700; width: 30%; text-align: right; white-space: nowrap;">
        Date: ${getPrintHeaderDate()}
      </div>
    </div>
  `;

  // Render Table
  const tableHtml = `
    <table class="print-render-table" style="width: 100% !important; table-layout: fixed !important; border-collapse: collapse !important; border: 1.5px solid #000000 !important;">
      <colgroup>
        ${colsWithEffectiveWidth.map(c => `<col style="width: ${c.effectiveWidth};">`).join("")}
      </colgroup>
      <thead>
        <tr>
          ${colsWithEffectiveWidth.map(c => {
            const headAlign = printStudioTextAlign === 'auto' ? c.align : printStudioTextAlign;
            return `
              <th style="text-align: ${headAlign}; width: ${c.effectiveWidth}; font-size: ${printStudioHeaderFontSize}pt !important; font-weight: ${printStudioHeaderBold ? '800' : '500'} !important; padding: ${printStudioHeaderPadding}px 4px !important; line-height: 1.15; border: 1px solid #000000; background: #f1f5f9; color: #000000;">
                ${escapeHtml(c.label)}
              </th>
            `;
          }).join("")}
        </tr>
      </thead>
      <tbody>
        ${rows.length === 0 ? `
          <tr>
            <td colspan="${colsWithEffectiveWidth.length}" style="text-align: center; padding: 2rem; color: #64748b; font-size: ${printStudioBodyFontSize}pt;">
              No records found for the selected sheet criteria.
            </td>
          </tr>
        ` : rows.map(r => `
          <tr>
            ${colsWithEffectiveWidth.map(col => {
              const val = r[col.id];
              let cellContent = (val != null) ? escapeHtml(String(val)) : "-";
              const dataAlign = printStudioTextAlign === 'auto' ? col.align : printStudioTextAlign;
              let extraStyle = `text-align: ${dataAlign};`;

              if (typeof val === "number") {
                cellContent = val.toLocaleString();
                extraStyle += " font-family: monospace;";
              }
              if (col.id.includes("balance") || col.id === "total_balance") {
                if (Number(val) > 0) extraStyle += " color: #b91c1c;";
              }
              if (col.id === "total") {
                cellContent = `Rs. ${Number(val).toLocaleString()}`;
              }

              // Apply individual column bold setting
              const isColBold = Boolean(col.bold);
              extraStyle += ` font-weight: ${isColBold ? '800' : '400'} !important;`;

              const isRemarksCol = col.id.toLowerCase().includes("remark");
              if (isRemarksCol) {
                const rawText = val != null ? String(val).trim() : "";
                if (!rawText || rawText === "-") {
                  return `<td class="print-remarks-td" data-col="remarks" style="${extraStyle} font-size: ${printStudioBodyFontSize}pt !important; padding: ${printStudioRowPadding}px 3px !important; line-height: 1.15; border: 1px solid #475569; color: #000000; background: #ffffff; vertical-align: middle;">-</td>`;
                }

                // Check if text is multiple lines or long enough to wrap into 2 lines
                const isDoubleLine = rawText.includes("\n") || rawText.includes("\r") || rawText.length > 16;
                const formattedHtml = escapeHtml(rawText).replace(/\r?\n/g, "<br>");

                if (isDoubleLine) {
                  // Text spans double lines: scale font down so 2 lines fit in the exact same physical height as 1 regular line
                  const compactFontSize = Math.max(4.5, +(printStudioBodyFontSize * 0.62).toFixed(1));
                  return `
                    <td class="print-remarks-td" data-col="remarks" style="${extraStyle} padding: 0px 3px !important; border: 1px solid #475569; color: #000000; background: #ffffff; vertical-align: middle;">
                      <div class="print-remarks-container" style="font-size: ${compactFontSize}pt !important; line-height: 0.92 !important; letter-spacing: -0.01em; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; max-height: 100%; word-break: break-word;">
                        ${formattedHtml}
                      </div>
                    </td>
                  `;
                } else {
                  return `
                    <td class="print-remarks-td" data-col="remarks" style="${extraStyle} font-size: ${printStudioBodyFontSize}pt !important; padding: ${printStudioRowPadding}px 3px !important; line-height: 1.15; border: 1px solid #475569; color: #000000; background: #ffffff; vertical-align: middle;">
                      ${formattedHtml}
                    </td>
                  `;
                }
              }

              return `<td style="${extraStyle} font-size: ${printStudioBodyFontSize}pt !important; padding: ${printStudioRowPadding}px 3px !important; line-height: 1.15; border: 1px solid #475569; color: #000000; background: #ffffff; vertical-align: middle;">${cellContent}</td>`;
            }).join("")}
          </tr>
        `).join("")}
      </tbody>
      <tfoot>
        <tr class="print-total-row">
          ${colsWithEffectiveWidth.map((col, idx) => {
            const totAlign = printStudioTextAlign === 'auto' ? (idx === 0 ? 'center' : col.align) : printStudioTextAlign;
            const isColBold = Boolean(col.bold);
            const fontWeight = (idx === 0) ? '800' : (isColBold ? '900' : '500');
            if (idx === 0) {
              return `<td style="text-align: ${totAlign}; font-weight: 800; font-size: ${printStudioBodyFontSize}pt !important; padding: ${printStudioTotalPadding}px 4px !important; border: 1.5px solid #000000; background: #e2e8f0; color: #000000;">TOTAL</td>`;
            }
            if (col.id === "style_code") {
              return `<td style="text-align: ${totAlign}; font-weight: ${fontWeight}; font-size: ${printStudioBodyFontSize}pt !important; padding: ${printStudioTotalPadding}px 4px !important; border: 1.5px solid #000000; background: #e2e8f0; color: #000000;">${rows.length} Styles</td>`;
            }
            if (totals[col.id] != null) {
              const formattedVal = (col.id === "total")
                ? `Rs. ${Math.round(totals[col.id]).toLocaleString()}`
                : totals[col.id].toLocaleString();
              return `<td style="text-align: ${totAlign}; font-weight: ${fontWeight}; font-family: monospace; font-size: ${printStudioBodyFontSize}pt !important; padding: ${printStudioTotalPadding}px 4px !important; border: 1.5px solid #000000; background: #e2e8f0; color: #000000;">${formattedVal}</td>`;
            }
            return `<td style="border: 1.5px solid #000000; background: #e2e8f0; padding: ${printStudioTotalPadding}px 4px !important;"></td>`;
          }).join("")}
        </tr>
      </tfoot>
    </table>
  `;

  // Only the single-line header strip and the table! No extra text above or below!
  previewContainer.innerHTML = headerHtml + tableHtml;

  // Post-render remarks auto-fit guard: ensure no remarks cell stretches row height beyond single-line height
  adjustRemarksRowHeights(previewContainer);
}

function adjustRemarksRowHeights(container) {
  if (!container) return;
  const rows = container.querySelectorAll(".print-render-table tbody tr");
  rows.forEach(tr => {
    const remarksTd = tr.querySelector(".print-remarks-td");
    if (!remarksTd) return;
    
    const remarksDiv = remarksTd.querySelector(".print-remarks-container");
    const refTd = tr.querySelector("td:not(.print-remarks-td)");
    if (!refTd) return;
    
    const targetHeight = refTd.clientHeight || refTd.offsetHeight;
    
    // If remarks cell does not have container yet, but its height is taller than reference cell, convert it
    if (!remarksDiv && remarksTd.textContent.trim() && remarksTd.clientHeight > (targetHeight + 2)) {
      const text = remarksTd.innerHTML;
      const compactFontSize = Math.max(4.5, +(printStudioBodyFontSize * 0.62).toFixed(1));
      remarksTd.style.setProperty("padding", "0px 3px", "important");
      remarksTd.innerHTML = `
        <div class="print-remarks-container" style="font-size: ${compactFontSize}pt !important; line-height: 0.92 !important; letter-spacing: -0.01em; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; max-height: 100%; word-break: break-word;">
          ${text}
        </div>
      `;
    }
    
    // If it has remarksDiv, ensure it does not expand the row height
    const activeDiv = remarksTd.querySelector(".print-remarks-container");
    if (activeDiv) {
      let currentPt = parseFloat(activeDiv.style.fontSize) || +(printStudioBodyFontSize * 0.62).toFixed(1);
      let count = 0;
      while (count < 5 && tr.clientHeight > (targetHeight + 2) && currentPt > 4.2) {
        currentPt = +(currentPt - 0.4).toFixed(1);
        activeDiv.style.setProperty("font-size", `${currentPt}pt`, "important");
        count++;
      }
    }
  });
}

function executeStudioPrint() {
  const previewContent = document.getElementById("a4-sheet-preview")?.innerHTML;
  const printRoot = document.getElementById("print-studio-paper-root");
  if (!previewContent || !printRoot) {
    showToast("Unable to generate print document.", "error");
    return;
  }

  // Copy rendered vector A4 content to isolated print root
  printRoot.innerHTML = previewContent;
  printRoot.style.display = "block";

  // Dynamic @page orientation rule (Universal Chrome/Edge compatible syntax!)
  let pageStyle = document.getElementById("print-studio-dynamic-page-style");
  if (!pageStyle) {
    pageStyle = document.createElement("style");
    pageStyle.id = "print-studio-dynamic-page-style";
    document.head.appendChild(pageStyle);
  }

  pageStyle.textContent = `
    @page {
      size: ${printStudioOrientation};
      margin: 6mm;
    }
    @media print {
      body.is-printing-from-studio {
        background: #ffffff !important;
        color: #000000 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      body.is-printing-from-studio > *:not(#print-studio-paper-root) {
        display: none !important;
      }
      body.is-printing-from-studio #print-studio-paper-root {
        display: block !important;
        position: static !important;
        width: 100% !important;
        max-width: ${printStudioOrientation === 'landscape' ? '285mm' : '198mm'} !important;
        margin: 0 auto !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
      }
      body.is-printing-from-studio .print-render-table {
        width: 100% !important;
        table-layout: fixed !important;
      }
    }
  `;

  // Body printing state classes
  document.body.classList.add("is-printing-from-studio");
  if (printStudioOrientation === "landscape") {
    document.body.classList.add("print-landscape");
    document.body.classList.remove("print-portrait");
  } else {
    document.body.classList.add("print-portrait");
    document.body.classList.remove("print-landscape");
  }

  const cleanUpAfterPrint = () => {
    document.body.classList.remove("is-printing-from-studio", "print-landscape", "print-portrait");
    if (printRoot) {
      printRoot.style.display = "none";
      printRoot.innerHTML = "";
    }
    window.removeEventListener("afterprint", cleanUpAfterPrint);
  };

  window.addEventListener("afterprint", cleanUpAfterPrint);

  setTimeout(() => {
    window.print();
    setTimeout(cleanUpAfterPrint, 3500);
  }, 100);
}

