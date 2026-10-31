import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  LogOut,
  Building,
  FileText,
  CreditCard,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { QuotationsTab } from "./QuotationsTab";
import { SubscriptionsTab } from "./SubscriptionsTab";
import { InvoicesTab } from "./InvoicesTab";
import { PaymentsTab } from "./PaymentsTab";
import { CustomersTab } from "./CustomersTab";

export const StaffDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("quotations");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            BL
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-white leading-none">BrightLoop</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                STAFF OPERATIONS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Operational Customer & Contract Workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <div className="text-xs font-semibold text-white">{user?.name}</div>
            <div className="text-[11px] text-slate-400">{user?.email}</div>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 font-medium transition cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5 text-slate-400" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex">
        {/* Sidebar Nav */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/40 p-4 space-y-1 hidden md:block">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Operations
          </div>
          {[
            { id: "overview", label: "Overview", icon: TrendingUp },
            { id: "customers", label: "Customers", icon: Building },
            { id: "quotations", label: "Quotations", icon: FileText },
            { id: "subscriptions", label: "Subscriptions", icon: ShieldCheck },
            { id: "invoices", label: "Invoices", icon: FileText },
            { id: "payments", label: "Record Payment", icon: CreditCard },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </aside>

        {/* Workspace Body */}
        <main className="flex-1 p-6 md:p-8 space-y-6">
          {activeTab === "customers" && <CustomersTab />}
          {activeTab === "quotations" && <QuotationsTab />}
          {activeTab === "subscriptions" && <SubscriptionsTab />}
          {activeTab === "invoices" && <InvoicesTab />}
          {activeTab === "payments" && <PaymentsTab />}

          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Staff Operations Center</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage day-to-day customer quotations, activate subscriptions, issue invoices, and record incoming payments.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Staff Active Session
                </span>
              </div>

              {/* User Session Profile Card */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
                <h3 className="text-base font-semibold text-white">Staff Member Credentials</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/60">
                    <div className="text-slate-500 mb-1">User ID:</div>
                    <div className="text-slate-200 truncate">{user?.id}</div>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/60">
                    <div className="text-slate-500 mb-1">Email:</div>
                    <div className="text-slate-200">{user?.email}</div>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/60">
                    <div className="text-slate-500 mb-1">Assigned Role:</div>
                    <div className="text-blue-400 font-bold">{user?.role}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab !== "quotations" && activeTab !== "subscriptions" && activeTab !== "overview" && (
            <div className="p-12 text-center border border-slate-800 rounded-xl bg-slate-900/30">
              <h3 className="text-sm font-semibold text-slate-300 capitalize">{activeTab} Management</h3>
              <p className="text-xs text-slate-500 mt-1">Select Quotations from the left navigation to work with proposals and contract conversions.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
