/* ==========================================================================
   NCT Stocks & Inventory V3 — Dashboard Application
   ========================================================================== */

/* ==========================================================================
   SIDEBAR DISPLAY CONFIGURATION
   ========================================================================== */
var SIDEBAR_ITEMS = [
  { view: "nsip",                display: "NSIP",                     dbProject: "NSIP" },
  { view: "nct-innosphere",      display: "NCT Innosphere",           dbProject: "NCT INNOSPHERE" },
  { view: "grand-ion-delemen",   display: "Grand Ion Delemen",        dbProject: "GRAND ION DELEMEN" },
  { view: "grand-ion-majestic",  display: "Grand Ion Majestic",       dbProject: "GRAND ION MAJESTIC" },
  { view: "ion-belian-garden",   display: "Ion Belian Garden",        dbProject: "ION BELIAN GARDEN" },
  { view: "mahkota-kampar",      display: "Mahkota Kampar",           dbProject: "MAHKOTA KAMPAR" },
  { view: "n-city",              display: "N-City",                   dbProject: "N-CITY" },
  { view: "vortex-business-park",display: "Vortex Business Park",     dbProject: "VORTEX BUSINESS PARK" },
  { view: "salak-perdana",       display: "Salak Perdana Business Park", dbProject: "SALAK PERDANA BUSINESS PARK" },
];

/* ==========================================================================
   PROJECT STATUS SYSTEM
   ========================================================================== */
var PROJECT_STATUS = {};
var PROJECT_STATUS_COLORS = {
  "Completed": { color: "#10b981", label: "Completed" },
  "Ongoing":   { color: "#fbbf24", label: "Ongoing" }
};

function getProjectStatus(projectName) {
  if (!projectName) return null;
  var normalized = projectName.toString().trim().toUpperCase();
  if (PROJECT_STATUS[normalized]) return PROJECT_STATUS[normalized];
  if (normalized.indexOf("NSIP") > -1 && normalized === "NSIP") return "Ongoing";
  if (normalized.indexOf("INNOSPHERE") > -1) return "Ongoing";
  return "Completed";
}

function getUnitTypeDisplay(unitType) {
  if (!unitType) return "Unknown";
  var upper = unitType.toUpperCase();
  if (UNIT_TYPE_DISPLAY_MAP[upper]) return UNIT_TYPE_DISPLAY_MAP[upper];
  if (UNIT_TYPE_DISPLAY_MAP[unitType]) return UNIT_TYPE_DISPLAY_MAP[unitType];
  return unitType;
}

function getBumiStatus(unitNo, projectName) {
  var bumiMapping = {
    "B6-01": "Bumi",
    "B8-01": "Bumi",
    "B9-09": "Bumi",
    "B6-03A": "Bumi",
    "B6-05": "Non-Bumi",
    "B6-08": "Bumi",
    "B8-02": "Bumi",
    "B8-03": "Bumi",
    "B8-03A": "Bumi",
    "B8-05": "Bumi",
    "B8-06": "Bumi",
    "B8-07": "Bumi",
    "B9-01": "Bumi",
    "B9-02": "Bumi",
    "B9-03": "Non-Bumi",
    "B9-03A": "Non-Bumi",
    "B9-05": "Bumi",
    "B9-06": "Non-Bumi",
    "B9-07": "Bumi",
    "B9-08": "Bumi"
  };

  if (!unitNo) return "-";
  var normalizedUnitNo = unitNo.toString().trim().toUpperCase();
  if (bumiMapping[normalizedUnitNo]) return bumiMapping[normalizedUnitNo];
  return "-";
}

function getProjectBorderColor(projectName) {
  var colorMap = {
    "GRAND ION DELEMEN": "#3b82f6",
    "ION BELIAN GARDEN": "#10b981",
    "GRAND ION MAJESTIC": "#f59e0b",
    "MAHKOTA KAMPAR": "#8b5cf6",
    "N-CITY": "#ef4444",
    "NCT SMART INDUSTRIAL PARK": "#06b6d4",
    "SALAK PERDANA BUSINESS PARK": "#f97316",
    "VORTEX BUSINESS PARK": "#ec4899",
    "NCT INNOSPHERE": "#6366f1"
  };

  var normalized = (projectName || "").toString().trim().toUpperCase();
  
  // N-City sub-projects (no standalone "N-City" card exists)
  if (normalized === "N-CITY COMMERCIAL" || normalized === "N-CITY CONVENTION HALL" || normalized === "RISE INTERNATIONAL SCHOOL") {
    return colorMap["N-CITY"];
  }
  
  // IBG sub-projects
  if (normalized.indexOf("ION BELIAN GARDEN") > -1) {
    return colorMap["ION BELIAN GARDEN"];
  }
  
  // Direct match
  if (colorMap[normalized]) return colorMap[normalized];
  
  return "#6b7280";
}

function getStatusColor(status) {
  if (!status) return "#9ca3af";
  return (PROJECT_STATUS_COLORS[status] || {}).color || "#9ca3af";
}

function getStatusLabel(status) {
  if (!status) return "Unknown";
  return (PROJECT_STATUS_COLORS[status] || {}).label || "Unknown";
}

function isProjectOngoing(projectName) {
  return getProjectStatus(projectName) === "Ongoing";
}

function createStatusIndicator(status, showLabel) {
  var dot = document.createElement("span");
  dot.className = "project-status-indicator";
  dot.style.display = "inline-flex";
  dot.style.alignItems = "center";
  dot.style.gap = "6px";
  dot.style.flexShrink = "0";
  dot.style.whiteSpace = "nowrap";
  var color = getStatusColor(status);
  var label = showLabel ? '<span style="font-size:11px;font-weight:600;color:' + color + ';text-transform:capitalize;">' + getStatusLabel(status) + '</span>' : '';
  dot.innerHTML =
    '<span style="width:10px;height:10px;border-radius:50%;background:' + color + ';display:inline-block;box-shadow:0 0 0 2px ' + color + '33;"></span>' +
    label;
  return dot;
}

function appendStatusToNavItem(item, status) {
  var label = item.querySelector(".nav-label");
  if (!label) return;
  var existing = item.querySelector(".project-status-indicator");
  if (existing) existing.remove();
  var indicator = createStatusIndicator(status, false);
  item.appendChild(indicator);
}

var VIEW_TO_DB = {};
var DB_TO_VIEW = {};
SIDEBAR_ITEMS.forEach(function(item) {
  VIEW_TO_DB[item.view] = item.dbProject;
  DB_TO_VIEW[item.dbProject] = item.view;
});

/* ==========================================================================
   DYNAMIC PROJECT CONFIG
   ========================================================================== */
var PROJECT_CONFIG = [];
var HOME_KPI_ORDER = [];
var PROJECT_SLUG_MAP = {};

var UNIT_TYPE_DISPLAY_MAP = {
  "STUDIO": "Studio Unit",
  "1BR": "1-Bedroom Unit",
  "2BR": "2-Bedroom Unit",
  "3BR": "3-Bedroom Unit",
  "PENTHOUSE": "Penthouse Unit",
  "DUPLEX (3R+3B)": "Duplex Unit (3 Bedrooms + 3 Bathrooms)",
  "INTERMEDIATE LOT": "Intermediate Lot",
  "INTERMEDIATE": "Intermediate Lot",
  "CORNER LOT": "Corner Lot",
  "CORNER": "Corner Lot",
  "END LOT": "End Lot",
  "CORPORATE OFFICE TYPE A1": "Corporate Office – Type A1",
  "CORPORATE OFFICE TYPE A2": "Corporate Office – Type A2",
  "CORPORATE OFFICE TYPE B1": "Corporate Office – Type B1",
  "CORPORATE OFFICE TYPE B2": "Corporate Office – Type B2",
  "CORPORATE OFFICE TYPE B3": "Corporate Office – Type B3",
};

var HIGHRISE_PROJECTS = {
  "GRAND ION DELEMEN": true,
  "GRAND ION MAJESTIC": true,
};

var MAJESTIC_PHASE_DISPLAY = {
  "Phase 5": "Phase 5 (M1)",
  "Phase 4": "Phase 4 (M2)",
  "Phase 6": "Phase 6 (M3)"
};

function getMajesticPhaseDisplay(phase) {
  if (!phase) return phase;
  return MAJESTIC_PHASE_DISPLAY[phase] || phase;
}

var PROJECT_DISPLAY_ORDER = [
  "NSIP",
  "NCT INNOSPHERE",
  "ION BELIAN GARDEN",
  "MAHKOTA KAMPAR",
  "N-CITY",
  "VORTEX BUSINESS PARK",
  "SALAK PERDANA BUSINESS PARK",
  "GRAND ION DELEMEN",
  "GRAND ION MAJESTIC",
];

function buildProjectConfigFromData(units) {
  var projects = [];
  var seen = {};
  units.forEach(function(u) {
    var p = (u.Project || "").toString().trim();
    if (p && !seen[p]) { seen[p] = true; projects.push(p); }
  });
  projects.sort();

  var priority = {};
  PROJECT_DISPLAY_ORDER.forEach(function(name, idx) { priority[name] = idx; });
  projects.sort(function(a, b) {
    var aKey = (a || "").toString().trim().toUpperCase();
    var bKey = (b || "").toString().trim().toUpperCase();
    var aP = priority[aKey] !== undefined ? priority[aKey] : 999;
    var bP = priority[bKey] !== undefined ? priority[bKey] : 999;
    return aP - bP;
  });

  PROJECT_CONFIG = [];
  HOME_KPI_ORDER = [];
  PROJECT_SLUG_MAP = {};

  projects.forEach(function(p) {
    var slug = DB_TO_VIEW[p] || p.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    var icon = "fa-building";
    if (p.indexOf("NSIP") > -1) icon = "fa-map";
    else if (p.indexOf("MAJESTIC") > -1) icon = "fa-city";
    else if (p.indexOf("GARDEN") > -1 || p.indexOf("BELIAN") > -1) icon = "fa-tree";
    else if (p.indexOf("KAMPAR") > -1) icon = "fa-landmark";
    else if (p.indexOf("N-CITY") > -1 || p.indexOf("NCITY") > -1) icon = "fa-draw-polygon";
    else if (p.indexOf("DELEMEN") > -1) icon = "fa-building";

    var hasMap = (p.indexOf("NSIP") > -1);
    PROJECT_CONFIG.push({ slug: slug, name: p, icon: icon, hasMap: hasMap, label: p });
    HOME_KPI_ORDER.push(p);
    PROJECT_SLUG_MAP[p] = slug;
  });
}

function getProjectConfig(slug) {
  for (var i = 0; i < PROJECT_CONFIG.length; i++) {
    if (PROJECT_CONFIG[i].slug === slug) return PROJECT_CONFIG[i];
  }
  return null;
}

/* ==========================================================================
   SIDEBAR & NAVIGATION
   ========================================================================== */
document.addEventListener("DOMContentLoaded", function() {
  try { bindSidebarToggle(); } catch (e) { console.error("Sidebar toggle error:", e); }
  try { bindSidebarNavigation(); } catch (e) { console.error("Sidebar nav error:", e); }
});

function bindSidebarToggle() {
  var s = document.getElementById("sidebar");
  var m = document.getElementById("mainContent");
  var b = document.getElementById("sidebarToggle");
  var i = document.getElementById("toggleIcon");
  if (!b || !s || !m) return;
  b.addEventListener("click", function() {
    s.classList.toggle("collapsed");
    m.classList.toggle("expanded");
    if(i) i.className = s.classList.contains("collapsed") ? "fas fa-chevron-right" : "fas fa-chevron-left";
    // Recalculate grouped KPI borders after sidebar animation completes
    setTimeout(updateGroupedCardBorders, 300);
  });
}

// Responsive border recalculation using ResizeObserver
function initResponsiveBorderUpdate() {
  var kpiContainer = document.querySelector('.dashboard-kpi-container');
  if (!kpiContainer) return;
  
  var resizeObserver = new ResizeObserver(function() {
    updateGroupedCardBorders();
  });
  
  resizeObserver.observe(kpiContainer);
}

// Initialize responsive border updates on app startup
function initApp() {
  try {
    console.log("NCT V3 - initApp starting...");
    renderHomeDashboard();
    bindHeaderUserDropdown();
    // Recalculate grouped KPI borders after initial render completes
    setTimeout(updateGroupedCardBorders, 300);
    // Initialize ResizeObserver for responsive border updates
    initResponsiveBorderUpdate();
    // Show admin sidebar if user is nct_admin
    var userEmail = sessionStorage.getItem("nct_user_email") || localStorage.getItem("nct_user_email") || "";
    if (userEmail) {
      fetch("/api/auth/me?email=" + encodeURIComponent(userEmail))
        .then(function(res) { return res.json(); })
        .then(function(userData) {
          if (userData && userData.user_type_raw === "nct_admin") {
            showAdminSidebar();
          }
        })
        .catch(function() {});
    }
    console.log("NCT V3 - initApp loaded");
  } catch(e) { console.error("initApp fatal:", e); }
}

function activateSidebarItem(view) {
  var items = document.querySelectorAll(".nav-item");
  var panels = document.querySelectorAll(".view-panel");
  for (var j = 0; j < items.length; j++) items[j].classList.remove("active");

  // NSIP subpages: highlight the parent NSIP nav item
  var activeView = view;
  if (view === "nsip-km1" || view === "nsip-km2" || view === "nsip-km3" ||
      view === "nsip-km4" || view === "nsip-km5" || view === "nsip-km6" ||
      view === "svg-map") {
    activeView = "nsip";
  }

  var targetItem = document.querySelector('.nav-item[data-view="' + activeView + '"]');
  if (targetItem) targetItem.classList.add("active");
  for (var k = 0; k < panels.length; k++) {
    panels[k].classList.remove("active");
    panels[k].style.display = "none";
  }
  var panelId = document.getElementById("view-" + view);
  if (panelId) { panelId.classList.add("active"); panelId.style.display = "block"; }
}

function collapseNsipSubmenu() {
  var parent = document.querySelector('.nav-parent[data-view="nsip"]');
  var children = document.getElementById("navChildren-nsip");
  if (parent && children) {
    parent.classList.remove("expanded");
    children.classList.remove("open");
    var icon = parent.querySelector(".nav-expand-icon i");
    if (icon) icon.className = "fas fa-chevron-right";
  }
}

function bindHeadOfficeNavigation() {
  var hoItem = document.querySelector('.nav-item[data-view="head-office"]');
  if (!hoItem) return;
  hoItem.addEventListener("click", function() {
    activateSidebarItem("head-office");
    renderHeadOffice();
  });
}

function updateSidebarStatusIndicators() {
  SIDEBAR_ITEMS.forEach(function(item) {
    if (!item.dbProject || item.view === "nsip") return;
    var el = document.querySelector('.nav-item[data-view="' + item.view + '"]');
    if (el) appendStatusToNavItem(el, getProjectStatus(item.dbProject));
  });
  var nsipItem = document.querySelector('.nav-item[data-view="nsip"]');
  if (nsipItem) appendStatusToNavItem(nsipItem, getProjectStatus("NSIP"));
}

function bindSidebarNavigation() {
  try { bindHeadOfficeNavigation(); } catch(e) { console.error("Head Office nav error:", e); }
  var parents = document.querySelectorAll(".nav-parent");
  for (var p = 0; p < parents.length; p++) {
    (function(parent) {
      parent.addEventListener("click", function(e) {
        e.stopPropagation();
        parent.classList.toggle("expanded");
        var children = parent.nextElementSibling;
        if (children && children.classList.contains("nav-children")) {
          children.classList.toggle("open");
          var icon = parent.querySelector(".nav-expand-icon i");
          if (icon) icon.className = children.classList.contains("open") ? "fas fa-chevron-down" : "fas fa-chevron-right";
        }
      });
    })(parents[p]);
  }

  var items = document.querySelectorAll(".nav-item");
  for (var i = 0; i < items.length; i++) {
    (function(item) {
      item.addEventListener("click", function() {
        var view = item.getAttribute("data-view");
        if (!view) return;
        if (item.classList.contains("nav-parent")) return;

        if (view === "data-management") { activateSidebarItem("data-management"); renderDataManagementView(); return; }
        if (view === "user-management") { activateSidebarItem("user-management"); renderUserManagementView(); return; }
        if (view === "head-office") { activateSidebarItem("head-office"); renderHeadOffice(); return; }
        if (view === "nsip-km1") { activateSidebarItem("nsip-km1"); collapseNsipSubmenu(); renderNsipKm1View(); return; }
        if (view === "n-city") { activateSidebarItem("n-city"); renderNcityView(); return; }
        if (view === "nsip-km2") { activateSidebarItem(view); collapseNsipSubmenu(); renderNsipKm2View(); return; }
        if (view === "nsip-km3" || view === "nsip-km4" || view === "nsip-km5" || view === "nsip-km6") {
          activateSidebarItem(view); collapseNsipSubmenu(); renderComingSoon(view); return;
        }
        if (view === "nsip-overall-layout") { activateSidebarItem("nsip-overall-layout"); collapseNsipSubmenu(); renderNsipOverallLayoutView(); return; }
        if (view === "nct-innosphere") { activateSidebarItem(view); renderNctInnosphereView(); return; }
        if (view === "ion-belian-garden-commercial") { activateSidebarItem("ion-belian-garden-commercial"); collapseIonBelianGardenSubmenu(); renderIbgCommercialView(); return; }
        if (view === "ion-belian-garden-residential") { activateSidebarItem("ion-belian-garden-residential"); collapseIonBelianGardenSubmenu(); renderIbgResidentialView(); return; }
        if (view === "n-city-commercial") { activateSidebarItem("n-city-commercial"); collapseNcitySubmenu(); renderNcityCommercialView(); return; }
        if (view === "n-city-rise") { activateSidebarItem("n-city-rise"); collapseNcitySubmenu(); renderNcityRiseView(); return; }
        if (view === "n-city-convention-hall") { activateSidebarItem("n-city-convention-hall"); collapseNcitySubmenu(); renderNcityConventionHallView(); return; }
        if (view === "salak-perdana") { activateSidebarItem(view); renderProjectView(view); return; }
        if (view === "logout") { handleLogout(); return; }
        if (view === "media") { activateSidebarItem(view); renderMediaView(); return; }
        if (view === "user-profile") { activateSidebarItem(view); loadUserProfileView(); return; }
        if (view === "admin-profile") { activateSidebarItem(view); loadAdminProfileView(); return; }
        if (view === "svg-map") { activateSidebarItem("nsip-km1"); collapseNsipSubmenu(); renderNsipKm1View(); return; }

        activateSidebarItem(view);
        if (view === "home") renderHomeDashboard();
        else if (getProjectConfig(view)) renderProjectView(view);
      });
    })(items[i]);
  }
}

function renderComingSoon(view) {
  var panel = document.getElementById("view-" + view);
  if (!panel) return;
  var label = view.indexOf("nsip-") === 0 ? "NSIP " + view.split("-")[1].toUpperCase() : view.toUpperCase().replace(/-/g, " ");
  panel.innerHTML =
    '<div class="page-header"><div><h1>' + label + '</h1><div class="header-sub">Project Dashboard</div></div>' +
    '  <div class="data-extracted-box"><div class="de-label">Updated as of</div><div class="de-date">15 July 2026</div></div></div>' +
    '<div class="card staging-placeholder" style="text-align:center;padding:80px 20px;">' +
    '  <i class="fas fa-clock" style="font-size:64px;color:var(--corporate-orange);margin-bottom:20px;display:block;"></i>' +
    '  <h3 style="font-size:24px;margin-bottom:12px;">Coming Soon</h3>' +
    '  <p style="color:var(--text-secondary);font-size:15px;">' + label + ' project data will be available in a future update.</p></div>';
}

