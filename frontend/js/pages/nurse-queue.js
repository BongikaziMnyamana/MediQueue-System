// js/pages/nurse-queue.js

function renderNurseQueuePage() {
  const data = getData();

  const waitingPatients = Array.isArray(data.queue)
    ? data.queue.filter((patient) => patient.status === "Waiting")
    : [];

  updateQueueCount(waitingPatients.length);
  renderQueueTable(waitingPatients);
}


// --------------------------------------
// UPDATE WAITING COUNT
// --------------------------------------
function updateQueueCount(count) {
  const badge = document.getElementById("queueCountBadge");

  if (!badge) {
    return;
  }

  badge.textContent =
    `${count} ${count === 1 ? "Waiting" : "Waiting"}`;
}


// --------------------------------------
// RENDER QUEUE TABLE
// --------------------------------------
function renderQueueTable(waitingPatients) {
  const tableBody =
    document.getElementById("nurseQueueBody");

  const emptyState =
    document.getElementById("queueEmptyState");

  if (!tableBody) {
    return;
  }


  if (waitingPatients.length === 0) {
    tableBody.innerHTML = "";

    if (emptyState) {
      emptyState.style.display = "block";
    }

    return;
  }


  if (emptyState) {
    emptyState.style.display = "none";
  }


  tableBody.innerHTML =
    waitingPatients
      .map((patient) => {

        return `
          <tr>

            <td>
              <strong>
                ${escapeHtml(patient.no)}
              </strong>
            </td>


            <td>
              <div
                style="
                  display:flex;
                  align-items:center;
                  gap:10px;
                "
              >

                <div
                  style="
                    width:34px;
                    height:34px;
                    border-radius:50%;
                    background:var(--teal-tint);
                    color:var(--teal);
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    font-size:11px;
                    font-weight:800;
                    flex-shrink:0;
                  "
                >
                  ${getInitials(patient.patient)}
                </div>


                <div>

                  <div
                    style="
                      font-weight:700;
                      color:var(--ink);
                    "
                  >
                    ${escapeHtml(patient.patient)}
                  </div>


                  <div
                    style="
                      font-size:10px;
                      color:var(--slate);
                      margin-top:2px;
                    "
                  >
                    ${escapeHtml(patient.gender)}
                    &nbsp;•&nbsp;
                    ${escapeHtml(patient.age)} years
                  </div>

                </div>

              </div>
            </td>


            <td>
              ${escapeHtml(patient.id)}
            </td>


            <td>
              ${escapeHtml(patient.dept)}
            </td>


            <td>
              ${escapeHtml(patient.wait)}
            </td>


            <td>
              <span class="badge badge-gold">
                Waiting
              </span>
            </td>


            <td>

              <button
                type="button"
                class="btn btn-primary btn-sm"
                onclick="assessPatient('${escapeAttribute(patient.id)}')"
              >
                Assess Patient
              </button>

            </td>

          </tr>
        `;
      })
      .join("");
}


// --------------------------------------
// ASSESS PATIENT
// --------------------------------------
function assessPatient(patientId) {
  /*
    Store the selected patient ID temporarily so the
    nurse assessment page knows which patient was chosen.
  */

  localStorage.setItem(
    "mq_selected_patient_id",
    patientId
  );


  /*
    The next page we will create is:
    nurse-assessment.html
  */

  window.location.href =
    "nurse-assessment.html";
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
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");
}


// --------------------------------------
// ESCAPE HTML
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
// ESCAPE HTML ATTRIBUTE
// --------------------------------------
function escapeAttribute(value) {
  return String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'");
}


// --------------------------------------
// START PAGE
// --------------------------------------
document.addEventListener(
  "DOMContentLoaded",
  renderNurseQueuePage
);