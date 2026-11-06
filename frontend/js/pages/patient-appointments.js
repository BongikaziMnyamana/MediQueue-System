/*
 * patient-appointments.js
 * Lets a patient manage their own bookings: review, reschedule or cancel.
 *
 * Everything on this page comes from the database. The list is read from
 * GET /appointment/patient/{patientId}, and both actions are real HTTP writes
 * (PUT /appointment/update and DELETE /appointment/delete/{id}) performed by
 * the shared helpers in data.js. Nothing is faked in localStorage, and the
 * list is re-read from the API after a change so what is on screen is what
 * MySQL holds.
 */

(function patientAppointments() {

  // Only a signed-in patient may manage appointments.
  if (typeof requireRole === "function" && !requireRole("PATIENT")) return;


  const patientId =
    localStorage.getItem("mq_patientId") ||
    localStorage.getItem("mq_userId") ||
    "";


  const listEl = document.getElementById("apptList");
  const messageEl = document.getElementById("apptMessage");

  const searchEl = document.getElementById("apptSearch");
  const statusEl = document.getElementById("apptStatusFilter");
  const sortEl = document.getElementById("apptSort");

  const form = document.getElementById("rescheduleForm");
  const idInput = document.getElementById("rsId");
  const dateInput = document.getElementById("rsDate");
  const timeInput = document.getElementById("rsTime");
  const reasonInput = document.getElementById("rsReason");
  const saveBtn = document.getElementById("rsSaveBtn");
  const formError = document.getElementById("rsError");

  /*
    Once a patient has been seen, or the visit is already finished, the
    booking is part of the medical history and must not be edited or removed
    from the patient portal. The clinic keeps the record; the patient keeps
    the history.
  */
  const LOCKED_STATUSES = [
    "in consultation",
    "completed",
    "cancelled",
    "canceled",
    "prescribed",
    "referred"
  ];

  const appointments = new Map();

  /*
    Search text, status filter and sort order. Kept in module state and
    re-applied on every render, so changing any control re-draws the list
    from the data already read from the database.
  */
  let searchTerm = "";
  let statusFilter = "";
  let sortOrder = "date-desc";


  function isLocked(appointment) {
    return LOCKED_STATUSES.includes(
      String(appointment.status || "").trim().toLowerCase()
    );
  }


  function showMessage(text, kind) {
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.style.display = "block";
    messageEl.style.color =
      kind === "error" ? "var(--danger)" : "var(--teal)";
    messageEl.style.fontWeight = "600";
  }


  function clearMessage() {
    if (!messageEl) return;
    messageEl.textContent = "";
    messageEl.style.display = "none";
  }


  function clearFormError() {
    if (!formError) return;
    formError.textContent = "";
    formError.style.display = "none";
  }


  function formErrorText(text) {
    if (!formError) return;
    formError.textContent = text;
    formError.style.display = "block";
  }


  function doctorLabel(appointment) {
    const doctor = appointment && appointment.doctor;
    if (!doctor) return "Doctor not assigned yet";
    if (typeof doctor === "string") return doctor;
    if (typeof staffDisplayName === "function") return staffDisplayName(doctor);
    return (
      [doctor.firstName, doctor.lastName].filter(Boolean).join(" ") ||
      "Doctor not assigned yet"
    );
  }


  function dateParts(iso) {
    const parts = String(iso || "").split("-");
    return {
      month:
        parts[1]
          ? new Date(
              Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
            )
              .toLocaleString("en", { month: "short" })
              .toUpperCase()
          : "",
      day: Number(parts[2]) || ""
    };
  }


  /* =========================================================
     READ - pull this patient's appointments from the API
     ========================================================= */

  async function load() {
    if (!listEl) return;

    if (!patientId) {
      listEl.innerHTML =
        `<div class="patient-appointment-empty">
           We could not identify your account. Please sign in again.
         </div>`;
      return;
    }

    listEl.innerHTML =
      `<div class="patient-appointment-empty">Loading your appointments…</div>`;

    const res = await apiRequest(
      "GET",
      "/appointment/patient/" + encodeURIComponent(patientId)
    );

    if (!res.ok || !Array.isArray(res.data)) {
      listEl.innerHTML =
        `<div class="patient-appointment-empty">
           Could not load your appointments. Check that the server is running
           and try again.
         </div>`;
      return;
    }

    appointments.clear();
    res.data.forEach((a) => {
      if (a && a.appointmentId) appointments.set(a.appointmentId, a);
    });

    populateStatusFilter(res.data);
    render(res.data);
  }


  /* Populates the status dropdown from the statuses actually in use. */

  function populateStatusFilter(list) {
    if (!statusEl) return;

    const current = statusEl.value;
    const seen = [];

    list.forEach((a) => {
      const status = a.status || "Pending";
      if (!seen.includes(status)) seen.push(status);
    });

    seen.sort((a, b) => a.localeCompare(b));

    statusEl.innerHTML =
      `<option value="">All statuses</option>` +
      seen
        .map(
          (s) =>
            `<option value="${esc(s)}">${esc(s)}</option>`
        )
        .join("");

    statusEl.value = seen.includes(current) ? current : "";
    statusFilter = statusEl.value;
  }


  /* Applies the search box, the status filter and the sort order. */

  function visibleAppointments(list) {
    let rows = list.slice();

    if (searchTerm) {
      rows = rows.filter((a) => {
        const haystack = [
          a.reason || "",
          a.status || "",
          doctorLabel(a),
          fmtDate(a.scheduledDate),
          fmtTime12(a.scheduledTime)
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(searchTerm);
      });
    }

    if (statusFilter) {
      rows = rows.filter(
        (a) => (a.status || "Pending") === statusFilter
      );
    }

    if (sortOrder === "date-asc") {
      rows.sort((a, b) =>
        String(a.scheduledDate || "").localeCompare(
          String(b.scheduledDate || "")
        )
      );
    } else if (sortOrder === "status") {
      rows.sort((a, b) =>
        String(a.status || "").localeCompare(String(b.status || ""))
      );
    } else {
      rows.sort((a, b) =>
        String(b.scheduledDate || "").localeCompare(
          String(a.scheduledDate || "")
        )
      );
    }

    return rows;
  }


  function render(list) {
    if (!list.length) {
      listEl.innerHTML =
        `<div class="patient-appointment-empty">
           You have no appointments yet.
           <a href="book-appointment.html">Book your first visit</a>.
         </div>`;
      return;
    }

    const rows = visibleAppointments(list);

    if (!rows.length) {
      listEl.innerHTML =
        `<div class="patient-appointment-empty">
           No appointments match your search.
         </div>`;
      return;
    }

    listEl.innerHTML =
      rows
        .map((a) => {
          const { month, day } = dateParts(a.scheduledDate);
          const locked = isLocked(a);
          const status = a.status || "Pending";

          return `
            <div class="patient-appointment-item" id="appt-${
              esc(a.appointmentId)
            }">

              <div class="patient-appointment-date">
                <span class="patient-appointment-month">${esc(month)}</span>
                <strong>${esc(day)}</strong>
              </div>


              <div class="patient-appointment-body">

                <div class="patient-appointment-doctor">
                  ${esc(doctorLabel(a))}
                </div>

                <div class="patient-appointment-reason">
                  ${esc(a.reason || "General consultation")}
                </div>

                <div class="patient-appointment-meta">
                  <span>${esc(fmtDate(a.scheduledDate))}</span>
                  <span>•</span>
                  <span>${esc(fmtTime12(a.scheduledTime))}</span>
                  <span>•</span>
                  <span>${badge(status)}</span>
                </div>

              </div>


              <div class="patient-appointment-actions">

                ${
                  locked
                    ? `<span class="patient-appointment-locked">
                         Not editable
                       </span>`
                    : `<button
                         class="btn btn-sm btn-secondary"
                         type="button"
                         data-action="edit"
                         data-id="${esc(a.appointmentId)}"
                       >
                         Reschedule
                       </button>

                       <button
                         class="btn btn-sm btn-danger"
                         type="button"
                         data-action="cancel"
                         data-id="${esc(a.appointmentId)}"
                       >
                         Cancel
                       </button>`
                }

              </div>

            </div>
          `;
        })
        .join("");
  }


  /* =========================================================
     UPDATE - reschedule a booking
     ========================================================= */

  function refreshRescheduleLimits() {
    const today = todayIso();
    dateInput.min = today;

    if (dateInput.value === today) {
      const now = new Date();
      const hour = String(now.getHours()).padStart(2, "0");
      const minute = String(now.getMinutes()).padStart(2, "0");
      timeInput.min = `${hour}:${minute}`;
    } else {
      timeInput.removeAttribute("min");
    }
  }


  function openReschedule(appointment) {
    clearFormError();
    idInput.value = appointment.appointmentId;
    dateInput.value = appointment.scheduledDate || "";
    timeInput.value = to24h(appointment.scheduledTime) || "";
    reasonInput.value = appointment.reason || "";
    refreshRescheduleLimits();
    openModal("rescheduleModal");
    dateInput.focus();
  }


  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearFormError();

      const id = idInput.value;
      const existing = appointments.get(id);

      if (!existing) {
        formErrorText("That appointment could not be found. Refresh and retry.");
        return;
      }

      if (!dateInput.value) {
        formErrorText("Please choose a date.");
        return;
      }

      if (!timeInput.value) {
        formErrorText("Please choose a time.");
        return;
      }

      if (
        dateInput.value < todayIso() ||
        isPastDateTime(dateInput.value, timeInput.value)
      ) {
        formErrorText("Please choose a date and time in the future.");
        return;
      }

      /*
        A booking that already has a doctor stays confirmed when the time
        changes; only an unassigned request has to wait for the clinic.
      */
      const changedSchedule =
        dateInput.value !== existing.scheduledDate ||
        timeInput.value !== to24h(existing.scheduledTime);
      const existingDoctorId = doctorIdOf(existing);
      const nextStatus = changedSchedule
        ? (existingDoctorId ? "Confirmed" : "Pending")
        : existing.status || "Pending";

      saveBtn.disabled = true;
      saveBtn.textContent = "Saving�?�";

      const res = await updateAppointmentAsync(id, {
        patientId,
        scheduledDate: dateInput.value,
        scheduledTime: timeInput.value,
        reason: reasonInput.value.trim(),
        status: nextStatus,
        appointmentType: existing.appointmentType || "booked",
        // The doctor, clinic and department are chosen by the clinic, so they
        // are sent back unchanged rather than cleared by an empty form field.
        doctorId: doctorIdOf(existing),
        clinicId: idOf(existing.clinic),
        departmentId: departmentIdOf(existing),
        createdById: staffIdOf(existing.createdBy)
      });

      saveBtn.disabled = false;
      saveBtn.textContent = "Save changes";

      if (!res.ok) {
        formErrorText(
          (res && res.error) || "Could not save the appointment. Please retry."
        );
        return;
      }

      closeModal("rescheduleModal");
      showMessage(
        existingDoctorId
          ? "Appointment rescheduled."
          : "Appointment rescheduled. The clinic will confirm the new time.",
        "success"
      );

      await load();
    });
  }


  /* =========================================================
     DELETE - cancel a booking, with confirmation
     ========================================================= */

  async function cancelAppointment(id) {
    const appointment = appointments.get(id);
    if (!appointment) return;

    const when = [
      fmtDate(appointment.scheduledDate),
      fmtTime12(appointment.scheduledTime)
    ]
      .filter(Boolean)
      .join(" at ");

    const confirmed = window.confirm(
      `Cancel your appointment on ${when}? This removes it from the clinic diary and cannot be undone.`
    );

    if (!confirmed) return;

    const res = await deleteAppointmentAsync(id);

    if (!res.ok) {
      showMessage(
        (res && res.error) || "Could not cancel the appointment. Please retry.",
        "error"
      );
      return;
    }

    showMessage("Appointment cancelled.", "success");
    await load();
  }


  /* Reads the ids the API returned for the references we must not clear. */

  function idOf(reference) {
    if (!reference) return "";
    if (typeof reference === "string") return reference;
    return reference.clinicId || reference.userId || "";
  }

  function departmentIdOf(department) {
    if (!department) return "";
    if (typeof department === "string") return department;
    return department.departmentId || "";
  }

  function staffIdOf(staff) {
    return idOf(staff);
  }

  function doctorIdOf(appointment) {
    return idOf(appointment && appointment.doctor);
  }


  /* One delegated listener handles every button in the list. */

  if (listEl) {
    listEl.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;

      event.preventDefault();
      event.stopPropagation();

      const id = button.dataset.id;
      const appointment = appointments.get(id);
      if (!appointment) return;

      if (button.dataset.action === "edit") {
        openReschedule(appointment);
      } else if (button.dataset.action === "cancel") {
        cancelAppointment(id);
      }
    });
  }


  document.addEventListener("DOMContentLoaded", () => {
    clearMessage();
    refreshRescheduleLimits();

    if (dateInput) {
      dateInput.addEventListener("change", refreshRescheduleLimits);
    }

    if (searchEl) {
      searchEl.addEventListener("input", () => {
        searchTerm = searchEl.value.trim().toLowerCase();
        render(Array.from(appointments.values()));
      });
    }

    if (statusEl) {
      statusEl.addEventListener("change", () => {
        statusFilter = statusEl.value;
        render(Array.from(appointments.values()));
      });
    }

    if (sortEl) {
      sortEl.addEventListener("change", () => {
        sortOrder = sortEl.value;
        render(Array.from(appointments.values()));
      });
    }

    load();
  });

})();