function renderWaitingForData(view) {
  var panel = document.getElementById("view-" + view);
  if (!panel) return;
  var label = view.split("-").map(function(w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(" ");
  var isNctInnosphere = view === "nct-innosphere";
  var dateText = isNctInnosphere ? "Not Available" : "15 July 2026";
  var status = isNctInnosphere ? getProjectStatus("NCT INNOSPHERE") : null;
  var statusHtml = status ? renderStatusDot(status) : '';
  var projectName = isNctInnosphere ? "NCT INNOSPHERE" : null;
  
  panel.innerHTML =
    '<div class="page-header">' +
    '  <div style="display:flex;justify-content:space-between;align-items:center;flex:1;">' +
    '    <div><h1 style="margin-right:12px;">' + label + '</h1><div class="header-sub">Project Dashboard</div></div>' +
    '    <div style="flex-shrink:0;">' + statusHtml + '</div>' +
    '  </div>' +
    '  <div class="data-extracted-box"><div class="de-label">Updated as of</div><div class="de-date">' + dateText + '</div></div>' +
    '</div>' +
    '<div class="project-image-banner" id="project-image-' + view + '" style="background:#000000;border-radius:10px;overflow:hidden;margin-bottom:20px;position:relative;cursor:pointer;" title="Double-click to view full image">' +
    '  <div style="display:flex;align-items:center;justify-content:center;min-height:200px;max-height:400px;padding:20px;">' +
    '    <div style="color:#9ca3af;font-size:14px;"><i class="fas fa-spinner fa-spin" style="font-size:24px;display:block;margin-bottom:8px;"></i>Loading project image...</div>' +
    '  </div>' +
    '</div>' +
    '<div class="project-kpi-container">' +
    '  <div class="card project-kpi-box"><div class="project-kpi-label"><i class="fas fa-building" style="color:var(--corporate-orange);margin-right:8px;"></i>Total Units</div><div class="project-kpi-value">0</div></div>' +
    '  <div class="card project-kpi-box"><div class="project-kpi-label"><i class="fas fa-check-circle" style="color:var(--corporate-orange);margin-right:8px;"></i>Available Units</div><div class="project-kpi-value">0</div></div>' +
    '  <div class="card project-kpi-box"><div class="project-kpi-label"><i class="fas fa-handshake" style="color:var(--corporate-orange);margin-right:8px;"></i>Sold</div><div class="project-kpi-value">0</div></div>' +
    '  <div class="card project-kpi-box"><div class="project-kpi-label"><i class="fas fa-clock" style="color:var(--corporate-orange);margin-right:8px;"></i>Reserved</div><div class="project-kpi-value">0</div></div>' +
    '</div>';

  if (projectName) {
    loadProjectImageBanner(view, projectName);
  }
}

/* ==========================================================================
   HARDCODED LAYOUT PLAN BALANCE (No database, no API, no calculation)
   ========================================================================== */
var PROJECT_LAYOUT_BALANCE = {
  "NCT SMART INDUSTRIAL PARK KM1": "Bal 63 / 270 units",
  "ION BELIAN GARDEN — COMMERCIAL": "Bal 1 / 9 units",
  "ION BELIAN GARDEN — RESIDENTIAL": "1/1167 units",
  "MAHKOTA KAMPAR": "Bal 23/24 units",
  "N-CITY — COMMERCIAL": "Bal 30 / 122 units",
  "N-CITY — RISE INTERNATIONAL SCHOOL": "Bal 10 / 122 units",
  "N-CITY — CONVENTION HALL": "Bal 1 / 1 units",
  "VORTEX BUSINESS PARK": "Bal 2 / 90 units",
  "SALAK PERDANA BUSINESS PARK": "Bal 11 / 260 units",
  "GRAND ION DELEMEN": "Bal 92 / 1148 units",
  "GRAND ION MAJESTIC": "Bal 96 / 1885 units"
};

/* ==========================================================================
   PROJECT DETAILS DATA
   ========================================================================== */
var PROJECT_DETAILS_DATA = {
  "N-CITY — COMMERCIAL": {
    tenure: "Leasehold (Balance 91 Years, Expiry: June 2117)",
    vpDate: "Phase 2 : June 2022",
    bookingFee: "RM5,000",
    bumiDiscount: "Additional 5% before rebate",
    salePackage: [
      "28% Rebate",
      "Free Legal Fees on SPA & Loan Agreement",
      "Free Loan Agreement Stamp Duty",
      "Free Valuation Fee"
    ],
    salesCommission: "5% from nett price upon full drawdown"
  },
  "VORTEX BUSINESS PARK": {
    tenure: "Freehold",
    vpDate: "November 2020",
    bookingFee: "RM10,000",
    bumiDiscount: "-",
    salePackage: [
      "25% Rebate",
      "Free Legal Fees on SPA & Loan Agreement",
      "Free Loan Agreement Stamp Duty",
      "Free Valuation Fee",
      "Free MOT"
    ],
    salesCommission: "3%"
  },
  "MAHKOTA KAMPAR": {
    tenure: "Leasehold (Balance 91 Years, Expiry: August 2117)",
    vpDate: "Phase 4 : September 2025",
    bookingFee: "RM2,000",
    bumiDiscount: "-",
    salePackage: [
      "40% Rebate",
      "Free Legal Fees on SPA & Loan Agreement",
      "Free Loan Agreement Stamp Duty",
      "Free Valuation Fee",
      "Free MOT"
    ],
    salesCommission: "TBC"
  },
  "NCT SMART INDUSTRIAL PARK KM1": {
    tenure: "Leasehold",
    vpDate: "-",
    bookingFee: "RM5,000",
    bumiDiscount: "-",
    salePackage: [
      "Semi D, Cluster, Detached",
      "10% Downpayment Rebate",
      "Additional 2% rebate if buyer executes the SPA & Loan Agreement, or submits a Cash Purchase Letter, within 60 days from the Booking Date",
      "Free Legal Fees for SPA & Loan Agreement",
      "Free Loan Agreement Stamp Duty",
      "Free MOT (maximum capped at 4% of SPA price)"
    ],
    salesCommission: "-"
  },
  "ION BELIAN GARDEN — COMMERCIAL": {
    tenure: "Freehold",
    vpDate: "January 2026",
    bookingFee: "RM5,000",
    bumiDiscount: "-",
    salePackage: [
      "10% Rebate",
      "Free Legal Fees on SPA & Loan Agreement",
      "Free Loan Agreement Stamp Duty"
    ],
    salesCommission: "RM18,000 per unit"
  }
};

function renderProjectDetails(projectName) {
  var data = PROJECT_DETAILS_DATA[projectName];
  if (!data) return '';
  
  var salePackageHtml = '';
  if (data.salePackage && data.salePackage.length > 0) {
    salePackageHtml = '<ul style="margin:0;padding-left:18px;line-height:1.6;">';
    data.salePackage.forEach(function(item) {
      salePackageHtml += '<li>' + esc(item) + '</li>';
    });
    salePackageHtml += '</ul>';
  } else {
    salePackageHtml = esc(data.salePackage || '-');
  }
  
  return '' +
    '<div class="card" style="margin-bottom:20px;">' +
    '  <div class="card-header">' +
    '    <span class="card-title"><i class="fas fa-info-circle"></i> PROJECT DETAILS</span>' +
    '  </div>' +
    '  <div class="table-wrapper" style="overflow-x:auto;">' +
    '    <table class="asset-table" style="width:100%;border-collapse:collapse;">' +
    '      <thead>' +
    '        <tr style="background:#f8fafc;border-bottom:2px solid #eef0f4;">' +
    '          <th style="width:30%;padding:12px 16px;text-align:left;font-size:12px;font-weight:700;color:#5e6778;text-transform:uppercase;letter-spacing:0.4px;">Property</th>' +
    '          <th style="width:70%;padding:12px 16px;text-align:left;font-size:12px;font-weight:700;color:#5e6778;text-transform:uppercase;letter-spacing:0.4px;">Details</th>' +
    '        </tr>' +
    '      </thead>' +
    '      <tbody>' +
    '        <tr style="border-bottom:1px solid #f4f6fa;">' +
    '          <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#0f2042;vertical-align:top;">Tenure</td>' +
    '          <td style="padding:12px 16px;font-size:13px;color:#1a1d23;vertical-align:top;">' + esc(data.tenure) + '</td>' +
    '        </tr>' +
    '        <tr style="border-bottom:1px solid #f4f6fa;background:#fafbfc;">' +
    '          <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#0f2042;vertical-align:top;">VP Date</td>' +
    '          <td style="padding:12px 16px;font-size:13px;color:#1a1d23;vertical-align:top;">' + esc(data.vpDate) + '</td>' +
    '        </tr>' +
    '        <tr style="border-bottom:1px solid #f4f6fa;">' +
    '          <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#0f2042;vertical-align:top;">Booking Fee</td>' +
    '          <td style="padding:12px 16px;font-size:13px;color:#1a1d23;vertical-align:top;">' + esc(data.bookingFee) + '</td>' +
    '        </tr>' +
    '        <tr style="border-bottom:1px solid #f4f6fa;background:#fafbfc;">' +
    '          <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#0f2042;vertical-align:top;">Bumi Discount</td>' +
    '          <td style="padding:12px 16px;font-size:13px;color:#1a1d23;vertical-align:top;">' + esc(data.bumiDiscount) + '</td>' +
    '        </tr>' +
    '        <tr style="border-bottom:1px solid #f4f6fa;">' +
    '          <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#0f2042;vertical-align:top;">Sales Package</td>' +
    '          <td style="padding:12px 16px;font-size:13px;color:#1a1d23;vertical-align:top;">' + salePackageHtml + '</td>' +
    '        </tr>' +
    '        <tr style="background:#fafbfc;">' +
    '          <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#0f2042;vertical-align:top;">Sales Commission</td>' +
    '          <td style="padding:12px 16px;font-size:13px;color:#1a1d23;vertical-align:top;">' + esc(data.salesCommission) + '</td>' +
    '        </tr>' +
    '      </tbody>' +
    '    </table>' +
    '  </div>' +
    '</div>';
}

function getLayoutBalance(projectName) {
  return PROJECT_LAYOUT_BALANCE[projectName] || '';
}

function renderLayoutPlanHeader(balanceText) {
  return '<div class="card" style="padding:12px 16px;margin-bottom:0;background:#f8fafc;border:1px solid #eef0f4;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06);display:flex;align-items:center;"><span class="card-title" style="flex-shrink:0;"><i class="fas fa-map"></i> LAYOUT PLAN</span><span style="margin-left:auto;font-size:14px;font-weight:700;color:#0f2042;white-space:nowrap;">' + balanceText + '</span></div>';
}

/* ==========================================================================
    GRAND ION DELEMEN SUBSALE UNITS
    ========================================================================== */
var GID_SUBSALE_UNITS = new Set([
  "E2-22-05","E3-11-01","E3-12-01","E3-18-03","E7-36-01","E7-36-03","E2-13A-09","E3-8-01","E3-8-02","E3-8-03","E3-9-01","E3-9-02","E3-9-03","E4-22-10","E1-23A-03","E1-23A-03A","E2-10-09","E2-22-01","E3-10-03","E3-1-01","E3-1-02","E3-1-03","E3-1-05","E3-1-06","E3-11-02","E3-11-03","E3-11-06","E3-12-02","E3-12-03","E3-13A-01","E3-13A-02","E3-13A-03","E3-15-01","E3-15-03","E3-16-01","E3-16-02","E3-17-01","E3-18-01","E3-19-01","E3-19-03A","E3-20-03","E3-20-06","E3-2-01","E3-2-03","E3-2-03A","E3-2-05","E3-21-01","E3-21-03","E3-22-01","E3-22-03A","E3-23-01","E3-23-03","E3-23A-01","E3-23A-03","E3-23A-03A","E3-3-03","E3-3-03A","E3-3-05","E3-03A-01","E3-03A-02","E3-03A-03","E3-03A-05","E3-5-01","E3-5-02","E3-5-03","E3-5-05","E3-6-02","E3-6-03A","E3-7-01","E3-7-02","E3-7-03","E3-7-03A","E3-7-05","E3-8-03A","E4-6-01","E4-7-01","E4-7-10","E4-9-10","E4-10-01","E4-11-01","E4-12-01","E4-13-01","E4-13A-01","E4-13A-10","E4-15-01","E4-17-01","E4-19-01","E4-21-01","E4-21-10","E4-23-01","E4-23A-01","E4-23A-02"
]);

function isDisplayAvailable(unit) {
  if (!unit) return false;
  var project = (unit.Project || "").toString().trim().toUpperCase();
  if (project !== "GRAND ION DELEMEN") {
    var status = (unit.Status || "").toString().trim().toLowerCase();
    return status === "available";
  }
  var isAvailable = (unit.Status || "").toString().trim().toLowerCase() === "available";
  var unitNo = (unit.Unit_No || "").toString().trim().toUpperCase();
  return isAvailable || GID_SUBSALE_UNITS.has(unitNo);
}

/* ==========================================================================
    UTILITIES
    ========================================================================== */
function esc(s) { return (s === undefined || s === null || s === "") ? "-" : String(s); }

function formatPrice(val) {
  try {
    if (!val || Number(val) === 0) return "-";
    return "RM " + Number(val).toLocaleString("en-MY", {minimumFractionDigits:0, maximumFractionDigits:0});
  } catch(e) { return "-"; }
}

function formatPriceValue(val) {
  try {
    if (!val || Number(val) === 0) return "-";
    return Number(val).toLocaleString("en-MY", {minimumFractionDigits:0, maximumFractionDigits:0});
  } catch(e) { return "-"; }
}

/* Natural sort: alphabetical prefix first, then numeric sequence (A1, A2, A10, B1, B2, B10) */
function compareUnitType(a, b) {
  var aStr = String(a === null || a === undefined ? "" : a);
  var bStr = String(b === null || b === undefined ? "" : b);
  var aMatch = aStr.match(/^([A-Za-z]+)[\s-]*(\d+)$/);
  var bMatch = bStr.match(/^([A-Za-z]+)[\s-]*(\d+)$/);
  if (aMatch && bMatch) {
    var aLetter = aMatch[1].toUpperCase();
    var bLetter = bMatch[1].toUpperCase();
    if (aLetter !== bLetter) return aLetter < bLetter ? -1 : 1;
    var aNum = parseInt(aMatch[2], 10);
    var bNum = parseInt(bMatch[2], 10);
    if (aNum !== bNum) return aNum - bNum;
    return 0;
  }
  return aStr.localeCompare(bStr);
}

/* GID subsale units display as Available in the frontend only (database unchanged) */
function getDisplayStatus(u) {
  if (!u) return "-";
  var project = (u.Project || "").toString().trim().toUpperCase();
  if (project === "GRAND ION DELEMEN") {
    var unitNo = (u.Unit_No || "").toString().trim().toUpperCase();
    if (GID_SUBSALE_UNITS.has(unitNo)) return "Available";
  }
  return esc(u.Status || "");
}

function formatArea(val) {
  try {
    if (val === null || val === undefined || val === "") return "-";
    var num = Number(val);
    if (isNaN(num)) return "-";
    return num.toFixed(2);
  } catch(e) { return "-"; }
}

function computePrice(u) {
  try {
    var mode = (u.SaleOrSubSale || "").toString().trim().toLowerCase();
    if (mode === "sale") return Number(u.Listing_Price) || 0;
    if (mode === "sub-sale" || mode === "subsale" || mode === "sub sale") return Number(u.SPA_Signed_Price) || 0;
    return Number(u.Price) || Number(u.Listing_Price) || Number(u.SPA_Signed_Price) || 0;
  } catch(e) { return 0; }
}

function isAvailable(u) {
  try { return isDisplayAvailable(u); } catch(e) { return false; }
}

function computeAvailableUnits(units) {
  return units.filter(function(u) { return isDisplayAvailable(u); }).length;
}

function computeGrandTotalPrice(units) {
  return units.reduce(function(acc, u) { return acc + computePrice(u); }, 0);
}

/* Total SPA Price of ONLY the units displayed in the Available Unit List (single source of truth) */
function computeDisplayedTotalPrice(units) {
  return units.filter(isDisplayAvailable).reduce(function(acc, u) { return acc + computePrice(u); }, 0);
}

/* ==========================================================================
   DATA CACHE
   ========================================================================== */
function fetchAllUnitsCached() {
  try {
    if (window.__allUnitsPromise) return window.__allUnitsPromise;
    window.__allUnitsPromise = fetch("/api/units/all")
      .then(function(res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
      .then(function(data) {
        var arr = Array.isArray(data) ? data : [];
        window.__allUnits = arr;
        window.currentInventoryData = arr;
        buildProjectConfigFromData(arr);
        return arr;
      })
      .catch(function(err) {
        console.error("fetchAllUnitsCached error:", err);
        window.__allUnits = [];
        window.currentInventoryData = [];
        return [];
      });
    return window.__allUnitsPromise;
  } catch(e) { return Promise.resolve([]); }
}

/* ==========================================================================
   LAZY HIERARCHY RENDERER
   ========================================================================== */
var __hierarchyState = {};

function getOrInitState(key) {
  if (!__hierarchyState[key]) __hierarchyState[key] = {};
  return __hierarchyState[key];
}

function toggleLevel(state, key) {
  state[key] = !state[key];
  return state[key];
}

function renderHeadOffice() {
  var panel = document.getElementById("view-head-office");
  if (!panel) return;
  panel.innerHTML =
    '<div class="page-header">' +
    '  <div><h1>Head Office</h1><div class="header-sub">NCT Alliance Berhad</div></div>' +
    '</div>' +
    '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;">' +
    '  <div style="max-width:600px;width:100%;background:#ffffff;border:1px solid #eef0f4;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.06);padding:60px 40px;text-align:center;box-sizing:border-box;">' +
    '    <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:#fef3c7;border:1px solid #fde68a;border-radius:20px;font-size:11px;font-weight:600;color:#92400e;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:24px;">' +
    '      <i class="fas fa-hourglass-half" style="font-size:10px;"></i> Page In Progress' +
    '    </div>' +
    '    <div style="font-size:72px;color:#e5e7eb;margin-bottom:24px;line-height:1;">' +
    '      <i class="fas fa-building"></i>' +
    '    </div>' +
    '    <h2 style="font-size:20px;font-weight:700;color:#0f2042;margin:0 0 8px 0;">Office Layout</h2>' +
    '    <h3 style="font-size:16px;font-weight:600;color:#1a1d23;margin:0 0 16px 0;">Office Layout Coming Soon</h3>' +
    '    <p style="font-size:14px;color:#5e6778;line-height:1.6;margin:0;max-width:420px;margin-left:auto;margin-right:auto;">' +
    '      The Head Office layout is currently being prepared and will be available in a future update.' +
    '    </p>' +
    '  </div>' +
    '</div>';
}

function createGroupHeader(title, availableCount, isExpanded, levelClass, categoryLabel) {
  var div = document.createElement("div");
  div.className = "group-header" + (levelClass ? " " + levelClass : "");

  var left = document.createElement("div");
  left.className = "group-left";

  var chev = document.createElement("span");
  chev.className = "group-chevron";
  chev.innerHTML = '<i class="fas ' + (isExpanded ? "fa-chevron-down" : "fa-chevron-right") + '"></i>';
  left.appendChild(chev);

  var titleSpan = document.createElement("span");
  titleSpan.className = "group-title";

  if (categoryLabel) {
    var catSpan = document.createElement("span");
    catSpan.className = "group-category-label";
    catSpan.textContent = categoryLabel + " : ";
    titleSpan.appendChild(catSpan);
  }

  var titleText = document.createElement("span");
  titleText.textContent = title;
  titleSpan.appendChild(titleText);

  left.appendChild(titleSpan);

  div.appendChild(left);

  var right = document.createElement("div");
  right.className = "group-right";

  var countStrong = document.createElement("strong");
  countStrong.className = "group-count";
  countStrong.textContent = availableCount;
  right.appendChild(countStrong);

  var labelSpan = document.createElement("span");
  labelSpan.className = "group-count-label";
  labelSpan.textContent = "Total Available Units";
  right.appendChild(labelSpan);

  div.appendChild(right);
  return div;
}

var __sortState = {};

function initSortState(slug) {
  if (!__sortState[slug]) {
    __sortState[slug] = {
      unitTypeDir: "asc",      // Default: alphabetical + number sequence
      builtUpDir: "asc",       // Default: Smallest -> Largest
      spaPriceDir: "asc",      // Default: Cheapest -> Most Expensive
      activeColumn: null       // null = default sort (Unit Type)
    };
  }
  return __sortState[slug];
}

function resetSortState(slug) {
  if (__sortState[slug]) {
    __sortState[slug].unitTypeDir = "asc";
    __sortState[slug].builtUpDir = "asc";
    __sortState[slug].spaPriceDir = "asc";
    __sortState[slug].activeColumn = null;
  }
}

function applyDefaultSort(units) {
  // Default: sort by Unit No (alphabetical prefix first, then number sequence)
  return units.slice().sort(function(a, b) {
    return compareUnitType(a.Unit_No, b.Unit_No);
  });
}

function applyUnitTypeSort(units, dir) {
  var sorted = units.slice().sort(function(a, b) {
    return compareUnitType(a.Unit_No, b.Unit_No);
  });
  if (dir === "desc") sorted.reverse();
  return sorted;
}

function applyBuiltUpSort(units, dir) {
  return units.slice().sort(function(a, b) {
    var av = Number(a.Built_Up) || 0;
    var bv = Number(b.Built_Up) || 0;
    return dir === "asc" ? av - bv : bv - av;
  });
}

function applySpaPriceSort(units, dir) {
  return units.slice().sort(function(a, b) {
    var av = computePrice(a);
    var bv = computePrice(b);
    return dir === "asc" ? av - bv : bv - av;
  });
}

function sortUnits(units, sortState) {
  if (!sortState) return applyDefaultSort(units);
  if (sortState.activeColumn === "builtUp") return applyBuiltUpSort(units, sortState.builtUpDir);
  if (sortState.activeColumn === "spaPrice") return applySpaPriceSort(units, sortState.spaPriceDir);
  return applyDefaultSort(units);
}

/* B6-01 remark - applies ONLY to unit B6-01 (N-CITY Phase 2) */
function getUnitRemark(u) {
  if (!u) return "";
  var unitNo = (u.Unit_No || "").toString().trim().toUpperCase();
  if (unitNo === "B6-01") return "* In the midst of conversion from Bumi to Non-Bumi";
  return "";
}

function getSortIndicator(column) {
  return '<span style="color:#f47217;font-size:10px;margin-left:4px;"><i class="fas fa-sort"></i></span>';
}

function getActiveSortIndicator(column, dir) {
  var icon = dir === "asc" ? "fa-sort-up" : "fa-sort-down";
  return '<span style="color:#f47217;font-size:10px;margin-left:4px;"><i class="fas ' + icon + '"></i></span>';
}

function getSortButtonHtml(column, sortState) {
  var isActive = sortState && sortState.activeColumn === column;
  var dir = isActive ? sortState[column + "Dir"] : "asc";
  var icon = isActive ? (dir === "asc" ? "fa-sort-up" : "fa-sort-down") : "fa-sort";
  return '<button class="sort-btn" data-sort="' + column + '" style="background:none;border:none;cursor:pointer;color:#000000;font-size:15px;margin-left:8px;padding:0;vertical-align:middle;line-height:1;" title="Sort"><i class="fas ' + icon + '"></i></button>';
}

function createUnitsTable(units, startNum, projectName, sortState) {
  var isHighrise = projectName && HIGHRISE_PROJECTS[projectName.toString().trim().toUpperCase()];
  var isGid = projectName && projectName.toString().trim().toUpperCase() === "GRAND ION DELEMEN";

  var sortedUnits = sortUnits(units, sortState);

  var colGroups, headers;
  if (isHighrise && isGid) {
    // GID: Property Owner column removed
    colGroups = '<col style="width:5%"><col style="width:30%"><col style="width:25%"><col style="width:20%"><col style="width:20%">';
    headers = '<th>No</th><th>Unit No</th><th>Status</th><th>Built Up (sqft)</th><th>SPA Price (RM)</th>';
  } else if (isHighrise) {
    colGroups = '<col style="width:5%"><col style="width:25%"><col style="width:35%"><col style="width:35%">';
    headers = '<th>No</th><th>Unit No</th><th>Built Up (sqft)</th><th>SPA Price (RM)</th>';
  } else {
    colGroups = '<col style="width:5%"><col style="width:20%"><col style="width:25%"><col style="width:25%"><col style="width:25%">';
    headers = '<th>No</th><th>Unit No</th><th>Land Area (sqft)</th><th>Built Up (sqft)</th><th>SPA Price (RM)</th>';
  }

  var table = document.createElement("table");
  table.className = "asset-table";
  table.innerHTML =
    '<colgroup>' + colGroups + '</colgroup>' +
    '<thead><tr>' + headers + '</tr></thead><tbody></tbody>';

  var tbody = table.querySelector("tbody");
  sortedUnits.forEach(function(u, i) {
    var tr = document.createElement("tr");
    var builtUp = u.Built_Up;
    var landArea = u.Land_Area;
    var listPrice = u.Listing_Price || 0;
    var displayStatus = getDisplayStatus(u);
    var displayStatusClass = displayStatus.toLowerCase() === "available" ? ' style="color:#16a34a;font-weight:600;"' : '';
    var remark = getUnitRemark(u);
    var unitNoCell = '<td>' + esc(u.Unit_No) + '' + (remark ? '<br><span style="color:#dc2626;font-size:11px;font-style:italic;display:block;margin-top:2px;">' + remark + '</span>' : '') + '</td>';
    if (isHighrise && isGid) {
      tr.innerHTML =
        '<td>' + (startNum + i + 1) + '</td>' +
        unitNoCell +
        '<td><span' + displayStatusClass + '>' + esc(displayStatus) + '</span></td>' +
        '<td>' + formatArea(builtUp) + '</td>' +
        '<td>' + formatPriceValue(listPrice) + '</td>';
    } else if (isHighrise) {
      tr.innerHTML =
        '<td>' + (startNum + i + 1) + '</td>' +
        unitNoCell +
        '<td>' + formatArea(builtUp) + '</td>' +
        '<td>' + formatPriceValue(listPrice) + '</td>';
    } else {
      tr.innerHTML =
        '<td>' + (startNum + i + 1) + '</td>' +
        unitNoCell +
        '<td>' + formatArea(landArea) + '</td>' +
        '<td>' + formatArea(builtUp) + '</td>' +
        '<td>' + formatPriceValue(listPrice) + '</td>';
    }
    tbody.appendChild(tr);
  });

  return table;
}

function createGrandTotal(units) {
  var div = document.createElement("div");
  div.className = "grand-total";
  div.innerHTML =
    '<div class="grand-total-inner">' +
    '  <span class="grand-total-label">Grand Total Price</span>' +
    '  <span class="grand-total-value">' + formatPrice(computeGrandTotalPrice(units)) + '</span>' +
    '</div>';
  return div;
}

function groupBy(arr, keyFn) {
  var groups = {};
  arr.forEach(function(item) {
    var k = keyFn(item);
    if (!groups[k]) groups[k] = [];
    groups[k].push(item);
  });
  return groups;
}

function collapseChildren(content) {
  if (!content) return;
  var childContents = content.querySelectorAll(".group-content");
  for (var i = 0; i < childContents.length; i++) {
    childContents[i].style.display = "none";
  }
  var chevrons = content.querySelectorAll(".group-chevron i");
  for (var j = 0; j < chevrons.length; j++) {
    chevrons[j].className = "fas fa-chevron-right";
  }
}

function renderHierarchy(container, units, stateKey) {
  container.innerHTML = "";
  if (!units.length) {
    container.innerHTML = '<div style="text-align:center;padding:24px;">No records</div>';
    return;
  }

  var state = getOrInitState(stateKey);

  var projectGroups = groupBy(units, function(u) { return u.Project || "N/A"; });
  var priority = {};
  PROJECT_DISPLAY_ORDER.forEach(function(name, idx) { priority[name] = idx; });
  Object.keys(projectGroups).sort(function(a, b) {
    var aKey = (a || "").toString().trim().toUpperCase();
    var bKey = (b || "").toString().trim().toUpperCase();
    var aP = priority[aKey] !== undefined ? priority[aKey] : 999;
    var bP = priority[bKey] !== undefined ? priority[bKey] : 999;
    return aP - bP;
  }).forEach(function(proj) {
    var projUnits = projectGroups[proj];
    var projKey = "proj:" + proj;
    if (state[projKey] === undefined) state[projKey] = false;
    var expanded = state[projKey];

    var displayTitle = (stateKey === "home" && proj === "NSIP") ? "NSIP KM1" : proj;
    var header = createGroupHeader(displayTitle, computeAvailableUnits(projUnits), expanded, "group-header-project", "Project");
    container.appendChild(header);

    var content = document.createElement("div");
    content.className = "group-content";
    content.style.display = expanded ? "block" : "none";
    container.appendChild(content);

    var childrenRendered = false;
    header.addEventListener("click", function() {
      var now = toggleLevel(state, projKey);
      if (now) {
        if (!childrenRendered) {
          renderPhases(content, projUnits, state, proj);
          childrenRendered = true;
        }
        content.style.display = "block";
      } else {
        content.style.display = "none";
        for (var k in state) {
          if (k.indexOf("phase:" + proj + ":") === 0 || k.indexOf("ut:" + proj + ":") === 0) {
            state[k] = false;
          }
        }
        collapseChildren(content);
      }
      var chev = header.querySelector(".group-chevron i");
      if (chev) chev.className = "fas " + (now ? "fa-chevron-down" : "fa-chevron-right");
    });
  });
}

function renderPhases(container, units, state, proj) {
  var phaseGroups = groupBy(units, function(u) { return u.Phase || "N/A"; });
  Object.keys(phaseGroups).sort().forEach(function(phase) {
    var phaseUnits = phaseGroups[phase];
    var phaseKey = "phase:" + proj + ":" + phase;
    if (state[phaseKey] === undefined) state[phaseKey] = false;
    var expanded = state[phaseKey];

    var header = createGroupHeader(phase, computeAvailableUnits(phaseUnits), expanded, "group-header-type group-indent-1", "Phase");
    container.appendChild(header);

    var content = document.createElement("div");
    content.className = "group-content group-indent-1";
    content.style.display = expanded ? "block" : "none";
    container.appendChild(content);

    var childrenRendered = false;
    header.addEventListener("click", function() {
      var now = toggleLevel(state, phaseKey);
      if (now) {
        if (!childrenRendered) {
          renderUnitTypes(content, phaseUnits, state, proj, phase);
          childrenRendered = true;
        }
        content.style.display = "block";
      } else {
        content.style.display = "none";
        for (var k in state) {
          if (k.indexOf("ut:" + proj + ":" + phase + ":") === 0) {
            state[k] = false;
          }
        }
        collapseChildren(content);
      }
      var chev = header.querySelector(".group-chevron i");
      if (chev) chev.className = "fas " + (now ? "fa-chevron-down" : "fa-chevron-right");
    });
  });
}

function renderUnitTypes(container, units, state, proj, phase) {
  var typeGroups = groupBy(units, function(u) { return u.Unit_Type || "N/A"; });
  var rowNum = 0;
  Object.keys(typeGroups).sort().forEach(function(ut) {
    var utUnits = typeGroups[ut];
    var utKey = "ut:" + proj + ":" + phase + ":" + ut;
    if (state[utKey] === undefined) state[utKey] = false;
    var expanded = state[utKey];

    var displayValue = ut;
    if (utUnits.length > 0 && utUnits[0].Unit_Type_Display) {
      displayValue = utUnits[0].Unit_Type_Display;
    } else {
      displayValue = getUnitTypeDisplay(ut);
    }

    var header = createGroupHeader(displayValue, computeAvailableUnits(utUnits), expanded, "group-header-ownership", "Unit Type");
    container.appendChild(header);

    var content = document.createElement("div");
    content.className = "group-content group-indent-2";
    content.style.display = expanded ? "block" : "none";
    container.appendChild(content);

    var childrenRendered = false;
    header.addEventListener("click", function() {
      var now = toggleLevel(state, utKey);
      if (now) {
        if (!childrenRendered) {
          var wrapper = document.createElement("div");
          wrapper.className = "group-table-wrapper";
          wrapper.appendChild(createUnitsTable(utUnits, rowNum, proj));
          content.appendChild(wrapper);
          childrenRendered = true;
        }
        content.style.display = "block";
      } else {
        content.style.display = "none";
        collapseChildren(content);
      }
      var chev = header.querySelector(".group-chevron i");
      if (chev) chev.className = "fas " + (now ? "fa-chevron-down" : "fa-chevron-right");
    });
  });
}

/* ==========================================================================
   HOME DASHBOARD
   ========================================================================== */
function updateWelcomeMessage() {
  var welcomeEl = document.getElementById("welcomeMessage");
  if (!welcomeEl) return;
  try {
    var loginData = localStorage.getItem("nct_login_data");
    if (loginData) {
      var data = JSON.parse(loginData);
      var name = data.name || data.user || "";
      if (name) {
        // Extract display name from email if name is not available
        if (name.indexOf("@") > -1) {
          name = name.split("@")[0];
        }
        // Capitalize first letter
        name = name.charAt(0).toUpperCase() + name.slice(1);
        welcomeEl.textContent = "Hello, " + name;
      }
    }
  } catch(e) {
    console.error("Welcome message error:", e);
  }
}

function renderHomeDashboard() {
  updateWelcomeMessage();

  var kpiDataCache = null;

  fetch("/api/home/kpi")
    .then(function(res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
    .then(function(data) {
      kpiDataCache = Array.isArray(data) ? data : [];
      // Only render dashboard if units are already loaded
      if (window.__allUnits && window.__allUnits.length) {
        renderDashboardSections(kpiDataCache);
      }
    })
    .catch(function(err) {
      console.error("Home KPI fetch error:", err);
    });

  fetchAllUnitsCached().then(function(units) {
    try { populateProjectFilter(units); } catch(e) { console.error("Filter:", e); }
    try { renderHomeHierarchy(units); } catch(e) { console.error("Home hierarchy:", e); }

    // Re-render dashboard sections with Grand Ion Delemen override now that units are loaded
    if (kpiDataCache && kpiDataCache.length) {
      renderDashboardSections(kpiDataCache);
    }
  });

  // Bind Master Asset List toggle button
  bindMasterAssetListToggle();
}

function renderDashboardSections(kpiData) {
  var completedGrid = document.getElementById("completedProjectsGrid");
  var ongoingGrid = document.getElementById("ongoingProjectsGrid");
  if (!completedGrid || !ongoingGrid) return;

  completedGrid.innerHTML = "";
  ongoingGrid.innerHTML = "";

  var dataMap = {};
  (Array.isArray(kpiData) ? kpiData : []).forEach(function(proj) {
    dataMap[(proj.project_name || "").toString().trim().toUpperCase()] = proj;
  });

  // Override Grand Ion Delemen with corrected display-available count
  // to match the Project Page Available Unit List
  if (window.__allUnits && window.__allUnits.length) {
    var gidUnits = window.__allUnits.filter(function(u) {
      return (u.Project || "").toString().trim().toUpperCase() === "GRAND ION DELEMEN";
    });
    var gidAvailable = gidUnits.filter(isDisplayAvailable);
    var gidTotalPrice = gidAvailable.reduce(function(acc, u) { return acc + computePrice(u); }, 0);
    dataMap["GRAND ION DELEMEN"] = {
      project_name: "GRAND ION DELEMEN",
      project_status: "Completed",
      available_units: gidAvailable.length,
      total_list_price: gidTotalPrice,
      project_slug: "grand-ion-delemen"
    };
  }

  var guaranteedOngoing = [
    { project_name: "NCT SMART INDUSTRIAL PARK KM1", project_status: "Ongoing", available_units: 0, total_list_price: 0, project_slug: "nsip" },
    { project_name: "NCT INNOSPHERE", project_status: "Ongoing", available_units: 0, total_list_price: 0, project_slug: "nct-innosphere" }
  ];

  // Hardcoded sub-project cards (replacing parent ION BELIAN GARDEN only - N-CITY sub-projects come from API data)
  var SUB_PROJECT_CARDS = [
    { project_name: "ION BELIAN GARDEN — COMMERCIAL", project_status: "Ongoing", available_units: 1, total_list_price: 758000, project_slug: "ion-belian-garden-commercial" },
    { project_name: "ION BELIAN GARDEN — RESIDENTIAL", project_status: "Ongoing", available_units: 1, total_list_price: 356000, project_slug: "ion-belian-garden-residential" }
  ];

  var allProjects = [];

  guaranteedOngoing.forEach(function(gp) {
    var key = (gp.project_name || "").toString().trim().toUpperCase();
    var existing = dataMap[key];
    if (existing) {
      allProjects.push(existing);
    } else {
      allProjects.push(gp);
    }
  });

  // Add sub-project cards
  SUB_PROJECT_CARDS.forEach(function(sp) {
    allProjects.push(sp);
  });

  // Add remaining API projects, excluding parent projects and hardcoded sub-project cards
  var EXCLUDED_PROJECTS = {
    "NCT SMART INDUSTRIAL PARK KM1": true,
    "NCT INNOSPHERE": true,
    "N-CITY": true,
    "ION BELIAN GARDEN": true,
    "ION BELIAN GARDEN — COMMERCIAL": true,
    "ION BELIAN GARDEN — RESIDENTIAL": true
  };
  (Array.isArray(kpiData) ? kpiData : []).forEach(function(proj) {
    var key = (proj.project_name || "").toString().trim().toUpperCase();
    if (!EXCLUDED_PROJECTS[key]) {
      allProjects.push(proj);
    }
  });

  // Group IBG and N-City cards
  var ibgCards = [];
  var ncityCards = [];
  var normalCards = [];

  allProjects.forEach(function(proj) {
    var nameUpper = (proj.project_name || "").toString().trim().toUpperCase();
    if (nameUpper.indexOf("ION BELIAN GARDEN") > -1) {
      ibgCards.push(proj);
    } else if (nameUpper.indexOf("N-CITY") > -1 || nameUpper.indexOf("RISE INTERNATIONAL SCHOOL") > -1 || nameUpper.indexOf("CONVENTION HALL") > -1) {
      ncityCards.push(proj);
    } else {
      normalCards.push(proj);
    }
  });

  // Render normal cards
  normalCards.forEach(function(proj) {
    var card = createDashboardCard(proj);
    if (proj.project_status === "Ongoing") {
      ongoingGrid.appendChild(card);
    } else {
      completedGrid.appendChild(card);
    }
  });

  // Render IBG cards with grouping borders
  ibgCards.forEach(function(proj, idx) {
    var card = createDashboardCard(proj);
    if (ibgCards.length === 1) {
      card.classList.add("group-first", "group-last");
    } else {
      if (idx === 0) card.classList.add("group-first");
      else if (idx === ibgCards.length - 1) card.classList.add("group-last");
      else card.classList.add("group-middle");
    }
    if (proj.project_status === "Ongoing") {
      ongoingGrid.appendChild(card);
    } else {
      completedGrid.appendChild(card);
    }
  });

  // Render N-City cards with grouping borders
  ncityCards.forEach(function(proj, idx) {
    var card = createDashboardCard(proj);
    if (ncityCards.length === 1) {
      card.classList.add("group-first", "group-last");
    } else {
      if (idx === 0) card.classList.add("group-first");
      else if (idx === ncityCards.length - 1) card.classList.add("group-last");
      else card.classList.add("group-middle");
    }
    if (proj.project_status === "Ongoing") {
      ongoingGrid.appendChild(card);
    } else {
      completedGrid.appendChild(card);
    }
  });

  // After all cards rendered, update continuous border widths for grouped cards
  setTimeout(updateGroupedCardBorders, 300);

  // Dashboard Grand Total KPIs aggregate the EXACT displayed project KPI cards (single source of truth)
  var grandAvail = 0;
  var grandValue = 0;
  allProjects.forEach(function(proj) {
    grandAvail += Number(proj.available_units) || 0;
    grandValue += Number(proj.total_list_price) || 0;
  });
  var grandAvailEl = document.getElementById("grandTotalAvailable");
  var grandValueEl = document.getElementById("grandTotalValue");
  if (grandAvailEl) grandAvailEl.textContent = grandAvail;
  if (grandValueEl) grandValueEl.textContent = formatPrice(grandValue);

  if (completedGrid.children.length === 0) {
    completedGrid.innerHTML = '<div class="dashboard-empty">No completed projects</div>';
  }
  if (ongoingGrid.children.length === 0) {
    ongoingGrid.innerHTML = '<div class="dashboard-empty">No ongoing projects</div>';
  }
}

function updateGroupedCardBorders() {
  // Update IBG group borders - find ALL cards in the group
  var ibgCards = document.querySelectorAll('.dashboard-kpi-card.group-first, .dashboard-kpi-card.group-middle, .dashboard-kpi-card.group-last');
  var ibgFirst = document.querySelector('.dashboard-kpi-card.group-first');
  
  if (ibgFirst && ibgCards.length > 1) {
    var minLeft = Infinity, maxRight = -Infinity, minTop = Infinity, maxBottom = -Infinity;
    
    ibgCards.forEach(function(card) {
      var rect = card.getBoundingClientRect();
      if (rect.left < minLeft) minLeft = rect.left;
      if (rect.right > maxRight) maxRight = rect.right;
      if (rect.top < minTop) minTop = rect.top;
      if (rect.bottom > maxBottom) maxBottom = rect.bottom;
    });
    
    var firstRect = ibgFirst.getBoundingClientRect();
    var groupWidth = maxRight - minLeft;
    var groupHeight = maxBottom - minTop;
    var offsetX = firstRect.left - minLeft;
    var offsetY = firstRect.top - minTop;
    
    ibgFirst.style.setProperty('--group-border-width', groupWidth + 'px');
    ibgFirst.style.setProperty('--group-border-height', groupHeight + 'px');
    ibgFirst.style.setProperty('--group-border-offset-x', offsetX + 'px');
    ibgFirst.style.setProperty('--group-border-offset-y', offsetY + 'px');
  }

  // Update N-City group borders - find ALL cards in each group
  var ncityGroups = {};
  var allNcityCards = document.querySelectorAll('.dashboard-kpi-card.group-first, .dashboard-kpi-card.group-middle, .dashboard-kpi-card.group-last');
  
  allNcityCards.forEach(function(card) {
    var parent = card.parentElement;
    if (!parent) return;
    var parentId = parent.id || 'default';
    if (!ncityGroups[parentId]) ncityGroups[parentId] = { first: null, cards: [] };
    ncityGroups[parentId].cards.push(card);
    if (card.classList.contains('group-first')) ncityGroups[parentId].first = card;
  });

  Object.keys(ncityGroups).forEach(function(groupKey) {
    var group = ncityGroups[groupKey];
    if (!group.first || group.cards.length <= 1) return;
    
    var minLeft = Infinity, maxRight = -Infinity, minTop = Infinity, maxBottom = -Infinity;
    
    group.cards.forEach(function(card) {
      var rect = card.getBoundingClientRect();
      if (rect.left < minLeft) minLeft = rect.left;
      if (rect.right > maxRight) maxRight = rect.right;
      if (rect.top < minTop) minTop = rect.top;
      if (rect.bottom > maxBottom) maxBottom = rect.bottom;
    });
    
    var firstRect = group.first.getBoundingClientRect();
    var groupWidth = maxRight - minLeft;
    var groupHeight = maxBottom - minTop;
    var offsetX = firstRect.left - minLeft;
    var offsetY = firstRect.top - minTop;
    
    group.first.style.setProperty('--group-border-width', groupWidth + 'px');
    group.first.style.setProperty('--group-border-height', groupHeight + 'px');
    group.first.style.setProperty('--group-border-offset-x', offsetX + 'px');
    group.first.style.setProperty('--group-border-offset-y', offsetY + 'px');
  });
}

function createDashboardCard(proj) {
  var card = document.createElement("div");
  card.className = "dashboard-kpi-card";
  card.style.cursor = "pointer";

  var slug = proj.project_slug || "";
  var displayName = (proj.project_name || "").toUpperCase();
  if (displayName === "NCT SMART INDUSTRIAL PARK KM1") {
    displayName = "NCT SMART INDUSTRIAL PARK (KM1)";
  }
  if (displayName === "N-CITY — RISE INTERNATIONAL SCHOOL" || displayName === "N-CITY - RISE INTERNATIONAL SCHOOL" || displayName === "RISE INTERNATIONAL SCHOOL") {
    displayName = "N-CITY RISE INTERNATIONAL SCHOOL";
  }

  // Remove colored border - use CSS default shadow card style
  // Do not set any border inline, let .dashboard-kpi-card CSS handle it
  
  var availableUnits = proj.available_units;
  var totalListPrice = proj.total_list_price;

  card.innerHTML =
    '<div class="dash-kpi-header">' +
      '<div class="dash-kpi-name">' + esc(displayName) + '</div>' +
    '</div>' +
    '<div class="dash-kpi-body">' +
      '<div class="dash-kpi-metric">' +
        '<div class="dash-kpi-value">' + availableUnits + '</div>' +
        '<div class="dash-kpi-label">Total Available Units</div>' +
      '</div>' +
      '<div class="dash-kpi-metric">' +
        '<div class="dash-kpi-value">' + formatPrice(totalListPrice) + '</div>' +
        '<div class="dash-kpi-label">Total SPA Price</div>' +
      '</div>' +
    '</div>';

  card.addEventListener("click", function() {
    if (!slug) return;
    if (slug === "nsip") {
      activateSidebarItem("nsip-km1");
      collapseNsipSubmenu();
      renderNsipKm1View();
    } else if (slug === "n-city-commercial") {
      activateSidebarItem("n-city-commercial");
      collapseNcitySubmenu();
      renderNcityCommercialView();
    } else if (slug === "n-city-rise") {
      activateSidebarItem("n-city-rise");
      collapseNcitySubmenu();
      renderNcityRiseView();
    } else if (slug === "n-city-convention-hall") {
      activateSidebarItem("n-city-convention-hall");
      collapseNcitySubmenu();
      renderNcityConventionHallView();
    } else if (slug === "ion-belian-garden-commercial") {
      activateSidebarItem("ion-belian-garden-commercial");
      collapseIonBelianGardenSubmenu();
      renderIbgCommercialView();
    } else if (slug === "ion-belian-garden-residential") {
      activateSidebarItem("ion-belian-garden-residential");
      collapseIonBelianGardenSubmenu();
      renderIbgResidentialView();
    } else {
      activateSidebarItem(slug);
      if (getProjectConfig(slug)) {
        renderProjectView(slug);
      }
    }
  });

  return card;
}

function bindUnifiedKPICards() {
  document.querySelectorAll(".kpi-card-unified").forEach(function(card) {
    card.addEventListener("click", function() {
      var view = this.dataset.view;
      if (view) {
        if (view === "nsip") { activateSidebarItem("nsip-km1"); collapseNsipSubmenu(); renderNsipKm1View(); }
        else { activateSidebarItem(view); if (getProjectConfig(view)) renderProjectView(view); }
      }
    });
  });
}

function renderHomeKPIRow(units) {
  var row = document.getElementById("homeKpiRow");
  if (!row) return;
  row.innerHTML = "";
  HOME_KPI_ORDER.forEach(function(dbProjectName) {
    var cfg = PROJECT_CONFIG.filter(function(c) { return c.name === dbProjectName; })[0];
    if (!cfg) return;
    var slug = cfg.slug;
    var count = units.filter(function(u) { return (u.Project || "").toString().trim() === dbProjectName && isDisplayAvailable(u); }).length;
    var totalPrice = units.filter(function(u) { return (u.Project || "").toString().trim() === dbProjectName; }).filter(isDisplayAvailable).reduce(function(acc, u) { return acc + computePrice(u); }, 0);
    var status = getProjectStatus(dbProjectName);
    var card = document.createElement("div");
    card.className = "kpi-card-unified";
    card.dataset.view = slug;
    var displayName = dbProjectName === "NSIP" ? "NSIP KM1" : dbProjectName;

    // Apply project border color
    // Colored borders removed - using default card styling
    // Cards are now grouped visually via group-first/group-last CSS classes

    card.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
      '  <div class="kpi-project-name" style="margin-bottom:0;">' + esc(displayName) + '</div>' +
      '  <div style="flex-shrink:0;margin-left:10px;">' + renderStatusDot(status) + '</div>' +
      '</div>' +
      '<div class="kpi-metrics">' +
      '  <div class="kpi-metric kpi-metric-left"><div class="kpi-value">' + count + '</div><div class="kpi-sub">Available Units</div></div>' +
      '  <div class="kpi-metric kpi-metric-right"><div class="kpi-value">' + formatPrice(totalPrice) + '</div><div class="kpi-sub">Total Price</div></div>' +
      '</div>';
    row.appendChild(card);
  });
}

function renderStatusDot(status) {
  var color = getStatusColor(status);
  var label = getStatusLabel(status);
  return '<span style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap;">' +
         '<span style="width:10px;height:10px;border-radius:50%;background:' + color + ';display:inline-block;box-shadow:0 0 0 2px ' + color + '33;"></span>' +
         '<span style="font-size:11px;font-weight:600;color:' + color + ';text-transform:capitalize;">' + label + '</span>' +
         '</span>';
}

function renderHomeHierarchy(units) {
  var container = document.getElementById("homeHierarchyContainer");
  if (!container) return;

  var projFilter = document.getElementById("ledgerProjectFilter");

  populateProjectFilter(units);

  if (!projFilter.getAttribute("data-bound")) {
    projFilter.setAttribute("data-bound", "1");
    projFilter.addEventListener("change", function() {
      var proj = projFilter.value;
      var sourceUnits = proj ? (window.__allUnits || units).filter(function(u) { return (u.Project || "").toString().trim() === proj; }) : (window.__allUnits || units);
      renderHierarchy(container, sourceUnits.filter(isDisplayAvailable), "home");
    });
  }

  renderHierarchy(container, units.filter(isDisplayAvailable), "home");
}

function bindMasterAssetListToggle() {
  var toggleBtn = document.getElementById("toggleMasterAssetList");
  var card = document.getElementById("masterAssetListCard");
  if (!toggleBtn || !card) return;

  toggleBtn.addEventListener("click", function() {
    var contentArea = card.querySelector(".table-wrapper.asset-table-container");
    var icon = toggleBtn.querySelector("i");
    var text = toggleBtn.querySelector("span");
    
    if (!contentArea) return;

    var isHidden = contentArea.style.display === "none";
    
    if (isHidden) {
      // Show
      contentArea.style.display = "";
      if (icon) icon.className = "fas fa-eye";
      if (text) text.textContent = "HIDE";
      toggleBtn.classList.remove("collapsed");
    } else {
      // Hide
      contentArea.style.display = "none";
      if (icon) icon.className = "fas fa-eye-slash";
      if (text) text.textContent = "VIEW";
      toggleBtn.classList.add("collapsed");
    }
  });
}

function populateProjectFilter(units) {
  var select = document.getElementById("ledgerProjectFilter");
  if (!select || select.getAttribute("data-populated") === "1") return;
  var projects = Array.from(new Set(units.map(function(u) { return u.Project || "Unknown"; })));
  var priority = {};
  PROJECT_DISPLAY_ORDER.forEach(function(name, idx) { priority[name] = idx; });
  projects.sort(function(a, b) {
    var aP = priority[a] !== undefined ? priority[a] : 999;
    var bP = priority[b] !== undefined ? priority[b] : 999;
    return aP - bP;
  });
  projects.forEach(function(p) { var o = document.createElement("option"); o.value = p; o.textContent = p; select.appendChild(o); });
  select.setAttribute("data-populated", "1");
}

/* ==========================================================================
   NCT INNOSPHERE VIEW
   ========================================================================== */
function renderNctInnosphereView() {
  var panel = document.getElementById("view-nct-innosphere");
  if (!panel) return;

  panel.innerHTML =
    '<div class="page-header">' +
    '  <div style="display:flex;justify-content:space-between;align-items:center;flex:1;">' +
    '    <div><h1 style="margin-right:12px;">NCT INNOSPHERE</h1><div class="header-sub">Project Dashboard</div></div>' +
    '  </div>' +
    '  <div class="data-extracted-box"><div class="de-label">Updated as of</div><div class="de-date">Not Available</div></div>' +
    '</div>' +
    '<div class="project-image-banner" id="project-image-nct-innosphere" style="background:#000000;border-radius:10px;overflow:hidden;margin-bottom:20px;position:relative;cursor:pointer;" title="Double-click to view full image">' +
    '  <img src="/static/NIS.png" alt="NCT Innosphere" style="width:100%;max-height:400px;object-fit:contain;display:block;background:#000000;">' +
    '</div>' +
    '<div class="project-kpi-container">' +
    '  <div class="card project-kpi-box"><div class="project-kpi-label"><i class="fas fa-check-circle" style="color:#10b981;margin-right:8px;"></i>Total Available Units</div><div class="project-kpi-value" id="kpi-nct-innosphere">0</div></div>' +
    '  <div class="card project-kpi-price-box"><div class="project-kpi-label"><i class="fas fa-dollar-sign" style="color:#2563eb;margin-right:8px;"></i>Total SPA Price</div><div class="project-kpi-value" id="kpi-price-nct-innosphere">RM 0.00</div></div>' +
    '</div>' +
    '<div id="nis-layout-wrapper" style="width:100%;display:flex;flex-direction:column;gap:20px;box-sizing:border-box;padding:0;margin-bottom:20px;">' +
    '  <div class="card" style="padding:12px 16px;margin-bottom:0;background:#f8fafc;border:1px solid #eef0f4;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06);display:flex;align-items:center;">' +
    '    <span class="card-title" style="flex-shrink:0;"><i class="fas fa-map"></i> LAYOUT PLAN</span>' +
    '    <span style="margin-left:auto;font-size:14px;font-weight:700;color:#0f2042;white-space:nowrap;">Bal 0 / 0 units</span>' +
    '  </div>' +
    '  <div style="width:100%;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);overflow:hidden;">' +
    '    <img src="/static/NIS_Layout.png" alt="NCT Innosphere Layout" style="width:100%;height:auto;display:block;border-radius:6px;">' +
    '  </div>' +
    '</div>' +
    '<div class="card" style="margin-bottom:20px;">' +
    '  <div class="card-header"><span class="card-title"><i class="fas fa-info-circle"></i> PROJECT DETAILS</span></div>' +
    '  <div style="padding:16px;overflow-x:auto;">' +
    '    <table class="asset-table" style="width:100%;border-collapse:collapse;">' +
    '      <colgroup><col style="width:30%"><col style="width:70%"></colgroup>' +
    '      <thead><tr><th>Detail</th><th>Value</th></tr></thead>' +
    '      <tbody>' +
    '        <tr><td style="font-weight:600;">Tenure</td><td>-</td></tr>' +
    '        <tr><td style="font-weight:600;">Vacant Possession</td><td>-</td></tr>' +
    '        <tr><td style="font-weight:600;">Booking Fee</td><td>-</td></tr>' +
    '        <tr><td style="font-weight:600;">Bumiputera Discount</td><td>-</td></tr>' +
    '        <tr><td style="font-weight:600;">Sales Package</td><td>-</td></tr>' +
    '      </tbody>' +
    '    </table>' +
    '  </div>' +
    '</div>' +
    '<div class="card" id="staticAssetList-nct-innosphere">' +
    '  <div class="card-header">' +
    '    <span class="card-title"><i class="fas fa-table"></i> AVAILABLE UNIT LIST</span>' +
    '    <div class="table-controls">' +
    '      <select id="staticFilterPhase-nct-innosphere" class="table-filter"><option value="">All Phases</option></select>' +
    '      <select id="staticFilterType-nct-innosphere" class="table-filter"><option value="">All Unit Types</option></select>' +
    '    </div>' +
    '  </div>' +
    '  <div id="staticLedgerContainer-nct-innosphere" class="asset-table-container">' +
    '    <table class="asset-table"><colgroup><col style="width:5%"><col style="width:20%"><col style="width:15%"><col style="width:20%"><col style="width:20%"><col style="width:20%"></colgroup><thead><tr><th>No</th><th>Unit No</th><th>Status</th><th>Land Area (sqft)</th><th>Built Up (sqft)</th><th>SPA Price</th></tr></thead><tbody><tr><td colspan="6" style="text-align:center;padding:40px 20px;color:#9ca3af;font-style:italic;">No records found</td></tr></tbody></table>' +
    '  </div>' +
    '  <div id="staticPagination-nct-innosphere" style="display:flex;align-items:center;justify-content:center;gap:12px;margin-top:16px;padding-top:12px;border-top:1px solid var(--border-light);">' +
    '    <span style="font-size:13px;color:#5e6778;">0 units</span>' +
    '  </div>' +
    '</div>';
}

/* ==========================================================================
   NSIP OVERALL LAYOUT VIEW
   ========================================================================== */
function renderNsipOverallLayoutView() {
  var panel = document.getElementById("view-nsip-overall-layout");
  if (!panel) return;

  panel.innerHTML =
    '<div class="page-header">' +
    '  <div><h1>Overall Layout</h1><div class="header-sub">NCT SMART INDUSTRIAL PARK LAYOUT PLAN</div></div>' +
    '</div>' +
    '<div id="nsip-overall-layout-wrapper" style="width:100%;display:flex;flex-direction:column;gap:20px;box-sizing:border-box;padding:0;margin-bottom:20px;">' +
    '  <div class="card" style="padding:12px 16px;margin-bottom:0;background:#f8fafc;border:1px solid #eef0f4;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06);display:flex;align-items:center;">' +
    '    <span class="card-title" style="flex-shrink:0;"><i class="fas fa-map"></i> LAYOUT PLAN</span>' +
    '  </div>' +
    '  <div id="nsip-overall-layout-stage" style="width:100%;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);overflow:hidden;position:relative;">' +
    '    <img src="/static/NSIP_Full%20Layout.jpeg" alt="NSIP Overall Layout" style="width:100%;height:auto;display:block;border-radius:6px;transform-origin:center center;">' +
    '  </div>' +
    '</div>';

  // Enable double-click fullscreen on overall layout image
  var layoutImg = document.getElementById("nsip-overall-layout-stage").querySelector("img");
  if (layoutImg) {
    layoutImg.addEventListener("dblclick", function() {
      openImageModal("/static/NSIP_Full%20Layout.jpeg", "NSIP Overall Layout");
    });
  }
}

/* ==========================================================================
   NSIP KM2 VIEW (Layout + Coming Soon)
   ========================================================================== */
function renderNsipKm2View() {
  var panel = document.getElementById("view-nsip-km2");
  if (!panel) return;

  panel.innerHTML =
    '<div class="page-header">' +
    '  <div><h1>NSIP KM2</h1><div class="header-sub">Project Dashboard</div></div>' +
    '  <div class="data-extracted-box"><div class="de-label">Updated as of</div><div class="de-date">15 July 2026</div></div></div>' +
    '</div>' +
    '<div id="nsip-km2-layout-wrapper" style="width:100%;display:flex;flex-direction:column;gap:20px;box-sizing:border-box;padding:0;margin-bottom:20px;">' +
    '  <div class="card" style="padding:12px 16px;margin-bottom:0;background:#f8fafc;border:1px solid #eef0f4;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06);display:flex;align-items:center;">' +
    '    <span class="card-title" style="flex-shrink:0;"><i class="fas fa-map"></i> LAYOUT PLAN</span>' +
    '  </div>' +
    '  <div id="nsip-km2-layout-stage" style="width:100%;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);overflow:hidden;position:relative;">' +
    '    <img src="/static/NSIP%20KM2_Layout.png" alt="NSIP KM2 Layout" style="width:100%;height:auto;display:block;border-radius:6px;transform-origin:center center;">' +
    '  </div>' +
    '</div>' +
    '<div class="card staging-placeholder" style="text-align:center;padding:80px 20px;">' +
    '  <i class="fas fa-clock" style="font-size:64px;color:var(--corporate-orange);margin-bottom:20px;display:block;"></i>' +
    '  <h3 style="font-size:24px;margin-bottom:12px;">Coming Soon</h3>' +
    '  <p style="color:var(--text-secondary);font-size:15px;">NSIP KM2 project data will be available in a future update.</p></div>';

  // Enable double-click fullscreen on KM2 layout image
  var layoutImg = document.getElementById("nsip-km2-layout-stage").querySelector("img");
  if (layoutImg) {
    layoutImg.addEventListener("dblclick", function() {
      openImageModal("/static/NSIP%20KM2_Layout.png", "NSIP KM2 Layout");
    });
  }
}

/* ==========================================================================
   PROJECT PAGE RENDERER
   ========================================================================== */
function renderProjectView(slug) {
  // N-CITY has its own SVG layout view, delegate
  if (slug === "n-city") { renderNcityView(); return; }
  // Mahkota Kampar has its own SVG layout view, delegate
  if (slug === "mahkota-kampar") { renderMahkotaKamparView(); return; }
  var cfg = getProjectConfig(slug);
  if (!cfg) return;
  var panel = document.getElementById("view-" + slug);
  if (!panel) return;
  var pageTitle = cfg.name;
  var status = getProjectStatus(cfg.name);

  if (slug === "nsip") { renderNsipKm1View(); return; }

  var dateText = "15 July 2026";

  panel.innerHTML =
    '<div class="page-header">' +
    '  <div style="display:flex;justify-content:space-between;align-items:center;flex:1;">' +
    '    <div><h1 style="margin-right:12px;">' + pageTitle.toUpperCase() + '</h1><div class="header-sub">Project Dashboard</div></div>' +
    '  </div>' +
    '  <div class="data-extracted-box"><div class="de-label">Updated as of</div><div class="de-date">' + dateText + '</div></div>' +
    '</div>' +
    '<div class="project-image-banner" id="project-image-' + slug + '" style="background:#000000;border-radius:10px;overflow:hidden;margin-bottom:20px;position:relative;cursor:pointer;" title="Double-click to view full image">' +
    '  <div style="display:flex;align-items:center;justify-content:center;min-height:200px;max-height:400px;padding:20px;">' +
    '    <div style="color:#9ca3af;font-size:14px;"><i class="fas fa-spinner fa-spin" style="font-size:24px;display:block;margin-bottom:8px;"></i>Loading project image...</div>' +
    '  </div>' +
    '</div>' +
    '<div class="project-kpi-container">' +
    '  <div class="card project-kpi-box"><div class="project-kpi-label"><i class="fas fa-check-circle" style="color:#10b981;margin-right:8px;"></i>Total Available Units</div><div class="project-kpi-value" id="kpi-' + slug + '">0</div></div>' +
    '  <div class="card project-kpi-price-box"><div class="project-kpi-label"><i class="fas fa-dollar-sign" style="color:#2563eb;margin-right:8px;"></i>Total SPA Price</div><div class="project-kpi-value" id="kpi-price-' + slug + '">RM 0</div></div>' +
    '</div>' +
    '<div class="card" id="staticAssetList-' + slug + '">' +
    '  <div class="card-header">' +
    '    <span class="card-title"><i class="fas fa-table"></i> AVAILABLE UNIT LIST</span>' +
    '    <div class="table-controls">' +
    '      <select id="staticFilterPhase-' + slug + '" class="table-filter"><option value="">All Phases</option></select>' +
    '      <select id="staticFilterType-' + slug + '" class="table-filter"><option value="">All Unit Types</option></select>' +
    '      <button id="resetSort-' + slug + '" class="table-filter" style="padding:6px 12px;border:1px solid var(--border-light);border-radius:4px;background:#fff;cursor:pointer;font-size:13px;font-weight:600;color:#0f2042;"><i class="fas fa-undo" style="margin-right:4px;"></i>Reset Sort</button>' +
    '    </div>' +
    '  </div>' +
    '  <div id="staticLedgerContainer-' + slug + '" class="asset-table-container"></div>' +
    '  <div id="staticPagination-' + slug + '" style="display:flex;align-items:center;justify-content:center;gap:12px;margin-top:16px;padding-top:12px;border-top:1px solid var(--border-light);"></div>' +
    '</div>' +
    '<div class="card" id="assetListContainer-' + slug + '">' +
    '  <div class="card-header">' +
    '    <span class="card-title"><i class="fas fa-list"></i> AVAILABLE UNIT BY PHASE</span>' +
    '    <div class="table-controls">' +
    '      <select id="filterPhase-' + slug + '"><option value="">All Phases</option></select>' +
    '      <select id="filterType-' + slug + '"><option value="">All Unit Types</option></select>' +
    '    </div>' +
    '  </div>' +
    '  <div id="ledgerContainer-' + slug + '"></div>' +
    '</div>';

  fetchAllUnitsCached().then(function(allUnits) {
    var projectUnits = allUnits.filter(function(u) { return (u.Project || "").toString().trim() === cfg.name; });
    try { renderProjectKPI(slug, projectUnits); } catch(e) { console.error("KPI:", e); }
    try { renderProjectTotalPriceKPI(slug, projectUnits); } catch(e) { console.error("Price KPI:", e); }
    
      try { renderStaticAssetTable(slug, projectUnits); } catch(e) { console.error("Static table:", e); }
      try { renderPsfInfoBox(slug); } catch(e) { console.error("PSF info:", e); }
      try { renderProjectHierarchy(slug, projectUnits); } catch(e) { console.error("Hierarchy:", e); }
  });

  loadProjectImageBanner(slug, cfg.name);

  // Load temporary layout images for projects without SVG
  var TEMP_LAYOUT_IMAGES = {
    "grand-ion-majestic": "/static/GIM_Layout.png",
    "vortex-business-park": "/static/Vortex_Layout.png",
    "grand-ion-delemen": "/static/GID_Layout.png"
  };
  if (TEMP_LAYOUT_IMAGES[slug]) {
    // Insert layout section after KPI cards
    var layoutWrapper = document.createElement("div");
    layoutWrapper.id = slug + "-layout-wrapper";
    layoutWrapper.style.cssText = "width:100%;display:flex;flex-direction:column;gap:20px;box-sizing:border-box;padding:0;margin-bottom:20px;";
    var layoutBalance = getLayoutBalance(cfg.name) || '';
    layoutWrapper.innerHTML =
      '<div class="card" style="padding:12px 16px;margin-bottom:0;background:#f8fafc;border:1px solid #eef0f4;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06);display:flex;align-items:center;">' +
      '  <span class="card-title" style="flex-shrink:0;"><i class="fas fa-map"></i> LAYOUT PLAN</span>' +
      '  <span style="margin-left:auto;font-size:14px;font-weight:700;color:#0f2042;white-space:nowrap;">' + layoutBalance + '</span>' +
      '</div>' +
      '<div style="width:100%;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);overflow:hidden;">' +
      '  <img src="' + TEMP_LAYOUT_IMAGES[slug] + '" alt="Layout" style="width:100%;height:auto;display:block;border-radius:6px;">' +
      '</div>';
    var kpiContainer = panel.querySelector(".project-kpi-container");
    if (kpiContainer && kpiContainer.nextSibling) {
      kpiContainer.parentNode.insertBefore(layoutWrapper, kpiContainer.nextSibling);
    }
  }

  // Insert Project Details between LAYOUT PLAN and AVAILABLE UNIT LIST
  var detailsHtml = '' + renderProjectDetails(cfg.name) + '';
  var detailsDiv = document.createElement("div");
  detailsDiv.innerHTML = detailsHtml;
  var layoutWrapperEl = document.getElementById(slug + "-layout-wrapper");
  var refNode = layoutWrapperEl ? layoutWrapperEl.nextSibling : null;
  if (!refNode) {
    var kpiContainerEl = panel.querySelector(".project-kpi-container");
    if (kpiContainerEl) refNode = kpiContainerEl.nextSibling;
  }
  if (refNode) {
    panel.insertBefore(detailsDiv, refNode);
  } else {
    panel.appendChild(detailsDiv);
  }
}

function loadProjectImageBanner(slug, projectName) {
  var banner = document.getElementById("project-image-" + slug);
  if (!banner) return;

  fetch("/api/gallery/images?path=" + encodeURIComponent(projectName))
    .then(function(res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
    .then(function(images) {
      if (!Array.isArray(images) || images.length === 0) {
        banner.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:200px;max-height:400px;padding:20px;"><div style="color:#6b7280;font-size:14px;text-align:center;"><i class="fas fa-image" style="font-size:32px;display:block;margin-bottom:8px;opacity:0.5;"></i>No project image available</div></div>';
        return;
      }

      var imgUrl = images[0].url;
      banner.innerHTML = '<img src="' + imgUrl + '" alt="' + esc(projectName) + '" style="width:100%;max-height:400px;object-fit:contain;display:block;background:#000000;">';

      banner.addEventListener("dblclick", function() {
        openImageModal(imgUrl, images[0].filename);
      });
    })
    .catch(function(err) {
      console.error("Failed to load project image:", err);
      banner.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:200px;max-height:400px;padding:20px;"><div style="color:#6b7280;font-size:14px;text-align:center;"><i class="fas fa-exclamation-circle" style="font-size:32px;display:block;margin-bottom:8px;opacity:0.5;"></i>Failed to load project image</div></div>';
    });
}

/* ==========================================================================
   STATIC ASSET LIST TABLE (no drill-down)
   ========================================================================== */
var __staticTableState = {};

var PROJECT_PSF_INFO = {
  "n-city-commercial": "RM378 psf NSA",
  "vortex-business-park": "RM398 psf NSA",
  "mahkota-kampar": "RM198 psf NSA",
  "ion-belian-garden-commercial": "RM338 psf NSA",
  "nsip": "RM663 psf NSA",
  "grand-ion-delemen": "RM1489 psf NSA",
  "grand-ion-majestic": "RM1770 psf NSA"
};

function renderPsfInfoBox(slug) {
  var text = PROJECT_PSF_INFO[slug];
  if (!text) return;
  var container = document.getElementById("staticAssetList-" + slug);
  if (!container) return;
  var existing = container.nextElementSibling;
  if (existing && existing.classList.contains("psf-info-box")) return;
  var box = document.createElement("div");
  box.className = "psf-info-box";
  box.style.cssText = "background:#fef9e7;border:1px solid #fde68a;border-radius:10px;padding:4px 20px;margin-bottom:20px;text-align:right;font-style:italic;font-size:14px;color:#000000;width:100%;box-sizing:border-box;line-height:28px;";
  box.textContent = text;
  container.parentNode.insertBefore(box, container.nextSibling);
}

function renderStaticAssetTable(slug, projectUnits) {
  var container = document.getElementById("staticLedgerContainer-" + slug);
  var phaseFilter = document.getElementById("staticFilterPhase-" + slug);
  var typeFilter = document.getElementById("staticFilterType-" + slug);
  var paginationEl = document.getElementById("staticPagination-" + slug);
  if (!container) return;

  // Initialize sort state for this project
  var sortState = initSortState(slug);

  // Bind Reset Sort button
  var resetBtn = document.getElementById("resetSort-" + slug);
  if (resetBtn && !resetBtn.getAttribute("data-bound")) {
    resetBtn.setAttribute("data-bound", "1");
    resetBtn.addEventListener("click", function() {
      resetSortState(slug);
      state.page = 1;
      filterAndRender();
    });
  }

  // Grand Ion Majestic: replace Phase filter with Block Name filter
  var blockFilter = null;
  if (slug === "grand-ion-majestic") {
    if (phaseFilter) phaseFilter.style.display = "none";
    blockFilter = document.getElementById("staticFilterBlock-" + slug);
    if (!blockFilter) {
      var blockSelect = document.createElement("select");
      blockSelect.id = "staticFilterBlock-" + slug;
      blockSelect.className = "table-filter";
      blockSelect.innerHTML = '<option value="">All Blocks</option>';
      var controls = phaseFilter ? phaseFilter.parentNode : null;
      if (controls) {
        controls.insertBefore(blockSelect, phaseFilter);
      }
      blockFilter = blockSelect;
    }
  }

  // Get project config for highrise check
  var staticCfg = getProjectConfig(slug);
  var projectNameForCheck = staticCfg ? staticCfg.name : slug;

  // Initialize state
  if (!__staticTableState[slug]) __staticTableState[slug] = { page: 1, perPage: 50 };
  var state = __staticTableState[slug];

  // For NSIP KM1, show all units in one page (disable pagination)
  if (slug === "nsip") {
    state.perPage = 999;
  }

  // Populate phase filter
  if (phaseFilter && phaseFilter.getAttribute("data-populated") !== "1") {
    var phases = Array.from(new Set(projectUnits.map(function(u) { return u.Phase || "N/A"; }))).sort();
    phases.forEach(function(phase) {
      var opt = document.createElement("option");
      opt.value = phase;
      // Apply Grand Ion Majestic phase display mapping
      var displayPhase = (slug === "grand-ion-majestic") ? getMajesticPhaseDisplay(phase) : phase;
      opt.textContent = displayPhase;
      phaseFilter.appendChild(opt);
    });
    phaseFilter.setAttribute("data-populated", "1");
  }

  // Populate Block Name filter for Grand Ion Majestic
  if (slug === "grand-ion-majestic" && blockFilter && blockFilter.getAttribute("data-populated") !== "1") {
    var blocks = Array.from(new Set(projectUnits.map(function(u) { return u.Block || "N/A"; }))).sort();
    blocks.forEach(function(block) {
      var opt = document.createElement("option");
      opt.value = block;
      opt.textContent = block;
      blockFilter.appendChild(opt);
    });
    blockFilter.setAttribute("data-populated", "1");
  }

  // Populate type filter
  if (typeFilter && typeFilter.getAttribute("data-populated") !== "1") {
    var types = Array.from(new Set(projectUnits.map(function(u) { return u.Unit_Type || "N/A"; }))).sort();
    types.forEach(function(ut) {
      var opt = document.createElement("option");
      opt.value = ut;
      opt.textContent = getUnitTypeDisplay(ut);
      typeFilter.appendChild(opt);
    });
    typeFilter.setAttribute("data-populated", "1");
  }

  function filterAndRender() {
    // Filter to Display-Available units only
    var filtered = projectUnits.filter(isDisplayAvailable);
    if (phaseFilter && phaseFilter.value && phaseFilter.style.display !== "none") {
      filtered = filtered.filter(function(u) { return (u.Phase || "N/A") === phaseFilter.value; });
    }
    if (slug === "grand-ion-majestic" && blockFilter && blockFilter.value) {
      filtered = filtered.filter(function(u) { return (u.Block || "N/A") === blockFilter.value; });
    }
    if (typeFilter && typeFilter.value) {
      filtered = filtered.filter(function(u) { return (u.Unit_Type || "N/A") === typeFilter.value; });
    }

    // Apply sorting
    filtered = sortUnits(filtered, sortState);

    // Pagination
    var totalPages = Math.ceil(filtered.length / state.perPage) || 1;
    if (state.page > totalPages) state.page = totalPages;
    var start = (state.page - 1) * state.perPage;
    var pageUnits = filtered.slice(start, start + state.perPage);

    // Check if this is Salak Perdana (hide Land Area column)
    var isSalakPerdana = (slug === "salak-perdana");
    // Check if this is NSIP KM1 (use sqm + sqft columns)
    var isNsipKm1 = (slug === "nsip");
    var isHighrise = HIGHRISE_PROJECTS[projectNameForCheck.toString().trim().toUpperCase()];
    var isGid = (slug === "grand-ion-delemen");
    var showBumiStatus = false;  // Hide Bumi Status column for all projects (including N-City Commercial)
    var colGroups, headers;
    if (isHighrise && isGid) {
      // GID: Property Owner column removed
      if (showBumiStatus) {
        colGroups = '<col style="width:5%"><col style="width:25%"><col style="width:15%"><col style="width:15%"><col style="width:20%"><col style="width:20%">';
        headers = '<th>No</th><th>Unit No</th><th>Bumi Status</th><th>Status</th><th>Built Up (sqft)' + getSortButtonHtml("builtUp", sortState) + '</th><th>SPA Price (RM)' + getSortButtonHtml("spaPrice", sortState) + '</th>';
      } else {
        colGroups = '<col style="width:5%"><col style="width:30%"><col style="width:25%"><col style="width:20%"><col style="width:20%">';
        headers = '<th>No</th><th>Unit No</th><th>Status</th><th>Built Up (sqft)' + getSortButtonHtml("builtUp", sortState) + '</th><th>SPA Price (RM)' + getSortButtonHtml("spaPrice", sortState) + '</th>';
      }
    } else if (isHighrise) {
      if (showBumiStatus) {
        colGroups = '<col style="width:5%"><col style="width:18%"><col style="width:10%"><col style="width:12%"><col style="width:30%"><col style="width:30%">';
        headers = '<th>No</th><th>Unit No</th><th>Bumi Status</th><th>Status</th><th>Built Up (sqft)' + getSortButtonHtml("builtUp", sortState) + '</th><th>SPA Price (RM)' + getSortButtonHtml("spaPrice", sortState) + '</th>';
      } else {
        colGroups = '<col style="width:5%"><col style="width:20%"><col style="width:15%"><col style="width:30%"><col style="width:30%">';
        headers = '<th>No</th><th>Unit No</th><th>Status</th><th>Built Up (sqft)' + getSortButtonHtml("builtUp", sortState) + '</th><th>SPA Price (RM)' + getSortButtonHtml("spaPrice", sortState) + '</th>';
      }
    } else if (isSalakPerdana) {
      // Salak Perdana: hide Land Area column
      if (showBumiStatus) {
        colGroups = '<col style="width:5%"><col style="width:18%"><col style="width:10%"><col style="width:12%"><col style="width:30%"><col style="width:30%">';
        headers = '<th>No</th><th>Unit No</th><th>Bumi Status</th><th>Status</th><th>Built Up (sqft)' + getSortButtonHtml("builtUp", sortState) + '</th><th>SPA Price (RM)' + getSortButtonHtml("spaPrice", sortState) + '</th>';
      } else {
        colGroups = '<col style="width:5%"><col style="width:20%"><col style="width:15%"><col style="width:30%"><col style="width:30%">';
        headers = '<th>No</th><th>Unit No</th><th>Status</th><th>Built Up (sqft)' + getSortButtonHtml("builtUp", sortState) + '</th><th>SPA Price (RM)' + getSortButtonHtml("spaPrice", sortState) + '</th>';
      }
    } else if (isNsipKm1) {
      // NSIP KM1: full-width table with proper spacing
      if (showBumiStatus) {
        colGroups = '<col style="width:4%"><col style="width:12%"><col style="width:8%"><col style="width:8%"><col style="width:10%"><col style="width:10%"><col style="width:10%"><col style="width:10%"><col style="width:8%"><col style="width:20%">';
        headers = '<th>No</th><th>Unit No</th><th>Bumi Status</th><th>Status</th><th>Land Area (sqm)</th><th>Built Up (sqm)</th><th>Land Area (sqft)</th><th>Built Up (sqft)' + getSortButtonHtml("builtUp", sortState) + '</th><th>Unit Type</th><th>SPA Price (RM)' + getSortButtonHtml("spaPrice", sortState) + '</th>';
      } else {
        colGroups = '<col style="width:4%"><col style="width:14%"><col style="width:8%"><col style="width:11%"><col style="width:11%"><col style="width:11%"><col style="width:11%"><col style="width:10%"><col style="width:20%">';
        headers = '<th>No</th><th>Unit No</th><th>Status</th><th>Land Area (sqm)</th><th>Built Up (sqm)</th><th>Land Area (sqft)</th><th>Built Up (sqft)' + getSortButtonHtml("builtUp", sortState) + '</th><th>Unit Type</th><th>SPA Price (RM)' + getSortButtonHtml("spaPrice", sortState) + '</th>';
      }
    } else {
      if (showBumiStatus) {
        colGroups = '<col style="width:5%"><col style="width:18%"><col style="width:10%"><col style="width:12%"><col style="width:20%"><col style="width:20%"><col style="width:20%">';
        headers = '<th>No</th><th>Unit No</th><th>Bumi Status</th><th>Status</th><th>Land Area (sqft)</th><th>Built Up (sqft)' + getSortButtonHtml("builtUp", sortState) + '</th><th>SPA Price (RM)' + getSortButtonHtml("spaPrice", sortState) + '</th>';
      } else {
        colGroups = '<col style="width:5%"><col style="width:20%"><col style="width:15%"><col style="width:20%"><col style="width:20%"><col style="width:20%">';
        headers = '<th>No</th><th>Unit No</th><th>Status</th><th>Land Area (sqft)</th><th>Built Up (sqft)' + getSortButtonHtml("builtUp", sortState) + '</th><th>SPA Price (RM)' + getSortButtonHtml("spaPrice", sortState) + '</th>';
      }
    }

    var tableHtml = '<table class="asset-table"><colgroup>' + colGroups + '</colgroup><thead><tr>' + headers + '</tr></thead><tbody>';
    pageUnits.forEach(function(u, i) {
      var status = getDisplayStatus(u);
      var statusClass = (status || "").toLowerCase() === "available" ? ' style="color:#16a34a;font-weight:600;"' : '';
    var remark = (slug === "n-city-commercial") ? "" : getUnitRemark(u);
    var unitNoCell = esc(u.Unit_No) + (remark ? '<br><span style="color:#dc2626;font-size:11px;font-style:italic;display:block;margin-top:2px;">' + remark + '</span>' : '');
    if (isHighrise && isGid) {
        if (showBumiStatus) {
          tableHtml += '<tr><td>' + (start + i + 1) + '</td><td>' + unitNoCell + '</td><td>' + getBumiStatus(u.Unit_No) + '</td><td><span' + statusClass + '>' + status + '</span></td><td>' + formatArea(u.Built_Up) + '</td><td>' + formatPriceValue(u.Listing_Price) + '</td></tr>';
        } else {
          tableHtml += '<tr><td>' + (start + i + 1) + '</td><td>' + unitNoCell + '</td><td><span' + statusClass + '>' + status + '</span></td><td>' + formatArea(u.Built_Up) + '</td><td>' + formatPriceValue(u.Listing_Price) + '</td></tr>';
        }
      } else if (isHighrise) {
        if (showBumiStatus) {
          tableHtml += '<tr><td>' + (start + i + 1) + '</td><td>' + unitNoCell + '</td><td>' + getBumiStatus(u.Unit_No) + '</td><td><span' + statusClass + '>' + status + '</span></td><td>' + formatArea(u.Built_Up) + '</td><td>' + formatPriceValue(u.Listing_Price) + '</td></tr>';
        } else {
          tableHtml += '<tr><td>' + (start + i + 1) + '</td><td>' + unitNoCell + '</td><td><span' + statusClass + '>' + status + '</span></td><td>' + formatArea(u.Built_Up) + '</td><td>' + formatPriceValue(u.Listing_Price) + '</td></tr>';
        }
      } else if (isSalakPerdana) {
        if (showBumiStatus) {
          tableHtml += '<tr><td>' + (start + i + 1) + '</td><td>' + unitNoCell + '</td><td>' + getBumiStatus(u.Unit_No) + '</td><td><span' + statusClass + '>' + status + '</span></td><td>' + formatArea(u.Built_Up) + '</td><td>' + formatPriceValue(u.Listing_Price) + '</td></tr>';
        } else {
          tableHtml += '<tr><td>' + (start + i + 1) + '</td><td>' + unitNoCell + '</td><td><span' + statusClass + '>' + status + '</span></td><td>' + formatArea(u.Built_Up) + '</td><td>' + formatPriceValue(u.Listing_Price) + '</td></tr>';
        }
      } else if (isNsipKm1) {
        var landSqm = formatArea(u.Land_Area);
        var builtSqm = formatArea(u.Built_Up);
        var landSqft = (u.Land_Area && !isNaN(Number(u.Land_Area))) ? (Number(u.Land_Area) * 10.7639).toFixed(2) : '-';
        var builtSqft = (u.Built_Up && !isNaN(Number(u.Built_Up))) ? (Number(u.Built_Up) * 10.7639).toFixed(2) : '-';
        var unitType = esc(u.Unit_Type || '-');
        var unitLayout = esc(u.Unit_Layout || '-');
        var nsipPrice = formatPriceValue(u.Listing_Price);
        if (showBumiStatus) {
          tableHtml += '<tr><td>' + (start + i + 1) + '</td><td>' + unitNoCell + '</td><td>' + getBumiStatus(u.Unit_No) + '</td><td><span' + statusClass + '>' + status + '</span></td><td>' + landSqm + '</td><td>' + builtSqm + '</td><td>' + landSqft + '</td><td>' + builtSqft + '</td><td>' + unitType + '</td><td>' + nsipPrice + '</td></tr>';
        } else {
          tableHtml += '<tr><td>' + (start + i + 1) + '</td><td>' + unitNoCell + '</td><td><span' + statusClass + '>' + status + '</span></td><td>' + landSqm + '</td><td>' + builtSqm + '</td><td>' + landSqft + '</td><td>' + builtSqft + '</td><td>' + unitType + '</td><td>' + nsipPrice + '</td></tr>';
        }
      } else {
        if (showBumiStatus) {
          tableHtml += '<tr><td>' + (start + i + 1) + '</td><td>' + unitNoCell + '</td><td>' + getBumiStatus(u.Unit_No) + '</td><td><span' + statusClass + '>' + status + '</span></td><td>' + formatArea(u.Land_Area) + '</td><td>' + formatArea(u.Built_Up) + '</td><td>' + formatPriceValue(u.Listing_Price) + '</td></tr>';
        } else {
          tableHtml += '<tr><td>' + (start + i + 1) + '</td><td>' + unitNoCell + '</td><td><span' + statusClass + '>' + status + '</span></td><td>' + formatArea(u.Land_Area) + '</td><td>' + formatArea(u.Built_Up) + '</td><td>' + formatPriceValue(u.Listing_Price) + '</td></tr>';
        }
      }
    });
    tableHtml += '</tbody></table>';

    var cfg = getProjectConfig(slug);
    container.innerHTML = tableHtml;

    // Bind sort button clicks
    container.querySelectorAll(".sort-btn").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var column = this.getAttribute("data-sort");
        if (sortState.activeColumn === column) {
          sortState[column + "Dir"] = sortState[column + "Dir"] === "asc" ? "desc" : "asc";
        } else {
          sortState.activeColumn = column;
          sortState[column + "Dir"] = "asc";
        }
        state.page = 1;
        filterAndRender();
      });
    });

    // Render pagination
    if (paginationEl) {
      var pageInfo = totalPages > 1 ? 'Page ' + state.page + ' of ' + totalPages + ' (' + filtered.length + ' total)' : (filtered.length + ' units');
      paginationEl.innerHTML = '';
      if (totalPages > 1) {
        var prevBtn = document.createElement("button");
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.className = "table-filter";
        prevBtn.style.cssText = "padding:6px 12px;border:1px solid var(--border-light);border-radius:4px;background:#fff;cursor:pointer;font-size:13px;";
        prevBtn.disabled = state.page <= 1;
        prevBtn.addEventListener("click", function() { if (state.page > 1) { state.page--; filterAndRender(); } });
        paginationEl.appendChild(prevBtn);
      }
      var infoSpan = document.createElement("span");
      infoSpan.style.cssText = "font-size:13px;color:#5e6778;";
      infoSpan.textContent = pageInfo;
      paginationEl.appendChild(infoSpan);
      if (totalPages > 1) {
        var nextBtn = document.createElement("button");
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.className = "table-filter";
        nextBtn.style.cssText = "padding:6px 12px;border:1px solid var(--border-light);border-radius:4px;background:#fff;cursor:pointer;font-size:13px;";
        nextBtn.disabled = state.page >= totalPages;
        nextBtn.addEventListener("click", function() { if (state.page < totalPages) { state.page++; filterAndRender(); } });
        paginationEl.appendChild(nextBtn);
      }
    }
  }

  // Bind filter events
  if (phaseFilter && !phaseFilter.getAttribute("data-bound")) {
    phaseFilter.setAttribute("data-bound", "1");
    phaseFilter.addEventListener("change", function() { state.page = 1; filterAndRender(); });
  }
  if (typeFilter && !typeFilter.getAttribute("data-bound")) {
    typeFilter.setAttribute("data-bound", "1");
    typeFilter.addEventListener("change", function() { state.page = 1; filterAndRender(); });
  }
  if (blockFilter && !blockFilter.getAttribute("data-bound")) {
    blockFilter.setAttribute("data-bound", "1");
    blockFilter.addEventListener("change", function() { state.page = 1; filterAndRender(); });
  }

  filterAndRender();
}


function renderProjectHierarchy(slug, projectUnits) {
  var container = document.getElementById("ledgerContainer-" + slug);
  var phaseSelect = document.getElementById("filterPhase-" + slug);
  var typeSelect = document.getElementById("filterType-" + slug);
  if (!container) return;

  if (phaseSelect && phaseSelect.getAttribute("data-populated") !== "1") {
    Array.from(new Set(projectUnits.map(function(u) { return u.Phase || "N/A"; }))).sort().forEach(function(phase) {
      var option = document.createElement("option");
      option.value = phase;
      option.textContent = phase;
      phaseSelect.appendChild(option);
    });
    phaseSelect.setAttribute("data-populated", "1");
  }

  if (typeSelect && typeSelect.getAttribute("data-populated") !== "1") {
    Array.from(new Set(projectUnits.map(function(u) { return u.Unit_Type || "N/A"; }))).sort().forEach(function(unitType) {
      var option = document.createElement("option");
      option.value = unitType;
      option.textContent = getUnitTypeDisplay(unitType);
      typeSelect.appendChild(option);
    });
    typeSelect.setAttribute("data-populated", "1");
  }

  function renderFilteredHierarchy() {
    var filteredUnits = projectUnits;
    if (phaseSelect && phaseSelect.value) {
      filteredUnits = filteredUnits.filter(function(u) { return (u.Phase || "N/A") === phaseSelect.value; });
    }
    if (typeSelect && typeSelect.value) {
      filteredUnits = filteredUnits.filter(function(u) { return (u.Unit_Type || "N/A") === typeSelect.value; });
    }
    renderProjectHierarchyContent(slug, filteredUnits);
  }

  if (phaseSelect && phaseSelect.getAttribute("data-bound") !== "1") {
    phaseSelect.setAttribute("data-bound", "1");
    phaseSelect.addEventListener("change", renderFilteredHierarchy);
  }
  if (typeSelect && typeSelect.getAttribute("data-bound") !== "1") {
    typeSelect.setAttribute("data-bound", "1");
    typeSelect.addEventListener("change", renderFilteredHierarchy);
  }

  renderFilteredHierarchy();
}

function renderProjectHierarchyContent(slug, projectUnits) {
  var container = document.getElementById("ledgerContainer-" + slug);
  if (!container) return;
  container.innerHTML = "";

  var availableUnits = projectUnits.filter(isDisplayAvailable);
  var state = getOrInitState("project-" + slug);

  var projKey = "proj:" + slug;
  if (state[projKey] === undefined) state[projKey] = false;
  var expanded = state[projKey];

  var cfg = getProjectConfig(slug);
  var projName = cfg ? cfg.name : slug;

  var header = createGroupHeader(projName, computeAvailableUnits(availableUnits), expanded, "group-header-project", "Project");
  container.appendChild(header);

  var content = document.createElement("div");
  content.className = "group-content";
  content.style.display = expanded ? "block" : "none";
  container.appendChild(content);

  var childrenRendered = false;
  var thatSlug = slug;
  header.addEventListener("click", function() {
    var now = toggleLevel(state, projKey);
    if (now) {
      if (!childrenRendered) {
        renderProjectPhasesAccordion(content, availableUnits, thatSlug, projName);
        childrenRendered = true;
      }
      content.style.display = "block";
    } else {
      content.style.display = "none";
      for (var k in state) {
        if (k.indexOf("phase:" + thatSlug + ":") === 0 || k.indexOf("ut:" + thatSlug + ":") === 0) {
          state[k] = false;
        }
      }
      collapseChildren(content);
    }
    var chev = header.querySelector(".group-chevron i");
    if (chev) chev.className = "fas " + (now ? "fa-chevron-down" : "fa-chevron-right");
  });
}

function renderProjectPhasesAccordion(container, units, slug, projName) {
  var state = getOrInitState("project-" + slug);

  var phaseGroups = groupBy(units, function(u) { return u.Phase || "N/A"; });
  Object.keys(phaseGroups).sort().forEach(function(phase) {
    var phaseUnits = phaseGroups[phase];
    var phaseKey = "phase:" + slug + ":" + phase;
    if (state[phaseKey] === undefined) state[phaseKey] = false;

    var header = createGroupHeader(phase, computeAvailableUnits(phaseUnits), false, "group-header-type group-indent-1", "Phase");
    container.appendChild(header);

    var content = document.createElement("div");
    content.className = "group-content group-indent-1";
    content.style.display = "none";
    container.appendChild(content);

    header.addEventListener("click", function() {
      var now = toggleLevel(state, phaseKey);
      if (now) {
        renderProjectUnitTypesAccordion(content, phaseUnits, slug, phase, projName);
        content.style.display = "block";
      } else {
        content.style.display = "none";
        collapseChildren(content);
      }
      var chev = header.querySelector(".group-chevron i");
      if (chev) chev.className = "fas " + (now ? "fa-chevron-down" : "fa-chevron-right");
    });
  });
}

function renderProjectUnitTypesAccordion(container, units, slug, phase, projName) {
  var typeGroups = groupBy(units, function(u) { return u.Unit_Type || "N/A"; });
  var state = getOrInitState("project-" + slug);
  var rowNum = 0;

  Object.keys(typeGroups).sort().forEach(function(ut) {
    var utUnits = typeGroups[ut];
    var utKey = "ut:" + slug + ":" + phase + ":" + ut;
    if (state[utKey] === undefined) state[utKey] = false;

    var displayValue = ut;
    if (utUnits.length > 0 && utUnits[0].Unit_Type_Display) {
      displayValue = utUnits[0].Unit_Type_Display;
    } else {
      displayValue = getUnitTypeDisplay(ut);
    }

    var header = createGroupHeader(displayValue, computeAvailableUnits(utUnits), false, "group-header-ownership", "Unit Type");
    container.appendChild(header);

    var content = document.createElement("div");
    content.className = "group-content group-indent-2";
    content.style.display = "none";
    container.appendChild(content);

    header.addEventListener("click", function() {
      var now = toggleLevel(state, utKey);
      if (now) {
        var wrapper = document.createElement("div");
        wrapper.className = "group-table-wrapper";
        wrapper.appendChild(createUnitsTable(utUnits, rowNum, projName));
        content.appendChild(wrapper);
        content.style.display = "block";
      } else {
        content.style.display = "none";
        collapseChildren(content);
      }
      var chev = header.querySelector(".group-chevron i");
      if (chev) chev.className = "fas " + (now ? "fa-chevron-down" : "fa-chevron-right");
    });
  });
}

function renderProjectTotalPriceKPI(slug, projectUnits) {
  var el = document.getElementById("kpi-price-" + slug);
  if (!el) return;
  el.textContent = formatPrice(computeDisplayedTotalPrice(projectUnits));
}

function renderProjectKPI(slug, projectUnits) {
  var el = document.getElementById("kpi-" + slug);
  if (!el) return;
  el.textContent = computeAvailableUnits(projectUnits);
}

/* ==========================================================================
   NSIP KM1 VIEW
   ========================================================================== */
var __nsipSharedData = null;

function renderNsipKm1View() {
  var panel = document.getElementById("view-nsip-km1");
  if (!panel) return;
  var status = getProjectStatus("NSIP");
  var nsipProjectName = "NCT SMART INDUSTRIAL PARK KM1";

  panel.innerHTML =
    '<div class="page-header">' +
    '  <div style="display:flex;justify-content:space-between;align-items:center;flex:1;flex-wrap:wrap;gap:8px;">' +
    '    <div><h1 style="margin-right:12px;">' + nsipProjectName + ' (230.09 acre)</h1><div class="header-sub">Project Dashboard</div></div>' +
    '  </div>' +
    '  <div class="data-extracted-box"><div class="de-label">Updated as of</div><div class="de-date">15 July 2026</div></div></div>' +
    '</div>' +
    '<div class="project-image-banner" id="project-image-nsip" style="background:#000000;border-radius:10px;overflow:hidden;margin-bottom:20px;position:relative;cursor:pointer;" title="Double-click to view full image">' +
    '  <div style="display:flex;align-items:center;justify-content:center;min-height:200px;max-height:400px;padding:20px;">' +
    '    <div style="color:#9ca3af;font-size:14px;"><i class="fas fa-spinner fa-spin" style="font-size:24px;display:block;margin-bottom:8px;"></i>Loading project image...</div>' +
    '  </div>' +
    '</div>' +
    '<div class="project-kpi-container">' +
    '  <div class="card project-kpi-box"><div class="project-kpi-label"><i class="fas fa-check-circle" style="color:#10b981;margin-right:8px;"></i>Total Available Units</div><div class="project-kpi-value" id="kpi-nsip">0</div></div>' +
    '  <div class="card project-kpi-price-box"><div class="project-kpi-label"><i class="fas fa-dollar-sign" style="color:#2563eb;margin-right:8px;"></i>Total SPA Price</div><div class="project-kpi-value" id="kpi-price-nsip">RM 0</div></div>' +
    '</div>' +
    '<div id="nsip-svg-wrapper" style="width:100%;display:flex;flex-direction:column;gap:20px;box-sizing:border-box;padding:0;margin-bottom:20px;">' +
    '  ' + renderLayoutPlanHeader(getLayoutBalance("NCT SMART INDUSTRIAL PARK KM1")) + '' +
    '  <div id="nsip-svg-stage" style="width:100%;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);overflow:hidden;min-height:200px;">' +
    '    <div style="display:flex;align-items:center;justify-content:center;height:200px;color:#5e6778;font-style:italic;">Loading layout...</div>' +
    '  </div>' +
    '  <div id="nsip-layout-legends"></div>' +
    '  <div id="nsip-layout-summary"></div>' +
    '</div>' +
    '' + renderProjectDetails("NCT SMART INDUSTRIAL PARK KM1") + '' +
    '<div class="card" id="staticAssetList-nsip">' +
    '  <div class="card-header">' +
    '    <span class="card-title"><i class="fas fa-table"></i> AVAILABLE UNIT LIST</span>' +
    '    <div class="table-controls">' +
    '      <select id="staticFilterPhase-nsip" class="table-filter"><option value="">All Phases</option></select>' +
    '      <select id="staticFilterType-nsip" class="table-filter"><option value="">All Unit Types</option></select>' +
    '      <button id="resetSort-nsip" class="table-filter" style="padding:6px 12px;border:1px solid var(--border-light);border-radius:4px;background:#fff;cursor:pointer;font-size:13px;font-weight:600;color:#0f2042;"><i class="fas fa-undo" style="margin-right:4px;"></i>Reset Sort</button>' +
    '    </div>' +
    '  </div>' +
    '  <div id="staticLedgerContainer-nsip" class="asset-table-container"></div>' +
    '  <div id="staticPagination-nsip" style="display:flex;align-items:center;justify-content:center;gap:12px;margin-top:16px;padding-top:12px;border-top:1px solid var(--border-light);"></div>' +
    '</div>' +
    '<div class="card">' +
    '  <div class="card-header"><span class="card-title"><i class="fas fa-list"></i> AVAILABLE UNIT BY PHASE</span></div>' +
    '  <div id="ledgerContainer-nsip"></div>' +
    '</div>';

  loadProjectImageBanner("nsip", "NSIP");

  fetch("/api/layout/nsip")
    .then(function(res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
    .then(function(json) {
      var layoutUnits = (json && json.data) ? json.data : [];
      if (!Array.isArray(layoutUnits)) layoutUnits = [];

      __nsipSharedData = {
        units: layoutUnits,
        available: layoutUnits.filter(function(u) { return String(u.Status).trim().toLowerCase() === 'available'; }).length,
        signed: layoutUnits.filter(function(u) { return String(u.Status).trim().toLowerCase() === 'signed'; }).length,
        sold: layoutUnits.filter(function(u) { return String(u.Status).trim().toLowerCase() === 'sold'; }).length,
        registered: layoutUnits.filter(function(u) { return String(u.Status).trim().toLowerCase() === 'registered'; }).length,
        total: layoutUnits.length
      };

      var kpiEl = document.getElementById("kpi-nsip");
      if (kpiEl) kpiEl.textContent = computeAvailableUnits(__nsipSharedData.units);
      var priceEl = document.getElementById("kpi-price-nsip");
      if (priceEl) priceEl.textContent = formatPrice(computeDisplayedTotalPrice(__nsipSharedData.units));

      try { renderNsipHierarchy(__nsipSharedData.units); } catch(e) { console.error("Hierarchy:", e); }
      try { renderStaticAssetTable("nsip", __nsipSharedData.units); } catch(e) { console.error("Static NSIP table:", e); }
      try { renderPsfInfoBox("nsip"); } catch(e) { console.error("PSF info:", e); }

      // Use standardized SVG renderer with zoom controls
      renderInteractiveSvg({
        svgUrl: "/static/NSIP_Master.svg",
        stageId: "nsip-svg-stage",
        legendsId: "nsip-layout-legends",
        summaryId: "nsip-layout-summary",
        units: __nsipSharedData.units,
        sharedDataVar: "__nsipSharedData",
        modalId: "nsip-unit-modal",
        modalBodyId: "nsip-modal-body",
        modalCloseId: "nsip-modal-close",
        modalOverlayId: "nsip-modal-overlay",
        copyBtnId: "nsip-copy-btn",
        fitToScreen: true,
        preserveNotAvailableOnHover: true,
        onSvgLoaded: function(data) {
          renderNsipLayoutLegends();
        }
      });
    })
    .catch(function(err) {
      console.error("Failed to load NSIP layout data:", err);
    });
}

function applyNsipSvgOverlay(layoutData) {
  var polygons = document.querySelectorAll('#nsip-svg-stage svg path, #nsip-svg-stage svg polygon, #nsip-svg-stage svg rect, #nsip-svg-stage svg circle, #nsip-svg-stage svg ellipse');

  var allUnitMap = {};
  layoutData.forEach(function(unit) {
    var raw = String(unit.Unit_No).trim().toUpperCase();
    var stripped = raw.replace(/^([A-Z]+)0+(\d)/, '$1$2');
    allUnitMap[stripped] = unit;
    allUnitMap[raw] = unit;
    var padded = raw.replace(/^([A-Z]+)(\d)$/, '$10$2');
    if (padded !== raw) allUnitMap[padded] = unit;
  });

  polygons.forEach(function(p) {
    if (!p.id) return;
    if (p.id.match(/^[A-Z]\d/) && !p.id.match(/^(svg|defs|namedview|layer|image|false)$/i)) {
      p.classList.add('not-available');
    }
  });

  layoutData.forEach(function(unit) {
    var status = String(unit.Status || '').trim().toLowerCase();
    var unitNo = String(unit.Unit_No || '').trim().toUpperCase();
    var key = unitNo.replace(/\s+/g, '').replace(/-/g, '').replace(/^([A-Z]+)0+(\d)/, '$1$2');

    var poly = document.getElementById(key);
    if (!poly) poly = document.getElementById(unitNo);
    if (!poly) poly = document.getElementById(String(unit.Unit_No).trim());

    if (poly) {
      poly._unitData = unit;
      if (status === 'available') {
        poly.classList.remove('not-available');
        poly.classList.add('available');
      }
    }
  });

  bindNsipSvgInteractions();
  renderNsipSvgSummary(__nsipSharedData);
  renderNsipLayoutLegends();
}

function bindNsipSvgInteractions() {
  var svg = document.querySelector('#nsip-svg-stage svg');
  if (!svg) return;

  svg.addEventListener('mouseover', function(e) {
    var target = e.target;
    if (target && target.id && target.classList) {
      target.style.fillOpacity = target.classList.contains('available') ? '0.95' : '0.50';
    }
  });

  svg.addEventListener('mouseout', function(e) {
    var target = e.target;
    if (target && target.id && target.classList) {
      target.style.fillOpacity = '';
    }
  });

  svg.addEventListener('click', function(e) {
    var target = e.target;
    if (target && target.id) {
      var tag = target.tagName;
      if (tag === 'path' || tag === 'polygon' || tag === 'rect' || tag === 'circle' || tag === 'ellipse') {
        var unit = target._unitData || null;
        showNsipUnitModal(unit, target.id);
      }
    }
  });
}

function renderNsipSvgSummary(sharedData) {
  var summaryContainer = document.getElementById('nsip-layout-summary');
  if (!summaryContainer) return;

  summaryContainer.innerHTML =
    '<div style="display:flex;gap:12px;flex-wrap:wrap;">' +
    '  <div style="flex:1;min-width:120px;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);text-align:center;">' +
    '    <div style="font-size:10px;color:#5e6778;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:2px;">Available</div>' +
    '    <div style="font-size:24px;font-weight:700;color:#00cc44;">' + sharedData.available + '</div>' +
    '  </div>' +
    '  <div style="flex:1;min-width:120px;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);text-align:center;">' +
    '    <div style="font-size:10px;color:#5e6778;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:2px;">Signed</div>' +
    '    <div style="font-size:24px;font-weight:700;color:#9E9E9E;">' + sharedData.signed + '</div>' +
    '  </div>' +
    '  <div style="flex:1;min-width:120px;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);text-align:center;">' +
    '    <div style="font-size:10px;color:#5e6778;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:2px;">Sold</div>' +
    '    <div style="font-size:24px;font-weight:700;color:#9E9E9E;">' + sharedData.sold + '</div>' +
    '  </div>' +
    '  <div style="flex:1;min-width:120px;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);text-align:center;">' +
    '    <div style="font-size:10px;color:#5e6778;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:2px;">Registered</div>' +
    '    <div style="font-size:24px;font-weight:700;color:#9E9E9E;">' + sharedData.registered + '</div>' +
    '  </div>' +
    '  <div style="flex:1;min-width:120px;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);text-align:center;">' +
    '    <div style="font-size:10px;color:#5e6778;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:2px;">Total</div>' +
    '    <div style="font-size:24px;font-weight:700;color:#0f2042;">' + sharedData.total + '</div>' +
    '  </div>' +
    '</div>';
}

function renderNsipLayoutLegends() {
  var legendsContainer = document.getElementById('nsip-layout-legends');
  if (!legendsContainer) return;
  legendsContainer.innerHTML =
    '<div style="display:flex;gap:16px;align-items:center;padding:8px 16px;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06);font-size:12px;color:#5e6778;">' +
    '  <div style="display:flex;align-items:center;gap:6px;"><span style="width:12px;height:12px;border-radius:3px;background:#00E676;display:inline-block;"></span> Available Unit</div>' +
    '</div>';
}

function showNsipUnitModal(unit, svgId) {
  var modalEl = document.getElementById('nsip-unit-modal');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'nsip-unit-modal';
    modalEl.style.cssText = 'position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:99999;';
    modalEl.innerHTML =
      '<div style="position:fixed;inset:0;background:rgba(15,23,42,0.75);backdrop-filter:blur(4px);z-index:0;" id="nsip-modal-overlay"></div>' +
      '<div style="position:relative;z-index:1;width:480px;max-width:calc(100vw-32px);max-height:85vh;background:#ffffff;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,0.35);display:flex;flex-direction:column;overflow:hidden;font-family:Inter,system-ui,sans-serif;">' +
      '  <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:linear-gradient(180deg,#ffffff 0%,#f8fafc 100%);border-bottom:1px solid #eef0f4;">' +
      '    <span style="font-weight:700;font-size:14px;color:#0f2042;text-transform:uppercase;letter-spacing:0.6px;">Unit Details</span>' +
      '    <button id="nsip-modal-close" style="width:32px;height:32px;border-radius:8px;border:1px solid #eef0f4;background:#ffffff;color:#5e6778;font-size:20px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 120ms ease,color 120ms ease;">&times;</button>' +
      '  </div>' +
      '  <div id="nsip-modal-body" style="padding:16px 20px;overflow-y:auto;"></div>' +
      '  <div style="padding:12px 20px;border-top:1px solid #eef0f4;background:#f8fafc;display:flex;justify-content:flex-end;">' +
      '    <button id="nsip-copy-btn" style="display:inline-flex;align-items:center;gap:8px;padding:9px 18px;border-radius:8px;border:1px solid #eef0f4;background:#ffffff;color:#0f2042;font-size:13px;font-weight:600;cursor:pointer;"><i class="fas fa-copy" style="color:#f47217;font-size:12px;"></i> Copy Details</button>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(modalEl);
    document.getElementById('nsip-modal-close').addEventListener('click', function() { modalEl.style.display = 'none'; });
    document.getElementById('nsip-modal-overlay').addEventListener('click', function() { modalEl.style.display = 'none'; });
    document.getElementById('nsip-copy-btn').addEventListener('click', function() {
      var body = document.getElementById('nsip-modal-body');
      var text = body ? body.innerText || body.textContent || '' : '';
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text.trim()).catch(function() {});
      }
    });
  }

  var modalBody = document.getElementById('nsip-modal-body');
  if (!modalBody) return;

  var displayId = unit ? String(unit.Unit_No || svgId || '') : (svgId || '');
  var status = unit ? String(unit.Status || '') : '';
  var project = unit ? String(unit.Project || '') : '';
  var propertyType = unit ? String(unit.Property_Type || '') : '';
  var ownership = unit ? String(unit.Property_Ownership || '') : '';
  var block = unit ? String(unit.Block || '') : '';
  var phase = unit ? String(unit.Phase || '') : '';
  var lotNo = unit ? String(unit.Lot_No || '') : '';
  var unitType = unit ? String(unit.Unit_Type || '') : '';
  var builtUp = unit ? formatArea(unit.Built_Up) : '-';
  var landArea = unit ? formatArea(unit.Land_Area) : '-';
  var price = unit ? formatPrice(unit.Listing_Price || unit.SPA_Signed_Price || unit.Price || 0) : '';

  var statusClass = '';
  var statusDisplay = 'Not Available';
  if (status.toLowerCase() === 'available') {
    statusClass = ' style="color:#16a34a;font-weight:700;"';
    statusDisplay = 'Available';
  } else if (status) {
    statusClass = ' style="color:#dc2626;font-weight:700;"';
    statusDisplay = status;
  }

  modalBody.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Unit</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (displayId || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Status</span><span style="font-size:13px;' + 'font-weight:500;text-align:right;"' + statusClass + '>' + statusDisplay + '</span></div>' +
    '<div style="height:1px;background:#eef0f4;margin:10px 0;"></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Project</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (project || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Phase</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (phase || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Block</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (block || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Lot No</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (lotNo || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Unit Type</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (unitType || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Built Up (sqft)</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (builtUp || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Land Area (sqft)</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (landArea || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Price</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (price || '-') + '</span></div>';

  modalEl.style.display = 'flex';
}

function renderNsipHierarchy(projectUnits) {
  var container = document.getElementById("ledgerContainer-nsip");
  if (!container) return;

  var availableUnits = projectUnits.filter(isDisplayAvailable);
  var state = getOrInitState("project-nsip");

  var projKey = "proj:nsip";
  if (state[projKey] === undefined) state[projKey] = false;

  var header = createGroupHeader("NCT SMART INDUSTRIAL PARK KM1", computeAvailableUnits(availableUnits), false, "group-header-project", "Project");
  container.appendChild(header);

  var content = document.createElement("div");
  content.className = "group-content";
  content.style.display = "none";
  container.appendChild(content);

  var childrenRendered = false;
  header.addEventListener("click", function() {
    var now = toggleLevel(state, projKey);
    if (now) {
      if (!childrenRendered) {
        renderProjectPhasesAccordion(content, availableUnits, "nsip", "NCT SMART INDUSTRIAL PARK KM1");
        childrenRendered = true;
      }
      content.style.display = "block";
    } else {
      content.style.display = "none";
      for (var k in state) {
        if (k.indexOf("phase:nsip:") === 0 || k.indexOf("ut:nsip:") === 0) {
          state[k] = false;
        }
      }
      collapseChildren(content);
    }
    var chev = header.querySelector(".group-chevron i");
    if (chev) chev.className = "fas " + (now ? "fa-chevron-down" : "fa-chevron-right");
  });
}

function renderNsipTotalPriceKPI(projectUnits) {
  var el = document.getElementById("kpi-price-nsip");
  if (!el) return;
  var sumPrice = projectUnits.filter(isAvailable).reduce(function(acc, u) { return acc + (Number(u.Listing_Price) || 0); }, 0);
  el.textContent = formatPrice(sumPrice);
}

/* ==========================================================================
   N-CITY VIEW
   ========================================================================== */
var __ncitySharedData = null;

function renderNcityView() {
  var panel = document.getElementById("view-n-city");
  if (!panel) return;
  var status = getProjectStatus("N-CITY");
  var ncityProjectName = "N-CITY";

  panel.innerHTML =
    '<div class="page-header">' +
    '  <div style="display:flex;justify-content:space-between;align-items:center;flex:1;flex-wrap:wrap;gap:8px;">' +
    '    <div><h1 style="margin-right:12px;">' + ncityProjectName.toUpperCase() + '</h1><div class="header-sub">Project Dashboard</div></div>' +
    '  </div>' +
    '  <div class="data-extracted-box"><div class="de-label">Updated as of</div><div class="de-date">15 July 2026</div></div></div>' +
    '</div>' +
    '<div class="project-image-banner" id="project-image-ncity" style="background:#000000;border-radius:10px;overflow:hidden;margin-bottom:20px;position:relative;cursor:pointer;" title="Double-click to view full image">' +
    '  <div style="display:flex;align-items:center;justify-content:center;min-height:200px;max-height:400px;padding:20px;">' +
    '    <div style="color:#9ca3af;font-size:14px;"><i class="fas fa-spinner fa-spin" style="font-size:24px;display:block;margin-bottom:8px;"></i>Loading project image...</div>' +
    '  </div>' +
    '</div>' +
    '<div class="project-kpi-container">' +
    '  <div class="card project-kpi-box"><div class="project-kpi-label"><i class="fas fa-check-circle" style="color:#10b981;margin-right:8px;"></i>Total Available Units</div><div class="project-kpi-value" id="kpi-ncity">0</div></div>' +
    '  <div class="card project-kpi-price-box"><div class="project-kpi-label"><i class="fas fa-dollar-sign" style="color:#2563eb;margin-right:8px;"></i>Total SPA Price</div><div class="project-kpi-value" id="kpi-price-ncity">RM 0</div></div>' +
    '</div>' +
    '<div id="ncity-svg-wrapper" style="width:100%;display:flex;flex-direction:column;gap:20px;box-sizing:border-box;padding:0;margin-bottom:20px;">' +
    '  ' + renderLayoutPlanHeader(getLayoutBalance("N-CITY — COMMERCIAL")) + '' +
    '  <div id="ncity-svg-stage" style="width:100%;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);overflow:hidden;min-height:200px;">' +
    '    <div style="display:flex;align-items:center;justify-content:center;height:200px;color:#5e6778;font-style:italic;">Loading layout...</div>' +
    '  </div>' +
    '  <div id="ncity-layout-legends"></div>' +
    '  <div id="ncity-layout-summary"></div>' +
    '</div>' +
    '<div class="card" id="staticAssetList-ncity">' +
    '  <div class="card-header">' +
    '    <span class="card-title"><i class="fas fa-table"></i> AVAILABLE UNIT LIST</span>' +
    '    <div class="table-controls">' +
    '      <select id="staticFilterPhase-ncity" class="table-filter"><option value="">All Phases</option></select>' +
    '      <select id="staticFilterType-ncity" class="table-filter"><option value="">All Unit Types</option></select>' +
    '      <button id="resetSort-ncity" class="table-filter" style="padding:6px 12px;border:1px solid var(--border-light);border-radius:4px;background:#fff;cursor:pointer;font-size:13px;font-weight:600;color:#0f2042;"><i class="fas fa-undo" style="margin-right:4px;"></i>Reset Sort</button>' +
    '    </div>' +
    '  </div>' +
    '  <div id="staticLedgerContainer-ncity" class="asset-table-container"></div>' +
    '  <div id="staticPagination-ncity" style="display:flex;align-items:center;justify-content:center;gap:12px;margin-top:16px;padding-top:12px;border-top:1px solid var(--border-light);"></div>' +
    '</div>' +
    '<div class="card">' +
    '  <div class="card-header"><span class="card-title"><i class="fas fa-list"></i> AVAILABLE UNIT BY PHASE</span></div>' +
    '  <div id="ledgerContainer-ncity"></div>' +
    '</div>';

  loadProjectImageBanner("ncity", "N-CITY");

  fetch("/api/layout/ncity")
    .then(function(res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
    .then(function(json) {
      var layoutUnits = (json && json.data) ? json.data : [];
      if (!Array.isArray(layoutUnits)) layoutUnits = [];

      __ncitySharedData = {
        units: layoutUnits,
        available: layoutUnits.filter(function(u) { return String(u.Status).trim().toLowerCase() === 'available'; }).length,
        signed: layoutUnits.filter(function(u) { return String(u.Status).trim().toLowerCase() === 'signed'; }).length,
        sold: layoutUnits.filter(function(u) { return String(u.Status).trim().toLowerCase() === 'sold'; }).length,
        registered: layoutUnits.filter(function(u) { return String(u.Status).trim().toLowerCase() === 'registered'; }).length,
        total: layoutUnits.length
      };

      var kpiEl = document.getElementById("kpi-ncity");
      if (kpiEl) kpiEl.textContent = computeAvailableUnits(__ncitySharedData.units);
      var priceEl = document.getElementById("kpi-price-ncity");
      if (priceEl) priceEl.textContent = formatPrice(computeDisplayedTotalPrice(__ncitySharedData.units));

      try { renderNcityHierarchy(__ncitySharedData.units); } catch(e) { console.error("Hierarchy:", e); }
      try { renderStaticAssetTable("ncity", __ncitySharedData.units); } catch(e) { console.error("Static table:", e); }

      // Use standardized SVG renderer with zoom controls
      renderInteractiveSvg({
        svgUrl: "/static/N-CITY_Master.svg",
        stageId: "ncity-svg-stage",
        legendsId: "ncity-layout-legends",
        summaryId: "ncity-layout-summary",
        units: __ncitySharedData.units,
        sharedDataVar: "__ncitySharedData",
        fitToScreen: true,
        onSvgLoaded: function(data) {
          // Apply N-City-specific D42 override after standard overlay
          var d42 = document.getElementById("D42");
          if (d42) {
            d42._unitData.Status = 'Sold';
            d42.classList.remove('available');
            d42.classList.add('not-available');
          }
          renderNcityLayoutLegends();
        }
      });
    })
    .catch(function(err) {
      console.error("Failed to load N-CITY layout data:", err);
    });
}

function applyNcitySvgOverlay(layoutData) {
  var polygons = document.querySelectorAll('#ncity-svg-stage svg path, #ncity-svg-stage svg polygon, #ncity-svg-stage svg rect, #ncity-svg-stage svg circle, #ncity-svg-stage svg ellipse');

  var allUnitMap = {};
  layoutData.forEach(function(unit) {
    var raw = String(unit.Unit_No).trim().toUpperCase();
    var stripped = raw.replace(/^([A-Z]+)0+(\d)/, '$1$2');
    allUnitMap[stripped] = unit;
    allUnitMap[raw] = unit;
    var padded = raw.replace(/^([A-Z]+)(\d)$/, '$10$2');
    if (padded !== raw) allUnitMap[padded] = unit;
  });

  polygons.forEach(function(p) {
    if (!p.id) return;
    if (p.id.match(/^[A-Z]\d/) && !p.id.match(/^(svg|defs|namedview|layer|image|false)$/i)) {
      p.classList.add('not-available');
    }
  });

  layoutData.forEach(function(unit) {
    var status = String(unit.Status || '').trim().toLowerCase();
    var unitNo = String(unit.Unit_No || '').trim().toUpperCase();
    var key = unitNo.replace(/\s+/g, '').replace(/-/g, '').replace(/^([A-Z]+)0+(\d)/, '$1$2');

    var poly = document.getElementById(key);
    if (!poly) poly = document.getElementById(unitNo);
    if (!poly) poly = document.getElementById(String(unit.Unit_No).trim());

    if (poly) {
      poly._unitData = unit;
      if (unitNo === 'D42') {
        poly._unitData.Status = 'Sold';
        poly.classList.remove('available');
        poly.classList.add('not-available');
      } else if (status === 'available') {
        poly.classList.remove('not-available');
        poly.classList.add('available');
      }
    }
  });

  bindNcitySvgInteractions();
  renderNcitySvgSummary(__ncitySharedData);
  renderNcityLayoutLegends();
}

function bindNcitySvgInteractions() {
  var svg = document.querySelector('#ncity-svg-stage svg');
  if (!svg) return;

  svg.addEventListener('mouseover', function(e) {
    var target = e.target;
    if (target && target.id && target.classList) {
      // Only apply hover effect to available units - grey units stay grey
      if (target.classList.contains('available')) {
        target.style.fillOpacity = '0.95';
      }
    }
  });

  svg.addEventListener('mouseout', function(e) {
    var target = e.target;
    if (target && target.id && target.classList) {
      // Only clear hover effect from available units
      if (target.classList.contains('available')) {
        target.style.fillOpacity = '';
      }
    }
  });

  svg.addEventListener('click', function(e) {
    var target = e.target;
    if (target && target.id) {
      var tag = target.tagName;
      if (tag === 'path' || tag === 'polygon' || tag === 'rect' || tag === 'circle' || tag === 'ellipse') {
        var unit = target._unitData || null;
        showNcityUnitModal(unit, target.id);
      }
    }
  });
}

function renderNcitySvgSummary(sharedData) {
  var summaryContainer = document.getElementById('ncity-layout-summary');
  if (!summaryContainer) return;

  summaryContainer.innerHTML =
    '<div style="display:flex;gap:12px;flex-wrap:wrap;">' +
    '  <div style="flex:1;min-width:120px;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);text-align:center;">' +
    '    <div style="font-size:10px;color:#5e6778;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:2px;">Available</div>' +
    '    <div style="font-size:24px;font-weight:700;color:#00cc44;">' + sharedData.available + '</div>' +
    '  </div>' +
    '  <div style="flex:1;min-width:120px;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);text-align:center;">' +
    '    <div style="font-size:10px;color:#5e6778;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:2px;">Signed</div>' +
    '    <div style="font-size:24px;font-weight:700;color:#9E9E9E;">' + sharedData.signed + '</div>' +
    '  </div>' +
    '  <div style="flex:1;min-width:120px;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);text-align:center;">' +
    '    <div style="font-size:10px;color:#5e6778;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:2px;">Sold</div>' +
    '    <div style="font-size:24px;font-weight:700;color:#9E9E9E;">' + sharedData.sold + '</div>' +
    '  </div>' +
    '  <div style="flex:1;min-width:120px;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);text-align:center;">' +
    '    <div style="font-size:10px;color:#5e6778;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:2px;">Registered</div>' +
    '    <div style="font-size:24px;font-weight:700;color:#9E9E9E;">' + sharedData.registered + '</div>' +
    '  </div>' +
    '  <div style="flex:1;min-width:120px;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);text-align:center;">' +
    '    <div style="font-size:10px;color:#5e6778;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:2px;">Total</div>' +
    '    <div style="font-size:24px;font-weight:700;color:#0f2042;">' + sharedData.total + '</div>' +
    '  </div>' +
    '</div>';
}

function renderNcityLayoutLegends() {
  var legendsContainer = document.getElementById('ncity-layout-legends');
  if (!legendsContainer) return;
  legendsContainer.innerHTML =
    '<div style="display:flex;gap:16px;align-items:center;padding:8px 16px;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06);font-size:12px;color:#5e6778;">' +
    '  <div style="display:flex;align-items:center;gap:6px;"><span style="width:12px;height:12px;border-radius:3px;background:#00E676;display:inline-block;"></span> Available Unit</div>' +
    '</div>';
}

function showNcityUnitModal(unit, svgId) {
  var modalEl = document.getElementById('ncity-unit-modal');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'ncity-unit-modal';
    modalEl.style.cssText = 'position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:99999;';
    modalEl.innerHTML =
      '<div style="position:fixed;inset:0;background:rgba(15,23,42,0.75);backdrop-filter:blur(4px);z-index:0;" id="ncity-modal-overlay"></div>' +
      '<div style="position:relative;z-index:1;width:480px;max-width:calc(100vw-32px);max-height:85vh;background:#ffffff;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,0.35);display:flex;flex-direction:column;overflow:hidden;font-family:Inter,system-ui,sans-serif;">' +
      '  <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:linear-gradient(180deg,#ffffff 0%,#f8fafc 100%);border-bottom:1px solid #eef0f4;">' +
      '    <span style="font-weight:700;font-size:14px;color:#0f2042;text-transform:uppercase;letter-spacing:0.6px;">Unit Details</span>' +
      '    <button id="ncity-modal-close" style="width:32px;height:32px;border-radius:8px;border:1px solid #eef0f4;background:#ffffff;color:#5e6778;font-size:20px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 120ms ease,color 120ms ease;">&times;</button>' +
      '  </div>' +
      '  <div id="ncity-modal-body" style="padding:16px 20px;overflow-y:auto;"></div>' +
      '  <div style="padding:12px 20px;border-top:1px solid #eef0f4;background:#f8fafc;display:flex;justify-content:flex-end;">' +
      '    <button id="ncity-copy-btn" style="display:inline-flex;align-items:center;gap:8px;padding:9px 18px;border-radius:8px;border:1px solid #eef0f4;background:#ffffff;color:#0f2042;font-size:13px;font-weight:600;cursor:pointer;"><i class="fas fa-copy" style="color:#f47217;font-size:12px;"></i> Copy Details</button>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(modalEl);
    document.getElementById('ncity-modal-close').addEventListener('click', function() { modalEl.style.display = 'none'; });
    document.getElementById('ncity-modal-overlay').addEventListener('click', function() { modalEl.style.display = 'none'; });
    document.getElementById('ncity-copy-btn').addEventListener('click', function() {
      var body = document.getElementById('ncity-modal-body');
      var text = body ? body.innerText || body.textContent || '' : '';
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text.trim()).catch(function() {});
      }
    });
  }

  var modalBody = document.getElementById('ncity-modal-body');
  if (!modalBody) return;

  var displayId = unit ? String(unit.Unit_No || svgId || '') : (svgId || '');
  var status = unit ? String(unit.Status || '') : '';
  var project = unit ? String(unit.Project || '') : '';
  var propertyType = unit ? String(unit.Property_Type || '') : '';
  var ownership = unit ? String(unit.Property_Ownership || '') : '';
  var block = unit ? String(unit.Block || '') : '';
  var phase = unit ? String(unit.Phase || '') : '';
  var lotNo = unit ? String(unit.Lot_No || '') : '';
  var unitType = unit ? String(unit.Unit_Type || '') : '';
  var builtUp = unit ? formatArea(unit.Built_Up) : '-';
  var landArea = unit ? formatArea(unit.Land_Area) : '-';
  var price = unit ? formatPrice(unit.Listing_Price || unit.SPA_Signed_Price || unit.Price || 0) : '';

  var statusClass = '';
  var statusDisplay = 'Not Available';
  if (status.toLowerCase() === 'available') {
    statusClass = ' style="color:#16a34a;font-weight:700;"';
    statusDisplay = 'Available';
  } else if (status) {
    statusClass = ' style="color:#dc2626;font-weight:700;"';
    statusDisplay = status;
  }

  modalBody.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Unit</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (displayId || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Status</span><span style="font-size:13px;' + 'font-weight:500;text-align:right;"' + statusClass + '>' + statusDisplay + '</span></div>' +
    '<div style="height:1px;background:#eef0f4;margin:10px 0;"></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Project</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (project || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Phase</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (phase || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Block</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (block || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Lot No</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (lotNo || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Unit Type</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (unitType || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Built Up (sqft)</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (builtUp || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Land Area (sqft)</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (landArea || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Price</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (price || '-') + '</span></div>';

  modalEl.style.display = 'flex';
}

function renderNcityHierarchy(projectUnits) {
  var container = document.getElementById("ledgerContainer-ncity");
  if (!container) return;

  var availableUnits = projectUnits.filter(isDisplayAvailable);
  var state = getOrInitState("project-ncity");

  var projKey = "proj:ncity";
  if (state[projKey] === undefined) state[projKey] = false;

  var header = createGroupHeader("N-CITY", computeAvailableUnits(availableUnits), false, "group-header-project", "Project");
  container.appendChild(header);

  var content = document.createElement("div");
  content.className = "group-content";
  content.style.display = "none";
  container.appendChild(content);

  var childrenRendered = false;
  header.addEventListener("click", function() {
    var now = toggleLevel(state, projKey);
    if (now) {
      if (!childrenRendered) {
        renderProjectPhasesAccordion(content, availableUnits, "ncity", "N-CITY");
        childrenRendered = true;
      }
      content.style.display = "block";
    } else {
      content.style.display = "none";
      for (var k in state) {
        if (k.indexOf("phase:ncity:") === 0 || k.indexOf("ut:ncity:") === 0) {
          state[k] = false;
        }
      }
      collapseChildren(content);
    }
    var chev = header.querySelector(".group-chevron i");
    if (chev) chev.className = "fas " + (now ? "fa-chevron-down" : "fa-chevron-right");
  });
}

/* ==========================================================================
   MAHKOTA KAMPAR SVG LAYOUT VIEW
   ========================================================================== */
var __mahkotaSharedData = null;

function renderMahkotaKamparView() {
  var panel = document.getElementById("view-mahkota-kampar");
  if (!panel) return;
  var status = getProjectStatus("MAHKOTA KAMPAR");
  var projectName = "MAHKOTA KAMPAR";

  panel.innerHTML =
    '<div class="page-header">' +
    '  <div style="display:flex;justify-content:space-between;align-items:center;flex:1;flex-wrap:wrap;gap:8px;">' +
    '    <div><h1 style="margin-right:12px;">' + projectName.toUpperCase() + '</h1><div class="header-sub">Project Dashboard</div></div>' +
    '  </div>' +
    '  <div class="data-extracted-box"><div class="de-label">Updated as of</div><div class="de-date">15 July 2026</div></div></div>' +
    '</div>' +
    '<div class="project-image-banner" id="project-image-mahkota-kampar" style="background:#000000;border-radius:10px;overflow:hidden;margin-bottom:20px;position:relative;cursor:pointer;" title="Double-click to view full image">' +
    '  <div style="display:flex;align-items:center;justify-content:center;min-height:200px;max-height:400px;padding:20px;">' +
    '    <div style="color:#9ca3af;font-size:14px;"><i class="fas fa-spinner fa-spin" style="font-size:24px;display:block;margin-bottom:8px;"></i>Loading project image...</div>' +
    '  </div>' +
    '</div>' +
    '<div class="project-kpi-container">' +
    '  <div class="card project-kpi-box"><div class="project-kpi-label"><i class="fas fa-check-circle" style="color:#10b981;margin-right:8px;"></i>Total Available Units</div><div class="project-kpi-value" id="kpi-mahkota">0</div></div>' +
    '  <div class="card project-kpi-price-box"><div class="project-kpi-label"><i class="fas fa-dollar-sign" style="color:#2563eb;margin-right:8px;"></i>Total SPA Price</div><div class="project-kpi-value" id="kpi-price-mahkota">RM 0</div></div>' +
    '</div>' +
    '<div id="mahkota-svg-wrapper" style="width:100%;display:flex;flex-direction:column;gap:20px;box-sizing:border-box;padding:0;margin-bottom:20px;">' +
    '  ' + renderLayoutPlanHeader(getLayoutBalance("MAHKOTA KAMPAR")) + '' +
    '  <div id="mahkota-svg-stage" style="width:100%;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);overflow:hidden;min-height:200px;">' +
    '    <div style="display:flex;align-items:center;justify-content:center;height:200px;color:#5e6778;font-style:italic;">Loading layout...</div>' +
    '  </div>' +
    '  <div id="mahkota-layout-legends"></div>' +
    '  <div id="mahkota-layout-summary"></div>' +
    '</div>' +
    '' + renderProjectDetails(projectName) + '' +
    '<div class="card" id="staticAssetList-mahkota">' +
    '  <div class="card-header">' +
    '    <span class="card-title"><i class="fas fa-table"></i> AVAILABLE UNIT LIST</span>' +
    '    <div class="table-controls">' +
    '      <select id="staticFilterPhase-mahkota" class="table-filter"><option value="">All Phases</option></select>' +
    '      <select id="staticFilterType-mahkota" class="table-filter"><option value="">All Unit Types</option></select>' +
    '      <button id="resetSort-mahkota" class="table-filter" style="padding:6px 12px;border:1px solid var(--border-light);border-radius:4px;background:#fff;cursor:pointer;font-size:13px;font-weight:600;color:#0f2042;"><i class="fas fa-undo" style="margin-right:4px;"></i>Reset Sort</button>' +
    '    </div>' +
    '  </div>' +
    '  <div id="staticLedgerContainer-mahkota" class="asset-table-container"></div>' +
    '  <div id="staticPagination-mahkota" style="display:flex;align-items:center;justify-content:center;gap:12px;margin-top:16px;padding-top:12px;border-top:1px solid var(--border-light);"></div>' +
    '</div>' +
    '<div class="card">' +
    '  <div class="card-header"><span class="card-title"><i class="fas fa-list"></i> AVAILABLE UNIT BY PHASE</span></div>' +
    '  <div id="ledgerContainer-mahkota"></div>' +
    '</div>';

  loadProjectImageBanner("mahkota-kampar", "MAHKOTA KAMPAR");

  fetch("/api/layout/mahkota")
    .then(function(res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
    .then(function(json) {
      var layoutUnits = (json && json.data) ? json.data : [];
      if (!Array.isArray(layoutUnits)) layoutUnits = [];

      __mahkotaSharedData = {
        units: layoutUnits,
        available: layoutUnits.filter(function(u) { return String(u.Status).trim().toLowerCase() === 'available'; }).length,
        signed: layoutUnits.filter(function(u) { return String(u.Status).trim().toLowerCase() === 'signed'; }).length,
        sold: layoutUnits.filter(function(u) { return String(u.Status).trim().toLowerCase() === 'sold'; }).length,
        registered: layoutUnits.filter(function(u) { return String(u.Status).trim().toLowerCase() === 'registered'; }).length,
        total: layoutUnits.length
      };

      var kpiEl = document.getElementById("kpi-mahkota");
      if (kpiEl) kpiEl.textContent = computeAvailableUnits(__mahkotaSharedData.units);
      var priceEl = document.getElementById("kpi-price-mahkota");
      if (priceEl) priceEl.textContent = formatPrice(computeDisplayedTotalPrice(__mahkotaSharedData.units));

      try { renderMahkotaHierarchy(__mahkotaSharedData.units); } catch(e) { console.error("Hierarchy:", e); }
      try { renderStaticAssetTable("mahkota", __mahkotaSharedData.units); } catch(e) { console.error("Static table:", e); }
      try { renderPsfInfoBox("mahkota-kampar"); } catch(e) { console.error("PSF info:", e); }

      // Use standardized SVG renderer with zoom controls
      renderInteractiveSvg({
        svgUrl: "/static/Mahkota_Master.svg",
        stageId: "mahkota-svg-stage",
        legendsId: "mahkota-layout-legends",
        summaryId: "mahkota-layout-summary",
        units: __mahkotaSharedData.units,
        sharedDataVar: "__mahkotaSharedData",
        modalId: "mahkota-unit-modal",
        modalBodyId: "mahkota-modal-body",
        modalCloseId: "mahkota-modal-close",
        modalOverlayId: "mahkota-modal-overlay",
        copyBtnId: "mahkota-copy-btn",
        fitToScreen: true,
        onSvgLoaded: function(data) {
          renderMahkotaLayoutLegends();
        }
      });
    })
    .catch(function(err) {
      console.error("Failed to load MAHKOTA KAMPAR layout data:", err);
    });
}

function applyMahkotaSvgOverlay(layoutData) {
  var polygons = document.querySelectorAll('#mahkota-svg-stage svg path, #mahkota-svg-stage svg polygon, #mahkota-svg-stage svg rect, #mahkota-svg-stage svg circle, #mahkota-svg-stage svg ellipse');

  var allUnitMap = {};
  layoutData.forEach(function(unit) {
    var raw = String(unit.Unit_No).trim().toUpperCase();
    allUnitMap[raw] = unit;
  });

  polygons.forEach(function(p) {
    if (!p.id) return;
    // Match MKT-XXX or MKS-XX IDs
    if (p.id.match(/^(MKT-\d+|MKS-\d+)$/i)) {
      p.classList.add('not-available');
    }
  });

  layoutData.forEach(function(unit) {
    var status = String(unit.Status || '').trim().toLowerCase();
    var unitNo = String(unit.Unit_No || '').trim().toUpperCase();

    // Direct ID lookup: SVG IDs match DB unit numbers exactly (MKT-025, MKS-01)
    var poly = document.getElementById(unitNo);

    if (poly) {
      poly._unitData = unit;
      if (status === 'available') {
        poly.classList.remove('not-available');
        poly.classList.add('available');
      }
    }
  });

  bindMahkotaSvgInteractions();
  renderMahkotaSvgSummary(__mahkotaSharedData);
  renderMahkotaLayoutLegends();
}

function bindMahkotaSvgInteractions() {
  var svg = document.querySelector('#mahkota-svg-stage svg');
  if (!svg) return;

  svg.addEventListener('mouseover', function(e) {
    var target = e.target;
    if (target && target.id && target.classList) {
      // Only apply hover effect to available units - grey units stay grey
      if (target.classList.contains('available')) {
        target.style.fillOpacity = '0.95';
      }
    }
  });

  svg.addEventListener('mouseout', function(e) {
    var target = e.target;
    if (target && target.id && target.classList) {
      // Only clear hover effect from available units
      if (target.classList.contains('available')) {
        target.style.fillOpacity = '';
      }
    }
  });

  svg.addEventListener('click', function(e) {
    var target = e.target;
    if (target && target.id) {
      var tag = target.tagName;
      if (tag === 'path' || tag === 'polygon' || tag === 'rect' || tag === 'circle' || tag === 'ellipse') {
        var unit = target._unitData || null;
        showMahkotaUnitModal(unit, target.id);
      }
    }
  });
}

function renderMahkotaSvgSummary(sharedData) {
  var summaryContainer = document.getElementById('mahkota-layout-summary');
  if (!summaryContainer) return;

  summaryContainer.innerHTML =
    '<div style="display:flex;gap:12px;flex-wrap:wrap;">' +
    '  <div style="flex:1;min-width:120px;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);text-align:center;">' +
    '    <div style="font-size:10px;color:#5e6778;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:2px;">Available</div>' +
    '    <div style="font-size:24px;font-weight:700;color:#00cc44;">' + sharedData.available + '</div>' +
    '  </div>' +
    '  <div style="flex:1;min-width:120px;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);text-align:center;">' +
    '    <div style="font-size:10px;color:#5e6778;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:2px;">Signed</div>' +
    '    <div style="font-size:24px;font-weight:700;color:#9E9E9E;">' + sharedData.signed + '</div>' +
    '  </div>' +
    '  <div style="flex:1;min-width:120px;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);text-align:center;">' +
    '    <div style="font-size:10px;color:#5e6778;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:2px;">Sold</div>' +
    '    <div style="font-size:24px;font-weight:700;color:#9E9E9E;">' + sharedData.sold + '</div>' +
    '  </div>' +
    '  <div style="flex:1;min-width:120px;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);text-align:center;">' +
    '    <div style="font-size:10px;color:#5e6778;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:2px;">Registered</div>' +
    '    <div style="font-size:24px;font-weight:700;color:#9E9E9E;">' + sharedData.registered + '</div>' +
    '  </div>' +
    '  <div style="flex:1;min-width:120px;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);text-align:center;">' +
    '    <div style="font-size:10px;color:#5e6778;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:2px;">Total</div>' +
    '    <div style="font-size:24px;font-weight:700;color:#0f2042;">' + sharedData.total + '</div>' +
    '  </div>' +
    '</div>';
}

function renderMahkotaLayoutLegends() {
  var legendsContainer = document.getElementById('mahkota-layout-legends');
  if (!legendsContainer) return;
  legendsContainer.innerHTML =
    '<div style="display:flex;gap:16px;align-items:center;padding:8px 16px;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06);font-size:12px;color:#5e6778;">' +
    '  <div style="display:flex;align-items:center;gap:6px;"><span style="width:12px;height:12px;border-radius:3px;background:#00E676;display:inline-block;"></span> Available Unit</div>' +
    '</div>';
}

function showMahkotaUnitModal(unit, svgId) {
  var modalEl = document.getElementById('mahkota-unit-modal');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'mahkota-unit-modal';
    modalEl.style.cssText = 'position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:99999;';
    modalEl.innerHTML =
      '<div style="position:fixed;inset:0;background:rgba(15,23,42,0.75);backdrop-filter:blur(4px);z-index:0;" id="mahkota-modal-overlay"></div>' +
      '<div style="position:relative;z-index:1;width:480px;max-width:calc(100vw-32px);max-height:85vh;background:#ffffff;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,0.35);display:flex;flex-direction:column;overflow:hidden;font-family:Inter,system-ui,sans-serif;">' +
      '  <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:linear-gradient(180deg,#ffffff 0%,#f8fafc 100%);border-bottom:1px solid #eef0f4;">' +
      '    <span style="font-weight:700;font-size:14px;color:#0f2042;text-transform:uppercase;letter-spacing:0.6px;">Unit Details</span>' +
      '    <button id="mahkota-modal-close" style="width:32px;height:32px;border-radius:8px;border:1px solid #eef0f4;background:#ffffff;color:#5e6778;font-size:20px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 120ms ease,color 120ms ease;">&times;</button>' +
      '  </div>' +
      '  <div id="mahkota-modal-body" style="padding:16px 20px;overflow-y:auto;"></div>' +
      '  <div style="padding:12px 20px;border-top:1px solid #eef0f4;background:#f8fafc;display:flex;justify-content:flex-end;">' +
      '    <button id="mahkota-copy-btn" style="display:inline-flex;align-items:center;gap:8px;padding:9px 18px;border-radius:8px;border:1px solid #eef0f4;background:#ffffff;color:#0f2042;font-size:13px;font-weight:600;cursor:pointer;"><i class="fas fa-copy" style="color:#f47217;font-size:12px;"></i> Copy Details</button>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(modalEl);
    document.getElementById('mahkota-modal-close').addEventListener('click', function() { modalEl.style.display = 'none'; });
    document.getElementById('mahkota-modal-overlay').addEventListener('click', function() { modalEl.style.display = 'none'; });
    document.getElementById('mahkota-copy-btn').addEventListener('click', function() {
      var body = document.getElementById('mahkota-modal-body');
      var text = body ? body.innerText || body.textContent || '' : '';
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text.trim()).catch(function() {});
      }
    });
  }

  var modalBody = document.getElementById('mahkota-modal-body');
  if (!modalBody) return;

  var displayId = unit ? String(unit.Unit_No || svgId || '') : (svgId || '');
  var status = unit ? String(unit.Status || '') : '';
  var project = unit ? String(unit.Project || '') : '';
  var propertyType = unit ? String(unit.Property_Type || '') : '';
  var ownership = unit ? String(unit.Property_Ownership || '') : '';
  var block = unit ? String(unit.Block || '') : '';
  var phase = unit ? String(unit.Phase || '') : '';
  var lotNo = unit ? String(unit.Lot_No || '') : '';
  var unitType = unit ? String(unit.Unit_Type || '') : '';
  var builtUp = unit ? formatArea(unit.Built_Up) : '-';
  var landArea = unit ? formatArea(unit.Land_Area) : '-';
  var price = unit ? formatPrice(unit.Listing_Price || unit.SPA_Signed_Price || unit.Price || 0) : '';

  var statusClass = '';
  var statusDisplay = 'Not Available';
  if (status.toLowerCase() === 'available') {
    statusClass = ' style="color:#16a34a;font-weight:700;"';
    statusDisplay = 'Available';
  } else if (status) {
    statusClass = ' style="color:#dc2626;font-weight:700;"';
    statusDisplay = status;
  }

  modalBody.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Unit</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (displayId || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Status</span><span style="font-size:13px;' + 'font-weight:500;text-align:right;"' + statusClass + '>' + statusDisplay + '</span></div>' +
    '<div style="height:1px;background:#eef0f4;margin:10px 0;"></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Project</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (project || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Phase</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (phase || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Block</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (block || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Lot No</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (lotNo || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Unit Type</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (unitType || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Built Up (sqft)</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (builtUp || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Land Area (sqft)</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (landArea || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Price</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (price || '-') + '</span></div>';

  modalEl.style.display = 'flex';
}

function renderMahkotaHierarchy(projectUnits) {
  var container = document.getElementById("ledgerContainer-mahkota");
  if (!container) return;

  var availableUnits = projectUnits.filter(isDisplayAvailable);
  var state = getOrInitState("project-mahkota");

  var projKey = "proj:mahkota";
  if (state[projKey] === undefined) state[projKey] = false;

  var header = createGroupHeader("MAHKOTA KAMPAR", computeAvailableUnits(availableUnits), false, "group-header-project", "Project");
  container.appendChild(header);

  var content = document.createElement("div");
  content.className = "group-content";
  content.style.display = "none";
  container.appendChild(content);

  var childrenRendered = false;
  header.addEventListener("click", function() {
    var now = toggleLevel(state, projKey);
    if (now) {
      if (!childrenRendered) {
        renderProjectPhasesAccordion(content, availableUnits, "mahkota", "MAHKOTA KAMPAR");
        childrenRendered = true;
      }
      content.style.display = "block";
    } else {
      content.style.display = "none";
      for (var k in state) {
        if (k.indexOf("phase:mahkota:") === 0 || k.indexOf("ut:mahkota:") === 0) {
          state[k] = false;
        }
      }
      collapseChildren(content);
    }
    var chev = header.querySelector(".group-chevron i");
    if (chev) chev.className = "fas " + (now ? "fa-chevron-down" : "fa-chevron-right");
  });
}

/* ==========================================================================
   REUSABLE INTERACTIVE SVG ENGINE
   ========================================================================== */

/**
 * Renders an interactive SVG layout for any project.
 * Reuses the same pattern as NSIP, N-City, and Mahkota Kampar.
 *
 * @param {Object} config
 * @param {string} config.svgUrl - URL to the SVG file
 * @param {string} config.stageId - DOM ID of the SVG container element
 * @param {string} config.legendsId - DOM ID of the legends container
 * @param {string} config.summaryId - DOM ID of the summary container
 * @param {Array} config.units - Array of unit objects from the API
 * @param {string} config.modalId - DOM ID for the unit detail modal
 * @param {string} config.modalBodyId - DOM ID for the modal body
 * @param {string} config.modalCloseId - DOM ID for modal close button
 * @param {string} config.modalOverlayId - DOM ID for modal overlay
 * @param {string} config.copyBtnId - DOM ID for copy button
 * @param {string} config.sharedDataVar - Global variable name for shared data
 * @param {function} config.onSvgLoaded - Optional callback after SVG is loaded and overlay applied
 */
function renderInteractiveSvg(config) {
  var stage = document.getElementById(config.stageId);
  if (!stage) return;

  // Compute summary data
  var units = config.units || [];
  var sharedData = {
    units: units,
    available: units.filter(function(u) { return String(u.Status).trim().toLowerCase() === 'available'; }).length,
    signed: units.filter(function(u) { return String(u.Status).trim().toLowerCase() === 'signed'; }).length,
    sold: units.filter(function(u) { return String(u.Status).trim().toLowerCase() === 'sold'; }).length,
    registered: units.filter(function(u) { return String(u.Status).trim().toLowerCase() === 'registered'; }).length,
    total: units.length
  };

  // Store in global variable if specified
  if (config.sharedDataVar) {
    window[config.sharedDataVar] = sharedData;
  }

  // Update KPI if elements exist (using the SAME displayed dataset as the Available Unit List)
  var kpiEl = document.getElementById(config.kpiId);
  var priceEl = document.getElementById(config.kpiPriceId);
  if (kpiEl) kpiEl.textContent = computeAvailableUnits(units);
  if (priceEl) priceEl.textContent = formatPrice(computeDisplayedTotalPrice(units));

      // Load SVG
      fetch(config.svgUrl)
        .then(function(svgRes) { if (!svgRes.ok) throw new Error("HTTP " + svgRes.status); return svgRes.text(); })
        .then(function(svgMarkup) {
          stage.classList.add("layout-stage");
          stage.innerHTML = svgMarkup;
          var svg = stage.querySelector("svg");
          if (svg) {
            svg.setAttribute("width", "100%");
            svg.setAttribute("height", "100%");
            svg.style.display = "block";
            svg.style.maxWidth = "100%";
            svg.style.maxHeight = "100%";
            svg.style.margin = "0 auto";
            svg.style.transformOrigin = "center center";
            svg.style.background = "transparent";
          }

      // Apply overlay - find all polygon elements in this stage
      var polygons = stage.querySelectorAll('path, polygon, rect, circle, ellipse');

      // Build unit map with various ID formats
      var allUnitMap = {};
      units.forEach(function(unit) {
        var raw = String(unit.Unit_No).trim().toUpperCase();
        var stripped = raw.replace(/^([A-Z]+)0+(\d)/, '$1$2');
        allUnitMap[stripped] = unit;
        allUnitMap[raw] = unit;
        var padded = raw.replace(/^([A-Z]+)(\d)$/, '$10$2');
        if (padded !== raw) allUnitMap[padded] = unit;
      });

      // Apply status-based colouring from database
      // ONLY available units get GREEN highlight. ALL other polygons get GREY highlight.
      // This includes: sold, signed, registered, null status, missing database records, etc.
      
      // Build set of available unit IDs for fast lookup
      var availableUnitIds = {};
      units.forEach(function(unit) {
        var status = String(unit.Status || '').trim().toLowerCase();
        if (status === 'available') {
          var unitNo = String(unit.Unit_No || '').trim().toUpperCase();
          var normalized = unitNo.replace(/\s+/g, '').replace(/-/g, '').replace(/^([A-Z]+)0+(\d)/, '$1$2');
          availableUnitIds[normalized] = true;
          availableUnitIds[unitNo] = true;
        }
      });

      // Process ALL polygon elements in the SVG
      var allPolygons = stage.querySelectorAll('path, polygon, rect, circle, ellipse');
      allPolygons.forEach(function(poly) {
        if (!poly.id) return;
        if (poly.id === 'svg-background') return;

        var unitId = poly.id.trim().toUpperCase();
        var normalizedId = unitId.replace(/\s+/g, '').replace(/-/g, '').replace(/^([A-Z]+)0+(\d)/, '$1$2');

        // Check if this polygon ID matches any available unit
        var isAvailable = availableUnitIds[unitId] || availableUnitIds[normalizedId];
        
        // Find matching unit data if available
        var matchingUnit = null;
        if (isAvailable) {
          matchingUnit = units.find(function(u) {
            var uNo = String(u.Unit_No || '').trim().toUpperCase();
            var uNorm = uNo.replace(/\s+/g, '').replace(/-/g, '').replace(/^([A-Z]+)0+(\d)/, '$1$2');
            return uNo === unitId || uNorm === normalizedId;
          });
        }
        
        poly._unitData = matchingUnit;
        if (isAvailable) {
          poly.classList.remove('not-available');
          poly.classList.add('available');
        } else {
          poly.classList.remove('available');
          poly.classList.add('not-available');
        }
      });

      // Add zoom controls - determine if fit-to-screen is needed
      var needsFit = config.fitToScreen === true;
      addZoomControls(stage, svg, needsFit);

      // Bind interactions
      bindSvgInteractions(config);
      // Lower summary cards removed as per requirement
      // renderSvgSummary(config.summaryId, sharedData);
      renderSvgLegends(config.legendsId);

      if (typeof config.onSvgLoaded === 'function') {
        config.onSvgLoaded(sharedData);
      }
    })
    .catch(function(err) {
      console.error("Failed to load SVG:", err);
      stage.innerHTML = '<div style="text-align:center;padding:40px;color:#dc2626;">Failed to load layout SVG.</div>';
    });
}

// Zoom controls functionality
function addZoomControls(container, svg, fitToScreen, customDefaultZoom) {
  if (!container || !svg) return;

  var currentZoom = 1;
  var zoomStep = 0.2;
  var minZoom = 0.5;
  var maxZoom = 3;
  var panX = 0, panY = 0;
  var defaultZoom = 1; // Store the default zoom level (fit-to-screen or custom)
  
  // Open the SVG at the minimum zoom level (fully zoomed out).
  // This is the same view the Zoom Out button stops at, so the
  // entire layout is visible with black background around it.
  defaultZoom = minZoom;
  currentZoom = minZoom;
  
  // Center the SVG horizontally and vertically within the viewer area.
  // Compute the pixel offsets so the SVG's center aligns with the
  // container's center. The transform scales around the SVG center,
  // so this centering holds at every zoom level.
  var centeredPanX = 0, centeredPanY = 0;
  function computeCenteredPan() {
    var containerRect = container.getBoundingClientRect();
    var svgRect = svg.getBoundingClientRect();
    centeredPanX = (containerRect.left + containerRect.width / 2) - (svgRect.left + svgRect.width / 2);
    centeredPanY = (containerRect.top + containerRect.height / 2) - (svgRect.top + svgRect.height / 2);
  }
  computeCenteredPan();
  panX = centeredPanX;
  panY = centeredPanY;
  
  var isDragging = false;
  var startX, startY;
  var dragStartX, dragStartY;

  // Mouse down - start drag
  svg.addEventListener('mousedown', function(e) {
    var target = e.target;
    if (target && (target.tagName === 'path' || target.tagName === 'polygon' || target.tagName === 'rect' || target.tagName === 'circle' || target.tagName === 'ellipse')) {
      return;
    }
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    dragStartX = panX;
    dragStartY = panY;
    svg.style.cursor = 'grabbing';
    svg.style.transition = 'none';
    e.preventDefault();
  });

  // Mouse move - drag
  document.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    panX = dragStartX + (e.clientX - startX);
    panY = dragStartY + (e.clientY - startY);
    svg.style.transform = 'translate(' + panX + 'px, ' + panY + 'px) scale(' + currentZoom + ')';
  });

  // Mouse up - end drag
  document.addEventListener('mouseup', function(e) {
    if (!isDragging) return;
    isDragging = false;
    svg.style.cursor = '';
    svg.style.transition = 'transform 0.3s ease';
  });

  // Create zoom controls container
  var zoomControls = document.createElement('div');
  zoomControls.className = 'svg-zoom-controls';
  zoomControls.innerHTML = '<button class="svg-zoom-btn" id="zoom-in-' + container.id + '" title="Zoom In">+</button>' +
                          '<button class="svg-zoom-btn" id="zoom-reset-' + container.id + '" title="Reset">Reset</button>' +
                          '<button class="svg-zoom-btn" id="zoom-out-' + container.id + '" title="Zoom Out">−</button>';
  container.appendChild(zoomControls);

  // Get buttons
  var zoomInBtn = document.getElementById('zoom-in-' + container.id);
  var zoomOutBtn = document.getElementById('zoom-out-' + container.id);
  var zoomResetBtn = document.getElementById('zoom-reset-' + container.id);

  if (!zoomInBtn || !zoomOutBtn) return;

  // Update zoom function
  function updateZoom() {
    svg.style.transform = 'translate(' + panX + 'px, ' + panY + 'px) scale(' + currentZoom + ')';
    svg.style.transition = 'transform 0.3s ease';
    
    // Update button states
    zoomInBtn.disabled = currentZoom >= maxZoom;
    zoomOutBtn.disabled = currentZoom <= minZoom;
    
    if (zoomInBtn.disabled) {
      zoomInBtn.style.opacity = '0.4';
      zoomInBtn.style.cursor = 'not-allowed';
    } else {
      zoomInBtn.style.opacity = '1';
      zoomInBtn.style.cursor = 'pointer';
    }
    
    if (zoomOutBtn.disabled) {
      zoomOutBtn.style.opacity = '0.4';
      zoomOutBtn.style.cursor = 'not-allowed';
    } else {
      zoomOutBtn.style.opacity = '1';
      zoomOutBtn.style.cursor = 'pointer';
    }
  }

  // Zoom in
  zoomInBtn.addEventListener('click', function() {
    if (currentZoom < maxZoom) {
      currentZoom = Math.min(maxZoom, currentZoom + zoomStep);
      updateZoom();
    }
  });

  // Zoom out
  zoomOutBtn.addEventListener('click', function() {
    if (currentZoom > minZoom) {
      currentZoom = Math.max(minZoom, currentZoom - zoomStep);
      updateZoom();
    }
  });

  // Reset zoom - restore to the default (minimum) zoom and centered position
  if (zoomResetBtn) {
    zoomResetBtn.addEventListener('click', function() {
      currentZoom = defaultZoom;
      panX = centeredPanX;
      panY = centeredPanY;
      updateZoom();
    });
  }

  // Initialize button states
  updateZoom();
}

function bindSvgInteractions(config) {
  var stage = document.getElementById(config.stageId);
  if (!stage) return;
  var svg = stage.querySelector("svg");
  if (!svg) return;

  svg.addEventListener('mouseover', function(e) {
    var target = e.target;
    if (!target || !target.id || !target.classList) return;
    // Never modify the SVG background rectangle
    if (target.id === 'svg-background') return;
    // For NSIP KM1: preserveNotAvailableOnHover=true means do NOT change not-available fill
    if (config.preserveNotAvailableOnHover && !target.classList.contains('available')) {
      return;
    }
    target.style.fillOpacity = target.classList.contains('available') ? '0.95' : '0.50';
  });

  svg.addEventListener('mouseout', function(e) {
    var target = e.target;
    if (!target || !target.id || !target.classList) return;
    // Never modify the SVG background rectangle
    if (target.id === 'svg-background') return;
    // For NSIP KM1: preserveNotAvailableOnHover=true means do NOT clear not-available fill
    if (config.preserveNotAvailableOnHover && !target.classList.contains('available')) {
      return;
    }
    target.style.fillOpacity = '';
  });

  svg.addEventListener('click', function(e) {
    var target = e.target;
    if (target && target.id) {
      var tag = target.tagName;
      if (tag === 'path' || tag === 'polygon' || tag === 'rect' || tag === 'circle' || tag === 'ellipse') {
        var unit = target._unitData || null;
        showUnitModal(config, unit, target.id);
      }
    }
  });
}

function renderSvgSummary(summaryId, sharedData) {
  var summaryContainer = document.getElementById(summaryId);
  if (!summaryContainer) return;

  summaryContainer.innerHTML =
    '<div style="display:flex;gap:12px;flex-wrap:wrap;">' +
    '  <div style="flex:1;min-width:120px;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);text-align:center;">' +
    '    <div style="font-size:10px;color:#5e6778;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:2px;">Available</div>' +
    '    <div style="font-size:24px;font-weight:700;color:#00cc44;">' + sharedData.available + '</div>' +
    '  </div>' +
    '  <div style="flex:1;min-width:120px;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);text-align:center;">' +
    '    <div style="font-size:10px;color:#5e6778;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:2px;">Signed</div>' +
    '    <div style="font-size:24px;font-weight:700;color:#9E9E9E;">' + sharedData.signed + '</div>' +
    '  </div>' +
    '  <div style="flex:1;min-width:120px;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);text-align:center;">' +
    '    <div style="font-size:10px;color:#5e6778;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:2px;">Sold</div>' +
    '    <div style="font-size:24px;font-weight:700;color:#9E9E9E;">' + sharedData.sold + '</div>' +
    '  </div>' +
    '  <div style="flex:1;min-width:120px;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);text-align:center;">' +
    '    <div style="font-size:10px;color:#5e6778;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:2px;">Registered</div>' +
    '    <div style="font-size:24px;font-weight:700;color:#9E9E9E;">' + sharedData.registered + '</div>' +
    '  </div>' +
    '  <div style="flex:1;min-width:120px;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);text-align:center;">' +
    '    <div style="font-size:10px;color:#5e6778;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:2px;">Total</div>' +
    '    <div style="font-size:24px;font-weight:700;color:#0f2042;">' + sharedData.total + '</div>' +
    '  </div>' +
    '</div>';
}

function renderSvgLegends(legendsId) {
  var legendsContainer = document.getElementById(legendsId);
  if (!legendsContainer) return;
  legendsContainer.innerHTML =
    '<div style="display:flex;gap:16px;align-items:center;padding:8px 16px;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06);font-size:12px;color:#5e6778;">' +
    '  <div style="display:flex;align-items:center;gap:6px;"><span style="width:12px;height:12px;border-radius:3px;background:#00E676;display:inline-block;"></span> Available Unit</div>' +
    '</div>';
}

function showUnitModal(config, unit, svgId) {
  var modalEl = document.getElementById(config.modalId);
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = config.modalId;
    modalEl.style.cssText = 'position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:99999;';
    modalEl.innerHTML =
      '<div style="position:fixed;inset:0;background:rgba(15,23,42,0.75);backdrop-filter:blur(4px);z-index:0;" id="' + config.modalOverlayId + '"></div>' +
      '<div style="position:relative;z-index:1;width:480px;max-width:calc(100vw-32px);max-height:85vh;background:#ffffff;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,0.35);display:flex;flex-direction:column;overflow:hidden;font-family:Inter,system-ui,sans-serif;">' +
      '  <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:linear-gradient(180deg,#ffffff 0%,#f8fafc 100%);border-bottom:1px solid #eef0f4;">' +
      '    <span style="font-weight:700;font-size:14px;color:#0f2042;text-transform:uppercase;letter-spacing:0.6px;">Unit Details</span>' +
      '    <button id="' + config.modalCloseId + '" style="width:32px;height:32px;border-radius:8px;border:1px solid #eef0f4;background:#ffffff;color:#5e6778;font-size:20px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 120ms ease,color 120ms ease;">&times;</button>' +
      '  </div>' +
      '  <div id="' + config.modalBodyId + '" style="padding:16px 20px;overflow-y:auto;"></div>' +
      '  <div style="padding:12px 20px;border-top:1px solid #eef0f4;background:#f8fafc;display:flex;justify-content:flex-end;">' +
      '    <button id="' + config.copyBtnId + '" style="display:inline-flex;align-items:center;gap:8px;padding:9px 18px;border-radius:8px;border:1px solid #eef0f4;background:#ffffff;color:#0f2042;font-size:13px;font-weight:600;cursor:pointer;"><i class="fas fa-copy" style="color:#f47217;font-size:12px;"></i> Copy Details</button>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(modalEl);
    document.getElementById(config.modalCloseId).addEventListener('click', function() { modalEl.style.display = 'none'; });
    document.getElementById(config.modalOverlayId).addEventListener('click', function() { modalEl.style.display = 'none'; });
    document.getElementById(config.copyBtnId).addEventListener('click', function() {
      var body = document.getElementById(config.modalBodyId);
      var text = body ? body.innerText || body.textContent || '' : '';
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text.trim()).catch(function() {});
      }
    });
  }

  var modalBody = document.getElementById(config.modalBodyId);
  if (!modalBody) return;

  var displayId = unit ? String(unit.Unit_No || svgId || '') : (svgId || '');
  var status = unit ? String(unit.Status || '') : '';
  var project = unit ? String(unit.Project || '') : '';
  var propertyType = unit ? String(unit.Property_Type || '') : '';
  var ownership = unit ? String(unit.Property_Ownership || '') : '';
  var block = unit ? String(unit.Block || '') : '';
  var phase = unit ? String(unit.Phase || '') : '';
  var lotNo = unit ? String(unit.Lot_No || '') : '';
  var unitType = unit ? String(unit.Unit_Type || '') : '';
  var builtUp = unit ? formatArea(unit.Built_Up) : '-';
  var landArea = unit ? formatArea(unit.Land_Area) : '-';
  var price = unit ? formatPrice(unit.Listing_Price || unit.SPA_Signed_Price || unit.Price || 0) : '';

  var statusClass = '';
  var statusDisplay = 'Not Available';
  if (status.toLowerCase() === 'available') {
    statusClass = ' style="color:#16a34a;font-weight:700;"';
    statusDisplay = 'Available';
  } else if (status) {
    statusClass = ' style="color:#dc2626;font-weight:700;"';
    statusDisplay = status;
  }

  modalBody.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Unit</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (displayId || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Status</span><span style="font-size:13px;' + 'font-weight:500;text-align:right;"' + statusClass + '>' + statusDisplay + '</span></div>' +
    '<div style="height:1px;background:#eef0f4;margin:10px 0;"></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Project</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (project || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Phase</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (phase || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Block</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (block || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Lot No</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (lotNo || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Unit Type</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (unitType || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Built Up (sqft)</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (builtUp || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Land Area (sqft)</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (landArea || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Price</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (price || '-') + '</span></div>';

  modalEl.style.display = 'flex';
}

