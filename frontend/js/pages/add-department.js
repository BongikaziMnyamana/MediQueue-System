document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("addDepartmentForm");

  form.addEventListener("submit", (event) => {

    event.preventDefault();

    const data = getData();

    const departmentId =
      document
        .getElementById("departmentId")
        .value
        .trim();

    const departmentName =
      document
        .getElementById("departmentName")
        .value
        .trim();

    const departmentDescription =
      document
        .getElementById("departmentDescription")
        .value
        .trim();

    const newDepartment = {

      id: departmentId,

      name: departmentName,

      description: departmentDescription,

      dateCreated: new Date().toLocaleDateString("en-ZA", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })

    };

    data.departments.push(newDepartment);

    setData(data);

    window.location.href = "department-success.html";

  });

});