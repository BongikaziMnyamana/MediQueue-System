// js/pages/users.js
// Staff accounts are stored by the backend through /staff; nothing here is
// written to the local cache on its own.

function staffFromData(data) {
  return (data.users || []).filter((u) => u.role !== "Patient");
}

function renderUsers() {
  const data = getData();
  const body = document.getElementById("usersBody");
  const staff = staffFromData(data);
  document.getElementById("usersBodyCount").textContent = `${staff.length} records`;
  body.innerHTML = staff.map((u, i) => `
    <tr>
      <td>${esc(u.name)}</td><td>${esc(u.role)}</td><td>${esc(u.email)}</td><td>${esc(u.clinic || "—")}</td><td>${esc(u.department || "—")}</td><td>${badge(u.status ? "Active" : "Inactive")}</td>
      <td class="action-cell">
        <button class="btn btn-ghost btn-sm" onclick="openEditUser(${i})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteUser(${i})">Delete</button>
      </td>
    </tr>
  `).join("");
}

function populateDropdowns() {
  const deptSelects = document.querySelectorAll("#auDept, #euDept");
  if (!deptSelects.length) return;
  const options = DEPARTMENTS.map(
    (d) => `<option value="${esc(d.id || d.name)}">${esc(d.name)}</option>`
  ).join("");
  deptSelects.forEach((sel) => {
    sel.innerHTML = options;
  });
}

function openEditUser(index) {
  const u = staffFromData(getData())[index];
  if (!u) return;
  document.getElementById("euId").value = u.id || "";
  document.getElementById("euName").value = u.name;
  document.getElementById("euRole").value = u.role;
  document.getElementById("euEmail").value = u.email;
  document.getElementById("euPhone").value = u.phone || "";
  document.getElementById("euPassword").value = "";
  document.getElementById("euStatus").value = u.status === false ? "false" : "true";
  const deptSelect = document.getElementById("euDept");
  const dept = DEPARTMENTS.find(
    (d) => d.name === u.department || d.id === u.departmentId
  );
  deptSelect.value = dept ? dept.id || dept.name : "";
  openModal("editUserModal");
}

async function deleteUser(index) {
  const u = staffFromData(getData())[index];
  if (!u) return;
  if (!confirm(`Remove ${u.name}'s account? This can't be undone.`)) return;
  const result = await deleteStaffAsync(u.id);
  if (!result.ok) {
    alert(result.error || "The staff account could not be removed from the server.");
    return;
  }
  renderUsers();
}

document.addEventListener("DOMContentLoaded", async () => {
  await ensureDepartments();
  renderUsers();
  populateDropdowns();

  document.getElementById("addUserForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const submit = e.target.querySelector("button[type=submit]");
    if (submit) submit.disabled = true;
    try {
      const result = await createStaffAsync({
        name: document.getElementById("auName").value.trim(),
        position: document.getElementById("auRole").value,
        email: document.getElementById("auEmail").value.trim(),
        phone: document.getElementById("auPhone").value.trim(),
        password: document.getElementById("auPassword").value.trim(),
        departmentId: document.getElementById("auDept").value,
        status: true,
      });
      if (!result.ok) {
        alert(result.error || "The staff account could not be saved to the server.");
        return;
      }
      document.getElementById("addUserForm").reset();
      closeModal("addUserModal");
      renderUsers();
    } finally {
      if (submit) submit.disabled = false;
    }
  });

  document.getElementById("editUserForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const staffId = document.getElementById("euId").value;
    if (!staffId) return;
    // The password travels in the same call: a password-only payload would
    // arrive with a default (inactive) status flag.
    const result = await updateStaffAsync(staffId, {
      name: document.getElementById("euName").value.trim(),
      position: document.getElementById("euRole").value,
      email: document.getElementById("euEmail").value.trim(),
      phone: document.getElementById("euPhone").value.trim(),
      password: document.getElementById("euPassword").value.trim(),
      status: document.getElementById("euStatus").value === "true",
      departmentId: document.getElementById("euDept").value,
    });
    if (!result.ok) {
      alert(result.error || "The staff account could not be updated on the server.");
      return;
    }
    closeModal("editUserModal");
    renderUsers();
  });
});