/* ==========================================================================
   COLLAPSE HELPERS FOR N-CITY & ION BELIAN GARDEN
   ========================================================================== */
function collapseNcitySubmenu() {
  var parent = document.querySelector('.nav-parent[data-view="n-city"]');
  var children = document.getElementById("navChildren-n-city");
  if (parent && children) {
    parent.classList.remove("expanded");
    children.classList.remove("open");
    var icon = parent.querySelector(".nav-expand-icon i");
    if (icon) icon.className = "fas fa-chevron-right";
  }
}

function collapseIonBelianGardenSubmenu() {
  var parent = document.querySelector('.nav-parent[data-view="ion-belian-garden"]');
  var children = document.getElementById("navChildren-ion-belian-garden");
  if (parent && children) {
    parent.classList.remove("expanded");
    children.classList.remove("open");
    var icon = parent.querySelector(".nav-expand-icon i");
    if (icon) icon.className = "fas fa-chevron-right";
  }
}



/* ==========================================================================
   ION BELIAN GARDEN — Commercial & Residential Pages
   ========================================================================== */

// Shared helper: get IBG units
function getIbgUnits() {
  if (window.__ibgUnits) return Promise.resolve(window.__ibgUnits);
  return fetchAllUnitsCached().then(function(allUnits) {
    var ibg = allUnits.filter(function(u) { return (u.Project || "").toString().trim() === "ION BELIAN GARDEN"; });
    window.__ibgUnits = ibg;
    return ibg;
  });
}

