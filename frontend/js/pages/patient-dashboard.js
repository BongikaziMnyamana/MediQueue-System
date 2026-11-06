document.addEventListener("DOMContentLoaded", () => {

  // render-helpers.js isn't loaded on the patient portal; provide the
  // tiny escape helper used in the templates below when absent.
  if (typeof esc !== "function") {
    window.esc = (s) => String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  if (!requireRole("PATIENT")) return;

  const patientId =
    localStorage.getItem("mq_patientId");

  const sessionName =
    localStorage.getItem("mq_name") || "Patient";

  const firstName =
    sessionName.split(" ")[0];


  const topbarEl =
    document.getElementById("patientTopbarName");

  const welcomeEl =
    document.getElementById("patientWelcome");

  const queueNumberEl =
    document.getElementById("queueNumber");

  const totalVisitsEl =
    document.getElementById("totalVisits");


  if (topbarEl) topbarEl.textContent = firstName;

  if (welcomeEl) {
    welcomeEl.textContent = `Welcome back, ${firstName}!`;
  }


  // Backend returns the assigned doctor as a full Staff object; turn it
  // into a display name (e.g. "Dr. N. Zulu"). Falls back to a plain
  // string if some page already formats it.
  function doctorDisplay(a) {
    const d = a && a.doctor;
    if (!d) return "";
    if (typeof d === "string") return d;
    if (typeof staffDisplayName === "function") return staffDisplayName(d);
    if (typeof fullName === "function") return fullName(d);
    return String(d.firstName || d.lastName || "").trim() || "";
  }


  /*
    Pull the patient's real profile and appointments from the backend.
    Nothing here is hardcoded — the numbers and lists come from the
    database and refresh on every visit.
  */

  renderDashboard();

  async function renderDashboard() {

    const [meRes, apptsRes] = await Promise.all([
      meAsync(),
      patientId
        ? apiRequest("GET", "/appointment/patient/" + encodeURIComponent(patientId))
        : Promise.resolve({ ok: false, status: 401 }),
      typeof refreshQueueFromApiAsync === "function"
        ? refreshQueueFromApiAsync()
        : Promise.resolve(false)
    ]);

    if (meRes.ok && meRes.data && meRes.data.firstName) {
      const name = [meRes.data.firstName, meRes.data.lastName].filter(Boolean).join(" ");
      localStorage.setItem("mq_name", name);
      if (topbarEl) topbarEl.textContent = meRes.data.firstName;
      if (welcomeEl) welcomeEl.textContent = `Welcome back, ${meRes.data.firstName}!`;
    }

    const appointments =
      (apptsRes.ok && Array.isArray(apptsRes.data)) ? apptsRes.data : [];


    // The queue number is issued at booking time and stays visible while the
    // patient waits for the nurse and then the doctor.
    const cached = typeof getData === "function" ? getData() : null;
    const qEntry = patientId && cached
      ? (cached.queue || []).find(
          (q) =>
            q.id === patientId &&
            !["Cancelled", "Completed"].includes(q.status)
        )
      : null;
    const numbered = Boolean(qEntry && qEntry.no);

    queueNumberEl.textContent = numbered ? qEntry.no : "—";

    queueNumberEl.parentElement.querySelector(
      ".patient-dashboard-card-sub"
    ).textContent =
      numbered
        ? `Status: ${qEntry.status}`
        : qEntry
          ? "Please see reception for your queue number"
          : "No active queue number";


    totalVisitsEl.textContent =
      String(appointments.length);


    renderAppointments(appointments);
    renderNotifications(appointments);
  }


  function renderAppointments(appointments) {

    const listEl = document.querySelector(
      ".patient-appointment-list"
    );

    if (!listEl) return;


    if (!appointments.length) {

      listEl.innerHTML =
        `<div class="patient-appointment-empty">
           You have no appointments yet.
           <a href="book-appointment.html">Book your first visit</a>.
         </div>`;

      return;

    }


    // Sort newest scheduled date first, show the latest few.
    const sorted =
      appointments.slice()
        .sort((a, b) => String(b.scheduledDate || "").localeCompare(String(a.scheduledDate || "")));

    listEl.innerHTML =
      sorted.slice(0, 3).map((a) => {

        const parts = String(a.scheduledDate || "").split("-");
        const month = parts[1]
          ? new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])))
              .toLocaleString("en", { month: "short" }).toUpperCase()
          : "";
        const day = Number(parts[2]) || "";
        const doctor = doctorDisplay(a) || "Unassigned";
        const doctorClass = doctorDisplay(a) ? "" : "muted";

        return `
          <div class="patient-appointment-item">

            <div class="patient-appointment-date">
              <span class="patient-appointment-month">${esc(month)}</span>
              <strong>${esc(day)}</strong>
            </div>


            <div class="patient-appointment-body">

              <div class="patient-appointment-doctor ${doctorClass}">
                ${esc(doctor)}
              </div>

              <div class="patient-appointment-reason">
                ${esc(a.reason || "General consultation")}
              </div>

              <div class="patient-appointment-meta">

                <span>${esc(fmtDate(a.scheduledDate))}</span>

                <span>•</span>

                <span>${esc(fmtTime12(a.scheduledTime))}</span>

                <span>•</span>

                <span>${typeof badge === "function" ? badge(a.status || "Pending") : esc(a.status)}</span>

              </div>

            </div>

          </div>
        `;

      }).join("");
  }


  function renderNotifications(appointments) {

    const listEl = document.querySelector(
      ".patient-notification-list"
    );

    if (!listEl) return;


    const items = [];

    const confirmed = appointments.find(
      (a) => String(a.status || "").toLowerCase() === "confirmed"
    );

    if (confirmed) {
      items.push({
        title: "Appointment Confirmed",
        text: doctorDisplay(confirmed)
          ? "Your appointment with " + doctorDisplay(confirmed) + " has been confirmed."
          : "Your appointment has been confirmed."
      });
    }

    const pending = appointments.find(
      (a) => String(a.status || "").toLowerCase() === "pending"
    );

    if (pending) {
      items.push({
        title: "Booking Received",
        text: "Your booking is pending doctor assignment at the clinic."
      });
    }

    if (!items.length && appointments.length) {
      items.push({
        title: "Latest Booking",
        text: "Your most recent appointment is scheduled for " + fmtDate(appointments[0].scheduledDate) + "."
      });
    }

    if (!items.length) {
      items.push({
        title: "No notifications",
        text: "Book an appointment to start receiving updates."
      });
    }


    listEl.innerHTML =
      items.map((n) => `
        <div class="patient-notification-item">

          <div class="patient-notification-dot"></div>

          <div>

            <div class="patient-notification-title">
              ${esc(n.title)}
            </div>

            <div class="patient-notification-text">
              ${esc(n.text)}
            </div>

          </div>

        </div>
      `).join("");
  }

});

