// js/data.js
// Loaded on every page. Every row the UI shows comes from the MediQueue REST
// API (MySQL). localStorage only holds a cache of the last successful sync so
// pages can still render synchronously; it is never seeded with demo rows and
// never treated as a save target. When the backend is unreachable the app
// shows a "not connected" banner and reports the failure instead of silently
// pretending the change was stored.

const DATA_KEY = "mq_data";
const API_BASE = "http://localhost:8080/MediQueue";

// Shape every page can rely on, whether the database is empty or the backend
// could not be reached. Collections start empty so the UI shows its own
// empty-state instead of invented records.
function emptyData() {
  return {
    patients: [],
    appointments: [],
    queue: [],
    visits: [],
    vitalSigns: [],
    records: [],
    prescriptions: [],
    users: [],
    clinics: [],
    departments: [],
    profiles: {},
    seenToday: 0,
  };
}


// Endpoint for each collection, keyed by the name used in the frontend data object.
const API_COLLECTIONS = {
  patients: "/patient/getAll",
  staff: "/staff/getAll",
  clinics: "/clinic/getAll",
  departments: "/department/getAll",
  appointments: "/appointment/getAll",
  queueEntries: "/mediqueue/queue-entry/all",
  visits: "/mediqueue/visit/all",
  vitalSigns: "/mediqueue/vital-signs/all",
  medicalRecords: "/medical-record/getAll",
  prescriptions: "/prescription/getAll",
};

// Becomes true once the frontend has successfully talked to the backend.
// Implemented as a live property instead of a plain flag: whenever the
// connection state is still unknown (i.e. the backend was not reachable when
// the page loaded), reading it re-probes the backend on the spot and, on
// success, re-syncs the local cache from the database. This means actions
// taken after the backend comes up (registering, booking, queue updates) are
// written to MySQL instead of silently staying in the browser's localStorage.
let __mqBackendUp = false;
let __mqPollTimer = null;

// Synchronous connection attempt. Probes the backend once and, when it
// answers, rebuilds the whole cache from the database and flips the session
// into "connected" mode for the rest of the page's life. Returns true when
// connected (already connected counts as success).
function connectBackendSync() {
  if (__mqBackendUp) return true;
  if (syncGetJSON(API_COLLECTIONS.patients) === null) return false;
  const raw = fetchFromApi(syncGetJSON);
  if (!raw || !Object.keys(API_COLLECTIONS).every((k) => raw[k] !== null)) return false;
  __mqBackendUp = true;
  stopBackendPoller();
  setData(buildDataFromApi(raw));
  hideOfflineNotice();
  console.log("[MediQueue] Connected to backend at " + API_BASE);
  return true;
}

// While the backend is down, poll quietly in the background. As soon as it
// becomes reachable the app adopts it (and reloads the cache from the
// database), so the user does not have to refresh the page for saves to start
// going to MySQL.
function startBackendPoller() {
  if (__mqPollTimer) return;
  __mqPollTimer = setInterval(async () => {
    if (__mqBackendUp) {
      stopBackendPoller();
      return;
    }
    if (await asyncGetJSON(API_COLLECTIONS.patients) !== null) {
      connectBackendSync();
    }
  }, 3000);
}

function stopBackendPoller() {
  if (__mqPollTimer) {
    clearInterval(__mqPollTimer);
    __mqPollTimer = null;
  }
}

Object.defineProperty(window, "__mqConnected", {
  configurable: true,
  get() {
    if (!__mqBackendUp) connectBackendSync();
    return __mqBackendUp;
  },
  set(value) {
    __mqBackendUp = Boolean(value);
  },
});


/* =========================================================
   LOW-LEVEL API HELPERS
========================================================= */

// Synchronous GET (used on the very first visit so the page can
// render real backend data before any page script runs).
function syncGetJSON(path) {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", API_BASE + path, false);
    xhr.send(null);
    if (xhr.status >= 200 && xhr.status < 300) {
      return JSON.parse(xhr.responseText);
    }
  } catch (e) {
    // backend down / not reachable
  }
  return null;
}

// Async GET with a short timeout (used to refresh the cache in the background).
function asyncGetJSON(path) {
  return new Promise((resolve) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    fetch(API_BASE + path, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then(resolve)
      .catch(() => resolve(null))
      .finally(() => clearTimeout(timer));
  });
}

function fetchFromApi(fetchJson) {
  const raw = {};
  Object.keys(API_COLLECTIONS).forEach((key) => {
    raw[key] = fetchJson(API_COLLECTIONS[key]);
  });
  return raw;
}


/* =========================================================
   FIELD FORMATTING / MAPPING HELPERS
========================================================= */

function fullName(user) {
  return user ? [user.firstName, user.lastName].filter(Boolean).join(" ") : "";
}

// Backend staff names have no titles (e.g. "N. Zulu"). Frontend pages show
// doctors as "Dr. N. Zulu", so add the prefix here so names line up between
// the two sides everywhere (lists, doctor-filtered tables, lookups).
function staffDisplayName(staff) {
  if (!staff) return "";
  const n = fullName(staff);
  if (/doctor/i.test(staff.position || "")) return "Dr. " + n;
  return n;
}

function deptOfStaff(staff) {
  return staff && staff.department ? staff.department.departmentName : "";
}

function deptOfAppointment(appointment) {
  return (
    (appointment && appointment.department && appointment.department.departmentName) ||
    deptOfStaff(appointment && appointment.doctor) ||
    ""
  );
}

function ageFromDob(dob) {
  if (!dob) return "";
  const birth = new Date(dob);
  if (isNaN(birth)) return "";
  return Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000));
}

function fmtDate(iso) {
  if (!iso) return "";
  const parts = String(iso).split("-");
  if (parts.length !== 3) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const m = months[Number(parts[1]) - 1];
  return `${parts[2]} ${m} ${parts[0]}`;
}

