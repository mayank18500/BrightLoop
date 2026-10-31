import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  ShieldAlert,
  LogOut,
  Users,
  Package,
  Layers,
  FileText,
  CreditCard,
  Percent,
  TrendingUp,
  Settings,
  Building,
} from "lucide-react";

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

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
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                ADMIN CONSOLE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Enterprise Subscription & Billing Management</p>
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
            { id: "staff", label: "Staff Management", icon: Users },
            { id: "customers", label: "Customers", icon: Building },
            { id: "products", label: "Products & Variants", icon: Package },
            { id: "plans", label: "Subscription Plans", icon: Layers },
            { id: "quotations", label: "Quotations", icon: FileText },
            { id: "subscriptions", label: "Subscriptions", icon: ShieldAlert },
            { id: "invoices", label: "Invoices", icon: FileText },
            { id: "payments", label: "Payments", icon: CreditCard },
            { id: "taxes", label: "Taxes & Discounts", icon: Percent },
            { id: "settings", label: "Settings", icon: Settings },
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Administrator Overview
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Full authority access for products, subscription plans, staff accounts, and financial controls.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Authenticated Session Active
              </span>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
              <div className="text-xs font-medium text-slate-400">Total Active Subscriptions</div>
              <div className="text-2xl font-bold text-white">0</div>
              <div className="text-[11px] text-slate-500">Live recurring contracts</div>
            </div>
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
              <div className="text-xs font-medium text-slate-400">Total Revenue Received</div>
              <div className="text-2xl font-bold text-emerald-400">₹0.00</div>
              <div className="text-[11px] text-slate-500">Settled payments</div>
            </div>
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
              <div className="text-xs font-medium text-slate-400">Outstanding Invoices</div>
              <div className="text-2xl font-bold text-amber-400">₹0.00</div>
              <div className="text-[11px] text-slate-500">Pending customer balance</div>
            </div>
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
              <div className="text-xs font-medium text-slate-400">System Role</div>
              <div className="text-2xl font-bold text-blue-400">ADMIN</div>
              <div className="text-[11px] text-slate-500">Unlimited permission level</div>
            </div>
          </div>

          {/* User Session Profile Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h3 className="text-base font-semibold text-white">Current Session Identity</h3>
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
        </main>
      </div>
    </div>
  );
};
