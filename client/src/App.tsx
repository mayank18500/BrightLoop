import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";

// Layout Shells
import { AdminLayout } from "./layouts/AdminLayout";
import { StaffLayout } from "./layouts/StaffLayout";
import { CustomerLayout } from "./layouts/CustomerLayout";

// Module Views
import { OverviewTab } from "./pages/admin/OverviewTab";
import { ProductsTab } from "./pages/admin/ProductsTab";
import { PlansTab } from "./pages/admin/PlansTab";
import { TaxesTab } from "./pages/admin/TaxesTab";
import { DiscountsTab } from "./pages/admin/DiscountsTab";
import { StaffManagementTab } from "./pages/admin/StaffManagementTab";
import { CustomersTab } from "./pages/staff/CustomersTab";
import { QuotationsTab } from "./pages/staff/QuotationsTab";
import { SubscriptionsTab } from "./pages/staff/SubscriptionsTab";
import { InvoicesTab } from "./pages/staff/InvoicesTab";
import { PaymentsTab } from "./pages/staff/PaymentsTab";
import { CustomerPortal } from "./pages/customer/CustomerPortal";
import { ReportsTab } from "./pages/admin/ReportsTab";
import { SettingsTab } from "./pages/admin/SettingsTab";

const RootNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCFCFA] flex items-center justify-center text-[#758096]">
        <div className="h-6 w-6 border-2 border-[#4169E1] border-t-transparent rounded-full animate-spin mr-3" />
        <span className="text-sm font-medium">Loading BrightLoop...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "ADMIN") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user.role === "STAFF") {
    return <Navigate to="/staff/dashboard" replace />;
  }

  return <Navigate to="/portal/overview" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication */}
          <Route path="/" element={<RootNavigator />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ========================================================= */}
          {/* 1. ADMIN DASHBOARD & WORKSPACE                            */}
          {/* ========================================================= */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<OverviewTab />} />
            <Route path="customers" element={<CustomersTab />} />
            <Route path="products" element={<ProductsTab />} />
            <Route path="plans" element={<PlansTab />} />
            <Route path="quotations" element={<QuotationsTab />} />
            <Route path="subscriptions" element={<SubscriptionsTab />} />
            <Route path="invoices" element={<InvoicesTab />} />
            <Route path="payments" element={<PaymentsTab />} />
            <Route path="discounts" element={<DiscountsTab />} />
            <Route path="taxes" element={<TaxesTab />} />
            <Route path="reports" element={<ReportsTab />} />
            <Route path="staff" element={<StaffManagementTab />} />
            <Route path="settings" element={<SettingsTab />} />
          </Route>

          {/* ========================================================= */}
          {/* 2. STAFF OPERATIONS WORKSPACE                              */}
          {/* ========================================================= */}
          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRoles={["STAFF", "ADMIN"]}>
                <StaffLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<OverviewTab />} />
            <Route path="customers" element={<CustomersTab />} />
            <Route path="quotations" element={<QuotationsTab />} />
            <Route path="subscriptions" element={<SubscriptionsTab />} />
            <Route path="invoices" element={<InvoicesTab />} />
            <Route path="payments" element={<PaymentsTab />} />
          </Route>

          {/* ========================================================= */}
          {/* 3. CUSTOMER SELF-SERVICE PORTAL                           */}
          {/* ========================================================= */}
          <Route
            path="/portal"
            element={
              <ProtectedRoute allowedRoles={["CUSTOMER"]}>
                <CustomerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<CustomerPortal embedded tab="overview" />} />
            <Route path="quotations" element={<CustomerPortal embedded tab="proposals" />} />
            <Route path="subscriptions" element={<CustomerPortal embedded tab="subscriptions" />} />
            <Route path="invoices" element={<CustomerPortal embedded tab="invoices" />} />
            <Route path="payments" element={<CustomerPortal embedded tab="payments" />} />
            <Route path="profile" element={<CustomerPortal embedded tab="overview" />} />
          </Route>

          {/* Fallback Catch-All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