// Render standard project page structure for IBG sub-pages
function renderIbgPageStructure(viewId, title, filterFn, imagePath, svgPath, apiEndpoint) {
  var panel = document.getElementById("view-" + viewId);
  if (!panel) return;
  var status = getProjectStatus("ION BELIAN GARDEN");

  panel.innerHTML =
    '<div class="page-header">' +
    '  <div style="display:flex;justify-content:space-between;align-items:center;flex:1;flex-wrap:wrap;gap:8px;">' +
    '    <div><h1 style="margin-right:12px;">ION BELIAN GARDEN — ' + title.toUpperCase() + '</h1><div class="header-sub">Project Dashboard</div></div>' +
    '  </div>' +
    '  <div class="data-extracted-box"><div class="de-label">Updated as of</div><div class="de-date">15 July 2026</div></div>' +
    '</div>' +
    '<div class="project-image-banner" id="project-image-' + viewId + '" style="background:#000000;border-radius:10px;overflow:hidden;margin-bottom:20px;position:relative;cursor:pointer;" title="Double-click to view full image">' +
    '  <div style="display:flex;align-items:center;justify-content:center;min-height:200px;max-height:400px;padding:20px;">' +
    '    <img src="' + imagePath + '" alt="' + title + '" style="width:100%;max-height:400px;object-fit:contain;display:block;background:#000000;">' +
    '  </div>' +
    '</div>' +
    '<div class="project-kpi-container">' +
    '  <div class="card project-kpi-box"><div class="project-kpi-label"><i class="fas fa-check-circle" style="color:#10b981;margin-right:8px;"></i>Total Available Units</div><div class="project-kpi-value" id="kpi-' + viewId + '">0</div></div>' +
    '  <div class="card project-kpi-price-box"><div class="project-kpi-label"><i class="fas fa-dollar-sign" style="color:#2563eb;margin-right:8px;"></i>Total SPA Price</div><div class="project-kpi-value" id="kpi-price-' + viewId + '">RM 0</div></div>' +
    '</div>' +
    '<div id="ibg-svg-wrapper" style="width:100%;display:flex;flex-direction:column;gap:20px;box-sizing:border-box;padding:0;margin-bottom:20px;">' +
    '  ' + renderLayoutPlanHeader(getLayoutBalance(viewId === "ion-belian-garden-commercial" ? "ION BELIAN GARDEN — COMMERCIAL" : "ION BELIAN GARDEN — RESIDENTIAL")) + '' +
    '  <div id="ibg-svg-stage-' + viewId + '" style="width:100%;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);overflow:hidden;min-height:200px;">' +
    '    <div style="display:flex;align-items:center;justify-content:center;height:200px;color:#5e6778;font-style:italic;">Loading layout...</div>' +
    '  </div>' +
    '  <div id="ibg-layout-legends-' + viewId + '"></div>' +
    '  <div id="ibg-layout-summary-' + viewId + '"></div>' +
    '</div>' +
    (viewId === "ion-belian-garden-commercial" ? renderProjectDetails("ION BELIAN GARDEN — COMMERCIAL") : '') +
    '<div class="card" id="staticAssetList-' + viewId + '">' +
    '  <div class="card-header">' +
    '    <span class="card-title"><i class="fas fa-table"></i> AVAILABLE UNIT LIST</span>' +
    '    <div class="table-controls">' +
    '      <select id="staticFilterPhase-' + viewId + '" class="table-filter"><option value="">All Phases</option></select>' +
    '      <select id="staticFilterType-' + viewId + '" class="table-filter"><option value="">All Unit Types</option></select>' +
    '      <button id="resetSort-' + viewId + '" class="table-filter" style="padding:6px 12px;border:1px solid var(--border-light);border-radius:4px;background:#fff;cursor:pointer;font-size:13px;font-weight:600;color:#0f2042;"><i class="fas fa-undo" style="margin-right:4px;"></i>Reset Sort</button>' +
    '    </div>' +
    '  </div>' +
    '  <div id="staticLedgerContainer-' + viewId + '" class="asset-table-container"></div>' +
    '  <div id="staticPagination-' + viewId + '" style="display:flex;align-items:center;justify-content:center;gap:12px;margin-top:16px;padding-top:12px;border-top:1px solid var(--border-light);"></div>' +
    '</div>';

  // Enable double-click fullscreen on project image
  var banner = document.getElementById("project-image-" + viewId);
  if (banner) {
    banner.addEventListener("dblclick", function() {
      openImageModal(imagePath, title);
    });
  }

  // Fetch layout data from API and render interactive SVG
  fetch(apiEndpoint)
    .then(function(res) { 
      console.log("IBG API response status:", res.status); 
      if (!res.ok) throw new Error("HTTP " + res.status); 
      return res.json(); 
    })
    .then(function(json) {
      console.log("IBG API response data:", json);
      var layoutUnits = (json && json.data) ? json.data : [];
      if (!Array.isArray(layoutUnits)) layoutUnits = [];
      console.log("IBG layout units count:", layoutUnits.length);

      // Get filtered units for KPI and Asset List
      var filteredUnits = filterFn(layoutUnits);
      console.log("IBG filtered units count:", filteredUnits.length);
      renderIbgKpi(viewId, filteredUnits);
      renderIbgAssetTable(viewId, filteredUnits);
      try { renderPsfInfoBox(viewId); } catch(e) { console.error("PSF info:", e); }
      applyPageOverrides(viewId);

      // Render interactive SVG with ALL units (not filtered)
      renderInteractiveSvg({
        svgUrl: svgPath,
        stageId: "ibg-svg-stage-" + viewId,
        legendsId: "ibg-layout-legends-" + viewId,
        summaryId: "ibg-layout-summary-" + viewId,
        units: layoutUnits,
        kpiId: "kpi-" + viewId,
        kpiPriceId: "kpi-price-" + viewId,
        modalId: "ibg-unit-modal-" + viewId,
        modalBodyId: "ibg-modal-body-" + viewId,
        modalCloseId: "ibg-modal-close-" + viewId,
        modalOverlayId: "ibg-modal-overlay-" + viewId,
        copyBtnId: "ibg-copy-btn-" + viewId,
        fitToScreen: true,
      });
    })
    .catch(function(err) {
      console.error("Failed to load IBG layout data:", err);
      renderIbgKpi(viewId, []);
      renderIbgAssetTable(viewId, []);
    });
}

