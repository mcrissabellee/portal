"use strict";

window.initializePortalLogin = () => {
  const roleButtons = [...document.querySelectorAll("[data-role]")];
  const loginForm = document.querySelector("#login-form");
  const accountInput = document.querySelector("#account-number");
  const passwordInput = document.querySelector("#password");
  const passwordToggle = document.querySelector("#password-toggle");
  const loginStatus = document.querySelector("#login-status");
  const accounts = window.PortalAccounts;
  let activeRole = "student";
  let loginPending = false;
  let registrationPending = false;

  const roles = {
    student: {
      title: "Student Login",
      accountLabel: "Student Number",
      description: "Sign in to access your academic services,<br class=\"desktop-break\"> records, and more.",
      registerTitle: "Create a student account",
    },
    staff: {
      title: "Staff Login",
      accountLabel: "Employee Number",
      description: "Sign in to manage academic services,<br class=\"desktop-break\"> records, and requests.",
      registerTitle: "Create a staff account",
    },
  };

  function setFieldError(input, message) {
    const error = document.getElementById(input.getAttribute("aria-describedby"));
    input.setAttribute("aria-invalid", String(Boolean(message)));
    error.textContent = message;
  }

  function hidePassword() {
    passwordInput.type = "password";
    passwordToggle.setAttribute("aria-pressed", "false");
    passwordToggle.setAttribute("aria-label", "Show password");
  }

  function setRole(role) {
    if (role === activeRole) return;
    activeRole = role;
    const details = roles[role];

    roleButtons.forEach((button) => {
      const selected = button.dataset.role === role;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });

    document.querySelector("#login-title").textContent = details.title;
    document.querySelector("#login-description").innerHTML = details.description;
    document.querySelector("#account-label").textContent = details.accountLabel;
    accountInput.placeholder = details.accountLabel;
    document.querySelector("#register-title").textContent = details.registerTitle;
    document.querySelector("#register-number-label").textContent = details.accountLabel;

    loginForm.reset();
    hidePassword();
    setFieldError(accountInput, "");
    setFieldError(passwordInput, "");
    loginStatus.textContent = "";
  }

  roleButtons.forEach((button) => {
    button.addEventListener("click", () => setRole(button.dataset.role));
  });

  passwordToggle.addEventListener("click", () => {
    const visible = passwordInput.type === "password";
    passwordInput.type = visible ? "text" : "password";
    passwordToggle.setAttribute("aria-pressed", String(visible));
    passwordToggle.setAttribute("aria-label", visible ? "Hide password" : "Show password");
  });

  [accountInput, passwordInput].forEach((input) => {
    input.addEventListener("input", () => {
      setFieldError(input, "");
      loginStatus.textContent = "";
    });
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (loginPending) return;
    loginStatus.textContent = "";

    const accountError = accountInput.value.trim()
      ? ""
      : `Please enter your ${roles[activeRole].accountLabel.toLowerCase()}.`;
    const passwordError = passwordInput.value ? "" : "Please enter your password.";
    setFieldError(accountInput, accountError);
    setFieldError(passwordInput, passwordError);

    if (accountError || passwordError) {
      (accountError ? accountInput : passwordInput).focus();
      return;
    }

    hidePassword();
    if (activeRole !== "student") {
      loginStatus.textContent = "Staff sign-in is not available yet. Please use your student account.";
      return;
    }

    const submitButton = loginForm.querySelector('[type="submit"]');
    loginPending = true;
    submitButton.disabled = true;
    loginStatus.textContent = "Signing in…";
    try {
      const account = await accounts.authenticate(accountInput.value, passwordInput.value);
      passwordInput.value = "";
      if (!account) {
        loginStatus.textContent = "Incorrect student number or password. Please try again.";
        passwordInput.focus();
        return;
      }
      loginStatus.textContent = "";
      document.dispatchEvent(new CustomEvent("portal:login", { detail: account }));
    } catch (error) {
      passwordInput.value = "";
      loginStatus.textContent = error.message;
    } finally {
      loginPending = false;
      submitButton.disabled = false;
    }
  });

  document.querySelectorAll("[data-open-dialog]").forEach((button) => {
    button.addEventListener("click", () => {
      const dialog = document.getElementById(button.dataset.openDialog);
      dialog.querySelector("form").reset();
      dialog.querySelectorAll("[aria-invalid]").forEach((input) => input.removeAttribute("aria-invalid"));
      const status = dialog.querySelector(".dialog-status");
      if (!status) return;
      status.textContent = "";
      status.classList.remove("is-success");
      dialog.showModal();
      dialog.querySelector("input").focus();
    });
  });

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog").close());
  });

  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      const outside = event.clientX < bounds.left || event.clientX > bounds.right
        || event.clientY < bounds.top || event.clientY > bounds.bottom;
      if (outside) dialog.close();
    });

    dialog.addEventListener("input", (event) => {
      if (event.target.matches("input")) event.target.removeAttribute("aria-invalid");
      const status = dialog.querySelector(".dialog-status");
      if (!status) return;
      status.textContent = "";
      status.classList.remove("is-success");
    });
  });

  function validateDialog(form, status) {
    let firstInvalid = null;

    form.querySelectorAll("input").forEach((input) => {
      const blank = !input.value.trim();
      const valid = !blank && input.checkValidity();
      input.setAttribute("aria-invalid", String(!valid));
      if (!valid && !firstInvalid) firstInvalid = input;
    });

    if (!firstInvalid) return true;

    const label = form.querySelector(`label[for="${firstInvalid.id}"]`).textContent;
    status.classList.remove("is-success");
    if (!firstInvalid.value.trim()) {
      status.textContent = `Please enter your ${label.toLowerCase()}.`;
    } else if (firstInvalid.validity.typeMismatch) {
      status.textContent = "Please enter a valid email address.";
    } else if (firstInvalid.validity.tooShort) {
      status.textContent = "Please use a password with at least 8 characters.";
    } else {
      status.textContent = firstInvalid.validationMessage;
    }
    firstInvalid.focus();
    return false;
  }

  const recoveryForm = document.querySelector("#recovery-form");
  recoveryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = document.querySelector("#recovery-status");
    if (!validateDialog(recoveryForm, status)) return;
    status.classList.add("is-success");
    status.textContent = "Reset request preview complete. A connected email service would send your recovery link. No email was sent in this demo.";
  });

  const registerForm = document.querySelector("#register-form");
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (registrationPending) return;
    const status = document.querySelector("#register-status");
    if (!validateDialog(registerForm, status)) return;
    if (activeRole !== "student") {
      status.textContent = "Staff registration is not available yet. Choose Student to create a demo account.";
      return;
    }
    const submitButton = registerForm.querySelector('[type="submit"]');
    registrationPending = true;
    submitButton.disabled = true;
    status.classList.remove("is-success");
    status.textContent = "Creating your account…";
    try {
      const account = await accounts.register({
        fullName: registerForm.elements.name.value,
        accountNumber: registerForm.elements.accountNumber.value,
        email: registerForm.elements.email.value,
        password: registerForm.elements.newPassword.value,
      });
      registerForm.reset();
      document.querySelector("#register-dialog").close();
      setRole("student");
      loginForm.reset();
      hidePassword();
      setFieldError(accountInput, "");
      setFieldError(passwordInput, "");
      accountInput.value = account.accountNumber;
      loginStatus.textContent = "Account created! Sign in with your student number and password.";
      passwordInput.focus();
    } catch (error) {
      status.textContent = error.message;
    } finally {
      registrationPending = false;
      submitButton.disabled = false;
    }
  });
};
