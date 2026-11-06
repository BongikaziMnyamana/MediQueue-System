// js/pages/profile.js
// Builds the sidebar dynamically (this page is shared across all roles) and
// loads the signed-in staff member. Edits are written to the backend through
// /staff/update, never straight into the local cache.

const NAV_BY_ROLE = {
  ADMIN: [
    ["Dashboard", "admin-dashboard.html"], ["Clinics", "clinics.html"], ["Departments", "departments.html"],
    ["Users", "users.html"], ["Reports", "reports.html"],
  ],
  RECEPTIONIST: [
    ["Dashboard", "receptionist-dashboard.html"], ["Patients", "patients.html"],
    ["Appointments", "appointments.html"], ["Queue Management", "queue.html"],
  ],
  DOCTOR: [
    ["Dashboard", "doctor-dashboard.html"], ["Queue", "doctor-queue.html"],
    ["Patient Records", "doctor-records.html"], ["Prescriptions", "doctor-prescriptions.html"],
  ],
  NURSE: [
    ["Dashboard", "nurse-dashboard.html"], ["Nurse Queue", "nurse-queue.html"],
    ["Assess Patient", "nurse-assessment.html"], ["Visits", "nurse-visits.html"],
  ],
  PHARMACIST: [
    ["Dashboard", "pharmacist-dashboard.html"], ["Prescriptions", "pharmacist-prescriptions.html"],
    ["Patients", "pharmacist-patients.html"],
  ],
};
const ROLE_BADGE = {
  ADMIN: "Administrator dashboard", RECEPTIONIST: "Receptionist dashboard",
  DOCTOR: "Doctor dashboard", NURSE: "Nurse dashboard", PHARMACIST: "Pharmacist dashboard",
};
const ROLE_LABEL = {
  ADMIN: "Administrator", RECEPTIONIST: "Receptionist",
  DOCTOR: "Doctor", NURSE: "Nurse", PHARMACIST: "Pharmacist",
};

function initials(name) {
  return name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function buildSidebar() {
  const role = localStorage.getItem("mq_role");
  const items = (NAV_BY_ROLE[role] || []).map(([label, href]) => `<a class="nav-item" href="${href}">${label}</a>`).join("");
  document.getElementById("sidebar").innerHTML = `
    <div class="sidebar-brand">
      <img src="../assets/images/logo-icon.png" alt="MediQueue" />
      <div class="sidebar-brand-name font-display">MediQueue</div>
    </div>
    <div class="nav">${items}</div>
    <a class="nav-logout" href="index.html" id="logoutLink">Logout</a>
  `;
  document.getElementById("roleBadge").textContent = ROLE_BADGE[role] || "";
  document.getElementById("userRole").textContent = ROLE_LABEL[role] || "";
}

document.addEventListener("DOMContentLoaded", () => {
  buildSidebar();

  const role = localStorage.getItem("mq_role");
  const staffId = localStorage.getItem("mq_staffId");
  const data = getData();
  const profile = data.profiles[role];
  if (!profile) return;
  // The staff record is the source of truth for editable fields.
  const record = (data.users || []).find((u) => u.id === staffId) || profile;
  const position = record.role || ROLE_LABEL[role] || role;
  const departmentId = (DEPARTMENTS.find((d) => d.name === (profile.department || record.department)) || {}).id
    || profile.department
    || "";

  document.getElementById("userName").textContent = profile.name;
  document.getElementById("avatarIcon").innerHTML = initials(profile.name);
  document.getElementById("avatarInitials").textContent = initials(profile.name);
  document.getElementById("profileNameHeading").textContent = profile.name;
  document.getElementById("profileRoleTag").textContent = ROLE_LABEL[role] || "";
  document.getElementById("profileClinic").textContent = profile.clinic || "—";
  document.getElementById("profileDept").textContent = profile.department || "—";
  document.getElementById("profileJoinDate").textContent = profile.joinDate || "—";

  document.getElementById("pName").value = profile.name;
  document.getElementById("pEmail").value = profile.email;
  document.getElementById("pPhone").value = profile.phone;

  document.getElementById("profileForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!staffId) {
      showSuccess("This profile is not linked to a staff account.", true);
      return;
    }
    const name = document.getElementById("pName").value.trim();
    if (!name) {
      showSuccess("Name is required.", true);
      return;
    }
    const result = await updateStaffAsync(staffId, {
      name,
      position,
      email: document.getElementById("pEmail").value.trim(),
      phone: document.getElementById("pPhone").value.trim(),
      status: record.status !== false,
      departmentId,
    });
    if (!result.ok) {
      showSuccess(result.error || "The profile could not be saved to the server.", true);
      return;
    }
    // Keep the signed-in display in step with the server record.
    const name2 = name;
    localStorage.setItem("mq_name", name2);
    document.getElementById("userName").textContent = name2;
    document.getElementById("profileNameHeading").textContent = name2;
    document.getElementById("avatarInitials").textContent = initials(name2);
    document.getElementById("avatarIcon").innerHTML = initials(name2);
    showSuccess("Profile updated.");
  });

  document.getElementById("passwordForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const newPw = document.getElementById("pwNew").value;
    const confirmPw = document.getElementById("pwConfirm").value;
    if (!newPw || newPw !== confirmPw) {
      showSuccess("Passwords don't match.", true);
      return;
    }
    if (newPw.length < 6) {
      showSuccess("Password must be at least 6 characters long.", true);
      return;
    }
    if (!staffId) {
      showSuccess("This profile is not linked to a staff account.", true);
      return;
    }
    // Sent with the rest of the record so the active flag is not reset.
    const result = await updateStaffAsync(staffId, {
      name: record.name,
      position,
      email: record.email,
      phone: record.phone,
      password: newPw,
      status: record.status !== false,
      departmentId,
    });
    if (!result.ok) {
      showSuccess(result.error || "The password could not be saved to the server.", true);
      return;
    }
    document.getElementById("passwordForm").reset();
    showSuccess("Password updated.");
  });

  document.getElementById("logoutLink").addEventListener("click", async (e) => {
    e.preventDefault();
    await logoutAsync();
    localStorage.removeItem("mq_role");
    window.location.href = "index.html";
  });
});

function showSuccess(msg, isError) {
  const el = document.getElementById("successMsg");
  el.textContent = msg;
  el.style.background = isError ? "#FBE9E7" : "#E4F3EA";
  el.style.color = isError ? "#C0503F" : "#1E7A45";
  el.style.display = "block";
  setTimeout(() => (el.style.display = "none"), 2500);
}