function renderIbgKpi(viewId, units) {
  var kpiEl = document.getElementById("kpi-" + viewId);
  var priceEl = document.getElementById("kpi-price-" + viewId);
  if (kpiEl) kpiEl.textContent = computeAvailableUnits(units);
  if (priceEl) priceEl.textContent = formatPrice(computeDisplayedTotalPrice(units));
}

function overrideIbgKpi(viewId) {
  var kpiEl = document.getElementById("kpi-" + viewId);
  var priceEl = document.getElementById("kpi-price-" + viewId);
  if (viewId === "ion-belian-garden-commercial") {
    if (kpiEl) kpiEl.textContent = 1;
    if (priceEl) priceEl.textContent = "RM 758,000";
  } else if (viewId === "ion-belian-garden-residential") {
    if (kpiEl) kpiEl.textContent = 1;
    if (priceEl) priceEl.textContent = "RM 356,000";
  }
}

function renderIbgAssetTable(viewId, units) {
  renderStaticAssetTable(viewId, units);
}

function renderIbgCommercialView() {
  console.log("IBG Commercial: loading...");
  renderIbgPageStructure(
    "ion-belian-garden-commercial",
    "Commercial",
    function(units) {
      return units.filter(function(u) {
        return (u.Unit_No || "").toString().trim().toUpperCase() === "IBE-E1-03";
      });
    },
    "/Gallery/ION BELIAN GARDEN/IBG_Comm.jpeg",
    "/static/IBE_Master.svg",
    "/api/layout/ibe"
  );
  console.log("IBG Commercial: renderIbgPageStructure called");
}

