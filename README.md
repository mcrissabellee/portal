# RTU Pasig Academic Services Portal

A responsive recreation of the provided login and student dashboard designs, built with HTML, Bootstrap 5.3, CSS, and vanilla JavaScript.

## Run

Serve the project with VS Code's **Live Server** extension, or run this command from the project folder if Python is installed. No installation or build step is required:

```sh
python -m http.server 5500
```

Then visit **http://localhost:5500**.

The portal loads its separate HTML page files using `fetch`, so run it through an HTTP server rather than opening `index.html` as a `file://` URL. Continue using the same server address and port to access your existing browser-saved demo accounts.

Bootstrap loads from jsDelivr. The page also includes local styling for its core layout and controls, so the demo remains usable when the CDN is unavailable.

## Features

- Responsive split layout with the reference's pale blue, royal blue, and gold palette.
- Student and staff login modes with corresponding labels.
- Accessible password visibility toggle and inline form validation.
- Password recovery and registration dialogs with keyboard focus management and Escape-to-close support.
- Browser-local student registration and sign-in, without a built-in password.
- Duplicate student-number/email checks and salted password hashes for registered demo accounts.
- Tab-scoped sign-in session that survives refresh and is cleared by Log out.
- Header sun/moon button for light and dark mode, saved separately for each demo account.
- Reference-inspired dashboard with university branding, navigation, assistant search, and quick services.
- Services, request previews, academic records, announcements, help, profile, and logout.
- Expandable Services navigation with separate Grade Slip, Registration Form, and ID Printing pages and active-service indicators.
- Three-step Grade Slip form with profile-prefilled information, validation, progress, account-specific draft autosave, and request review.
- Grade Slip pick-up schedule confirmation with YES/NO actions and a dedicated Schedule Complete screen.
- Responsive mobile navigation and document request dialogs.
- Individual URL routes with direct links and browser Back/Forward navigation.
- A separate HTML file for every route, plus reusable shared layout, icons, and dialogs.
- Reference-inspired My Profile page with personal information, academic details, and contact fields.
- Reference-inspired Settings workspace with Account Information, Change Password, Notification Settings, and Privacy and Security sections.
- Account-specific profiles populated from registration, with a pencil Edit control and automatic browser-local saving for personal, academic, and contact details.
- Keyword-based assistant guidance and suggested questions.
- Local SVG assistant illustration and the Rizal Technological University seal.

## Files

```text
index.html                     Small entry point: styles, scripts, and app mount point
pages/login.html               Login page
pages/dashboard.html           Dashboard route
pages/services.html            Academic Services route
pages/grade-slip.html          Grade Slip service route
pages/grade-slip-complete.html Grade Slip Schedule Complete route
pages/registration-form.html   Registration Form service route
pages/id-printing.html         ID Printing service route
pages/my-request.html          My Request route
pages/academic-records.html     Academic Records route
pages/announcements.html        Announcement route
pages/help.html                 Help route
pages/profile.html              My Profile route
pages/settings.html             Settings route and its section panels
components/dashboard-shell.html Shared header, account menu, sidebar, and view container
components/icons.html          Shared SVG icon library
components/dialogs.html        Request, schedule confirmation, assistant, recovery, and registration dialogs
css/style.css                  Reference-inspired design and responsive styles
css/dashboard.css              Dashboard layout, cards, and mobile navigation
css/grade-slip.css             Grade Slip multi-step form layout and theme styles
css/theme.css                  Dark-mode colors for dashboard views, settings, and dialogs
js/accounts.js                 Saved demo accounts, password hashing, and sign-in sessions
js/app.js                      Route-to-file map, HTML loading, and app initialization
js/script.js                   Registration, sign-in, role switching, and account dialogs
js/dashboard.js                Dashboard navigation, request previews, assistant, and logout
js/settings.js                 Settings sections, account editing, password changes, and preferences
js/grade-slip.js               Grade Slip steps, validation, saved drafts, and submission
assets/images/assistant.svg    Robot illustration
assets/images/rtu-logo.png      Rizal Technological University seal
```

