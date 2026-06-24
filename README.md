# BestService.lk — Workers Listing Platform

A trilingual (English, Sinhala, Tamil) web platform connecting Sri Lankan clients with skilled service providers across 39+ professional categories, from construction trades to home care and education.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Check translation keys
npm run check-translations
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, React Router v7 |
| Backend & Auth | Supabase (PostgreSQL, Auth, Storage) |
| Styling | Tailwind CSS v4, shadcn/ui, Tabler Icons |
| Forms | React Hook Form, Zod |
| State | Zustand |
| i18n | react-i18next |
| Hosting | Firebase Hosting |

## Key Features

- **Role-Based System**: Guest, Client, Worker, and Admin roles with route-level protection.
- **Worker Directory**: Searchable, filterable listings by category, district, and town.
- **Profile Management**: Workers can edit their profiles with image cropping, multi-category selection, and multi-location support.
- **Admin Dashboard**: Full CRUD for workers and admins, pending approval queue with side-by-side update review, and account provisioning with temporary passwords.
- **Trilingual UI**: Complete English, Sinhala, and Tamil translations with a one-click language switcher.
- **Password Workflows**: Self-service forgot/reset password flow and admin-enforced password change on first login.

## Project Structure

```
src/
├── components/         # Reusable UI components (ImageCropper, SearchableSelect, ProtectedRoute, etc.)
│   └── ui/             # shadcn/ui primitives (Button, Card, Input, Select, Table, etc.)
├── contexts/           # React Context providers (AuthContext)
├── lib/                # Utilities (supabase client, categories, locations)
├── locales/            # i18n translation files (en, si, ta)
├── pages/              # Route-level page components
│   ├── AdminDashboard  # Admin management (workers, approvals, admins)
│   ├── Home            # Landing page with search and category carousel
│   ├── Login           # Email/phone login
│   ├── Register        # Role-based registration
│   ├── WorkerProfile   # Public view + private edit
│   ├── WorkersList     # Searchable directory with filters
│   ├── ForgotPassword  # Password reset request
│   ├── ResetPassword   # Set new password via email link
│   └── ForcePasswordChange  # Admin-enforced password change
├── App.jsx             # Root component (Router, Navbar, Footer)
├── App.css             # App-level styles
├── index.css           # Global styles and CSS variables
├── i18n.js             # i18next configuration
└── main.jsx            # Entry point
```

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Documentation

- **[FEATURES.md](./FEATURES.md)**: Comprehensive feature documentation with user stories, acceptance criteria, and role-based access details.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm run check-translations` | Scan codebase for missing i18n keys |
