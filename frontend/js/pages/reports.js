// js/pages/reports.js

const CHART_COLORS = ["#0F6E6C", "#E8A94A", "#5B6B6A", "#C0503F", "#8B5FBF", "#3A8FB7"];

function groupCount(arr, key) {
  const counts = {};
  arr.forEach(item => {
    const k = item[key] || "Unassigned";
    counts[k] = (counts[k] || 0) + 1;
  });
  return counts;
}

function donutChart(counts, total, centerLabel) {
  const entries = Object.entries(counts);
  let cumulative = 0;
  const stops = entries.map(([label, count], i) => {
    const pct = total > 0 ? (count / total) * 100 : 0;
    const start = cumulative;
    cumulative += pct;
    const color = CHART_COLORS[i % CHART_COLORS.length];
    return `${color} ${start}% ${cumulative}%`;
  }).join(", ");

  const legend = entries.map(([label, count], i) => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${CHART_COLORS[i % CHART_COLORS.length]};"></div>
      <div class="legend-label">${esc(label)}</div>
      <div class="legend-count">${count}</div>
    </div>`).join("");

  return `
    <div class="donut-wrap">
      <div class="donut-chart" style="background: conic-gradient(${stops || "var(--line) 0% 100%"});">
        <div class="donut-hole"><div class="donut-hole-num">${total}</div><div class="donut-hole-label">${centerLabel}</div></div>
      </div>
      <div class="donut-legend">${legend || `<div style="color:var(--slate);font-size:13px;">No data yet.</div>`}</div>
    </div>`;
}

function renderReports() {
  const data = getData();

  document.getElementById("statCards").innerHTML = `
    <div class="card"><div class="card-label">Total patients</div><div class="card-value font-display">${data.patients.length}</div></div>
    <div class="card"><div class="card-label">Total appointments</div><div class="card-value font-display">${data.appointments.length}</div></div>
    <div class="card"><div class="card-label">Clinics</div><div class="card-value font-display">${data.clinics.length}</div></div>
    <div class="card"><div class="card-label">Staff members</div><div class="card-value font-display">${data.users.length}</div></div>
  `;

  document.getElementById("deptChart").innerHTML = donutChart(groupCount(data.patients, "dept"), data.patients.length, "Patients");
  document.getElementById("roleChart").innerHTML = donutChart(groupCount(data.users, "role"), data.users.length, "Staff");

  document.getElementById("clinicStatus").innerHTML = data.clinics.map(c => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--line);">
      <div><div style="font-weight:600;font-size:13.5px;">${esc(c.name)}</div><div style="font-size:12px;color:var(--slate);">${esc(c.location || "")}</div></div>
      ${badge("Active")}
    </div>`).join("");

  const byApptStatus = groupCount(data.appointments, "status");
  document.getElementById("apptStatus").innerHTML = Object.entries(byApptStatus).map(([status, count]) => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--line);">
      ${badge(status)}<span style="font-weight:700;font-size:14px;">${count}</span>
    </div>`).join("");
}

document.addEventListener("DOMContentLoaded", renderReports);