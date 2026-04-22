## 🎯 PROJECT OVERVIEW

You are building a **complete Financial Accounting & Management System** for a **Rehabilitation Center for Special Needs** (مركز تأهيل ذوي الاحتياجات الخاصة).

This is a **private internal web application** — not a public website. All pages are behind authentication. The system must be fully bilingual **(Arabic + English)**, support **RTL layout**, and be production-ready.

---

## 🛠️ TECH STACK — DO NOT DEVIATE

```
Frontend:     React + Vite (NOT Next.js)
Styling:      Tailwind CSS v3
Charts:       Recharts
Backend/DB:   Firebase (Firestore)
Auth:         Firebase Authentication
Hosting:      Vercel (free tier)
Language:     JavaScript (no TypeScript needed)
State Mgmt:   React Context API + useReducer (no Redux)
Routing:      React Router v6
```

---

## 📁 PROJECT STRUCTURE

Scaffold the project with this exact structure:

```
/src
  /components
    /ui          → reusable: Button, Input, Modal, Badge, Card, Table, Alert
    /layout      → Sidebar, Navbar, PageWrapper
    /charts      → RevenueChart, ExpenseChart, SalaryChart
  /pages
    /auth        → Login.jsx
    /dashboard   → Dashboard.jsx
    /revenues    → RevenuesList.jsx, AddRevenue.jsx
    /expenses    → ExpensesList.jsx, AddExpense.jsx
    /employees   → EmployeesList.jsx, EmployeeProfile.jsx
    /attendance  → AttendanceLog.jsx
    /payroll     → PayrollSheet.jsx
    /petty-cash  → PettyCash.jsx, AddPettyCash.jsx, SpendPettyCash.jsx
    /payments    → PaymentsList.jsx, AddPayment.jsx
    /reports     → Reports.jsx
    /alerts      → Alerts.jsx
    /settings    → Settings.jsx
  /hooks         → useAuth.js, useFirestore.js, useRealtime.js
  /context       → AuthContext.jsx, AppContext.jsx
  /firebase      → config.js, collections.js
  /utils         → formatCurrency.js, formatDate.js, calculations.js
  /constants     → roles.js, categories.js
```

---

## 🔐 AUTHENTICATION & ROLES

Use **Firebase Auth** with email/password login.

### Roles stored in Firestore `users` collection:
```js
{
  uid: "...",
  name: "...",
  email: "...",
  role: "admin" | "accountant" | "employee",
  createdAt: timestamp
}
```

### Access control:
| Page | Admin | Accountant | Employee |
|------|-------|------------|----------|
| Dashboard | ✅ Full | ✅ Full | ❌ |
| Revenues | ✅ | ✅ | ❌ |
| Expenses | ✅ | ✅ | ❌ |
| Payroll | ✅ | ✅ read-only | ❌ |
| Petty Cash | ✅ | ✅ | ✅ own only |
| Payments | ✅ | ✅ | ❌ |
| Reports | ✅ | ✅ | ❌ |
| Settings | ✅ only | ❌ | ❌ |

Build a `ProtectedRoute` component that checks role before rendering any page.

---

## 🗄️ FIRESTORE DATA MODELS

### Collection: `revenues`
```js
{
  id: auto,
  type: "monthly_fee" | "assessment" | "overtime" | "life_skills" | "therapy" | "activities" | "other",
  clientName: string,
  totalAmount: number,
  paidAmount: number,      // sum of linked payments
  remainingAmount: number, // auto-calculated
  paymentStatus: "paid" | "partial" | "pending" | "overdue",
  paymentMethod: "cash" | "bank_transfer" | "check",
  date: timestamp,
  notes: string,
  createdBy: uid,
  createdAt: timestamp
}
```

### Collection: `expenses`
```js
{
  id: auto,
  category: "rent" | "salaries" | "petty_cash" | "emergency" | "maintenance" | "supplies" | "other",
  amount: number,
  description: string,
  reference: string,        // receipt/invoice number
  date: timestamp,
  createdBy: uid,
  createdAt: timestamp
}
```

### Collection: `employees`
```js
{
  id: auto,
  name: string,
  nameAr: string,
  jobTitle: string,
  hourlyRate: number,       // rate per hour in EGP
  overtimeRate: number,     // multiplier e.g. 1.5
  pettyCashLimit: number,   // max petty cash allowed
  phone: string,
  email: string,
  startDate: timestamp,
  isActive: boolean,
  createdAt: timestamp
}
```

