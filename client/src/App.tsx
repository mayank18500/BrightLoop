import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { StaffDashboard } from "./pages/staff/StaffDashboard";
import { CustomerPortal } from "./pages/customer/CustomerPortal";

const RootNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
        Loading BrightLoop...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  if (user.role === "STAFF") {
    return <Navigate to="/staff" replace />;
  }

  return <Navigate to="/portal" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootNavigator />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Staff Protected Routes */}
          <Route
            path="/staff/*"
            element={
              <ProtectedRoute allowedRoles={["STAFF", "ADMIN"]}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />

          {/* Customer Portal Protected Routes */}
          <Route
            path="/portal/*"
            element={
              <ProtectedRoute allowedRoles={["CUSTOMER"]}>
                <CustomerPortal />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
