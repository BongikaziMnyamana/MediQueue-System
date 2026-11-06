// js/pages/clinics.js
// Add / edit / delete all go through the REST API; the list is redrawn from the
// cached response of the last successful sync.

function renderClinics() {
  const data = getData();

  document.getElementById("clinicsCount").textContent =
    `Showing ${data.clinics.length} of ${data.clinics.length} clinics`;

  if (!data.clinics.length) {
    document.getElementById("clinicsBody").innerHTML =
      `<tr><td colspan="4">No clinics have been added yet.</td></tr>`;
    return;
  }

  document.getElementById("clinicsBody").innerHTML =
    data.clinics.map((clinic, index) => `

      <tr>

        <td>${esc(clinic.name)}</td>

        <td>${esc(clinic.location)}</td>

        <td>${esc(clinic.contact)}</td>

        <td>${esc(clinic.id)}</td>

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


async function deleteClinic(index) {
  const data = getData();
  const clinic = data.clinics[index];

  if (!clinic) return;

  const confirmed = confirm(
    `Are you sure you want to delete ${clinic.name}?`
  );

  if (!confirmed) return;

  const res = await deleteClinicAsync(clinic.id);

  if (!res.ok) {
    alert(res.error || "Could not delete the clinic from the server.");
    return;
  }

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
    .addEventListener("submit", async (event) => {

      event.preventDefault();

      const res = await createClinicAsync({
        clinicName:
          document
            .getElementById("acName")
            .value
            .trim(),

        location:
          document
            .getElementById("acLocation")
            .value
            .trim(),

        contactNumber:
          document
            .getElementById("acContact")
            .value
            .trim()
      });

      if (!res.ok) {
        alert(res.error || "Could not save the clinic to the server.");
        return;
      }

      event.target.reset();

      closeModal("addClinicModal");

      renderClinics();

    });


  document
    .getElementById("editClinicForm")
    .addEventListener("submit", async (event) => {

      event.preventDefault();

      const data = getData();

      const index =
        Number(
          document
            .getElementById("ecIndex")
            .value
        );

      const clinic = data.clinics[index];

      if (!clinic) return;

      const res = await updateClinicAsync(clinic.id, {
        clinicName:
          document
            .getElementById("ecName")
            .value
            .trim(),

        location:
          document
            .getElementById("ecLocation")
            .value
            .trim(),

        contactNumber:
          document
            .getElementById("ecContact")
            .value
            .trim()
      });

      if (!res.ok) {
        alert(res.error || "Could not save the clinic changes to the server.");
        return;
      }

      closeModal("editClinicModal");

      renderClinics();

    });

});