### Collection: `attendance`
```js
{
  id: auto,
  employeeId: string,
  date: timestamp,          // day only (normalize to midnight)
  checkIn: timestamp,
  checkOut: timestamp,
  scheduledHours: number,   // e.g. 8
  actualHours: number,      // auto-calculated from checkIn/checkOut
  overtimeHours: number,    // max(0, actualHours - scheduledHours)
  lateMinutes: number,      // deducted from pay
  status: "present" | "absent" | "late" | "half_day",
  notes: string
}
```

### Collection: `payroll`
```js
{
  id: auto,
  employeeId: string,
  month: string,            // "2025-01" format
  totalWorkHours: number,
  overtimeHours: number,
  deductionMinutes: number,
  grossSalary: number,
  deductions: number,
  overtimePay: number,
  netSalary: number,        // auto-calculated
  isPaid: boolean,
  paidDate: timestamp,
  notes: string,
  generatedAt: timestamp
}
```

### Collection: `petty_cash`
```js
{
  id: auto,
  employeeId: string,
  type: "allocation" | "topup" | "spend",
  amount: number,
  category: "maintenance" | "supplies" | "emergency" | "other",  // for spend
  purpose: string,
  currentBalance: number,   // balance AFTER this transaction
  date: timestamp,
  createdBy: uid,
  createdAt: timestamp
}
```

### Collection: `payments`
```js
{
  id: auto,
  revenueId: string,        // linked to revenues collection
  clientName: string,
  amount: number,
  paymentMethod: "cash" | "bank_transfer" | "check",
  date: timestamp,
  notes: string,
  createdBy: uid,
  createdAt: timestamp
}
```

---

## ⚙️ CORE BUSINESS LOGIC

### 1. Revenue Status Auto-Update
Every time a payment is added to `payments`:
- Recalculate `paidAmount` = sum of all payments where `revenueId` matches
- Recalculate `remainingAmount` = `totalAmount - paidAmount`
- Update `paymentStatus`:
  - `paidAmount === 0` → `"pending"`
  - `paidAmount >= totalAmount` → `"paid"`
  - `paidAmount > 0 && paidAmount < totalAmount` → `"partial"`
  - `partial` AND `date > 30 days ago` → `"overdue"`

### 2. Payroll Calculation Function
Build `calculatePayroll(employeeId, month)` in `/utils/calculations.js`:
```
1. Fetch all attendance records for employee in that month
2. totalWorkHours = sum of actualHours for "present" and "late" days
3. overtimeHours = sum of overtimeHours
4. deductionMinutes = sum of lateMinutes
5. grossSalary = totalWorkHours * employee.hourlyRate
6. overtimePay = overtimeHours * employee.hourlyRate * employee.overtimeRate
7. deductions = (deductionMinutes / 60) * employee.hourlyRate
8. netSalary = grossSalary + overtimePay - deductions
```
This function must be pure — takes data, returns computed object, no Firebase calls inside.

### 3. Petty Cash Balance
Each petty_cash transaction stores `currentBalance`.
- Allocation/Topup: `currentBalance = previous balance + amount`
- Spend: `currentBalance = previous balance - amount`
- Block spend if `amount > currentBalance`
- Block spend if `currentBalance + amount > employee.pettyCashLimit`

---

## 📄 PAGES — DETAILED REQUIREMENTS

### `/login`
- Clean centered card form
- Email + password fields
- Firebase Auth `signInWithEmailAndPassword`
- On success → redirect to `/dashboard`
- Show Arabic error messages for wrong credentials

---

### `/dashboard`
**Top KPI Cards (4 cards in a row):**
- Total Revenues this month (إجمالي الإيرادات)
- Total Expenses this month (إجمالي المصروفات)
- Net Profit = Revenues - Expenses (صافي الربح)
- Pending Payments total (المدفوعات المعلقة)

**Charts (Recharts):**
- Line chart: Revenues vs Expenses over last 6 months
- Donut chart: Expenses breakdown by category
- Bar chart: Top 5 employees by salary this month

**Alerts Panel:**
- Overdue payments list (with client name + amount)
- Unpaid salaries for current month
- Employees with petty cash balance < 20% of limit

