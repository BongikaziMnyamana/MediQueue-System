// js/pages/departments.js

function renderDepartments() {

  const data = getData();

  const departments = data.departments;


  document.getElementById("departmentsCount").textContent =
    `Showing ${departments.length} of ${departments.length} departments`;


  document.getElementById("departmentsBody").innerHTML =
    departments.map((department, index) => `

      <tr>

        <td>
          ${esc(department.name)}
        </td>

        <td>
          ${esc(department.id || `DEP-${String(index + 1).padStart(3, "0")}`)}
        </td>

        <td>
          ${esc(department.description || "-")}
        </td>

        <td>
          ${department.dateCreated || "27 May 2025"}
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

  document.getElementById("edId").value =
    department.id ||
    `DEP-${String(index + 1).padStart(3, "0")}`;

  document.getElementById("edName").value =
    department.name;

  document.getElementById("edDescription").value =
    department.description || "";


  openModal("editDeptModal");
}


function deleteDept(index) {

  const data = getData();

  const department = data.departments[index];

  if (!department) return;


  const confirmed = confirm(
    `Are you sure you want to delete ${department.name}?`
  );


  if (!confirmed) return;


  data.departments.splice(index, 1);

  setData(data);

  renderDepartments();
}


document.addEventListener("DOMContentLoaded", () => {

  renderDepartments();


  document
    .getElementById("editDeptForm")
    .addEventListener("submit", (event) => {

      event.preventDefault();


      const data = getData();

      const index =
        Number(
          document
            .getElementById("edIndex")
            .value
        );


      if (!data.departments[index]) return;


      data.departments[index] = {

        ...data.departments[index],

        id:
          document
            .getElementById("edId")
            .value
            .trim(),

        name:
          document
            .getElementById("edName")
            .value
            .trim(),

        description:
          document
            .getElementById("edDescription")
            .value
            .trim()

      };


      setData(data);

      closeModal("editDeptModal");

      renderDepartments();

    });

});