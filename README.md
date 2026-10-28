# Pragati Foundation Healthcare Camp - Onsite Frontend (`ngo-fe-onsite`)

Production-grade onsite operations frontend built with **React, Next.js 14 (App Router), TypeScript, Material UI (MUI), ESLint, and Prettier**. Features an ultra-modern **Liquid Glass** theme with glassmorphism, dynamic subdomain detection, and real-time offline-ready state.

---

## 🌟 Key Features

### 1. Liquid Glass Theme & Customization

- **Glassmorphism Aesthetic**: Multi-layered backdrop blur, translucent gradients, delicate borders, and ambient glow orbs.
- **Dynamic Theme Options**:
  - **1st Primary Color**: `#1556A3` (Pragati Blue)
  - **2nd Primary Color**: `#198847` (Healthcare Green)
  - **Mode Toggle**: Dark Mode & Light Mode with seamless persistence in `localStorage`.

### 2. Multi-Subdomain Architecture

Detects subdomain automatically via `window.location.hostname.split('.')[0]`:

- `https://register.pragatifoundation.com` &rarr; **Registration Counter**
- `https://vitals.pragatifoundation.com` &rarr; **Vitals Station**
- `https://profile.pragatifoundation.com` &rarr; **Waiting Area / Profile Counter**
- `https://referral.pragatifoundation.com` &rarr; **Referral Station**
- `https://tests.pragatifoundation.com` &rarr; **Diagnostic Tests Counter**
- `https://meds.pragatifoundation.com` &rarr; **Pharmacy / Medication Station**
- Supports manual override via URL parameter (`?subdomain=profile`, etc.) and Topbar quick switcher.

### 3. Volunteer Onboarding Modal (1st Visit)

- Opens automatically on first visit if volunteer credentials are not in `localStorage`.
- **Unclosable**: Cannot be dismissed until valid Name (3-50 chars) and Mobile (10 digits) are submitted.
- Calls `POST /auth/register` to register the volunteer.
- Stores session details and initializes patient counter in `localStorage`.

### 4. Registration Module (`register`)

- **Patient Form**:
  - **Name**: 3 to 50 characters (Mandatory)
  - **DOB**: DatePicker with future date blocking and 120-year past limit (Optional). Selecting DOB automatically calculates age and disables the manual age field.
  - **Age**: Max 3 digits (Mandatory; auto-calculated when DOB is chosen)
  - **Mobile**: Exactly 10 digits (Mandatory)
  - **Gender**: Toggle switch (Male, Female, Others; Default: Male)
  - **Department**: Single-select dropdown populated from server-side pre-fetched API
  - **Complaint**: 3 to 500 characters textarea (Mandatory)
  - **Address**: Max 300 characters textarea (Optional)
- **RESET & SUBMIT Buttons**: Loading state and disabled during submission.
- **Post-Submission Automation**:
  - Automatically generates client-side QR code: `{ name, patientId, age }`
  - Populates printable Letterpad OPD Slip and opens it in a new tab with an automated print dialog.
  - Renders Success Modal on the current tab with:
    1. **"Open Case Paper"**: Reopens the print letterpad tab.
    2. **"Add New Patient"**: Resets form for next patient.

### 6. Profile Module (`profile`)

- **Topbar Toggle**: Toggle switch between `['Profile', 'Rating']` (default `'Profile'`).
  - Clicking `'Rating'` opens an instant-close rating modal (ratings 1–10, mandatory patientId).
  - Submits non-blocking to `PATCH /unauth/patients/:id` with `{ ratings: number }`, pops a 2s toast notification, immediately resets the toggle to `'Profile'`, and displays initial view.
- **Patient Profile Block**: Shows detailed patient demographic and camp details.
- **Vitals Block**:
  - Displays recorded vitals or "No record found" if empty.
  - Interactive "Edit Vitals" icon opens inline editor to update vitals with reset and submit actions.

### 7. Referral Module (`referral`)