All data must be **real-time** using Firestore `onSnapshot`.

---

### `/revenues` + `/revenues/add`
**List page:**
- Table: Client Name | Type | Total | Paid | Remaining | Status | Date | Actions
- Filter by: status, type, date range
- Search by client name
- Status badge with color: green=paid, yellow=partial, red=overdue, gray=pending
- Click row → expand to show linked payments

**Add page:**
- Form fields: Client Name, Revenue Type (dropdown), Total Amount, Payment Method, Date, Notes
- On submit → create Firestore doc, set `paidAmount=0`, `remainingAmount=totalAmount`, `status="pending"`

---

### `/expenses` + `/expenses/add`
**List page:**
- Table: Category | Amount | Description | Reference | Date | Actions
- Filter by category and date range
- Monthly total shown at top

**Add page:**
- Form: Category (dropdown), Amount, Description, Reference number, Date

---

### `/employees`
- Cards grid showing each employee
- Each card: Name, Job Title, Hourly Rate, Status (active/inactive)
- Click → `/employees/:id` profile page
- Profile page shows: personal info, attendance summary this month, current petty cash balance, payroll history

**Add Employee modal:**
- Name (AR + EN), Job Title, Hourly Rate, Overtime Rate multiplier, Petty Cash Limit, Phone, Email, Start Date

---

### `/attendance`
- Table view with month selector
- Rows = employees, Columns = days of month
- Cell shows: P (present) / A (absent) / L (late) / H (half day)
- Click any cell → modal to enter/edit: Check-in time, Check-out time, Notes
- Auto-calculate `actualHours`, `overtimeHours`, `lateMinutes` on save
- Bottom row shows totals per employee

---

### `/payroll`
- Month selector at top
- Table: Employee | Work Hours | OT Hours | Gross | Deductions | OT Pay | **Net Salary** | Status
- "Generate Payroll" button → runs `calculatePayroll` for all active employees for selected month
- "Mark as Paid" button per row → updates `isPaid = true`
- Export button → print-friendly view

---

### `/petty-cash`
- Cards per employee showing: Name, Current Balance, Limit, Usage %
- Click employee → detail modal showing full transaction history
- Two action buttons per employee:
  - "تعبئة عهدة" (Top Up) → modal: amount, notes
  - "صرف من العهدة" (Spend) → modal: amount, category, purpose
- Real-time balance update

---

### `/payments` + `/payments/add`
**List page:**
- Table: Client | Revenue Type | Amount Paid | Payment Method | Date
- Filter by date range and method

**Add Payment page:**
- Search & select linked Revenue (autocomplete by client name)
- Show current: Total / Already Paid / Remaining
- Form: Amount (must not exceed remaining), Payment Method, Date, Notes
- On save → update parent revenue document automatically

---

### `/reports`
Four exportable report tabs:
1. **Monthly Financial Report** — revenues, expenses, net profit per month
2. **Employee Payroll Report** — all employees for a selected month
3. **Revenue Status Report** — all clients, payment status, overdue list
4. **Petty Cash Report** — all transactions per employee for a period

Each report has a **Print / Export** button that opens a clean print-friendly view.

---

### `/alerts`
- List of all active alerts with severity (high/medium/low)
- Overdue payments (> 30 days)
- Unpaid salaries
- Petty cash overdrawn warnings
- Mark individual alerts as "acknowledged"

---

### `/settings` (Admin only)
- Manage Users: list users, add new user with role, deactivate user
- System Settings: center name, default scheduled hours per day, currency symbol
- Expense categories management (add/remove custom categories)

---

## 🎨 UI/UX REQUIREMENTS

### Color Palette (CSS variables in `index.css`):
```css
:root {
  --primary:     #1B4F72;   /* deep blue */
  --primary-light: #2E86C1;
  --accent:      #F39C12;   /* warm amber */
  --success:     #27AE60;
  --danger:      #E74C3C;
  --warning:     #F1C40F;
  --bg:          #F4F6F9;
  --card:        #FFFFFF;
  --text:        #2C3E50;
  --text-muted:  #7F8C8D;
  --border:      #E8ECF0;
  --sidebar:     #1A2744;
  --sidebar-text:#ECF0F1;
}
```

