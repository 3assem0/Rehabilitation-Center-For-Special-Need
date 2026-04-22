import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ErrorBoundary from "./components/common/ErrorBoundary";
import Login from "./pages/auth/Login";

// Real Pages
import Dashboard from "./pages/dashboard/Dashboard";
import EmployeesList from "./pages/employees/EmployeesList";
import EmployeeProfile from "./pages/employees/EmployeeProfile";
import RevenuesList from "./pages/revenues/RevenuesList";
import ExpensesList from "./pages/expenses/ExpensesList";
import AttendanceLog from "./pages/attendance/AttendanceLog";
import PayrollSheet from "./pages/payroll/PayrollSheet";
import PettyCash from "./pages/petty-cash/PettyCash";
import PaymentsList from "./pages/payments/PaymentsList";
import Reports from "./pages/reports/Reports";
import Alerts from "./pages/alerts/Alerts";
import Settings from "./pages/settings/Settings";

/**
 * Main Application Routing.
 * Wrapped in an ErrorBoundary to catch and diagnose any runtime crashes.
 */
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              {/* All routes are strictly Admin-only with a loading guard */}
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/revenues" element={<ProtectedRoute><RevenuesList /></ProtectedRoute>} />
              <Route path="/expenses" element={<ProtectedRoute><ExpensesList /></ProtectedRoute>} />
              <Route path="/employees" element={<ProtectedRoute><EmployeesList /></ProtectedRoute>} />
              <Route path="/employees/:id" element={<ProtectedRoute><EmployeeProfile /></ProtectedRoute>} />
              <Route path="/attendance" element={<ProtectedRoute><AttendanceLog /></ProtectedRoute>} />
              <Route path="/payroll" element={<ProtectedRoute><PayrollSheet /></ProtectedRoute>} />
              <Route path="/petty-cash" element={<ProtectedRoute><PettyCash /></ProtectedRoute>} />
              <Route path="/payments" element={<ProtectedRoute><PaymentsList /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              
            </Routes>
          </Router>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
