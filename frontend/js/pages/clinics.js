// js/pages/clinics.js

function renderClinics() {
  const data = getData();

  document.getElementById("clinicsCount").textContent =
    `Showing ${data.clinics.length} of ${data.clinics.length} clinics`;

  document.getElementById("clinicsBody").innerHTML =
    data.clinics.map((clinic, index) => `

      <tr>

        <td>${esc(clinic.name)}</td>

        <td>${esc(clinic.location)}</td>

        <td>${esc(clinic.contact)}</td>

        <td>${clinic.dateCreated || "27 May 2025"}</td>

        <td class="action-cell">

          <button
            class="btn btn-ghost btn-sm"
            onclick="openEditClinic(${index})"
          >
            Edit
          </button>

          <button
            class="btn btn-danger btn-sm"
            onclick="deleteClinic(${index})"
          >
            Delete
          </button>

        </td>

      </tr>

    `).join("");
}


function openEditClinic(index) {
  const data = getData();
  const clinic = data.clinics[index];

  if (!clinic) return;

  document.getElementById("ecIndex").value = index;
  document.getElementById("ecName").value = clinic.name;
  document.getElementById("ecLocation").value = clinic.location;
  document.getElementById("ecContact").value = clinic.contact;

  openModal("editClinicModal");
}


function deleteClinic(index) {
  const data = getData();
  const clinic = data.clinics[index];

  if (!clinic) return;

  const confirmed = confirm(
    `Are you sure you want to delete ${clinic.name}?`
  );

  if (!confirmed) return;

  data.clinics.splice(index, 1);

  setData(data);

  renderClinics();
}


document.addEventListener("DOMContentLoaded", () => {

  renderClinics();


  document
    .getElementById("addClinicBtn")
    .addEventListener("click", () => {

      openModal("addClinicModal");

    });


  document
    .getElementById("addClinicForm")
    .addEventListener("submit", (event) => {

      event.preventDefault();

      const data = getData();

      data.clinics.push({

        id: `CL${String(data.clinics.length + 1).padStart(3, "0")}`,

        name:
          document
            .getElementById("acName")
            .value
            .trim(),

        location:
          document
            .getElementById("acLocation")
            .value
            .trim(),

        contact:
          document
            .getElementById("acContact")
            .value
            .trim(),

        dateCreated:
          new Date().toLocaleDateString("en-ZA", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          })

      });

      setData(data);

      document
        .getElementById("addClinicForm")
        .reset();

      closeModal("addClinicModal");

      renderClinics();

    });


  document
    .getElementById("editClinicForm")
    .addEventListener("submit", (event) => {

      event.preventDefault();

      const data = getData();

      const index =
        Number(
          document
            .getElementById("ecIndex")
            .value
        );

      if (!data.clinics[index]) return;

      data.clinics[index].name =
        document
          .getElementById("ecName")
          .value
          .trim();

      data.clinics[index].location =
        document
          .getElementById("ecLocation")
          .value
          .trim();

      data.clinics[index].contact =
        document
          .getElementById("ecContact")
          .value
          .trim();

      setData(data);

      closeModal("editClinicModal");

      renderClinics();

    });

});