"use strict";

window.initializeStaffDashboard = () => {
  const accounts = window.PortalAccounts;
  const requestService = window.PortalRequestService;
  const appointmentService = window.PortalAppointmentService;
  const routes = window.PortalStaffRoutes;
  const loginScreen = document.querySelector("#login-screen");
  const staffScreen = document.querySelector("#staff-screen");
  const staffMain = document.querySelector("#staff-main");
  const topbarTitle = document.querySelector("#staff-topbar-title");
  const sidebar = document.querySelector("#staff-sidebar");
  const sidebarToggle = document.querySelector("#staff-sidebar-toggle");
  const sidebarOverlay = document.querySelector("#staff-sidebar-overlay");
  const accountDropdown = document.querySelector("#staff-account-dropdown");
  const accountToggle = document.querySelector("#staff-account-toggle");
  const accountOptions = document.querySelector("#staff-account-options");
  const mobileNavigation = window.matchMedia("(max-width: 700px)");
  const notice = document.querySelector("#staff-notice");
  const themeToggle = document.querySelector("#staff-theme-toggle");
  const themeIcon = document.querySelector("#staff-theme-toggle-icon");
  const notificationButton = document.querySelector("#staff-notification-button");
  const notificationCount = document.querySelector("#staff-notification-count");
  const navBadge = document.querySelector("#staff-nav-badge");
  const staffProfileForm = document.querySelector("#staff-profile-form");
  const staffProfileInputs = [...staffProfileForm.querySelectorAll("[data-staff-editable]")];
  const staffProfileMessage = document.querySelector("#staff-profile-message");
  const staffProfileStatus = document.querySelector("#staff-profile-status");
  const staffProfileEditButton = document.querySelector("#staff-profile-edit-button");
  const staffProfileEditLabel = document.querySelector("#staff-profile-edit-label");
  const staffProfileEditIcon = document.querySelector("#staff-profile-edit-icon");
  const staffSettingsTabs = [...document.querySelectorAll("[data-staff-settings-tab]")];
  const staffSettingsPanels = [...document.querySelectorAll("[data-staff-settings-panel]")];
  const staffSaveStatus = document.querySelector("#staff-save-status");
  const staffSaveMessage = document.querySelector("#staff-save-message");
  const staffPasswordForm = document.querySelector("#staff-change-password-form");
  const staffPasswordInputs = [...staffPasswordForm.querySelectorAll("input")];
  const staffPasswordToggles = [...staffPasswordForm.querySelectorAll("[data-staff-password-toggle]")];
  const staffPasswordStatus = document.querySelector("#staff-password-status");
  const staffNotificationForm = document.querySelector("#staff-notification-form");
  const staffNotificationInputs = [...staffNotificationForm.querySelectorAll("input[name]")];
  const staffSessionForm = document.querySelector("#staff-session-form");
  const staffSessionInput = staffSessionForm.elements.rememberSession;
  const announcementForm = document.querySelector("#staff-announcement-form");
  const announcementStatus = document.querySelector("#staff-announcement-status");
  const recordRows = document.querySelector("#staff-record-rows");
  const recordRequests = document.querySelector("#staff-record-requests");

  const pageTitles = Object.freeze({
    "staff-dashboard": "Staff Workspace",
    "staff-requests": "Request Management",
    "staff-appointments": "Appointment Management",
    "staff-records": "Student Records",
    "staff-announcements": "Announcements",
    "staff-profile": "My Profile",
    "staff-settings": "Settings",
  });
  const storageKeys = Object.freeze({
    announcements: "rtu.portal.staff.announcements",
  });
  const defaultPreferences = Object.freeze({
    requestAlerts: true,
    announcementAlerts: true,
    shiftReminders: true,
    rememberSession: true,
    darkMode: false,
  });
  const sampleStudents = Object.freeze([
    { accountNumber: "2023-103319", fullName: "Juan Dela Cruz", email: "2023-103319@rtu.edu.ph", phoneNumber: "0999199192", yearLevel: "3rd Year", program: "BSIT", semester: "1st Semester", status: "Enrolled", source: "Registrar reference record" },
    { accountNumber: "2022-104521", fullName: "Maria Santos", email: "2022-104521@rtu.edu.ph", phoneNumber: "09171234567", yearLevel: "4th Year", program: "BSBA", semester: "1st Semester", status: "Graduating", source: "Registrar reference record" },
    { accountNumber: "2024-100872", fullName: "Alex Reyes", email: "2024-100872@rtu.edu.ph", phoneNumber: "09281234567", yearLevel: "2nd Year", program: "BSCE", semester: "1st Semester", status: "Enrolled", source: "Registrar reference record" },
    { accountNumber: "2023-101455", fullName: "Nicole Ramos", email: "2023-101455@rtu.edu.ph", phoneNumber: "09391234567", yearLevel: "3rd Year", program: "BSED", semester: "1st Semester", status: "Enrolled", source: "Registrar reference record" },
    { accountNumber: "2021-109330", fullName: "Mark Villanueva", email: "2021-109330@rtu.edu.ph", phoneNumber: "09451234567", yearLevel: "4th Year", program: "BSA", semester: "1st Semester", status: "On Leave", source: "Registrar reference record" },
    { accountNumber: "2025-112004", fullName: "Angela Cruz", email: "2025-112004@rtu.edu.ph", phoneNumber: "09561234567", yearLevel: "1st Year", program: "BSIT", semester: "1st Semester", status: "Enrolled", source: "Registrar reference record" },
  ]);

  let activeAccount = null;
  let staffProfile = null;
  let preferences = { ...defaultPreferences };
  let announcements = [];
  let recordQuery = "";
  let recordProgram = "all";
  let selectedRecordNumber = "";
  let pendingRequestOpenId = "";
  let profileEditing = false;
  let profileSaveTimer;
  let noticeTimer;
  let desktopSidebarOpen = true;
  let mobileSidebarOpen = false;
  let passwordPending = false;

  function readStorage(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function profileKey(accountNumber) {
    return `rtu.portal.staffProfile.${encodeURIComponent(accountNumber)}`;
  }

  function preferencesKey(accountNumber) {
    return `rtu.portal.settings.${encodeURIComponent(accountNumber)}`;
  }

  function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.textContent = String(value);
  }

  function notify(message) {
    window.clearTimeout(noticeTimer);
    notice.textContent = message;
    notice.hidden = false;
    noticeTimer = window.setTimeout(() => { notice.hidden = true; }, 4200);
  }

  function formatDate(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" }).format(date);
  }

  function formatTime(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit" }).format(date);
  }

  function formatDateTime(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return `${formatDate(date)} · ${formatTime(date)}`;
  }

  function initials(name) {
    return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "ST";
  }

  function timestamp(daysAgo, hour, minute) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(hour, minute, 0, 0);
    return date.toISOString();
  }

  function schedule(daysFromNow, hour) {
    const start = new Date();
    start.setDate(start.getDate() + daysFromNow);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return `${formatDate(start)} · ${formatTime(start)} – ${formatTime(end)}`;
  }

  function demoAnnouncements() {
    return [
      { id: "ann-registrar-hours", title: "Registrar's Office hours this week", message: "The Office of the Registrar is open from 8:00 AM to 5:00 PM, Monday to Friday. Students with confirmed schedules are encouraged to arrive ten minutes before their appointment.", audience: "All", createdAt: timestamp(1, 9, 0), author: "Crissabelle Veloso" },
      { id: "ann-pickup-reminders", title: "Grade slip pick-up reminders", message: "Please bring your student ID and request reference when claiming your grade slip at the Registrar's Office. Unclaimed documents are kept for thirty days.", audience: "Students", createdAt: timestamp(3, 14, 30), author: "Crissabelle Veloso" },
    ];
  }

  function loadAnnouncements() {
    const saved = readStorage(storageKeys.announcements, null);
    if (Array.isArray(saved) && saved.every((item) => item && typeof item.id === "string" && typeof item.title === "string" && typeof item.message === "string" && typeof item.createdAt === "string")) {
      return saved;
    }
    const seeded = demoAnnouncements();
    writeStorage(storageKeys.announcements, seeded);
    return seeded;
  }

  function saveAnnouncements() {
    if (!writeStorage(storageKeys.announcements, announcements)) notify("Announcement changes apply for this visit. Browser storage is unavailable.");
  }

  function loadPreferences(account) {
    const saved = readStorage(preferencesKey(account.accountNumber), {});
    preferences = { ...defaultPreferences };
    Object.keys(defaultPreferences).forEach((key) => {
      if (typeof saved?.[key] === "boolean") preferences[key] = saved[key];
    });
    applyTheme();
    syncNotificationPreferences();
    syncNotificationUi();
  }

  function savePreferences() {
    if (!activeAccount) return;
    if (!writeStorage(preferencesKey(activeAccount.accountNumber), preferences)) {
      setStaffSettingsStatus("Preferences apply for this visit. Browser storage is unavailable.", true);
    }
  }

  function applyTheme() {
    const dark = Boolean(preferences.darkMode);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    themeToggle.setAttribute("aria-pressed", String(dark));
    const label = dark ? "Switch to light mode" : "Switch to dark mode";
    themeToggle.setAttribute("aria-label", label);
    themeToggle.title = label;
    themeIcon.setAttribute("href", dark ? "#icon-sun" : "#icon-moon");
  }

  function syncNotificationPreferences() {
    staffNotificationInputs.forEach((input) => {
      input.checked = Boolean(preferences[input.name]);
    });
    staffSessionInput.checked = Boolean(preferences.rememberSession);
  }

  function syncNotificationUi() {
    const summary = requestService.summary(requestService.listAll());
    const attention = summary.pending + summary.correction;
    navBadge.textContent = String(attention);
    navBadge.hidden = attention === 0;
    notificationCount.textContent = String(attention);
    notificationCount.hidden = !preferences.requestAlerts || attention === 0;
    notificationButton.setAttribute("aria-label", `Open Request Management, ${attention} request${attention === 1 ? "" : "s"} needing attention`);
  }

  function syncIdentity() {
    if (!activeAccount) return;
    const name = staffProfile?.fullName || activeAccount.fullName;
    const position = staffProfile?.position || activeAccount.position || "Staff";
    const department = staffProfile?.department || activeAccount.department || "Office of the Registrar";
    const firstName = name.trim().split(/\s+/)[0] || "Staff";
    document.querySelectorAll("[data-staff-name]").forEach((element) => { element.textContent = name; });
    document.querySelectorAll("[data-staff-first-name]").forEach((element) => { element.textContent = firstName; });
    document.querySelectorAll("[data-staff-position]").forEach((element) => { element.textContent = position; });
    document.querySelectorAll("[data-staff-department]").forEach((element) => { element.textContent = department; });
    document.querySelectorAll("[data-staff-employee-number]").forEach((element) => { element.textContent = activeAccount.accountNumber; });
    document.querySelectorAll("[data-staff-initials]").forEach((element) => { element.textContent = initials(name); });
    document.querySelectorAll("[data-staff-value]").forEach((element) => {
      const key = element.dataset.staffValue;
      const value = key === "employeeNumber" ? activeAccount.accountNumber : staffProfile?.[key] ?? activeAccount[key];
      element.textContent = value && String(value).trim() ? value : "Not provided";
    });
  }

  function loadStaffProfile(account) {
    window.clearTimeout(profileSaveTimer);
    profileSaveTimer = undefined;
    const defaults = {
      fullName: account.fullName,
      email: account.email,
      phoneNumber: account.phoneNumber || "",
      position: account.position || "Academic Services Staff",
      department: account.department || "Office of the Registrar",
      officeLocation: account.officeLocation || "",
      officeHours: account.officeHours || "",
    };
    const saved = readStorage(profileKey(account.accountNumber), null);
    staffProfile = { ...defaults };
    if (saved?.profile && typeof saved.profile === "object") {
      Object.keys(defaults).forEach((key) => {
        if (typeof saved.profile[key] === "string" && saved.profile[key].length <= 254) staffProfile[key] = saved.profile[key];
      });
    }
    syncStaffProfileForm();
    syncIdentity();
    setStaffProfileEditing(false);
    setStaffProfileStatus("Auto-save ready");
  }

  function syncStaffProfileForm() {
    if (!activeAccount) return;
    staffProfileInputs.forEach((input) => {
      input.value = staffProfile[input.name] || "";
      input.setCustomValidity("");
      input.removeAttribute("aria-invalid");
    });
    staffProfileForm.elements.employeeNumber.value = activeAccount.accountNumber;
  }

  function setStaffProfileStatus(message, error = false) {
    staffProfileMessage.textContent = message;
    staffProfileStatus.classList.toggle("is-error", error);
  }

  function validateStaffProfile() {
    let firstInvalid = null;
    staffProfileInputs.forEach((input) => {
      input.setCustomValidity("");
      if (input.required && !input.value.trim()) input.setCustomValidity("This field is required.");
      if (input.value.length > input.maxLength) input.setCustomValidity(`Use at most ${input.maxLength} characters.`);
      if (input.name === "phoneNumber" && input.value.trim() && (!/^[+\d() .-]+$/.test(input.value) || input.value.replace(/\D/g, "").length < 7)) {
        input.setCustomValidity("Please enter a valid phone number.");
      }
      const valid = input.checkValidity();
      input.setAttribute("aria-invalid", String(!valid));
      if (!valid && !firstInvalid) firstInvalid = input;
    });
    return firstInvalid;
  }

  function saveStaffProfile() {
    window.clearTimeout(profileSaveTimer);
    profileSaveTimer = undefined;
    if (!activeAccount) return false;
    const invalid = validateStaffProfile();
    if (invalid) {
      setStaffProfileStatus("Enter valid staff information to save your changes.", true);
      return false;
    }
    const values = Object.fromEntries(staffProfileInputs.map((input) => [input.name, input.value.trim()]));
    staffProfile = { ...staffProfile, ...values };
    activeAccount = { ...activeAccount, ...values };
    if (writeStorage(profileKey(activeAccount.accountNumber), { profile: staffProfile, updatedAt: Date.now() })) {
      setStaffProfileStatus("Auto-saved: Just now");
    } else {
      setStaffProfileStatus("Changes kept for this visit. Browser storage is unavailable.", true);
    }
    syncIdentity();
    return true;
  }

  function setStaffProfileEditing(editing) {
    profileEditing = editing;
    staffProfileInputs.forEach((input) => { input.readOnly = !editing; });
    staffProfileEditButton.setAttribute("aria-pressed", String(editing));
    const label = editing ? "Finish editing profile information" : "Edit profile information";
    staffProfileEditButton.setAttribute("aria-label", label);
    staffProfileEditButton.title = label;
    staffProfileEditLabel.textContent = editing ? "Done" : "Edit";
    staffProfileEditIcon.setAttribute("href", editing ? "#icon-check" : "#icon-pencil");
  }

  function finishStaffProfileEditing() {
    if (!saveStaffProfile()) {
      staffProfileInputs.find((input) => input.getAttribute("aria-invalid") === "true")?.focus();
      return;
    }
    setStaffProfileEditing(false);
    staffProfileEditButton.focus();
  }

  function createStatusBadge(status) {
    const badge = document.createElement("span");
    badge.className = `staff-status staff-status-${requestService.statusTone(status)}`;
    badge.textContent = status;
    return badge;
  }

  function createCell(text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    return cell;
  }

  function createStudentCell(request) {
    const cell = document.createElement("td");
    cell.className = "staff-student-cell";
    const name = document.createElement("strong");
    name.textContent = request.studentName;
    const number = document.createElement("small");
    number.textContent = request.studentNumber;
    cell.append(name, number);
    return cell;
  }

  function createViewButton(label, handler, accessibleLabel) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "staff-table-action";
    button.textContent = label;
    if (accessibleLabel) button.setAttribute("aria-label", accessibleLabel);
    button.addEventListener("click", handler);
    return button;
  }

  function renderRequestStats() {
    const summary = requestService.summary(requestService.listAll());
    setText("#staff-stat-pending", summary.pending);
    setText("#staff-stat-processing", summary.processing);
    setText("#staff-stat-ready", summary.ready);
    setText("#staff-stat-released", summary.released);
    syncNotificationUi();
  }

  function renderRecentRequests() {
    const body = document.querySelector("#staff-recent-requests");
    const recent = requestService.listAll().slice(0, 5);
    body.replaceChildren();
    recent.forEach((request) => {
      const row = document.createElement("tr");
      const reference = document.createElement("td");
      reference.className = "staff-ref";
      reference.textContent = request.id;
      const submitted = document.createElement("td");
      submitted.textContent = formatDate(request.submittedAt);
      const status = document.createElement("td");
      status.append(createStatusBadge(request.status));
      const action = document.createElement("td");
      action.className = "staff-table-action-cell";
      action.append(createViewButton("View", () => requestDetailsFromAnywhere(request.id), `View details for ${request.id}`));
      row.append(reference, createStudentCell(request), createCell(request.documentType), submitted, status, action);
      body.append(row);
    });
    document.querySelector("#staff-recent-empty").hidden = recent.length > 0;
  }

  function renderServiceVolume() {
    const container = document.querySelector("#staff-service-volume");
    const totals = new Map();
    requestService.listAll().forEach((request) => {
      totals.set(request.documentType, (totals.get(request.documentType) || 0) + 1);
    });
    const entries = [...totals.entries()].sort((first, second) => second[1] - first[1]).slice(0, 5);
    container.replaceChildren();
    if (!entries.length) {
      const empty = document.createElement("p");
      empty.className = "staff-empty";
      empty.textContent = "Service volume will appear once requests are available.";
      container.append(empty);
      return;
    }
    const maximum = Math.max(...entries.map(([, count]) => count));
    entries.forEach(([service, count]) => {
      const item = document.createElement("article");
      item.className = "staff-volume-item";
      const header = document.createElement("header");
      const name = document.createElement("strong");
      name.textContent = service;
      const total = document.createElement("span");
      total.textContent = `${count} request${count === 1 ? "" : "s"}`;
      const track = document.createElement("div");
      track.className = "staff-volume-track";
      const fill = document.createElement("span");
      fill.className = "staff-volume-fill";
      fill.style.width = `${Math.round((count / maximum) * 100)}%`;
      track.append(fill);
      header.append(name, total);
      item.append(header, track);
      container.append(item);
    });
  }

  function renderRequestViews() {
    renderRequestStats();
    renderRecentRequests();
    renderServiceVolume();
    if (selectedRecordNumber) renderRecordDetail(selectedRecordNumber);
  }

  function requestDetailsFromAnywhere(id) {
    if (!requestService.get(id)) return;
    if (staffScreen.dataset.currentPage === "staff-requests") {
      document.dispatchEvent(new CustomEvent("portal:staffrequestopen", { detail: id }));
      return;
    }
    pendingRequestOpenId = id;
    navigate("staff-requests");
  }

  function roster() {
    const students = sampleStudents.map((student) => ({ ...student }));
    let registered = [];
    try {
      registered = accounts.listStudents();
    } catch {
      registered = [];
    }
    registered.forEach((account) => {
      if (students.some((student) => student.accountNumber === account.accountNumber)) return;
      students.push({
        accountNumber: account.accountNumber,
        fullName: account.fullName,
        email: account.email,
        phoneNumber: account.phoneNumber || "Not provided",
        yearLevel: account.yearLevel || "Not provided",
        program: account.program || "Not provided",
        semester: account.semester || "Not provided",
        status: "Enrolled",
        source: "Registered portal account",
      });
    });
    return students;
  }

  function populateProgramFilter() {
    const select = document.querySelector("#staff-record-program");
    const programs = [...new Set(roster().map((student) => student.program).filter(Boolean))].sort();
    select.replaceChildren();
    const all = document.createElement("option");
    all.value = "all";
    all.textContent = "All programs";
    select.append(all);
    programs.forEach((program) => {
      const option = document.createElement("option");
      option.value = program;
      option.textContent = program;
      select.append(option);
    });
    select.value = programs.includes(recordProgram) ? recordProgram : "all";
    recordProgram = select.value;
  }

  function filteredStudents() {
    const query = recordQuery.trim().toLowerCase();
    return roster().filter((student) => {
      const matchesProgram = recordProgram === "all" || student.program === recordProgram;
      const text = [student.fullName, student.accountNumber, student.email, student.program].join(" ").toLowerCase();
      return matchesProgram && (!query || text.includes(query));
    });
  }

  function studentStatusClass(status) {
    return status.toLowerCase().replace(/\s+/g, "-");
  }

  function renderRecords() {
    const students = filteredStudents();
    recordRows.replaceChildren();
    students.forEach((student) => {
      const row = document.createElement("tr");
      const studentCell = document.createElement("td");
      studentCell.className = "staff-student-cell";
      const name = document.createElement("strong");
      name.textContent = student.fullName;
      const email = document.createElement("small");
      email.textContent = student.email;
      studentCell.append(name, email);
      const status = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = `staff-status staff-status-${studentStatusClass(student.status)}`;
      badge.textContent = student.status;
      status.append(badge);
      const action = document.createElement("td");
      action.className = "staff-table-action-cell";
      action.append(createViewButton("View record", () => openStudentRecord(student.accountNumber), `View record for ${student.fullName}`));
      row.append(studentCell, createCell(student.accountNumber), createCell(student.program), createCell(student.yearLevel), status, action);
      recordRows.append(row);
    });
    setText("#staff-record-count", students.length);
    document.querySelector("#staff-record-empty").hidden = students.length > 0;
  }

  function renderRecordDetail(accountNumber) {
    const student = roster().find((entry) => entry.accountNumber === accountNumber);
    const detail = document.querySelector("#staff-record-detail");
    if (!student) {
      detail.hidden = true;
      selectedRecordNumber = "";
      return;
    }
    selectedRecordNumber = accountNumber;
    setText("#staff-record-detail-number", `Student No. ${student.accountNumber}`);
    setText("#staff-record-detail-name", student.fullName);
    setText("#staff-record-detail-program", `${student.program} · ${student.yearLevel}`);
    setText("#staff-record-email", student.email);
    setText("#staff-record-phone", student.phoneNumber || "Not provided");
    setText("#staff-record-status", student.status);
    setText("#staff-record-year", student.yearLevel);
    setText("#staff-record-semester", student.semester);
    setText("#staff-record-source", student.source);
    const related = requestService.listForStudent(accountNumber);
    recordRequests.replaceChildren();
    related.forEach((request) => {
      const item = document.createElement("article");
      item.className = "staff-record-request";
      const copy = document.createElement("div");
      const reference = document.createElement("strong");
      reference.textContent = request.id;
      const description = document.createElement("span");
      description.textContent = `${request.documentType} · ${formatDateTime(request.submittedAt)}`;
      copy.append(reference, description);
      const actions = document.createElement("div");
      actions.className = "staff-record-request-actions";
      actions.append(createStatusBadge(request.status));
      actions.append(createViewButton("Open", () => requestDetailsFromAnywhere(request.id), `Open request ${request.id}`));
      item.append(copy, actions);
      recordRequests.append(item);
    });
    document.querySelector("#staff-record-requests-empty").hidden = related.length > 0;
    detail.hidden = false;
  }

  function openStudentRecord(accountNumber) {
    renderRecordDetail(accountNumber);
    const heading = document.querySelector("#staff-record-detail-name");
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
    document.querySelector("#staff-record-detail").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderAnnouncements() {
    const list = document.querySelector("#staff-announcement-list");
    const sorted = [...announcements].sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));
    list.replaceChildren();
    sorted.forEach((announcement) => {
      const article = document.createElement("article");
      article.className = "staff-announcement-card";
      const header = document.createElement("header");
      const audience = document.createElement("span");
      audience.className = "staff-audience-tag";
      audience.textContent = announcement.audience || "All";
      const title = document.createElement("h4");
      title.textContent = announcement.title;
      header.append(audience, title);
      const message = document.createElement("p");
      message.textContent = announcement.message;
      const footer = document.createElement("footer");
      const meta = document.createElement("span");
      meta.textContent = `${announcement.author || "Staff"} · ${formatDateTime(announcement.createdAt)}`;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "staff-text-button";
      remove.textContent = "Delete";
      remove.setAttribute("aria-label", `Delete announcement ${announcement.title}`);
      remove.addEventListener("click", () => {
        announcements = announcements.filter((entry) => entry.id !== announcement.id);
        saveAnnouncements();
        renderAnnouncements();
        notify("Announcement deleted.");
      });
      footer.append(meta, remove);
      article.append(header, message, footer);
      list.append(article);
    });
    setText("#staff-announcement-count", announcements.length);
    document.querySelector("#staff-announcement-empty").hidden = announcements.length > 0;
  }

  function setStaffSettingsStatus(message, error = false) {
    staffSaveMessage.textContent = message;
    staffSaveStatus.classList.toggle("is-error", error);
  }

  function syncStaffSettings() {
    syncIdentity();
    syncNotificationPreferences();
    staffSessionInput.checked = Boolean(preferences.rememberSession);
  }

  function selectStaffSettingsTab(name, focus = false) {
    if (!staffSettingsTabs.some((tab) => tab.dataset.staffSettingsTab === name)) return;
    staffSettingsTabs.forEach((tab) => {
      const active = tab.dataset.staffSettingsTab === name;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus();
    });
    window.PortalMotion.swap(staffSettingsPanels, staffSettingsPanels.find((panel) => panel.dataset.staffSettingsPanel === name));
    if (name !== "password") resetStaffPasswordForm();
    if (name === "account") syncStaffSettings();
    setStaffSettingsStatus(name === "password" ? "Your staff password changes are saved in this browser." : "Preferences save automatically in this browser.");
  }

  function resetStaffPasswordForm() {
    staffPasswordForm.reset();
    staffPasswordToggles.forEach((button) => setStaffPasswordVisibility(button, false));
    staffPasswordInputs.forEach((input) => {
      input.setCustomValidity("");
      input.removeAttribute("aria-invalid");
    });
    staffPasswordStatus.textContent = "";
    staffPasswordStatus.classList.remove("is-error");
  }

  function setStaffPasswordVisibility(button, visible) {
    document.getElementById(button.dataset.staffPasswordToggle).type = visible ? "text" : "password";
    button.setAttribute("aria-pressed", String(visible));
    const label = button.getAttribute("aria-label").replace(/^(Show|Hide) /, "");
    button.setAttribute("aria-label", `${visible ? "Hide" : "Show"} ${label}`);
  }

  function closeNavigation() {
    mobileSidebarOpen = false;
    syncNavigation();
  }

  function syncNavigation() {
    const mobile = mobileNavigation.matches;
    const open = mobile ? mobileSidebarOpen : desktopSidebarOpen;
    staffScreen.classList.toggle("sidebar-open", mobile && open);
    staffScreen.classList.toggle("sidebar-collapsed", !open);
    const label = open ? "Collapse navigation" : "Expand navigation";
    sidebarToggle.setAttribute("aria-expanded", String(open));
    sidebarToggle.setAttribute("aria-label", label);
    sidebarToggle.title = label;
    sidebarOverlay.hidden = !mobile || !open;
  }

  function closeAccountDropdown() {
    window.PortalMotion.swap([accountOptions], null);
    accountToggle.setAttribute("aria-expanded", "false");
  }

  function showPage(page, focus = true) {
    const view = staffMain.querySelector(`[data-view="${page}"]`);
    if (!view) return;
    staffScreen.dataset.currentPage = page;
    window.PortalMotion.swap(staffMain.querySelectorAll("[data-view]"), view);
    staffScreen.querySelectorAll(".staff-nav [data-page], .staff-account-options [data-page]").forEach((button) => {
      const active = button.dataset.page === page;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    closeNavigation();
    closeAccountDropdown();
    staffScreen.querySelectorAll(".portal-dialog[open]").forEach((dialog) => dialog.close());
    topbarTitle.textContent = pageTitles[page] || "Staff Workspace";
    document.title = `RTU Pasig Staff | ${view.querySelector("h2").textContent.trim()}`;
    if (page === "staff-dashboard") renderDashboard();
    if (page === "staff-records") renderRecords();
    if (page === "staff-announcements") renderAnnouncements();
    if (page === "staff-settings") syncStaffSettings();
    if (focus) view.querySelector("h2").focus();
    window.scrollTo(0, 0);
    document.dispatchEvent(new CustomEvent("portal:staffpagechange", { detail: page }));
  }

  function pageFromRoute() {
    return Object.keys(routes).find((page) => routes[page].hash === window.location.hash) || "staff-dashboard";
  }

  function renderRoute() {
    if (staffScreen.hidden) return;
    const page = pageFromRoute();
    if (window.location.hash !== routes[page].hash) window.history.replaceState(null, "", routes[page].hash);
    showPage(page);
  }

  function navigate(page, replace = false) {
    if (staffScreen.hidden || !Object.hasOwn(routes, page)) return;
    if (replace) {
      window.history.replaceState(null, "", routes[page].hash);
      renderRoute();
    } else if (window.location.hash === routes[page].hash) {
      renderRoute();
    } else {
      window.location.hash = routes[page].hash;
    }
  }

  window.PortalStaffContext = Object.freeze({
    current() {
      return activeAccount ? { account: { ...activeAccount }, profile: { ...staffProfile } } : null;
    },
    consumeRequestIntent() {
      const id = pendingRequestOpenId;
      pendingRequestOpenId = "";
      return id;
    },
    navigate(page) {
      navigate(page);
    },
  });

  document.addEventListener("portal:requestschanged", () => {
    if (activeAccount) renderRequestViews();
  });

  document.addEventListener("portal:appointmentschanged", () => {
    if (activeAccount) renderAppointmentSummary();
  });

  function renderAppointmentSummary() {
    const counts = appointmentService.summary();
    setText("#staff-dashboard-today-appointments", counts.today);
    const container = document.querySelector("#staff-dashboard-upcoming-appointments");
    const emptyState = document.querySelector("#staff-dashboard-appointments-empty");
    const upcoming = appointmentService.listAll().filter((appointment) => appointment.date >= appointmentService.manilaDate() && [appointmentService.STATUS.PENDING, appointmentService.STATUS.SCHEDULED, appointmentService.STATUS.CHECKED_IN].includes(appointment.status)).slice(0, 4);
    container.replaceChildren();
    upcoming.forEach((appointment) => {
      const item = document.createElement("article");
      item.className = "staff-record-request";
      const copy = document.createElement("div");
      const reference = document.createElement("strong");
      reference.textContent = appointment.id;
      const description = document.createElement("span");
      description.textContent = appointment.studentName + " � " + appointment.serviceType + " � " + appointment.date + " " + appointment.start;
      copy.append(reference, description);
      const actions = document.createElement("div");
      actions.className = "staff-record-request-actions";
      actions.append(createStatusBadge(appointment.status));
      item.append(copy, actions);
      container.append(item);
    });
    emptyState.hidden = upcoming.length > 0;
  }

  function renderDashboard() {
    setText("#staff-today", new Intl.DateTimeFormat("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date()));
    renderRequestStats();
    renderRecentRequests();
    renderServiceVolume();
    renderAppointmentSummary();
  }

  function openStaffDashboard(account) {
    activeAccount = account;
    loadStaffProfile(account);
    loadPreferences(account);
    syncStaffSettings();
    desktopSidebarOpen = true;
    mobileSidebarOpen = false;
    syncNavigation();
    closeAccountDropdown();
    loginScreen.hidden = true;
    staffScreen.hidden = false;
    selectStaffSettingsTab("account");
    renderDashboard();
    renderRecords();
    renderAnnouncements();
    navigate(pageFromRoute(), true);
    document.dispatchEvent(new CustomEvent("portal:staffaccountchange", { detail: { account: { ...account }, profile: { ...staffProfile } } }));
  }

  function logOutStaff() {
    document.dispatchEvent(new Event("portal:beforelogout"));
    if (profileSaveTimer !== undefined) saveStaffProfile();
    accounts.clearSession();
    activeAccount = null;
    staffProfile = null;
    setStaffProfileEditing(false);
    staffScreen.querySelectorAll(".portal-dialog[open]").forEach((dialog) => dialog.close());
    staffScreen.hidden = true;
    loginScreen.hidden = false;
    closeNavigation();
    closeAccountDropdown();
    preferences = { ...defaultPreferences };
    applyTheme();
    resetStaffPasswordForm();
    pendingRequestOpenId = "";
    selectedRecordNumber = "";
    document.querySelector("#staff-record-detail").hidden = true;
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    document.title = "RTU Pasig | Academic Services Portal";
    document.querySelector("#login-form").reset();
    document.querySelector("#login-status").textContent = "";
    document.querySelector("#account-number").focus();
    window.scrollTo(0, 0);
    document.dispatchEvent(new Event("portal:logout"));
    window.PortalMotion.enter(loginScreen.querySelector(".login-content"));
  }

  themeToggle.addEventListener("click", () => {
    if (!activeAccount) return;
    preferences.darkMode = !preferences.darkMode;
    savePreferences();
    applyTheme();
  });

  notificationButton.addEventListener("click", () => navigate("staff-requests"));

  sidebarToggle.addEventListener("click", () => {
    closeAccountDropdown();
    if (mobileNavigation.matches) mobileSidebarOpen = !mobileSidebarOpen;
    else desktopSidebarOpen = !desktopSidebarOpen;
    syncNavigation();
    document.dispatchEvent(new Event("portal:layoutchange"));
  });
  sidebarOverlay.addEventListener("click", () => {
    closeNavigation();
    sidebarToggle.focus();
  });
  mobileNavigation.addEventListener("change", closeNavigation);

  staffScreen.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", (event) => {
      if (button.matches("a") && (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0)) return;
      event.preventDefault();
      if (sidebar.contains(button)) {
        if (mobileNavigation.matches) mobileSidebarOpen = false;
        else desktopSidebarOpen = false;
        syncNavigation();
        document.dispatchEvent(new Event("portal:layoutchange"));
      }
      navigate(button.dataset.page);
    });
  });

  accountToggle.addEventListener("click", () => {
    const open = accountOptions.hidden;
    closeNavigation();
    window.PortalMotion.swap([accountOptions], open ? accountOptions : null);
    accountToggle.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", (event) => {
    if (!accountDropdown.contains(event.target)) closeAccountDropdown();
  });
  accountDropdown.addEventListener("focusout", (event) => {
    if (!accountDropdown.contains(event.relatedTarget)) closeAccountDropdown();
  });
  accountDropdown.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !accountOptions.hidden) {
      event.preventDefault();
      closeAccountDropdown();
      accountToggle.focus();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!accountOptions.hidden) {
      closeAccountDropdown();
      accountToggle.focus();
    } else if (staffScreen.classList.contains("sidebar-open")) {
      closeNavigation();
      sidebarToggle.focus();
    }
  });
  window.addEventListener("hashchange", renderRoute);

  document.querySelector("#staff-logout-button").addEventListener("click", logOutStaff);
  document.querySelector("#staff-settings-logout-button").addEventListener("click", logOutStaff);

  document.querySelectorAll("[data-staff-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog").close());
  });

  document.querySelector("#staff-record-search").addEventListener("input", (event) => {
    recordQuery = event.target.value;
    renderRecords();
  });
  document.querySelector("#staff-record-program").addEventListener("change", (event) => {
    recordProgram = event.target.value;
    renderRecords();
  });
  document.querySelector("#staff-record-close").addEventListener("click", () => {
    document.querySelector("#staff-record-detail").hidden = true;
    selectedRecordNumber = "";
  });

  announcementForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!announcementForm.checkValidity()) {
      announcementForm.reportValidity();
      return;
    }
    const title = announcementForm.elements.title.value.trim();
    const message = announcementForm.elements.message.value.trim();
    if (!title || !message) {
      announcementStatus.textContent = "Enter a title and message before publishing.";
      announcementStatus.classList.add("is-error");
      return;
    }
    announcements.unshift({
      id: `ann-${Date.now()}`,
      title,
      message,
      audience: announcementForm.elements.audience.value,
      createdAt: new Date().toISOString(),
      author: staffProfile?.fullName || "Staff",
    });
    saveAnnouncements();
    renderAnnouncements();
    announcementForm.reset();
    announcementStatus.classList.remove("is-error");
    announcementStatus.textContent = "Announcement published.";
    notify("Announcement published to the staff workspace.");
    announcementForm.elements.title.focus();
  });
  announcementForm.elements.title.addEventListener("input", () => {
    announcementStatus.textContent = "";
    announcementStatus.classList.remove("is-error");
  });

  staffProfileEditButton.addEventListener("click", () => {
    if (!activeAccount) return;
    if (profileEditing) {
      finishStaffProfileEditing();
    } else {
      setStaffProfileEditing(true);
      staffProfileInputs[0].focus();
    }
  });
  staffProfileInputs.forEach((input) => {
    input.addEventListener("input", () => {
      if (!profileEditing) return;
      input.setCustomValidity("");
      input.removeAttribute("aria-invalid");
      window.clearTimeout(profileSaveTimer);
      setStaffProfileStatus("Saving changes…");
      profileSaveTimer = window.setTimeout(saveStaffProfile, 500);
    });
    input.addEventListener("change", () => {
      if (profileEditing) saveStaffProfile();
    });
  });
  staffProfileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (profileEditing) finishStaffProfileEditing();
  });
  window.addEventListener("pagehide", () => {
    if (profileSaveTimer !== undefined) saveStaffProfile();
  });

  staffSettingsTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectStaffSettingsTab(tab.dataset.staffSettingsTab));
    tab.addEventListener("keydown", (event) => {
      let next;
      if (["ArrowDown", "ArrowRight"].includes(event.key)) next = (index + 1) % staffSettingsTabs.length;
      if (["ArrowUp", "ArrowLeft"].includes(event.key)) next = (index - 1 + staffSettingsTabs.length) % staffSettingsTabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = staffSettingsTabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      selectStaffSettingsTab(staffSettingsTabs[next].dataset.staffSettingsTab, true);
    });
  });

  staffPasswordToggles.forEach((button) => {
    button.addEventListener("click", () => setStaffPasswordVisibility(button, button.getAttribute("aria-pressed") !== "true"));
  });
  staffPasswordInputs.forEach((input) => {
    input.addEventListener("input", () => {
      input.setCustomValidity("");
      input.removeAttribute("aria-invalid");
      staffPasswordStatus.textContent = "";
    });
  });
  staffPasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!activeAccount || passwordPending) return;
    staffPasswordInputs.forEach((input) => {
      input.setCustomValidity("");
      input.removeAttribute("aria-invalid");
      if (!input.value.trim()) input.setCustomValidity("Enter your password.");
    });
    const { currentPassword, newPassword, confirmPassword } = staffPasswordForm.elements;
    if (newPassword.value.length < 8) newPassword.setCustomValidity("Use at least 8 characters for your new password.");
    if (newPassword.value !== confirmPassword.value) confirmPassword.setCustomValidity("The new passwords do not match.");
    const invalid = staffPasswordInputs.find((input) => !input.checkValidity());
    if (invalid) {
      invalid.setAttribute("aria-invalid", "true");
      staffPasswordStatus.textContent = invalid.validationMessage;
      staffPasswordStatus.classList.add("is-error");
      invalid.focus();
      return;
    }
    const employeeNumber = activeAccount.accountNumber;
    const submitButton = staffPasswordForm.querySelector('[type="submit"]');
    passwordPending = true;
    submitButton.disabled = true;
    staffPasswordStatus.classList.remove("is-error");
    staffPasswordStatus.textContent = "Updating password…";
    try {
      await accounts.changePassword(employeeNumber, currentPassword.value, newPassword.value, "staff");
      if (activeAccount?.accountNumber !== employeeNumber) return;
      resetStaffPasswordForm();
      staffPasswordStatus.textContent = "Password updated. Use your new password the next time you sign in.";
      setStaffSettingsStatus("Password saved: Just now");
    } catch (error) {
      if (activeAccount?.accountNumber !== employeeNumber) return;
      staffPasswordStatus.textContent = error.message;
      staffPasswordStatus.classList.add("is-error");
      if (error.message.includes("current password")) {
        currentPassword.setAttribute("aria-invalid", "true");
        currentPassword.focus();
      }
    } finally {
      passwordPending = false;
      submitButton.disabled = false;
    }
  });

  staffNotificationForm.addEventListener("submit", (event) => event.preventDefault());
  staffNotificationForm.addEventListener("change", () => {
    if (!activeAccount) return;
    staffNotificationInputs.forEach((input) => { preferences[input.name] = input.checked; });
    savePreferences();
    syncNotificationUi();
    setStaffSettingsStatus("Auto-saved: Just now");
  });

  staffSessionForm.addEventListener("submit", (event) => event.preventDefault());
  staffSessionInput.addEventListener("change", () => {
    if (!activeAccount) return;
    preferences.rememberSession = staffSessionInput.checked;
    savePreferences();
    if (preferences.rememberSession) accounts.saveSession(activeAccount);
    else accounts.clearSession();
    setStaffSettingsStatus(staffSessionInput.checked ? "This tab will keep your staff session on refresh." : "This tab will require sign-in after refresh.");
  });

  document.addEventListener("portal:login", (event) => {
    if (event.detail?.role !== "staff") return;
    accounts.saveSession(event.detail);
    openStaffDashboard(event.detail);
  });

  announcements = loadAnnouncements();
  populateProgramFilter();
  renderRequestViews();
  renderAnnouncements();
  syncNotificationUi();
  syncNavigation();
  applyTheme();

  const savedAccount = accounts.restoreSession();
  if (savedAccount?.role === "staff") openStaffDashboard(savedAccount);
};
