// js/pages/receptionist-dashboard.js

function avgWaitMinutes(queue) {
  const mins = queue.map(q => parseInt(q.wait, 10)).filter(n => !isNaN(n));
  if (!mins.length) return "0 min";
  return `${Math.round(mins.reduce((a, b) => a + b, 0) / mins.length)} min`;
}

function todayAppointments(appointments) {
  const today = todayIso();
  return appointments.filter(a => a.date === today);
}

function renderReceptionistDashboard() {
  const data = getData();
  const role = localStorage.getItem("mq_role") || "";
  const profile = data.profiles[role] || {};

  document.getElementById("welcomeMsg").textContent = profile.name
    ? `Welcome, ${profile.name}`
    : "Welcome";
  document.getElementById("dateLabel").textContent = new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const todayQueue = data.queue.filter(isTodayQueueEntry);
  const waiting = todayQueue.filter(q => q.status === "Ready for Doctor");
  // Bookings are numbered immediately, but they still need a doctor before the
  // consultation can happen, so they are counted separately.
  const awaitingApproval = todayQueue.filter(q => !q.doctorId && !["Cancelled", "Completed"].includes(q.status));
  const inConsult = todayQueue.find(q => q.status === "In Consultation");
  const apptsToday = todayAppointments(data.appointments);
  // "Total patients today" is the number of distinct people the clinic has
  // actually seen: a visit recorded today, or an appointment booked for today.
  const seenToday = data.seenToday || 0;

  document.getElementById("statCards").innerHTML = `
    <div class="card"><div class="card-label">Patients seen today</div><div class="card-value font-display">${seenToday}</div><a href="patients.html" class="link" style="font-size:12px;">View all patients →</a></div>
    <div class="card"><div class="card-label">Appointments today</div><div class="card-value font-display">${apptsToday.length}</div><a href="appointments.html" class="link" style="font-size:12px;">View all appointments →</a></div>
    <div class="card"><div class="card-label">Patients in queue</div><div class="card-value font-display" style="color:var(--gold)">${waiting.length}</div><a href="queue.html" class="link" style="font-size:12px;">View queue →</a></div>
    <div class="card"><div class="card-label">Average wait time</div><div class="card-value font-display">${avgWaitMinutes(data.queue)}</div></div>
    <div class="card"><div class="card-label">Awaiting a doctor</div><div class="card-value font-display">${awaitingApproval.length}</div><a href="appointments.html" class="link" style="font-size:12px;">Assign a doctor →</a></div>
    <div class="card"><div class="card-label">Appointments still pending</div><div class="card-value font-display">${apptsToday.filter(a => a.status === "Pending").length}</div><a href="appointments.html" class="link" style="font-size:12px;">View pending →</a></div>
  `;

  document.getElementById("apptsBody").innerHTML = apptsToday.length
    ? apptsToday.map(a => `
      <tr><td>${a.time}</td><td>${esc(a.patient)}</td><td>${esc(a.dept)}</td><td>${badge(a.status)}</td></tr>
    `).join("")
    : `<tr><td colspan="4">No appointments booked for today.</td></tr>`;

  document.getElementById("nowServing").innerHTML = inConsult
    ? `<div style="font-size:22px;font-weight:800;color:var(--teal);font-family:'Zilla Slab',Georgia,serif;">${esc(queueNoLabel(inConsult))}</div><div style="font-size:13px;color:var(--slate);">${esc(inConsult.patient)} — ${esc(inConsult.dept)}</div>`
    : `<div style="font-size:13px;color:var(--slate);">No one currently being served</div>`;

  document.getElementById("nextInLine").innerHTML = waiting.length
    ? waiting.map(q => `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;"><span>${esc(queueNoLabel(q))} — ${esc(q.patient)}</span><span style="color:var(--slate);">${esc(q.dept)}</span></div>`).join("")
    : `<div style="font-size:13px;color:var(--slate);">Queue is empty</div>`;

  // Bookings still waiting for a doctor are shown as work to do, with the reason a
  // number has not been issued yet.
  const approvalList = document.getElementById("awaitingApproval");
  if (approvalList) {
    approvalList.innerHTML = awaitingApproval.length
      ? awaitingApproval.map(q => `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;"><span>${esc(q.patient)}</span><span style="color:var(--slate);">No doctor assigned</span></div>`).join("")
      : `<div style="font-size:13px;color:var(--slate);">Every booking has a doctor</div>`;
  }

  document.getElementById("recentPatients").innerHTML = data.patients.length
    ? data.patients.slice(0, 3).map(p => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 20px;border-bottom:1px solid var(--line);">
        <div><div style="font-weight:600;font-size:13.5px;">${esc(p.name)}</div><div style="font-size:12px;color:var(--slate);">${esc(p.id)}</div></div>
        ${p.queued ? badge("In queue") : `<span class="muted" style="font-size:12px;">${esc(p.dept || "Registered")}</span>`}
      </div>`).join("")
    : `<div style="padding:12px 20px;font-size:13px;color:var(--slate);">No patients registered yet.</div>`;

  // "Notices" are derived from today's real data instead of a hardcoded list.
  const notices = [];
  if (waiting.length) {
    notices.push({ title: `${waiting.length} patient${waiting.length === 1 ? "" : "s"} waiting`, body: `Longest wait is ${avgWaitMinutes(waiting)}.` });
  }
  const unassigned = apptsToday.filter(a => !a.doctorId);
  if (unassigned.length) {
    notices.push({ title: `${unassigned.length} appointment${unassigned.length === 1 ? "" : "s"} without a doctor`, body: "Assign a doctor from the appointments page." });
  }
  if (!data.clinics.length) {
    notices.push({ title: "No clinic registered", body: "Add a clinic before queueing walk-ins." });
  }
  document.getElementById("announcements").innerHTML = notices.length
    ? notices.map(a => `
      <div style="margin-bottom:14px;"><div style="font-weight:700;font-size:13.5px;margin-bottom:2px;">${esc(a.title)}</div><div style="font-size:12.5px;color:var(--slate);">${esc(a.body)}</div></div>
    `).join("")
    : `<div style="font-size:13px;color:var(--slate);">Nothing needs attention right now.</div>`;

  // populate department dropdowns and the doctor/patient pickers
  document.querySelectorAll("#npDept, #naDept, #aqDept").forEach(sel => {
    sel.innerHTML = DEPARTMENTS.map(d => `<option>${esc(d.name)}</option>`).join("");
  });
  const doctors = data.users.filter(u => /doctor/i.test(u.role || ""));
  document.getElementById("naDoctor").innerHTML =
    `<option value="">Assign later</option>` + doctors.map(d => `<option value="${d.id}">${esc(d.name)}</option>`).join("");
  document.getElementById("aqPatient").innerHTML = data.patients
    .map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join("");
  document.getElementById("mqPatientNames").innerHTML = data.patients
    .map(p => `<option value="${esc(p.name)}"></option>`).join("");
}

async function callNext() {
  const data0 = getData();
  const todayQueue = data0.queue.filter(isTodayQueueEntry);
  const waiting = todayQueue.filter(item => item.status === "Ready for Doctor");
  const current = todayQueue.find(item => item.status === "In Consultation");
  const next = waiting[0];

  if (!next) {
    alert("Nobody is waiting in the queue.");
    return;
  }
  if (!next.entryId) {
    alert("These queue rows are not stored on the server yet. Reload the page to sync from the database.");
    return;
  }

  // Return whoever is in consultation back to waiting before calling the next
  // one; on an empty consultation the first waiting patient is simply called.
  if (current) {
    if (!current.entryId) {
      alert("The current queue row is not stored on the server yet. Reload the page to sync from the database.");
      return;
    }
    const back = await setQueueEntryStatusAsync(current.entryId, "Waiting");
    if (!back.ok) {
      alert(back.error || "Could not return the current patient to the queue.");
      return;
    }
  }

  const forward = await setQueueEntryStatusAsync(next.entryId, "In Consultation");
  if (!forward.ok) {
    alert(forward.error || "Could not call the next patient.");
    return;
  }
  renderReceptionistDashboard();
}

document.addEventListener("DOMContentLoaded", () => {
  renderReceptionistDashboard();
  document.getElementById("callNextBtn").addEventListener("click", callNext);

  document.getElementById("addPatientForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = document.getElementById("npName").value.trim();
    const dateOfBirth = document.getElementById("npDob").value;
    const res = await createPatientAsync({
      name,
      gender: document.getElementById("npGender").value,
      dateOfBirth,
      age: Number(document.getElementById("npAge").value) || 0,
      idNumber: document.getElementById("npIdNumber").value.trim(),
      email: document.getElementById("npEmail").value.trim(),
      phone: document.getElementById("npPhone").value.trim(),
      address: document.getElementById("npAddress").value.trim(),
      dept: document.getElementById("npDept").value,
    });
    if (!res.ok) {
      alert(res.error || "Could not save the patient to the server.");
      return;
    }
    form.reset();
    closeModal("addPatientModal");
    renderReceptionistDashboard();
  });

  document.getElementById("bookApptForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = getData();
    const patientName = document.getElementById("naPatient").value.trim();
    const doctorId = document.getElementById("naDoctor").value;
    const department = document.getElementById("naDept").value;
    const patient = data.patients.find(p => p.name === patientName);
    if (!patient) {
      alert("Select a patient that is registered on the server.");
      return;
    }
    const dept = (data.departments || []).find(d => d.name === department);
    const doctor = (data.users || []).find(u => u.id === doctorId);
    const res = await createAppointmentAsync({
      appointmentId: uniqueId("APP"),
      patientId: patient.id,
      doctorId: doctor ? doctor.id : null,
      clinicId: (data.clinics && data.clinics[0] && data.clinics[0].id) || null,
      departmentId: dept ? dept.id : null,
      reason: document.getElementById("naReason").value.trim(),
      scheduledDate: document.getElementById("naDate").value,
      scheduledTime: to24h(document.getElementById("naTime").value.trim()),
      appointmentType: "booked",
      status: doctor ? "Confirmed" : "Pending",
    });
    if (!res.ok) {
      alert(res.error || "Could not save the appointment to the server.");
      return;
    }
    e.target.reset();
    closeModal("bookApptModal");
    renderReceptionistDashboard();
  });

  document.getElementById("addQueueForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = getData();
    const patientId = document.getElementById("aqPatient").value;
    const department = document.getElementById("aqDept").value;
    const patient = data.patients.find(p => p.id === patientId);
    if (!patient) {
      alert("Select a patient that is registered on the server.");
      return;
    }
    const doctor = (data.users || []).find(u => u.department === department && /doctor/i.test(u.role || ""));
    if (!doctor) {
      alert(
        `No doctor is assigned to ${department}. ` +
        "Choose another department or add a doctor to this one first."
      );
      return;
    }
    const res = await createQueueEntryAsync({
      patientId: patient.id,
      // A walk-in is queued directly to the doctor working in the selected
      // department. Without a doctor the entry would stay "Pending" and the
      // doctor would never see the patient.
      doctorId: doctor.id,
    });
    if (!res.ok) {
      alert(res.error || "Could not add the patient to the server queue.");
      return;
    }
    e.target.reset();
    closeModal("addQueueModal");
    renderReceptionistDashboard();
  });
});