### Layout:
- Fixed sidebar (260px wide) on the left — BUT since content is Arabic, the **main content flows RTL**
- Set `dir="rtl"` on `<html>` tag
- Sidebar stays on the right side visually in RTL
- Top navbar: shows current page title + user name + logout button
- All tables must be scrollable horizontally on small screens

### Components to build:
- `<KPICard>` — icon, label, value, trend arrow (up/down vs last month)
- `<StatusBadge>` — color-coded pill for payment status
- `<DataTable>` — sortable columns, pagination (10 rows per page), search
- `<Modal>` — centered overlay, closes on backdrop click or ESC
- `<ConfirmDialog>` — for delete actions
- `<DateRangePicker>` — two date inputs for filtering
- `<LoadingSpinner>` — centered, shown during async operations

---

## 🔥 FIREBASE SETUP INSTRUCTIONS

### `src/firebase/config.js`:
```js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  // PLACEHOLDER — user will fill their own config from Firebase Console
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
```

### Firestore Security Rules (provide as `firestore.rules`):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role == 'admin';
    }
    match /{collection}/{docId} {
      allow read, write: if request.auth != null
        && (
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
          || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'accountant'
        );
    }
  }
}
```

---

## 🌐 BILINGUAL (Arabic/English) REQUIREMENTS

- Use a `/constants/translations.js` file with all UI text in both languages
- Build a `useTranslation()` hook that reads from `AppContext` language setting
- Default language: **Arabic**
- Language toggle button in the navbar (AR / EN)
- All numbers formatted as Egyptian Pounds: `10,000 ج.م`
- All dates formatted: `DD/MM/YYYY`
- Arabic numerals are optional but keep standard numerals for consistency

---

## 🚀 BUILD ORDER — Follow this exact sequence

**Phase 1 — Foundation**
1. Vite + React project setup with Tailwind CSS
2. Firebase config + Firestore + Auth setup
3. AuthContext + ProtectedRoute
4. Sidebar + Navbar + PageWrapper layout
5. Login page

**Phase 2 — Core Data Modules**
6. Employees CRUD (needed by all other modules)
7. Revenues list + Add Revenue
8. Expenses list + Add Expense

**Phase 3 — Complex Modules**
9. Attendance log (table grid with click-to-edit)
10. Payroll calculation + sheet
11. Petty Cash system

**Phase 4 — Payments & Dashboard**
12. Payments + auto-update revenue status
13. Dashboard with real-time KPIs + charts

**Phase 5 — Reports & Polish**
14. Reports page with export
15. Alerts center
16. Settings page
17. Final RTL polish + responsive fixes

---

## ✅ QUALITY CHECKLIST

Before considering any module complete, verify:
- [ ] All Firestore operations use `try/catch` with Arabic error messages shown to user
- [ ] No hardcoded Arabic strings in JSX — all text comes from translations.js
- [ ] All forms validate before submit (required fields, number ranges)
- [ ] All delete actions require a confirmation dialog
- [ ] All monetary values display with `ج.م` suffix
- [ ] All timestamps use Firestore `serverTimestamp()` not `new Date()`
- [ ] Real-time listeners are cleaned up in `useEffect` return function
- [ ] No console.log left in production code
- [ ] All tables have empty-state UI when no data exists
- [ ] Loading spinners shown during all async operations

---

## 📦 PACKAGE.JSON DEPENDENCIES

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "firebase": "^10.8.0",
    "recharts": "^2.12.0",
    "tailwindcss": "^3.4.0",
    "@headlessui/react": "^1.7.18",
    "date-fns": "^3.3.1",
    "react-hot-toast": "^2.4.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.1.0",
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35"
  }
}
```

---

## ⚠️ IMPORTANT CONSTRAINTS

1. **No TypeScript** — plain JavaScript only
2. **No Redux** — use React Context + hooks only
3. **No paid libraries** — everything must be free/open source
4. **Firebase free tier only** — no Firebase Functions, no Blaze plan features
5. **Single page app** — all routing client-side via React Router
6. **RTL first** — design with Arabic RTL as the primary direction
7. **Transaction-based** — NEVER update a balance directly; always create a transaction document and compute the balance from the sum of transactions
8. **No direct Firestore writes from components** — all DB calls go through custom hooks in `/hooks/`

---

Start with **Phase 1**. After completing each phase, summarize what was built and wait for confirmation before proceeding to the next phase.
