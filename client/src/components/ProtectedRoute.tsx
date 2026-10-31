import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Role } from "../types/auth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // 1. Authentication verification in-flight
  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-[#FCFCFA] flex flex-col items-center justify-center text-[#596579]"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
          <p className="text-sm font-semibold text-[#172554]">Verifying session credentials...</p>
          <span className="text-xs text-[#596579]">Connecting to BrightLoop security gateway</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated user: redirect cleanly to login without flashing protected views
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Role-based authorization enforcement
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
    if (user.role === "STAFF") return <Navigate to="/staff" replace />;
    return <Navigate to="/portal" replace />;
  }

  // 4. Authenticated & authorized
  return <>{children}</>;
};