function renderIbgResidentialView() {
  console.log("IBG Residential: loading...");
  renderIbgPageStructure(
    "ion-belian-garden-residential",
    "Residential",
    function(units) {
      return units.filter(function(u) {
        var unitNo = (u.Unit_No || "").toString().trim().toUpperCase();
        // Only show IBB-B23-10, exclude all Precinct C units
        return unitNo === "IBB-B23-10";
      });
    },
    "/Gallery/ION BELIAN GARDEN/IBG_Res.jpg",
    "/static/IBB_Master.svg",
    "/api/layout/ibb"
  );
  console.log("IBG Residential: renderIbgPageStructure called");
}

function applyPageOverrides(viewId) {
  var panel = document.getElementById("view-" + viewId);
  if (!panel) return;

  var configs = {
    "ion-belian-garden-commercial": { units: 1, price: "RM 758,000" },
    "ion-belian-garden-residential": { units: 1, price: "RM 356,000" },
    "n-city-commercial": { units: 30, price: "RM 37,571,660" },
    "n-city-rise": { units: 10, price: "RM 14,576,760" }
  };

  var cfg = configs[viewId];
  if (!cfg) return;

  // Hide original KPI cards
  var kpiContainer = panel.querySelector(".project-kpi-container");
  if (kpiContainer) kpiContainer.style.display = "none";

  // Remove existing custom KPI if present (avoid duplicates on re-render)
  var existingCustom = panel.querySelector("#custom-kpi-container-" + viewId);
  if (existingCustom) existingCustom.remove();

  // Create new Project Summary section matching original KPI card styling
  var newKpiHtml =
    '<div class="project-kpi-container" id="custom-kpi-container-' + viewId + '">' +
    '  <div class="card project-kpi-box"><div class="project-kpi-label"><i class="fas fa-check-circle" style="color:var(--corporate-orange);margin-right:8px;"></i>Available Units</div><div class="project-kpi-value" id="custom-kpi-' + viewId + '">' + cfg.units + '</div></div>' +
    '  <div class="card project-kpi-price-box"><div class="project-kpi-label"><i class="fas fa-coins" style="color:#0f2042;margin-right:8px;"></i>Total SPA Price</div><div class="project-kpi-value" id="custom-kpi-price-' + viewId + '">' + cfg.price + '</div></div>' +
    '</div>';

  var imageBanner = panel.querySelector(".project-image-banner");
  if (imageBanner) {
    var tempDiv = document.createElement("div");
    tempDiv.innerHTML = newKpiHtml;
    var newNode = tempDiv.firstChild;
    if (imageBanner.nextSibling) {
      imageBanner.parentNode.insertBefore(newNode, imageBanner.nextSibling);
    } else {
      imageBanner.parentNode.appendChild(newNode);
    }
  }

  // Hide lower summary sections
  var lowerSummaryIds = {
    "ion-belian-garden-commercial": "ibg-layout-summary-ion-belian-garden-commercial",
    "ion-belian-garden-residential": "ibg-layout-summary-ion-belian-garden-residential",
    "n-city-commercial": "ncity-svg-summary-n-city-commercial",
    "n-city-rise": "ncity-svg-summary-n-city-rise"
  };
  var summaryElId = lowerSummaryIds[viewId];
  if (summaryElId) {
    var summaryEl = document.getElementById(summaryElId);
    if (summaryEl) summaryEl.style.display = "none";
  }
}

/* ==========================================================================
   N-CITY — Commercial, Rise, Convention Hall Pages
   ========================================================================== */

// School units (Rise International School)
var NCITY_SCHOOL_UNITS = ["B5-01","B5-02","B5-03","B5-03A","B5-05","B5-06","B5-07","B5-08","B5-09","B5-10"];

function renderNcityCommercialView() {
  var viewId = "n-city-commercial";
  var panel = document.getElementById("view-" + viewId);
  if (!panel) return;
  var status = getProjectStatus("N-CITY");

  panel.innerHTML =
    '<div class="page-header">' +
    '  <div style="display:flex;justify-content:space-between;align-items:center;flex:1;flex-wrap:wrap;gap:8px;">' +
    '    <div><h1 style="margin-right:12px;">N-CITY — COMMERCIAL</h1><div class="header-sub">Project Dashboard</div></div>' +
    '  </div>' +
    '  <div class="data-extracted-box"><div class="de-label">Updated as of</div><div class="de-date">15 July 2026</div></div></div>' +
    '</div>' +
    '<div class="project-image-banner" id="project-image-' + viewId + '" style="background:#000000;border-radius:10px;overflow:hidden;margin-bottom:20px;position:relative;cursor:pointer;" title="Double-click to view full image">' +
    '  <div style="display:flex;align-items:center;justify-content:center;min-height:200px;max-height:400px;padding:20px;">' +
    '    <img src="/Gallery/N-CITY/N-CITY_COMM.png" alt="N-City Commercial" style="width:100%;max-height:400px;object-fit:contain;display:block;background:#000000;">' +
    '  </div>' +
    '</div>' +
    '<div class="project-kpi-container">' +
    '  <div class="card project-kpi-box"><div class="project-kpi-label"><i class="fas fa-check-circle" style="color:#10b981;margin-right:8px;"></i>Total Available Units</div><div class="project-kpi-value" id="kpi-' + viewId + '">0</div></div>' +
    '  <div class="card project-kpi-price-box"><div class="project-kpi-label"><i class="fas fa-dollar-sign" style="color:#2563eb;margin-right:8px;"></i>Total SPA Price</div><div class="project-kpi-value" id="kpi-price-' + viewId + '">RM 0</div></div>' +
    '</div>' +
    '<div id="ncity-svg-wrapper" style="width:100%;display:flex;flex-direction:column;gap:20px;box-sizing:border-box;padding:0;margin-bottom:20px;">' +
    '  ' + renderLayoutPlanHeader(getLayoutBalance("N-CITY — COMMERCIAL")) + '' +
    '  <div id="ncity-svg-stage-' + viewId + '" style="width:100%;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);overflow:hidden;min-height:200px;">' +
    '    <div style="display:flex;align-items:center;justify-content:center;height:200px;color:#5e6778;font-style:italic;">Loading layout...</div>' +
    '  </div>' +
    '  <div id="ncity-svg-legends-' + viewId + '"></div>' +
    '  <div id="ncity-svg-summary-' + viewId + '"></div>' +
    '</div>' +
    renderProjectDetails("N-CITY — COMMERCIAL") +
    '<div class="card" id="staticAssetList-' + viewId + '">' +
    '  <div class="card-header">' +
    '    <span class="card-title"><i class="fas fa-table"></i> AVAILABLE UNIT LIST</span>' +
    '    <div class="table-controls">' +
    '      <select id="staticFilterPhase-' + viewId + '" class="table-filter"><option value="">All Phases</option></select>' +
    '      <select id="staticFilterType-' + viewId + '" class="table-filter"><option value="">All Unit Types</option></select>' +
    '      <button id="resetSort-' + viewId + '" class="table-filter" style="padding:6px 12px;border:1px solid var(--border-light);border-radius:4px;background:#fff;cursor:pointer;font-size:13px;font-weight:600;color:#0f2042;"><i class="fas fa-undo" style="margin-right:4px;"></i>Reset Sort</button>' +
    '    </div>' +
    '  </div>' +
    '  <div id="staticLedgerContainer-' + viewId + '" class="asset-table-container"></div>' +
    '  <div id="staticPagination-' + viewId + '" style="display:flex;align-items:center;justify-content:center;gap:12px;margin-top:16px;padding-top:12px;border-top:1px solid var(--border-light);"></div>' +
    '</div>';

  // Enable double-click fullscreen on project image
  var banner = document.getElementById("project-image-" + viewId);
  if (banner) {
    banner.addEventListener("dblclick", function() {
      openImageModal("/Gallery/N-CITY/N-CITY_COMM.png", "N-City Commercial");
    });
  }

  // Use shared N-City SVG engine
  fetch("/api/layout/ncity")
    .then(function(res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
    .then(function(json) {
      var allNcityUnits = (json && json.data) ? json.data : [];
      if (!Array.isArray(allNcityUnits)) allNcityUnits = [];

      // Filter for this page (exclude school units)
      var filtered = allNcityUnits.filter(function(u) {
        var unitNo = (u.Unit_No || "").toString().trim().toUpperCase();
        return NCITY_SCHOOL_UNITS.indexOf(unitNo) === -1;
      });

      renderNcitySubKpi(viewId, filtered);
      renderNcitySubAssetTable(viewId, filtered);
      try { renderPsfInfoBox(viewId); } catch(e) { console.error("PSF info:", e); }
      applyPageOverrides(viewId);

      // Render shared N-City SVG with ALL units
      renderInteractiveSvg({
        svgUrl: "/static/N-CITY_Master.svg",
        stageId: "ncity-svg-stage-" + viewId,
        legendsId: "ncity-svg-legends-" + viewId,
        summaryId: "ncity-svg-summary-" + viewId,
        units: allNcityUnits,
        kpiId: "kpi-" + viewId,
        kpiPriceId: "kpi-price-" + viewId,
        modalId: "ncity-unit-modal-" + viewId,
        modalBodyId: "ncity-modal-body-" + viewId,
        modalCloseId: "ncity-modal-close-" + viewId,
        modalOverlayId: "ncity-modal-overlay-" + viewId,
        copyBtnId: "ncity-copy-btn-" + viewId,
        fitToScreen: true,
      });
    })
    .catch(function(err) {
      console.error("Failed to load N-City layout data:", err);
      renderNcitySubKpi(viewId, []);
      renderNcitySubAssetTable(viewId, []);
    });
}

function renderNcityRiseView() {
  var viewId = "n-city-rise";
  var panel = document.getElementById("view-" + viewId);
  if (!panel) return;
  var status = getProjectStatus("N-CITY");

  panel.innerHTML =
    '<div class="page-header">' +
    '  <div style="display:flex;justify-content:space-between;align-items:center;flex:1;flex-wrap:wrap;gap:8px;">' +
    '    <div><h1 style="margin-right:12px;">N-CITY — RISE INTERNATIONAL SCHOOL</h1><div class="header-sub">Project Dashboard</div></div>' +
    '  </div>' +
    '  <div class="data-extracted-box"><div class="de-label">Updated as of</div><div class="de-date">15 July 2026</div></div>' +
    '</div>' +
    '<div class="project-image-banner" id="project-image-' + viewId + '" style="background:#000000;border-radius:10px;overflow:hidden;margin-bottom:20px;position:relative;cursor:pointer;" title="Double-click to view full image">' +
    '  <div style="display:flex;align-items:center;justify-content:center;min-height:200px;max-height:400px;padding:20px;">' +
    '    <img src="/Gallery/N-CITY/N-CITY_RISE.jpeg" alt="Rise International School" style="width:100%;max-height:400px;object-fit:contain;display:block;background:#000000;">' +
    '  </div>' +
    '</div>' +
    '<div class="project-kpi-container">' +
    '  <div class="card project-kpi-box"><div class="project-kpi-label"><i class="fas fa-check-circle" style="color:#10b981;margin-right:8px;"></i>Total Available Units</div><div class="project-kpi-value" id="kpi-' + viewId + '">0</div></div>' +
    '  <div class="card project-kpi-price-box"><div class="project-kpi-label"><i class="fas fa-dollar-sign" style="color:#2563eb;margin-right:8px;"></i>Total SPA Price</div><div class="project-kpi-value" id="kpi-price-' + viewId + '">RM 0</div></div>' +
    '</div>' +
    '<div id="ncity-svg-wrapper" style="width:100%;display:flex;flex-direction:column;gap:20px;box-sizing:border-box;padding:0;margin-bottom:20px;">' +
    '  ' + renderLayoutPlanHeader(getLayoutBalance("N-CITY — RISE INTERNATIONAL SCHOOL")) + '' +
    '  <div id="ncity-svg-stage-' + viewId + '" style="width:100%;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);overflow:hidden;min-height:200px;">' +
    '    <div style="display:flex;align-items:center;justify-content:center;height:200px;color:#5e6778;font-style:italic;">Loading layout...</div>' +
    '  </div>' +
    '  <div id="ncity-svg-legends-' + viewId + '"></div>' +
    '  <div id="ncity-svg-summary-' + viewId + '"></div>' +
    '</div>' +
    '<div id="rise-layout-wrapper" style="width:100%;display:flex;flex-direction:column;gap:0;box-sizing:border-box;padding:0;margin-bottom:20px;">' +
    '  <div id="rise-layout-header" style="padding:12px 16px;margin-bottom:0;background:#f8fafc;border:1px solid #eef0f4;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06);display:flex;align-items:center;">' +
    '    <span class="card-title" style="flex-shrink:0;"><i class="fas fa-map"></i> LAYOUT PLAN</span>' +
    '    <span style="margin-left:auto;font-size:14px;font-weight:700;color:#0f2042;white-space:nowrap;">Bal 10 / 122 units</span>' +
    '  </div>' +
    '  <div id="rise-layout-stage" style="width:100%;background:#000000;border:1px solid #eef0f4;border-radius:10px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);overflow:hidden;position:relative;">' +
    '    <img id="rise-layout-img" src="/Gallery/N-CITY/N-City Rise_Layout.png" alt="N-City Rise Layout" style="width:100%;height:auto;display:block;border-radius:6px;transform-origin:center center;">' +
    '  </div>' +
    '</div>' +
    '<div class="card" id="staticAssetList-' + viewId + '">' +
    '  <div class="card-header">' +
    '    <span class="card-title"><i class="fas fa-table"></i> AVAILABLE UNIT LIST</span>' +
    '    <div class="table-controls">' +
    '      <select id="staticFilterPhase-' + viewId + '" class="table-filter"><option value="">All Phases</option></select>' +
    '      <select id="staticFilterType-' + viewId + '" class="table-filter"><option value="">All Unit Types</option></select>' +
    '      <button id="resetSort-' + viewId + '" class="table-filter" style="padding:6px 12px;border:1px solid var(--border-light);border-radius:4px;background:#fff;cursor:pointer;font-size:13px;font-weight:600;color:#0f2042;"><i class="fas fa-undo" style="margin-right:4px;"></i>Reset Sort</button>' +
    '    </div>' +
    '  </div>' +
    '  <div id="staticLedgerContainer-' + viewId + '" class="asset-table-container"></div>' +
    '  <div id="staticPagination-' + viewId + '" style="display:flex;align-items:center;justify-content:center;gap:12px;margin-top:16px;padding-top:12px;border-top:1px solid var(--border-light);"></div>' +
    '</div>';

  // Enable double-click fullscreen on project image
  var banner = document.getElementById("project-image-" + viewId);
  if (banner) {
    banner.addEventListener("dblclick", function() {
      openImageModal("/Gallery/N-CITY/N-CITY_RISE.jpeg", "Rise International School");
    });
  }

  // Enable double-click fullscreen on layout image
  var layoutImg = document.getElementById("rise-layout-img");
  if (layoutImg) {
    layoutImg.addEventListener("dblclick", function() {
      openImageModal("/Gallery/N-CITY/N-City Rise_Layout.png", "N-City Rise Layout");
    });
  }

  // Add zoom controls to Rise layout image
  var riseStage = document.getElementById("rise-layout-stage");
  var riseImg = document.getElementById("rise-layout-img");
  if (riseStage && riseImg) {
    var riseZoomControls = document.createElement('div');
    riseZoomControls.className = 'svg-zoom-controls';
    riseZoomControls.innerHTML = '<button class="svg-zoom-btn" id="zoom-in-rise-layout-stage" title="Zoom In">+</button>' +
                            '<button class="svg-zoom-btn" id="zoom-reset-rise-layout-stage" title="Reset">Reset</button>' +
                            '<button class="svg-zoom-btn" id="zoom-out-rise-layout-stage" title="Zoom Out">−</button>';
    riseStage.appendChild(riseZoomControls);

    var riseZoomIn = document.getElementById('zoom-in-rise-layout-stage');
    var riseZoomOut = document.getElementById('zoom-out-rise-layout-stage');
    var riseZoomReset = document.getElementById('zoom-reset-rise-layout-stage');
    var riseCurrentZoom = 1;
    var riseDefaultZoom = 1;
    var risePanX = 0, risePanY = 0;
    var riseIsDragging = false;
    var riseDragStartX, riseDragStartY;
    var riseDragPanX, riseDragPanY;

    function updateRiseZoom() {
      riseImg.style.transform = 'translate(' + risePanX + 'px, ' + risePanY + 'px) scale(' + riseCurrentZoom + ')';
      riseImg.style.transition = 'transform 0.3s ease';
      riseImg.style.cursor = riseCurrentZoom > 1 ? 'grab' : 'default';
      if (riseZoomIn) {
        riseZoomIn.disabled = riseCurrentZoom >= 3;
        riseZoomIn.style.opacity = riseCurrentZoom >= 3 ? '0.4' : '1';
      }
      if (riseZoomOut) {
        riseZoomOut.disabled = riseCurrentZoom <= 0.5;
        riseZoomOut.style.opacity = riseCurrentZoom <= 0.5 ? '0.4' : '1';
      }
    }

    // Drag-to-pan on rise layout image
    riseImg.addEventListener('mousedown', function(e) {
      if (riseCurrentZoom <= 1) return;
      riseIsDragging = true;
      riseDragStartX = e.clientX;
      riseDragStartY = e.clientY;
      riseDragPanX = risePanX;
      riseDragPanY = risePanY;
      riseImg.style.cursor = 'grabbing';
      riseImg.style.transition = 'none';
      e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
      if (!riseIsDragging) return;
      risePanX = riseDragPanX + (e.clientX - riseDragStartX);
      risePanY = riseDragPanY + (e.clientY - riseDragStartY);
      riseImg.style.transform = 'translate(' + risePanX + 'px, ' + risePanY + 'px) scale(' + riseCurrentZoom + ')';
      riseImg.style.transition = 'none';
    });

    document.addEventListener('mouseup', function(e) {
      if (!riseIsDragging) return;
      riseIsDragging = false;
      riseImg.style.cursor = riseCurrentZoom > 1 ? 'grab' : 'default';
      riseImg.style.transition = 'transform 0.3s ease';
    });

    if (riseZoomIn) {
      riseZoomIn.addEventListener('click', function() {
        if (riseCurrentZoom < 3) {
          riseCurrentZoom = Math.min(3, riseCurrentZoom + 0.2);
          updateRiseZoom();
        }
      });
    }
    if (riseZoomOut) {
      riseZoomOut.addEventListener('click', function() {
        if (riseCurrentZoom > 0.5) {
          riseCurrentZoom = Math.max(0.5, riseCurrentZoom - 0.2);
          updateRiseZoom();
        }
      });
    }
    if (riseZoomReset) {
      riseZoomReset.addEventListener('click', function() {
        riseCurrentZoom = riseDefaultZoom;
        risePanX = 0;
        risePanY = 0;
        updateRiseZoom();
      });
    }
    updateRiseZoom();
  }

  // Reuse identical N-City Commercial SVG engine
  fetch("/api/layout/ncity")
    .then(function(res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
    .then(function(json) {
      var allNcityUnits = (json && json.data) ? json.data : [];
      if (!Array.isArray(allNcityUnits)) allNcityUnits = [];

      // Filter for this page (only school units)
      var filtered = allNcityUnits.filter(function(u) {
        var unitNo = (u.Unit_No || "").toString().trim().toUpperCase();
        return NCITY_SCHOOL_UNITS.indexOf(unitNo) > -1;
      });

      renderNcitySubKpi(viewId, filtered);
      renderNcitySubAssetTable(viewId, filtered);
      applyPageOverrides(viewId);

      // Render dedicated N-City Rise SVG with school units only
      renderInteractiveSvg({
        svgUrl: "/static/N-CITY_Rise_Master.svg",
        stageId: "ncity-svg-stage-" + viewId,
        legendsId: "ncity-svg-legends-" + viewId,
        summaryId: "ncity-svg-summary-" + viewId,
        units: filtered,
        kpiId: "kpi-" + viewId,
        kpiPriceId: "kpi-price-" + viewId,
        modalId: "ncity-unit-modal-" + viewId,
        modalBodyId: "ncity-modal-body-" + viewId,
        modalCloseId: "ncity-modal-close-" + viewId,
        modalOverlayId: "ncity-modal-overlay-" + viewId,
        copyBtnId: "ncity-copy-btn-" + viewId,
        fitToScreen: true,
      });
    })
    .catch(function(err) {
      console.error("Failed to load N-City layout data:", err);
      renderNcitySubKpi(viewId, []);
      renderNcitySubAssetTable(viewId, []);
    });
}

function renderNcitySubKpi(viewId, units) {
  var kpiEl = document.getElementById("kpi-" + viewId);
  var priceEl = document.getElementById("kpi-price-" + viewId);
  if (kpiEl) kpiEl.textContent = computeAvailableUnits(units);
  if (priceEl) priceEl.textContent = formatPrice(computeDisplayedTotalPrice(units));
}

function renderNcitySubAssetTable(viewId, units) {
  renderStaticAssetTable(viewId, units);
}

function renderNcityConventionHallView() {
  var viewId = "n-city-convention-hall";
  var panel = document.getElementById("view-" + viewId);
  if (!panel) return;

  panel.innerHTML =
    '<div class="page-header">' +
    '  <div><h1>N-CITY — CONVENTION HALL</h1><div class="header-sub">Project Dashboard</div></div>' +
    '</div>' +

    '<div class="project-image-banner" style="background:#000000;border-radius:10px;overflow:hidden;margin-bottom:20px;position:relative;">' +
    '  <img src="/Gallery/N-CITY/N-CITY_HALL.png" alt="N-City Convention Hall" style="width:100%;max-height:400px;object-fit:contain;display:block;background:#000000;">' +
    '</div>' +
    '<div id="ncity-convention-layout" style="width:100%;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);overflow:hidden;margin-bottom:20px;">' +
    '  <img src="/Gallery/N-CITY/Hall_N-City_Layout.png" alt="Convention Hall Layout" style="width:100%;height:auto;display:block;border-radius:6px;">' +
    '</div>' +
    '<div class="card">' +
    '  <div class="card-header"><span class="card-title"><i class="fas fa-table"></i> ASSET LIST</span></div>' +
    '  <div style="background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px;overflow:hidden;">' +
    '    <img src="/Gallery/N-CITY/Asset List Hall_N-City.png" alt="Convention Hall Asset List" style="width:100%;height:auto;display:block;border-radius:6px;">' +
    '  </div>' +
    '</div>';
}

/* ==========================================================================
   TEMPORARY LAYOUT IMAGES FOR PROJECTS WITHOUT SVG
   ========================================================================== */
function renderLayoutWithTempImage(slug, imagePath) {
  var stageId = slug + "-layout-temp";
  // Check if there's a dedicated SVG wrapper
  var wrapper = document.getElementById(slug + "-svg-wrapper");
  if (!wrapper) {
    // Try generic approach - find layout stage
    wrapper = document.getElementById(slug + "-layout-wrapper");
  }
  if (!wrapper) {
    // Look for any svg-stage element
    var stage = document.getElementById(slug + "-svg-stage");
    if (stage) {
      stage.innerHTML = '<img src="' + imagePath + '" alt="Layout" style="width:100%;height:auto;display:block;border-radius:6px;">';
    }
    return;
  }
  var stage = wrapper.querySelector("div");
  if (stage) {
    stage.innerHTML = '<img src="' + imagePath + '" alt="Layout" style="width:100%;height:auto;display:block;border-radius:6px;">';
  }
}

/* ==========================================================================
   UPDATED NAVIGATION — Add new collapse handlers to activateSidebarItem
   ========================================================================== */
// Patch activateSidebarItem to handle new sub-views
var _origActivateSidebarItem = activateSidebarItem;
activateSidebarItem = function(view) {
  var items = document.querySelectorAll(".nav-item");
  var panels = document.querySelectorAll(".view-panel");
  for (var j = 0; j < items.length; j++) items[j].classList.remove("active");

  // Map sub-views to parent for active highlight
  var activeView = view;
  if (view === "nsip-km1" || view === "nsip-km2" || view === "nsip-km3" ||
      view === "nsip-km4" || view === "nsip-km5" || view === "nsip-km6" ||
      view === "svg-map") {
    activeView = "nsip";
  } else if (view === "nct-innosphere") {
    activeView = "nct-innosphere";
  } else if (view === "ion-belian-garden-commercial" || view === "ion-belian-garden-residential") {
    activeView = "ion-belian-garden";
  } else if (view === "n-city-commercial" || view === "n-city-rise" || view === "n-city-convention-hall") {
    activeView = "n-city";
  }

  var targetItem = document.querySelector('.nav-item[data-view="' + activeView + '"]');
  if (targetItem) targetItem.classList.add("active");
  for (var k = 0; k < panels.length; k++) {
    panels[k].classList.remove("active");
    panels[k].style.display = "none";
  }
  var panelId = document.getElementById("view-" + view);
  if (panelId) { panelId.classList.add("active"); panelId.style.display = "block"; }
};

/* ==========================================================================
   ADMIN FEATURES — Data Management, User Management, Sidebar visibility
   ========================================================================== */
function showAdminSidebar() {
  var section = document.getElementById("db-section-label");
  var navDM = document.getElementById("nav-data-management");
  var navUM = document.getElementById("nav-user-management");
  if (section) section.style.display = "block";
  if (navDM) navDM.style.display = "flex";
  if (navUM) navUM.style.display = "flex";
}

function renderDataManagementView() {
  var panel = document.getElementById("view-data-management");
  if (!panel) return;
  var userEmail = sessionStorage.getItem("nct_user_email") || localStorage.getItem("nct_user_email") || "";
  
  panel.innerHTML =
    '<div class="page-header">' +
    '  <div><h1>DATA MANAGEMENT</h1><div class="header-sub">Manage all property inventory records stored in the database.</div></div>' +
    '</div>' +
    '<div class="card" style="margin-bottom:16px;">' +
    '  <div class="card-body" style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;padding:12px 16px;">' +
    '    <input type="text" id="dmSearchInput" placeholder="Search by Unit No." style="flex:1;min-width:200px;padding:8px 12px;border:1px solid #d1d5db;border-radius:4px;font-size:13px;">' +
    '    <select id="dmProjectFilter" style="min-width:180px;padding:8px 12px;border:1px solid #d1d5db;border-radius:4px;font-size:13px;"><option value="">All Projects</option></select>' +
    '    <select id="dmStatusFilter" style="min-width:150px;padding:8px 12px;border:1px solid #d1d5db;border-radius:4px;font-size:13px;">' +
    '      <option value="">All Statuses</option>' +
    '      <option value="Available">Available</option>' +
    '      <option value="Signed">Signed</option>' +
    '      <option value="Sold">Sold</option>' +
    '      <option value="Registered">Registered</option>' +
    '    </select>' +
    '    <span id="dmRecordCount" style="font-size:13px;color:#5e6778;white-space:nowrap;"></span>' +
    '  </div>' +
    '</div>' +
    '<div class="card">' +
    '  <div class="table-wrapper" style="overflow:auto;max-height:70vh;">' +
    '    <div id="dmTableContainer" style="font-size:12px;"></div>' +
    '  </div>' +
    '</div>';

  // Fetch units
  fetch("/api/admin/units?email=" + encodeURIComponent(userEmail))
    .then(function(res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
    .then(function(json) {
      if (!json.success) throw new Error(json.error || "Access denied");
      var units = json.data || [];
      var allUnits = units;
      window.__dmUnits = units;

      // Populate project filter
      var filter = document.getElementById("dmProjectFilter");
      if (filter) {
        var projects = {};
        units.forEach(function(u) { if (u.project) projects[u.project] = true; });
        Object.keys(projects).sort().forEach(function(p) {
          var opt = document.createElement("option");
          opt.value = p;
          opt.textContent = p;
          filter.appendChild(opt);
        });
      }

      function renderTable() {
        var searchVal = (document.getElementById("dmSearchInput").value || "").trim().toLowerCase();
        var projVal = (document.getElementById("dmProjectFilter").value || "").trim();

        var filtered = allUnits;
        if (searchVal) filtered = filtered.filter(function(u) { return (u.unit_no || "").toLowerCase().indexOf(searchVal) > -1; });
        if (projVal) filtered = filtered.filter(function(u) { return (u.project || "") === projVal; });
        var statusVal = (document.getElementById("dmStatusFilter").value || "").trim();
        if (statusVal) filtered = filtered.filter(function(u) { return (u.status || "") === statusVal; });

        var countEl = document.getElementById("dmRecordCount");
        if (countEl) countEl.textContent = filtered.length + " records";

        if (filtered.length === 0) {
          document.getElementById("dmTableContainer").innerHTML = '<div style="padding:40px;text-align:center;color:#5e6778;">No records found.</div>';
          return;
        }

        var cols = Object.keys(filtered[0]);
        var html = '<table class="asset-table" style="width:100%;border-collapse:collapse;font-size:11px;">';
        html += '<thead><tr style="position:sticky;top:0;z-index:2;">';
        cols.forEach(function(c) { html += '<th style="white-space:nowrap;padding:6px 8px;text-align:left;background:#f4f6fa;border:1px solid #eef0f4;">' + c + '</th>'; });
        html += '<th style="white-space:nowrap;padding:6px 8px;text-align:center;background:#f4f6fa;border:1px solid #eef0f4;">Action</th>';
        html += '</tr></thead><tbody>';
        filtered.forEach(function(u) {
          html += '<tr>';
          cols.forEach(function(c) {
            var val = (u[c] !== null && u[c] !== undefined) ? String(u[c]) : "";
            html += '<td style="padding:4px 8px;border:1px solid #eef0f4;white-space:nowrap;max-width:200px;overflow:hidden;text-overflow:ellipsis;">' + val + '</td>';
          });
          html += '<td style="padding:4px 8px;border:1px solid #eef0f4;white-space:nowrap;text-align:center;">' +
            '<button class="dm-edit-btn" data-id="' + u.id + '" style="padding:3px 8px;background:#f47217;color:white;border:none;border-radius:3px;cursor:pointer;font-size:11px;margin-right:4px;">Edit</button>' +
            '<button class="dm-delete-btn" data-id="' + u.id + '" style="padding:3px 8px;background:#dc2626;color:white;border:none;border-radius:3px;cursor:pointer;font-size:11px;">Delete</button>' +
            '</td>';
          html += '</tr>';
        });
        html += '</tbody></table>';
        document.getElementById("dmTableContainer").innerHTML = html;

        // Bind edit buttons
        document.querySelectorAll(".dm-edit-btn").forEach(function(btn) {
          btn.addEventListener("click", function() {
            var id = parseInt(this.getAttribute("data-id"));
            var unit = allUnits.filter(function(u) { return u.id === id; })[0];
            if (unit) openDmEditForm(unit, allUnits);
          });
        });

        // Bind delete buttons
        document.querySelectorAll(".dm-delete-btn").forEach(function(btn) {
          btn.addEventListener("click", function() {
            var id = parseInt(this.getAttribute("data-id"));
            showDmDeleteConfirm(id);
          });
        });
      }

      // Bind search/filter
      document.getElementById("dmSearchInput").addEventListener("input", renderTable);
      document.getElementById("dmProjectFilter").addEventListener("change", renderTable);
      document.getElementById("dmStatusFilter").addEventListener("change", renderTable);

      renderTable();
    })
    .catch(function(err) {
      console.error("DM error:", err);
      var container = document.getElementById("dmTableContainer");
      if (container) container.innerHTML = '<div style="padding:40px;text-align:center;color:#dc2626;">' + err.message + '</div>';
    });
}

function openDmEditForm(unit, allUnits) {
  var panel = document.getElementById("view-data-management");
  if (!panel) return;
  var userEmail = sessionStorage.getItem("nct_user_email") || localStorage.getItem("nct_user_email") || "";

  var fields = Object.keys(unit);
  var formHtml = '<div class="page-header"><div><h1>Edit Unit</h1><div class="header-sub">ID: ' + unit.id + '</div></div></div>';
  formHtml += '<div class="card"><div class="card-body" style="padding:16px;">';
  formHtml += '<form id="dmEditForm" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">';
  var NULLABLE_FIELDS = {"contract_amt": true, "spa_date": true, "sale_date": true};
  var REQUIRED_FIELDS = {"status": true, "unit_no": true};
  var STATUS_OPTIONS = ["Available", "Signed", "Sold", "Registered", "Not Available"];

  fields.forEach(function(f) {
    if (f === "id" || f === "created_at") return;
    var val = (unit[f] !== null && unit[f] !== undefined) ? String(unit[f]) : "";
    var displayLabel = f.replace(/_/g, " ").replace(/\b\w/g, function(l) { return l.toUpperCase(); });
    formHtml += '<div style="display:flex;flex-direction:column;gap:4px;">';
    formHtml += '<label style="font-size:11px;font-weight:600;color:#5e6778;text-transform:uppercase;">' + displayLabel + '</label>';
    if (f === "unit_address") {
      formHtml += '<textarea name="' + f + '" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;font-size:12px;min-height:60px;">' + val + '</textarea>';
    } else if (f === "status") {
      formHtml += '<select name="' + f + '" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;font-size:12px;">';
      formHtml += '<option value="">-- Select --</option>';
      STATUS_OPTIONS.forEach(function(opt) {
        formHtml += '<option value="' + opt + '"' + (val.trim() === opt ? ' selected' : '') + '>' + opt + '</option>';
      });
      formHtml += '</select>';
    } else {
      formHtml += '<input type="text" name="' + f + '" value="' + val.replace(/"/g, "&#34;") + '" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;font-size:12px;">';
    }
    formHtml += '</div>';
  });
  formHtml += '</form>';
  formHtml += '<div id="dmEditAlert" style="margin-top:12px;"></div>';
  formHtml += '<div style="display:flex;gap:12px;justify-content:flex-end;margin-top:16px;padding-top:12px;border-top:1px solid #eef0f4;">';
  formHtml += '<button type="button" id="dmSaveBtn" style="padding:8px 20px;background:#f47217;color:white;border:none;border-radius:4px;font-weight:600;cursor:pointer;font-size:13px;">Save</button>';
  formHtml += '<button type="button" id="dmCancelBtn" style="padding:8px 20px;background:#ffffff;color:#1a1d23;border:1px solid #d1d5db;border-radius:4px;font-weight:600;cursor:pointer;font-size:13px;">Cancel</button>';
  formHtml += '</div></div></div>';

  panel.innerHTML = formHtml;

  document.getElementById("dmCancelBtn").addEventListener("click", function() { renderDataManagementView(); });
  document.getElementById("dmSaveBtn").addEventListener("click", function() {
    var form = document.getElementById("dmEditForm");
    if (!form) return;
    var formData = {};
    var inputs = form.querySelectorAll("input, textarea, select");
    inputs.forEach(function(inp) {
      var name = inp.getAttribute("name");
      if (!name) return;
      var raw = inp.value;
      if (REQUIRED_FIELDS[name]) {
        formData[name] = raw.trim();
      } else if (NULLABLE_FIELDS[name]) {
        formData[name] = raw.trim() === "" ? null : raw;
      } else {
        formData[name] = raw;
      }
    });

    // Validate required fields
    var statusVal = (formData.status || "").toString().trim();
    var unitNoVal = (formData.unit_no || "").toString().trim();
    if (!statusVal || !unitNoVal) {
      var alertEl = document.getElementById("dmEditAlert");
      if (alertEl) alertEl.innerHTML = '<div style="padding:10px 14px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:13px;"><i class="fas fa-exclamation-circle" style="margin-right:6px;"></i>Status and Unit Number are required.</div>';
      return;
    }

    fetch("/api/admin/units/" + unit.id, {
      method: "PUT",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({email: userEmail, data: formData})
    })
    .then(function(res) { return res.json(); })
    .then(function(json) {
      if (json.success) {
        var alertEl = document.getElementById("dmEditAlert");
        if (alertEl) alertEl.innerHTML = '<div style="padding:10px 14px;background:#d1fae5;border:1px solid #10b981;border-radius:4px;color:#065f46;font-size:13px;font-weight:500;"><i class="fas fa-check-circle" style="margin-right:6px;"></i>' + (json.message || "Record updated successfully.") + '</div>';
        setTimeout(function() { renderDataManagementView(); }, 1000);
      } else {
        var alertEl = document.getElementById("dmEditAlert");
        if (alertEl) alertEl.innerHTML = '<div style="padding:10px 14px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:13px;"><i class="fas fa-exclamation-circle" style="margin-right:6px;"></i>' + (json.error || "Update failed.") + '</div>';
      }
    })
    .catch(function(err) {
      var alertEl = document.getElementById("dmEditAlert");
      if (alertEl) alertEl.innerHTML = '<div style="padding:10px 14px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:13px;"><i class="fas fa-exclamation-circle" style="margin-right:6px;"></i>Error: ' + err.message + '</div>';
    });
  });
}

function showDmDeleteConfirm(unitId) {
  var overlay = document.createElement("div");
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,0.75);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;";
  overlay.id = "dm-delete-overlay";

  var userEmail = sessionStorage.getItem("nct_user_email") || localStorage.getItem("nct_user_email") || "";

  overlay.innerHTML =
    '<div style="width:400px;max-width:calc(100vw-32px);background:#ffffff;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,0.35);overflow:hidden;font-family:Inter,system-ui,sans-serif;">' +
    '  <div style="padding:20px 24px;border-bottom:1px solid #eef0f4;">' +
    '    <h3 style="margin:0;font-size:16px;font-weight:700;color:#1a1d23;">Delete Record</h3>' +
    '  </div>' +
    '  <div style="padding:20px 24px;">' +
    '    <p style="margin:0;font-size:14px;color:#5e6778;line-height:1.5;">' +
    '      This will permanently delete this record.<br><br>This action cannot be undone.' +
    '    </p>' +
    '  </div>' +
    '  <div style="padding:12px 24px;border-top:1px solid #eef0f4;display:flex;gap:12px;justify-content:flex-end;">' +
    '    <button id="dmDeleteCancelBtn" style="padding:8px 18px;background:#ffffff;color:#1a1d23;border:1px solid #d1d5db;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px;">Cancel</button>' +
    '    <button id="dmDeleteConfirmBtn" style="padding:8px 18px;background:#dc2626;color:white;border:none;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px;">Delete</button>' +
    '  </div>' +
    '</div>';

  document.body.appendChild(overlay);

  document.getElementById("dmDeleteCancelBtn").addEventListener("click", function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); });
  document.getElementById("dmDeleteConfirmBtn").addEventListener("click", function() {
    fetch("/api/admin/units/" + unitId, {
      method: "DELETE",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({email: userEmail, unit_id: unitId})
    })
    .then(function(res) { return res.json(); })
    .then(function(json) {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (json.success) {
        renderDataManagementView();
      }
    })
    .catch(function(err) {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      console.error("Delete error:", err);
    });
  });
}

/* ==========================================================================
   USER MANAGEMENT (nct_admin only)
   ========================================================================== */
function renderUserManagementView() {
  var panel = document.getElementById("view-user-management");
  if (!panel) return;
  var userEmail = sessionStorage.getItem("nct_user_email") || localStorage.getItem("nct_user_email") || "";

  panel.innerHTML =
    '<div class="page-header">' +
    '  <div><h1>USER MANAGEMENT</h1><div class="header-sub">Manage system users and permissions.</div></div>' +
    '  <button id="createUserBtn" style="padding:8px 18px;background:#f47217;color:white;border:none;border-radius:4px;font-weight:600;cursor:pointer;font-size:13px;">Create New User</button>' +
    '</div>' +
    '<div class="card">' +
    '  <div class="table-wrapper" style="overflow:auto;max-height:70vh;">' +
    '    <div id="umTableContainer" style="font-size:12px;"></div>' +
    '  </div>' +
    '</div>';

  document.getElementById("createUserBtn").addEventListener("click", function() { renderCreateUserView(); });

  fetch("/api/admin/users?email=" + encodeURIComponent(userEmail))
    .then(function(res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
    .then(function(json) {
      if (!json.success) throw new Error(json.error || "Access denied");
      var users = json.data || [];
      window.__umUsers = users;

      var SENSITIVE_COLS = ["mfa_secret", "mfa_backup_codes", "password_hash"];
      var cols = Object.keys(users[0] || {}).filter(function(c) { return SENSITIVE_COLS.indexOf(c) === -1; });
      var html = '<table class="asset-table" style="width:100%;border-collapse:collapse;font-size:11px;">';
      html += '<thead><tr style="position:sticky;top:0;z-index:2;">';
      cols.forEach(function(c) { html += '<th style="white-space:nowrap;padding:6px 8px;text-align:left;background:#f4f6fa;border:1px solid #eef0f4;">' + c + '</th>'; });
      html += '<th style="white-space:nowrap;padding:6px 8px;text-align:center;background:#f4f6fa;border:1px solid #eef0f4;">Action</th>';
      html += '</tr></thead><tbody>';
      users.forEach(function(u) {
        html += '<tr>';
        cols.forEach(function(c) {
          var val = (u[c] !== null && u[c] !== undefined) ? String(u[c]) : "";
          html += '<td style="padding:4px 8px;border:1px solid #eef0f4;white-space:nowrap;max-width:200px;overflow:hidden;text-overflow:ellipsis;">' + val + '</td>';
        });
        html += '<td style="padding:4px 8px;border:1px solid #eef0f4;white-space:nowrap;text-align:center;">' +
          '<button class="um-edit-btn" data-id="' + u.id + '" style="padding:3px 8px;background:#f47217;color:white;border:none;border-radius:3px;cursor:pointer;font-size:11px;margin-right:4px;">Edit</button>' +
          '<button class="um-delete-btn" data-id="' + u.id + '" style="padding:3px 8px;background:#dc2626;color:white;border:none;border-radius:3px;cursor:pointer;font-size:11px;">Delete</button>' +
          '</td>';
        html += '</tr>';
      });
      html += '</tbody></table>';
      document.getElementById("umTableContainer").innerHTML = html;

      document.querySelectorAll(".um-edit-btn").forEach(function(btn) {
        btn.addEventListener("click", function() {
          var id = parseInt(this.getAttribute("data-id"));
          var user = users.filter(function(u) { return u.id === id; })[0];
          if (user) openUserEditForm(user, users);
        });
      });

      document.querySelectorAll(".um-delete-btn").forEach(function(btn) {
        btn.addEventListener("click", function() {
          var id = parseInt(this.getAttribute("data-id"));
          showUserDeleteConfirm(id);
        });
      });
    })
    .catch(function(err) {
      console.error("UM error:", err);
      var container = document.getElementById("umTableContainer");
      if (container) container.innerHTML = '<div style="padding:40px;text-align:center;color:#dc2626;">' + err.message + '</div>';
    });
}

function openUserEditForm(user, allUsers) {
  var panel = document.getElementById("view-user-management");
  if (!panel) return;
  var userEmail = sessionStorage.getItem("nct_user_email") || localStorage.getItem("nct_user_email") || "";

  panel.innerHTML =
    '<div class="page-header"><div><h1>Edit User</h1><div class="header-sub">ID: ' + user.id + '</div></div></div>' +
    '<div class="card"><div class="card-body" style="padding:16px;">' +
    '<form id="umEditForm" style="display:flex;flex-direction:column;gap:12px;">' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
    '<div style="display:flex;flex-direction:column;gap:4px;"><label style="font-size:11px;font-weight:600;color:#5e6778;text-transform:uppercase;">Name</label><input type="text" name="name" value="' + esc(user.name || "") + '" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;font-size:12px;"></div>' +
    '<div style="display:flex;flex-direction:column;gap:4px;"><label style="font-size:11px;font-weight:600;color:#5e6778;text-transform:uppercase;">Email</label><input type="email" name="email" value="' + esc(user.email || "") + '" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;font-size:12px;"></div>' +
    '<div style="display:flex;flex-direction:column;gap:4px;"><label style="font-size:11px;font-weight:600;color:#5e6778;text-transform:uppercase;">Mobile</label><input type="text" name="mobile" value="' + esc(user.mobile || "") + '" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;font-size:12px;"></div>' +
    '<div style="display:flex;flex-direction:column;gap:4px;"><label style="font-size:11px;font-weight:600;color:#5e6778;text-transform:uppercase;">Role</label><input type="text" name="role" value="' + esc(user.role || "") + '" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;font-size:12px;"></div>' +
    '<div style="display:flex;flex-direction:column;gap:4px;"><label style="font-size:11px;font-weight:600;color:#5e6778;text-transform:uppercase;">User Type</label><select name="user_type" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;font-size:12px;"><option value="nct_user"' + (user.user_type === "nct_user" ? ' selected' : '') + '>nct_user</option><option value="agent"' + (user.user_type === "agent" ? ' selected' : '') + '>agent</option><option value="nct_admin"' + (user.user_type === "nct_admin" ? ' selected' : '') + '>nct_admin</option></select></div>' +
    '<div style="display:flex;flex-direction:column;gap:4px;"><label style="font-size:11px;font-weight:600;color:#5e6778;text-transform:uppercase;">Status</label><select name="status" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;font-size:12px;"><option value="active"' + (user.status === "active" ? ' selected' : '') + '>Active</option><option value="inactive"' + (user.status === "inactive" ? ' selected' : '') + '>Inactive</option></select></div>' +
    '<div style="display:flex;flex-direction:column;gap:4px;"><label style="font-size:11px;font-weight:600;color:#5e6778;text-transform:uppercase;">MFA Enabled</label><select name="mfa_enabled" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;font-size:12px;"><option value="0"' + (!user.mfa_enabled ? ' selected' : '') + '>Disabled</option><option value="1"' + (user.mfa_enabled ? ' selected' : '') + '>Enabled</option></select></div>' +
    '<div style="display:flex;flex-direction:column;gap:4px;"><label style="font-size:11px;font-weight:600;color:#5e6778;text-transform:uppercase;">Reset Password</label><button type="button" id="resetPasswordBtn" style="padding:6px 12px;background:#f47217;color:white;border:none;border-radius:4px;font-weight:600;cursor:pointer;font-size:12px;">Reset Password</button></div>' +
    '</div>' +
    '<div id="umEditAlert" style="margin-top:12px;"></div>' +
    '<div style="display:flex;gap:12px;justify-content:flex-end;margin-top:16px;padding-top:12px;border-top:1px solid #eef0f4;">' +
    '<button type="button" id="umSaveBtn" style="padding:8px 20px;background:#f47217;color:white;border:none;border-radius:4px;font-weight:600;cursor:pointer;font-size:13px;">Save</button>' +
    '<button type="button" id="umCancelBtn" style="padding:8px 20px;background:#ffffff;color:#1a1d23;border:1px solid #d1d5db;border-radius:4px;font-weight:600;cursor:pointer;font-size:13px;">Cancel</button>' +
    '</div></form></div></div>';

  document.getElementById("umCancelBtn").addEventListener("click", function() { renderUserManagementView(); });
  
  var resetPwdBtn = panel.querySelector("#resetPasswordBtn");
  if (resetPwdBtn) {
    resetPwdBtn.addEventListener("click", function() {
      showResetPasswordModal(user.id, user.email);
    });
  }
  
  document.getElementById("umSaveBtn").addEventListener("click", function() {
    var form = document.getElementById("umEditForm");
    if (!form) return;
    var formData = {};
    var inputs = form.querySelectorAll("input, select");
    inputs.forEach(function(inp) {
      var name = inp.getAttribute("name");
      if (!name) return;
      formData[name] = inp.value;
    });

    fetch("/api/admin/users/" + user.id, {
      method: "PUT",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({email: userEmail, data: formData})
    })
    .then(function(res) { return res.json(); })
    .then(function(json) {
      if (json.success) {
        var alertEl = document.getElementById("umEditAlert");
        if (alertEl) alertEl.innerHTML = '<div style="padding:10px 14px;background:#d1fae5;border:1px solid #10b981;border-radius:4px;color:#065f46;font-size:13px;font-weight:500;"><i class="fas fa-check-circle" style="margin-right:6px;"></i>' + (json.message || "User updated successfully.") + '</div>';
        setTimeout(function() { renderUserManagementView(); }, 1000);
      } else {
        var alertEl = document.getElementById("umEditAlert");
        if (alertEl) alertEl.innerHTML = '<div style="padding:10px 14px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:13px;"><i class="fas fa-exclamation-circle" style="margin-right:6px;"></i>' + (json.error || "Update failed.") + '</div>';
      }
    })
    .catch(function(err) {
      var alertEl = document.getElementById("umEditAlert");
      if (alertEl) alertEl.innerHTML = '<div style="padding:10px 14px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:13px;"><i class="fas fa-exclamation-circle" style="margin-right:6px;"></i>Error: ' + err.message + '</div>';
    });
  });
}

function showResetPasswordModal(userId, userEmail) {
  var overlay = document.createElement("div");
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,0.75);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;";
  overlay.id = "reset-password-overlay";

  var adminEmail = sessionStorage.getItem("nct_user_email") || localStorage.getItem("nct_user_email") || "";

  overlay.innerHTML =
    '<div style="width:420px;max-width:calc(100vw-32px);background:#ffffff;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,0.35);overflow:hidden;font-family:Inter,system-ui,sans-serif;">' +
    '  <div style="padding:20px 24px;border-bottom:1px solid #eef0f4;">' +
    '    <h3 style="margin:0;font-size:16px;font-weight:700;color:#1a1d23;">Reset User Password</h3>' +
    '  </div>' +
    '  <div style="padding:20px 24px;">' +
    '    <div style="display:flex;flex-direction:column;gap:16px;">' +
    '      <div>' +
    '        <label style="display:block;font-size:13px;font-weight:600;color:#1a1d23;margin-bottom:6px;">Temporary Password</label>' +
    '        <div style="position:relative;">' +
    '          <input type="password" id="resetPasswordInput" placeholder="Enter temporary password" style="width:100%;padding:10px 40px 10px 12px;border:1px solid #d1d5db;border-radius:4px;font-size:14px;box-sizing:border-box;" autocomplete="new-password">' +
    '          <button type="button" class="pw-toggle" data-target="resetPasswordInput" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;color:#5e6778;cursor:pointer;padding:4px;font-size:16px;line-height:1;" title="Show/Hide Password"><i class="fas fa-eye-slash"></i></button>' +
    '        </div>' +
    '      </div>' +
    '      <div id="resetPasswordAlert" style="min-height:20px;"></div>' +
    '    </div>' +
    '  </div>' +
    '  <div style="padding:12px 24px;border-top:1px solid #eef0f4;display:flex;gap:12px;justify-content:flex-end;">' +
    '    <button id="resetPasswordCancelBtn" style="padding:8px 18px;background:#ffffff;color:#1a1d23;border:1px solid #d1d5db;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px;">Cancel</button>' +
    '    <button id="resetPasswordSaveBtn" style="padding:8px 18px;background:#f47217;color:white;border:none;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px;">Save Password</button>' +
    '  </div>' +
    '</div>';

  document.body.appendChild(overlay);

  var cancelBtn = document.getElementById("resetPasswordCancelBtn");
  var saveBtn = document.getElementById("resetPasswordSaveBtn");
  var passwordInput = document.getElementById("resetPasswordInput");
  var alertDiv = document.getElementById("resetPasswordAlert");

  function closeModal() {
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }

  cancelBtn.addEventListener("click", closeModal);

  saveBtn.addEventListener("click", function() {
    var newPassword = passwordInput.value;
    
    if (!newPassword) {
      alertDiv.innerHTML = '<div style="padding:10px 14px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:13px;"><i class="fas fa-exclamation-circle" style="margin-right:6px;"></i>Please enter a password.</div>';
      return;
    }

    var errors = validatePassword(newPassword);
    if (errors.length > 0) {
      alertDiv.innerHTML = '<div style="padding:10px 14px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:13px;"><i class="fas fa-exclamation-circle" style="margin-right:6px;"></i>' + errors.join("<br>") + '</div>';
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";
    alertDiv.innerHTML = "";

    fetch("/api/admin/reset-password", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({email: adminEmail, user_id: userId, new_password: newPassword})
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.success) {
        alertDiv.innerHTML = '<div style="padding:10px 14px;background:#d1fae5;border:1px solid #10b981;border-radius:4px;color:#065f46;font-size:13px;font-weight:500;"><i class="fas fa-check-circle" style="margin-right:6px;"></i>' + (data.message || "Password reset successfully.") + '</div>';
        setTimeout(closeModal, 1500);
      } else {
        alertDiv.innerHTML = '<div style="padding:10px 14px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:13px;"><i class="fas fa-exclamation-circle" style="margin-right:6px;"></i>' + (data.message || "Failed to reset password.") + '</div>';
        saveBtn.disabled = false;
        saveBtn.textContent = "Save Password";
      }
    })
    .catch(function(err) {
      alertDiv.innerHTML = '<div style="padding:10px 14px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:13px;"><i class="fas fa-exclamation-circle" style="margin-right:6px;"></i>Error: ' + err.message + '</div>';
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Password";
    });
  });

  // Password toggle
  var toggleBtn = overlay.querySelector(".pw-toggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", function() {
      var targetId = this.getAttribute("data-target");
      var input = document.getElementById(targetId);
      var icon = this.querySelector("i");
      if (!input || !icon) return;
      if (input.type === "password") {
        input.type = "text";
        icon.className = "fas fa-eye";
      } else {
        input.type = "password";
        icon.className = "fas fa-eye-slash";
      }
    });
  }

  // Close on overlay click
  overlay.addEventListener("click", function(e) {
    if (e.target === overlay) closeModal();
  });

  // Focus password input
  setTimeout(function() {
    if (passwordInput) passwordInput.focus();
  }, 100);
}

function showUserDeleteConfirm(userId) {
  var overlay = document.createElement("div");
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,0.75);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;";
  overlay.id = "um-delete-overlay";

  var userEmail = sessionStorage.getItem("nct_user_email") || localStorage.getItem("nct_user_email") || "";

  overlay.innerHTML =
    '<div style="width:400px;max-width:calc(100vw-32px);background:#ffffff;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,0.35);overflow:hidden;font-family:Inter,system-ui,sans-serif;">' +
    '  <div style="padding:20px 24px;border-bottom:1px solid #eef0f4;"><h3 style="margin:0;font-size:16px;font-weight:700;color:#1a1d23;">Delete User</h3></div>' +
    '  <div style="padding:20px 24px;"><p style="margin:0;font-size:14px;color:#5e6778;line-height:1.5;">This will permanently delete this user.<br><br>This action cannot be undone.</p></div>' +
    '  <div style="padding:12px 24px;border-top:1px solid #eef0f4;display:flex;gap:12px;justify-content:flex-end;">' +
    '    <button id="umDeleteCancelBtn" style="padding:8px 18px;background:#ffffff;color:#1a1d23;border:1px solid #d1d5db;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px;">Cancel</button>' +
    '    <button id="umDeleteConfirmBtn" style="padding:8px 18px;background:#dc2626;color:white;border:none;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px;">Delete</button>' +
    '  </div>' +
    '</div>';

  document.body.appendChild(overlay);

  document.getElementById("umDeleteCancelBtn").addEventListener("click", function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); });
  document.getElementById("umDeleteConfirmBtn").addEventListener("click", function() {
    fetch("/api/admin/users/" + userId, {
      method: "DELETE",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({email: userEmail, user_id: userId})
    })
    .then(function(res) { return res.json(); })
    .then(function(json) {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (json.success) renderUserManagementView();
    })
    .catch(function(err) {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      console.error("Delete user error:", err);
    });
  });
}

