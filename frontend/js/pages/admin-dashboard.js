// js/pages/admin-dashboard.js
// Renders real counts and activity from the backend-synced cache and lets
// the administrator assign a doctor to any pending booking (the backend
// marks the appointment "Confirmed" once a doctor is assigned).

function renderAdminDashboard() {
  const data = getData();
  const sessionName = localStorage.getItem("mq_name") || "Administrator";

  document.getElementById("welcomeMsg").textContent =
    `Welcome, ${sessionName}`;

  const uname = document.querySelector(".user-name");
  if (uname) uname.textContent = sessionName;

  document.getElementById("dateLabel").textContent =
    new Date().toLocaleDateString("en-ZA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

  const patients = data.patients || [];
  const appointments = data.appointments || [];
  const clinics = data.clinics || [];
  const departments = data.departments || [];

// Summary cards built from real database counts.
document.getElementById("statCards").innerHTML = `
    <div class="admin-stat-card">
      <div class="admin-stat-icon">👥</div>
      <div>
        <div class="admin-stat-label">Total Patients</div>
        <div class="admin-stat-value">${patients.length}</div>
        <div class="admin-stat-sub">Registered patient(s)</div>
      </div>
    </div>

    <div class="admin-stat-card">
      <div class="admin-stat-icon">📅</div>
      <div>
        <div class="admin-stat-label">Total Appointments</div>
        <div class="admin-stat-value">${appointments.length}</div>
        <div class="admin-stat-sub">All bookings</div>
      </div>
    </div>

    <div class="admin-stat-card">
      <div class="admin-stat-icon">🏥</div>
      <div>
        <div class="admin-stat-label">Total Clinics</div>
        <div class="admin-stat-value">${clinics.length}</div>
        <div class="admin-stat-sub">Active clinic(s)</div>
      </div>
    </div>

    <div class="admin-stat-card">
      <div class="admin-stat-icon">🧭</div>
      <div>
        <div class="admin-stat-label">Total Departments</div>
        <div class="admin-stat-value">${departments.length}</div>
        <div class="admin-stat-sub">Active department(s)</div>
      </div>
    </div>
  `;

// Make stat cards clickable.
document.querySelectorAll(".admin-stat-card").forEach((card) => {
  card.style.cursor = "pointer";
  card.addEventListener("click", () => {
    const link = card.closest(".admin-stat-card") ? null : null;
    const label = card.querySelector(".admin-stat-label")?.textContent;
    if (label === "Total Patients") {
      window.location.href = "patients.html";
    } else if (label === "Total Appointments") {
      window.location.href = "appointments.html";
    } else if (label === "Total Clinics") {
      window.location.href = "clinics.html";
    } else if (label === "Total Departments") {
      window.location.href = "departments.html";
    }
  });
});

  // Recent activity derived from the real appointment feed.
  const activities = appointments.slice(0, 6).map((a) => ({
    title: a.doctor ? "Doctor assigned" : "New booking",
    description:
      `${a.patient}${a.dept ? " · " + a.dept : ""} · ${a.status}`,
    date: a.date ? fmtDate(a.date) : (a.time || "")
  }));

  if (!activities.length) {
    activities.push({
      title: "No appointments yet",
      description: "Bookings will appear here as patients register.",
      date: ""
    });
  }

  document.getElementById("recentActivity").innerHTML =
    activities.map((activity) => `
      <div class="activity-item">
        <div class="activity-dot"></div>
        <div class="activity-content">
          <div class="activity-title">${esc(activity.title)}</div>
          <div class="activity-description">${esc(activity.description)}</div>
        </div>
        <div class="activity-date">${esc(activity.date)}</div>
      </div>
    `).join("");

  renderPending();
}

// List of doctors available for assignment (from the real staff feed).
function doctorOptions(selectedId) {
  const data = getData();
  const doctors = (data.users || []).filter((u) =>
    /doctor/i.test(u.role || "") && u.id
  );
  if (!doctors.length) {
    return `<option value="">No doctors available</option>`;
  }
  return doctors
    .map((d) =>
      `<option value="${esc(d.id)}"${d.id === selectedId ? " selected" : ""}>${esc(d.name)}</option>`
    )
    .join("");
}

function renderPending() {
  const list = document.getElementById("pendingApptsList");
  if (!list) return;

  const data = getData();
  const pending = (data.appointments || []).filter(
    (a) => String(a.status || "").toLowerCase() === "pending"
  );

  if (!pending.length) {
    list.innerHTML = `
      <div class="activity-item">
        <div class="activity-dot"></div>
        <div class="activity-content">
          <div class="activity-title">No pending bookings</div>
          <div class="activity-description">
            All booked appointments have doctors assigned.
          </div>
        </div>
      </div>`;
    return;
  }

  list.innerHTML = pending.map((a) => `
    <div class="activity-item admin-pending-item">
      <div class="activity-dot"></div>
      <div class="activity-content">
        <div class="activity-title">${esc(a.patient)}</div>
        <div class="activity-description">
          ${esc(a.dept || "—")} · ${esc(a.time || "")} · ${esc(a.reason || "")}
        </div>
        <div class="admin-assign-row">
          <select class="input admin-doctor-select" data-appt-id="${esc(a.id || "")}">
            ${doctorOptions(a.doctorId)}
          </select>
          <button
            type="button"
            class="btn btn-primary btn-sm admin-assign-btn"
            data-assign="${esc(a.id || "")}"
          >
            Assign doctor
          </button>
        </div>
      </div>
    </div>
  `).join("");
}

// Event delegation so re-renders keep working.
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".admin-assign-btn");
  if (!btn) return;

  const appointmentId = btn.getAttribute("data-assign");
  const row = btn.closest(".admin-pending-item");
  const select = row && row.querySelector(".admin-doctor-select");
  const doctorId = select ? select.value : "";

  if (!appointmentId || !doctorId) return;

  btn.disabled = true;
  btn.textContent = "Assigning...";

  const res = await assignAppointmentDoctorAsync(appointmentId, doctorId);

  if (res.ok) {
    renderAdminDashboard();
    return;
  }

  btn.disabled = false;
  btn.textContent = "Assign doctor";

  if (res.status === 401 || res.status === 403) {
    mqLogout();
  } else {
    alert("Could not assign the doctor. Please try again.");
  }
});

document.addEventListener(
  "DOMContentLoaded",
  renderAdminDashboard
);