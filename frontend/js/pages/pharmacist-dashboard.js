// js/pages/pharmacist-dashboard.js
let selectedRxId = null;

function renderPharmacistDashboard() {
  const data = getData();
  const dispensed = data.prescriptions.filter(p => p.status === "Dispensed").length;
  const pending = data.prescriptions.filter(p => p.status !== "Dispensed");

  const profile = (data.profiles || {})[String(localStorage.getItem("mq_role") || "").toUpperCase()] || {};
  const sub = document.getElementById("pharmacistPageSub");
  if (sub) {
    sub.textContent = [profile.name, profile.department].filter(Boolean).join(" — ") || "Dispensary";
  }

  document.getElementById("rxToday").textContent = data.prescriptions.length;
  document.getElementById("rxDispensed").textContent = dispensed;
  document.getElementById("rxDispensedSub").textContent = `${dispensed} completed`;
  document.getElementById("rxPending").textContent = pending.length;

  document.getElementById("rxTableBody").innerHTML = data.prescriptions.length
    ? data.prescriptions.map(p => `
      <tr class="clickable" data-id="${p.id}"><td>${esc(p.patient)}</td><td>${esc(p.medication)}</td><td>${esc(p.dosage)}</td><td>${esc(p.prescribedBy)}</td><td>${badge(p.status)}</td></tr>
    `).join("")
    : `<tr><td colspan="5">No prescriptions have been issued yet.</td></tr>`;

  document.querySelectorAll("#rxTableBody tr").forEach((row) => {
    row.addEventListener("click", () => { selectedRxId = row.dataset.id; renderPharmacistDashboard(); });
  });

  const sel = data.prescriptions.find(p => p.id === selectedRxId) || pending[0];
  const detail = document.getElementById("rxDetail");
  if (!sel) { detail.innerHTML = `<div class="empty-state">No prescriptions waiting to be dispensed.</div>`; return; }
  detail.innerHTML = `
    <div style="padding:20px;">
      <div style="font-weight:700;font-size:15px;">${esc(sel.patient)}</div>
      <div style="font-size:12px;color:var(--slate);margin-bottom:16px;">${esc(sel.id)}</div>
      ${[["Medication",sel.medication],["Dosage",sel.dosage],["Duration",sel.duration],["Prescribed by",sel.prescribedBy],["Date",sel.date]]
        .map(([k,v]) => `<div class="rx-detail-row"><span class="rx-detail-key">${k}</span><span class="rx-detail-val">${esc(v)}</span></div>`).join("")}
      <button class="btn btn-primary btn-block" style="margin-top:18px;" id="dispenseBtn" ${sel.status === "Dispensed" ? "disabled" : ""}>
        ${sel.status === "Dispensed" ? "Already dispensed" : "Mark as dispensed"}
      </button>
    </div>`;
  const btn = document.getElementById("dispenseBtn");
  if (btn && sel.status !== "Dispensed") btn.addEventListener("click", () => dispense(sel.id));
}

// Writes the new status to the database; the list is only redrawn once the
// server confirmed it.
async function dispense(id) {
  const res = await updatePrescriptionStatusAsync(id, "Dispensed");
  if (!res.ok) {
    alert(res.error || "Could not update the prescription on the server.");
    return;
  }
  renderPharmacistDashboard();
}

document.addEventListener("DOMContentLoaded", renderPharmacistDashboard);