/* =========================================================
   PATIENT MOBILE MENU
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const menuButton =
    document.getElementById("patientMenuButton");

  const closeButton =
    document.getElementById("patientMenuClose");

  const sidebar =
    document.getElementById("patientSidebar");

  const overlay =
    document.getElementById("patientMenuOverlay");

  const logoutLink =
    document.getElementById("patientLogout");


  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      mqLogout();
    });
  }


  if (
    !menuButton ||
    !closeButton ||
    !sidebar ||
    !overlay
  ) {
    return;
  }


  function openPatientMenu() {

    sidebar.classList.add(
      "patient-sidebar-open"
    );

    overlay.classList.add(
      "patient-menu-overlay-open"
    );

    document.body.classList.add(
      "patient-menu-open"
    );

    menuButton.setAttribute(
      "aria-expanded",
      "true"
    );
  }


  function closePatientMenu() {

    sidebar.classList.remove(
      "patient-sidebar-open"
    );

    overlay.classList.remove(
      "patient-menu-overlay-open"
    );

    document.body.classList.remove(
      "patient-menu-open"
    );

    menuButton.setAttribute(
      "aria-expanded",
      "false"
    );
  }


  menuButton.addEventListener(
    "click",
    openPatientMenu
  );


  closeButton.addEventListener(
    "click",
    closePatientMenu
  );


  overlay.addEventListener(
    "click",
    closePatientMenu
  );


  sidebar
    .querySelectorAll(".nav-item")
    .forEach(link => {

      link.addEventListener(
        "click",
        closePatientMenu
      );

    });


  document.addEventListener(
    "keydown",
    event => {

      if (event.key === "Escape") {
        closePatientMenu();
      }

    }
  );

});