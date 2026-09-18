// js/pages/nurse-dashboard.js

function renderNurseDashboard() {
  const data = getData();

  const profile =
    data.profiles && data.profiles.NURSE
      ? data.profiles.NURSE
      : { name: "Nurse" };

  // -----------------------------
  // WELCOME / PROFILE
  // -----------------------------
  const welcomeMsg = document.getElementById("welcomeMsg");
  if (welcomeMsg) {
    welcomeMsg.textContent = `Welcome, ${profile.name}`;
  }

  const userName = document.querySelector(".user-name");
  if (userName) {
    userName.textContent = profile.name;
  }

  const dateLabel = document.getElementById("dateLabel");
  if (dateLabel) {
    dateLabel.textContent = new Date().toLocaleDateString("en-ZA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }


  // -----------------------------
  // DASHBOARD COUNTS
  // -----------------------------
  const waitingPatients =
    Array.isArray(data.queue)
      ? data.queue.filter((patient) => patient.status === "Waiting")
      : [];

  const patientsSeenToday =
    typeof data.seenToday === "number"
      ? data.seenToday
      : 0;

  /*
    For now, we do not yet have a separate vital-signs
    collection in data.js.

    So for the frontend prototype:
    - Waiting patients are treated as still requiring assessment.
    - In Consultation patients are treated as assessment completed.
  */

  const pendingVitals =
    Array.isArray(data.queue)
      ? data.queue.filter((patient) => patient.status === "Waiting")
      : [];

  const completedAssessments =
    Array.isArray(data.queue)
      ? data.queue.filter(
          (patient) => patient.status === "In Consultation"
        )
      : [];


  setText(
    "patientsWaitingCount",
    waitingPatients.length
  );

  setText(
    "patientsSeenCount",
    patientsSeenToday
  );

  setText(
    "pendingVitalsCount",
    pendingVitals.length
  );

  setText(
    "completedAssessmentsCount",
    completedAssessments.length
  );


  // -----------------------------
  // CURRENT PATIENT QUEUE
  // -----------------------------
  renderNurseQueue(waitingPatients);


  // -----------------------------
  // RECENT ACTIVITY
  // -----------------------------
  renderRecentActivity(data);
}


// --------------------------------------
// HELPER: SET TEXT SAFELY
// --------------------------------------
function setText(elementId, value) {
  const element = document.getElementById(elementId);

  if (element) {
    element.textContent = value;
  }
}


// --------------------------------------
// CURRENT QUEUE
// --------------------------------------
function renderNurseQueue(waitingPatients) {
  const queueContainer =
    document.getElementById("nurseQueueList");

  if (!queueContainer) {
    return;
  }

  if (!waitingPatients.length) {
    queueContainer.innerHTML = `
      <div
        style="
          padding:24px 0;
          text-align:center;
          color:var(--slate);
          font-size:13px;
        "
      >
        No patients are currently waiting for nurse assessment.
      </div>
    `;

    return;
  }


  // Only show the first 4 patients on the dashboard.
  const dashboardPatients =
    waitingPatients.slice(0, 4);


  queueContainer.innerHTML =
    dashboardPatients
      .map((patient) => {

        return `
          <div
            style="
              display:flex;
              justify-content:space-between;
              align-items:center;
              gap:18px;
              padding:15px 0;
              border-bottom:1px solid var(--line);
            "
          >

            <div
              style="
                display:flex;
                align-items:center;
                gap:12px;
                min-width:0;
              "
            >

              <div
                style="
                  width:38px;
                  height:38px;
                  border-radius:50%;
                  background:var(--teal-tint);
                  color:var(--teal);
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  font-size:13px;
                  font-weight:800;
                  flex-shrink:0;
                "
              >
                ${getInitials(patient.patient)}
              </div>


              <div>

                <div
                  style="
                    font-size:13px;
                    font-weight:700;
                    color:var(--ink);
                  "
                >
                  ${escapeHtml(patient.patient)}
                </div>

                <div
                  style="
                    font-size:11px;
                    color:var(--slate);
                    margin-top:3px;
                  "
                >
                  ${escapeHtml(patient.no)}
                  &nbsp;•&nbsp;
                  ${escapeHtml(patient.dept)}
                </div>

              </div>

            </div>


            <div
              style="
                display:flex;
                align-items:center;
                gap:14px;
              "
            >

              <div
                style="
                  text-align:right;
                "
              >

                <div
                  style="
                    font-size:11px;
                    font-weight:700;
                    color:var(--gold-dark);
                  "
                >
                  ${escapeHtml(patient.wait)}
                </div>

                <div
                  style="
                    font-size:10px;
                    color:var(--slate);
                    margin-top:2px;
                  "
                >
                  Waiting
                </div>

              </div>


              <a
                href="nurse-queue.html"
                class="btn btn-primary btn-sm"
                style="
                  text-decoration:none;
                  white-space:nowrap;
                "
              >
                Assess
              </a>

            </div>

          </div>
        `;
      })
      .join("");
}


// --------------------------------------
// RECENT ACTIVITY
// --------------------------------------
function renderRecentActivity(data) {
  const activityContainer =
    document.getElementById("nurseRecentActivity");

  if (!activityContainer) {
    return;
  }


  /*
    These are frontend prototype activities.

    Once the backend and Vital_Signs data are connected,
    this section can be populated from actual nurse actions.
  */

  const activities = [
    {
      title: "Vital signs recorded",
      description:
        "Sipho Dlamini's assessment was completed.",
      time: "09:10 AM"
    },
    {
      title: "Patient prepared for consultation",
      description:
        "Sipho Dlamini was moved to consultation.",
      time: "09:15 AM"
    },
    {
      title: "Patient waiting",
      description:
        "Nomsa Khumalo is waiting for nurse assessment.",
      time: "10:05 AM"
    },
    {
      title: "Patient waiting",
      description:
        "Thabo Mokoena is waiting for nurse assessment.",
      time: "10:20 AM"
    }
  ];


  activityContainer.innerHTML =
    activities
      .map((activity) => {

        return `
          <div class="activity-item">

            <div class="activity-dot"></div>

            <div class="activity-content">

              <div class="activity-title">
                ${escapeHtml(activity.title)}
              </div>

              <div class="activity-description">
                ${escapeHtml(activity.description)}
              </div>

            </div>

            <div class="activity-date">
              ${escapeHtml(activity.time)}
            </div>

          </div>
        `;
      })
      .join("");
}


// --------------------------------------
// INITIALS
// --------------------------------------
function getInitials(name) {
  if (!name) {
    return "?";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}


// --------------------------------------
// BASIC HTML ESCAPING
// --------------------------------------
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// --------------------------------------
// START DASHBOARD
// --------------------------------------
document.addEventListener(
  "DOMContentLoaded",
  renderNurseDashboard
);