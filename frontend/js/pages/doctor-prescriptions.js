// js/pages/doctor-prescriptions.js

const DOCTOR_NAME = "Dr. N. Zulu";

let doctorPrescriptions = [];


/* =========================================================
   HELPERS
========================================================= */

function safeRxText(value, fallback = "Not recorded") {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return fallback;
  }

  return String(value);
}


function getPrescriptionDate() {
  return new Date().toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}


function getPrescriptionISODate() {
  return new Date().toISOString().split("T")[0];
}


/* =========================================================
   GENERATE PRESCRIPTION ID
========================================================= */

function generatePrescriptionId(data) {
  const prescriptions =
    Array.isArray(data.prescriptions)
      ? data.prescriptions
      : [];


  let highestNumber = 0;


  prescriptions.forEach(prescription => {

    const match =
      String(prescription.id || "")
        .match(/(\d+)/);


    if (match) {

      const number =
        Number(match[1]);


      if (number > highestNumber) {
        highestNumber = number;
      }

    }

  });


  const nextNumber =
    highestNumber + 1;


  return `RX-${String(nextNumber).padStart(4, "0")}`;
}


/* =========================================================
   BUILD PATIENT LIST
========================================================= */

function getAvailablePatients(data) {
  const patients = new Map();


  /*
    Add patients currently in the queue.
  */
  if (Array.isArray(data.queue)) {

    data.queue.forEach(patient => {

      if (!patient.patient) {
        return;
      }


      const key =
        patient.id ||
        patient.patient;


      patients.set(
        String(key),
        {
          id: patient.id || "",
          name: patient.patient
        }
      );

    });

  }


  /*
    Add patients who already have consultation records.

    This allows the doctor to prescribe medication after
    completing the consultation and removing the patient
    from the active queue.
  */
  if (Array.isArray(data.records)) {

    data.records.forEach(record => {

      if (!record.patient) {
        return;
      }


      const key =
        record.patientId ||
        record.patient;


      if (!patients.has(String(key))) {

        patients.set(
          String(key),
          {
            id: record.patientId || "",
            name: record.patient
          }
        );

      }

    });

  }


  return Array.from(
    patients.values()
  );
}


/* =========================================================
   POPULATE PATIENT SELECT
========================================================= */

function populatePatientSelect(data) {
  const select =
    document.getElementById("rxPatient");


  const patients =
    getAvailablePatients(data);


  select.innerHTML = `
    <option value="">
      Select patient
    </option>

    ${patients
      .map(patient => {

        const value =
          encodeURIComponent(
            JSON.stringify(patient)
          );


        return `
          <option value="${value}">
            ${esc(patient.name)}
            ${
              patient.id
                ? ` (${esc(patient.id)})`
                : ""
            }
          </option>
        `;

      })
      .join("")}
  `;
}


/* =========================================================
   READ SELECTED PATIENT
========================================================= */

function getSelectedPatient() {
  const value =
    document
      .getElementById("rxPatient")
      .value;


  if (!value) {
    return null;
  }


  try {

    return JSON.parse(
      decodeURIComponent(value)
    );

  } catch (error) {

    console.error(
      "Unable to read selected patient.",
      error
    );

    return null;
  }
}


/* =========================================================
   RENDER PRESCRIPTIONS
========================================================= */

