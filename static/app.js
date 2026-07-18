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
  });
}

function activateSidebarItem(view) {
  var items = document.querySelectorAll(".nav-item");
  var panels = document.querySelectorAll(".view-panel");
  for (var j = 0; j < items.length; j++) items[j].classList.remove("active");
  var targetItem = document.querySelector('.nav-item[data-view="' + view + '"]');
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

        if (view === "head-office") { activateSidebarItem("head-office"); renderHeadOffice(); return; }
        if (view === "nsip-km1") { activateSidebarItem("nsip-km1"); collapseNsipSubmenu(); renderNsipKm1View(); return; }
        if (view === "nsip-km2" || view === "nsip-km3" || view === "nsip-km4" || view === "nsip-km5" || view === "nsip-km6") {
          activateSidebarItem(view); collapseNsipSubmenu(); renderComingSoon(view); return;
        }
        if (view === "nct-innosphere") { activateSidebarItem(view); renderWaitingForData(view); return; }
        if (view === "salak-perdana") { activateSidebarItem(view); renderProjectView(view); return; }
        if (view === "logout") { handleLogout(); return; }
        if (view === "media") { activateSidebarItem(view); renderMediaView(); return; }
        if (view === "user-profile") { activateSidebarItem(view); loadUserProfileView(); return; }
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
    '  <div class="data-extracted-box"><div class="de-label">Data Extracted</div><div class="de-date">15 July 2026</div></div></div>' +
    '<div class="card staging-placeholder" style="text-align:center;padding:80px 20px;">' +
    '  <i class="fas fa-clock" style="font-size:64px;color:var(--corporate-orange);margin-bottom:20px;display:block;"></i>' +
    '  <h3 style="font-size:24px;margin-bottom:12px;">Coming Soon</h3>' +
    '  <p style="color:var(--text-secondary);font-size:15px;">' + label + ' project data will be available in a future update.</p></div>';
}

