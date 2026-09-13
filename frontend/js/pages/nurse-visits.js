// js/pages/nurse-visits.js

function loadNurseVisitsPage() {
  const data = getData();

  const assessments =
    Array.isArray(data.vitalSigns)
      ? data.vitalSigns
      : [];

  updateSummaryCards(data, assessments);
  renderAssessmentTable(assessments);
  setupModalEvents();
}


// --------------------------------------
// SUMMARY CARDS
// --------------------------------------
function updateSummaryCards(data, assessments) {
  const completedCount = assessments.length;

  const readyForDoctorCount =
    Array.isArray(data.queue)
      ? data.queue.filter(
          (patient) =>
            patient.status === "Ready for Doctor"
        ).length
      : 0;

  setText(
    "completedAssessmentCount",
    completedCount
  );

  setText(
    "readyForDoctorCount",
    readyForDoctorCount
  );

  const badge =
    document.getElementById(
      "assessmentCountBadge"
    );

  if (badge) {
    badge.textContent =
      `${completedCount} ${
        completedCount === 1
          ? "Assessment"
          : "Assessments"
      }`;
  }
}


// --------------------------------------
// RENDER TABLE
// --------------------------------------
function renderAssessmentTable(assessments) {
  const tableBody =
    document.getElementById(
      "nurseVisitsBody"
    );

  const emptyState =
    document.getElementById(
      "visitsEmptyState"
    );

  if (!tableBody) {
    return;
  }

  if (assessments.length === 0) {
    tableBody.innerHTML = "";

    if (emptyState) {
      emptyState.style.display = "block";
    }

    return;
  }

  if (emptyState) {
    emptyState.style.display = "none";
  }

  const sortedAssessments =
    [...assessments].sort(
      (a, b) =>
        new Date(b.assessedAt) -
        new Date(a.assessedAt)
    );

  tableBody.innerHTML =
    sortedAssessments
      .map((assessment, index) => {

        return `
          <tr>

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
                  ${getInitials(
                    assessment.patientName
                  )}
                </div>

                <div>

                  <div
                    style="
                      font-weight:700;
                      color:var(--ink);
                    "
                  >
                    ${escapeHtml(
                      assessment.patientName
                    )}
                  </div>

                  <div
                    style="
                      font-size:10px;
                      color:var(--slate);
                      margin-top:2px;
                    "
                  >
                    Queue:
                    ${escapeHtml(
                      assessment.queueNumber
                    )}
                  </div>

                </div>

              </div>
            </td>


            <td>
              ${escapeHtml(
                assessment.patientId
              )}
            </td>


            <td>
              ${escapeHtml(
                assessment.department
              )}
            </td>


            <td>
              ${escapeHtml(
                assessment.bloodPressure
              )}
            </td>


            <td>
              ${formatTemperature(
                assessment.temperature
              )}
            </td>


            <td>
              ${formatHeartRate(
                assessment.heartRate
              )}
            </td>


            <td>
              ${formatWeight(
                assessment.weight
              )}
            </td>


            <td>
              <span class="badge badge-teal">
                Completed
              </span>
            </td>


            <td>
              <button
                type="button"
                class="btn btn-primary btn-sm"
                onclick="openAssessmentModal(${index})"
              >
                View Details
              </button>
            </td>

          </tr>
        `;
      })
      .join("");

  window.currentAssessments =
    sortedAssessments;
}


// --------------------------------------
// OPEN ASSESSMENT DETAILS
// --------------------------------------
function openAssessmentModal(index) {
  const assessments =
    window.currentAssessments || [];

  const assessment =
    assessments[index];

  if (!assessment) {
    return;
  }

  setText(
    "modalPatientName",
    assessment.patientName || "-"
  );

  setText(
    "modalPatientId",
    assessment.patientId || "-"
  );

  setText(
    "modalQueueNumber",
    assessment.queueNumber || "-"
  );

  setText(
    "modalDepartment",
    assessment.department || "-"
  );

  setText(
    "modalBloodPressure",
    assessment.bloodPressure || "-"
  );

  setText(
    "modalTemperature",
    formatTemperature(
      assessment.temperature
    )
  );

  setText(
    "modalHeartRate",
    formatHeartRate(
      assessment.heartRate
    )
  );

  setText(
    "modalWeight",
    formatWeight(
      assessment.weight
    )
  );

  setText(
    "modalOxygen",
    formatOxygen(
      assessment.oxygenSaturation
    )
  );

  setText(
    "modalRespiratoryRate",
    formatRespiratoryRate(
      assessment.respiratoryRate
    )
  );

  setText(
    "modalSymptoms",
    assessment.symptoms || "-"
  );

  setText(
    "modalNurseNotes",
    assessment.nurseNotes || "No additional notes."
  );

  setText(
    "modalAssessedBy",
    assessment.assessedBy || "Nurse"
  );

  setText(
    "modalAssessedAt",
    formatDateTime(
      assessment.assessedAt
    )
  );

  const modal =
    document.getElementById(
      "assessmentModal"
    );

  if (modal) {
    modal.style.display = "flex";
  }
}


// --------------------------------------
// CLOSE MODAL
// --------------------------------------
function closeAssessmentModal() {
  const modal =
    document.getElementById(
      "assessmentModal"
    );

  if (modal) {
    modal.style.display = "none";
  }
}


// --------------------------------------
// MODAL EVENTS
// --------------------------------------
function setupModalEvents() {
  const closeX =
    document.getElementById(
      "closeAssessmentModal"
    );

  const closeButton =
    document.getElementById(
      "modalCloseButton"
    );

  const modal =
    document.getElementById(
      "assessmentModal"
    );

  if (closeX) {
    closeX.addEventListener(
      "click",
      closeAssessmentModal
    );
  }

  if (closeButton) {
    closeButton.addEventListener(
      "click",
      closeAssessmentModal
    );
  }

  if (modal) {
    modal.addEventListener(
      "click",
      (event) => {
        if (event.target === modal) {
          closeAssessmentModal();
        }
      }
    );
  }

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") {
        closeAssessmentModal();
      }
    }
  );
}


// --------------------------------------
// FORMAT TEMPERATURE
// --------------------------------------
function formatTemperature(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  return `${value} °C`;
}


// --------------------------------------
// FORMAT HEART RATE
// --------------------------------------
function formatHeartRate(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  return `${value} bpm`;
}


// --------------------------------------
// FORMAT WEIGHT
// --------------------------------------
function formatWeight(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  return `${value} kg`;
}


// --------------------------------------
// FORMAT OXYGEN
// --------------------------------------
function formatOxygen(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not recorded";
  }

  return `${value}%`;
}


// --------------------------------------
// FORMAT RESPIRATORY RATE
// --------------------------------------
function formatRespiratoryRate(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not recorded";
  }

  return `${value} breaths/min`;
}


// --------------------------------------
// FORMAT DATE & TIME
// --------------------------------------
function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString(
    "en-ZA",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  );
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
    .map(
      (part) =>
        part.charAt(0).toUpperCase()
    )
    .join("");
}


// --------------------------------------
// SAFE TEXT
// --------------------------------------
function setText(elementId, value) {
  const element =
    document.getElementById(
      elementId
    );

  if (element) {
    element.textContent = value;
  }
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
// START PAGE
// --------------------------------------
document.addEventListener(
  "DOMContentLoaded",
  loadNurseVisitsPage
);