// js/pages/doctor-queue.js


/* =========================================================
   HELPERS
========================================================= */

function queueSafeText(value, fallback = "—") {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return fallback;
  }

  return String(value);
}


/* =========================================================
   QUEUE STATUS DISPLAY
========================================================= */

function queueStatusBadge(status) {
  const value =
    queueSafeText(
      status,
      "Unknown"
    );


  if (value === "In Consultation") {
    return `
      <span
        style="
          display:inline-block;
          background:var(--teal-tint);
          color:var(--teal);
          padding:5px 9px;
          border-radius:999px;
          font-size:11px;
          font-weight:700;
        "
      >
        In Consultation
      </span>
    `;
  }


  if (value === "Waiting") {
    return `
      <span
        style="
          display:inline-block;
          background:var(--gold-tint);
          color:var(--gold-dark);
          padding:5px 9px;
          border-radius:999px;
          font-size:11px;
          font-weight:700;
        "
      >
        Waiting
      </span>
    `;
  }


  return badge(value);
}


/* =========================================================
   RENDER QUEUE
========================================================= */

function renderDoctorQueue() {
  const data =
    getData();


  const queue =
    Array.isArray(data.queue)
      ? data.queue
      : [];


  const body =
    document.getElementById(
      "doctorQueueBody"
    );


  const countLabel =
    document.getElementById(
      "doctorQueueBodyCount"
    );


  const emptyState =
    document.getElementById(
      "doctorQueueEmptyState"
    );


  const total =
    queue.length;


  const waiting =
    queue.filter(
      patient =>
        patient.status === "Waiting"
    ).length;


  const inConsultation =
    queue.filter(
      patient =>
        patient.status ===
        "In Consultation"
    ).length;


  /* ---------- Summary cards ---------- */

  document.getElementById(
    "queueTotalCount"
  ).textContent =
    total;


  document.getElementById(
    "queueWaitingCount"
  ).textContent =
    waiting;


  document.getElementById(
    "queueConsultCount"
  ).textContent =
    inConsultation;


  /* ---------- Count ---------- */

  countLabel.textContent =
    `${total} ${
      total === 1
        ? "patient"
        : "patients"
    }`;


  /* ---------- Empty queue ---------- */

  if (total === 0) {

    body.innerHTML =
      "";

    emptyState.style.display =
      "block";

    return;
  }


  emptyState.style.display =
    "none";


  /* =====================================================
     SORT QUEUE

     Current consultation appears first.
     Waiting patients follow by queue number.
  ===================================================== */

  const sortedQueue =
    [...queue].sort(
      (a, b) => {

        if (
          a.status ===
          "In Consultation"
        ) {
          return -1;
        }


        if (
          b.status ===
          "In Consultation"
        ) {
          return 1;
        }


        const numberA =
          Number(a.no) || 0;


        const numberB =
          Number(b.no) || 0;


        return numberA - numberB;

      }
    );


  /* =====================================================
     TABLE
  ===================================================== */

  body.innerHTML =
    sortedQueue
      .map(patient => {

        const isCurrent =
          patient.status ===
          "In Consultation";


        return `

          <tr
            ${
              isCurrent
                ? `
                  style="
                    background:var(--teal-tint);
                  "
                `
                : ""
            }
          >

            <!-- Queue number -->
            <td>

              <strong>
                ${esc(
                  queueSafeText(
                    patient.no
                  )
                )}
              </strong>

            </td>


            <!-- Patient -->
            <td>

              <div
                style="
                  font-weight:700;
                  color:var(--ink);
                "
              >
                ${esc(
                  queueSafeText(
                    patient.patient,
                    "Unknown patient"
                  )
                )}
              </div>


              ${
                patient.phone
                  ? `
                    <div
                      style="
                        font-size:10.5px;
                        color:var(--slate);
                        margin-top:3px;
                      "
                    >
                      ${esc(
                        patient.phone
                      )}
                    </div>
                  `
                  : ""
              }

            </td>


            <!-- Patient ID -->
            <td>

              ${esc(
                queueSafeText(
                  patient.id
                )
              )}

            </td>


            <!-- Department -->
            <td>

              ${esc(
                queueSafeText(
                  patient.dept,
                  "General Medicine"
                )
              )}

            </td>


            <!-- Status -->
            <td>

              ${queueStatusBadge(
                patient.status
              )}

            </td>


            <!-- Waiting Time -->
            <td>

              ${esc(
                queueSafeText(
                  patient.wait,
                  "—"
                )
              )}

            </td>


            <!-- Action -->
            <td>

              ${
                isCurrent
                  ? `
                    <button
                      class="btn btn-primary"
                      type="button"
                      data-open-consultation
                    >
                      Go to Consultation
                    </button>
                  `
                  : `
                    <span
                      style="
                        font-size:11px;
                        color:var(--slate);
                      "
                    >
                      Waiting
                    </span>
                  `
              }

            </td>

          </tr>

        `;

      })
      .join("");


  /* =====================================================
     CURRENT CONSULTATION BUTTON
  ===================================================== */

  document
    .querySelectorAll(
      "[data-open-consultation]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          window.location.href =
            "doctor-dashboard.html";

        }
      );

    });
}


/* =========================================================
   START
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  renderDoctorQueue
);