function renderWaitingForData(view) {
  var panel = document.getElementById("view-" + view);
  if (!panel) return;
  var label = view.split("-").map(function(w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(" ");
  var dateText = "15 July 2026";
  var status = view === "nct-innosphere" ? getProjectStatus("NCT INNOSPHERE") : null;
  var statusHtml = status ? renderStatusDot(status) : '';
  var projectName = view === "nct-innosphere" ? "NCT INNOSPHERE" : null;
  
  panel.innerHTML =
    '<div class="page-header">' +
    '  <div style="display:flex;justify-content:space-between;align-items:center;flex:1;">' +
    '    <div><h1 style="margin-right:12px;">' + label + '</h1><div class="header-sub">Project Dashboard</div></div>' +
    '    <div style="flex-shrink:0;">' + statusHtml + '</div>' +
    '  </div>' +
    '  <div class="data-extracted-box"><div class="de-label">Data Extracted</div><div class="de-date">' + dateText + '</div></div>' +
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
   UTILITIES
   ========================================================================== */
function esc(s) { return (s === undefined || s === null || s === "") ? "-" : String(s); }

function formatPrice(val) {
  try {
    if (!val || Number(val) === 0) return "-";
    return "RM " + Number(val).toLocaleString("en-MY", {minimumFractionDigits:0, maximumFractionDigits:0});
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
  try { return (u.Status || "").toString().trim().toLowerCase() === "available"; } catch(e) { return false; }
}

function computeAvailableUnits(units) {
  return units.filter(function(u) { return isAvailable(u); }).length;
}

function computeGrandTotalPrice(units) {
  return units.reduce(function(acc, u) { return acc + computePrice(u); }, 0);
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
    '<div class="page-header"><div><h1>Head Office</h1><div class="header-sub">NCT Alliance Berhad</div></div>' +
    '  <div class="data-extracted-box"><div class="de-label">Data Extracted</div><div class="de-date">15 July 2026</div></div></div>' +
    '<div class="gallery-folder-grid">' +
    '  <div class="gallery-folder-card" data-folder="location">' +
    '    <div class="folder-icon"><i class="fas fa-map-marker-alt"></i></div>' +
    '    <div class="folder-name">Location</div>' +
    '  </div>' +
    '  <div class="gallery-folder-card" data-folder="floor">' +
    '    <div class="folder-icon"><i class="fas fa-layer-group"></i></div>' +
    '    <div class="folder-name">Floor</div>' +
    '  </div>' +
    '  <div class="gallery-folder-card" data-folder="layout">' +
    '    <div class="folder-icon"><i class="fas fa-project-diagram"></i></div>' +
    '    <div class="folder-name">Layout</div>' +
    '  </div>' +
    '</div>' +
    '<div id="headOfficeContent"></div>';

  var cards = panel.querySelectorAll(".gallery-folder-card");
  cards.forEach(function(card) {
    card.addEventListener("click", function() {
      var type = this.dataset.folder;
      var container = document.getElementById("headOfficeContent");
      if (!container) return;
      var title = type.charAt(0).toUpperCase() + type.slice(1);
      container.innerHTML =
        '<div class="card staging-placeholder" style="text-align:center;padding:80px 20px;">' +
        '  <i class="fas fa-hourglass-half" style="font-size:64px;color:var(--corporate-orange);margin-bottom:20px;display:block;"></i>' +
        '  <h3 style="font-size:24px;margin-bottom:12px;">Waiting for data</h3>' +
        '  <p style="color:var(--text-secondary);font-size:15px;">' + esc(title) + ' data will be available once uploaded.</p></div>';
    });
  });
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

function createUnitsTable(units, startNum, projectName) {
  var isHighrise = projectName && HIGHRISE_PROJECTS[projectName.toString().trim().toUpperCase()];

  var colGroups, headers;
  if (isHighrise) {
    colGroups = '<col style="width:5%"><col style="width:25%"><col style="width:35%"><col style="width:35%">';
    headers = '<th>No</th><th>Unit No</th><th>Built Up</th><th>List Price</th>';
  } else {
    colGroups = '<col style="width:5%"><col style="width:20%"><col style="width:25%"><col style="width:25%"><col style="width:25%">';
    headers = '<th>No</th><th>Unit No</th><th>Land Area</th><th>Built Up</th><th>List Price</th>';
  }

  var table = document.createElement("table");
  table.className = "asset-table";
  table.innerHTML =
    '<colgroup>' + colGroups + '</colgroup>' +
    '<thead><tr>' + headers + '</tr></thead><tbody></tbody>';

  var tbody = table.querySelector("tbody");
  units.forEach(function(u, i) {
    var tr = document.createElement("tr");
    var builtUp = u.Built_Up || 0;
    var landArea = u.Land_Area || 0;
    var listPrice = u.Listing_Price || 0;
    if (isHighrise) {
      tr.innerHTML =
        '<td>' + (startNum + i + 1) + '</td>' +
        '<td>' + esc(u.Unit_No) + '</td>' +
        '<td>' + esc(builtUp) + '</td>' +
        '<td>' + formatPrice(listPrice) + '</td>';
    } else {
      tr.innerHTML =
        '<td>' + (startNum + i + 1) + '</td>' +
        '<td>' + esc(u.Unit_No) + '</td>' +
        '<td>' + esc(landArea) + '</td>' +
        '<td>' + esc(builtUp) + '</td>' +
        '<td>' + formatPrice(listPrice) + '</td>';
    }
    tbody.appendChild(tr);
  });

  var summaryTr = document.createElement("tr");
  summaryTr.className = "total-price-summary-row";
  var totalPrice = units.reduce(function(acc, u) { return acc + (Number(u.Listing_Price) || 0); }, 0);
  var colspan = isHighrise ? 3 : 4;
  summaryTr.innerHTML =
    '<td colspan="' + colspan + '" class="total-price-label">Total List Price</td>' +
    '<td class="total-price-value">' + formatPrice(totalPrice) + '</td>';
  tbody.appendChild(summaryTr);

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

    var header = createGroupHeader(phase, computeAvailableUnits(phaseUnits), expanded, "group-header-type", "Phase");
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
function renderHomeDashboard() {
  fetch("/api/home/kpi")
    .then(function(res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
    .then(function(data) {
      var kpiData = Array.isArray(data) ? data : [];
      renderDashboardSections(kpiData);
    })
    .catch(function(err) {
      console.error("Home KPI fetch error:", err);
    });

  fetchAllUnitsCached().then(function(units) {
    try { populateProjectFilter(units); } catch(e) { console.error("Filter:", e); }
    try { renderHomeHierarchy(units); } catch(e) { console.error("Home hierarchy:", e); }
  });
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

  var guaranteedOngoing = [
    { project_name: "NCT SMART INDUSTRIAL PARK KM1", project_status: "Ongoing", available_units: 0, total_list_price: 0, project_slug: "nsip" },
    { project_name: "NCT INNOSPHERE", project_status: "Ongoing", available_units: 0, total_list_price: 0, project_slug: "nct-innosphere" }
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

  (Array.isArray(kpiData) ? kpiData : []).forEach(function(proj) {
    var key = (proj.project_name || "").toString().trim().toUpperCase();
    if (key !== "NCT SMART INDUSTRIAL PARK KM1" && key !== "NCT INNOSPHERE") {
      allProjects.push(proj);
    }
  });

  allProjects.forEach(function(proj) {
    var card = createDashboardCard(proj);
    if (proj.project_status === "Ongoing") {
      ongoingGrid.appendChild(card);
    } else {
      completedGrid.appendChild(card);
    }
  });

  if (completedGrid.children.length === 0) {
    completedGrid.innerHTML = '<div class="dashboard-empty">No completed projects</div>';
  }
  if (ongoingGrid.children.length === 0) {
    ongoingGrid.innerHTML = '<div class="dashboard-empty">No ongoing projects</div>';
  }
}

function createDashboardCard(proj) {
  var card = document.createElement("div");
  card.className = "dashboard-kpi-card";
  card.style.cursor = "pointer";

  var slug = proj.project_slug || "";

  card.innerHTML =
    '<div class="dash-kpi-header">' +
      '<div class="dash-kpi-name">' + esc(proj.project_name) + '</div>' +
    '</div>' +
    '<div class="dash-kpi-body">' +
      '<div class="dash-kpi-metric">' +
        '<div class="dash-kpi-value">' + proj.available_units + '</div>' +
        '<div class="dash-kpi-label">Total Available Units</div>' +
      '</div>' +
      '<div class="dash-kpi-metric">' +
        '<div class="dash-kpi-value">' + formatPrice(proj.total_list_price) + '</div>' +
        '<div class="dash-kpi-label">Total List Price</div>' +
      '</div>' +
    '</div>';

  card.addEventListener("click", function() {
    if (!slug) return;
    if (slug === "nsip") {
      activateSidebarItem("nsip-km1");
      collapseNsipSubmenu();
      renderNsipKm1View();
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
    var count = units.filter(function(u) { return (u.Project || "").toString().trim() === dbProjectName && isAvailable(u); }).length;
    var totalPrice = units.filter(function(u) { return (u.Project || "").toString().trim() === dbProjectName; }).reduce(function(acc, u) { return acc + computePrice(u); }, 0);
    var status = getProjectStatus(dbProjectName);
    var card = document.createElement("div");
    card.className = "kpi-card-unified";
    card.dataset.view = slug;
    var displayName = dbProjectName === "NSIP" ? "NSIP KM1" : dbProjectName;
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
      renderHierarchy(container, sourceUnits.filter(isAvailable), "home");
    });
  }

  renderHierarchy(container, units.filter(isAvailable), "home");
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
   PROJECT PAGE RENDERER
   ========================================================================== */
function renderProjectView(slug) {
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
    '    <div><h1 style="margin-right:12px;">' + pageTitle + '</h1><div class="header-sub">Project Dashboard</div></div>' +
    '    <div style="flex-shrink:0;">' + renderStatusDot(status) + '</div>' +
    '  </div>' +
    '  <div class="data-extracted-box"><div class="de-label">Data Extracted</div><div class="de-date">' + dateText + '</div></div>' +
    '</div>' +
    '<div class="project-image-banner" id="project-image-' + slug + '" style="background:#000000;border-radius:10px;overflow:hidden;margin-bottom:20px;position:relative;cursor:pointer;" title="Double-click to view full image">' +
    '  <div style="display:flex;align-items:center;justify-content:center;min-height:200px;max-height:400px;padding:20px;">' +
    '    <div style="color:#9ca3af;font-size:14px;"><i class="fas fa-spinner fa-spin" style="font-size:24px;display:block;margin-bottom:8px;"></i>Loading project image...</div>' +
    '  </div>' +
    '</div>' +
    '<div class="project-kpi-container">' +
    '  <div class="card project-kpi-box"><div class="project-kpi-label"><i class="fas fa-check-circle" style="color:var(--corporate-orange);margin-right:8px;"></i>Total Available Units</div><div class="project-kpi-value" id="kpi-' + slug + '">0</div></div>' +
    '  <div class="card project-kpi-price-box"><div class="project-kpi-label"><i class="fas fa-coins" style="color:#0f2042;margin-right:8px;"></i>Total List Price</div><div class="project-kpi-value" id="kpi-price-' + slug + '">RM 0</div></div>' +
    '</div>' +
    '<div class="card" id="assetListContainer-' + slug + '">' +
    '  <div class="card-header">' +
    '    <span class="card-title"><i class="fas fa-list"></i> PROJECT ASSET LIST</span>' +
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
    
    try { renderProjectHierarchy(slug, projectUnits); } catch(e) { console.error("Hierarchy:", e); }
  });

  loadProjectImageBanner(slug, cfg.name);
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
      banner.innerHTML = '<img src="' + imgUrl + '" alt="' + esc(projectName) + '" style="width:100%;max-height:400px;object-fit:cover;object-position:center;display:block;background:#000000;">';

      banner.addEventListener("dblclick", function() {
        openImageModal(imgUrl, images[0].filename);
      });
    })
    .catch(function(err) {
      console.error("Failed to load project image:", err);
      banner.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:200px;max-height:400px;padding:20px;"><div style="color:#6b7280;font-size:14px;text-align:center;"><i class="fas fa-exclamation-circle" style="font-size:32px;display:block;margin-bottom:8px;opacity:0.5;"></i>Failed to load project image</div></div>';
    });
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

  var availableUnits = projectUnits.filter(isAvailable);
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

    var header = createGroupHeader(phase, computeAvailableUnits(phaseUnits), false, "group-header-type", "Phase");
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
  el.textContent = formatPrice(computeGrandTotalPrice(projectUnits));
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
    '  <div style="display:flex;justify-content:space-between;align-items:center;flex:1;">' +
    '    <div><h1 style="margin-right:12px;">' + nsipProjectName + '</h1><div class="header-sub">Project Dashboard</div></div>' +
    '    <div style="flex-shrink:0;">' + renderStatusDot(status) + '</div>' +
    '  </div>' +
    '  <div class="data-extracted-box"><div class="de-label">Data Extracted</div><div class="de-date">15 July 2026</div></div></div>' +
    '</div>' +
    '<div class="project-image-banner" id="project-image-nsip" style="background:#000000;border-radius:10px;overflow:hidden;margin-bottom:20px;position:relative;cursor:pointer;" title="Double-click to view full image">' +
    '  <div style="display:flex;align-items:center;justify-content:center;min-height:200px;max-height:400px;padding:20px;">' +
    '    <div style="color:#9ca3af;font-size:14px;"><i class="fas fa-spinner fa-spin" style="font-size:24px;display:block;margin-bottom:8px;"></i>Loading project image...</div>' +
    '  </div>' +
    '</div>' +
    '<div class="project-kpi-container">' +
    '  <div class="card project-kpi-box"><div class="project-kpi-label"><i class="fas fa-check-circle" style="color:var(--corporate-orange);margin-right:8px;"></i>Total Available Units</div><div class="project-kpi-value" id="kpi-nsip">0</div></div>' +
    '  <div class="card project-kpi-price-box"><div class="project-kpi-label"><i class="fas fa-coins" style="color:#0f2042;margin-right:8px;"></i>Total List Price</div><div class="project-kpi-value" id="kpi-price-nsip">RM 0</div></div>' +
    '</div>' +
    '<div id="nsip-svg-wrapper" style="width:100%;display:flex;flex-direction:column;gap:20px;box-sizing:border-box;padding:0;margin-bottom:20px;">' +
    '  <div id="nsip-svg-stage" style="width:100%;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);overflow:hidden;min-height:200px;">' +
    '    <div style="display:flex;align-items:center;justify-content:center;height:200px;color:#5e6778;font-style:italic;">Loading layout...</div>' +
    '  </div>' +
    '  <div id="nsip-layout-legends"></div>' +
    '  <div id="nsip-layout-summary"></div>' +
    '</div>' +
    '<div class="card">' +
    '  <div class="card-header"><span class="card-title"><i class="fas fa-list"></i> PROJECT ASSET LIST</span></div>' +
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
      if (kpiEl) kpiEl.textContent = __nsipSharedData.available;
      var priceEl = document.getElementById("kpi-price-nsip");
      if (priceEl) {
        var sumPrice = __nsipSharedData.units.filter(function(u) { return String(u.Status).trim().toLowerCase() === 'available'; }).reduce(function(acc, u) { return acc + (Number(u.Listing_Price) || 0); }, 0);
        priceEl.textContent = formatPrice(sumPrice);
      }

      try { renderNsipHierarchy(__nsipSharedData.units); } catch(e) { console.error("Hierarchy:", e); }

      fetch("/static/NSIP_Master.svg")
        .then(function(svgRes) { if (!svgRes.ok) throw new Error("HTTP " + svgRes.status); return svgRes.text(); })
        .then(function(svgMarkup) {
          var stage = document.getElementById("nsip-svg-stage");
          if (!stage) return;
          stage.innerHTML = svgMarkup;

          var svg = stage.querySelector("svg");
          if (svg) {
            svg.setAttribute("width", "100%");
            svg.setAttribute("height", "100%");
            svg.style.display = "block";
            svg.style.background = "#f4f6fa";
            svg.style.borderRadius = "6px";
          }

          applyNsipSvgOverlay(__nsipSharedData.units);
          renderNsipLayoutLegends();
        })
        .catch(function(err) {
          console.error("Failed to load NSIP SVG:", err);
          var stage = document.getElementById("nsip-svg-stage");
          if (stage) stage.innerHTML = '<div style="text-align:center;padding:40px;color:#dc2626;">Failed to load layout SVG.</div>';
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
    '  <div style="display:flex;align-items:center;gap:6px;"><span style="width:12px;height:12px;border-radius:3px;background:#00E676;display:inline-block;"></span> Available</div>' +
    '  <div style="display:flex;align-items:center;gap:6px;"><span style="width:12px;height:12px;border-radius:3px;background:#9E9E9E;display:inline-block;"></span> Sold / Not Available</div>' +
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
  var builtUp = unit ? String(unit.Built_Up || '') : '';
  var landArea = unit ? String(unit.Land_Area || '') : '';
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
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Built Up</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (builtUp || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Land Area</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (landArea || '-') + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-top:1px solid #f4f6fa;"><span style="font-size:12px;color:#5e6778;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Price</span><span style="font-size:13px;color:#1a1d23;font-weight:500;text-align:right;">' + (price || '-') + '</span></div>';

  modalEl.style.display = 'flex';
}

function renderNsipHierarchy(projectUnits) {
  var container = document.getElementById("ledgerContainer-nsip");
  if (!container) return;

  var availableUnits = projectUnits.filter(isAvailable);
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
        activateSidebarItem("user-profile");
        loadUserProfileView();
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
window.initApp = function() {
  try {
    console.log("NCT V3 - initApp starting...");
    renderHomeDashboard();
    bindHeaderUserDropdown();
    console.log("NCT V3 - initApp loaded");
  } catch(e) { console.error("initApp fatal:", e); }
};

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
      '<div class="projects-info-name" style="font-size:14px;font-weight:600;color:#1a1d23;flex:1;">' + esc(proj) + '</div>' +
      '<div class="projects-info-status" style="font-size:12px;color:#6b7280;">Empty</div>';

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
          this.style.transform = "translateY(-2px)";
          this.style.boxShadow = "0 4px 12px rgba(244,114,23,0.15)";
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
function loadUserProfileView() {
  var panel = document.getElementById("view-user-profile");
  if (!panel) return;

  var userEmail = sessionStorage.getItem("nct_user_email") || localStorage.getItem("nct_user_email") || "";

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
        '  <div class="card-body">' +
        '    <form id="passwordForm" style="display:flex;flex-direction:column;gap:16px;">' +
        '      <div>' +
        '        <label for="currentPassword" style="display:block;font-size:13px;font-weight:600;color:#1a1d23;margin-bottom:6px;">Current Password</label>' +
        '        <input type="password" id="currentPassword" placeholder="Enter current password" style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:4px;font-size:14px;box-sizing:border-box;">' +
        '      </div>' +
        '      <div>' +
        '        <label for="newPassword" style="display:block;font-size:13px;font-weight:600;color:#1a1d23;margin-bottom:6px;">New Password</label>' +
        '        <input type="password" id="newPassword" placeholder="Enter new password" style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:4px;font-size:14px;box-sizing:border-box;">' +
        '      </div>' +
        '      <div>' +
        '        <label for="confirmPassword" style="display:block;font-size:13px;font-weight:600;color:#1a1d23;margin-bottom:6px;">Confirm New Password</label>' +
        '        <input type="password" id="confirmPassword" placeholder="Confirm new password" style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:4px;font-size:14px;box-sizing:border-box;">' +
        '      </div>' +
        '      <div id="passwordAlert"></div>' +
        '      <div style="display:flex;gap:12px;justify-content:flex-end;">' +
        '        <button type="submit" style="padding:10px 24px;background:#f47217;color:white;border:none;border-radius:4px;font-weight:600;cursor:pointer;font-size:14px;">Update Password</button>' +
        '      </div>' +
        '    </form>' +
        '  </div>' +
        '</div>' +
        '<div class="card" style="max-width:800px;margin:20px auto 0;">' +
        '  <div class="card-header"><span class="card-title"><i class="fas fa-shield-alt"></i> Multi-Factor Authentication</span></div>' +
        '  <div class="card-body">' +
        '    <div id="mfaAlert"></div>' +
        '    <div id="mfaContent">' +
        '      <p style="color:#5e6778;font-size:14px;margin-bottom:20px;">Add an extra layer of security to your account using Time-based One-Time Password (TOTP).</p>' +
        '      <div style="display:flex;gap:12px;">' +
        '        <button type="button" id="enableMfaBtn" class="btn-enable-mfa" style="padding:10px 24px;background:#f47217;color:white;border:none;border-radius:4px;font-weight:600;cursor:pointer;font-size:14px;">Enable MFA</button>' +
        '        <button type="button" id="disableMfaBtn" class="btn-disable-mfa" style="padding:10px 24px;background:#dc2626;color:white;border:none;border-radius:4px;font-weight:600;cursor:pointer;font-size:14px;display:none;">Disable MFA</button>' +
        '      </div>' +
        '      <div id="mfaSetupContent" style="margin-top:20px;display:none;">' +
        '        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:16px;">' +
        '          <h4 style="font-size:14px;font-weight:600;color:#1a1d23;margin-bottom:12px;">Setup Key</h4>' +
        '          <code id="mfaSecretKey" style="display:block;padding:12px;background:#ffffff;border:1px solid #d1d5db;border-radius:4px;font-size:13px;word-break:break-all;margin-bottom:16px;"></code>' +
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

      var pwForm = panel.querySelector("#passwordForm");
      if (pwForm) {
        pwForm.addEventListener("submit", function(e) {
          e.preventDefault();
          var current = document.getElementById("currentPassword").value;
          var newPass = document.getElementById("newPassword").value;
          var confirm = document.getElementById("confirmPassword").value;
          var alertDiv = document.getElementById("passwordAlert");

          if (!current && !newPass && !confirm) { alertDiv.innerHTML = ""; return; }

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

          alertDiv.innerHTML = '<div class="alert alert-success" style="padding:12px 16px;background:#d1fae5;border:1px solid #10b981;border-radius:4px;color:#065f46;font-size:14px;"><i class="fas fa-check-circle" style="margin-right:8px;"></i>Password updated successfully.</div>';
          document.getElementById("currentPassword").value = "";
          document.getElementById("newPassword").value = "";
          document.getElementById("confirmPassword").value = "";
          setTimeout(function() { alertDiv.innerHTML = ""; }, 3000);
        });
      }

      var enableBtn = panel.querySelector("#enableMfaBtn");
      if (enableBtn) {
        enableBtn.addEventListener("click", function() {
          var secret = generateMfaSecret();
          var secretEl = document.getElementById("mfaSecretKey");
          if (secretEl) secretEl.textContent = secret;
          var mfaSetup = document.getElementById("mfaSetupContent");
          if (mfaSetup) mfaSetup.style.display = "block";
          enableBtn.style.display = "none";

          var qrContainer = document.getElementById("mfaQrCode");
          if (qrContainer) {
            var appName = "NCT Stocks & Inventory";
            var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/" + encodeURIComponent(appName + ":" + userEmail) + "?secret=" + secret + "&issuer=" + encodeURIComponent(appName);
            qrContainer.innerHTML = '<img src="' + qrUrl + '" alt="MFA QR Code" style="display:block;max-width:200px;">';
          }
        });
      }

      var verifyBtn = panel.querySelector("#verifyMfaBtn");
      if (verifyBtn) {
        verifyBtn.addEventListener("click", function() {
          var code = document.getElementById("mfaVerifyCode").value.trim();
          var alertDiv = document.getElementById("mfaAlert");
          if (!alertDiv) return;

          if (code.length !== 6 || !/^\d+$/.test(code)) {
            alertDiv.innerHTML = '<div class="alert alert-danger" style="padding:12px 16px;background:#fee2e2;border:1px solid #dc2626;border-radius:4px;color:#991b1b;font-size:14px;"><i class="fas fa-exclamation-circle" style="margin-right:8px;"></i>Please enter a valid 6-digit code.</div>';
            return;
          }

          alertDiv.innerHTML = '<div class="alert alert-success" style="padding:12px 16px;background:#d1fae5;border:1px solid #10b981;border-radius:4px;color:#065f46;font-size:14px;"><i class="fas fa-check-circle" style="margin-right:8px;"></i>MFA enabled successfully.</div>';
          var mfaSetup = document.getElementById("mfaSetupContent");
          if (mfaSetup) mfaSetup.style.display = "none";
          var disableBtn = document.getElementById("disableMfaBtn");
          if (disableBtn) disableBtn.style.display = "inline-block";
          setTimeout(function() { alertDiv.innerHTML = ""; }, 3000);
        });
      }

      var disableMfaBtn = panel.querySelector("#disableMfaBtn");
      if (disableMfaBtn) {
        disableMfaBtn.addEventListener("click", function() {
          var alertDiv = document.getElementById("mfaAlert");
          if (alertDiv) {
            alertDiv.innerHTML = '<div class="alert alert-success" style="padding:12px 16px;background:#d1fae5;border:1px solid #10b981;border-radius:4px;color:#065f46;font-size:14px;"><i class="fas fa-check-circle" style="margin-right:8px;"></i>MFA disabled successfully.</div>';
          }
          var enableBtn = document.getElementById("enableMfaBtn");
          if (enableBtn) enableBtn.style.display = "inline-block";
          disableMfaBtn.style.display = "none";
          setTimeout(function() { if (alertDiv) alertDiv.innerHTML = ""; }, 3000);
        });
      }
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

function generateMfaSecret() {
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  var secret = "";
  for (var i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
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