function renderDoctorPrescriptions() {
  const data = getData();


  doctorPrescriptions =
    Array.isArray(data.prescriptions)
      ? data.prescriptions.filter(
          prescription =>
            prescription.prescribedBy ===
            DOCTOR_NAME
        )
      : [];


  const body =
    document.getElementById(
      "doctorRxBody"
    );


  const count =
    document.getElementById(
      "doctorRxBodyCount"
    );


  const empty =
    document.getElementById(
      "prescriptionEmptyState"
    );


  count.textContent =
    `${doctorPrescriptions.length} ${
      doctorPrescriptions.length === 1
        ? "prescription"
        : "prescriptions"
    }`;


  if (
    doctorPrescriptions.length === 0
  ) {

    body.innerHTML = "";

    empty.style.display =
      "block";

    return;
  }


  empty.style.display =
    "none";


  body.innerHTML =
    doctorPrescriptions
      .map((prescription, index) => {

        return `

          <tr>

            <td>
              ${esc(
                safeRxText(
                  prescription.id,
                  "—"
                )
              )}
            </td>


            <td>
              ${esc(
                safeRxText(
                  prescription.patient,
                  "Unknown patient"
                )
              )}
            </td>


            <td>
              ${esc(
                safeRxText(
                  prescription.medication
                )
              )}
            </td>


            <td>
              ${esc(
                safeRxText(
                  prescription.dosage
                )
              )}
            </td>


            <td>
              ${esc(
                safeRxText(
                  prescription.date ||
                  prescription.prescribedDate,
                  "—"
                )
              )}
            </td>


            <td>
              ${badge(
                prescription.status ||
                "Pending"
              )}
            </td>


            <td>

              <button
                class="btn btn-ghost"
                type="button"
                data-rx-index="${index}"
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
      "[data-rx-index]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const index =
            Number(
              button.dataset.rxIndex
            );


          openPrescriptionDetails(
            doctorPrescriptions[index]
          );

        }
      );

    });
}


/* =========================================================
   SAVE PRESCRIPTION
========================================================= */

function savePrescription(event) {
  event.preventDefault();


  const data = getData();


  if (!Array.isArray(data.prescriptions)) {
    data.prescriptions = [];
  }


  const patient =
    getSelectedPatient();


  const medication =
    document
      .getElementById(
        "rxMedication"
      )
      .value
      .trim();


  const dosage =
    document
      .getElementById(
        "rxDosage"
      )
      .value
      .trim();


  const instructions =
    document
      .getElementById(
        "rxInstructions"
      )
      .value
      .trim();


  /* ---------- Validation ---------- */

  if (!patient) {

    alert(
      "Please select a patient."
    );

    document
      .getElementById(
        "rxPatient"
      )
      .focus();

    return;
  }


  if (!medication) {

    alert(
      "Please enter the medication."
    );

    document
      .getElementById(
        "rxMedication"
      )
      .focus();

    return;
  }


  if (!dosage) {

    alert(
      "Please enter the dosage."
    );

    document
      .getElementById(
        "rxDosage"
      )
      .focus();

    return;
  }


  /* ---------- Create prescription ---------- */

  const prescription = {

    id:
      generatePrescriptionId(data),

    patient:
      patient.name,

    patientId:
      patient.id || "",

    medication:
      medication,

    dosage:
      dosage,

    instructions:
      instructions,

    prescribedBy:
      DOCTOR_NAME,

    date:
      getPrescriptionDate(),

    prescribedDate:
      getPrescriptionISODate(),

    status:
      "Pending"

  };


  data.prescriptions.unshift(
    prescription
  );


  setData(data);


  alert(
    `Prescription ${prescription.id} saved successfully.`
  );


  clearPrescriptionForm();


  renderDoctorPrescriptions();


  populatePatientSelect(
    getData()
  );
}


/* =========================================================
   CLEAR FORM
========================================================= */

function clearPrescriptionForm() {
  document
    .getElementById(
      "prescriptionForm"
    )
    .reset();
}


/* =========================================================
   PRESCRIPTION DETAILS
========================================================= */

function openPrescriptionDetails(
  prescription
) {

  if (!prescription) {
    return;
  }


  const panel =
    document.getElementById(
      "prescriptionDetailPanel"
    );


  const content =
    document.getElementById(
      "prescriptionDetailContent"
    );


  content.innerHTML = `

    <div
      style="
        display:grid;
        grid-template-columns:
          repeat(3, 1fr);
        gap:18px;
        margin-bottom:22px;
      "
    >

      <!-- Prescription ID -->

      <div>

        <div
          style="
            font-size:11px;
            color:var(--slate);
            margin-bottom:4px;
          "
        >
          Prescription ID
        </div>

        <div
          style="
            font-size:13px;
            font-weight:700;
          "
        >
          ${esc(
            safeRxText(
              prescription.id
            )
          )}
        </div>

      </div>


      <!-- Date -->

      <div>

        <div
          style="
            font-size:11px;
            color:var(--slate);
            margin-bottom:4px;
          "
        >
          Date
        </div>

        <div
          style="
            font-size:13px;
            font-weight:700;
          "
        >
          ${esc(
            safeRxText(
              prescription.date ||
              prescription.prescribedDate
            )
          )}
        </div>

      </div>


      <!-- Status -->

      <div>

        <div
          style="
            font-size:11px;
            color:var(--slate);
            margin-bottom:4px;
          "
        >
          Status
        </div>

        <div>
          ${badge(
            prescription.status ||
            "Pending"
          )}
        </div>

      </div>

    </div>


    <!-- Patient -->

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
        Patient
      </div>

      <div
        style="
          font-size:14px;
          font-weight:700;
        "
      >
        ${esc(
          safeRxText(
            prescription.patient
          )
        )}
      </div>

      ${
        prescription.patientId
          ? `
            <div
              style="
                font-size:11px;
                color:var(--slate);
                margin-top:3px;
              "
            >
              ${esc(
                prescription.patientId
              )}
            </div>
          `
          : ""
      }

    </div>


    <!-- Medication -->

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
        Medication
      </div>

      <div
        style="
          font-size:14px;
          font-weight:700;
        "
      >
        ${esc(
          safeRxText(
            prescription.medication
          )
        )}
      </div>

    </div>


    <!-- Dosage -->

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
        Dosage
      </div>

      <div
        style="
          font-size:13px;
          line-height:1.5;
        "
      >
        ${esc(
          safeRxText(
            prescription.dosage
          )
        )}
      </div>

    </div>


    <!-- Instructions -->

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
        Instructions
      </div>

      <div
        style="
          font-size:13px;
          line-height:1.6;
          white-space:pre-wrap;
        "
      >
        ${esc(
          safeRxText(
            prescription.instructions,
            "No additional instructions."
          )
        )}
      </div>

    </div>


    <div
      style="
        margin-top:18px;
        font-size:11px;
        color:var(--slate);
      "
    >
      Prescribed by
      <strong>
        ${esc(
          safeRxText(
            prescription.prescribedBy,
            DOCTOR_NAME
          )
        )}
      </strong>
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

function closePrescriptionDetails() {

  document
    .getElementById(
      "prescriptionDetailPanel"
    )
    .style.display =
      "none";

}


/* =========================================================
   START
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const data =
      getData();


    populatePatientSelect(
      data
    );


    renderDoctorPrescriptions();


    document
      .getElementById(
        "prescriptionForm"
      )
      .addEventListener(
        "submit",
        savePrescription
      );


    document
      .getElementById(
        "clearPrescriptionBtn"
      )
      .addEventListener(
        "click",
        clearPrescriptionForm
      );


    document
      .getElementById(
        "closePrescriptionDetailBtn"
      )
      .addEventListener(
        "click",
        closePrescriptionDetails
      );

  }
);
