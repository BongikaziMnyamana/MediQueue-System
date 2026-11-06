// js/pages/departments.js
// Add / edit / delete all go through the REST API.

function renderDepartments() {

  const data = getData();

  const departments = data.departments;


  document.getElementById("departmentsCount").textContent =
    `Showing ${departments.length} of ${departments.length} departments`;


  if (!departments.length) {
    document.getElementById("departmentsBody").innerHTML =
      `<tr><td colspan="5">No departments have been added yet.</td></tr>`;
    return;
  }


  document.getElementById("departmentsBody").innerHTML =
    departments.map((department, index) => `

      <tr>

        <td>
          ${esc(department.name)}
        </td>

        <td>
          ${esc(department.id || "")}
        </td>

        <td>
          ${esc(department.description || "-")}
        </td>

        <td>
          ${esc(String(department.doctors || 0))}
        </td>

        <td class="action-cell">

          <button
            class="btn btn-ghost btn-sm"
            onclick="openEditDept(${index})"
          >
            Edit
          </button>

          <button
            class="btn btn-danger btn-sm"
            onclick="deleteDept(${index})"
          >
            Delete
          </button>

        </td>

      </tr>

    `).join("");
}


function openEditDept(index) {

  const data = getData();

  const department = data.departments[index];

  if (!department) return;


  document.getElementById("edIndex").value = index;

  document.getElementById("edId").value = department.id || "";

  document.getElementById("edName").value = department.name;

  document.getElementById("edDescription").value =
    department.description || "";


  openModal("editDeptModal");
}


async function deleteDept(index) {

  const data = getData();

  const department = data.departments[index];

  if (!department) return;


  const confirmed = confirm(
    `Are you sure you want to delete ${department.name}?`
  );


  if (!confirmed) return;


  const res = await deleteDepartmentAsync(department.id);

  if (!res.ok) {
    alert(res.error || "Could not delete the department from the server.");
    return;
  }

  renderDepartments();
}


document.addEventListener("DOMContentLoaded", () => {

  renderDepartments();


  document
    .getElementById("editDeptForm")
    .addEventListener("submit", async (event) => {

      event.preventDefault();


      const data = getData();

      const index =
        Number(
          document
            .getElementById("edIndex")
            .value
        );


      const department = data.departments[index];

      if (!department) return;


      const res = await updateDepartmentAsync(department.id, {
        departmentName:
          document
            .getElementById("edName")
            .value
            .trim(),

        description:
          document
            .getElementById("edDescription")
            .value
            .trim()
      });

      if (!res.ok) {
        alert(res.error || "Could not save the department changes to the server.");
        return;
      }


      closeModal("editDeptModal");

      renderDepartments();

    });

});