function fmtTime12(t) {
  if (!t) return "";
  const [h, m] = String(t).split(":").map(Number);
  if (isNaN(h)) return t;
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  return `${String(hh).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

function waitFromCheckIn(t) {
  if (!t) return "";
  const [h, m] = String(t).split(":").map(Number);
  if (isNaN(h)) return "";
  const then = new Date();
  then.setHours(h, m, 0, 0);
  const mins = Math.round((then - new Date()) / 60000);
  return mins < 0 ? "now" : `${mins} min`;
}

// Turns the raw backend JSON into the shape the frontend pages expect.
function buildDataFromApi(raw) {
  const patients = raw.patients || [];
  const appointments = raw.appointments || [];
  const staff = raw.staff || [];
  const visits = raw.visits || [];
  const queueEntries = raw.queueEntries || [];

  // Best-effort department per patient, taken from their latest appointment.
  const deptByPatient = {};
  appointments.forEach((a) => {
    const pid = a.patient && a.patient.userId;
    const d = deptOfAppointment(a);
    if (pid && d) deptByPatient[pid] = d;
  });

  const mappedQueue = mapQueueEntries(queueEntries, appointments);
  const mappedVitals = (raw.vitalSigns || []).map(mapVitalSigns);

  // The vital-signs record has no department or queue number of its own, so
  // borrow them from the patient's most recent queue entry. This is what the
  // nurse visits table and its details modal display.
  const queueByPatient = {};
  mappedQueue.forEach((q) => {
    if (!q.id) return;
    const current = queueByPatient[q.id];
    if (!current || String(q.queueDate || "") >= String(current.queueDate || "")) {
      queueByPatient[q.id] = q;
    }
  });
  mappedVitals.forEach((vital) => {
    const entry = queueByPatient[vital.patientId];
    if (entry) {
      vital.department = entry.dept || "";
      vital.queueNumber = entry.no || "";
    }
  });

  return markQueuedPatients({
    patients: patients.map((p) => mapPatient(p, deptByPatient)),
    appointments: appointments.map(mapAppointment),
    queue: mappedQueue,
    visits: visits.map(mapVisit),
    vitalSigns: mappedVitals,
    records: (raw.medicalRecords || []).map(mapRecord),
    prescriptions: (raw.prescriptions || []).map(mapPrescription),
    users: staff.map(mapUser),
    clinics: (raw.clinics || []).map(mapClinic),
    departments: (raw.departments || []).map((d) => mapDepartment(d, staff, appointments)),
    profiles: buildProfiles(patients, staff),
    seenToday: countSeenToday(visits, appointments),
  });
}

// The signed-in staff member / patient shown in headers and on the profile
// page is looked up in the rows the API just returned, using the ids that came
// back with the login token. Roles with no matching row are left out so pages
// fall back to their "unknown" wording instead of a made-up person.
function buildProfiles(patients, staff) {
  const profiles = {};
  const sessionRole = String(localStorage.getItem("mq_role") || "").toUpperCase();
  const staffId = localStorage.getItem("mq_staffId") || "";
  const patientId = localStorage.getItem("mq_patientId") || "";

  staff.forEach((s) => {
    const role = staffRoleKey(s);
    if (!role) return;
    const profile = staffProfile(s);
    if (s.userId === staffId) profile.self = true;
    if (!profiles[role] || profile.self) profiles[role] = profile;
  });

  const me = patients.find((p) => p.userId && p.userId === (patientId || localStorage.getItem("mq_userId")));
  if (me) profiles.PATIENT = patientProfile(me);

  if (sessionRole && !profiles[sessionRole]) {
    const fallback = staff.find((s) => staffRoleKey(s) === sessionRole);
    if (fallback) profiles[sessionRole] = staffProfile(fallback);
  }

  return profiles;
}

// Role keys are always upper case because every page looks its profile up with
// the session role (RECEPTIONIST, DOCTOR, NURSE, ...).
function staffRoleKey(s) {
  const position = String((s && s.position) || "").toUpperCase();
  if (position) return staffRoleForPosition(position);
  const role = s && s.role && String(s.role.roleName || "").toUpperCase();
  return role || "";
}

function staffRoleName(s) {
  const key = staffRoleKey(s);
  return key ? key.charAt(0) + key.slice(1).toLowerCase() : "";
}

function staffProfile(s) {
  return {
    name: staffDisplayName(s),
    email: s.email || "",
    phone: s.phoneNumber || "",
    clinic: s.clinic && s.clinic.clinicName ? s.clinic.clinicName : "",
    department: deptOfStaff(s),
    joinDate: s.createdAt ? fmtDate(String(s.createdAt).slice(0, 10)) : "",
  };
}

function patientProfile(p) {
  return {
    name: fullName(p),
    email: p.email || "",
    phone: p.phoneNumber || "",
    clinic: "",
    department: "",
    joinDate: p.createdAt ? fmtDate(String(p.createdAt).slice(0, 10)) : "",
  };
}

// "Seen today" is counted from the rows the database returned, not stored as
// a number that can drift: distinct patients with a visit or an appointment
// booked for today.
function countSeenToday(visits, appointments) {
  const today = todayIso();
  const ids = new Set();
  visits.forEach((v) => {
    if (v.visitDate === today && v.patient && v.patient.userId) ids.add(v.patient.userId);
  });
  appointments.forEach((a) => {
    if (a.scheduledDate === today && a.patient && a.patient.userId) ids.add(a.patient.userId);
  });
  return ids.size;
}

// Per-collection mappers: backend domain JSON -> frontend display shape.
// Kept as named functions so newly created entities can be mapped into the
// in-memory cache right after a successful write.
function mapPatient(p, deptByPatient) {
  return {
    id: p.userId,
    name: fullName(p),
    gender: p.gender || "",
    age: ageFromDob(p.dateOfBirth),
    dateOfBirth: p.dateOfBirth || "",
    idNumber: p.idNumber || "",
    email: p.email || "",
    phone: p.phoneNumber || "",
    address: p.address || "",
    allergies: p.allergies || "",
    dept: (deptByPatient && deptByPatient[p.userId]) || "",
  };
}

// Marks the patients that have a live queue entry so list pages can show where
// they are instead of inventing a status the Patient table does not have. A
// booking is in the live queue immediately, so it counts as queued until it is
// cancelled or completed.
function markQueuedPatients(data) {
  const queued = new Set(
    (data.queue || [])
      .filter((q) => !["Cancelled", "Completed"].includes(q.status))
      .map((q) => q.id)
  );
  (data.patients || []).forEach((patient) => {
    patient.queued = queued.has(patient.id);
  });
  return data;
}

function mapAppointment(a) {
  return {
    id: a.appointmentId,
    time: fmtTime12(a.scheduledTime),
    time24: a.scheduledTime,
    date: a.scheduledDate,
    patient: fullName(a.patient),
    patientId: a.patient && a.patient.userId,
    dept: deptOfAppointment(a),
    departmentId: a.department && a.department.departmentId,
    clinic: a.clinic && a.clinic.clinicName,
    clinicId: a.clinic && a.clinic.clinicId,
    doctor: a.doctor ? staffDisplayName(a.doctor) : "",
    doctorId: a.doctor && a.doctor.userId,
    status: a.status || "Pending",
    reason: a.reason || "",
  };
}

function mapQueueEntry(qe, fallbackDept) {
  const pat = qe.patient || {};
  return {
    // The server issues the number as soon as the booking joins the live
    // queue, so a numbered entry is the normal case.
    no:
      qe.queueNumber === null || qe.queueNumber === undefined
        ? ""
        : "Q" + String(qe.queueNumber).padStart(3, "0"),
    patient: fullName(pat),
    dept: deptOfStaff(qe.doctor) || fallbackDept || "",
    status: qe.status || "Waiting",
    wait: waitFromCheckIn(qe.checkInTime),
    id: pat.userId || "",
    patientId: pat.userId || "",
    age: ageFromDob(pat.dateOfBirth),
    gender: pat.gender || "",
    phone: pat.phoneNumber || "",
    entryId: qe.queueEntryId,
    queueId: qe.queue && qe.queue.queueId,
    doctorId: qe.doctor && qe.doctor.userId,
    priorityLevel: qe.priorityLevel || "",
    queueDate: qe.queue && qe.queue.date,
  };
}

// Queue entries do not store a department of their own. Borrow it from the
// patient's appointment for the same day so the nurse still sees the correct
// department when no doctor has been assigned yet.
function mapQueueEntries(entries, appointments) {
  const byPatientDate = {};
  const byPatient = {};

  (appointments || []).forEach((appointment) => {
    const patientId = appointment.patient && appointment.patient.userId;
    const department = deptOfAppointment(appointment);
    if (!patientId || !department) return;
    byPatientDate[`${patientId}|${appointment.scheduledDate || ""}`] = department;
    byPatient[patientId] = department;
  });

  return (entries || []).map((entry) => {
    const patientId = entry.patient && entry.patient.userId;
    const queueDate = entry.queue && entry.queue.date;
    const fallback =
      byPatientDate[`${patientId}|${queueDate || ""}`] ||
      byPatient[patientId] ||
      "";
    return mapQueueEntry(entry, fallback);
  });
}

// A live queue entry normally has a number, but legacy rows may not. Every
// screen that shows a number needs the same fallback label rather than an empty
// cell that looks like a rendering bug.
function queueNoLabel(q) {
  return (q && q.no) || "No number";
}

// A patient is waiting for the nurse while their entry is in the live queue
// but has not been assessed yet. Legacy "Pending" entries are included so old
// bookings still appear on the nurse screen. "In Assessment" means a nurse has
// started assessing them and they should not be offered for assessment again.
function isAwaitingNurseStatus(status) {
  return ["Waiting", "Pending", "In Assessment"].includes(
    String(status || "").trim()
  );
}

// Entries without a number sort after the numbered patients instead of
// pretending to be number zero.
function queueNoSortKey(q) {
  const n = Number(q && q.no ? q.no.replace("Q", "") : NaN);
  return Number.isNaN(n) ? Infinity : n;
}

function mapVisit(v) {
  return {
    id: v.visitId,
    patient: fullName(v.patient),
    patientId: v.patient && v.patient.userId,
    date: fmtDate(v.visitDate),
    visitDate: v.visitDate,
    appointmentId: v.appointment && v.appointment.appointmentId,
    dept: (v.appointment && deptOfStaff(v.appointment.doctor)) || "",
    doctorId: v.appointment && v.appointment.doctor && v.appointment.doctor.userId,
    checkInTime: v.checkInTime || "",
    checkOutTime: v.checkOutTime || "",
    outcome: v.status || "Completed",
  };
}

function mapVitalSigns(v) {
  const patientName = v.visit && v.visit.patient ? fullName(v.visit.patient) : "";
  const recordedBy = staffDisplayName(v.recordedBy);
  return {
    id: v.vitalId,
    visitId: v.visit && v.visit.visitId,
    patientId: v.visit && v.visit.patient && v.visit.patient.userId,
    patient: patientName,
    // The nurse pages use these names; keeping them here avoids every page
    // having to know that the backend calls them patient/recordedBy.
    patientName,
    department: "",
    queueNumber: "",
    temperature: v.temperature || "",
    bloodPressure: v.bloodPressure || "",
    heartRate: v.heartRate || "",
    weight: v.weight || "",
    oxygenSaturation: v.oxygenSaturation || "",
    respiratoryRate: v.respiratoryRate || "",
    symptoms: v.symptoms || "",
    nurseNotes: v.nurseNotes || "",
    recordedBy,
    assessedBy: recordedBy,
    recordedAt: v.recordedAt || "",
    assessedAt: v.recordedAt || "",
  };
}

function mapRecord(r) {
  return {
    patient: fullName(r.patient),
    condition: r.diagnosis || r.notes || "",
    diagnosis: r.diagnosis || "",
    complaint: r.complaint || "",
    lastVisit: fmtDate(r.recordDate),
    doctor: staffDisplayName(r.createdBy),
    date: r.recordDate,
    visitDate: r.recordDate,
    recordDate: r.recordDate,
    createdDate: r.recordDate,
    recordId: r.recordId,
    notes: r.notes || "",
    doctorId: r.createdBy && r.createdBy.userId,
    patientId: r.patient && r.patient.userId,
  };
}

function mapPrescription(pres) {
  const record = pres.medicalRecord || {};
  return {
    id: pres.prescriptionId,
    patient: fullName(record.patient),
    medication: pres.medicationName,
    dosage: pres.dosage || "",
    prescribedBy: staffDisplayName(record.createdBy),
    duration: pres.instructions || "",
    date: fmtDate(pres.prescriptionDate),
    prescriptionDate: pres.prescriptionDate,
    status: pres.status || "Pending",
    recordId: record.recordId,
    doctorId: record.createdBy && record.createdBy.userId,
    patientId: (record.patient || {}).userId,
  };
}

function mapUser(s) {
  return {
    id: s.userId,
    name: staffDisplayName(s),
    role: s.position || (s.role && s.role.roleName) || "",
    email: s.email || "",
    phone: s.phoneNumber || "",
    status: s.status ? "Active" : "Inactive",
    clinic: s.clinic && s.clinic.clinicName ? s.clinic.clinicName : "",
    department: deptOfStaff(s),
    departmentId: s.department && s.department.departmentId,
    createdAt: s.createdAt || "",
  };
}

function mapClinic(c) {
  return {
    id: c.clinicId,
    name: c.clinicName,
    code: c.clinicId,
    location: c.location || "",
    contact: c.contactNumber || "",
  };
}

function mapDepartment(d, staff, appointments) {
  staff = staff || [];
  appointments = appointments || [];
  const today = todayIso();
  const bookedToday = appointments.filter(
    (a) =>
      a.scheduledDate === today &&
      ((a.department && a.department.departmentId === d.departmentId) ||
        (a.doctor && deptOfStaff(a.doctor) === d.departmentName))
  ).length;
  return {
    id: d.departmentId,
    name: d.departmentName,
    description: d.description || "",
    doctors: staff.filter(
      (s) => deptOfStaff(s) === d.departmentName && /doctor/i.test(s.position || "")
    ).length,
    today: bookedToday,
    avgWait: "",
  };
}


/* =========================================================
   WRITE LAYER (frontend -> backend)
   The backend entity field names differ slightly from the
   frontend display names, so payloads are built here once and
   every page uses the same helpers.
========================================================= */

// Generic async request. Resolves { ok, status, data }. When a session
// token exists it is sent as "Authorization: Bearer <token>" so the
// backend can identify the logged-in user on protected endpoints.
async function apiRequest(method, path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers["Authorization"] = "Bearer " + token;
  try {
    const res = await fetch(API_BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    let data = null;
    try { data = await res.json(); } catch (e) { /* empty body */ }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: null };
  } finally {
    clearTimeout(timer);
  }
}

/* =========================================================
   SESSION + AUTH HELPERS
   The logged-in session is stored in localStorage so protected
   pages can send the bearer token (guard.js) and pages can
   redirect based on the authenticated role. No fake logins:
   a token is only saved after /api/auth/login|register returned
   a real, validated session from the backend.
========================================================= */

const SESSION_KEYS = [
  "mq_token", "mq_userId", "mq_role",
  "mq_patientId", "mq_staffId", "mq_name"
];

function getToken() {
  return localStorage.getItem("mq_token");
}

function saveSession(res) {
  if (!res || !res.token) return false;
  clearSession();
  localStorage.setItem("mq_token", res.token);
  localStorage.setItem("mq_userId", res.userId || "");
  localStorage.setItem("mq_role", res.role || "");
  if (res.patientId) localStorage.setItem("mq_patientId", res.patientId);
  if (res.staffId) localStorage.setItem("mq_staffId", res.staffId);
  localStorage.setItem("mq_name", fullName(res));
  return true;
}

function clearSession() {
  SESSION_KEYS.forEach((k) => localStorage.removeItem(k));
}

const ROLE_LABELS = {
  ADMIN: "Administrator",
  RECEPTIONIST: "Receptionist",
  DOCTOR: "Doctor",
  NURSE: "Nurse",
  PHARMACIST: "Pharmacist",
  PATIENT: "Patient",
};

// Every page repeats the same sidebar/topbar identity chip, so it is filled
// here from the signed-in record rather than being typed into each page.
function fillIdentityChrome() {
  const role = String(localStorage.getItem("mq_role") || "").toUpperCase();
  const data = getData();
  const profile = (data.profiles || {})[role];
  const name = (profile && profile.name) || localStorage.getItem("mq_name") || "";
  const roleLabel = ROLE_LABELS[role] || role;

  document.querySelectorAll(".user-name").forEach((el) => {
    if (name) el.textContent = name;
  });
  document.querySelectorAll(".user-role").forEach((el) => {
    if (roleLabel) el.textContent = roleLabel;
  });
}

function homeForRole(role) {
  return ({
    PATIENT: "patient-dashboard.html",
    ADMIN: "admin-dashboard.html",
    RECEPTIONIST: "receptionist-dashboard.html",
    DOCTOR: "doctor-dashboard.html",
    NURSE: "nurse-dashboard.html",
    PHARMACIST: "pharmacist-dashboard.html"
  })[role] || "index.html";
}

// Extracts the human-readable error from an apiRequest result.
function authError(r) {
  return (r && r.data && r.data.error) || "Something went wrong. Please try again.";
}

// Registers a new patient (POST /api/auth/register). On success the
// response already contains a session token, so the caller should
// saveSession() to log the patient straight in.
async function registerPatientAsync(reg) {
  return apiRequest("POST", "/api/auth/register", {
    firstName: reg.firstName,
    lastName: reg.lastName,
    email: reg.email,
    password: reg.password,
    phoneNumber: reg.phoneNumber,
    idNumber: reg.idNumber,
    dateOfBirth: reg.dateOfBirth,
    gender: reg.gender,
    address: reg.address,
    allergies: reg.allergies || ""
  });
}

// Authenticates any user (patient/staff) by email + password.
async function loginAsync(login) {
  return apiRequest("POST", "/api/auth/login", {
    email: login.email,
    password: login.password
  });
}

// Invalidates the current session token on the backend.
async function logoutAsync() {
  return apiRequest("POST", "/api/auth/logout");
}

// Resolves the profile for the current token (POST-less /api/auth/me).
async function meAsync() {
  return apiRequest("GET", "/api/auth/me");
}

// Cached list of roles from the backend, used to reference roles in payloads.
async function ensureRoles() {
  if (Array.isArray(window.__mqRoles)) return true;
  const r = await apiRequest("GET", "/api/roles");
  if (r.ok && Array.isArray(r.data)) {
    window.__mqRoles = r.data;
    return true;
  }
  return false;
}

function roleRef(roleName) {
  const r = (window.__mqRoles || []).find(
    (x) => String(x.roleName || "").toUpperCase() === String(roleName || "").toUpperCase()
  );
  return r ? { roleId: r.roleId, roleName: r.roleName } : null;
}

function nowIsoLocal() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function todayIso() {
  return nowIsoLocal().split("T")[0];
}

// Queues are per clinic and per date. Operational screens (doctor, nurse,
// reception) must not show a patient who is booked for another day, even
// though the booking already has a queue entry on the server.
function isTodayQueueEntry(entry) {
  if (!entry) return false;
  return !entry.queueDate || entry.queueDate === todayIso();
}

function uniqueId(prefix) {
  return `${prefix}-${new Date().getTime()}`;
}

function splitName(full) {
  const parts = String(full || "").trim().split(/\s+/);
  const first = parts.shift() || "";
  return [first, parts.join(" ")];
}

function dateFromAge(age) {
  const years = Number(age);
  if (!years) return "";
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function to24h(t) {
  const m = String(t || "").match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!m) return t;
  let h = Number(m[1]);
  if (/PM/i.test(m[3]) && h < 12) h += 12;
  if (/AM/i.test(m[3]) && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

// Builds a local Date from an ISO date and a 24-hour time. Returns null when
// either value is missing or invalid.
function localDateTime(dateStr, timeStr) {
  const dateParts = String(dateStr || "").trim().split("-").map(Number);
  const timeParts = to24h(String(timeStr || "").trim()).split(":").map(Number);
  if (dateParts.length !== 3 || timeParts.length !== 2) return null;

  const [year, month, day] = dateParts;
  const [hour, minute] = timeParts;
  if (
    !year || !month || !day ||
    Number.isNaN(hour) || Number.isNaN(minute)
  ) {
    return null;
  }

  const value = new Date(year, month - 1, day, hour, minute, 0, 0);
  return Number.isNaN(value.getTime()) ? null : value;
}

function isPastDateTime(dateStr, timeStr) {
  const value = localDateTime(dateStr, timeStr);
  return !value || value < new Date();
}

// Matches a user against a display label like "Dr. N. Zulu".
function userMatchesLabel(user, label) {
  const a = String((user && user.name) || "").toLowerCase().replace(/\s+/g, " ");
  const b = String(label || "").toLowerCase().replace(/\s+/g, " ").replace(/^(dr\.|dr)\s+/, "");
  return a === b;
}

// ---- Payload builders (backend entity field names) ----

// Throws-free: returns { payload, error } so a missing required field becomes a
// visible message instead of a made-up value written into the database.
function buildPatientPayload(f) {
  const [firstName, lastName] = splitName(f.name);
  const role = roleRef("PATIENT");
  if (!firstName) return { error: "Patient first name is required." };
  if (!f.email) return { error: "Patient email is required." };
  if (!f.idNumber) return { error: "Patient ID number is required." };
  if (!f.dateOfBirth) return { error: "Patient date of birth is required." };
  if (!f.phone) return { error: "Patient phone number is required." };
  if (!role) return { error: "Could not load the PATIENT role from the server." };
  const payload = {
    type: "patient",
    // The backend keys patients on userId and does not generate it, so a new
    // id is minted here when the caller does not supply one.
    userId: f.patientId || uniqueId("P"),
    firstName,
    lastName,
    email: f.email,
    phoneNumber: String(f.phone).replace(/\s+/g, ""),
    status: true,
    role,
    idNumber: f.idNumber,
    dateOfBirth: f.dateOfBirth,
    gender: f.gender || "M",
    address: f.address || "Not provided",
    allergies: f.allergies || "",
  };
  // Password is write-only and never sent back to the browser. When the form
  // does not collect one, the backend generates an unusable random credential.
  if (f.password) payload.password = f.password;
  return { payload };
}

function buildStaffPayload(f) {
  const [firstName, lastName] = splitName(f.name);
  const role = roleRef(staffRoleForPosition(f.position));
  const department = departmentRef(f.departmentId || f.department);
  if (!firstName) return { error: "Staff first name is required." };
  if (!f.email) return { error: "Staff email is required." };
  if (!f.phone) return { error: "Staff phone number is required." };
  if (!f.position) return { error: "Staff position is required." };
  if (!role) return { error: "Could not load the role for this position from the server." };
  if (!department) return { error: "Select a department for this staff member." };
  const payload = {
    type: "staff",
    userId: f.staffId || uniqueId("S"),
    firstName,
    lastName,
    email: f.email,
    phoneNumber: String(f.phone).replace(/\s+/g, ""),
    status: f.status === undefined ? true : Boolean(f.status),
    role,
    position: f.position,
    department,
  };
  if (f.password) payload.password = f.password;
  return { payload };
}

function staffRoleForPosition(position) {
  const p = String(position || "").toUpperCase();
  if (p.includes("DOCTOR")) return "DOCTOR";
  if (p.includes("NURSE")) return "NURSE";
  if (p.includes("PHARMAC")) return "PHARMACIST";
  if (p.includes("RECEPTION")) return "RECEPTIONIST";
  if (p.includes("ADMIN")) return "ADMIN";
  return p;
}

function departmentRef(department) {
  if (!department) return null;
  const list = window.__mqDepartments || [];
  const wanted = String(department);
  const match = list.find(
    (d) => String(d.departmentId) === wanted || String(d.departmentName) === wanted
  );
  return match ? { departmentId: match.departmentId, departmentName: match.departmentName } : null;
}

function buildAppointmentPayload(f) {
  if (!f.patientId) return { error: "Select a patient for the appointment." };
  if (!f.scheduledDate) return { error: "Appointment date is required." };
  if (!f.scheduledTime) return { error: "Appointment time is required." };
  return {
    payload: {
      appointmentId: f.appointmentId,
      patient: { type: "patient", userId: f.patientId },
      // doctorId stays null until somebody is assigned - the column is nullable
      // so a patient can be booked before a doctor is allocated.
      doctor: f.doctorId ? { type: "staff", userId: f.doctorId } : null,
      clinic: f.clinicId ? { clinicId: f.clinicId } : null,
      department: f.departmentId ? { departmentId: f.departmentId } : null,
      reason: f.reason || "",
      scheduledDate: f.scheduledDate,
      scheduledTime: f.scheduledTime,
      appointmentType: f.appointmentType || "booked",
      status: f.status || "Pending",
      createdBy: f.createdById ? { type: "staff", userId: f.createdById } : null,
    },
  };
}

function buildClinicPayload(f) {
  if (!f.clinicName) return { error: "Clinic name is required." };
  return {
    payload: {
      // The backend keys clinics on clinicId and does not generate it.
      clinicId: f.clinicId || uniqueId("CL"),
      clinicName: f.clinicName,
      location: f.location || "",
      contactNumber: f.contactNumber || "",
    },
  };
}

function buildDepartmentPayload(f) {
  if (!f.departmentName) return { error: "Department name is required." };
  return {
    payload: {
      // The backend keys departments on departmentId and does not generate it.
      departmentId: f.departmentId || uniqueId("D"),
      departmentName: f.departmentName,
      description: f.description || "",
    },
  };
}

function buildMedicalRecordPayload(f) {
  if (!f.patientId) return { error: "Select a patient for the record." };
  if (!f.doctorId) return { error: "Select the doctor who created the record." };
  if (!f.recordDate) return { error: "Record date is required." };
  return {
    payload: {
      recordId: f.recordId,
      patient: { type: "patient", userId: f.patientId },
      createdBy: { type: "staff", userId: f.doctorId },
      complaint: f.complaint || "",
      diagnosis: f.diagnosis || "",
      notes: f.notes || "",
      recordDate: f.recordDate,
    },
  };
}

function buildPrescriptionPayload(f) {
  if (!f.recordId) return { error: "A prescription must be linked to a medical record." };
  if (!f.medicationName) return { error: "Medication name is required." };
  if (!f.prescriptionDate) return { error: "Prescription date is required." };
  return {
    payload: {
      prescriptionId: f.prescriptionId,
      medicalRecord: { recordId: f.recordId },
      medicationName: f.medicationName,
      dosage: f.dosage || "",
      instructions: f.instructions || "",
      prescriptionDate: f.prescriptionDate,
      // status is NOT NULL in the database, so every new prescription starts
      // as "Pending" and the pharmacist moves it to "Dispensed" afterwards.
      status: f.status || "Pending",
    },
  };
}

function buildVisitPayload(f) {
  if (!f.patientId) return { error: "Select a patient for the visit." };
  if (!f.visitDate) return { error: "Visit date is required." };
  return {
    payload: {
      visitId: f.visitId,
      patient: { type: "patient", userId: f.patientId },
      appointment: f.appointmentId ? { appointmentId: f.appointmentId } : null,
      visitDate: f.visitDate,
      checkInTime: f.checkInTime || null,
      checkOutTime: f.checkOutTime || null,
      status: f.status || "In Progress",
    },
  };
}

function buildVitalSignsPayload(f) {
  if (!f.visitId) return { error: "Vitals must be linked to a visit." };
  const nurseId = localStorage.getItem("mq_staffId");
  return {
    payload: {
      vitalId: f.vitalId,
      visit: { visitId: f.visitId },
      temperature: f.temperature == null || f.temperature === "" ? null : String(f.temperature),
      bloodPressure: f.bloodPressure || null,
      heartRate: f.heartRate == null || f.heartRate === "" ? null : String(f.heartRate),
      weight: f.weight == null || f.weight === "" ? null : String(f.weight),
      oxygenSaturation: f.oxygenSaturation || null,
      respiratoryRate: f.respiratoryRate || null,
      symptoms: f.symptoms || null,
      nurseNotes: f.nurseNotes || null,
      // recorded_by / recorded_at are nullable, but stamping the signed-in
      // nurse makes the vitals traceable in the database.
      recordedBy: nurseId ? { type: "staff", userId: nurseId } : null,
      recordedAt: nowIsoLocal(),
    },
  };
}

function buildQueuePayload(f) {
  if (!f.clinicId) return { error: "Select a clinic for the queue." };
  if (!f.date) return { error: "Queue date is required." };
  return {
    payload: {
      queueId: f.queueId,
      clinic: { clinicId: f.clinicId },
      date: f.date,
      maxCapacity: f.maxCapacity || 50,
    },
  };
}

function buildQueueEntryPayload(f) {
  if (!f.queueId) return { error: "No queue is available for today." };
  if (!f.patientId) return { error: "Select a patient to add to the queue." };
  return {
    payload: {
      queueEntryId: f.queueEntryId,
      queue: { queueId: f.queueId },
      patient: { type: "patient", userId: f.patientId },
      // A queue entry can be created before a doctor is allocated, so doctor
      // is null rather than a reference with no id.
      doctor: f.doctorId ? { type: "staff", userId: f.doctorId } : null,
      visit: f.visitId ? { visitId: f.visitId } : null,
      // No queueNumber is sent: the server issues the number as soon as the
      // entry joins the live queue, so the client cannot hand out its own.
      priorityLevel: f.priorityLevel || "Normal",
      status: f.status || "Waiting",
      checkInTime: f.checkInTime || null,
    },
  };
}

// ---- Orchestration helpers: write to the backend, then refresh the cache ----
// Every helper returns { ok, error, ... }. On failure nothing is written to the
// cache and `error` holds a message the page can show the user, so a rejected
// save is never presented as a success.

function serverError(r, fallback) {
  if (r && r.data && r.data.error) return r.data.error;
  if (r && r.data && r.data.message) return r.data.message;
  if (r && r.status === 0) return "Could not reach the server. Check that Spring Boot is running.";
  if (r && r.status === 404) return "That record no longer exists on the server.";
  if (r && r.status === 409) return "That record already exists (duplicate id, email or ID number).";
  if (r && r.status === 400) return "The server rejected the values that were sent.";
  return fallback || "The server rejected the request.";
}

function notFound(message) {
  return { ok: false, error: message };
}

async function ensureDepartments() {
  if (Array.isArray(window.__mqDepartments)) return true;
  const r = await apiRequest("GET", "/department/getAll");
  if (r.ok && Array.isArray(r.data)) {
    window.__mqDepartments = r.data;
    return true;
  }
  return false;
}

async function createPatientAsync(input) {
  await ensureRoles();
  const built = buildPatientPayload(input);
  if (built.error) return notFound(built.error);
  const r = await apiRequest("POST", "/patient/create", built.payload);
  if (!r.ok) return { ok: false, status: r.status, error: serverError(r) };
  const data = getData();
  const deptMap = {};
  if (built.payload.userId) deptMap[built.payload.userId] = input.dept || "";
  data.patients = [mapPatient(r.data || built.payload, deptMap), ...(data.patients || [])];
  setData(data);
  return { ok: true, created: r.data };
}

async function updatePatientAsync(patientId, input) {
  await ensureRoles();
  const built = buildPatientPayload(Object.assign({}, input, { patientId }));
  if (built.error) return notFound(built.error);
  const r = await apiRequest("PUT", "/patient/update", built.payload);
  if (!r.ok) return { ok: false, status: r.status, error: serverError(r) };
  const data = getData();
  const saved = mapPatient(r.data || built.payload, {});
  data.patients = (data.patients || []).map((p) => (p.id === patientId ? saved : p));
  setData(data);
  return { ok: true, updated: r.data };
}

async function deletePatientAsync(patientId) {
  const r = await apiRequest("DELETE", "/patient/delete/" + encodeURIComponent(patientId));
  if (!r.ok) return { ok: false, status: r.status, error: serverError(r, "Could not delete the patient.") };
  const data = getData();
  data.patients = (data.patients || []).filter((p) => p.id !== patientId);
  data.queue = (data.queue || []).filter((q) => q.id !== patientId);
  setData(data);
  return { ok: true };
}

async function createStaffAsync(input) {
  await ensureRoles();
  await ensureDepartments();
  const built = buildStaffPayload(input);
  if (built.error) return notFound(built.error);
  const r = await apiRequest("POST", "/staff/create", built.payload);
  if (!r.ok) return { ok: false, status: r.status, error: serverError(r) };
  const data = getData();
  data.users = [mapUser(r.data || built.payload), ...(data.users || [])];
  setData(data);
  return { ok: true, created: r.data };
}

async function updateStaffAsync(staffId, input) {
  await ensureRoles();
  await ensureDepartments();
  const built = buildStaffPayload(Object.assign({}, input, { staffId }));
  if (built.error) return notFound(built.error);
  const r = await apiRequest("PUT", "/staff/update", built.payload);
  if (!r.ok) return { ok: false, status: r.status, error: serverError(r) };
  const data = getData();
  const saved = mapUser(r.data || built.payload);
  data.users = (data.users || []).map((u) => (u.id === staffId ? saved : u));
  setData(data);
  return { ok: true, updated: r.data };
}

async function deleteStaffAsync(staffId) {
  const r = await apiRequest("DELETE", "/staff/delete/" + encodeURIComponent(staffId));
  if (!r.ok) return { ok: false, status: r.status, error: serverError(r) };
  const data = getData();
  data.users = (data.users || []).filter((u) => u.id !== staffId);
  setData(data);
  return { ok: true };
}

// Refreshes just the queue collection. Booking and doctor-assignment both
// create/update server-side queue entries, so the cache must adopt them before
// any page decides whether a patient is already queued.
async function refreshQueueFromApiAsync() {
  const r = await apiRequest("GET", API_COLLECTIONS.queueEntries);
  if (!r.ok || !Array.isArray(r.data)) {
    return false;
  }
  const data = getData();
  data.queue = mapQueueEntries(r.data, data.appointments);
  setData(data);
  return true;
}

async function createAppointmentAsync(input) {
  const built = buildAppointmentPayload(input);
  if (built.error) return notFound(built.error);
  const r = await apiRequest("POST", "/appointment/create", built.payload);
  if (!r.ok) return { ok: false, status: r.status, error: serverError(r) };
  const data = getData();
  data.appointments = [mapAppointment(r.data || built.payload), ...(data.appointments || [])];
  setData(data);
  await refreshQueueFromApiAsync();
  return { ok: true, created: r.data };
}

async function updateAppointmentAsync(appointmentId, input) {
  const built = buildAppointmentPayload(Object.assign({}, input, { appointmentId }));
  if (built.error) return notFound(built.error);
  const r = await apiRequest("PUT", "/appointment/update", built.payload);
  if (!r.ok) return { ok: false, status: r.status, error: serverError(r) };
  const data = getData();
  const saved = mapAppointment(r.data || built.payload);
  data.appointments = (data.appointments || []).map((a) => (a.id === appointmentId ? saved : a));
  setData(data);
  await refreshQueueFromApiAsync();
  return { ok: true, updated: r.data };
}

// Assigns a doctor to an appointment; the backend also sets its status
// to "Confirmed". Updates the cache from the server's response so lists
// re-render instantly.
async function assignAppointmentDoctorAsync(appointmentId, doctorId) {
  const r = await apiRequest("PUT", "/appointment/assign/" + encodeURIComponent(appointmentId) + "/" + encodeURIComponent(doctorId));
  if (!r.ok || !r.data) return { ok: false, status: r.status, error: serverError(r, "Could not assign the doctor.") };
  const data = getData();
  data.appointments = (data.appointments || []).map((a) => (a.id === appointmentId ? mapAppointment(r.data) : a));
  setData(data);
  await refreshQueueFromApiAsync();
  return { ok: true };
}

// Updates an appointment's status via the backend.
async function updateAppointmentStatusAsync(appointmentId, status) {
  const r = await apiRequest("PUT", "/appointment/status/" + encodeURIComponent(appointmentId) + "/" + encodeURIComponent(status));
  if (!r.ok || !r.data) return { ok: false, status: r.status, error: serverError(r, "Could not update the appointment status.") };
  const data = getData();
  const saved = mapAppointment(r.data);
  data.appointments = (data.appointments || []).map((a) => (a.id === appointmentId ? saved : a));
  setData(data);
  await refreshQueueFromApiAsync();
  return { ok: true };
}

// Deletes an appointment via the backend and drops it from the cache.
async function deleteAppointmentAsync(appointmentId) {
  const r = await apiRequest("DELETE", "/appointment/delete/" + encodeURIComponent(appointmentId));
  if (!r.ok) return { ok: false, status: r.status, error: serverError(r, "Could not delete the appointment.") };
  const data = getData();
  data.appointments = (data.appointments || []).filter((a) => a.id !== appointmentId);
  setData(data);
  return { ok: true };
}

async function createMedicalRecordAsync(input) {
  const built = buildMedicalRecordPayload(input);
  if (built.error) return notFound(built.error);
  const r = await apiRequest("POST", "/medical-record/create", built.payload);
  if (!r.ok) return { ok: false, status: r.status, error: serverError(r) };
  const data = getData();
  data.records = [mapRecord(r.data || built.payload), ...(data.records || [])];
  setData(data);
  return { ok: true, created: r.data };
}

async function createPrescriptionAsync(input) {
  const built = buildPrescriptionPayload(input);
  if (built.error) return notFound(built.error);
  const r = await apiRequest("POST", "/prescription/create", built.payload);
  if (!r.ok) return { ok: false, status: r.status, error: serverError(r) };
  const data = getData();
  data.prescriptions = [mapPrescription(r.data || built.payload), ...(data.prescriptions || [])];
  setData(data);
  return { ok: true, created: r.data };
}

// Pharmacist action: moves a prescription between Pending and Dispensed and
// writes the new status to the database.
async function updatePrescriptionStatusAsync(prescriptionId, status) {
  const r = await apiRequest("PUT", "/prescription/status/" + encodeURIComponent(prescriptionId) + "/" + encodeURIComponent(status));
  if (!r.ok || !r.data) return { ok: false, status: r.status, error: serverError(r, "Could not update the prescription status.") };
  const data = getData();
  data.prescriptions = (data.prescriptions || []).map((p) => (p.id === prescriptionId ? mapPrescription(r.data) : p));
  setData(data);
  return { ok: true };
}

async function deletePrescriptionAsync(prescriptionId) {
  const r = await apiRequest("DELETE", "/prescription/delete/" + encodeURIComponent(prescriptionId));
  if (!r.ok) return { ok: false, status: r.status, error: serverError(r, "Could not delete the prescription.") };
  const data = getData();
  data.prescriptions = (data.prescriptions || []).filter((p) => p.id !== prescriptionId);
  setData(data);
  return { ok: true };
}

async function createClinicAsync(input) {
  const built = buildClinicPayload(input);
  if (built.error) return notFound(built.error);
  const r = await apiRequest("POST", "/clinic/create", built.payload);
  if (!r.ok) return { ok: false, status: r.status, error: serverError(r) };
  const data = getData();
  data.clinics = [mapClinic(r.data || built.payload), ...(data.clinics || [])];
  setData(data);
  return { ok: true, created: r.data };
}

async function updateClinicAsync(clinicId, input) {
  const built = buildClinicPayload(Object.assign({}, input, { clinicId }));
  if (built.error) return notFound(built.error);
  const r = await apiRequest("PUT", "/clinic/update", built.payload);
  if (!r.ok) return { ok: false, status: r.status, error: serverError(r) };
  const data = getData();
  data.clinics = (data.clinics || []).map((c) => (c.id === clinicId ? mapClinic(r.data || built.payload) : c));
  setData(data);
  return { ok: true, updated: r.data };
}

async function deleteClinicAsync(clinicId) {
  const r = await apiRequest("DELETE", "/clinic/delete/" + encodeURIComponent(clinicId));
  if (!r.ok) return { ok: false, status: r.status, error: serverError(r, "Could not delete the clinic.") };
  const data = getData();
  data.clinics = (data.clinics || []).filter((c) => c.id !== clinicId);
  setData(data);
  return { ok: true };
}

async function createDepartmentAsync(input) {
  const built = buildDepartmentPayload(input);
  if (built.error) return notFound(built.error);
  const r = await apiRequest("POST", "/department/create", built.payload);
  if (!r.ok) return { ok: false, status: r.status, error: serverError(r) };
  window.__mqDepartments = null;
  await ensureDepartments();
  const data = getData();
  const created = r.data || built.payload;
  const staff = data.users || [];
  data.departments = [mapDepartment(created, staff, data.appointments || []), ...(data.departments || [])];
  setData(data);
  return { ok: true, created: r.data };
}

async function updateDepartmentAsync(departmentId, input) {
  const built = buildDepartmentPayload(Object.assign({}, input, { departmentId }));
  if (built.error) return notFound(built.error);
  const r = await apiRequest("PUT", "/department/update", built.payload);
  if (!r.ok) return { ok: false, status: r.status, error: serverError(r) };
  window.__mqDepartments = null;
  await ensureDepartments();
  const data = getData();
  const saved = mapDepartment(r.data || built.payload, data.users || [], data.appointments || []);
  data.departments = (data.departments || []).map((d) => (d.id === departmentId ? saved : d));
  setData(data);
  return { ok: true, updated: r.data };
}

async function deleteDepartmentAsync(departmentId) {
  const r = await apiRequest("DELETE", "/department/delete/" + encodeURIComponent(departmentId));
  if (!r.ok) return { ok: false, status: r.status, error: serverError(r, "Could not delete the department.") };
  window.__mqDepartments = null;
  await ensureDepartments();
  const data = getData();
  data.departments = (data.departments || []).filter((d) => d.id !== departmentId);
  setData(data);
  return { ok: true };
}

// Returns the queue for today, opening one for the first clinic when the day
// has no queue yet. Queue numbers come from the database, not from the cache.
async function ensureTodayQueueAsync(clinicId) {
  const today = todayIso();
  const all = await apiRequest("GET", "/mediqueue/queue/all");
  if (all.ok && Array.isArray(all.data)) {
    const match = all.data.find(
      (q) => q.date === today && (!clinicId || (q.clinic && q.clinic.clinicId === clinicId))
    );
    if (match) return { queueId: match.queueId };
  }
  let clinic = clinicId;
  if (!clinic) {
    const cr = await apiRequest("GET", "/clinic/getAll");
    if (!cr.ok || !Array.isArray(cr.data) || !cr.data.length) {
      return { error: "No clinic exists yet. Add a clinic before queueing patients." };
    }
    clinic = cr.data[0].clinicId;
  }
  const built = buildQueuePayload({ queueId: uniqueId("Q"), clinicId: clinic, date: today, maxCapacity: 50 });
  if (built.error) return { error: built.error };
  const created = await apiRequest("POST", "/mediqueue/queue/create", built.payload);
  if (!created.ok) return { error: serverError(created, "Could not open a queue for today.") };
  return { queueId: (created.data || {}).queueId };
}

// Adds a patient to today's queue by creating a QueueEntry on the backend.
async function createQueueEntryAsync(input) {
  if (!input.patientId) return notFound("Select a patient to add to the queue.");
  const queue = input.queueId ? { queueId: input.queueId } : await ensureTodayQueueAsync(input.clinicId);
  if (!queue.queueId) return notFound(queue.error || "No queue is available for today.");
  const built = buildQueueEntryPayload({
    queueEntryId: input.queueEntryId || uniqueId("QE"),
    queueId: queue.queueId,
    patientId: input.patientId,
    doctorId: input.doctorId || null,
    visitId: input.visitId || null,
    priorityLevel: input.priorityLevel || "Normal",
    // Every new entry joins the live queue immediately, even before a doctor
    // is allocated, so the patient can be numbered and seen by the nurse.
    status: input.status || "Waiting",
    checkInTime: input.checkInTime || null,
  });
  if (built.error) return notFound(built.error);
  const r = await apiRequest("POST", "/mediqueue/queue-entry/create", built.payload);
  if (!r.ok) return { ok: false, status: r.status, error: serverError(r) };
  const data = getData();
  data.queue = [
    ...(data.queue || []),
    ...mapQueueEntries([r.data || built.payload], data.appointments),
  ];
  setData(data);
  return { ok: true, created: r.data };
}

// Fetches the full QueueEntry, changes its status and saves it back.
async function setQueueEntryStatusAsync(entryId, status) {
  const r = await apiRequest("GET", "/mediqueue/queue-entry/read/" + encodeURIComponent(entryId));
  if (!r.ok || !r.data) return { ok: false, status: r.status, error: serverError(r, "Could not load the queue entry.") };
  r.data.status = status;
  const u = await apiRequest("PUT", "/mediqueue/queue-entry/update", r.data);
  if (!u.ok) return { ok: false, status: u.status, error: serverError(u, "Could not update the queue entry.") };
  const data = getData();
  const saved = u.data ? mapQueueEntries([u.data], data.appointments)[0] : null;
  data.queue = (data.queue || []).map((q) => (q.entryId === entryId ? saved || Object.assign({}, q, { status }) : q));
  setData(data);
  return { ok: true };
}

// Links the visit a nurse opened to the queue entry the patient arrived on.
async function attachVisitToQueueEntryAsync(entryId, visitId) {
  if (!entryId || !visitId) return { ok: true };
  const r = await apiRequest("GET", "/mediqueue/queue-entry/read/" + encodeURIComponent(entryId));
  if (!r.ok || !r.data) return { ok: false, status: r.status, error: serverError(r) };
  r.data.visit = { visitId };
  const u = await apiRequest("PUT", "/mediqueue/queue-entry/update", r.data);
  if (!u.ok) return { ok: false, status: u.status, error: serverError(u) };
  return { ok: true };
}

async function deleteQueueEntryAsync(entryId) {
  const r = await apiRequest("DELETE", "/mediqueue/queue-entry/delete/" + encodeURIComponent(entryId));
  if (!r.ok) return { ok: false, status: r.status, error: serverError(r, "Could not remove the queue entry.") };
  const data = getData();
  data.queue = (data.queue || []).filter((q) => q.entryId !== entryId);
  setData(data);
  return { ok: true };
}

async function createVisitAsync(input) {
  const built = buildVisitPayload(input);
  if (built.error) return notFound(built.error);
  const r = await apiRequest("POST", "/mediqueue/visit/create", built.payload);
  if (!r.ok) return { ok: false, status: r.status, error: serverError(r) };
  const data = getData();
  data.visits = [mapVisit(r.data || built.payload), ...(data.visits || [])];
  setData(data);
  return { ok: true, created: r.data };
}

async function updateVisitAsync(visitId, input) {
  const built = buildVisitPayload(Object.assign({}, input, { visitId }));
  if (built.error) return notFound(built.error);
  const r = await apiRequest("PUT", "/mediqueue/visit/update", built.payload);
  if (!r.ok) return { ok: false, status: r.status, error: serverError(r) };
  const data = getData();
  data.visits = (data.visits || []).map((v) => (v.id === visitId ? mapVisit(r.data || built.payload) : v));
  setData(data);
  return { ok: true, updated: r.data };
}

async function createVitalSignsAsync(input) {
  if (!input.visitId) return notFound("Vitals must be linked to a visit.");
  const built = buildVitalSignsPayload({
    vitalId: uniqueId("VIT"),
    visitId: input.visitId,
    temperature: input.temperature,
    bloodPressure: input.bloodPressure,
    heartRate: input.heartRate,
    weight: input.weight,
    oxygenSaturation: input.oxygenSaturation,
    respiratoryRate: input.respiratoryRate,
    symptoms: input.symptoms,
    nurseNotes: input.nurseNotes,
  });
  if (built.error) return notFound(built.error);
  const r = await apiRequest("POST", "/mediqueue/vital-signs/create", built.payload);
  if (!r.ok) return { ok: false, status: r.status, error: serverError(r) };
  return { ok: true, created: r.data };
}

// Nurse assessment: the symptoms are analysed and stored server-side, so the
// result is in the database and the patient can read it back later.
async function analyzeSymptomsAsync(patientId, inputText) {
  if (!patientId) return notFound("Select a patient before running the analysis.");
  if (!inputText) return notFound("Enter the symptoms to analyse.");
  const r = await apiRequest("POST", "/mediqueue/symptoms-analysis/analyze", { patientId, inputText });
  if (!r.ok) return { ok: false, status: r.status, error: serverError(r, "Could not run the symptom analysis.") };
  return { ok: true, analysis: r.data };
}

async function listSymptomAnalysesAsync(patientId) {
  if (!patientId) return { ok: true, analyses: [] };
  const r = await apiRequest("GET", "/mediqueue/symptoms-analysis/patient/" + encodeURIComponent(patientId));
  if (!r.ok) return { ok: false, status: r.status, error: serverError(r, "Could not load previous analyses.") };
  return { ok: true, analyses: Array.isArray(r.data) ? r.data : [] };
}

/* =========================================================
   BOOTSTRAP
   ========================================================= */

// Pull fresh data from the backend in the background and cache it
// (only replaces the cache if every endpoint answered).
async function refreshFromApiAsync() {
  const keys = Object.keys(API_COLLECTIONS);
  const results = await Promise.all(keys.map((k) => asyncGetJSON(API_COLLECTIONS[k])));
  if (!results.every((r) => r !== null)) return false; // backend not fully reachable
  window.__mqConnected = true;
  hideOfflineNotice();
  const raw = {};
  keys.forEach((k, i) => (raw[k] = results[i]));
  setData(buildDataFromApi(raw));
  console.log("[MediQueue] Connected to backend at " + API_BASE);
  return true;
}

// Probes the backend on every page load. The cache is only ever filled from the
// database; if the backend cannot be reached the app stays on the empty shape
// and shows the "not connected" banner instead of demo rows.
function initData() {
  if (!connectBackendSync()) {
    // Drop any cache left over from an earlier session so nothing stale (and
    // nothing that used to be seeded demo data) is shown.
    localStorage.removeItem(DATA_KEY);
    setData(emptyData());
  }
}


// Banner telling the user the app cannot reach the database, so writes are
// being refused instead of being kept in the browser.
function showOfflineNotice() {
  if (typeof document === "undefined" || !document.body || window.__mqConnected) return;
  if (document.getElementById("mqOfflineBar")) return;
  const bar = document.createElement("div");
  bar.id = "mqOfflineBar";
  bar.setAttribute("role", "alert");
  bar.style.cssText =
    "position:fixed;top:0;left:0;right:0;z-index:99999;background:#b3261e;color:#fff;" +
    "padding:8px 40px 8px 14px;font-size:12.5px;text-align:center;";
  bar.textContent =
    "Not connected to the database: the MediQueue backend is not reachable, so nothing can be " +
    "saved right now. Start Spring Boot with mvnw.cmd spring-boot:run, then reload this page.";
  const close = document.createElement("button");
  close.type = "button";
  close.setAttribute("aria-label", "Dismiss");
  close.textContent = "×";
  close.style.cssText = "position:absolute;right:8px;top:3px;background:none;border:none;color:#fff;font-size:18px;cursor:pointer;";
  close.addEventListener("click", () => bar.remove());
  bar.appendChild(close);
  document.body.prepend(bar);
}

function hideOfflineNotice() {
  if (typeof document === "undefined") return;
  const bar = document.getElementById("mqOfflineBar");
  if (bar) bar.remove();
}

// The cache holds exactly what the API last returned. It is never seeded, so
// an empty database (or an unreachable backend) renders as an empty list rather
// than invented records.
function getData() {
  let parsed = null;
  try {
    parsed = JSON.parse(localStorage.getItem(DATA_KEY));
  } catch (e) {
    parsed = null;
  }
  if (!parsed || typeof parsed !== "object") return emptyData();
  return Object.assign(emptyData(), parsed);
}

function setData(data) {
  const merged = markQueuedPatients(Object.assign(emptyData(), data || {}));
  localStorage.setItem(DATA_KEY, JSON.stringify(merged));
  syncDepartments(merged.departments || []);
  return merged;
}

// DEPARTMENTS is used by several pages as a plain array; it is kept in step
// with the cache so those dropdowns always follow the database.
const DEPARTMENTS = [];
function syncDepartments(list) {
  DEPARTMENTS.splice(0, DEPARTMENTS.length, ...list);
}

initData();

// Keep polling while the backend is down so the app adopts it the moment it
// comes up, without requiring a page refresh.
startBackendPoller();

// Show the offline banner as soon as the page body is available.
if (typeof document !== "undefined" && document.addEventListener) {
  document.addEventListener("DOMContentLoaded", showOfflineNotice);
  // The sidebar/topbar identity chip is repeated across every page; fill it
  // from the signed-in record instead of a name typed into the markup.
  document.addEventListener("DOMContentLoaded", fillIdentityChrome);
}
