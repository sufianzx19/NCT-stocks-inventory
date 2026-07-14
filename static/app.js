/* ==========================================================================
   NCT Stocks & Inventory V3 — Dashboard Application
   ========================================================================== */

/* ==========================================================================
   SIDEBAR DISPLAY CONFIGURATION
   ========================================================================== */
var SIDEBAR_ITEMS = [
  { view: "grand-ion-delemen",   display: "Grand Ion Delemen",        dbProject: "GRAND ION DELEMEN" },
  { view: "grand-ion-majestic",  display: "Grand Ion Majestic",       dbProject: "GRAND ION MAJESTIC" },
  { view: "ion-belian-garden",   display: "Ion Belian Garden",        dbProject: "ION BELIAN GARDEN" },
  { view: "mahkota-kampar",      display: "Mahkota Kampar",           dbProject: "MAHKOTA KAMPAR" },
  { view: "n-city",              display: "N-City",                   dbProject: "N-CITY" },
  { view: "vortex-business-park",display: "Vortex Business Park",     dbProject: "VORTEX BUSINESS PARK" },
  { view: "salak-perdana",       display: "Salak Perdana Business Park", dbProject: "SALAK PERDANA BUSINESS PARK" },
  { view: "nsip",                display: "NSIP",                     dbProject: "NSIP" },
];

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

