"use strict";

(() => {
  const accountsKey = "rtu.portal.accounts";
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

  function findAccount(accountNumber) {
    const account = readAccounts().find((entry) => entry.accountNumber === accountNumber);
    if (account && accountNumber === demoAccount.accountNumber) return { ...demoAccount };
    return account ? publicAccount(account) : null;
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

  async function authenticate(accountNumber, password) {
    accountNumber = accountNumber.trim();
    const account = readAccounts().find((entry) => entry.accountNumber === accountNumber);
    if (!account || await hashPassword(password, account.passwordSalt) !== account.passwordHash) return null;
    if (accountNumber === demoAccount.accountNumber) return { ...demoAccount };
    return publicAccount(account);
  }

  async function changePassword(accountNumber, currentPassword, newPassword) {
    if (newPassword.length < 8) throw new Error("Use at least 8 characters for your new password.");
    if (newPassword === currentPassword) throw new Error("Choose a new password different from your current password.");
    const account = await authenticate(accountNumber, currentPassword);
    if (!account) throw new Error("Your current password is incorrect.");
    const passwordSalt = toHex(window.crypto.getRandomValues(new Uint8Array(16)));
    const passwordHash = await hashPassword(newPassword, passwordSalt);
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
      window.sessionStorage.setItem(sessionKey, `student:${account.accountNumber}`);
    } catch {
      // Sign-in still works for this visit when session storage is unavailable.
    }
  }

  function restoreSession() {
    try {
      const session = window.sessionStorage.getItem(sessionKey);
      return session?.startsWith("student:") ? findAccount(session.slice(8)) : null;
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

  window.PortalAccounts = Object.freeze({ register, authenticate, changePassword, saveSession, restoreSession, clearSession });
})();
