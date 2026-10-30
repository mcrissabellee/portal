"use strict";

window.initializePortalDashboard = () => {
  const loginScreen = document.querySelector("#login-screen");
  const dashboardScreen = document.querySelector("#dashboard-screen");
  const requestDialog = document.querySelector("#request-dialog");
  const assistantDialog = document.querySelector("#assistant-dialog");
  const sidebarToggle = document.querySelector("#sidebar-toggle");
  const sidebarOverlay = document.querySelector("#sidebar-overlay");
  const sidebar = document.querySelector("#dashboard-sidebar");
  const servicesGroup = document.querySelector("#services-nav-group");
  const servicesToggle = document.querySelector("#services-toggle");
  const servicesSubmenu = document.querySelector("#services-submenu");
  const servicePages = new Set(["services", "grade-slip", "registration-form", "id-printing"]);
  const accountDropdown = document.querySelector("#account-dropdown");
  const accountToggle = document.querySelector("#account-toggle");
  const accountOptions = document.querySelector("#account-options");
  const mobileNavigation = window.matchMedia("(max-width: 700px)");
  const profileForm = document.querySelector("#profile-form");
  const profileStatus = document.querySelector("#profile-save-status");
  const profileMessage = document.querySelector("#profile-save-message");
  const profileEditButton = document.querySelector("#profile-edit-button");
  const profileEditLabel = document.querySelector("#profile-edit-label");
  const profileEditIcon = document.querySelector("#profile-edit-icon");
  const accounts = window.PortalAccounts;
  const profileInputs = [...profileForm.querySelectorAll("[data-profile-editable]")];
  const requests = [];
  const routes = Object.fromEntries(Object.entries(window.PortalRoutes).map(([page, route]) => [page, route.hash]));
  const completionPages = new Set(Object.keys(routes).filter((page) => page.endsWith("-complete")));
  let selectedDocument = "";
  let profileSaveTimer;
  let profileUpdatedAt = null;
  let activeAccount = null;
  let profileStorageKey = "";
  let profileEditing = false;
  let desktopSidebarOpen = true;
  let mobileSidebarOpen = false;

  function setProfileStatus(message, error = false) {
    profileMessage.textContent = message;
    profileStatus.classList.toggle("is-error", error);
    if (activeAccount) document.dispatchEvent(new CustomEvent("portal:profilechange", { detail: profileSnapshot() }));
  }

  function profileSnapshot() {
    return {
      account: activeAccount ? { ...activeAccount } : null,
      values: { ...Object.fromEntries(profileInputs.map((input) => [input.name, input.value])), studentNumber: profileForm.elements.studentNumber.value },
      message: profileMessage.textContent,
      error: profileStatus.classList.contains("is-error"),
    };
  }

  function validateProfile() {
    let firstInvalid = null;
    profileInputs.forEach((input) => {
      const wasReadOnly = input.readOnly;
      input.readOnly = false;
      input.setCustomValidity("");
      if (input.required && !input.value.trim()) input.setCustomValidity("This field is required.");
      if (input.value.length > input.maxLength) input.setCustomValidity(`Use at most ${input.maxLength} characters.`);
      if (input.name === "phoneNumber" && input.value.trim() && (!/^[+\d() .-]+$/.test(input.value) || input.value.replace(/\D/g, "").length < 7)) {
        input.setCustomValidity("Please enter a valid phone number.");
      }
      const valid = input.checkValidity();
      input.readOnly = wasReadOnly;
      input.setAttribute("aria-invalid", String(!valid));
      if (!valid && !firstInvalid) firstInvalid = input;
    });
    return firstInvalid;
  }

  function syncProfileDetails() {
    const fullName = profileForm.elements.fullName.value.trim();
    document.querySelectorAll("[data-profile-name]").forEach((element) => {
      element.textContent = fullName;
    });
    document.querySelector("[data-profile-first-name]").textContent = fullName.split(/\s+/)[0];
    const program = profileForm.elements.program.value.trim();
    document.querySelector(".profile-role").textContent = program ? `${program} Student` : "Student";
  }

  function showProfileSavedTime() {
    if (!profileUpdatedAt) return;
    const recent = Date.now() - profileUpdatedAt < 60000;
    const savedTime = new Date(profileUpdatedAt).toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });
    setProfileStatus(`Auto-saved: ${recent ? "Just now" : savedTime}`);
  }

  function saveProfile() {
    window.clearTimeout(profileSaveTimer);
    profileSaveTimer = undefined;
    if (!activeAccount) return false;
    const invalid = validateProfile();
    if (invalid) {
      const label = profileForm.querySelector(`label[for="${invalid.id}"]`).textContent;
      setProfileStatus(`Enter a valid ${label.toLowerCase()} to save your changes.`, true);
      return false;
    }
    const profile = Object.fromEntries(profileInputs.map((input) => [input.name, input.value.trim()]));
    syncProfileDetails();
    const updatedAt = Date.now();
    try {
      window.localStorage.setItem(profileStorageKey, JSON.stringify({ profile, updatedAt }));
      profileUpdatedAt = updatedAt;
      showProfileSavedTime();
    } catch {
      profileUpdatedAt = null;
      setProfileStatus("Changes kept for this visit. Browser storage is unavailable.");
    }
    return true;
  }

  function restoreProfile() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(profileStorageKey));
      if (!saved || !Number.isFinite(saved.updatedAt) || saved.updatedAt <= 0) return;
      if (!profileInputs.every((input) => {
        const value = saved.profile?.[input.name];
        return value === undefined ? !input.required : typeof value === "string" && value.length <= input.maxLength;
      })) return;
      const defaults = profileInputs.map((input) => input.value);
      profileInputs.forEach((input) => {
        if (typeof saved.profile[input.name] === "string") input.value = saved.profile[input.name];
      });
      if (validateProfile()) {
        profileInputs.forEach((input, index) => {
          input.value = defaults[index];
          input.setCustomValidity("");
          input.removeAttribute("aria-invalid");
        });
        return;
      }
      profileUpdatedAt = saved.updatedAt;
      syncProfileDetails();
      showProfileSavedTime();
    } catch {
      // Keep this account's registration details when saved profile data is unavailable.
    }
  }

  function setProfileEditing(editing) {
    profileEditing = editing;
    profileInputs.forEach((input) => { input.readOnly = !editing; });
    profileEditButton.setAttribute("aria-pressed", String(editing));
    const label = editing ? "Finish editing profile information" : "Edit profile information";
    profileEditButton.setAttribute("aria-label", label);
    profileEditButton.title = label;
    profileEditLabel.textContent = editing ? "Done" : "Edit";
    profileEditIcon.setAttribute("href", editing ? "#icon-check" : "#icon-pencil");
  }

  function finishProfileEditing() {
    if (!saveProfile()) {
      profileInputs.find((input) => input.getAttribute("aria-invalid") === "true")?.focus();
      return;
    }
    setProfileEditing(false);
    profileEditButton.focus();
  }

  profileEditButton.addEventListener("click", () => {
    if (!activeAccount) return;
    if (profileEditing) {
      finishProfileEditing();
    } else {
      setProfileEditing(true);
      profileInputs[0].focus();
    }
  });

  function loadProfile(account) {
    window.clearTimeout(profileSaveTimer);
    profileSaveTimer = undefined;
    profileUpdatedAt = null;
    activeAccount = account;
    profileStorageKey = `rtu.portal.profile.${encodeURIComponent(account.accountNumber)}`;
    profileForm.reset();
    profileInputs.forEach((input) => {
      input.value = account[input.name] || "";
      input.setCustomValidity("");
      input.removeAttribute("aria-invalid");
    });
    profileForm.elements.studentNumber.value = account.accountNumber;
    document.querySelectorAll("[data-profile-student-number]").forEach((element) => {
      element.textContent = account.accountNumber;
    });
    setProfileStatus("Auto-save ready");
    restoreProfile();
    syncProfileDetails();
    setProfileEditing(false);
  }

  profileInputs.forEach((input) => {
    input.addEventListener("input", () => {
      if (!profileEditing) return;
      input.setCustomValidity("");
      input.removeAttribute("aria-invalid");
      window.clearTimeout(profileSaveTimer);
      setProfileStatus("Saving changes…");
      profileSaveTimer = window.setTimeout(saveProfile, 500);
    });
    input.addEventListener("change", saveProfile);
  });
  profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (profileEditing) finishProfileEditing();
  });
  window.addEventListener("pagehide", () => {
    if (profileSaveTimer !== undefined) saveProfile();
  });

  function syncNavigation() {
    const available = !completionPages.has(dashboardScreen.dataset.currentPage);
    const mobile = mobileNavigation.matches;
    const open = available && (mobile ? mobileSidebarOpen : desktopSidebarOpen);
    dashboardScreen.classList.toggle("sidebar-open", mobile && open);
    dashboardScreen.classList.toggle("sidebar-collapsed", !open);
    const label = open ? "Collapse navigation" : "Expand navigation";
    sidebarToggle.setAttribute("aria-expanded", String(open));
    sidebarToggle.setAttribute("aria-label", label);
    sidebarToggle.title = label;
    sidebarOverlay.hidden = !mobile || !open;
    if (!open && servicesSubmenu.contains(document.activeElement)) sidebarToggle.focus();
    sidebar.inert = !available;
    if (!open) setServicesExpanded(false);
  }

  function closeNavigation() {
    mobileSidebarOpen = false;
    syncNavigation();
  }

  mobileNavigation.addEventListener("change", closeNavigation);
  closeNavigation();

  function setServicesExpanded(open) {
    servicesToggle.setAttribute("aria-expanded", String(open));
    servicesSubmenu.hidden = !open;
  }

  servicesToggle.addEventListener("click", () => {
    if (dashboardScreen.classList.contains("sidebar-collapsed")) {
      if (mobileNavigation.matches) mobileSidebarOpen = true;
      else desktopSidebarOpen = true;
      syncNavigation();
      setServicesExpanded(true);
      document.dispatchEvent(new Event("portal:layoutchange"));
      return;
    }
    setServicesExpanded(servicesSubmenu.hidden);
  });
  servicesGroup.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !servicesSubmenu.hidden) {
      event.preventDefault();
      event.stopPropagation();
      setServicesExpanded(false);
      servicesToggle.focus();
    }
  });

  function closeAccountDropdown() {
    accountOptions.hidden = true;
    accountToggle.setAttribute("aria-expanded", "false");
  }

  accountToggle.addEventListener("click", () => {
    const open = accountOptions.hidden;
    closeNavigation();
    accountOptions.hidden = !open;
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

  function showPage(page, focus = true) {
    const view = document.querySelector(`[data-view="${page}"]`);
    if (!view) return;
    dashboardScreen.dataset.currentPage = page;
    if (["profile", "settings"].includes(page) && profileSaveTimer === undefined && !profileStatus.classList.contains("is-error")) showProfileSavedTime();
    document.querySelectorAll("[data-view]").forEach((section) => {
      section.hidden = section !== view;
    });
    document.querySelectorAll(".dashboard-nav [data-page], .account-options [data-page]").forEach((button) => {
      const active = button.dataset.page === page;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    const inServices = servicePages.has(page);
    servicesToggle.classList.toggle("is-active", inServices);
    setServicesExpanded(inServices);
    closeNavigation();
    closeAccountDropdown();
    document.querySelectorAll(".portal-dialog[open]").forEach((dialog) => dialog.close());
    document.title = `RTU Pasig | ${view.querySelector("h2").textContent.trim()}`;
    if (focus) view.querySelector("h2").focus();
    window.scrollTo(0, 0);
    document.dispatchEvent(new CustomEvent("portal:pagechange", { detail: page }));
  }

  function pageFromRoute() {
    return Object.keys(routes).find((page) => routes[page] === window.location.hash) || "dashboard";
  }

  function renderRoute() {
    if (dashboardScreen.hidden) return;
    const page = pageFromRoute();
    if (window.location.hash !== routes[page]) window.history.replaceState(null, "", routes[page]);
    showPage(page);
  }

  function navigate(page, replace = false) {
    if (dashboardScreen.hidden || !Object.hasOwn(routes, page)) return;
    if (replace) {
      window.history.replaceState(null, "", routes[page]);
      renderRoute();
    } else if (window.location.hash === routes[page]) {
      renderRoute();
    } else {
      window.location.hash = routes[page];
    }
  }

  window.addEventListener("hashchange", renderRoute);

  function openDashboard(account) {
    loadProfile(account);
    loginScreen.hidden = true;
    dashboardScreen.hidden = false;
    if (!profileUpdatedAt) saveProfile();
    navigate(pageFromRoute(), true);
    document.dispatchEvent(new CustomEvent("portal:accountchange", { detail: profileSnapshot() }));
  }

  document.addEventListener("portal:login", (event) => {
    if (!event.detail) return;
    accounts.saveSession(event.detail);
    openDashboard(event.detail);
  });

  document.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", (event) => {
      if (button.matches("a") && (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0)) return;
      event.preventDefault();
      navigate(button.dataset.page);
    });
  });

  sidebarToggle.addEventListener("click", () => {
    if (completionPages.has(dashboardScreen.dataset.currentPage)) return;
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
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dashboardScreen.classList.contains("sidebar-open")) {
      closeNavigation();
      sidebarToggle.focus();
    }
  });

  document.querySelector("#logout-button").addEventListener("click", () => {
    document.dispatchEvent(new Event("portal:beforelogout"));
    if (profileSaveTimer !== undefined) saveProfile();
    accounts.clearSession();
    activeAccount = null;
    setProfileEditing(false);
    dashboardScreen.hidden = true;
    setServicesExpanded(false);
    loginScreen.hidden = false;
    requests.length = 0;
    renderRequests();
    document.querySelector("#login-form").reset();
    document.querySelector("#login-status").textContent = "";
    document.querySelector("#assistant-question").value = "";
    desktopSidebarOpen = true;
    closeNavigation();
    closeAccountDropdown();
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    document.title = "RTU Pasig | Academic Services Portal";
    document.querySelector("#account-number").focus();
    window.scrollTo(0, 0);
    document.dispatchEvent(new Event("portal:logout"));
  });

  document.querySelectorAll("[data-request]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedDocument = button.dataset.request;
      document.querySelector("#request-dialog-title").textContent = `Request ${selectedDocument}`;
      document.querySelector("#document-request-form").reset();
      requestDialog.showModal();
    });
  });

  function renderRequests() {
    const list = document.querySelector("#request-list");
    list.replaceChildren();
    if (!requests.length) {
      const heading = document.createElement("h3");
      heading.textContent = "No requests yet";
      const description = document.createElement("p");
      description.textContent = "Your document requests will appear here.";
      list.append(heading, description);
      return;
    }
    requests.forEach((request) => {
      const entry = document.createElement("article");
      entry.className = "request-entry";
      const details = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = request.document;
      const description = document.createElement("p");
      description.textContent = `${request.id} · ${request.purpose}`;
      const badge = document.createElement("span");
      badge.className = "request-badge";
      badge.textContent = "Demo draft · Not submitted";
      details.append(title, description);
      if (request.details) {
        const extra = document.createElement("details");
        extra.className = "request-details";
        const summary = document.createElement("summary");
        summary.textContent = "View request details";
        const fields = document.createElement("dl");
        const labels = { studentNumber: "Student Number", fullName: "Full Name", program: "Program", yearLevel: "Year Level", semester: "Semester", academicYear: "Academic Year", requestedSemester: "Requested Semester", appointmentDate: "Appointment Date", appointmentTimeRange: "Appointment Time", copies: "Copies", notes: "Additional Notes" };
        Object.entries(labels).forEach(([key, label]) => {
          if (!request.details[key]) return;
          const field = document.createElement("div");
          const term = document.createElement("dt");
          term.textContent = label;
          const value = document.createElement("dd");
          value.textContent = String(key === "appointmentDate" && request.details.appointmentDateLabel ? request.details.appointmentDateLabel : request.details[key]);
          field.append(term, value);
          fields.append(field);
        });
        extra.append(summary, fields);
        details.append(extra);
      }
      entry.append(details, badge);
      list.append(entry);
    });
  }

  function createRequest({ document: documentName, purpose, details } = {}, { nextPage = "requests", notify = true } = {}) {
    if (!activeAccount || typeof documentName !== "string" || !documentName.trim() || typeof purpose !== "string" || !purpose.trim()) return null;
    const request = {
      id: `DEMO-${String(requests.length + 1).padStart(3, "0")}`,
      document: documentName.trim(),
      purpose: purpose.trim(),
      ...(details && typeof details === "object" ? { details: { ...details } } : {}),
    };
    requests.unshift(request);
    renderRequests();
    navigate(Object.hasOwn(routes, nextPage) ? nextPage : "requests");
    if (notify) document.dispatchEvent(new CustomEvent("portal:requestcreated", { detail: request.document }));
    return request;
  }

  document.querySelector("#document-request-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const request = createRequest({ document: selectedDocument, purpose: document.querySelector("#request-purpose").value });
    if (request) requestDialog.close();
  });

  function assistantAnswer(question) {
    const normalized = question.trim().toLowerCase();
    let answer;
    if (/status|track|my request/.test(normalized)) {
      answer = requests.length
        ? `You have ${requests.length} demo request${requests.length === 1 ? "" : "s"} in My Request. These are local drafts and have not been submitted to the registrar. Open My Request to review them.`
        : "You have no requests in this session yet. Open Services to create a document request preview, then check My Request. Official processing status will be available when the portal is connected to the registrar.";
    } else if (/gradeslip|grade slip|grades/.test(normalized)) {
      answer = "Open Services and choose Grade Slip. Complete Personal Information and Grade Slip Details, then review and submit your demo request. It will appear in My Request. Contact the registrar to confirm official requirements, fees, and release schedules.";
    } else if (/id printing|student id/.test(normalized)) {
      answer = "Open Services and choose ID Printing. Complete Personal Information, then choose an academic year, semester, date, and time in Printing Schedule. Review your information, choose Confirm Schedule, and select YES to save your demo request. The Schedule Complete screen shows your selected date and time, and the request appears in My Request.";
    } else if (/regiform|registration|enroll/.test(normalized)) {
      answer = "Open Services and select Registration Form. Check Personal Information, then select your academic year, semester, appointment date, and start time in Enrollment Details. The end time is calculated one hour later. Use Additional request details to change the purpose or copies, then Review & Submit to check your information. Choose Confirm Schedule and YES to create a demo request and open Schedule Complete with your selected date and time. Your draft saves automatically, and the confirmed request appears in My Request. For an official form, confirm your enrollment status and current requirements with the RTU Pasig registrar.";
    } else if (/transcript|\btor\b|\bcoe\b|certificate|record/.test(normalized)) {
      answer = "Open Academic Records to request a Transcript of Records (TOR), Certificate of Enrollment (COE), or gradeslip. Requirements, fees, and processing times depend on the document, so confirm the current details with the registrar.";
    } else {
      answer = "I can guide you through registration form requests, gradeslips, academic records, and checking your demo requests. Try asking “How can I request a regiform?” or open Services to choose a document.";
    }
    return answer;
  }

  function askAssistant(question) {
    const query = question.trim();
    if (!query) return;
    document.querySelector("#assistant-question-text").textContent = query;
    document.querySelector("#assistant-answer").textContent = assistantAnswer(query);
    assistantDialog.showModal();
  }

  document.querySelector("#assistant-search").addEventListener("submit", (event) => {
    event.preventDefault();
    askAssistant(document.querySelector("#assistant-question").value);
  });
  document.querySelectorAll("[data-assistant]").forEach((button) => {
    button.addEventListener("click", () => askAssistant(button.dataset.assistant));
  });
  document.querySelector("#assistant-services").addEventListener("click", () => {
    assistantDialog.close();
    navigate("services");
  });

  window.PortalProfile = Object.freeze({
    snapshot: profileSnapshot,
    update(values) {
      if (!activeAccount) return { valid: false, message: "Sign in to edit your account." };
      const previousMessage = profileMessage.textContent;
      const previousError = profileStatus.classList.contains("is-error");
      const previous = profileInputs.map((input) => input.value);
      profileInputs.forEach((input) => {
        if (typeof values[input.name] === "string") input.value = values[input.name];
      });
      if (saveProfile()) return { valid: true, ...profileSnapshot() };
      const invalidField = profileInputs.find((input) => input.getAttribute("aria-invalid") === "true")?.name;
      const message = profileMessage.textContent;
      profileInputs.forEach((input, index) => { input.value = previous[index]; });
      validateProfile();
      setProfileStatus(previousMessage, previousError);
      return { valid: false, invalidField, message };
    },
  });

  window.PortalRequests = Object.freeze({ create: createRequest });
  window.PortalAssistant = Object.freeze({ answer: assistantAnswer });

  const savedAccount = accounts.restoreSession();
  if (savedAccount) openDashboard(savedAccount);
};
