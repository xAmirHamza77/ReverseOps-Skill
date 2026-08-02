/* ReverseOps panel v2 — dependency-free dashboard + local terminal bridge.
 * Data: window.REVERSEOPS_DATA (scripts/mkreport.py) or bundled sample.
 * Server features (terminal, report bodies, regen) activate when served by panel/serve.py. */
(function () {
  "use strict";

  var D = window.REVERSEOPS_DATA;
  if (!D) { document.body.innerHTML = "<p style='color:#ff2a5f;font-family:monospace;padding:40px'>Error: no data.js or sample.data.js found</p>"; return; }
  if (window.REVERSEOPS_DATA_IS_SAMPLE) document.getElementById("demo-badge").classList.remove("hidden");

  var SEV = ["critical", "high", "medium", "low", "info"];
  // Map logic to our new CSS variables/colors
  var SEV_COLOR = { critical: "#ff2a5f", high: "#ff7a00", medium: "#f59e0b", low: "#0ea5e9", info: "#8b5cf6" };
  var STATUS_COLOR = { open: "#ff7a00", confirmed: "#ff2a5f", fixed: "#10b981", accepted: "#8b5cf6", "false-positive": "#9ca3af" };
  
  var ALL_FINDINGS = D.findings || [];
  var ALL_REPORTS = D.reports || [];

  var state = {
    project: null,            // null = all projects
    sev: {}, status: "", query: "", expanded: {}
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function $(id) { return document.getElementById(id); }
  function caseOf(f) {
    return f.case || (f.target || {}).host || f.report || "unscoped";
  }

  /* ================================================ projects sidebar */
  var projectMap = {};
  ALL_FINDINGS.forEach(function (f) {
    var c = caseOf(f);
    (projectMap[c] = projectMap[c] || { name: c, findings: 0, reports: {} }).findings++;
    if (f.report) projectMap[c].reports[f.report] = true;
  });
  ALL_REPORTS.forEach(function (r) {
    var c = r.case || r.target || "unscoped";
    (projectMap[c] = projectMap[c] || { name: c, findings: 0, reports: {} }).reports[r.file] = true;
  });
  var projects = Object.keys(projectMap).sort();
  projects.forEach(function (c) { projectMap[c].reportCount = Object.keys(projectMap[c].reports).length; });

  function renderSidebar() {
    var html = '<div class="proj' + (state.project === null ? " on" : "") + '" data-p="__all">' +
      '<span class="nm">All Projects</span><span class="ct">' + ALL_FINDINGS.length + "</span></div>";
    html += projects.map(function (c) {
      var p = projectMap[c];
      return '<div class="proj' + (state.project === c ? " on" : "") + '" data-p="' + esc(c) + '" title="' + esc(c) + '">' +
        '<span class="nm">' + esc(c) + '</span><span class="ct">' + p.findings + "</span></div>";
    }).join("");
    $("project-list").innerHTML = html;
    
    Array.prototype.forEach.call(document.querySelectorAll("#project-list .proj"), function (el) {
      el.addEventListener("click", function () {
        var p = el.getAttribute("data-p");
        state.project = p === "__all" ? null : p;
        state.expanded = {};
        renderAll();
        // Reset scroll position on project change
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  function projectFindings() {
    if (state.project === null) return ALL_FINDINGS;
    return ALL_FINDINGS.filter(function (f) { return caseOf(f) === state.project; });
  }
  function projectReports() {
    if (state.project === null) return ALL_REPORTS;
    return ALL_REPORTS.filter(function (r) { return (r.case || r.target || "unscoped") === state.project; });
  }

  /* ================================================ stats subset */
  function computeStats(findings) {
    var s = { by_severity: {}, by_status: {}, by_category: {}, by_case: {}, timeline: {}, attack_techniques: {} };
    SEV.forEach(function (x) { s.by_severity[x] = 0; });
    var weights = { critical: 10, high: 7, medium: 4, low: 1, info: 0.2 };
    var score = 0, open = 0;
    findings.forEach(function (f) {
      s.by_severity[f.severity] = (s.by_severity[f.severity] || 0) + 1;
      var st = f.status || "open";
      s.by_status[st] = (s.by_status[st] || 0) + 1;
      var cat = f.category || "other";
      s.by_category[cat] = (s.by_category[cat] || 0) + 1;
      var c = caseOf(f);
      s.by_case[c] = (s.by_case[c] || 0) + 1;
      if (f.discovered) s.timeline[f.discovered] = (s.timeline[f.discovered] || 0) + 1;
      (f.attack || []).forEach(function (t) { s.attack_techniques[t] = (s.attack_techniques[t] || 0) + 1; });
      if (st !== "fixed" && st !== "false-positive") { score += weights[f.severity] || 0; open++; }
    });
    s.risk_index = Math.round(Math.min(100, score * 100 / Math.max(10, open * 10)) * 10) / 10;
    return s;
  }

  /* ================================================ header + KPIs */
  $("generated").textContent = "data generated " + (D.generated || (D.stats || {}).generated || "?");

  function renderKPIs(findings, stats, reports) {
    var open = findings.filter(function (f) { var s = f.status || "open"; return s !== "fixed" && s !== "false-positive"; }).length;
    var kpis = [
      { n: findings.length, l: "Total Findings" },
      { n: stats.by_severity.critical || 0, l: "Critical", c: SEV_COLOR.critical },
      { n: stats.by_severity.high || 0, l: "High", c: SEV_COLOR.high },
      { n: open, l: "Actionable", c: STATUS_COLOR.open },
      { n: reports.length, l: "Reports" },
      { n: stats.risk_index, l: "Risk Index", c: "#6366f1", cls: "risk" },
    ];
    $("kpis").innerHTML = kpis.map(function (k) {
      return '<div class="kpi ' + (k.cls || "") + '"><div class="n" style="' + (k.c ? "color:" + k.c : "") + '">' + esc(k.n) + '</div><div class="l">' + esc(k.l) + "</div></div>";
    }).join("");
  }

  /* ================================================ charts */
  function hexToRgba(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  function donut(el, entries, colors) {
    entries = entries.filter(function (e) { return e.value > 0; });
    var total = entries.reduce(function (a, b) { return a + b.value; }, 0);
    if (!total) { el.innerHTML = '<div class="empty">No data available</div>'; return; }
    
    var R = 54, C = 2 * Math.PI * R, off = 0;
    
    var defs = '<defs>' + entries.map(function(e, i) {
      var baseColor = colors[e.key] || "#6366f1";
      return '<linearGradient id="grad_' + el.id + '_' + i + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
             '<stop offset="0%" stop-color="' + baseColor + '"/>' +
             '<stop offset="100%" stop-color="' + hexToRgba(baseColor, 0.4) + '"/>' +
             '</linearGradient>';
    }).join("") + '</defs>';

    var rings = entries.map(function (e, i) {
      var frac = e.value / total;
      var dash = Math.max(0, frac * C - 2);
      var gap = Math.max(0, C - frac * C + 2);
      var s = '<circle r="' + R + '" cx="70" cy="70" fill="none" stroke="url(#grad_' + el.id + '_' + i + ')' +
        '" stroke-width="16" stroke-linecap="round" stroke-dasharray="' + dash + ' ' + gap +
        '" stroke-dashoffset="' + (-off * C) + '"><title>' + esc(e.key) + ': ' + e.value + '</title></circle>';
      off += frac;
      return s;
    }).join("");
    
    el.innerHTML =
      '<svg width="140" height="140" viewBox="0 0 140 140">' + defs +
      '<g transform="rotate(-90 70 70)">' + rings + "</g>" +
      '<text x="70" y="70" text-anchor="middle" class="gauge-center" dominant-baseline="central">' + total + "</text>" +
      '</svg>' +
      '<div class="legend">' + entries.map(function (e) {
        var baseColor = colors[e.key] || "#6366f1";
        return '<div class="row" title="' + esc(e.key) + ': ' + e.value + '"><span class="dot" style="background:' + baseColor + '; box-shadow: 0 0 10px ' + hexToRgba(baseColor, 0.5) + ';"></span>' + esc(e.key) + ' <span class="v">' + e.value + "</span></div>";
      }).join("") + "</div>";
  }

  function bars(el, obj, opts) {
    opts = opts || {};
    var keys = Object.keys(obj || {});
    if (!keys.length) { el.innerHTML = '<div class="empty">No data available</div>'; return; }
    var max = Math.max.apply(null, keys.map(function (k) { return obj[k]; }), 1);
    var color = opts.color || "#6366f1";
    
    el.innerHTML = '<div class="bars">' + keys.slice(0, opts.limit || 10).map(function (k) {
      var pct = Math.round(100 * obj[k] / max);
      return '<div class="bar-row" title="' + esc(k) + ': ' + obj[k] + '"><span class="name">' + esc(k) + '</span>' +
        '<span class="bar-track"><span class="bar-fill" style="width:' + pct + '%; background: linear-gradient(90deg, ' + color + ', ' + hexToRgba(color, 0.5) + '); box-shadow: 0 0 10px ' + hexToRgba(color, 0.4) + ';"></span></span>' +
        '<span class="val">' + obj[k] + "</span></div>";
    }).join("") + "</div>";
  }

  function timeline(el, obj) {
    var dates = Object.keys(obj || {}).sort();
    if (!dates.length) { el.innerHTML = '<div class="empty">No dated findings</div>'; return; }
    var W = Math.max(el.clientWidth - 20, 280), H = 180, padL = 30, padB = 26, padT = 12, padR = 8;
    var vals = dates.map(function (d) { return obj[d]; });
    var maxV = Math.max.apply(null, vals.concat([1]));
    var iw = (W - padL - padR) / Math.max(dates.length - 1, 1);
    function x(i) { return padL + i * iw; }
    function y(v) { return H - padB - (v / maxV) * (H - padB - padT); }
    var pts = vals.map(function (v, i) { return x(i) + "," + y(v); }).join(" ");
    var area = "M" + padL + "," + (H - padB) + " L" + pts.replace(/ /g, " L") + " L" + x(vals.length - 1) + "," + (H - padB) + " Z";
    
    var dots = vals.map(function (v, i) {
      return '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="4" fill="#6366f1" stroke="#0a0a0f" stroke-width="2"><title>' + dates[i] + ": " + v + "</title></circle>";
    }).join("");
    
    var grid = "";
    for (var g = 0; g <= maxV; g += Math.max(1, Math.ceil(maxV / 4))) {
      grid += '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y(g) + '" y2="' + y(g) + '" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>' +
        '<text x="' + (padL - 10) + '" y="' + (y(g) + 3) + '" text-anchor="end">' + g + "</text>";
    }
    var labels = dates.map(function (d, i) {
      if (dates.length > 12 && i % Math.ceil(dates.length / 12)) return "";
      return '<text x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + d.slice(5) + "</text>";
    }).join("");
    
    el.innerHTML = '<svg width="100%" height="' + H + '" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none">' +
      '<defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#6366f1" stop-opacity=".4"/><stop offset="1" stop-color="#6366f1" stop-opacity="0"/></linearGradient></defs>' +
      grid + '<path d="' + area + '" fill="url(#ag)"/>' +
      '<polyline points="' + pts + '" fill="none" stroke="#6366f1" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" filter="drop-shadow(0px 4px 6px rgba(99,102,241,0.3))"/>' + dots + labels + "</svg>";
  }

  function renderCharts(stats) {
    donut($("chart-severity"), SEV.map(function (s) { return { key: s, value: stats.by_severity[s] || 0 }; }), SEV_COLOR);
    donut($("chart-status"), Object.keys(stats.by_status).map(function (k) { return { key: k, value: stats.by_status[k] }; }), STATUS_COLOR);
    bars($("chart-category"), stats.by_category, { color: "#38bdf8" });
    bars($("chart-attack"), stats.attack_techniques, { limit: 12, color: "#8b5cf6" });
    timeline($("chart-timeline"), stats.timeline);
  }

  /* ================================================ findings table */
  var sevOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

  $("sev-filter").innerHTML = SEV.map(function (s) {
    return '<span class="chip ' + s + '" data-sev="' + s + '">' + s + "</span>";
  }).join("");
  Array.prototype.forEach.call(document.querySelectorAll("#sev-filter .chip"), function (chip) {
    chip.addEventListener("click", function () {
      var s = chip.getAttribute("data-sev");
      state.sev[s] = !state.sev[s];
      chip.classList.toggle("on", state.sev[s]);
      renderTable();
    });
  });
  $("status-filter").addEventListener("change", function (e) { state.status = e.target.value; renderTable(); });
  $("q").addEventListener("input", function (e) { state.query = e.target.value.toLowerCase(); renderTable(); });

  function rowMatches(f) {
    var anySev = SEV.some(function (s) { return state.sev[s]; });
    if (anySev && !state.sev[f.severity]) return false;
    if (state.status && (f.status || "open") !== state.status) return false;
    if (state.query) {
      var hay = [f.id, f.title, (f.target || {}).host, (f.target || {}).url, f.case, f.category].join(" ").toLowerCase();
      if (hay.indexOf(state.query) === -1) return false;
    }
    return true;
  }

  function detailHtml(f) {
    var meta = [];
    if (f.cwe) meta.push('<span class="badge">CWE-' + esc(f.cwe) + "</span>");
    if (f.owasp) meta.push('<span class="badge">' + esc(f.owasp) + "</span>");
    (f.attack || []).forEach(function (t) { meta.push('<span class="badge">' + esc(t) + "</span>"); });
    if (f.cvss != null) meta.push('<span class="badge" style="border-color:var(--accent);color:var(--accent);">CVSS ' + esc(f.cvss) + "</span>");
    
    var ev = (f.evidence || []).map(function (e) {
      return '<div class="mono dim" style="margin-bottom:4px;padding:4px 8px;background:rgba(0,0,0,0.2);border-radius:4px;">[' + esc(e.kind) + "] <span style='color:#f3f4f6'>" + esc(e.ref) + "</span>" + (e.note ? " — " + esc(e.note) : "") + "</div>";
    }).join("");
    
    return '<td colspan="7"><div class="detail-content"><div class="meta">' + meta.join("") + "</div>" +
      ((f.target && (f.target.host || f.target.url || f.target.asset)) ?
        '<div class="mono" style="color:var(--text-main);background:rgba(255,255,255,0.05);padding:8px 12px;border-radius:6px;border-left:3px solid var(--accent);">Target: ' + esc(f.target.url || f.target.host || f.target.asset) + "</div>" : "") +
      '<div class="cols"><div>' +
      (f.poc ? "<h3>Proof of Concept</h3><pre>" + esc(f.poc) + "</pre>" : "") +
      (ev ? "<h3>Evidence</h3>" + ev : "") +
      "</div><div>" +
      (f.remediation ? "<h3>Remediation</h3><pre>" + esc(f.remediation) + "</pre>" : "") +
      (f.report ? '<div class="mono dim" style="margin-top:16px;">Source Report: ' + esc(f.report) + "</div>" : "") +
      "</div></div></div></td>";
  }

  function renderTable() {
    var rows = projectFindings().filter(rowMatches).sort(function (a, b) {
      return (sevOrder[a.severity] - sevOrder[b.severity]) || String(a.id).localeCompare(String(b.id));
    });
    $("findings-count").textContent = rows.length + " match";
    var tb = document.querySelector("#findings tbody");
    tb.innerHTML = rows.map(function (f, i) {
      var st = f.status || "open";
      var head = '<tr class="frow" data-i="' + i + '">' +
        '<td class="idcell">' + esc(f.id) + "</td>" +
        '<td><span class="pill ' + esc(f.severity) + '">' + esc(f.severity) + "</span></td>" +
        '<td style="font-weight:500;color:#fff;">' + esc(f.title) + "</td>" +
        '<td class="dim">' + esc(f.category || "—") + "</td>" +
        '<td class="dim">' + esc(caseOf(f)) + "</td>" +
        '<td><span class="pill ' + esc(st) + '">' + esc(st) + "</span></td>" +
        '<td class="dim mono">' + esc(f.discovered || "—") + "</td></tr>";
      if (state.expanded[f.id]) head += '<tr class="detail">' + detailHtml(f) + "</tr>";
      return head;
    }).join("");
    $("empty").classList.toggle("hidden", rows.length > 0);
    Array.prototype.forEach.call(tb.querySelectorAll(".frow"), function (tr) {
      tr.addEventListener("click", function () {
        var f = rows[+tr.getAttribute("data-i")];
        state.expanded[f.id] = !state.expanded[f.id];
        renderTable();
      });
    });
  }

  /* ================================================ reports + modal */
  function miniMd(src) {
    var out = [], inCode = false, code = [];
    esc(src).split("\n").forEach(function (line) {
      if (/^```/.test(line)) {
        if (inCode) { out.push("<pre><code>" + code.join("\n") + "</code></pre>"); code = []; inCode = false; }
        else inCode = true;
        return;
      }
      if (inCode) { code.push(line); return; }
      var l = line
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
      var m;
      if ((m = l.match(/^(#{1,4})\s+(.*)/))) out.push("<h" + m[1].length + ">" + m[2] + "</h" + m[1].length + ">");
      else if (/^\s*$/.test(l)) out.push("");
      else if (/^---+$/.test(l.trim())) out.push("<hr>");
      else if ((m = l.match(/^\s*[-*]\s+(.*)/))) out.push("<ul><li>" + m[1] + "</li></ul>");
      else if ((m = l.match(/^\s*\d+\.\s+(.*)/))) out.push("<ol><li>" + m[1] + "</li></ol>");
      else if ((m = l.match(/^&gt;\s?(.*)/))) out.push("<blockquote>" + m[1] + "</blockquote>");
      else out.push("<p>" + l + "</p>");
    });
    // merge adjacent lists
    return out.join("\n")
      .replace(/<\/ul>\n<ul>/g, "")
      .replace(/<\/ol>\n<ol>/g, "");
  }

  function openModal(title, html) {
    $("modal-title").textContent = title;
    $("modal-body").innerHTML = html;
    $("modal").classList.remove("hidden");
    document.body.style.overflow = "hidden"; // prevent background scroll
  }
  function closeModal() {
    $("modal").classList.add("hidden");
    document.body.style.overflow = "";
  }
  
  $("modal-close").addEventListener("click", closeModal);
  $("modal").addEventListener("click", function (e) { if (e.target.classList.contains("modal-backdrop") || e.target === $("modal")) closeModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });

  function renderReports() {
    var reports = projectReports();
    $("reports").innerHTML = reports.length ? reports.map(function (r, i) {
      return '<div class="report-card"><div class="t">' + esc(r.title || r.file) + "</div>" +
        '<div class="m">' + esc(r.file) + "<br>" + esc(r.target || "—") + " · " + esc(r.date || "—") + "</div>" +
        '<div class="foot"><span class="n">' + esc(r.findings) + " finding(s)</span>" +
        (serverMode ? '<button class="btn btn-ghost rview" data-i="' + i + '">Read Report</button>' : "") +
        "</div></div>";
    }).join("") : '<div class="empty">No reports in this context. Drop markdown into reports/ and run regen.</div>';
    
    Array.prototype.forEach.call(document.querySelectorAll(".rview"), function (btn) {
      btn.addEventListener("click", function () {
        var r = reports[+btn.getAttribute("data-i")];
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg> Loading...';
        btn.disabled = true;
        
        fetch("/api/report?file=" + encodeURIComponent(r.file))
          .then(function (res) { return res.json(); })
          .then(function (j) {
            openModal(r.file, j.content ? miniMd(j.content) : "<p class='dim'>" + esc(j.error || "unavailable") + "</p>");
            btn.innerHTML = 'Read Report';
            btn.disabled = false;
          })
          .catch(function (e) { 
            openModal(r.file, "<p class='dim'>Fetch failed: " + esc(e) + "</p>"); 
            btn.innerHTML = 'Read Report';
            btn.disabled = false; 
          });
      });
    });
  }

  /* ================================================ terminal */
  var serverMode = false;
  var termHistory = [], termIdx = -1;

  function termPrint(cls, text) {
    var out = $("term-out");
    var div = document.createElement("div");
    if (cls) div.className = cls;
    div.textContent = text;
    out.appendChild(div);
    out.scrollTop = out.scrollHeight;
  }

  function runCmd(cmd, mode) {
    termPrint("cmd-echo", (mode === "claude" ? "claude> " : "$ ") + cmd);
    $("term-in").disabled = true;
    fetch("/api/exec", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cmd: cmd, mode: mode })
    })
      .then(function (res) { return res.json(); })
      .then(function (j) {
        if (j.stdout) termPrint("", j.stdout.replace(/\n$/, ""));
        if (j.stderr) termPrint("t-err", j.stderr.replace(/\n$/, ""));
        termPrint("t-meta", "process exited with code " + j.code + " (" + j.elapsed + "s)" + (j.code === 0 && /mkreport\.py/.test(cmd) ? " — data regenerated, reloading workspace…" : ""));
        $("term-in").disabled = false;
        $("term-in").focus();
        if (j.code === 0 && /mkreport\.py/.test(cmd)) setTimeout(function () { location.reload(); }, 900);
      })
      .catch(function (e) {
        termPrint("t-err", "Command failed to execute: " + e);
        $("term-in").disabled = false;
      });
  }

  $("term-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var cmd = $("term-in").value.trim();
    if (!cmd || !serverMode) return;
    termHistory.push(cmd); termIdx = termHistory.length;
    $("term-in").value = "";
    runCmd(cmd, $("term-mode").value);
  });
  $("term-in").addEventListener("keydown", function (e) {
    if (e.key === "ArrowUp" && termIdx > 0) { termIdx--; $("term-in").value = termHistory[termIdx] || ""; e.preventDefault(); }
    if (e.key === "ArrowDown") { termIdx = Math.min(termIdx + 1, termHistory.length); $("term-in").value = termHistory[termIdx] || ""; e.preventDefault(); }
  });
  $("term-clear").addEventListener("click", function () { $("term-out").innerHTML = ""; });
  $("term-mode").addEventListener("change", function (e) {
    var isClaude = e.target.value === "claude";
    document.querySelector(".prompt-user").textContent = isClaude ? "claude" : "root@reverseops";
    $("term-prompt").textContent = isClaude ? ">" : "$";
    $("term-in").placeholder = isClaude ? "Enter prompt for Claude CLI..." : "Enter command...";
  });

  $("btn-mkreport").addEventListener("click", function () { runCmd("python3 scripts/mkreport.py", "shell"); });
  $("btn-howto").addEventListener("click", function () {
    alert("Run from repo root:\n\n  python3 scripts/mkreport.py\n\nthen reload this page.\n\nFor the terminal + report viewer, serve via:\n\n  python3 panel/serve.py");
  });

  /* ================================================ server detection */
  if (location.protocol === "http:" || location.protocol === "https:") {
    fetch("/api/ping").then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.ok) {
        serverMode = true;
        termPrint("t-meta", "[system] Connected to local execution server — workspace: " + j.repo);
        termPrint("t-meta", "[system] Ready for commands. Try: python3 scripts/mkreport.py or switch to 'Claude CLI' mode.");
      }
    }).catch(function () { /* stays offline */ })
      .finally(function () {
        $("term-offline").classList.toggle("hidden", serverMode);
        document.querySelectorAll(".server-only").forEach(function (el) { el.classList.toggle("hidden", !serverMode); });
        document.querySelectorAll(".file-only").forEach(function (el) { el.classList.toggle("hidden", serverMode); });
        renderReports(); // re-render to (un)hide view buttons
      });
  } else {
    $("term-offline").classList.remove("hidden");
    document.querySelectorAll(".server-only").forEach(function (el) { el.classList.add("hidden"); });
    document.querySelectorAll(".file-only").forEach(function (el) { el.classList.remove("hidden"); });
  }

  /* ================================================ render-all */
  function renderAll() {
    var findings = projectFindings();
    var reports = projectReports();
    var stats = computeStats(findings);
    
    if (state.project) {
      $("crumb").innerHTML = esc(state.project) + ' <span class="thin">— active context</span>';
    } else {
      $("crumb").innerHTML = 'All Projects <span class="thin">— global overview</span>';
    }
    
    renderSidebar();
    renderKPIs(findings, stats, reports);
    renderCharts(stats);
    renderTable();
    renderReports();
  }
  
  window.addEventListener("resize", function () {
    timeline($("chart-timeline"), computeStats(projectFindings()).timeline);
  });
  
  // Inject a small spin animation for loading state
  var style = document.createElement('style');
  style.innerHTML = '@keyframes spin { 100% { transform: rotate(360deg); } }';
  document.head.appendChild(style);

  renderAll();
})();
