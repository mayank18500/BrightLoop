import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Building2,
  LogOut,
  Layers,
  FileText,
  CreditCard,
  User,
  MapPin,
  Receipt,
  Mail,
  Phone,
} from "lucide-react";

export const CustomerPortal: React.FC = () => {
  const { user, customer, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/20">
            BL
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-white leading-none">BrightLoop</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                CUSTOMER PORTAL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {customer?.companyName || "Commercial Client Workspace"}
            </p>
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
            My Services
          </div>
          {[
            { id: "overview", label: "Account Overview", icon: Building2 },
            { id: "subscriptions", label: "My Subscriptions", icon: Layers },
            { id: "invoices", label: "My Invoices", icon: FileText },
            { id: "payments", label: "Payment History", icon: CreditCard },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Customer Portal</h2>
              <p className="text-xs text-slate-400 mt-1">
                View your active software contracts, recurring renewals, and invoice settlement history.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Verified Client
            </span>
          </div>

          {/* Customer Profile Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-400" />
              Registered Commercial Entity
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-lg border border-slate-800 bg-slate-950/60 space-y-2">
                <div className="flex items-center gap-2 text-slate-400 font-medium">
                  <User className="h-4 w-4 text-slate-500" />
                  Contact Person
                </div>
                <div className="text-sm font-semibold text-white">{customer?.contactName || user?.name}</div>
                <div className="flex items-center gap-2 text-slate-400 pt-1">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  {customer?.email || user?.email}
                </div>
                {customer?.phone && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone className="h-3.5 w-3.5 text-slate-500" />
                    {customer.phone}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-lg border border-slate-800 bg-slate-950/60 space-y-2">
                <div className="flex items-center gap-2 text-slate-400 font-medium">
                  <Receipt className="h-4 w-4 text-slate-500" />
                  Billing & Tax Details
                </div>
                <div className="text-sm font-semibold text-white">{customer?.companyName}</div>
                <div className="text-slate-400 pt-1">
                  Tax / GST ID: <span className="font-mono text-slate-300">{customer?.taxId || "Not Registered"}</span>
                </div>
                <div className="flex items-start gap-2 text-slate-400 pt-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span>{customer?.billingAddress || "No billing address provided"}</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
