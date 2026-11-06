// js/pages/add-clinic.js
// The clinic is written to the database; the page only moves on once the
// server confirmed the insert.

document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("addClinicPageForm");
  const submit = form.querySelector("button[type='submit']");

  form.addEventListener("submit", async (event) => {

    event.preventDefault();

    const clinicName =
      document
        .getElementById("clinicName")
        .value
        .trim();

    const saved = await createClinicAsync({
      clinicName,
      location: document.getElementById("clinicLocation").value.trim(),
      contactNumber: document.getElementById("clinicContact").value.trim()
    });

    if (!saved.ok) {
      alert(saved.error || "Could not save the clinic to the server.");
      return;
    }

    if (submit) {
      submit.disabled = true;
      submit.textContent = "Saving...";
    }

    window.location.href = "clinic-success.html";

  });

});