function renderCreateUserView() {
  var panel = document.getElementById("view-user-management");
  if (!panel) return;

  panel.innerHTML =
    '<div class="page-header"><div><h1>Create New User</h1><div class="header-sub">Add a new system user</div></div></div>' +
    '<div class="card"><div class="card-body" style="padding:16px;">' +
    '<form id="umCreateForm" style="display:flex;flex-direction:column;gap:12px;">' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
    '<div style="display:flex;flex-direction:column;gap:4px;"><label style="font-size:11px;font-weight:600;color:#5e6778;text-transform:uppercase;">Name *</label><input type="text" name="name" placeholder="Enter full name" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;font-size:12px;"></div>' +
    '<div style="display:flex;flex-direction:column;gap:4px;"><label style="font-size:11px;font-weight:600;color:#5e6778;text-transform:uppercase;">Email *</label><input type="email" name="email" placeholder="Enter email address" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;font-size:12px;"></div>' +
    '<div style="display:flex;flex-direction:column;gap:4px;"><label style="font-size:11px;font-weight:600;color:#5e6778;text-transform:uppercase;">Mobile</label><input type="text" name="mobile" placeholder="Enter mobile number" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;font-size:12px;"></div>' +
    '<div style="display:flex;flex-direction:column;gap:4px;"><label style="font-size:11px;font-weight:600;color:#5e6778;text-transform:uppercase;">Role *</label><input type="text" name="role" placeholder="Enter role" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;font-size:12px;"></div>' +
    '<div style="display:flex;flex-direction:column;gap:4px;"><label style="font-size:11px;font-weight:600;color:#5e6778;text-transform:uppercase;">User Type *</label><select name="user_type" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;font-size:12px;"><option value="nct_user">nct_user</option><option value="agent">agent</option><option value="nct_admin">nct_admin</option></select></div>' +
    '<div style="display:flex;flex-direction:column;gap:4px;"><label style="font-size:11px;font-weight:600;color:#5e6778;text-transform:uppercase;">Status *</label><select name="status" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;font-size:12px;"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>' +
    '<div style="display:flex;flex-direction:column;gap:4px;"><label style="font-size:11px;font-weight:600;color:#5e6778;text-transform:uppercase;">Password *</label><input type="text" name="password" placeholder="Enter password" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;font-size:12px;"></div>' +
    '<div style="display:flex;flex-direction:column;gap:4px;"><label style="font-size:11px;font-weight:600;color:#5e6778;text-transform:uppercase;">MFA Enabled</label><select name="mfa_enabled" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;font-size:12px;"><option value="0">Disabled</option><option value="1">Enabled</option></select></div>' +
    '</div>' +
    '<div id="umCreateAlert" style="margin-top:12px;"></div>' +
    '<div style="display:flex;gap:12px;justify-content:flex-end;margin-top:16px;padding-top:12px;border-top:1px solid #eef0f4;">' +
    '<button type="button" id="umSaveCreateBtn" style="padding:8px 20px;background:#f47217;color:white;border:none;border-radius:4px;font-weight:600;cursor:pointer;font-size:13px;">Save</button>' +
    '<button type="button" id="umCancelCreateBtn" style="padding:8px 20px;background:#ffffff;color:#1a1d23;border:1px solid #d1d5db;border-radius:4px;font-weight:600;cursor:pointer;font-size:13px;">Cancel</button>' +
    '</div></form></div></div>';

  document.getElementById("umCancelCreateBtn").addEventListener("click", function() { renderUserManagementView(); });
  document.getElementById("umSaveCreateBtn").addEventListener("click", function() {
    var form = document.getElementById("umCreateForm");
    if (!form) return;
    var formData = {};
    var inputs = form.querySelectorAll("input, select");
    inputs.forEach(function(inp) {
      var name = inp.getAttribute("name");
      if (!name) return;
      formData[name] = inp.value;
    });

    if (!formData.name || !formData.email || !formData.role || !formData.password || !formData.user_type || !formData.status) {
      var alertEl = document.getElementById("umCreateAlert");
      if (alertEl) alertEl.innerHTML = '<div style="padding:10px 14px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:13px;"><i class="fas fa-exclamation-circle" style="margin-right:6px;"></i>Please fill in all required fields.</div>';
      return;
    }

    var userEmail = sessionStorage.getItem("nct_user_email") || localStorage.getItem("nct_user_email") || "";

    fetch("/api/admin/users", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        email: userEmail,
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile || "",
        role: formData.role,
        user_type: formData.user_type,
        password: formData.password,
        status: formData.status,
        mfa_enabled: parseInt(formData.mfa_enabled || "0"),
        mfa_secret: "",
        mfa_backup_codes: ""
      })
    })
    .then(function(res) { return res.json(); })
    .then(function(json) {
      if (json.success) {
        var alertEl = document.getElementById("umCreateAlert");
        if (alertEl) alertEl.innerHTML = '<div style="padding:10px 14px;background:#d1fae5;border:1px solid #10b981;border-radius:4px;color:#065f46;font-size:13px;font-weight:500;"><i class="fas fa-check-circle" style="margin-right:6px;"></i>' + (json.message || "User created successfully.") + '</div>';
        setTimeout(function() { renderUserManagementView(); }, 1000);
      } else {
        var alertEl = document.getElementById("umCreateAlert");
        if (alertEl) alertEl.innerHTML = '<div style="padding:10px 14px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:13px;"><i class="fas fa-exclamation-circle" style="margin-right:6px;"></i>' + (json.error || "Creation failed.") + '</div>';
      }
    })
    .catch(function(err) {
      var alertEl = document.getElementById("umCreateAlert");
      if (alertEl) alertEl.innerHTML = '<div style="padding:10px 14px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:13px;"><i class="fas fa-exclamation-circle" style="margin-right:6px;"></i>Error: ' + err.message + '</div>';
    });
  });
}

/* ==========================================================================
   HEADER USER DROPDOWN HANDLER
   ========================================================================== */
function bindHeaderUserDropdown() {
  var userBtn = document.getElementById("headerUserBtn");
  var dropdown = document.getElementById("headerDropdown");
  var userName = document.getElementById("headerUserName");
  var userAvatar = document.getElementById("headerUserAvatar");

  if (!userBtn || !dropdown) return;

  // Get user email and set display name
  var userEmail = sessionStorage.getItem("nct_user_email") || localStorage.getItem("nct_user_email") || "";
  var displayName = "User";
  if (userEmail && userEmail.indexOf("@") > -1) {
    var namePart = userEmail.split("@")[0];
    displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    // Create avatar initials from email
    var avatarText = userEmail.charAt(0).toUpperCase();
    if (userAvatar) userAvatar.textContent = avatarText;
  }
  if (userName) userName.textContent = displayName;

  // Toggle dropdown on button click
  userBtn.addEventListener("click", function(e) {
    e.stopPropagation();
    userBtn.classList.toggle("active");
    dropdown.classList.toggle("open");
  });

  // Handle dropdown item clicks
  var dropdownItems = dropdown.querySelectorAll(".header-dropdown-item");
  dropdownItems.forEach(function(item) {
    item.addEventListener("click", function(e) {
      e.stopPropagation();
      var action = item.getAttribute("data-action");
      if (action === "profile") {
        // Check if user is nct_admin - load read-only admin profile
        var userEmailForProfile = sessionStorage.getItem("nct_user_email") || localStorage.getItem("nct_user_email") || "";
        if (userEmailForProfile) {
          fetch("/api/auth/me?email=" + encodeURIComponent(userEmailForProfile))
            .then(function(res) { return res.json(); })
            .then(function(userData) {
              if (userData && userData.user_type_raw === "nct_admin") {
                activateSidebarItem("admin-profile");
                loadAdminProfileView();
              } else {
                activateSidebarItem("user-profile");
                loadUserProfileView();
              }
            })
            .catch(function() {
              activateSidebarItem("user-profile");
              loadUserProfileView();
            });
        } else {
          activateSidebarItem("user-profile");
          loadUserProfileView();
        }
      } else if (action === "logout") {
        handleLogout();
      }
      userBtn.classList.remove("active");
      dropdown.classList.remove("open");
    });
  });
}

/* ==========================================================================
   APP ENTRY POINT
   ========================================================================== */
// Initialize app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

// Close dropdown when clicking outside
document.addEventListener("click", function(e) {
  var userBtn = document.getElementById("headerUserBtn");
  var dropdown = document.getElementById("headerDropdown");
  if (userBtn && dropdown && dropdown.classList.contains("open")) {
    var isClickInside = userBtn.contains(e.target) || dropdown.contains(e.target);
    if (!isClickInside) {
      userBtn.classList.remove("active");
      dropdown.classList.remove("open");
    }
  }
});


/* ==========================================================================
   PROJECTS INFORMATION MODULE
   ========================================================================== */
var __projectsInfoState = {
  projects: [],
  currentFolder: null,
  view: "list",
};

function renderProjectsInfoView() {
  var panel = document.getElementById("view-media");
  if (!panel) return;
  activateSidebarItem("media");

  var root = document.getElementById("projects-info-root");
  if (!root) return;
  root.innerHTML = "";

  var projects = [];
  if (window.__allUnits && window.__allUnits.length) {
    var uniqueProjects = {};
    window.__allUnits.forEach(function(u) {
      if (u.Project && u.Project !== "N/A") {
        uniqueProjects[u.Project] = true;
      }
    });
    projects = Object.keys(uniqueProjects);
  }

  var hasNctInnosphere = false;
  projects.forEach(function(p) {
    if (p.toUpperCase().indexOf("INNOSPHERE") > -1) hasNctInnosphere = true;
  });
  if (!hasNctInnosphere) {
    projects.push("NCT INNOSPHERE");
  }

  var priority = {};
  PROJECT_DISPLAY_ORDER.forEach(function(name, idx) { priority[name] = idx; });
  projects.sort(function(a, b) {
    var aKey = (a || "").toString().trim().toUpperCase();
    var bKey = (b || "").toString().trim().toUpperCase();
    var aP = priority[aKey] !== undefined ? priority[aKey] : 999;
    var bP = priority[bKey] !== undefined ? priority[bKey] : 999;
    return aP - bP;
  });

  __projectsInfoState.projects = projects;
  __projectsInfoState.view = "list";
  __projectsInfoState.currentFolder = null;

  if (projects.length === 0) {
    var empty = document.createElement("div");
    empty.className = "card";
    empty.style.textAlign = "center";
    empty.style.padding = "40px";
    empty.innerHTML = '<div style="font-size:48px;color:#9ca3af;margin-bottom:12px;"><i class="fas fa-folder-open"></i></div><div style="font-size:15px;color:#5e6778;">No projects found.</div>';
    root.appendChild(empty);
    return;
  }

  projects.forEach(function(proj) {
    var row = document.createElement("div");
    row.className = "projects-info-row";
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "12px";
    row.style.padding = "12px 16px";
    row.style.marginBottom = "6px";
    row.style.background = "#ffffff";
    row.style.border = "1px solid #e5e7eb";
    row.style.borderLeft = "4px solid #f97316";
    row.style.borderRadius = "8px";
    row.style.cursor = "pointer";
    row.style.transition = "all 0.15s ease";

    row.innerHTML =
      '<div class="projects-info-icon" style="font-size:18px;color:#f97316;width:20px;text-align:center;"><i class="fas fa-folder"></i></div>' +
      '<div class="projects-info-name" style="font-size:14px;font-weight:600;color:#1a1d23;flex:1;">' + esc(proj) + '</div>';

    (function(p) {
      row.addEventListener("click", function() { openProjectsInfoFolder(p); });
    })(proj);

    row.addEventListener("mouseenter", function() {
      this.style.background = "#FFF3E8";
      this.style.borderColor = "#f97316";
    });
    row.addEventListener("mouseleave", function() {
      this.style.background = "#ffffff";
      this.style.borderColor = "#e5e7eb";
    });

    root.appendChild(row);
  });
}

