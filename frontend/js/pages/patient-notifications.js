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
    Load patient name from registration.
  */

  const storedPatient =
    localStorage.getItem("mq_patient");


  if (storedPatient) {

    try {

      const patient =
        JSON.parse(storedPatient);


      if (patient.fullName) {

        patientTopbarName.textContent =
          patient.fullName.split(" ")[0];

      }

    } catch (error) {

      console.log(
        "Could not load patient information."
      );

    }

  }


  /*
    Temporary frontend notifications.

    Later these will come from the backend.
  */

  const defaultNotifications = [

    {
      id: 1,
      type: "appointment",
      title: "Appointment Confirmed",
      message:
        "Your appointment has been successfully confirmed.",
      time: "Today, 14:30",
      unread: true
    },

    {
      id: 2,
      type: "queue",
      title: "Queue Update",
      message:
        "Your queue number is A-023. Your turn is coming soon.",
      time: "Today, 13:45",
      unread: true
    },

    {
      id: 3,
      type: "reminder",
      title: "Appointment Reminder",
      message:
        "Please arrive at least 15 minutes before your appointment.",
      time: "Today, 09:00",
      unread: true
    },

    {
      id: 4,
      type: "medical",
      title: "Medical Record Updated",
      message:
        "Your latest vital signs and visit information are now available.",
      time: "28 Aug 2026",
      unread: false
    },

    {
      id: 5,
      type: "system",
      title: "Welcome to MediQueue",
      message:
        "You can manage appointments, monitor your queue and view your medical record from your patient portal.",
      time: "27 Aug 2026",
      unread: false
    }

  ];


  /*
    Load saved notification state if available.
  */

  const storedNotifications =
    localStorage.getItem("mq_notifications");


  let notifications =
    defaultNotifications;


  if (storedNotifications) {

    try {

      notifications =
        JSON.parse(storedNotifications);

    } catch (error) {

      notifications =
        defaultNotifications;

    }

  }


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
            Number(button.dataset.id);


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
    Save notification state.
  */

  function saveNotifications() {

    localStorage.setItem(
      "mq_notifications",
      JSON.stringify(notifications)
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