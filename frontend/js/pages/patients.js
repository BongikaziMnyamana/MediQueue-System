// js/pages/patients.js

function renderPatients() {
  const data = getData();
  const body = document.getElementById("patientsBody");
  document.getElementById("patientsBodyCount").textContent = `${data.patients.length} records`;
  if (!data.patients.length) {
    body.innerHTML = `<tr><td colspan="7">No patients are registered yet.</td></tr>`;
    return;
  }
  body.innerHTML = data.patients.map(p => `
    <tr data-patient-id="${esc(p.id)}" style="cursor:pointer;">
      <td>${esc(p.id)}</td><td>${esc(p.name)}</td><td>${esc(p.gender)}</td><td>${esc(String(p.age))}</td><td>${esc(p.phone)}</td><td>${esc(p.dept)}</td>
      <td class="action-cell">
        <button class="btn btn-ghost btn-sm" onclick="openEditPatient('${p.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deletePatient('${p.id}')">Delete</button>
      </td>
    </tr>
  `).join("");
}

function populateDeptDropdowns() {
  document.querySelectorAll("#npDept, #epDept").forEach(sel => {
    if (sel) sel.innerHTML = DEPARTMENTS.map(d => `<option>${esc(d.name)}</option>`).join("");
  });
}

function openEditPatient(id) {
  const data = getData();
  const p = data.patients.find(x => x.id === id);
  if (!p) return;
  document.getElementById("epId").value = p.id;
  document.getElementById("epName").value = p.name;
  document.getElementById("epGender").value = p.gender;
  document.getElementById("epAge").value = p.age;
  document.getElementById("epDob").value = p.dateOfBirth || dateFromAge(p.age);
  document.getElementById("epIdNumber").value = p.idNumber || "";
  document.getElementById("epEmail").value = p.email || "";
  document.getElementById("epPhone").value = p.phone;
  document.getElementById("epAddress").value = p.address || "";
  document.getElementById("epDept").value = p.dept;
  openModal("editPatientModal");
}

async function deletePatient(id) {
  const p = getData().patients.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`Remove ${p.name} from patients? This can't be undone.`)) return;
  const r = await deletePatientAsync(id);
  if (!r.ok) {
    alert(r.error || "Could not delete the patient from the server.");
    return;
  }
  renderPatients();
}

document.addEventListener("DOMContentLoaded", () => {
  renderPatients();
  populateDeptDropdowns();

  // Clicking anywhere on a patient row opens their details, while the
  // Edit/Delete buttons keep their own behaviour.
  const body = document.getElementById("patientsBody");
  if (body) {
    body.addEventListener("click", (e) => {
      if (e.target.closest("button, a, input, select")) return;
      const row = e.target.closest("tr[data-patient-id]");
      if (row) openEditPatient(row.getAttribute("data-patient-id"));
    });
  }

  document.getElementById("addPatientForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const res = await createPatientAsync({
      name: document.getElementById("npName").value.trim(),
      gender: document.getElementById("npGender").value,
      age: Number(document.getElementById("npAge").value) || 0,
      dateOfBirth: document.getElementById("npDob").value,
      idNumber: document.getElementById("npIdNumber").value.trim(),
      email: document.getElementById("npEmail").value.trim(),
      phone: document.getElementById("npPhone").value.trim(),
      address: document.getElementById("npAddress").value.trim(),
      dept: document.getElementById("npDept").value,
    });
    if (!res.ok) {
      alert(res.error || "Could not save the patient to the server.");
      return;
    }
    e.target.reset();
    closeModal("addPatientModal");
    renderPatients();
  });

  document.getElementById("editPatientForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("epId").value;
    const res = await updatePatientAsync(id, {
      name: document.getElementById("epName").value.trim(),
      gender: document.getElementById("epGender").value,
      age: Number(document.getElementById("epAge").value) || 0,
      dateOfBirth: document.getElementById("epDob").value,
      idNumber: document.getElementById("epIdNumber").value.trim(),
      email: document.getElementById("epEmail").value.trim(),
      phone: document.getElementById("epPhone").value.trim(),
      address: document.getElementById("epAddress").value.trim(),
      dept: document.getElementById("epDept").value,
    });
    if (!res.ok) {
      alert(res.error || "Could not save the patient changes to the server.");
      return;
    }
    e.target.reset();
    closeModal("editPatientModal");
    renderPatients();
  });
});
