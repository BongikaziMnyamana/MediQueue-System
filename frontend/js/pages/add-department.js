// js/pages/add-department.js
// The department is written to the database; the page only moves on once the
// server confirmed the insert.

document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("addDepartmentForm");
  const submit = form.querySelector("button[type='submit']");

  form.addEventListener("submit", async (event) => {

    event.preventDefault();

    const saved = await createDepartmentAsync({
      departmentId:
        document
          .getElementById("departmentId")
          .value
          .trim() || undefined,
      departmentName:
        document
          .getElementById("departmentName")
          .value
          .trim(),
      description:
        document
          .getElementById("departmentDescription")
          .value
          .trim()
    });

    if (!saved.ok) {
      alert(saved.error || "Could not save the department to the server.");
      return;
    }

    if (submit) {
      submit.disabled = true;
      submit.textContent = "Saving...";
    }

    window.location.href = "department-success.html";

  });

});
