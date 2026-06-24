# System Features & User Stories

This document outlines the features and functionalities of the BestService.lk platform, structured as detailed user stories with acceptance criteria for future reference.

---

## 1. Authentication & User Management

### 1.1 Role-Based Registration
* **User Story**: As an unauthenticated visitor, I want to register for an account and choose my role as either a "Client" (seeking services) or a "Service Provider" (worker), so that my experience is tailored to my needs on the platform.
* **Acceptance Criteria**:
  * The role is determined by the URL query parameter (`?role=user` or `?role=worker`).
  * Registration requires first name, last name, phone number, and password. Email is required for clients but optional for workers.
  * Workers who do not provide an email are assigned a system-generated placeholder email (`worker-{phone}@bestservicelk.com`).
  * On successful registration, a user record is created in the `users` table.
  * If registering as a worker, an additional record is created in the `workers` table with `status: 'pending'` and `available: false`.
  * Worker registrations redirect to the home page with a `?registered=pending` query param, showing a "pending review" banner.
  * Client registrations redirect to the home page.
  * If a user is already logged in, they are redirected away from the registration page.
* **Technical Details**: Handled by [`Register.jsx`](file:///c:/VCS/sandbox/workers-listing/src/pages/Register.jsx). Uses Supabase Auth `signUp`. Zod schema validates inputs; workers have a different schema (email optional).

### 1.2 Secure Login
* **User Story**: As a registered user, I want to securely log in using my email (or phone number) and password so that I can access my personalized dashboard and profile.
* **Acceptance Criteria**:
  * Users can log in with an email address or a phone number.
  * If a phone number is entered, the system converts it to the placeholder email format for authentication.
  * Invalid credentials display a clear error message.
  * On successful login, the system checks `user_metadata.requires_password_change`. If true, the user is redirected to `/force-password-change`.
  * Otherwise, admins are redirected to `/admin` and other users to `/profile`.
  * Already logged-in users are redirected away from the login page.
  * Password visibility can be toggled with an eye icon.
* **Technical Details**: Handled by [`Login.jsx`](file:///c:/VCS/sandbox/workers-listing/src/pages/Login.jsx). Uses Supabase Auth `signInWithPassword`.

### 1.3 Password Recovery (Forgot/Reset Password)
* **User Story**: As a user who has forgotten their password, I want to request a password reset link via email so that I can securely set a new password and regain access.
* **Acceptance Criteria**:
  * The Forgot Password page requires a valid email address.
  * On submission, Supabase sends a password reset email with a link to `/reset-password`.
  * A success message is displayed after the email is sent.
  * The Reset Password page allows the user to enter and confirm a new password.
* **Technical Details**: Handled by [`ForgotPassword.jsx`](file:///c:/VCS/sandbox/workers-listing/src/pages/ForgotPassword.jsx) and [`ResetPassword.jsx`](file:///c:/VCS/sandbox/workers-listing/src/pages/ResetPassword.jsx). Uses `supabase.auth.resetPasswordForEmail`.

### 1.4 Admin-Provisioned Accounts & Forced Password Change
* **User Story**: As a platform administrator, I want to create worker or admin accounts on their behalf, with a temporary password that the user must change upon first login, so that the platform remains secure.
* **Acceptance Criteria**:
  * When an admin creates a new worker or admin from the Admin Dashboard, the system generates a random 8-character initial password.
  * The new account is created via Supabase Auth with `user_metadata.requires_password_change = true`.
  * A credentials modal is displayed showing the login identifier and temporary password, with a "Copy Credentials" button.
  * On the user's first login, they are intercepted by the Force Password Change screen.
  * The user must enter and confirm a new password (min 6 characters). They cannot navigate away.
  * On successful password update, `requires_password_change` is cleared and the user is redirected to their profile.
* **Technical Details**: Account creation in [`AdminDashboard.jsx`](file:///c:/VCS/sandbox/workers-listing/src/pages/AdminDashboard.jsx). Force change in [`ForcePasswordChange.jsx`](file:///c:/VCS/sandbox/workers-listing/src/pages/ForcePasswordChange.jsx). Uses `supabase.auth.updateUser`.

### 1.5 Role-Based Protected Routes
* **User Story**: As an administrator, I want restricted areas like the Admin Dashboard to be inaccessible to regular users or visitors, so that sensitive data remains secure.
* **Acceptance Criteria**:
  * Unauthenticated users are redirected to `/login` (with the original location saved in state).
  * Authenticated non-admin users attempting to access `/admin` are redirected to `/`.
  * An animated loading spinner is shown while the auth state is resolving.
* **Technical Details**: Implemented via [`ProtectedRoute.jsx`](file:///c:/VCS/sandbox/workers-listing/src/components/ProtectedRoute.jsx) with `RequireAuth` and `RequireAdmin` wrapper components. Auth state managed by [`AuthContext.jsx`](file:///c:/VCS/sandbox/workers-listing/src/contexts/AuthContext.jsx).

### 1.6 Auth Context & Session Management
* **User Story**: As a user, I want my authentication session to persist across page reloads so that I don't have to log in again every time I navigate.
* **Acceptance Criteria**:
  * On app load, the existing session is retrieved via `supabase.auth.getSession()`.
  * Auth state changes are listened to via `onAuthStateChange`.
  * The user's role (`admin`, `worker`, or `user`) is fetched from the `users` table and exposed via React Context.
  * The global `authLoading` state prevents premature redirects during session resolution.
* **Technical Details**: Implemented in [`AuthContext.jsx`](file:///c:/VCS/sandbox/workers-listing/src/contexts/AuthContext.jsx).

---

## 2. Roles, Capabilities & Restrictions

The platform implements a strict Role-Based Access Control (RBAC) system.

### 2.1 Unauthenticated Visitor (Guest)
* **Capabilities**:
  * View the Landing/Home page with hero section, search bar, and category carousel.
  * Browse the Workers Directory with full search and filtering.
  * View Public Worker Profiles (name, avatar, categories, bio, partially-masked phone, email, locations, join date, availability status).
  * Toggle the application UI language (English, Sinhala, Tamil).
  * Register for a new account (as Client or Worker).
  * Log in or recover a forgotten password.
* **Restrictions**:
  * Cannot edit any profile data.
  * Cannot access admin tools.
  * Cannot see the "My Profile" or "Dashboard" navigation links.

### 2.2 Client (User Role: `user`)
* **Capabilities**:
  * *All Guest capabilities.*
  * View a basic "My Account" page showing their email, phone, and account type.
  * Sign out via the navigation bar.
* **Restrictions**:
  * Cannot list themselves in the Workers Directory.
  * Cannot edit worker profiles.
  * Cannot access the Admin Dashboard.
  * The "My Profile" nav link leads to a simple account page (not a worker profile).

### 2.3 Service Provider (User Role: `worker`)
* **Capabilities**:
  * *All Guest capabilities.*
  * Listed in the public Workers Directory once approved and active.
  * Access a rich Profile page showing their full worker profile.
  * Edit their own profile: update name, avatar (with image cropper), categories (multi-select), bio, phone, email, and service locations (district + town, multiple locations supported).
  * View a "Pending Update" banner when profile changes are awaiting admin review.
  * Sign out via the navigation bar.
* **Restrictions**:
  * Cannot edit other workers' profiles.
  * Cannot access the Admin Dashboard.
  * New registrations start with `status: 'pending'` and `available: false` — they are invisible in the public directory until approved by an admin.

### 2.4 Administrator (User Role: `admin`)
* **Capabilities**:
  * *All Guest capabilities.*
  * Access the secure Admin Dashboard (`/admin`).
  * View platform statistics: total workers, active workers, pending approvals.
  * **Pending Approvals Tab**: Review newly registered workers and pending profile updates.
    * Approve new workers (sets `available: true`, `status: 'approved'`).
    * Reject new workers (sets `available: false`, `status: 'rejected'`).
    * Review profile update requests side-by-side (current vs. proposed), with changed fields visually highlighted.
    * Approve or reject profile updates.
    * Edit and assign categories/details before approving.
  * **Workers Tab**: Full CRUD management of all workers.
    * Search, filter by category and status (active/inactive).
    * Add new workers (creates auth account + worker record with a temporary password).
    * Edit any worker's profile via a modal form (name, avatar, categories, bio, phone, email, locations, active status toggle).
    * Toggle worker active/inactive status directly from the table.
    * Delete workers (permanently removes from `workers` and `users` tables, and cleans up avatar from Supabase Storage).
  * **Admins Tab**: Manage admin accounts.
    * View all admin users.
    * Add new admins (creates auth account + user record with `role: 'admin'` and a temporary password).
    * Delete other admin accounts (cannot delete self).
  * Copy initial credentials to clipboard when creating new accounts.
  * Sign out via the navigation bar or dashboard header.
* **Restrictions**:
  * Cannot delete their own admin account.

---

## 3. Core Application Features

### 3.1 Landing Page (Home)
* **User Story**: As a visitor, I want to see an engaging landing page that explains the platform's value and lets me quickly search for or browse service providers.
* **Acceptance Criteria**:
  * Displays a hero section with a prominent search bar and a call to action.
  * Shows a "Pending Registration" banner when redirected after worker registration (`?registered=pending`).
  * Includes a scrollable category carousel with icons, grouped in pairs. Clicking a category navigates to the workers directory filtered by that category.
  * Includes a promotional banner section with an image.
  * Search form submission navigates to `/workers?q={query}`.
* **Technical Details**: Implemented in [`Home.jsx`](file:///c:/VCS/sandbox/workers-listing/src/pages/Home.jsx). Uses Embla Carousel via shadcn Carousel component. Category icons mapped from Tabler Icons.

### 3.2 Workers Directory
* **User Story**: As a client, I want to browse, search, and filter a directory of available service providers so that I can find the right person for my job.
* **Acceptance Criteria**:
  * Displays workers in a list format using `WorkerListItem` cards.
  * **Sidebar Filters**: Text search, District dropdown, Town dropdown (dependent on selected district), and Category list.
  * Filter state is synced with URL query parameters (`?q=`, `?category=`, `?district=`, `?town=`).
  * Active filter badges are displayed above results with individual clear buttons.
  * A "Clear All Filters" link resets all filters.
  * Only workers with `available: true` and `status !== 'pending'` are shown.
  * Matching logic searches across name, bio, location, phone, and category text.
  * A right sidebar contains a Google Ads placeholder.
  * Shows a result count and an empty state with a "Clear Filters" button.
* **Technical Details**: Implemented in [`WorkersList.jsx`](file:///c:/VCS/sandbox/workers-listing/src/pages/WorkersList.jsx). Uses static Sri Lanka location data from [`locations.js`](file:///c:/VCS/sandbox/workers-listing/src/lib/locations.js).

### 3.3 Public Worker Profiles
* **User Story**: As a client, I want to view a worker's detailed profile so that I can evaluate them before reaching out.
* **Acceptance Criteria**:
  * Navigating to `/profile?id={workerId}` shows a read-only public profile.
  * Displays: avatar (in a banner), full name, service categories (as badges), availability status, bio, phone (partially masked with a "Show" button), email, member-since date, and service locations (as district + town badges).
  * A "Back to listings" link is shown when viewing another user's profile.
  * If the profile is not found, a "Profile not found" message is displayed.
* **Technical Details**: Implemented in [`WorkerProfile.jsx`](file:///c:/VCS/sandbox/workers-listing/src/pages/WorkerProfile.jsx).

### 3.4 Private Profile Management (Worker Self-Edit)
* **User Story**: As a service provider, I want to edit my own profile so that my public listing is accurate and attractive.
* **Acceptance Criteria**:
  * Authenticated workers accessing `/profile` (without `?id=`) see their own profile with an "Edit Profile" button.
  * Clicking "Edit Profile" reveals an inline edit form within the profile card.
  * Editable fields: Profile Picture (via image cropper), First Name, Last Name, Phone, Email, Categories (searchable multi-select), Bio, Locations (dynamic list of District + Town pairs).
  * The image cropper allows uploading, cropping, and previewing a circular avatar. Uploaded images are stored in Supabase Storage `avatars` bucket. Old and intermediate avatars are cleaned up.
  * Changes are saved directly to the database and reflected immediately.
  * A "Pending Update" banner is shown if a previous update is awaiting admin review.
  * A success toast message is displayed after saving.
* **Technical Details**: Edit form in [`WorkerProfile.jsx`](file:///c:/VCS/sandbox/workers-listing/src/pages/WorkerProfile.jsx). Image handling in [`ImageCropper.jsx`](file:///c:/VCS/sandbox/workers-listing/src/components/ImageCropper.jsx). Locations use [`SearchableSelect`](file:///c:/VCS/sandbox/workers-listing/src/components/SearchableSelect.jsx). Categories use [`SearchableMultiSelect`](file:///c:/VCS/sandbox/workers-listing/src/components/SearchableMultiSelect.jsx).

### 3.5 Admin Dashboard
* **User Story**: As an administrator, I want a centralized dashboard to manage workers, review pending approvals, and oversee admin accounts.
* **Acceptance Criteria**:
  * **Header**: Shows "Admin Dashboard" title, the current admin's email, a Refresh button, and a Logout button.
  * **Stat Cards**: Total Workers, Active Workers, Pending Reviews.
  * **Tabs**: "Pending Approvals" (with count badge), "All Workers", "Admin Users".
  * **Pending Tab**: Lists workers with `status: 'pending'` or those with a `pendingUpdate`. Shows approve/reject/edit buttons. For profile updates, a "Review Update" button opens a side-by-side comparison modal.
  * **Workers Tab**: A searchable, filterable table of all approved workers. Columns: Name (with avatar), Categories, Location, Phone, Status (clickable toggle), Actions (Edit/Delete). "Add Worker" button opens a modal form.
  * **Admins Tab**: A table of all admin users. Columns: Email/Phone (with "You" badge for current user), Phone, Created Date, Delete action. "Add Admin" button opens a modal.
  * Deletion shows a confirmation dialog. Toast notifications for all actions.
* **Technical Details**: Implemented in [`AdminDashboard.jsx`](file:///c:/VCS/sandbox/workers-listing/src/pages/AdminDashboard.jsx). Contains sub-components: `StatCard`, `WorkerFormModal`, `ReviewUpdateModal`, `ConfirmDialog`, `WorkerRow`, `PendingWorkersTab`, `AdminFormModal`, `AdminRow`.

---

## 4. Internationalization (i18n)

### 4.1 Trilingual Support & Language Switcher
* **User Story**: As a user whose primary language is Sinhala or Tamil, I want to switch the interface language so that I can comfortably use the platform.
* **Acceptance Criteria**:
  * A language switcher is visible in the navigation bar (desktop) and the mobile menu.
  * Desktop switcher shows buttons for the two languages the user is NOT currently using.
  * Mobile switcher shows full language names (English, සිංහල, தமிழ்).
  * Selecting a language instantly translates all static UI text.
  * Categories in the directory and profile are translated using the `categories.{key}` translation namespace.
  * Language preference is persisted via `i18next` configuration.
* **Technical Details**: Powered by [`i18n.js`](file:///c:/VCS/sandbox/workers-listing/src/i18n.js) using `react-i18next`. Translation files in `src/locales/{lang}/translation.json`.

---

## 5. UI/UX & Design System

### 5.1 Responsive Mobile-First Design
* **User Story**: As a user on a smartphone, I want the layout to adapt to my screen so I can browse and use the platform on the go.
* **Acceptance Criteria**:
  * The navigation bar collapses into a hamburger menu on screens below `md` (768px).
  * The mobile menu is a full-width dropdown with all navigation links.
  * Grid layouts (e.g., profile details, filter sidebar) stack into single columns on small screens.
  * The workers directory sidebar becomes a top section on mobile.
* **Technical Details**: Tailwind CSS responsive utilities (`sm:`, `md:`, `lg:`).

### 5.2 Dark & Light Theming
* **User Story**: As a user, I want the application to support a comfortable viewing experience in both light and dark environments.
* **Acceptance Criteria**:
  * The application uses CSS variables for theming (defined in `index.css`).
  * Dark mode styles are applied via Tailwind's `dark:` variant.
  * Colors, backgrounds, and borders adapt consistently across all pages.
* **Technical Details**: CSS variables in [`index.css`](file:///c:/VCS/sandbox/workers-listing/src/index.css). Tailwind `dark:` variant.

### 5.3 Robust Form Validation
* **User Story**: As a user filling out any form, I want immediate, clear error messages for invalid inputs so I can correct mistakes before submitting.
* **Acceptance Criteria**:
  * All forms use Zod schemas for validation.
  * Error messages appear below the respective field.
  * Invalid fields are highlighted with red borders.
  * Password toggle (show/hide) is available on all password fields.
  * Phone validation requires 7-15 digit format. Email validation requires a valid email format. Passwords require a minimum of 6 characters.
* **Technical Details**: React Hook Form with `zodResolver`. Schemas defined per-page.

### 5.4 Image Cropping & Upload
* **User Story**: As a worker, I want to upload and crop my profile picture so that my avatar looks professional.
* **Acceptance Criteria**:
  * Clicking the avatar area opens a file selector.
  * After selecting an image, a crop interface appears with a circular crop area.
  * The user can adjust zoom and position before confirming.
  * The cropped image is uploaded to Supabase Storage (`avatars` bucket) as a JPEG.
  * Previous avatars and intermediate uploads are cleaned up from storage.
* **Technical Details**: Implemented in [`ImageCropper.jsx`](file:///c:/VCS/sandbox/workers-listing/src/components/ImageCropper.jsx). Uses `react-easy-crop`.

### 5.5 Navigation & Footer
* **User Story**: As a user, I want consistent navigation and footer across all pages so I can easily move around the platform.
* **Acceptance Criteria**:
  * The navbar is fixed at the top with glassmorphism styling (`backdrop-blur`).
  * Logo links to home. Nav links include Home and All Ads.
  * Authenticated users see "My Profile" or "Dashboard" (admin) and "Sign Out" links.
  * Unauthenticated users see "Need a Service", "Provide a Service", and "Login" links.
  * Footer includes 5 columns: More from BestService, Help & Support, About, Blog & Guides (with social icons), and Download our App (with Google Play / App Store badges).
  * Footer includes copyright with dynamic year.
* **Technical Details**: `Navbar` and `Footer` components in [`App.jsx`](file:///c:/VCS/sandbox/workers-listing/src/App.jsx).

---

## 6. Service Categories

The platform supports 39 predefined service categories:

| Category | Category | Category |
|---|---|---|
| Masons | Carpenters | Tile |
| Plumbers | Electricians | Painters |
| Landscaping | Stones Sand Soil | Equipment Repairing |
| Contractors | Welding | Professionals |
| AC | Concrete Slab | Cushion Works |
| Gully Bowser | Well | Aluminium |
| Ceiling | Chair Weavers | Rent Tools |
| Cleaners | Vehicle Repairs | CCTV |
| Solar Panel Fixing | Curtains | Movers |
| Pest Control | House Demolishers | Housemaid |
| Elder Care | Child Care | Nursing Home |
| Physiotherapy | Swimming Instructor | Fitness Instructor |
| Counseling | Tuition Master | Repairs Others |

Categories are normalized for URL-safe keys and support i18n translation. Workers can belong to multiple categories.

**Technical Details**: Defined in [`categories.js`](file:///c:/VCS/sandbox/workers-listing/src/lib/categories.js).

---

## 7. Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + Vite 8 |
| **Routing** | React Router DOM v7 |
| **Backend & Auth** | Supabase (PostgreSQL + Auth + Storage) |
| **Styling** | Tailwind CSS v4 + PostCSS |
| **UI Components** | shadcn/ui + Base UI + Tabler Icons |
| **Forms** | React Hook Form + Zod |
| **State Management** | Zustand |
| **i18n** | react-i18next (i18next) |
| **Image Handling** | react-easy-crop |
| **Carousel** | Embla Carousel (via shadcn) |
| **Hosting** | Firebase Hosting |
| **Typography** | Geist Variable Font |
