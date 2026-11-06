// js/pages/appointments.js
// The table renders real appointments from the backend-synced cache.
// Create/edit/delete write through to the REST API (and update the cache),
// so the list always reflects what is actually in the database.

function renderAppts() {
  const data = getData();
  const body = document.getElementById("apptsBody");
  document.getElementById("apptsBodyCount").textContent = `${data.appointments.length} records`;
  body.innerHTML = data.appointments.map((a) => `
    <tr>
      <td>${esc(a.date || "")} ${esc(a.time)}</td>
      <td>${esc(a.patient)}</td>
      <td>${esc(a.dept)}</td>
      <td>${a.doctor ? esc(a.doctor) : '<span class="muted">Unassigned</span>'}</td>
      <td>${badge(a.status)}</td>
      <td class="action-cell">
        <button class="btn btn-ghost btn-sm" onclick="openEditAppt('${esc(a.id)}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteAppt('${esc(a.id)}')">Delete</button>
      </td>
    </tr>
  `).join("");
}

function populateDeptDropdowns() {
  document.querySelectorAll("#naDept, #eaDept").forEach(sel => {
    if (sel) sel.innerHTML = DEPARTMENTS.map(d => `<option value="${esc(d.id)}">${esc(d.name)}</option>`).join("");
  });
}

function populateDoctorDropdowns() {
  const data = getData();
  const doctors = (data.users || []).filter((u) => /doctor/i.test(u.role || "") && u.id);
  const options = `<option value="">Unassigned</option>` +
    doctors.map(d => `<option value="${esc(d.id)}">${esc(d.name)}</option>`).join("");
  document.querySelectorAll("#naDoctor, #eaDoctor").forEach(sel => {
    if (sel) sel.innerHTML = options;
  });
  const names = document.getElementById("patientNameList");
  if (names) {
    names.innerHTML = (data.patients || [])
      .filter((p) => p.name)
      .map((p) => `<option value="${esc(p.name)}"></option>`)
      .join("");
  }
}

function openEditAppt(appointmentId) {
  const data = getData();
  const a = (data.appointments || []).find((x) => x.id === appointmentId);
  if (!a) return;
  document.getElementById("eaEditId").value = appointmentId;
  document.getElementById("eaPatient").value = a.patient;
  const deptSelect = document.getElementById("eaDept");
  if (a.departmentId) deptSelect.value = a.departmentId;
  const docSelect = document.getElementById("eaDoctor");
  docSelect.value = a.doctorId || "";
  document.getElementById("eaDate").value = a.date || "";
  document.getElementById("eaTime").value = a.time24 || "";
  document.getElementById("eaReason").value = a.reason || "";
  document.getElementById("eaStatus").value = a.status;
  openModal("editApptModal");
}

async function deleteAppt(appointmentId) {
  const data = getData();
  const a = (data.appointments || []).find((x) => x.id === appointmentId);
  if (!a) return;
  if (!confirm(`Cancel and remove ${a.patient}'s appointment on ${a.date || "—"} at ${a.time}? This can't be undone.`)) return;
  const res = await deleteAppointmentAsync(appointmentId);
  if (res.ok) {
    renderAppts();
  } else {
    alert(res.error || "Could not delete the appointment. Please try again.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderAppts();
  populateDeptDropdowns();
  populateDoctorDropdowns();

  document.getElementById("bookApptForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = getData();

    const patientName = document.getElementById("naPatient").value.trim();
    const departmentId = document.getElementById("naDept").value;
    const doctorId = document.getElementById("naDoctor").value;
    const date = document.getElementById("naDate").value;
    const time = document.getElementById("naTime").value;
    const reason = document.getElementById("naReason").value.trim();

    if (!patientName || !date || !time || !reason) return;

    const patient = (data.patients || []).find((p) =>
      String(p.name || "").toLowerCase().replace(/\s+/g, " ") ===
      String(patientName).toLowerCase().replace(/\s+/g, " ")
    );

    if (!patient || !patient.id) {
      alert("Could not find that patient. Check the patient list for the exact name.");
      return;
    }

    const res = await createAppointmentAsync({
      appointmentId: uniqueId("APP"),
      patientId: patient.id,
      // Empty doctor selection means the booking stays unassigned.
      doctorId: doctorId || null,
      clinicId: (data.clinics && data.clinics[0] && data.clinics[0].id) || null,
      departmentId: departmentId || null,
      reason,
      scheduledDate: date,
      scheduledTime: time,
      appointmentType: "booked",
      status: "Pending"
    });

    if (!res.ok) {
      alert(res.error || "Could not create the booking.");
      return;
    }

    document.getElementById("bookApptForm").reset();
    document.getElementById("naDate").value = todayIso();
    populateDoctorDropdowns();
    populateDeptDropdowns();
    closeModal("bookApptModal");
    renderAppts();
  });

  document.getElementById("editApptForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const appointmentId = document.getElementById("eaEditId").value;
    const newDoctorId = document.getElementById("eaDoctor").value;
    const newStatus = document.getElementById("eaStatus").value;
    const newDate = document.getElementById("eaDate").value;
    const newTime = document.getElementById("eaTime").value;
    const newDept = document.getElementById("eaDept").value;
    const newReason = document.getElementById("eaReason").value.trim();

    if (!appointmentId) return;

    const current = (getData().appointments || []).find((x) => x.id === appointmentId);
    if (!current) return;

    // A booking cannot be approved without a doctor: the queue entry would be
    // "Waiting" with no doctor and nobody would ever see the patient.
    const effectiveDoctorId = newDoctorId || current.doctorId;
    if (
      /^(confirmed|checked in)$/i.test(String(newStatus || "").trim()) &&
      !effectiveDoctorId
    ) {
      alert("Assign a doctor before confirming this appointment.");
      return;
    }

    // The detail update carries the schedule and reason, then the status is
    // applied through the dedicated endpoint.
    const detailsChanged =
      current.date !== newDate ||
      current.time24 !== newTime ||
      current.departmentId !== (newDept || null) ||
      current.reason !== newReason;

    if (detailsChanged) {
      const updateRes = await updateAppointmentAsync(appointmentId, {
        patientId: current.patientId,
        doctorId: newDoctorId || null,
        clinicId: current.clinicId || null,
        departmentId: newDept || null,
        reason: newReason,
        scheduledDate: newDate,
        scheduledTime: newTime,
        appointmentType: "booked",
        status: current.status,
      });
      if (!updateRes.ok) {
        alert(updateRes.error || "Could not save the appointment details.");
        return;
      }
    }

    if (newDoctorId && newDoctorId !== current.doctorId) {
      const assignRes = await assignAppointmentDoctorAsync(appointmentId, newDoctorId);
      if (!assignRes.ok) {
        alert(assignRes.error || "Could not assign the doctor.");
        return;
      }
    }

    if (newStatus !== current.status) {
      const statusRes = await updateAppointmentStatusAsync(appointmentId, newStatus);
      if (!statusRes.ok) {
        alert(statusRes.error || "Could not update the appointment. Please try again.");
        return;
      }
    }

    closeModal("editApptModal");
    renderAppts();
  });
});
