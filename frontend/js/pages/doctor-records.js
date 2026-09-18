// js/pages/doctor-records.js

let allDoctorRecords = [];
let visibleDoctorRecords = [];


/* =========================================================
   HELPERS
========================================================= */

function safeText(value, fallback = "Not recorded") {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return fallback;
  }

  return String(value);
}


function getRecordDiagnosis(record) {
  return (
    record.diagnosis ||
    record.condition ||
    "Not recorded"
  );
}


function getRecordDate(record) {
  return (
    record.lastVisit ||
    record.visitDate ||
    record.date ||
    "Not recorded"
  );
}


/* =========================================================
   RENDER RECORDS
========================================================= */

function renderDoctorRecords(records) {
  visibleDoctorRecords = records;

  const body =
    document.getElementById("doctorRecordsBody");

  const countLabel =
    document.getElementById("doctorRecordsBodyCount");

  const emptyState =
    document.getElementById("recordsEmptyState");


  countLabel.textContent =
    `${records.length} ${
      records.length === 1
        ? "record"
        : "records"
    }`;


  if (records.length === 0) {
    body.innerHTML = "";

    emptyState.style.display =
      "block";

    return;
  }


  emptyState.style.display =
    "none";


  body.innerHTML = records
    .map((record, index) => {

      return `

        <tr>

          <td>
            ${esc(
              safeText(
                record.patient,
                "Unknown patient"
              )
            )}
          </td>


          <td>
            ${esc(
              safeText(
                record.patientId,
                "—"
              )
            )}
          </td>


          <td>
            ${esc(
              getRecordDiagnosis(record)
            )}
          </td>


          <td>
            ${esc(
              getRecordDate(record)
            )}
          </td>


          <td>
            ${esc(
              safeText(
                record.doctor,
                "Not recorded"
              )
            )}
          </td>


          <td>

            <button
              class="btn btn-ghost"
              type="button"
              data-record-index="${index}"
            >
              View
            </button>

          </td>

        </tr>

      `;

    })
    .join("");


  document
    .querySelectorAll(
      "[data-record-index]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const index =
            Number(
              button.dataset.recordIndex
            );

          openRecordDetails(
            visibleDoctorRecords[index]
          );

        }
      );

    });
}


/* =========================================================
   RECORD DETAILS
========================================================= */