function buildProjectConfigFromData(units) {
  var projects = [];
  var seen = {};
  units.forEach(function(u) {
    var p = (u.Project || "").toString().trim();
    if (p && !seen[p]) { seen[p] = true; projects.push(p); }
  });
  projects.sort();

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

function bindSidebarNavigation() {
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

        if (view === "nsip-km1") { activateSidebarItem("nsip-km1"); collapseNsipSubmenu(); renderNsipKm1View(); return; }
        if (view === "nsip-km2" || view === "nsip-km3" || view === "nsip-km4" || view === "nsip-km5" || view === "nsip-km6") {
          activateSidebarItem(view); collapseNsipSubmenu(); renderComingSoon(view); return;
        }
        if (view === "nct-innosphere") { activateSidebarItem(view); renderWaitingForData(view); return; }
        if (view === "media") { activateSidebarItem(view); renderMediaView(); return; }

        activateSidebarItem(view);
        if (view === "home") renderHomeDashboard();
        else if (view === "svg-map") { if (typeof window.initLayoutViewer === "function") window.initLayoutViewer(); }
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
    '  <div class="data-extracted-box"><div class="de-label">Data Extracted</div><div class="de-date">2 July 2026</div></div></div>' +
    '<div class="card staging-placeholder" style="text-align:center;padding:80px 20px;">' +
    '  <i class="fas fa-clock" style="font-size:64px;color:var(--corporate-orange);margin-bottom:20px;display:block;"></i>' +
    '  <h3 style="font-size:24px;margin-bottom:12px;">Coming Soon</h3>' +
    '  <p style="color:var(--text-secondary);font-size:15px;">' + label + ' project data will be available in a future update.</p></div>';
}

    function renderWaitingForData(view) {
  var panel = document.getElementById("view-" + view);
  if (!panel) return;
  var label = view.split("-").map(function(w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(" ");
  var dateText = view === "salak-perdana" ? "13 July 2026" : "2 July 2026";
  panel.innerHTML =
    '<div class="page-header"><div><h1>' + label + '</h1><div class="header-sub">Project Dashboard</div></div>' +
    '  <div class="data-extracted-box"><div class="de-label">Data Extracted</div><div class="de-date">' + dateText + '</div></div></div>' +
    '<div class="card staging-placeholder" style="text-align:center;padding:80px 20px;">' +
    '  <i class="fas fa-hourglass-half" style="font-size:64px;color:var(--corporate-orange);margin-bottom:20px;display:block;"></i>' +
    '  <h3 style="font-size:24px;margin-bottom:12px;">Waiting for Data</h3>' +
    '  <p style="color:var(--text-secondary);font-size:15px;">' + label + ' data will be available once uploaded.</p></div>';
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
   LAZY HIERARCHY RENDERER — Shared for Home & Projects
   Hierarchy: Project → Property Type → Property Ownership → Block → Table
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

  // Add category label if provided (e.g. "Project :", "Property Type :", etc.)
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
  labelSpan.textContent = "Available Units";
  right.appendChild(labelSpan);

  div.appendChild(right);
  return div;
}

function createUnitsTable(units, startNum) {
  var table = document.createElement("table");
  table.className = "asset-table";
  table.innerHTML =
    '<colgroup>' +
    '  <col style="width:60px"><col style="width:100px"><col style="width:140px"><col style="width:100px"><col style="width:100px"><col style="width:100px"><col style="width:100px"><col style="width:130px"><col style="width:100px"><col style="width:130px">' +
    '</colgroup>' +
    '<thead><tr><th>No</th><th>Unit No</th><th>Property Type</th><th>Unit Type</th><th>Category</th><th>Built-Up</th><th>Land Area</th><th>Block</th><th>Bank Charge</th><th>Price</th></tr></thead><tbody></tbody>';

  var tbody = table.querySelector("tbody");
  units.forEach(function(u, i) {
    var tr = document.createElement("tr");
    tr.innerHTML =
      '<td>' + (startNum + i + 1) + '</td>' +
      '<td>' + esc(u.Unit_No) + '</td>' +
      '<td>' + esc(u.Property_Type) + '</td>' +
      '<td>' + esc(u.Unit_Type) + '</td>' +
      '<td>' + esc(u.Commercial_Residential) + '</td>' +
      '<td>' + esc(u.Built_Up) + '</td>' +
      '<td>' + esc(u.Land_Area) + '</td>' +
      '<td>' + esc(u.Block) + '</td>' +
      '<td>' + formatPrice(u.Bank_Charge) + '</td>' +
      '<td>' + formatPrice(computePrice(u)) + '</td>';
    tbody.appendChild(tr);
  });

  // Append summary row
  var summaryTr = document.createElement("tr");
  summaryTr.className = "total-price-summary-row";
  var totalPrice = computeGrandTotalPrice(units);
  summaryTr.innerHTML =
    '<td colspan="9" class="total-price-label">TOTAL PRICE</td>' +
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

/* ==========================================================================
   CASCADING COLLAPSE
   When a parent header is clicked and collapsed, all children are collapsed.
   ========================================================================== */
function collapseChildren(content) {
  if (!content) return;
  // Find all group-content divs inside this level and hide them
  var childContents = content.querySelectorAll(".group-content");
  for (var i = 0; i < childContents.length; i++) {
    childContents[i].style.display = "none";
  }
  // Update all chevrons inside this level
  var chevrons = content.querySelectorAll(".group-chevron i");
  for (var j = 0; j < chevrons.length; j++) {
    chevrons[j].className = "fas fa-chevron-right";
  }
}

// Lazy render: only top level (Project). Children created on click.
function renderHierarchy(container, units, stateKey) {
  container.innerHTML = "";
  if (!units.length) {
    container.innerHTML = '<div style="text-align:center;padding:24px;">No records</div>';
    return;
  }

  var state = getOrInitState(stateKey);

  var projectGroups = groupBy(units, function(u) { return u.Project || "N/A"; });
  Object.keys(projectGroups).sort().forEach(function(proj) {
    var projUnits = projectGroups[proj];
    var projKey = "proj:" + proj;
    if (state[projKey] === undefined) state[projKey] = false;
    var expanded = state[projKey];

    var header = createGroupHeader(proj, computeAvailableUnits(projUnits), expanded, "group-header-project", "Project");
    container.appendChild(header);

    var content = document.createElement("div");
    content.className = "group-content";
    content.style.display = expanded ? "block" : "none";
    container.appendChild(content);

    var childrenRendered = false;
    header.addEventListener("click", function() {
      var now = toggleLevel(state, projKey);
      if (now) {
        // Expanding
        if (!childrenRendered) {
          renderPropertyTypes(content, projUnits, state, proj);
          childrenRendered = true;
        }
        content.style.display = "block";
      } else {
        // Collapsing - cascading collapse children
        content.style.display = "none";
        // Mark all descendant state keys as collapsed (false)
        // First collect all keys that start with this project's keys
        for (var k in state) {
          if (k.indexOf("pt:" + proj + ":") === 0 || k.indexOf("own:" + proj + ":") === 0 || k.indexOf("blk:" + proj + ":") === 0) {
            state[k] = false;
          }
        }
        // Reset all child chevrons
        collapseChildren(content);
      }
      var chev = header.querySelector(".group-chevron i");
      if (chev) chev.className = "fas " + (now ? "fa-chevron-down" : "fa-chevron-right");
    });
  });

  container.appendChild(createGrandTotal(units));
}

function renderPropertyTypes(container, units, state, proj) {
  var ptGroups = groupBy(units, function(u) { return u.Property_Type || "N/A"; });
  Object.keys(ptGroups).sort().forEach(function(pt) {
    var ptUnits = ptGroups[pt];
    var ptKey = "pt:" + proj + ":" + pt;
    if (state[ptKey] === undefined) state[ptKey] = false;
    var expanded = state[ptKey];

    var header = createGroupHeader(pt, computeAvailableUnits(ptUnits), expanded, "group-header-type", "Property Type");
    container.appendChild(header);

    var content = document.createElement("div");
    content.className = "group-content group-indent-1";
    content.style.display = expanded ? "block" : "none";
    container.appendChild(content);

    var childrenRendered = false;
    header.addEventListener("click", function() {
      var now = toggleLevel(state, ptKey);
      if (now) {
        if (!childrenRendered) {
          renderOwnerships(content, ptUnits, state, proj, pt);
          childrenRendered = true;
        }
        content.style.display = "block";
      } else {
        content.style.display = "none";
        // Collapse all children
        for (var k in state) {
          if (k.indexOf("own:" + proj + ":" + pt + ":") === 0 || k.indexOf("blk:" + proj + ":" + pt + ":") === 0) {
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

function renderOwnerships(container, units, state, proj, pt) {
  var ownGroups = groupBy(units, function(u) { return u.Property_Ownership || "N/A"; });
  Object.keys(ownGroups).sort().forEach(function(own) {
    var ownUnits = ownGroups[own];
    var ownKey = "own:" + proj + ":" + pt + ":" + own;
    if (state[ownKey] === undefined) state[ownKey] = false;
    var expanded = state[ownKey];

    var header = createGroupHeader(own, computeAvailableUnits(ownUnits), expanded, "group-header-ownership", "Property Ownership");
    container.appendChild(header);

    var content = document.createElement("div");
    content.className = "group-content group-indent-2";
    content.style.display = expanded ? "block" : "none";
    container.appendChild(content);

    var childrenRendered = false;
    header.addEventListener("click", function() {
      var now = toggleLevel(state, ownKey);
      if (now) {
        if (!childrenRendered) {
          renderBlocks(content, ownUnits, state, proj, pt, own);
          childrenRendered = true;
        }
        content.style.display = "block";
      } else {
        content.style.display = "none";
        // Collapse all block children
        for (var k in state) {
          if (k.indexOf("blk:" + proj + ":" + pt + ":" + own + ":") === 0) {
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

function renderBlocks(container, units, state, proj, pt, own) {
  var blockGroups = groupBy(units, function(u) { return u.Block || "N/A"; });
  var rowNum = 0;
  Object.keys(blockGroups).sort().forEach(function(blk) {
    var blkUnits = blockGroups[blk];
    var blkKey = "blk:" + proj + ":" + pt + ":" + own + ":" + blk;
    if (state[blkKey] === undefined) state[blkKey] = false;
    var expanded = state[blkKey];

    var header = createGroupHeader(blk, computeAvailableUnits(blkUnits), expanded, "group-header-block", "Block");
    container.appendChild(header);

    var content = document.createElement("div");
    content.className = "group-content group-indent-3";
    content.style.display = expanded ? "block" : "none";
    container.appendChild(content);

    var childrenRendered = false;
    header.addEventListener("click", function() {
      var now = toggleLevel(state, blkKey);
      if (now) {
        if (!childrenRendered) {
          var wrapper = document.createElement("div");
          wrapper.className = "group-table-wrapper";
          wrapper.appendChild(createUnitsTable(blkUnits, rowNum));
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
  fetchAllUnitsCached().then(function(units) {
    try { renderHomeKPIRow(units); } catch(e) { console.error("KPI row:", e); }
    try { bindUnifiedKPICards(); } catch(e) { console.error("KPI cards:", e); }
    try { populateProjectFilter(units); } catch(e) { console.error("Filter:", e); }
    try { renderHomeHierarchy(units); } catch(e) { console.error("Home hierarchy:", e); }
  });
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
    var card = document.createElement("div");
    card.className = "kpi-card-unified";
    card.dataset.view = slug;
    var displayName = dbProjectName === "NSIP" ? "NSIP KM1" : dbProjectName;
    card.innerHTML =
      '<div class="kpi-project-name">' + esc(displayName) + '</div>' +
      '<div class="kpi-metrics">' +
      '  <div class="kpi-metric kpi-metric-left"><div class="kpi-value">' + count + '</div><div class="kpi-sub">Available Units</div></div>' +
      '  <div class="kpi-metric kpi-metric-right"><div class="kpi-value">' + formatPrice(totalPrice) + '</div><div class="kpi-sub">Total Price</div></div>' +
      '</div>';
    row.appendChild(card);
  });
}

function renderHomeHierarchy(units) {
  var container = document.getElementById("homeHierarchyContainer");
  if (!container) return;

  var projFilter = document.getElementById("ledgerProjectFilter");

  function applyFilter() {
    var proj = projFilter ? projFilter.value : "";
    var filtered = proj ? (window.__allUnits || []).filter(function(u) { return u.Project === proj; }) : (window.__allUnits || []);
    renderHierarchy(container, filtered, "home");
  }

  if (!projFilter.getAttribute("data-bound")) { projFilter.addEventListener("change", applyFilter); projFilter.setAttribute("data-bound","1"); }

  renderHierarchy(container, units, "home");
}

function populateProjectFilter(units) {
  var select = document.getElementById("ledgerProjectFilter");
  if (!select || select.getAttribute("data-populated") === "1") return;
  var projects = Array.from(new Set(units.map(function(u) { return u.Project || "Unknown"; }))).sort();
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

  var dateText = slug === "salak-perdana" ? "13 July 2026" : "2 July 2026";

  panel.innerHTML =
    '<div class="page-header">' +
    '  <div><h1>' + pageTitle + '</h1><div class="header-sub">Project Dashboard</div></div>' +
    '  <div class="data-extracted-box"><div class="de-label">Data Extracted</div><div class="de-date">' + dateText + '</div></div>' +
    '</div>' +
    '<div class="project-kpi-container">' +
    '  <div class="card project-kpi-box"><div class="project-kpi-label"><i class="fas fa-check-circle" style="color:var(--corporate-orange);margin-right:8px;"></i>Available Units</div><div class="project-kpi-value" id="kpi-' + slug + '">0</div></div>' +
    '  <div class="card project-kpi-price-box"><div class="project-kpi-label"><i class="fas fa-coins" style="color:#0f2042;margin-right:8px;"></i>Grand Total Price</div><div class="project-kpi-value" id="kpi-price-' + slug + '">RM 0</div></div>' +
    '</div>' +
    '<div class="card">' +
    '  <div class="card-header">' +
    '    <span class="card-title"><i class="fas fa-list"></i> ' + pageTitle + ' Asset List</span>' +
    '    <div class="table-controls">' +
    '      <select id="filterType-' + slug + '"><option value="">All Types</option></select>' +
    '      <select id="filterOwn-' + slug + '"><option value="">All Ownership</option></select>' +
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
}

function renderProjectHierarchy(slug, projectUnits) {
  var container = document.getElementById("ledgerContainer-" + slug);
  var typeSelect = document.getElementById("filterType-" + slug);
  var ownSelect = document.getElementById("filterOwn-" + slug);
  if (!container) return;

  try {
    if (typeSelect && typeSelect.getAttribute("data-populated") !== "1") {
      var types = Array.from(new Set(projectUnits.map(function(u) { return u.Property_Type || "N/A"; }))).sort();
      types.forEach(function(t) { var o = document.createElement("option"); o.value = t; o.textContent = t; typeSelect.appendChild(o); });
      typeSelect.setAttribute("data-populated", "1");
    }
    if (ownSelect && ownSelect.getAttribute("data-populated") !== "1") {
      var owns = Array.from(new Set(projectUnits.map(function(u) { return u.Property_Ownership || "N/A"; }))).sort();
      owns.forEach(function(o) { var op = document.createElement("option"); op.value = o; op.textContent = o; ownSelect.appendChild(op); });
      ownSelect.setAttribute("data-populated", "1");
    }
  } catch(e) {}

  function applyFilter() {
    var typeVal = typeSelect ? typeSelect.value : "";
    var ownVal = ownSelect ? ownSelect.value : "";
    var filtered = projectUnits.filter(function(u) {
      return (!typeVal || u.Property_Type === typeVal) && (!ownVal || u.Property_Ownership === ownVal);
    });
    renderHierarchy(container, filtered, slug);
  }

  if (typeSelect && !typeSelect.getAttribute("data-bound")) { typeSelect.addEventListener("change", applyFilter); typeSelect.setAttribute("data-bound","1"); }
  if (ownSelect && !ownSelect.getAttribute("data-bound")) { ownSelect.addEventListener("change", applyFilter); ownSelect.setAttribute("data-bound","1"); }

  renderHierarchy(container, projectUnits, slug);
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
function renderNsipKm1View() {
  var panel = document.getElementById("view-nsip-km1");
  if (!panel) return;

  panel.innerHTML =
    '<div class="page-header"><div><h1>NSIP KM1</h1><div class="header-sub">Project Dashboard</div></div>' +
    '  <div class="data-extracted-box"><div class="de-label">Data Extracted</div><div class="de-date">2 July 2026</div></div></div>' +
    '<div class="project-kpi-container">' +
    '  <div class="card project-kpi-box"><div class="project-kpi-label"><i class="fas fa-check-circle" style="color:var(--corporate-orange);margin-right:8px;"></i>Available Units</div><div class="project-kpi-value" id="kpi-nsip">0</div></div>' +
    '  <div class="card project-kpi-price-box"><div class="project-kpi-label"><i class="fas fa-coins" style="color:#0f2042;margin-right:8px;"></i>Grand Total Price</div><div class="project-kpi-value" id="kpi-price-nsip">RM 0</div></div>' +
    '</div>' +
    '<div style="width:100%;display:flex;flex-direction:column;gap:20px;box-sizing:border-box;padding:5px;">' +
    '  <div style="width:100%;display:block;clear:both;box-sizing:border-box;">' +
    '    <div title="Double-click to view the interactive available units layout." style="width:100%;display:block;background:#ffffff;padding:15px;border:1px solid #cbd5e1;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.03);box-sizing:border-box;cursor:pointer;" id="nsip-layout-preview">' +
    '      <img src="/static/NSIP_Plain_Layout.png" alt="NSIP KM1 Layout" style="width:100%;max-width:100%;height:auto;display:block;margin:0 auto;" />' +
    '    </div>' +
    '  </div>' +
    '</div>' +
    '<div class="card">' +
    '  <div class="card-header"><span class="card-title"><i class="fas fa-list"></i> NSIP KM1 Asset List</span>' +
    '    <div class="table-controls">' +
    '      <select id="filterType-nsip"><option value="">All Types</option></select>' +
    '      <select id="filterOwn-nsip"><option value="">All Ownership</option></select>' +
    '    </div>' +
    '  </div>' +
    '  <div id="ledgerContainer-nsip"></div>' +
    '</div>';

  setupNsipLayoutPreview();

  fetchAllUnitsCached().then(function(allUnits) {
    var projectUnits = allUnits.filter(function(u) { return (u.Project || "").toString().trim() === "NSIP"; });
    try { renderProjectKPI("nsip", projectUnits); } catch(e) { console.error("KPI:", e); }
    try { renderProjectTotalPriceKPI("nsip", projectUnits); } catch(e) { console.error("Price KPI:", e); }
    try { renderProjectHierarchy("nsip", projectUnits); } catch(e) { console.error("Hierarchy:", e); }
  });
}

/* ==========================================================================
   NSIP LAYOUT PREVIEW — Double-click opens interactive layout
   ========================================================================== */
function setupNsipLayoutPreview() {
  var preview = document.getElementById("nsip-layout-preview");
  if (preview) {
    preview.addEventListener("dblclick", function() {
      activateSidebarItem("svg-map");
      if (typeof window.initLayoutViewer === "function") window.initLayoutViewer();
    });
  }
}

/* ==========================================================================
   APP ENTRY POINT
   ========================================================================== */
window.initApp = function() {
  try {
    console.log("NCT V3 - initApp starting...");
    renderHomeDashboard();
    console.log("NCT V3 - initApp loaded");
  } catch(e) { console.error("initApp fatal:", e); }
};

/* ==========================================================================
   MEDIA GALLERY MODULE
   ========================================================================== */
var __galleryState = {
  folders: [],
  images: [],
  currentIndex: 0,
  currentFolder: null,
  view: "folders", // folders | photos | viewer
};

function renderMediaView() {
  var panel = document.getElementById("view-media");
  if (!panel) return;
  activateSidebarItem("media");

  fetch("/api/gallery/folders")
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var folders = Array.isArray(data) ? data : [];
      __galleryState.folders = folders;
      __galleryState.view = "folders";
      __galleryState.currentFolder = null;
      __galleryState.currentSubfolder = null;
      __galleryState.images = [];
      __galleryState.currentIndex = 0;
      renderGalleryFolders();
    })
    .catch(function(err) {
      console.error("Gallery folders error:", err);
      __galleryState.folders = [];
      __galleryState.view = "folders";
      __galleryState.currentFolder = null;
      __galleryState.currentSubfolder = null;
      __galleryState.images = [];
      __galleryState.currentIndex = 0;
      renderGalleryFolders();
    });
}

function renderGalleryFolders() {
  var root = document.getElementById("gallery-root");
  if (!root) return;
  root.innerHTML = "";

  var container = document.createElement("div");
  container.className = "gallery-container";

  var title = document.createElement("h2");
  title.style.fontSize = "18px";
  title.style.fontWeight = "700";
  title.style.color = "#0f2042";
  title.style.marginBottom = "4px";
  title.textContent = "Media Gallery";
  container.appendChild(title);

  var subtitle = document.createElement("p");
  subtitle.style.fontSize = "13px";
  subtitle.style.color = "#5e6778";
  subtitle.style.marginBottom = "6px";
  subtitle.textContent = "Select a project folder to browse photos";
  container.appendChild(subtitle);

  var grid = document.createElement("div");
  grid.className = "gallery-folder-grid";

  if (__galleryState.folders.length === 0) {
    grid.innerHTML = '<div style="text-align:center;padding:40px;color:#9ca3af;">No gallery folders found.</div>';
  } else {
    __galleryState.folders.forEach(function(folder) {
      var card = document.createElement("div");
      card.className = "gallery-folder-card";
      card.innerHTML =
        '<div class="folder-icon"><i class="fas fa-folder-open"></i></div>' +
        '<div class="folder-name">' + esc(folder.name) + '</div>';
      card.addEventListener("click", function() {
        openProjectFolder(folder);
      });
      grid.appendChild(card);
    });
  }

  container.appendChild(grid);
  root.appendChild(container);
}

function openProjectFolder(folder) {
  __galleryState.currentFolder = folder;
  __galleryState.view = "photos";
  renderGallerySubfolders();
}

function renderGallerySubfolders() {
  var root = document.getElementById("gallery-root");
  if (!root) return;
  root.innerHTML = "";

  var container = document.createElement("div");
  container.className = "gallery-container";

  var header = document.createElement("div");
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.gap = "10px";
  header.style.flexWrap = "wrap";

  var backBtn = document.createElement("button");
  backBtn.className = "gallery-back-btn";
  backBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Back';
  backBtn.addEventListener("click", function() {
    __galleryState.view = "folders";
    __galleryState.currentFolder = null;
    __galleryState.currentSubfolder = null;
    renderGalleryFolders();
  });
  header.appendChild(backBtn);

  var title = document.createElement("h2");
  title.style.fontSize = "18px";
  title.style.fontWeight = "700";
  title.style.color = "#0f2042";
  title.style.margin = "0";
  title.textContent = esc(__galleryState.currentFolder ? __galleryState.currentFolder.name : "");
  header.appendChild(title);

  container.appendChild(header);

  var sub = document.createElement("p");
  sub.style.fontSize = "13px";
  sub.style.color = "#5e6778";
  sub.style.margin = "4px 0 12px 0";
  sub.textContent = "Select a photo category";
  container.appendChild(sub);

  var grid = document.createElement("div");
  grid.className = "gallery-folder-grid";

  var projectCard = document.createElement("div");
  projectCard.className = "gallery-folder-card";
  projectCard.innerHTML =
    '<div class="folder-icon"><i class="fas fa-images"></i></div>' +
    '<div class="folder-name">Project Photos</div>';
  projectCard.addEventListener("click", function() {
    openSubfolder("Project Photos");
  });
  grid.appendChild(projectCard);

  var siteCard = document.createElement("div");
  siteCard.className = "gallery-folder-card";
  siteCard.innerHTML =
    '<div class="folder-icon"><i class="fas fa-hard-hat"></i></div>' +
    '<div class="folder-name">Site Photos</div>';
  siteCard.addEventListener("click", function() {
    openSubfolder("Site Photos");
  });
  grid.appendChild(siteCard);

  container.appendChild(grid);
  root.appendChild(container);
}

function openSubfolder(subfolderName) {
  __galleryState.currentSubfolder = subfolderName;
  __galleryState.view = "viewer";
  __galleryState.images = [];
  __galleryState.currentIndex = 0;
  renderGalleryViewerFromSubfolder();
}

function renderGalleryViewerFromSubfolder() {
  var container = document.getElementById("gallery-root");
  if (!container) return;
  container.innerHTML = "";

  var wrap = document.createElement("div");
  wrap.className = "gallery-container";

  var header = document.createElement("div");
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.gap = "10px";
  header.style.flexWrap = "wrap";

  var backBtn = document.createElement("button");
  backBtn.className = "gallery-back-btn";
  backBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Back';
  backBtn.addEventListener("click", function() {
    __galleryState.view = "photos";
    __galleryState.currentSubfolder = null;
    renderGallerySubfolders();
  });
  header.appendChild(backBtn);

  var title = document.createElement("h2");
  title.style.fontSize = "18px";
  title.style.fontWeight = "700";
  title.style.color = "#0f2042";
  title.style.margin = "0";
  title.textContent = esc(__galleryState.currentSubfolder || "Photos");
  header.appendChild(title);

  wrap.appendChild(header);

  var sub = document.createElement("p");
  sub.style.fontSize = "13px";
  sub.style.color = "#5e6778";
  sub.style.margin = "4px 0 12px 0";
  sub.textContent = esc(__galleryState.currentFolder ? __galleryState.currentFolder.name : "");
  wrap.appendChild(sub);

  // No preemptive loading indicator; wait for API response
  container.appendChild(wrap);

  var folderPath = __galleryState.currentFolder ? __galleryState.currentFolder.path : "";
  var subfolder = __galleryState.currentSubfolder || "";
  fetch("/api/gallery/images?path=" + encodeURIComponent(folderPath) + "&subfolder=" + encodeURIComponent(subfolder))
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var imgs = Array.isArray(data) ? data : [];
      __galleryState.images = imgs;
      __galleryState.currentIndex = 0;
      renderGalleryViewer(wrap);
    })
    .catch(function(err) {
      console.error("Gallery images error:", err);
      wrap.innerHTML = '<div class="card" style="text-align:center;padding:40px;">Unable to load images.</div>';
    });
}

function renderGalleryViewer(container) {
  var images = __galleryState.images;
  console.log("[Gallery] renderGalleryViewer called, images.length:", images.length);
  if (!images.length) {
    // Keep existing header/back button, only replace body
    var existingChildren = container.querySelectorAll(".gallery-viewer-wrapper, .gallery-controls-bar");
    existingChildren.forEach(function(el) { el.remove(); });
    
    var empty = document.createElement("div");
    empty.className = "card";
    empty.style.textAlign = "center";
    empty.style.padding = "40px";
    var iconClass = __galleryState.currentSubfolder === "Site Photos" ? "fa-hard-hat" : "fa-camera";
    var message = __galleryState.currentSubfolder === "Site Photos" ? "No site photos at the moment." : "No project photos at the moment.";
    empty.innerHTML = '<div class="folder-icon" style="font-size:48px;color:#9ca3af;margin-bottom:12px;"><i class="fas ' + iconClass + '"></i></div><div style="font-size:15px;color:#5e6778;">' + message + '</div>';
    container.appendChild(empty);
    document.getElementById("gallery-root").appendChild(container);
    return;
  }

  var idx = __galleryState.currentIndex;

  var viewerWrap = document.createElement("div");
  viewerWrap.className = "gallery-viewer-wrapper";

  var prevBtn = document.createElement("button");
  prevBtn.className = "gallery-nav-btn gallery-prev";
  prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prevBtn.addEventListener("click", function() { navigateGallery(-1); });

  var nextBtn = document.createElement("button");
  nextBtn.className = "gallery-nav-btn gallery-next";
  nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
  nextBtn.addEventListener("click", function() { navigateGallery(1); });

  var img = document.createElement("img");
  img.className = "gallery-viewer-image";
  img.alt = "Gallery image " + (idx + 1);
  img.src = images[idx].url;

  viewerWrap.appendChild(prevBtn);
  viewerWrap.appendChild(nextBtn);
  viewerWrap.appendChild(img);

  container.appendChild(viewerWrap);

  var controls = document.createElement("div");
  controls.className = "gallery-controls-bar";

  var counter = document.createElement("div");
  counter.className = "gallery-counter";
  counter.textContent = "Image " + (idx + 1) + " of " + images.length;
  controls.appendChild(counter);

  var fullBtn = document.createElement("button");
  fullBtn.className = "gallery-fullscreen-btn";
  fullBtn.innerHTML = '<i class="fas fa-expand"></i> Fullscreen';
  fullBtn.addEventListener("click", function() { openGalleryFullscreen(img); });
  controls.appendChild(fullBtn);

  container.appendChild(controls);
  document.getElementById("gallery-root").appendChild(container);

  window.__galleryImgElement = img;
  window.__galleryViewerWrap = viewerWrap;
}

function navigateGallery(dir) {
  var images = __galleryState.images;
  if (!images.length) return;
  __galleryState.currentIndex = (__galleryState.currentIndex + dir + images.length) % images.length;
  var idx = __galleryState.currentIndex;

  var img = window.__galleryImgElement;
  if (img) {
    img.classList.remove("gallery-viewer-slide-left", "gallery-viewer-slide-right");
    img.classList.add(dir > 0 ? "gallery-viewer-slide-left" : "gallery-viewer-slide-right");
    img.src = images[idx].url;
    img.alt = "Gallery image " + (idx + 1);
  }

  var counter = document.querySelector(".gallery-counter");
  if (counter) counter.textContent = "Image " + (idx + 1) + " of " + images.length;
}

function openGalleryFullscreen(imgEl) {
  if (!imgEl) return;
  var overlay = document.createElement("div");
  overlay.className = "gallery-overlay";
  overlay.innerHTML =
    '<button class="gallery-overlay-close">&times;</button>' +
    '<img src="' + esc(imgEl.src) + '" alt="Fullscreen" />';
  document.body.appendChild(overlay);

  function close() { document.body.removeChild(overlay); }
  overlay.querySelector(".gallery-overlay-close").addEventListener("click", close);
  overlay.addEventListener("click", function(e) { if (e.target === overlay) close(); });

  function onKey(e) {
    if (e.key === "Escape") { close(); document.removeEventListener("keydown", onKey); }
  }
  document.addEventListener("keydown", onKey);
}
