/**
 * NSIP KM1 Layout Viewer
 * Production module for interactive unit availability map
 */

(function() {
    'use strict';

    var SVG_MAP_CONFIG = {
        slug: 'svg-map',
        name: 'NSIP KM1 Layout',
        icon: 'fa-map',
        svgUrl: '/static/NSIP_Master.svg',
        apiUrl: '/api/layout/nsip'
    };

    var layoutData = [];
    var allUnitMap = {};
    var modalEl = null;
    var copyFeedbackEl = null;

    function init() {
        var panel = document.getElementById('view-svg-map');
        if (!panel) {
            console.warn('NSIP KM1 Layout view panel not found.');
            return;
        }
        renderLayoutViewer();
    }

    function renderLayoutViewer() {
        var panel = document.getElementById('view-svg-map');
        if (!panel) return;

        panel.innerHTML = '';

        var wrapper = document.createElement('div');
        wrapper.id = 'svg-map-wrapper';

        var header = document.createElement('div');
        header.className = 'svg-map-header';
        header.innerHTML = '<h2><i class="fas fa-map"></i> NSIP KM1 Layout</h2>' +
            '<p class="svg-map-subtitle">Interactive unit availability map</p>';
        wrapper.appendChild(header);

        var stage = document.createElement('div');
        stage.className = 'svg-map-stage';
        stage.id = 'svg-map-stage';
        stage.innerHTML = '<div class="svg-loading-indicator">Loading layout...</div>';
        wrapper.appendChild(stage);

        panel.appendChild(wrapper);

        loadLayoutData().then(function() {
            loadSvgInline(stage);
        });
    }

    function loadLayoutData() {
        return fetch(SVG_MAP_CONFIG.apiUrl)
            .then(function(response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.json();
            })
            .then(function(json) {
                var data = (json && json.data) ? json.data : [];
                if (!Array.isArray(data)) data = [];
                layoutData = data;
                console.log('Layout API loaded:', layoutData.length, 'units');

                allUnitMap = {};
                layoutData.forEach(function(unit) {
                    var raw = String(unit.Unit_No).trim().toUpperCase();
                    var stripped = raw.replace(/^([A-Z]+)0+(\d)/, '$1$2');
                    allUnitMap[stripped] = unit;
                    allUnitMap[raw] = unit;
                    var padded = raw.replace(/^([A-Z]+)(\d)$/, '$10$2');
                    if (padded !== raw) allUnitMap[padded] = unit;
                });
                console.log('Unit map built:', Object.keys(allUnitMap).length, 'entries');
            })
            .catch(function(error) {
                console.error('Failed to load layout data:', error);
                layoutData = [];
                allUnitMap = {};
            });
    }

    function normalizeUnitId(rawId) {
        if (!rawId) return null;
        var s = String(rawId).trim().toUpperCase().replace(/\s+/g, '').replace(/-/g, '');
        return s.replace(/^([A-Z]+)0+(\d)/, '$1$2');
    }

    function loadSvgInline(stage) {
        fetch(SVG_MAP_CONFIG.svgUrl)
            .then(function(response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.text();
            })
            .then(function(svgMarkup) {
                stage.innerHTML = svgMarkup;

                var svg = stage.querySelector('svg');
                if (svg) {
                    svg.setAttribute('width', '100%');
                    svg.setAttribute('height', '100%');
                    svg.style.display = 'block';
                    svg.style.background = '#f4f6fa';
                    svg.style.borderRadius = '6px';
                }

                applyAvailableUnits();
                createModal();
                bindSvgInteractions();
            })
            .catch(function(error) {
                console.error('Failed to load SVG:', error);
                stage.innerHTML = '<div class="svg-error-indicator">Failed to load layout. Please refresh the page.</div>';
            });
    }

    function applyAvailableUnits() {
        var polygons = document.querySelectorAll('#svg-map-stage svg path, #svg-map-stage svg polygon, #svg-map-stage svg rect, #svg-map-stage svg circle, #svg-map-stage svg ellipse');
        var totalUnitPolygons = 0;
        var availableCount = 0;
        var missingFromSvg = [];

        // Step 1: Default ALL polygons to not-available
        polygons.forEach(function(p) {
            if (!p.id) return;
            if (p.id.match(/^[A-Z]\d/) && !p.id.match(/^(svg|defs|namedview|layer|image|false)$/i)) {
                totalUnitPolygons++;
                p.classList.add('not-available');
            }
        });

        // Step 2: Override available units from database
        layoutData.forEach(function(unit) {
            var key = normalizeUnitId(unit.Unit_No);
            if (!key) return;
            var poly = document.getElementById(key);
            if (!poly) {
                poly = document.getElementById(String(unit.Unit_No).trim());
            }
            if (poly) {
                poly._unitData = unit;
                if (String(unit.Status).trim().toLowerCase() === 'available') {
                    poly.classList.remove('not-available');
                    poly.classList.add('available');
                    availableCount++;
                }
            }
        });

        // Use DB available count for KPI
        var dbAvailableCount = layoutData.filter(function(u) {
            return String(u.Status).trim().toLowerCase() === 'available';
        }).length;
        var soldCount = totalUnitPolygons - dbAvailableCount;
        console.log('Total polygons:', totalUnitPolygons, '| DB Available:', dbAvailableCount, '| Sold:', soldCount);

        renderLayoutSummary(totalUnitPolygons, dbAvailableCount, soldCount);
    }

    function renderLayoutSummary(totalUnits, availableUnits, soldUnits) {
        var stage = document.getElementById('svg-map-stage');
        if (!stage) return;

        var oldSummary = document.getElementById('layout-summary-section');
        if (oldSummary) oldSummary.remove();

        var summary = document.createElement('div');
        summary.id = 'layout-summary-section';
        summary.style.cssText = 'margin-top:16px;display:flex;flex-direction:column;gap:12px;';

        summary.innerHTML =
            '<div style="display:flex;gap:12px;flex-wrap:wrap;">' +
            '  <div style="flex:1;min-width:140px;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:14px 16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);text-align:center;">' +
            '    <div style="font-size:11px;color:#5e6778;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:4px;">Available Units</div>' +
            '    <div style="font-size:26px;font-weight:700;color:#00cc44;">' + availableUnits + '</div>' +
            '  </div>' +
            '  <div style="flex:1;min-width:140px;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:14px 16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);text-align:center;">' +
            '    <div style="font-size:11px;color:#5e6778;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:4px;">Sold / Not Available</div>' +
            '    <div style="font-size:26px;font-weight:700;color:#9E9E9E;">' + soldUnits + '</div>' +
            '  </div>' +
            '  <div style="flex:1;min-width:140px;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;padding:14px 16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);text-align:center;">' +
            '    <div style="font-size:11px;color:#5e6778;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:4px;">Total Units</div>' +
            '    <div style="font-size:26px;font-weight:700;color:#0f2042;">' + totalUnits + '</div>' +
            '  </div>' +
            '</div>' +
            '<div style="display:flex;gap:16px;align-items:center;padding:8px 16px;background:#ffffff;border:1px solid #eef0f4;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06);font-size:12px;color:#5e6778;">' +
            '  <div style="display:flex;align-items:center;gap:6px;"><span style="width:12px;height:12px;border-radius:3px;background:#00E676;display:inline-block;"></span> Available</div>' +
            '  <div style="display:flex;align-items:center;gap:6px;"><span style="width:12px;height:12px;border-radius:3px;background:#9E9E9E;display:inline-block;"></span> Sold / Not Available</div>' +
            '</div>';

        stage.parentNode.insertBefore(summary, stage.nextSibling);
    }

    function bindSvgInteractions() {
        var svg = document.querySelector('#svg-map-stage svg');
        if (!svg) return;

        svg.addEventListener('mouseover', function(e) {
            var target = e.target;
            if (target && target.id && target.classList) {
                target.style.fillOpacity = target.classList.contains('available') ? '0.90' : '0.35';
            }
        });

        svg.addEventListener('mouseout', function(e) {
            var target = e.target;
            if (target && target.id && target.classList) {
                target.style.fillOpacity = target.classList.contains('available') ? '0.75' : '0.18';
            }
        });

        svg.addEventListener('click', function(e) {
            var target = e.target;
            if (target && target.id) {
                var tag = target.tagName;
                if (tag === 'path' || tag === 'polygon' || tag === 'rect' || tag === 'circle' || tag === 'ellipse') {
                    var unit = target._unitData || null;
                    showModal(unit, target.id);
                }
            }
        });
    }

    function createModal() {
        if (modalEl) return;

        modalEl = document.createElement('div');
        modalEl.id = 'layout-unit-modal';
        modalEl.style.display = 'none';
        modalEl.innerHTML =
            '<div class="layout-modal-overlay" id="modalOverlay"></div>' +
            '<div class="layout-modal">' +
            '  <div class="layout-modal-header">' +
            '    <span class="layout-modal-title">Unit Details</span>' +
            '    <button class="layout-modal-close" id="modalCloseBtn">&times;</button>' +
            '  </div>' +
            '  <div class="layout-modal-body" id="modalBody"></div>' +
            '  <div class="layout-modal-footer">' +
            '    <button class="layout-copy-btn" id="modalCopyBtn"><i class="fas fa-copy"></i> Copy Details</button>' +
            '  </div>' +
            '</div>';
        document.body.appendChild(modalEl);

        copyFeedbackEl = document.createElement('div');
        copyFeedbackEl.id = 'layout-copy-feedback';
        copyFeedbackEl.textContent = 'Copied!';
        copyFeedbackEl.style.display = 'none';
        document.body.appendChild(copyFeedbackEl);

        document.getElementById('modalCloseBtn').addEventListener('click', hideModal);
        document.getElementById('modalOverlay').addEventListener('click', hideModal);
        document.getElementById('modalCopyBtn').addEventListener('click', copyModalContent);
    }

    function showModal(unit, svgId) {
        if (!modalEl) return;
        var modalBody = document.getElementById('modalBody');
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
        var commRes = unit ? String(unit.Commercial_Residential || '') : '';
        var builtUp = unit ? String(unit.Built_Up || '') : '';
        var landArea = unit ? String(unit.Land_Area || '') : '';
        var bankCharge = unit ? formatPrice(unit.Bank_Charge) : '';
        var price = unit ? formatPrice(unit.Listing_Price || unit.SPA_Signed_Price || unit.Price || 0) : '';

        var statusClass = '';
        var statusDisplay = 'Not Available';
        if (status.toLowerCase() === 'available') {
            statusClass = ' modal-status-available';
            statusDisplay = 'Available';
        } else if (status) {
            statusClass = ' modal-status-not-available';
            statusDisplay = status;
        }

        modalBody.innerHTML =
            '<div class="modal-row"><span class="modal-label">Unit</span><span class="modal-value">' + (displayId || '-') + '</span></div>' +
            '<div class="modal-row"><span class="modal-label">Status</span><span class="modal-value' + statusClass + '">' + statusDisplay + '</span></div>' +
            '<div class="modal-divider"></div>' +
            '<div class="modal-row"><span class="modal-label">Project</span><span class="modal-value">' + (project || '-') + '</span></div>' +
            '<div class="modal-row"><span class="modal-label">Property Type</span><span class="modal-value">' + (propertyType || '-') + '</span></div>' +
            '<div class="modal-row"><span class="modal-label">Property Ownership</span><span class="modal-value">' + (ownership || '-') + '</span></div>' +
            '<div class="modal-row"><span class="modal-label">Block</span><span class="modal-value">' + (block || '-') + '</span></div>' +
            '<div class="modal-row"><span class="modal-label">Phase</span><span class="modal-value">' + (phase || '-') + '</span></div>' +
            '<div class="modal-row"><span class="modal-label">Lot No</span><span class="modal-value">' + (lotNo || '-') + '</span></div>' +
            '<div class="modal-row"><span class="modal-label">Unit Type</span><span class="modal-value">' + (unitType || '-') + '</span></div>' +
            '<div class="modal-row"><span class="modal-label">Built Up</span><span class="modal-value">' + (builtUp || '-') + '</span></div>' +
            '<div class="modal-row"><span class="modal-label">Land Area</span><span class="modal-value">' + (landArea || '-') + '</span></div>' +
            '<div class="modal-row"><span class="modal-label">Bank Charge</span><span class="modal-value">' + (bankCharge || '-') + '</span></div>' +
            '<div class="modal-row"><span class="modal-label">Price</span><span class="modal-value">' + (price || '-') + '</span></div>' +
            '<div class="modal-row"><span class="modal-label">Commercial / Residential</span><span class="modal-value">' + (commRes || '-') + '</span></div>';

        modalEl.style.display = 'flex';
    }

    function hideModal() {
        if (modalEl) modalEl.style.display = 'none';
    }

    function copyModalContent() {
        var bodyEl = document.getElementById('modalBody');
        if (!bodyEl) return;
        var text = bodyEl.innerText || bodyEl.textContent || '';
        if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text.trim()).then(showCopyFeedback).catch(function() {
                fallbackCopy(text.trim());
            });
        } else {
            fallbackCopy(text.trim());
        }
    }

    function fallbackCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); showCopyFeedback(); } catch(e) { console.error('Copy failed', e); }
        document.body.removeChild(ta);
    }

    function showCopyFeedback() {
        if (!copyFeedbackEl) return;
        copyFeedbackEl.style.display = 'block';
        copyFeedbackEl.style.left = (window.innerWidth / 2 - 40) + 'px';
        copyFeedbackEl.style.top = (window.innerHeight / 2) + 'px';
        setTimeout(function() { copyFeedbackEl.style.display = 'none'; }, 2000);
    }

    function formatPrice(val) {
        try {
            if (!val || Number(val) === 0) return '-';
            return 'RM ' + Number(val).toLocaleString('en-MY', {minimumFractionDigits:0, maximumFractionDigits:0});
        } catch(e) { return '-'; }
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') hideModal();
    });

    window.initLayoutViewer = init;
})();