function openProjectsInfoFolder(projectName) {
  __projectsInfoState.currentFolder = projectName;
  __projectsInfoState.view = "folder";

  var root = document.getElementById("projects-info-root");
  var container = document.createElement("div");
  container.className = "gallery-container";

  var folderName = projectName;
  if (projectName === "NCT SMART INDUSTRIAL PARK KM1" || projectName === "NSIP") {
    folderName = "NSIP";
  } else if (projectName === "NCT INNOSPHERE") {
    folderName = "NCT INNOSPHERE";
  }

  var header = document.createElement("div");
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.gap = "10px";
  header.style.marginBottom = "16px";

  var backBtn = document.createElement("button");
  backBtn.className = "gallery-back-btn";
  backBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Back';
  backBtn.style.padding = "8px 16px";
  backBtn.style.fontSize = "13px";
  backBtn.style.fontWeight = "600";
  backBtn.style.border = "1px solid #e5e7eb";
  backBtn.style.borderRadius = "6px";
  backBtn.style.background = "#ffffff";
  backBtn.style.cursor = "pointer";
  backBtn.addEventListener("click", function() {
    __projectsInfoState.view = "list";
    __projectsInfoState.currentFolder = null;
    renderProjectsInfoView();
  });
  header.appendChild(backBtn);

  var title = document.createElement("h2");
  title.style.fontSize = "18px";
  title.style.fontWeight = "700";
  title.style.color = "#0f2042";
  title.style.margin = "0";
  title.textContent = projectName;
  header.appendChild(title);

  container.appendChild(header);

  var loadingMsg = document.createElement("div");
  loadingMsg.className = "card";
  loadingMsg.style.textAlign = "center";
  loadingMsg.style.padding = "60px 20px";
  loadingMsg.innerHTML =
    '<div style="font-size:48px;color:#9ca3af;margin-bottom:12px;"><i class="fas fa-spinner fa-spin"></i></div>' +
    '<h3 style="font-size:18px;color:#1a1d23;margin-bottom:8px;">Loading...</h3>' +
    '<p style="font-size:14px;color:#5e6778;">Fetching project images.</p>';
  container.appendChild(loadingMsg);

  root.innerHTML = "";
  root.appendChild(container);

  fetch("/api/gallery/images?path=" + encodeURIComponent(folderName))
    .then(function(res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
    .then(function(images) {
      root.innerHTML = "";
      root.appendChild(container);
      if (loadingMsg.parentNode) loadingMsg.parentNode.removeChild(loadingMsg);

      if (!Array.isArray(images) || images.length === 0) {
        var emptyMsg = document.createElement("div");
        emptyMsg.className = "card";
        emptyMsg.style.textAlign = "center";
        emptyMsg.style.padding = "60px 20px";
        emptyMsg.innerHTML =
          '<div style="font-size:48px;color:#9ca3af;margin-bottom:12px;"><i class="fas fa-folder-open"></i></div>' +
          '<h3 style="font-size:18px;color:#1a1d23;margin-bottom:8px;">Empty Folder</h3>' +
          '<p style="font-size:14px;color:#5e6778;">No project information uploaded yet.</p>';
        container.appendChild(emptyMsg);
        return;
      }

      var grid = document.createElement("div");
      grid.className = "file-explorer-grid";
      grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;padding:4px 0;";

      images.forEach(function(img) {
        var item = document.createElement("div");
        item.style.cssText = "background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:10px;cursor:pointer;transition:all 0.15s ease;box-shadow:0 1px 3px rgba(0,0,0,0.04);";

        var thumbnail = document.createElement("img");
        thumbnail.src = img.url;
        thumbnail.alt = img.filename;
        thumbnail.loading = "lazy";
        thumbnail.style.cssText = "width:100%;height:140px;object-fit:cover;border-radius:6px;display:block;margin-bottom:8px;background:#f4f6fa;";

        var filename = document.createElement("div");
        filename.style.cssText = "font-size:12px;font-weight:600;color:#1a1d23;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
        filename.textContent = img.filename;

        item.appendChild(thumbnail);
        item.appendChild(filename);

        item.addEventListener("mouseenter", function() {
          this.style.background = "#FFF3E8";
          this.style.borderColor = "#f97316";
        });
        item.addEventListener("mouseleave", function() {
          this.style.background = "#ffffff";
          this.style.borderColor = "#e5e7eb";
          this.style.transform = "translateY(0)";
          this.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
        });

        item.addEventListener("contextmenu", function(e) {
          e.preventDefault();
          showImageContextMenu(e, img.url, img.filename);
        });

        item.addEventListener("dblclick", function() { openImageModal(img.url, img.filename); });

        grid.appendChild(item);
      });
      container.appendChild(grid);
    })
    .catch(function(err) {
      console.error("Failed to load gallery images:", err);
      root.innerHTML = "";
      container.innerHTML =
        '<div style="text-align:center;padding:60px 20px;">' +
        '  <div style="font-size:48px;color:#dc2626;margin-bottom:12px;"><i class="fas fa-exclamation-circle"></i></div>' +
        '  <h3 style="font-size:18px;color:#1a1d23;margin-bottom:8px;">Error Loading Images</h3>' +
        '  <p style="font-size:14px;color:#5e6778;">Failed to load project images.</p>' +
        '</div>';
      root.appendChild(container);
    });
}

function showImageContextMenu(event, imageUrl, filename) {
  var existing = document.getElementById("image-context-menu");
  if (existing) existing.parentNode.removeChild(existing);

  var menu = document.createElement("div");
  menu.id = "image-context-menu";
  menu.style.cssText = "position:fixed;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.15);z-index:99999;min-width:180px;padding:6px 0;";

  var viewItem = document.createElement("div");
  viewItem.style.cssText = "padding:10px 16px;cursor:pointer;font-size:13px;color:#1a1d23;display:flex;align-items:center;gap:10px;transition:background 0.1s;";
  viewItem.innerHTML = '<i class="fas fa-eye" style="color:#f97316;width:16px;"></i> View';
  viewItem.addEventListener("mouseenter", function() { this.style.background = "#f4f6fa"; });
  viewItem.addEventListener("mouseleave", function() { this.style.background = "transparent"; });
  viewItem.addEventListener("click", function() {
    openImageModal(imageUrl, filename);
    if (menu.parentNode) menu.parentNode.removeChild(menu);
  });

  var downloadItem = document.createElement("div");
  downloadItem.style.cssText = "padding:10px 16px;cursor:pointer;font-size:13px;color:#1a1d23;display:flex;align-items:center;gap:10px;transition:background 0.1s;";
  downloadItem.innerHTML = '<i class="fas fa-download" style="color:#f97316;width:16px;"></i> Download';
  downloadItem.addEventListener("mouseenter", function() { this.style.background = "#f4f6fa"; });
  downloadItem.addEventListener("mouseleave", function() { this.style.background = "transparent"; });
  downloadItem.addEventListener("click", function() {
    downloadImage(imageUrl, filename);
    if (menu.parentNode) menu.parentNode.removeChild(menu);
  });

  menu.appendChild(viewItem);
  menu.appendChild(downloadItem);
  document.body.appendChild(menu);

  var x = event.clientX || event.pageX;
  var y = event.clientY || event.pageY;
  menu.style.left = x + "px";
  menu.style.top = y + "px";

  setTimeout(function() {
    document.addEventListener("click", function closeMenu() {
      if (menu.parentNode) menu.parentNode.removeChild(menu);
      document.removeEventListener("click", closeMenu);
    });
  }, 0);
}

function openImageModal(imageUrl, filename) {
  var existing = document.getElementById("image-viewer-modal");
  if (existing) existing.parentNode.removeChild(existing);

  var modal = document.createElement("div");
  modal.id = "image-viewer-modal";
  modal.style.cssText = "position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px;box-sizing:border-box;";

  modal.innerHTML =
    '<div style="position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:0;" id="image-modal-overlay"></div>' +
    '<div style="position:relative;z-index:1;max-width:90vw;max-height:90vh;display:flex;flex-direction:column;align-items:center;">' +
    '  <img src="' + imageUrl + '" alt="' + esc(filename) + '" style="max-width:100%;max-height:85vh;object-fit:contain;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,0.5);">' +
    '  <button id="image-modal-close" style="position:absolute;top:-40px;right:0;background:rgba(255,255,255,0.2);color:white;border:none;font-size:28px;width:44px;height:44px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);">&times;</button>' +
    '</div>';

  document.body.appendChild(modal);

  document.getElementById("image-modal-close").addEventListener("click", function() {
    if (modal.parentNode) modal.parentNode.removeChild(modal);
  });
  document.getElementById("image-modal-overlay").addEventListener("click", function() {
    if (modal.parentNode) modal.parentNode.removeChild(modal);
  });

  function escHandler(e) {
    if (e.key === "Escape") {
      if (modal.parentNode) modal.parentNode.removeChild(modal);
      document.removeEventListener("keydown", escHandler);
    }
  }
  document.addEventListener("keydown", escHandler);
}

function downloadImage(url, filename) {
  var link = document.createElement("a");
  link.href = url;
  link.download = filename || "image";
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function renderMediaView() {
  fetchAllUnitsCached().then(function() {
    renderProjectsInfoView();
  });
}

/* ==========================================================================
    USER PROFILE MODULE
    ========================================================================== */

function __getUserEmail() {
  return sessionStorage.getItem("nct_user_email") || localStorage.getItem("nct_user_email") || "";
}

function loadAdminProfileView() {
  var panel = document.getElementById("view-admin-profile");
  if (!panel) return;

  var userEmail = __getUserEmail();
  
  panel.innerHTML =
    '<div class="page-header">' +
    '  <div><h1>User Profile</h1><div class="header-sub">NCT Admin Account</div></div>' +
    '</div>' +
    '<div class="card" style="max-width:800px;margin:0 auto;">' +
    '  <div class="card-body" style="padding:32px;">' +
    '    <div style="display:flex;flex-direction:column;gap:20px;">' +
    '      <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 0;border-bottom:1px solid #e5e7eb;">' +
    '        <label style="font-size:13px;font-weight:600;color:#5e6778;text-transform:uppercase;letter-spacing:0.3px;">Name</label>' +
    '        <div style="font-size:14px;color:#1a1d23;font-weight:500;" id="adminProfileName">-</div>' +
    '      </div>' +
    '      <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 0;border-bottom:1px solid #e5e7eb;">' +
    '        <label style="font-size:13px;font-weight:600;color:#5e6778;text-transform:uppercase;letter-spacing:0.3px;">Username</label>' +
    '        <div style="font-size:14px;color:#1a1d23;font-weight:500;" id="adminProfileUsername">-</div>' +
    '      </div>' +
    '      <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 0;border-bottom:1px solid #e5e7eb;">' +
    '        <label style="font-size:13px;font-weight:600;color:#5e6778;text-transform:uppercase;letter-spacing:0.3px;">Email</label>' +
    '        <div style="font-size:14px;color:#1a1d23;font-weight:500;" id="adminProfileEmail">-</div>' +
    '      </div>' +
    '      <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 0;border-bottom:1px solid #e5e7eb;">' +
    '        <label style="font-size:13px;font-weight:600;color:#5e6778;text-transform:uppercase;letter-spacing:0.3px;">Role</label>' +
    '        <div style="font-size:14px;color:#1a1d23;font-weight:500;">NCT Admin</div>' +
    '      </div>' +
    '      <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 0;border-bottom:1px solid #e5e7eb;">' +
    '        <label style="font-size:13px;font-weight:600;color:#5e6778;text-transform:uppercase;letter-spacing:0.3px;">User Type</label>' +
    '        <div style="font-size:14px;color:#1a1d23;font-weight:500;">nct_admin</div>' +
    '      </div>' +
    '      <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 0;border-bottom:1px solid #e5e7eb;">' +
    '        <label style="font-size:13px;font-weight:600;color:#5e6778;text-transform:uppercase;letter-spacing:0.3px;">MFA Status</label>' +
    '        <div style="font-size:14px;font-weight:600;" id="adminProfileMfa">Loading...</div>' +
    '      </div>' +
    '      <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 0;">' +
    '        <label style="font-size:13px;font-weight:600;color:#5e6778;text-transform:uppercase;letter-spacing:0.3px;">Account Status</label>' +
    '        <div style="font-size:14px;color:#16a34a;font-weight:600;" id="adminProfileStatus">-</div>' +
    '      </div>' +
    '    </div>' +
    '    <div style="margin-top:32px;padding-top:24px;border-top:2px solid #e5e7eb;display:flex;justify-content:center;">' +
    '      <button id="adminProfileBackBtn" style="padding:10px 32px;background:#f47217;color:white;border:none;border-radius:4px;font-weight:600;cursor:pointer;font-size:14px;">Back to Home</button>' +
    '    </div>' +
    '  </div>' +
    '</div>';

  // Load user data
  if (!userEmail) {
    var loginData = localStorage.getItem("nct_login_data");
    if (loginData) {
      try {
        var parsed = JSON.parse(loginData);
        userEmail = parsed.user || "";
        if (userEmail) {
          sessionStorage.setItem("nct_user_email", userEmail);
          localStorage.setItem("nct_user_email", userEmail);
        }
      } catch(e) {}
    }
  }

  if (!userEmail) {
    panel.innerHTML =
      '<div class="page-header">' +
      '  <div><h1>User Profile</h1><div class="header-sub">NCT Admin Account</div></div>' +
      '</div>' +
      '<div class="card" style="max-width:800px;margin:0 auto;">' +
      '  <div class="card-body" style="text-align:center;padding:60px 20px;">' +
      '    <i class="fas fa-exclamation-circle" style="font-size:32px;color:#dc2626;margin-bottom:12px;display:block;"></i>' +
      '    <p style="color:#5e6778;font-size:14px;">Unable to load profile. Please log in again.</p>' +
      '  </div>' +
      '</div>';
    return;
  }

  // Fetch user profile and MFA status
  Promise.all([
    fetch("/api/auth/me?email=" + encodeURIComponent(userEmail)).then(function(res) { return res.json(); }),
    fetch("/api/auth/mfa/status?email=" + encodeURIComponent(userEmail)).then(function(res) { return res.json(); })
  ])
  .then(function(results) {
    var userData = results[0];
    var mfaData = results[1];
    
    if (!userData || userData.error) throw new Error(userData.error || "Failed to load profile");

    // Populate static fields
    var nameEl = document.getElementById("adminProfileName");
    var usernameEl = document.getElementById("adminProfileUsername");
    var emailEl = document.getElementById("adminProfileEmail");
    var statusEl = document.getElementById("adminProfileStatus");
    var mfaEl = document.getElementById("adminProfileMfa");

    if (nameEl) nameEl.textContent = userData.name || "-";
    if (usernameEl) usernameEl.textContent = userData.email ? userData.email.split("@")[0] : "-";
    if (emailEl) emailEl.textContent = userData.email || "-";
    if (statusEl) statusEl.textContent = userData.status || "Active";
    if (mfaEl) {
      mfaEl.textContent = mfaData && mfaData.mfa_enabled ? "Enabled" : "Disabled";
      mfaEl.style.color = mfaData && mfaData.mfa_enabled ? "#16a34a" : "#dc2626";
    }
  })
  .catch(function(err) {
    console.error("Failed to load admin profile:", err);
    panel.innerHTML =
      '<div class="page-header">' +
      '  <div><h1>User Profile</h1><div class="header-sub">NCT Admin Account</div></div>' +
      '</div>' +
      '<div class="card" style="max-width:800px;margin:0 auto;">' +
      '  <div class="card-body" style="text-align:center;padding:60px 20px;">' +
      '    <i class="fas fa-exclamation-circle" style="font-size:32px;color:#dc2626;margin-bottom:12px;display:block;"></i>' +
      '    <p style="color:#5e6778;font-size:14px;">Failed to load profile. Please try again.</p>' +
      '  </div>' +
      '</div>';
  });

  // Bind back button
  var backBtn = document.getElementById("adminProfileBackBtn");
  if (backBtn) {
    backBtn.addEventListener("click", function() {
      activateSidebarItem("home");
      renderHomeDashboard();
    });
  }
}

function loadUserProfileView() {
  var panel = document.getElementById("view-user-profile");
  if (!panel) return;

  var userEmail = __getUserEmail();

  panel.innerHTML =
    '<div class="page-header">' +
    '  <div><h1>User Profile</h1><div class="header-sub">Manage your account settings</div></div>' +
    '</div>' +
    '<div class="card" style="max-width:800px;margin:0 auto;">' +
    '  <div class="card-body" style="text-align:center;padding:60px 20px;">' +
    '    <i class="fas fa-spinner fa-spin" style="font-size:32px;color:#f47217;margin-bottom:12px;display:block;"></i>' +
    '    <p style="color:#5e6778;font-size:14px;">Loading profile...</p>' +
    '  </div>' +
    '</div>';

  if (!userEmail) {
    var loginData = localStorage.getItem("nct_login_data");
    if (loginData) {
      try {
        var parsed = JSON.parse(loginData);
        userEmail = parsed.user || "";
        if (userEmail) {
          sessionStorage.setItem("nct_user_email", userEmail);
          localStorage.setItem("nct_user_email", userEmail);
        }
      } catch(e) {}
    }
  }

  if (!userEmail) {
    panel.innerHTML =
      '<div class="page-header">' +
      '  <div><h1>User Profile</h1><div class="header-sub">Manage your account settings</div></div>' +
      '</div>' +
      '<div class="card" style="max-width:800px;margin:0 auto;">' +
      '  <div class="card-body" style="text-align:center;padding:60px 20px;">' +
      '    <i class="fas fa-exclamation-circle" style="font-size:32px;color:#dc2626;margin-bottom:12px;display:block;"></i>' +
      '    <p style="color:#5e6778;font-size:14px;">Unable to load profile. Please log in again.</p>' +
      '  </div>' +
      '</div>';
    return;
  }

  fetch("/api/auth/me?email=" + encodeURIComponent(userEmail))
    .then(function(res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
    .then(function(userData) {
      if (!userData || userData.error) throw new Error(userData.error || "Failed to load user profile");

      panel.innerHTML =
        '<div class="page-header">' +
        '  <div><h1>User Profile</h1><div class="header-sub">Manage your account settings</div></div>' +
        '</div>' +
        '<div class="card" style="max-width:800px;margin:0 auto;">' +
        '  <div class="card-header"><span class="card-title"><i class="fas fa-user"></i> Profile Information</span></div>' +
        '  <div class="card-body">' +
        '    <div id="profileAlert"></div>' +
        '    <form id="profileForm" style="display:flex;flex-direction:column;gap:20px;">' +
        '      <div>' +
        '        <label for="profileName" style="display:block;font-size:13px;font-weight:600;color:#1a1d23;margin-bottom:6px;">Name</label>' +
        '        <input type="text" id="profileName" value="' + esc(userData.name || "") + '" style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:4px;font-size:14px;box-sizing:border-box;">' +
        '      </div>' +
        '      <div>' +
        '        <label for="profileEmail" style="display:block;font-size:13px;font-weight:600;color:#1a1d23;margin-bottom:6px;">Email</label>' +
        '        <input type="email" id="profileEmail" value="' + esc(userData.email || "") + '" style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:4px;font-size:14px;box-sizing:border-box;">' +
        '      </div>' +
        '      <div>' +
        '        <label for="profileMobile" style="display:block;font-size:13px;font-weight:600;color:#1a1d23;margin-bottom:6px;">Mobile Number</label>' +
        '        <input type="tel" id="profileMobile" value="' + esc(userData.mobile || "") + '" style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:4px;font-size:14px;box-sizing:border-box;">' +
        '      </div>' +
        '      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">' +
        '        <div>' +
        '          <label style="display:block;font-size:13px;font-weight:600;color:#5e6778;margin-bottom:6px;">Role</label>' +
        '          <div style="padding:10px 12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:4px;font-size:14px;color:#1a1d23;">' + esc(userData.role || "") + '</div>' +
        '        </div>' +
        '        <div>' +
        '          <label style="display:block;font-size:13px;font-weight:600;color:#5e6778;margin-bottom:6px;">User Type</label>' +
        '          <div style="padding:10px 12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:4px;font-size:14px;color:#1a1d23;">' + esc(userData.user_type || "") + '</div>' +
        '        </div>' +
        '      </div>' +
        '      <div>' +
        '        <label style="display:block;font-size:13px;font-weight:600;color:#5e6778;margin-bottom:6px;">Status</label>' +
        '        <div style="padding:10px 12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:4px;font-size:14px;color:#16a34a;font-weight:600;">' + esc(userData.status || "Active") + '</div>' +
        '      </div>' +
        '      <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:8px;">' +
        '        <button type="button" id="profileSaveBtn" class="btn-save-profile" style="padding:10px 24px;background:#f47217;color:white;border:none;border-radius:4px;font-weight:600;cursor:pointer;font-size:14px;">Save</button>' +
        '        <button type="button" id="profileCloseBtn" class="btn-close-profile" style="padding:10px 24px;background:#ffffff;color:#1a1d23;border:1px solid #d1d5db;border-radius:4px;font-weight:600;cursor:pointer;font-size:14px;">Close</button>' +
        '      </div>' +
        '    </form>' +
        '  </div>' +
        '</div>' +
        '<div class="card" style="max-width:800px;margin:20px auto 0;">' +
        '  <div class="card-header"><span class="card-title"><i class="fas fa-lock"></i> Change Password</span></div>' +
        '  <div class="card-body" style="text-align:center;padding:40px 20px;">' +
        '    <p style="color:#5e6778;font-size:14px;margin-bottom:20px;">For security, password changes require identity verification.</p>' +
        '    <button type="button" id="goToSecurityBtn" style="padding:12px 32px;background:#f47217;color:white;border:none;border-radius:4px;font-weight:600;cursor:pointer;font-size:14px;">Go to Security</button>' +
        '  </div>' +
        '</div>' +
        '<div class="card" style="max-width:800px;margin:20px auto 0;">' +
        '  <div class="card-header"><span class="card-title"><i class="fas fa-shield-alt"></i> Multi-Factor Authentication</span></div>' +
        '  <div class="card-body">' +
        '    <div id="mfaAlert"></div>' +
        '    <div id="mfaContent">' +
        '      <p style="color:#5e6778;font-size:14px;margin-bottom:20px;">Add an extra layer of security to your account using Time-based One-Time Password (TOTP).</p>' +
        '      <div id="mfaStatusLoading"><i class="fas fa-spinner fa-spin"></i> Loading MFA status...</div>' +
        '      <div id="mfaActions" style="display:none;">' +
        '        <div style="display:flex;gap:12px;">' +
        '          <button type="button" id="enableMfaBtn" class="btn-enable-mfa" style="padding:10px 24px;background:#f47217;color:white;border:none;border-radius:4px;font-weight:600;cursor:pointer;font-size:14px;">Enable MFA</button>' +
        '          <button type="button" id="disableMfaBtn" class="btn-disable-mfa" style="padding:10px 24px;background:#dc2626;color:white;border:none;border-radius:4px;font-weight:600;cursor:pointer;font-size:14px;display:none;">Disable MFA</button>' +
        '        </div>' +
        '      </div>' +
        '      <div id="mfaSetupContent" style="margin-top:20px;display:none;">' +
        '        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:16px;">' +
        '          <h4 style="font-size:14px;font-weight:600;color:#1a1d23;margin-bottom:12px;">Scan QR Code</h4>' +
        '          <p style="font-size:13px;color:#5e6778;margin-bottom:12px;">Scan this QR code with Google Authenticator or any TOTP app.</p>' +
        '          <div style="text-align:center;margin-bottom:16px;">' +
        '            <div id="mfaQrCode" style="display:inline-block;padding:16px;background:#ffffff;border:1px solid #d1d5db;border-radius:4px;"></div>' +
        '          </div>' +
        '          <div style="display:flex;flex-direction:column;gap:12px;">' +
        '            <input type="text" id="mfaVerifyCode" placeholder="Enter 6-digit verification code" maxlength="6" style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:4px;font-size:14px;box-sizing:border-box;text-align:center;letter-spacing:4px;">' +
        '            <button type="button" id="verifyMfaBtn" class="btn-verify-mfa" style="padding:10px 24px;background:#f47217;color:white;border:none;border-radius:4px;font-weight:600;cursor:pointer;font-size:14px;">Verify & Enable MFA</button>' +
        '          </div>' +
        '        </div>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '</div>';

      // Load MFA status from database
      loadMfaStatusFromDB(userEmail, panel);

      var saveBtn = panel.querySelector("#profileSaveBtn");
      if (saveBtn) {
        saveBtn.addEventListener("click", function() {
          var alertDiv = document.getElementById("profileAlert");
          if (alertDiv) {
            alertDiv.innerHTML = '<div class="alert alert-success" style="padding:12px 16px;background:#d1fae5;border:1px solid #10b981;border-radius:4px;color:#065f46;font-size:14px;"><i class="fas fa-check-circle" style="margin-right:8px;"></i>Profile updated successfully.</div>';
            setTimeout(function() { alertDiv.innerHTML = ""; }, 3000);
          }
        });
      }

      var closeBtn = panel.querySelector("#profileCloseBtn");
      if (closeBtn) {
        closeBtn.addEventListener("click", function() {
          activateSidebarItem("home");
          renderHomeDashboard();
        });
      }

      var goToSecurityBtn = panel.querySelector("#goToSecurityBtn");
      if (goToSecurityBtn) {
        goToSecurityBtn.addEventListener("click", function() {
          activateSidebarItem("security");
          loadSecurityView();
        });
      }

      var pwForm = panel.querySelector("#passwordForm");
      if (pwForm) {
        pwForm.addEventListener("submit", function(e) {
          e.preventDefault();
          var newPass = document.getElementById("newPassword").value;
          var confirm = document.getElementById("confirmPassword").value;
          var alertDiv = document.getElementById("passwordAlert");
          var userEmail = __getUserEmail();

          if (!userEmail) {
            alertDiv.innerHTML = '<div class="alert alert-danger" style="padding:12px 16px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:14px;"><i class="fas fa-exclamation-circle" style="margin-right:8px;"></i>Please log in again.</div>';
            return;
          }

          if (newPass || confirm) {
            var errors = validatePassword(newPass);
            if (errors.length > 0) {
              alertDiv.innerHTML = '<div class="alert alert-danger" style="padding:12px 16px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:14px;"><i class="fas fa-exclamation-circle" style="margin-right:8px;"></i>' + errors.join("<br>") + '</div>';
              return;
            }
            if (newPass !== confirm) {
              alertDiv.innerHTML = '<div class="alert alert-danger" style="padding:12px 16px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:14px;"><i class="fas fa-exclamation-circle" style="margin-right:8px;"></i>Passwords do not match.</div>';
              return;
            }
          }

          fetch("/api/auth/change-password", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({email: userEmail, new_password: newPass})
          })
          .then(function(res) { return res.json(); })
          .then(function(data) {
            if (data.success) {
              alertDiv.innerHTML = '<div class="alert alert-success" style="padding:12px 16px;background:#d1fae5;border:1px solid #10b981;border-radius:4px;color:#065f46;font-size:14px;"><i class="fas fa-check-circle" style="margin-right:8px;"></i>Password updated successfully.</div>';
              document.getElementById("newPassword").value = "";
              document.getElementById("confirmPassword").value = "";
            } else {
              alertDiv.innerHTML = '<div class="alert alert-danger" style="padding:12px 16px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:14px;"><i class="fas fa-exclamation-circle" style="margin-right:8px;"></i>' + (data.message || "Failed to update password.") + '</div>';
            }
            setTimeout(function() { alertDiv.innerHTML = ""; }, 4000);
          })
          .catch(function(err) {
            alertDiv.innerHTML = '<div class="alert alert-danger" style="padding:12px 16px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:14px;"><i class="fas fa-exclamation-circle" style="margin-right:8px;"></i>Error: ' + err.message + '</div>';
          });
        });
      }

      // Password toggle buttons
      document.querySelectorAll(".pw-toggle").forEach(function(btn) {
        btn.addEventListener("click", function() {
          var targetId = this.getAttribute("data-target");
          var input = document.getElementById(targetId);
          var icon = this.querySelector("i");
          if (!input || !icon) return;
          if (input.type === "password") {
            input.type = "text";
            icon.className = "fas fa-eye";
          } else {
            input.type = "password";
            icon.className = "fas fa-eye-slash";
          }
        });
      });
    })
    .catch(function(err) {
      console.error("Failed to load user profile:", err);
      panel.innerHTML =
        '<div class="page-header">' +
        '  <div><h1>User Profile</h1><div class="header-sub">Manage your account settings</div></div>' +
        '</div>' +
        '<div class="card" style="max-width:800px;margin:0 auto;">' +
        '  <div class="card-body" style="text-align:center;padding:60px 20px;">' +
        '    <i class="fas fa-exclamation-circle" style="font-size:32px;color:#dc2626;margin-bottom:12px;display:block;"></i>' +
        '    <p style="color:#5e6778;font-size:14px;">Failed to load profile. Please try again.</p>' +
        '  </div>' +
        '</div>';
    });
}


function loadMfaStatusFromDB(userEmail, panel) {
  var statusEl = document.getElementById("mfaStatusLoading");
  var actionsEl = document.getElementById("mfaActions");
  if (!statusEl || !actionsEl) return;

  fetch("/api/auth/mfa/status?email=" + encodeURIComponent(userEmail))
    .then(function(res) { return res.json(); })
    .then(function(data) {
      statusEl.style.display = "none";
      actionsEl.style.display = "block";

      var enableBtn = document.getElementById("enableMfaBtn");
      var disableBtn = document.getElementById("disableMfaBtn");

      if (data.mfa_enabled) {
        if (enableBtn) enableBtn.style.display = "none";
        if (disableBtn) disableBtn.style.display = "inline-block";
      } else {
        if (enableBtn) enableBtn.style.display = "inline-block";
        if (disableBtn) disableBtn.style.display = "none";
      }

      // Bind enable button
      if (enableBtn) {
        enableBtn.onclick = function() {
          // Generate secret from server
          fetch("/api/auth/mfa/generate-secret?email=" + encodeURIComponent(userEmail))
            .then(function(res) { return res.json(); })
            .then(function(genData) {
              if (!genData.success) throw new Error("Failed to generate secret");

              var secret = genData.secret;
              var mfaSetup = document.getElementById("mfaSetupContent");
              if (mfaSetup) mfaSetup.style.display = "block";
              enableBtn.style.display = "none";

              var qrContainer = document.getElementById("mfaQrCode");
              if (qrContainer) {
                var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent(genData.uri);
                qrContainer.innerHTML = '<img src="' + qrUrl + '" alt="MFA QR Code" style="display:block;max-width:200px;">';
              }

              // Bind verify button
              var verifyBtn = document.getElementById("verifyMfaBtn");
              if (verifyBtn) {
                verifyBtn.onclick = function() {
                  var code = document.getElementById("mfaVerifyCode").value.trim();
                  var alertDiv = document.getElementById("mfaAlert");
                  if (!alertDiv) return;

                  if (code.length !== 6 || !/^\d+$/.test(code)) {
                    alertDiv.innerHTML = '<div class="alert alert-danger" style="padding:12px 16px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:14px;"><i class="fas fa-exclamation-circle" style="margin-right:8px;"></i>Please enter a valid 6-digit code.</div>';
                    return;
                  }

                  // First save the secret to DB
                  fetch("/api/auth/mfa/setup", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({email: userEmail, secret: secret})
                  })
                  .then(function(res) { return res.json(); })
                  .then(function(setupData) {
                    if (!setupData.success) throw new Error(setupData.message);

                    // Now verify the code
                    return fetch("/api/auth/mfa/verify-setup", {
                      method: "POST",
                      headers: {"Content-Type": "application/json"},
                      body: JSON.stringify({email: userEmail, code: code})
                    });
                  })
                  .then(function(res) { return res.json(); })
                  .then(function(verifyData) {
                    if (verifyData.success) {
                      alertDiv.innerHTML = '<div class="alert alert-success" style="padding:12px 16px;background:#d1fae5;border:1px solid #10b981;border-radius:4px;color:#065f46;font-size:14px;"><i class="fas fa-check-circle" style="margin-right:8px;"></i>MFA enabled successfully.</div>';
                      var mfaSetup = document.getElementById("mfaSetupContent");
                      if (mfaSetup) mfaSetup.style.display = "none";
                      if (disableBtn) disableBtn.style.display = "inline-block";
                      setTimeout(function() { alertDiv.innerHTML = ""; }, 3000);
                    } else {
                      alertDiv.innerHTML = '<div class="alert alert-danger" style="padding:12px 16px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:14px;"><i class="fas fa-exclamation-circle" style="margin-right:8px;"></i>' + (verifyData.message || "Invalid code. Please try again.") + '</div>';
                    }
                  })
                  .catch(function(err) {
                    alertDiv.innerHTML = '<div class="alert alert-danger" style="padding:12px 16px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:14px;"><i class="fas fa-exclamation-circle" style="margin-right:8px;"></i>Error: ' + err.message + '</div>';
                  });
                };
              }
            })
            .catch(function(err) {
              var alertDiv = document.getElementById("mfaAlert");
              if (alertDiv) {
                alertDiv.innerHTML = '<div class="alert alert-danger" style="padding:12px 16px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:14px;"><i class="fas fa-exclamation-circle" style="margin-right:8px;"></i>Error: ' + err.message + '</div>';
              }
            });
        };
      }

      // Bind disable button
      if (disableBtn) {
        disableBtn.onclick = function() {
          var alertDiv = document.getElementById("mfaAlert");
          if (!alertDiv) return;

          fetch("/api/auth/mfa/disable", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({email: userEmail})
          })
          .then(function(res) { return res.json(); })
          .then(function(data) {
            if (data.success) {
              alertDiv.innerHTML = '<div class="alert alert-success" style="padding:12px 16px;background:#d1fae5;border:1px solid #10b981;border-radius:4px;color:#065f46;font-size:14px;"><i class="fas fa-check-circle" style="margin-right:8px;"></i>MFA disabled successfully.</div>';
              var enableBtn = document.getElementById("enableMfaBtn");
              if (enableBtn) enableBtn.style.display = "inline-block";
              disableBtn.style.display = "none";
              setTimeout(function() { if (alertDiv) alertDiv.innerHTML = ""; }, 3000);
            } else {
              alertDiv.innerHTML = '<div class="alert alert-danger" style="padding:12px 16px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:14px;"><i class="fas fa-exclamation-circle" style="margin-right:8px;"></i>' + (data.message || "Failed to disable MFA.") + '</div>';
            }
          })
          .catch(function(err) {
            alertDiv.innerHTML = '<div class="alert alert-danger" style="padding:12px 16px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:14px;"><i class="fas fa-exclamation-circle" style="margin-right:8px;"></i>Error: ' + err.message + '</div>';
          });
        };
      }
    })
    .catch(function(err) {
      statusEl.textContent = "Failed to load MFA status.";
      console.error("MFA status error:", err);
    });
}

function validatePassword(password) {
  var errors = [];
  if (!password) { errors.push("Password is required."); return errors; }
  if (password.length < 8) errors.push("Password must be at least 8 characters long.");
  if (password.length > 12) errors.push("Password must not exceed 12 characters.");
  if (!/[A-Z]/.test(password)) errors.push("Password must contain at least one uppercase letter.");
  if (!/[a-z]/.test(password)) errors.push("Password must contain at least one lowercase letter.");
  if (!/[0-9]/.test(password)) errors.push("Password must contain at least one digit.");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("Password must contain at least one special character.");
  return errors;
}

/* ==========================================================================
    SECURITY PAGE
    ========================================================================== */
function loadSecurityView() {
  var panel = document.getElementById("view-security");
  if (!panel) return;
  var userEmail = __getUserEmail();
  
  panel.innerHTML =
    '<div class="page-header">' +
    '  <div><h1>Security</h1><div class="header-sub">Verify your identity before changing your password</div></div>' +
    '</div>' +
    '  <div class="card" style="max-width:600px;margin:0 auto;">' +
    '    <div class="card-body" style="padding:24px;">' +
    '      <form id="verifyPasswordForm" style="display:flex;flex-direction:column;gap:16px;">' +
    '        <div>' +
    '          <label for="currentPasswordVerify" style="display:block;font-size:13px;font-weight:600;color:#1a1d23;margin-bottom:6px;">Current Password</label>' +
    '          <div style="position:relative;">' +
    '            <input type="password" id="currentPasswordVerify" placeholder="Enter your current password" style="width:100%;padding:10px 40px 10px 12px;border:1px solid #d1d5db;border-radius:4px;font-size:14px;box-sizing:border-box;" autocomplete="current-password">' +
    '            <button type="button" class="pw-toggle" data-target="currentPasswordVerify" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;color:#5e6778;cursor:pointer;padding:4px;font-size:16px;line-height:1;" title="Show/Hide Password"><i class="fas fa-eye-slash"></i></button>' +
    '          </div>' +
    '        </div>' +
    '        <div id="verifyAlert"></div>' +
    '        <button type="submit" id="verifyIdentityBtn" style="padding:10px 24px;background:#f47217;color:white;border:none;border-radius:4px;font-weight:600;cursor:pointer;font-size:14px;">Verify Identity</button>' +
    '      </form>' +
    '      <div id="passwordChangeSection" style="display:none;margin-top:24px;padding-top:24px;border-top:2px solid #e5e7eb;">' +
    '        <h3 style="font-size:16px;font-weight:600;color:#1a1d23;margin-bottom:16px;">Change Password</h3>' +
    '        <form id="passwordForm" style="display:flex;flex-direction:column;gap:16px;">' +
    '          <div>' +
    '            <label for="newPassword" style="display:block;font-size:13px;font-weight:600;color:#1a1d23;margin-bottom:6px;">New Password</label>' +
    '            <div style="position:relative;">' +
    '              <input type="password" id="newPassword" placeholder="Enter new password" style="width:100%;padding:10px 40px 10px 12px;border:1px solid #d1d5db;border-radius:4px;font-size:14px;box-sizing:border-box;">' +
    '              <button type="button" class="pw-toggle" data-target="newPassword" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;color:#5e6778;cursor:pointer;padding:4px;font-size:16px;line-height:1;" title="Show/Hide Password"><i class="fas fa-eye-slash"></i></button>' +
    '            </div>' +
    '          </div>' +
    '          <div>' +
    '            <label for="confirmPassword" style="display:block;font-size:13px;font-weight:600;color:#1a1d23;margin-bottom:6px;">Confirm New Password</label>' +
    '            <div style="position:relative;">' +
    '              <input type="password" id="confirmPassword" placeholder="Confirm new password" style="width:100%;padding:10px 40px 10px 12px;border:1px solid #d1d5db;border-radius:4px;font-size:14px;box-sizing:border-box;">' +
    '              <button type="button" class="pw-toggle" data-target="confirmPassword" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;color:#5e6778;cursor:pointer;padding:4px;font-size:16px;line-height:1;" title="Show/Hide Password"><i class="fas fa-eye-slash"></i></button>' +
    '            </div>' +
    '          </div>' +
    '          <div id="passwordAlert"></div>' +
    '          <button type="submit" style="padding:10px 24px;background:#f47217;color:white;border:none;border-radius:4px;font-weight:600;cursor:pointer;font-size:14px;">Update Password</button>' +
    '        </form>' +
    '      </div>' +
    '    </div>' +
    '  </div>' +
    '</div>';

  // Bind verify password form
  var verifyForm = panel.querySelector("#verifyPasswordForm");
  if (verifyForm) {
    verifyForm.addEventListener("submit", function(e) {
      e.preventDefault();
      var currentPass = document.getElementById("currentPasswordVerify").value;
      var alertDiv = document.getElementById("verifyAlert");
      
      if (!currentPass) {
        alertDiv.innerHTML = '<div class="alert alert-danger" style="padding:12px 16px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:14px;"><i class="fas fa-exclamation-circle" style="margin-right:8px;"></i>Please enter your current password.</div>';
        return;
      }
      
      fetch("/api/auth/verify-password", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email: userEmail, password: currentPass})
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.success) {
          alertDiv.innerHTML = '<div class="alert alert-success" style="padding:12px 16px;background:#d1fae5;border:1px solid #10b981;border-radius:4px;color:#065f46;font-size:14px;"><i class="fas fa-check-circle" style="margin-right:8px;"></i>Identity verified. You can now change your password.</div>';
          document.getElementById("passwordChangeSection").style.display = "block";
          document.getElementById("verifyIdentityBtn").disabled = true;
          document.getElementById("verifyIdentityBtn").textContent = "Verified";
          document.getElementById("currentPasswordVerify").disabled = true;
        } else {
          alertDiv.innerHTML = '<div class="alert alert-danger" style="padding:12px 16px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:14px;"><i class="fas fa-exclamation-circle" style="margin-right:8px;"></i>' + (data.message || "Current password is incorrect.") + '</div>';
        }
      })
      .catch(function(err) {
        alertDiv.innerHTML = '<div class="alert alert-danger" style="padding:12px 16px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:14px;"><i class="fas fa-exclamation-circle" style="margin-right:8px;"></i>Error: ' + err.message + '</div>';
      });
    });
  }
  
  // Bind password change form
  var pwForm = panel.querySelector("#passwordForm");
  if (pwForm) {
    pwForm.addEventListener("submit", function(e) {
      e.preventDefault();
      var newPass = document.getElementById("newPassword").value;
      var confirm = document.getElementById("confirmPassword").value;
      var alertDiv = document.getElementById("passwordAlert");
      
      if (newPass || confirm) {
        var errors = validatePassword(newPass);
        if (errors.length > 0) {
          alertDiv.innerHTML = '<div class="alert alert-danger" style="padding:12px 16px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:14px;"><i class="fas fa-exclamation-circle" style="margin-right:8px;"></i>' + errors.join("<br>") + '</div>';
          return;
        }
        if (newPass !== confirm) {
          alertDiv.innerHTML = '<div class="alert alert-danger" style="padding:12px 16px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:14px;"><i class="fas fa-exclamation-circle" style="margin-right:8px;"></i>Passwords do not match.</div>';
          return;
        }
      }
      
      fetch("/api/auth/change-password", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email: userEmail, new_password: newPass})
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.success) {
          alertDiv.innerHTML = '<div class="alert alert-success" style="padding:12px 16px;background:#d1fae5;border:1px solid #10b981;border-radius:4px;color:#065f46;font-size:14px;"><i class="fas fa-check-circle" style="margin-right:8px;"></i>Password updated successfully.</div>';
          document.getElementById("newPassword").value = "";
          document.getElementById("confirmPassword").value = "";
          // Reset verification
          document.getElementById("passwordChangeSection").style.display = "none";
          document.getElementById("verifyIdentityBtn").disabled = false;
          document.getElementById("verifyIdentityBtn").textContent = "Verify Identity";
          document.getElementById("currentPasswordVerify").disabled = false;
          document.getElementById("currentPasswordVerify").value = "";
          document.getElementById("verifyAlert").innerHTML = "";
        } else {
          alertDiv.innerHTML = '<div class="alert alert-danger" style="padding:12px 16px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:14px;"><i class="fas fa-exclamation-circle" style="margin-right:8px;"></i>' + (data.message || "Failed to update password.") + '</div>';
        }
        setTimeout(function() { alertDiv.innerHTML = ""; }, 4000);
      })
      .catch(function(err) {
        alertDiv.innerHTML = '<div class="alert alert-danger" style="padding:12px 16px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:14px;"><i class="fas fa-exclamation-circle" style="margin-right:8px;"></i>Error: ' + err.message + '</div>';
      });
    });
  }
  
  // Password toggle buttons
  document.querySelectorAll(".pw-toggle").forEach(function(btn) {
    btn.addEventListener("click", function() {
      var targetId = this.getAttribute("data-target");
      var input = document.getElementById(targetId);
      var icon = this.querySelector("i");
      if (!input || !icon) return;
      if (input.type === "password") {
        input.type = "text";
        icon.className = "fas fa-eye";
      } else {
        input.type = "password";
        icon.className = "fas fa-eye-slash";
      }
    });
  });
}

/* ==========================================================================
    LOGOUT HANDLER
    ========================================================================== */
function handleLogout() {
  localStorage.removeItem("nct_login_data");
  localStorage.removeItem("nct_user_email");
  sessionStorage.removeItem("nct_user_email");
  sessionStorage.removeItem("nct_authenticated");
  location.reload();
}
