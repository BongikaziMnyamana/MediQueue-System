document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("addClinicPageForm");

  form.addEventListener("submit", (event) => {

    event.preventDefault();

    const data = getData();

    const clinicName =
      document
        .getElementById("clinicName")
        .value
        .trim();

    const clinicLocation =
      document
        .getElementById("clinicLocation")
        .value
        .trim();

    const clinicContact =
      document
        .getElementById("clinicContact")
        .value
        .trim();

    const newClinic = {
      id: `CL${String(data.clinics.length + 1).padStart(3, "0")}`,
      name: clinicName,
      location: clinicLocation,
      contact: clinicContact,
      dateCreated: new Date().toLocaleDateString("en-ZA", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })
    };

    data.clinics.push(newClinic);

    setData(data);

    window.location.href = "clinic-success.html";

  });

});