- **Mobile View**: 2 square cards (QR Scanner 10% larger, 105% hover scale) + Google-like search view.
- **Web View**: 500ms debounced search bar + QR scanner button.
- **Workflow**:
  - Automatically loads and assigns Doctor via select dropdown if not already set.
  - Textarea for `description` (Patient Disease Description, mandatory, min: 3, max: 300).
  - Textarea for `destails` (Patient Contact Details & Follow-up, mandatory, min: 3, max: 300).
  - Calls `POST /unauth/referrals` (`{ patientId, doctorId, description, destails }`), updates `hasReferral: true` on patient, displays 2s toast, and returns to initial view.

### 8. Tests Module (`tests`)

- **Workflow**:
  - Select / assign Doctor if not yet present on patient profile.
  - Multi-select dropdown pre-populated with diagnostic tests fetched from `GET /unauth/tests`.
  - Submits to `POST /unauth/tests` (`{ patientId, doctorId, tests: [testIds] }`), updates `hasTest: true`, shows 2s toast, and returns to initial view.

### 9. Meds Module (`meds`)

- **Workflow**:
  - Select / assign Doctor if not yet present on patient profile.
  - Medicine search autocomplete calling `GET /unauth/meds?seach=NAME`.
  - Add medication items with quantities to prescription table with removal options.
  - Submits to `POST /unauth/meds` (`{ patientId, doctorId, meds: [{ pharmacyId, quantity }] }`), updates `hasMeds: true`, displays 2s toast, and returns to initial view.

---

## 📁 Directory Structure

```
ngo-fe-onsite/
├── src/
│   ├── app/
│   │   ├── globals.css            # Ambient Liquid Glass gradient orbs & styling
│   │   ├── layout.tsx             # Root layout with Theme, Toast, & Subdomain providers
│   │   ├── page.tsx               # Server-side API pre-fetching of departments
│   │   └── OnsiteClientApp.tsx    # Subdomain switcher component
│   ├── components/
│   │   ├── common/
│   │   │   ├── LiquidGlassCard.tsx# Reusable glassmorphic card component
│   │   │   └── Topbar.tsx         # Logo, profile hover menu, patient count, & theme switch
│   │   ├── registration/
│   │   │   ├── RegistrationModule.tsx # Patient registration form
│   │   │   └── SuccessModal.tsx   # "Open Case Paper" & "Add New Patient" dialog
│   │   ├── vitals/
│   │   │   ├── QRScannerModal.tsx # html5-qrcode camera & file QR scanner
│   │   │   └── VitalsModule.tsx   # Mobile 2-card & Web Google-search vitals workflows
│   │   └── volunteer/
│   │       └── VolunteerWelcomeModal.tsx # Unclosable onboarding modal
│   ├── contexts/
│   │   ├── ThemeContext.tsx       # Liquid Glass theme, dark/light & primary color state
│   │   ├── ToastContext.tsx       # 2-second toast notification (SUCCESS, ERROR, ALERT)
│   │   ├── VolunteerContext.tsx   # Volunteer profile & patient counter in localStorage
│   │   └── SubdomainContext.tsx   # Subdomain routing & active counter state
│   ├── types/
│   │   └── index.ts               # Shared TypeScript interfaces & types
│   └── utils/
│       ├── ageCalculator.ts       # DOB calculation & 120-year validation
│       ├── api.ts                 # Backend API integration clients
│       ├── letterPadTemplate.ts   # Printable OPD slip HTML generator
│       └── qrGenerator.ts         # Client-side QR Code data URL generator
├── .eslintrc.json
├── .prettierrc
├── next.config.mjs
├── tsconfig.json
└── package.json
```

---

## ⚡ Setup & Run

### 1. Install Dependencies

```bash
cd ngo-fe-onsite
npm install
```

### 2. Configure Environment (`.env.local`)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_ENV=development
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- To preview the **Registration Counter**: [http://localhost:3000?subdomain=register](http://localhost:3000?subdomain=register)
- To preview the **Vitals Station**: [http://localhost:3000?subdomain=vitals](http://localhost:3000?subdomain=vitals)

### 4. Lint and Code Formatting

```bash
# Check code formatting with Prettier
npm run format

# Run ESLint validation
npm run lint
```

### 5. Production Build

```bash
npm run build
npm start
```
