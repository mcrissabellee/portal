"use strict";

(() => {
  const accountsKey = "rtu.portal.accounts";
  const staffCredentialsKey = "rtu.portal.staffCredentials";
  const sessionKey = "rtu.portal.session";
  const demoAccount = {
    role: "student",
    accountNumber: "2023-103319",
    fullName: "Juan Dela Cruz",
    email: "2023-103319@rtu.edu.ph",
    phoneNumber: "0999199192",
    yearLevel: "3rd Year",
    program: "BSIT",
    semester: "1st Semester",
    address: "",
  };
  const staffAccounts = Object.freeze([
    Object.freeze({
      role: "staff",
      accountNumber: "2020-123456",
      fullName: "Crissabelle Veloso",
      email: "cheezyyummy@gmail.com",
      phoneNumber: "",
      position: "Academic Services Staff",
      department: "Office of the Registrar",
      officeLocation: "RTU Pasig Campus - Registrar's Office",
      officeHours: "Monday to Friday, 8:00 AM - 5:00 PM",
      passwordSalt: "fd10c6b26633ca40c5204cf81764e1b4",
      passwordHash: "e9af2bf280b00496306552133520635f09b8982e1c9076fb073037cf492237bc",
    }),
  ]);

  function readAccounts() {
    let accounts;
    try {
      accounts = JSON.parse(window.localStorage.getItem(accountsKey) || "[]");
    } catch {
      throw new Error("Saved demo accounts could not be read. Check that browser storage is available.");
    }
    if (!Array.isArray(accounts) || !accounts.every((account) => (
      account?.role === "student"
      && [account.accountNumber, account.fullName, account.email].every((value) => typeof value === "string" && value.trim())
      && /^[a-f\d]{32}$/.test(account.passwordSalt)
      && /^[a-f\d]{64}$/.test(account.passwordHash)
    ))) {
      throw new Error("Saved demo account data is invalid and could not be loaded.");
    }
    return accounts;
  }

  function readStaffCredentials() {
    let credentials;
    try {
      credentials = JSON.parse(window.localStorage.getItem(staffCredentialsKey) || "{}");
    } catch {
      return {};
    }
    return credentials && typeof credentials === "object" && !Array.isArray(credentials) ? credentials : {};
  }

  function staffRecords() {
    const credentials = readStaffCredentials();
    return staffAccounts.map((account) => {
      const replacement = credentials[account.accountNumber];
      if (replacement && /^[a-f\d]{32}$/.test(replacement.passwordSalt) && /^[a-f\d]{64}$/.test(replacement.passwordHash)) {
        return { ...account, passwordSalt: replacement.passwordSalt, passwordHash: replacement.passwordHash };
      }
      return { ...account };
    });
  }

  function publicAccount(account) {
    return {
      role: "student",
      accountNumber: account.accountNumber,
      fullName: account.fullName,
      email: account.email,
      phoneNumber: "",
      yearLevel: "",
      program: "",
      semester: "",
      address: "",
    };
  }

  function publicStaffAccount(account) {
    return {
      role: "staff",
      accountNumber: account.accountNumber,
      fullName: account.fullName,
      email: account.email,
      phoneNumber: account.phoneNumber || "",
      position: account.position || "",
      department: account.department || "",
      officeLocation: account.officeLocation || "",
      officeHours: account.officeHours || "",
    };
  }

  function findAccount(accountNumber, role = "student") {
    if (role === "staff") {
      const account = staffRecords().find((entry) => entry.accountNumber === accountNumber);
      return account ? publicStaffAccount(account) : null;
    }
    const account = readAccounts().find((entry) => entry.accountNumber === accountNumber);
    if (account && accountNumber === demoAccount.accountNumber) return { ...demoAccount };
    return account ? publicAccount(account) : null;
  }

  function listStudents() {
    let students = [];
    try {
      students = readAccounts().map(publicAccount);
    } catch {
      students = [];
    }
    if (!students.some((account) => account.accountNumber === demoAccount.accountNumber)) {
      students.unshift({ ...demoAccount });
    }
    return students;
  }

  function toHex(bytes) {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async function hashPassword(password, salt) {
    if (!window.crypto?.subtle) throw new Error("Account creation and sign-in require opening the demo on localhost or HTTPS.");
    const key = await window.crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const saltBytes = Uint8Array.from(salt.match(/.{2}/g), (byte) => parseInt(byte, 16));
    const bits = await window.crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: saltBytes, iterations: 100000 }, key, 256);
    return toHex(new Uint8Array(bits));
  }

  function checkDuplicate(accounts, accountNumber, email) {
    if (accountNumber === demoAccount.accountNumber || accounts.some((account) => account.accountNumber === accountNumber)) {
      throw new Error("This student number already has an account. Please sign in instead.");
    }
    if (email === demoAccount.email || accounts.some((account) => account.email.toLowerCase() === email)) {
      throw new Error("This email is already registered. Please use a different email.");
    }
  }

  async function register({ fullName, accountNumber, email, password }) {
    fullName = fullName.trim();
    accountNumber = accountNumber.trim();
    email = email.trim().toLowerCase();
    if (!fullName || fullName.length > 100 || !accountNumber || accountNumber.length > 40 || !email || email.length > 254 || password.length < 8) {
      throw new Error("Complete all registration fields and use a password of at least eight characters.");
    }
    checkDuplicate(readAccounts(), accountNumber, email);
    const passwordSalt = toHex(window.crypto.getRandomValues(new Uint8Array(16)));
    const passwordHash = await hashPassword(password, passwordSalt);
    // Re-read after hashing so another completed registration is preserved.
    const accounts = readAccounts();
    checkDuplicate(accounts, accountNumber, email);
    const account = { role: "student", fullName, accountNumber, email, passwordSalt, passwordHash };
    accounts.push(account);
    try {
      window.localStorage.setItem(accountsKey, JSON.stringify(accounts));
    } catch {
      throw new Error("Your account could not be saved. Browser storage is unavailable or full. Please try again.");
    }
    return publicAccount(account);
  }

  async function authenticate(accountNumber, password, role = "student") {
    accountNumber = accountNumber.trim();
    if (role === "staff") {
      const account = staffRecords().find((entry) => entry.accountNumber === accountNumber);
      if (!account || await hashPassword(password, account.passwordSalt) !== account.passwordHash) return null;
      return publicStaffAccount(account);
    }
    const account = readAccounts().find((entry) => entry.accountNumber === accountNumber);
    if (!account || await hashPassword(password, account.passwordSalt) !== account.passwordHash) return null;
    if (accountNumber === demoAccount.accountNumber) return { ...demoAccount };
    return publicAccount(account);
  }

  async function changePassword(accountNumber, currentPassword, newPassword, role = "student") {
    if (newPassword.length < 8) throw new Error("Use at least 8 characters for your new password.");
    if (newPassword === currentPassword) throw new Error("Choose a new password different from your current password.");
    const account = await authenticate(accountNumber, currentPassword, role);
    if (!account) throw new Error("Your current password is incorrect.");
    const passwordSalt = toHex(window.crypto.getRandomValues(new Uint8Array(16)));
    const passwordHash = await hashPassword(newPassword, passwordSalt);
    if (role === "staff") {
      const credentials = readStaffCredentials();
      credentials[accountNumber] = { passwordSalt, passwordHash };
      try {
        window.localStorage.setItem(staffCredentialsKey, JSON.stringify(credentials));
      } catch {
        throw new Error("Your password could not be saved. Browser storage is unavailable or full.");
      }
      return;
    }
    const accounts = readAccounts();
    const index = accounts.findIndex((entry) => entry.accountNumber === accountNumber);
    if (index === -1 && accountNumber !== demoAccount.accountNumber) throw new Error("This demo account could not be found.");
    const updated = { ...(index === -1 ? demoAccount : accounts[index]), passwordSalt, passwordHash };
    if (index === -1) accounts.push(updated);
    else accounts[index] = updated;
    try {
      window.localStorage.setItem(accountsKey, JSON.stringify(accounts));
    } catch {
      throw new Error("Your password could not be saved. Browser storage is unavailable or full.");
    }
  }

  function saveSession(account) {
    try {
      const preferences = JSON.parse(window.localStorage.getItem(`rtu.portal.settings.${encodeURIComponent(account.accountNumber)}`) || "{}");
      if (preferences?.rememberSession === false) {
        clearSession();
        return;
      }
    } catch {
      // Use the default session behavior when preferences cannot be read.
    }
    try {
      window.sessionStorage.setItem(sessionKey, `${account.role === "staff" ? "staff" : "student"}:${account.accountNumber}`);
    } catch {
      // Sign-in still works for this visit when session storage is unavailable.
    }
  }

  function restoreSession() {
    try {
      const session = window.sessionStorage.getItem(sessionKey);
      if (!session) return null;
      const separator = session.indexOf(":");
      if (separator < 0) return null;
      const role = session.slice(0, separator);
      const accountNumber = session.slice(separator + 1);
      if (!accountNumber || (role !== "student" && role !== "staff")) return null;
      return findAccount(accountNumber, role);
    } catch {
      return null;
    }
  }

  function clearSession() {
    try {
      window.sessionStorage.removeItem(sessionKey);
    } catch {
      // Complete sign-out even when session storage is unavailable.
    }
  }

  window.PortalAccounts = Object.freeze({
    register,
    authenticate,
    changePassword,
    saveSession,
    restoreSession,
    clearSession,
    listStudents,
  });
})();
