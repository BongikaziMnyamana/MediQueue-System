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

function doctorQueueEntries(data) {
  const doctorId = localStorage.getItem("mq_staffId") || "";
  if (!doctorId) {
    return [];
  }
  return (data.queue || []).filter(
    (entry) =>
      entry.doctorId === doctorId &&
      !["Cancelled", "Completed"].includes(entry.status)
  );
}

function renderDoctorQueue() {
  const data =
    getData();


  const queue =
    doctorQueueEntries(data);


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
        patient.status === "Waiting" ||
        patient.status === "Ready for Doctor" ||
        patient.status === "Pending"
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
          queueNoSortKey(a);


        const numberB =
          queueNoSortKey(b);


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
                    queueNoLabel(patient)
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
                  "—"
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
                  : patient.entryId
                    ? `
                      <button
                        class="btn btn-gold btn-sm"
                        type="button"
                        data-start-queue="${esc(patient.entryId)}"
                      >
                        Start consultation
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


  /* =====================================================
     START CONSULTATION FROM THE QUEUE
  ===================================================== */

  document
    .querySelectorAll("[data-start-queue]")
    .forEach(button => {

      button.addEventListener("click", async () => {
        const entryId = button.getAttribute("data-start-queue");
        if (!entryId) {
          return;
        }

        const data = getData();
        const doctorId = localStorage.getItem("mq_staffId") || "";
        const inProgress = (data.queue || []).find(
          (entry) =>
            entry.status === "In Consultation" &&
            entry.doctorId === doctorId &&
            entry.entryId !== entryId
        );
        if (inProgress) {
          alert("Please complete the current consultation before starting another patient.");
          window.location.href = "doctor-dashboard.html";
          return;
        }

        button.disabled = true;
        button.textContent = "Starting...";

        const updated = await setQueueEntryStatusAsync(entryId, "In Consultation");
        if (!updated.ok) {
          alert(updated.error || "Could not start the consultation on the server.");
          button.disabled = false;
          button.textContent = "Start consultation";
          return;
        }

        window.location.href = "doctor-dashboard.html";
      });

    });
}


/* =========================================================
   START
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  renderDoctorQueue
);