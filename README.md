# Rehab Center Management System 🏥

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-latest-646CFF?logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-latest-FFCA28?logo=firebase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?logo=tailwind-css&logoColor=white)

A comprehensive, cloud-based ERP and management system built specifically for Rehabilitation and Therapy Centers. This system streamlines daily operations, financial tracking, HR management, and reporting into a single, beautiful, and bilingual interface.

---

## ✨ Key Features

### 👥 Human Resources & Payroll
* **Employee Management:** Complete CRUD operations for staff, including hourly rates, overtime multipliers, and petty cash limits.
* **Attendance Tracking:** Daily logging of check-ins, check-outs, half-days, and absences with automatic work-hour and overtime calculation.
* **Automated Payroll:** Automatically generates monthly payroll sheets based on attendance records.
* **Advances & Loans:** Native support for employee salary advances (السلف), automatically deducted during payroll generation.
* **Partial Salary Payments:** Support for paying salaries in installments, with automatic ledger updates.

### 💰 Financial Management
* **Revenues & Billing:** Track center revenues across multiple categories (Therapy Sessions, Assessments, Monthly Fees).
* **Payment Tracking:** Handle partial and full payments from clients against outstanding revenues.
* **Petty Cash (العهدة):** Robust system to manage employee petty cash limits, top-ups (تعبئة), and usage tracking with real-time progress bars.
* **Expenses:** Log operational expenses (Rent, Maintenance, Supplies) to maintain accurate cash flow records.

### 📊 Analytics & Reporting
* **Dynamic Dashboard:** Real-time KPIs showing monthly revenues, expenses, active employees, and overdue payment alerts.
* **Financial Reports:** Generate detailed financial summaries and export data to CSV (Excel compatible with Arabic UTF-8 BOM).

### 🛡️ Security & Architecture
* **Role-Based Access Control:** Strict Firebase security rules ensuring only authenticated administrators can access or modify business data.
* **Real-time Sync:** Powered by Firebase Cloud Firestore for instantaneous updates across multiple clients.

---

## 🛠️ Technology Stack

* **Frontend Framework:** React 18
* **Build Tool:** Vite
* **Styling:** Tailwind CSS & Custom CSS variables for robust theming (Light/Dark mode ready).
* **Backend / Database:** Firebase Cloud Firestore
* **Authentication:** Firebase Auth
* **Icons:** Lucide React
* **Date Manipulation:** `date-fns`
* **Notifications:** `react-hot-toast`

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v16 or higher)
* NPM or Yarn
* A Firebase Project with Firestore and Authentication enabled.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/rehab-center-erp.git
   cd rehab-center-erp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Deploy Firebase Rules:**
   Ensure you copy the contents of `firestore.rules` and paste them into your Firebase Console to secure your database.

---

## 📖 User Guide
For detailed instructions on how to use the application, please refer to the [USER_GUIDE.md](./USER_GUIDE.md) document included in this repository.

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/your-username/rehab-center-erp/issues).

## 📄 License
This project is licensed under the MIT License.
