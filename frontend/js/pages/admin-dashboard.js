// js/pages/admin-dashboard.js

function renderAdminDashboard() {
  const data = getData();
  const profile = data.profiles.ADMIN;

  document.getElementById("welcomeMsg").textContent =
    `Welcome, ${profile.name}`;

  document.querySelector(".user-name").textContent =
    profile.name;

  document.getElementById("dateLabel").textContent =
    new Date().toLocaleDateString("en-ZA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

  // Summary cards
  document.getElementById("statCards").innerHTML = `
    <div class="admin-stat-card">

      <div class="admin-stat-icon">
        🏥
      </div>

      <div>
        <div class="admin-stat-label">
          Total Clinics
        </div>

        <div class="admin-stat-value">
          ${data.clinics.length}
        </div>

        <div class="admin-stat-sub">
          Active clinic(s)
        </div>
      </div>

    </div>


    <div class="admin-stat-card">

      <div class="admin-stat-icon">
        👥
      </div>

      <div>
        <div class="admin-stat-label">
          Total Departments
        </div>

        <div class="admin-stat-value">
          ${data.departments.length}
        </div>

        <div class="admin-stat-sub">
          Active department(s)
        </div>
      </div>

    </div>
  `;


  // Recent activity
  const activities = [
    {
      title: "Clinic created",
      description: "Khayelitsha clinic was created successfully",
      date: "27 May 2025"
    },
    {
      title: "Department added",
      description: "General department was added",
      date: "27 May 2025"
    },
    {
      title: "Department added",
      description: "Pediatrics department was added",
      date: "27 May 2025"
    },
    {
      title: "Department added",
      description: "Chronic Disease department was added",
      date: "27 May 2025"
    },
    {
      title: "Department added",
      description: "Dental department was added",
      date: "27 May 2025"
    },
    {
      title: "Department added",
      description: "Maternity department was added",
      date: "27 May 2025"
    }
  ];

  document.getElementById("recentActivity").innerHTML =
    activities.map(activity => `

      <div class="activity-item">

        <div class="activity-dot"></div>

        <div class="activity-content">

          <div class="activity-title">
            ${activity.title}
          </div>

          <div class="activity-description">
            ${activity.description}
          </div>

        </div>

        <div class="activity-date">
          ${activity.date}
        </div>

      </div>

    `).join("");
}

document.addEventListener(
  "DOMContentLoaded",
  renderAdminDashboard
);