The university seal matches the supplied reference and is stored locally. Source: [RTU website](https://www.rtu.edu.ph/wp-content/uploads/2022/08/rtulogo.png).

### Editing pages

Edit a route's markup in its matching `pages/*.html` file. Edit the shared header/sidebar in `components/dashboard-shell.html`, the shared icons in `components/icons.html`, and dialogs in `components/dialogs.html`. These files are HTML fragments rendered inside the entry page; navigate using the portal URLs below.

`js/app.js` defines each route's hash and HTML file in one map. On startup it fetches the page and component files in parallel, mounts them once, then initializes login, dashboard, settings, and Grade Slip behavior in order. This keeps form state and in-memory requests intact when changing routes and ensures handlers are attached only after their elements exist. If a file cannot load, the entry page shows the failed path and a reload button.

Keep the `<body>` boundaries in imported page and component files. They let Live Server inject its reload script once at the end of each response instead of repeatedly inside inline SVG icons. The loader parses each response as an HTML document, removes injected scripts, and imports only its body content. Live reload remains active through the entry page's script.

## Demo behavior

In **Student** mode, choose **Register**, enter your full name, student number, university email, and a password of at least eight characters, then choose **Create account**. The account is saved in this browser's `localStorage`. After successful registration, the dialog closes and your student number is filled into the login form. Enter your password to sign in. Duplicate student numbers and registered emails are rejected. Registration reports a failure if browser storage cannot save the account.

The registered name, student number, and email appear in **My Profile**. Your name also appears in the header and dashboard, and your student number appears in Academic Records and document request previews. New accounts show **Not provided** for year level, program, and semester, with an optional phone number you can add in My Profile. Profiles are saved separately for each account, so signing into another account loads that user's details. Accounts and saved profiles remain after reload or logout in the same browser. Clearing this site's browser storage removes them.

There is no built-in password. Create your own demo account using **Register** before signing in for the first time. The original student number **2023-103319** remains reserved for compatibility: it can sign in only if it already has a password hash saved in this browser, and retains Juan Dela Cruz's reference profile and existing saved profile edits. Incorrect credentials are rejected. Staff registration and sign-in are not connected.

A demo session marker identifying the signed-in student is stored in `sessionStorage`, keeping you signed in across refreshes in the same browser tab and restoring the page specified in the URL. **Log out** clears that marker and returns to the login screen. Passwords are never included in the session marker. If browser session storage is unavailable, sign-in still works for the current page visit, but cannot survive refresh.

Document requests are in-memory demo drafts, visible under **My Request**. They are cleared on logout or page reload and are not submitted to the university. Reloading preserves your sign-in session and opens the page specified in the URL. The assistant provides local, keyword-based guidance rather than a live AI or registrar connection. Announcements are sample portal content.

### Page routes

Each page has its own hash route and source file:

| Page | Route | Source file |
| --- | --- | --- |
| Dashboard | `#/dashboard` | `pages/dashboard.html` |
| Services | `#/services` | `pages/services.html` |
| Grade Slip | `#/services/grade-slip` | `pages/grade-slip.html` |
| Schedule Complete | `#/services/grade-slip/complete` | `pages/grade-slip-complete.html` |
| Registration Form | `#/services/registration-form` | `pages/registration-form.html` |
| ID Printing | `#/services/id-printing` | `pages/id-printing.html` |
| My Request | `#/my-request` | `pages/my-request.html` |
| Academic Records | `#/academic-records` | `pages/academic-records.html` |
| Announcement | `#/announcements` | `pages/announcements.html` |
| Help | `#/help` | `pages/help.html` |
| My Profile | `#/profile` | `pages/profile.html` |
| Settings | `#/settings` | `pages/settings.html` |

For example, open `http://localhost:5500/#/services` and sign in to go directly to Services. Navigation updates the URL, page title, and active navigation item. Browser Back/Forward restores the matching page. Unknown routes fall back to Dashboard after sign-in. Logging out clears the current route and returns to login.

Select **Services** in the sidebar to expand or collapse its **Grade Slip**, **Registration Form**, and **ID Printing** links. The active service has a gold indicator, highlighted background, and `aria-current="page"`; page headings also identify the current service. Opening a service through a direct link, refresh, browser history, the service catalog, or dashboard shortcuts automatically expands the Services menu and selects the matching item. Each service page can create a demo request that appears in **My Request**. Use **View All Services** on the dashboard or a **Services** breadcrumb to open the complete catalog. The disclosure supports Enter/Space and Escape, and service navigation also works in the mobile sidebar and dark mode.

### Grade Slip form

The Grade Slip page follows the reference's blue form panel and three-step progress header:

1. **Personal Information:** student number, full name, program, year level, and semester are prefilled from the signed-in account's profile. Student number is fixed; other values can be adjusted for this request. Long program names wrap and expand automatically. Changes here do not overwrite My Profile.
2. **Grade Slip Details:** the reference-style Enrollment Details panel has academic-year and requested-semester dropdowns, a calendar appointment-date field, and a clock start-time field. Available hours are **8:00 AM–5:00 PM**, with start times limited to **8:00 AM–4:00 PM**. Choose or type a start time; the read-only end time is always calculated one hour later (for example, `8:00 AM → 9:00 AM`). The last appointment is **4:00 PM–5:00 PM**. Out-of-hours times cannot proceed to review or submission, including in restored drafts. The date must be today or later. Calendar/clock buttons open the browser's native pickers, and keyboard entry is supported. Expand **Additional request details** to change the default Personal copy purpose, 1–10 copies, or optional notes. The displayed 150-student capacity is reference/demo copy; the demo does not check live appointment availability.
3. **Review & Submit:** review the personal details, requested academic year/semester, appointment date, calculated time range, and any additional details. **Submit request** opens a blurred-backdrop confirmation asking whether to proceed with the selected pick-up schedule. **NO**, Escape, or clicking outside returns to the review form without creating a request or clearing its draft. **YES** creates the demo request once and opens **Schedule Complete!**, showing a green check mark, the actual selected date/time, and the request reference. Use **Back to Dashboard** or **View My Request** to continue; **View request details** in My Request displays the submitted snapshot, including the appointment schedule.

The selected step and draft values autosave separately for each account in browser storage and survive navigation, refresh, and logout. Previously saved drafts retain their information when the new scheduling fields are added and return to Details if a required date/time is missing. Invalid drafts can be saved, but must be corrected before moving forward or confirming submission. A draft is cleared only after choosing YES and successfully creating its request, so the next Grade Slip request starts fresh. Submitted demo requests and their completion screen remain in memory for the current visit and are cleared on refresh or logout. A completion URL without a confirmed request returns to the Grade Slip form. The progress indicator, Next/Back controls, confirmation, success screen, assistant shortcut, and autosave footer work on mobile and in dark mode.

Click the name/avatar in the header to open the account dropdown, then select **My Profile**, **Settings**, or **Log out**. On mobile, tap the avatar. The dropdown closes when you select a page, click outside, move focus outside, or press Escape.

Profile fields start in read-only mode. Select the pencil **Edit** button beside **Personal Information** to edit your full name, year level, program, semester, email address, optional phone number, and address. Valid changes are automatically saved to the signed-in account's browser-local profile. Select **Done** to save any pending changes and return to read-only mode; invalid entries keep editing open and receive focus. On small screens, the control shows a pencil to edit and a check mark to finish. Student number remains fixed as the account's sign-in identifier. Saved profile details remain after reload or logout, and the name and program label update throughout the profile. Existing saved profiles from before academic editing are supported. Profile saving is local to this browser and does not update university records.

### Settings

Open **Settings** from the account dropdown, or visit `#/settings` while signed in. The section menu switches between:

- **Account Information:** a reference-style account summary with a pencil **Edit Info** control. Name, year level, program, semester, phone, email, and address are editable; student ID remains the sign-in identifier. Valid edits autosave and stay synchronized with My Profile. Choose **Done** to finish editing.
- **Change Password:** enter your current password and confirm a new password of at least eight characters. The saved password hash is updated, and subsequent sign-in requires the new password. This works for registered accounts and the original demo account.
- **Notification Settings:** reference-style left-aligned switches for **Service Updates**, **Announcement**, and **Reminders**, with italic descriptions. Service Updates controls demo request confirmations, Announcement controls the header badge, and Reminders saves the account's deadline-reminder preference. The demo does not currently have scheduled deadlines to send reminders for. All three choices are saved per account, including across refreshes; existing saved service/announcement choices are preserved.
- **Privacy and Security:** displays the supplied **Privacy Policy** and **How We Protect Your Information** content in the reference-style panel. Expand **Session preferences** below the policy to control whether sign-in survives refresh or to log out. Turning off remembered sign-in clears the tab's session marker; the next refresh requires login.

Preferences are saved per account in `localStorage`. The menu supports keyboard arrow keys, Home, and End, and rearranges above the panel on smaller screens. The **RTU AI ASSISTANT** shortcut opens the existing assistant dialog.

### Appearance

Use the moon/sun button beside the header's notification and account controls to switch between **light mode** and **dark mode**. The button displays the mode you can switch to, with an accessible label and pressed state. The theme applies to every dashboard route, the account dropdown, document dialogs, and the assistant. It is saved with the signed-in account's preferences and restored after refresh or the next sign-in. Each account defaults to light mode until changed. Logging out returns the login screen to light mode. If storage is unavailable, switching still works for the current visit.

Registration validates all fields, email format, and a password of at least eight characters. Registered passwords are stored as salted PBKDF2-SHA-256 hashes (100,000 iterations), rather than plain text. Password hashing uses the browser's Web Crypto API, available when opening the demo locally or over localhost/HTTPS. Password recovery remains a preview and does not send email or change saved passwords.

Demo accounts are checked in client-side JavaScript using this browser's saved data; no account details or passwords are sent to a server. This browser-local demo does not provide production authentication or university account creation. Official authentication, records, request processing, and password recovery require a backend integration.