function openRecordDetails(record) {
  if (!record) {
    return;
  }


  const panel =
    document.getElementById(
      "recordDetailPanel"
    );

  const content =
    document.getElementById(
      "recordDetailContent"
    );


  content.innerHTML = `

    <!-- Patient -->

    <div
      style="
        display:flex;
        align-items:center;
        gap:14px;
        margin-bottom:22px;
      "
    >

      <div class="consult-avatar">

        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 21v-2a6 6 0 0 1 12 0v2"/>
        </svg>

      </div>


      <div>

        <div
          class="consult-name"
        >
          ${esc(
            safeText(
              record.patient,
              "Unknown patient"
            )
          )}
        </div>


        <div
          class="consult-meta"
        >
          ${esc(
            safeText(
              record.patientId,
              "Patient ID unavailable"
            )
          )}
        </div>

      </div>

    </div>


    <!-- Basic consultation details -->

    <div
      style="
        display:grid;
        grid-template-columns:
          repeat(3, 1fr);
        gap:16px;
        margin-bottom:22px;
      "
    >

      <div>

        <div
          style="
            font-size:11px;
            color:var(--slate);
            margin-bottom:4px;
          "
        >
          Visit Date
        </div>

        <div
          style="
            font-size:13px;
            font-weight:700;
          "
        >
          ${esc(
            getRecordDate(record)
          )}
        </div>

      </div>


      <div>

        <div
          style="
            font-size:11px;
            color:var(--slate);
            margin-bottom:4px;
          "
        >
          Department
        </div>

        <div
          style="
            font-size:13px;
            font-weight:700;
          "
        >
          ${esc(
            safeText(
              record.department,
              "General Medicine"
            )
          )}
        </div>

      </div>


      <div>

        <div
          style="
            font-size:11px;
            color:var(--slate);
            margin-bottom:4px;
          "
        >
          Doctor
        </div>

        <div
          style="
            font-size:13px;
            font-weight:700;
          "
        >
          ${esc(
            safeText(
              record.doctor
            )
          )}
        </div>

      </div>

    </div>


    <!-- Chief complaint -->

    <div
      style="
        margin-bottom:18px;
        padding:16px;
        border:1px solid var(--line);
        border-radius:8px;
      "
    >

      <div
        style="
          font-size:11px;
          color:var(--slate);
          margin-bottom:6px;
        "
      >
        Chief Complaint
      </div>

      <div
        style="
          font-size:13px;
          line-height:1.5;
        "
      >
        ${esc(
          safeText(
            record.complaint
          )
        )}
      </div>

    </div>


    <!-- Diagnosis -->

    <div
      style="
        margin-bottom:18px;
        padding:16px;
        border:1px solid var(--line);
        border-radius:8px;
      "
    >

      <div
        style="
          font-size:11px;
          color:var(--slate);
          margin-bottom:6px;
        "
      >
        Diagnosis
      </div>

      <div
        style="
          font-size:13px;
          font-weight:700;
          line-height:1.5;
        "
      >
        ${esc(
          getRecordDiagnosis(record)
        )}
      </div>

    </div>


    <!-- Consultation Notes -->

    <div
      style="
        padding:16px;
        border:1px solid var(--line);
        border-radius:8px;
        background:var(--bg);
      "
    >

      <div
        style="
          font-size:11px;
          color:var(--slate);
          margin-bottom:6px;
        "
      >
        Consultation Notes
      </div>

      <div
        style="
          font-size:13px;
          line-height:1.6;
          white-space:pre-wrap;
        "
      >
        ${esc(
          safeText(
            record.notes
          )
        )}
      </div>

    </div>

  `;


  panel.style.display =
    "block";


  panel.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


/* =========================================================
   CLOSE DETAILS
========================================================= */

function closeRecordDetails() {
  document.getElementById(
    "recordDetailPanel"
  ).style.display = "none";
}


/* =========================================================
   SEARCH
========================================================= */

function filterRecords(searchTerm) {
  const term =
    searchTerm
      .trim()
      .toLowerCase();


  if (!term) {
    renderDoctorRecords(
      allDoctorRecords
    );

    return;
  }


  const filtered =
    allDoctorRecords.filter(record => {

      const searchable = [
        record.patient,
        record.patientId,
        record.diagnosis,
        record.condition,
        record.doctor,
        record.department,
        record.complaint
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();


      return searchable.includes(term);

    });


  renderDoctorRecords(filtered);
}


/* =========================================================
   DASHBOARD "VIEW HISTORY" SUPPORT
========================================================= */

function openSelectedPatientHistory() {
  const selectedPatientId =
    localStorage.getItem(
      "mq_selected_patient_id"
    );

  const selectedPatientName =
    localStorage.getItem(
      "mq_selected_patient_name"
    );


  if (
    !selectedPatientId &&
    !selectedPatientName
  ) {
    return;
  }


  const patientRecords =
    allDoctorRecords.filter(record => {

      const idMatches =
        selectedPatientId &&
        String(record.patientId) ===
          String(selectedPatientId);


      const nameMatches =
        selectedPatientName &&
        String(
          record.patient || ""
        ).toLowerCase() ===
          String(
            selectedPatientName
          ).toLowerCase();


      return (
        idMatches ||
        nameMatches
      );

    });


  const search =
    document.getElementById(
      "recordSearch"
    );


  if (selectedPatientName) {
    search.value =
      selectedPatientName;
  } else {
    search.value =
      selectedPatientId;
  }


  renderDoctorRecords(
    patientRecords
  );


  /*
    If there is at least one previous consultation,
    open the most recent one automatically.
  */
  if (patientRecords.length > 0) {
    openRecordDetails(
      patientRecords[0]
    );
  }


  /*
    Clear the temporary selection so refreshing the
    records page later does not keep forcing the same
    patient filter.
  */
  localStorage.removeItem(
    "mq_selected_patient_id"
  );

  localStorage.removeItem(
    "mq_selected_patient_name"
  );
}


/* =========================================================
   START
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const data = getData();


    allDoctorRecords =
      Array.isArray(data.records)
        ? data.records
        : [];


    renderDoctorRecords(
      allDoctorRecords
    );


    document
      .getElementById(
        "recordSearch"
      )
      .addEventListener(
        "input",
        event => {
          filterRecords(
            event.target.value
          );
        }
      );


    document
      .getElementById(
        "closeRecordDetailBtn"
      )
      .addEventListener(
        "click",
        closeRecordDetails
      );


    openSelectedPatientHistory();

  }
);