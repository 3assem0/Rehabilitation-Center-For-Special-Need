import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Strictly protects routes for Admin access only.
 */
const ProtectedRoute = ({ children }) => {
  const { currentUser, userData, loading, roleError } = useAuth();
  const location = useLocation();

  // 1. Initial State: Always wait for Firebase to check the token
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary font-bold">جاري التحقق | Verifying...</p>
        </div>
      </div>
    );
  }

  // 2. Not Logged In: Send to Login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Logged In but Config Issue (Role Missing): Send back with error
  if (currentUser && roleError) {
    console.error("Access Denied: UID linked but Role missing/incorrect in Firestore.");
    return <Navigate to="/login" state={{ from: location, error: roleError }} replace />;
  }

  // 4. Role Guard: Non-admins
  if (userData && userData.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
