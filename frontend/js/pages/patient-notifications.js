document.addEventListener("DOMContentLoaded", () => {

  const notificationList =
    document.getElementById("notificationList");

  const totalNotificationCount =
    document.getElementById("totalNotificationCount");

  const unreadNotificationCount =
    document.getElementById("unreadNotificationCount");

  const markAllReadBtn =
    document.getElementById("markAllReadBtn");

  const notificationBellDot =
    document.getElementById("notificationBellDot");

  const patientTopbarName =
    document.getElementById("patientTopbarName");


  /*
    The topbar name comes from the signed-in session, not from a copy of the
    registration form that was stored in the browser.
  */

  const sessionName =
    localStorage.getItem("mq_name");


  if (sessionName && patientTopbarName) {

    patientTopbarName.textContent =
      sessionName.split(" ")[0];

  }


  /*
    Notifications are derived from the rows the API returned for this patient -
    there is no sample feed. Only the read/unread flags are kept locally,
    because the database has no notification table.
  */

  function buildNotifications() {

    const data =
      typeof getData === "function" ? getData() : null;

    const patientId =
      localStorage.getItem("mq_patientId") ||
      localStorage.getItem("mq_userId") ||
      "";

    const items = [];

    const readIds = loadReadIds();

    const push = (item) => {
      items.push({
        unread: !readIds.includes(item.id),
        ...item
      });
    };


    (data && data.appointments || [])
      .filter((a) => !patientId || a.patientId === patientId)
      .forEach((a) => {
        const status = a.status || "Pending";
        const when = `${a.date || ""} ${a.time || ""}`.trim() || "No date set";
        push({
          id: `appt-${a.id}`,
          type: "appointment",
          title: `Appointment ${status.toLowerCase()}`,
          message: `${a.reason || "Consultation"} on ${when}${a.doctor ? " with " + a.doctor : ""}.`,
          time: when
        });
      });


    const queueEntry =
      data && patientId
        ? (data.queue || []).find(
            (q) =>
              q.id === patientId &&
              isTodayQueueEntry(q) &&
              !["Cancelled", "Completed"].includes(q.status)
          )
        : null;

    if (queueEntry) {
      // The queue number is issued when the booking joins the live queue, so
      // it is announced immediately. The fallback covers legacy rows only.
      push({
        id: `queue-${queueEntry.entryId || queueEntry.no}`,
        type: "queue",
        title: queueEntry.no ? "Queue update" : "Queue request received",
        message: queueEntry.no
          ? `Your queue number is ${queueEntry.no} and your status is ${queueEntry.status}.`
          : `Your booking is in the queue. Please ask reception if your queue number is not shown.`,
        time: queueEntry.queueDate || ""
      });
    }


    (data && data.prescriptions || [])
      .filter((p) => !patientId || p.patientId === patientId)
      .forEach((p) => {
        push({
          id: `rx-${p.id}`,
          type: "medical",
          title: `Prescription ${String(p.status || "pending").toLowerCase()}`,
          message: `${p.medication || "Medication"} - ${p.dosage || "see instructions"}.`,
          time: p.date || p.prescribedDate || ""
        });
      });


    (data && data.records || [])
      .filter((r) => !patientId || r.patientId === patientId)
      .forEach((r) => {
        push({
          id: `record-${r.recordId}`,
          type: "medical",
          title: "Medical record updated",
          message: `${r.diagnosis || r.condition || "Consultation recorded"}${r.doctor ? " - " + r.doctor : ""}.`,
          time: r.date || r.visitDate || ""
        });
      });


    return items;

  }


  function loadReadIds() {
    try {
      const raw = localStorage.getItem("mq_notifications_read");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }


  let notifications = buildNotifications();


  /*
    Return icon based on notification type.
  */

  function getNotificationIcon(type) {

    if (type === "appointment") {

      return `
        <svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <rect x="3" y="5" width="18" height="16" rx="2"></rect>
          <path d="M16 3v4"></path>
          <path d="M8 3v4"></path>
          <path d="M3 11h18"></path>
          <path d="m9 16 2 2 4-4"></path>
        </svg>
      `;

    }


    if (type === "queue") {

      return `
        <svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M12 7v5l3 2"></path>
        </svg>
      `;

    }


    if (type === "reminder") {

      return `
        <svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path>
          <path d="M10 21h4"></path>
        </svg>
      `;

    }


    if (type === "medical") {

      return `
        <svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <path d="M14 2v6h6"></path>
          <path d="M9 13h6"></path>
          <path d="M12 10v6"></path>
        </svg>
      `;

    }


    return `
      <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="9"></circle>
        <path d="M12 11v5"></path>
        <path d="M12 8h.01"></path>
      </svg>
    `;

  }


  /*
    Render notifications.
  */

  function renderNotifications() {

    if (notifications.length === 0) {

      notificationList.innerHTML = `
        <div class="notification-empty-state">

          <div class="notification-empty-icon">
            ✓
          </div>

          <h3>
            You're all caught up
          </h3>

          <p>
            You don't have any notifications at the moment.
          </p>

        </div>
      `;

      totalNotificationCount.textContent =
        "0";

      unreadNotificationCount.textContent =
        "0";

      notificationBellDot.style.display =
        "none";

      return;

    }


    notificationList.innerHTML =
      notifications.map(notification => `

        <div
          class="notification-page-item
          ${notification.unread ? "notification-unread" : ""}"
          data-id="${notification.id}"
        >

          <div
            class="notification-page-icon
            notification-icon-${notification.type}"
          >

            ${getNotificationIcon(notification.type)}

          </div>


          <div class="notification-page-content">

            <div class="notification-page-title-row">

              <div class="notification-page-title">

                ${notification.title}

                ${
                  notification.unread
                    ? `<span class="notification-unread-dot"></span>`
                    : ""
                }

              </div>


              <span class="notification-page-time">
                ${notification.time}
              </span>

            </div>


            <p class="notification-page-message">
              ${notification.message}
            </p>


            ${
              notification.unread
                ? `
                  <button
                    type="button"
                    class="notification-read-btn"
                    data-id="${notification.id}"
                  >
                    Mark as read
                  </button>
                `
                : ""
            }

          </div>

        </div>

      `).join("");


    const unreadCount =
      notifications.filter(
        notification =>
          notification.unread
      ).length;


    totalNotificationCount.textContent =
      notifications.length;


    unreadNotificationCount.textContent =
      unreadCount;


    notificationBellDot.style.display =
      unreadCount > 0
        ? "block"
        : "none";


    /*
      Individual Mark as Read buttons.
    */

    document
      .querySelectorAll(".notification-read-btn")
      .forEach(button => {

        button.addEventListener("click", () => {

          const notificationId =
            button.dataset.id;


          notifications =
            notifications.map(notification => {

              if (
                notification.id ===
                notificationId
              ) {

                return {
                  ...notification,
                  unread: false
                };

              }

              return notification;

            });


          saveNotifications();

          renderNotifications();

        });

      });

  }


  /*
    Save which notifications have been read. Only the ids are stored; the
    content always comes from the database.
  */

  function saveNotifications() {

    localStorage.setItem(
      "mq_notifications_read",
      JSON.stringify(
        notifications
          .filter(notification => !notification.unread)
          .map(notification => notification.id)
      )
    );

  }


  /*
    Mark all notifications as read.
  */

  markAllReadBtn.addEventListener("click", () => {

    notifications =
      notifications.map(notification => ({
        ...notification,
        unread: false
      }));


    saveNotifications();

    renderNotifications();

  });


  /*
    Logout
  */

  document
    .getElementById("patientLogout")
    .addEventListener("click", () => {

      localStorage.removeItem(
        "mq_role"
      );

    });


  renderNotifications();

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