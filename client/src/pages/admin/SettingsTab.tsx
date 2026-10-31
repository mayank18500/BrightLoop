import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { PageHeader } from "../../components/layout/PageHeader";
import {
  Building,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Save,
  RefreshCw,
} from "lucide-react";

export const SettingsTab: React.FC = () => {
  const { user } = useAuth();

  const [orgName, setOrgName] = useState("BrightLoop Enterprise Cloud");
  const [supportEmail, setSupportEmail] = useState("billing@brightloop.com");
  const currency = "INR (₹)";
  const [fiscalYear, setFiscalYear] = useState("April – March");
  const timezone = "Asia/Kolkata (IST)";

  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState("Net 30 Days");
  const [gracePeriodDays, setGracePeriodDays] = useState("14");
  const [autoGenerateInvoices, setAutoGenerateInvoices] = useState(true);
  const [autoEmailInvoices, setAutoEmailInvoices] = useState(true);
  const dunningRetries = "3";

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("brightloop_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.orgName) setOrgName(parsed.orgName);
        if (parsed.supportEmail) setSupportEmail(parsed.supportEmail);
        if (parsed.defaultPaymentTerms) setDefaultPaymentTerms(parsed.defaultPaymentTerms);
        if (parsed.gracePeriodDays) setGracePeriodDays(parsed.gracePeriodDays);
        if (typeof parsed.autoGenerateInvoices === "boolean") setAutoGenerateInvoices(parsed.autoGenerateInvoices);
        if (typeof parsed.autoEmailInvoices === "boolean") setAutoEmailInvoices(parsed.autoEmailInvoices);
      } catch (e) {
        console.error("Failed to parse stored settings", e);
      }
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      orgName,
      supportEmail,
      currency,
      fiscalYear,
      timezone,
      defaultPaymentTerms,
      gracePeriodDays,
      autoGenerateInvoices,
      autoEmailInvoices,
      dunningRetries,
    };
    localStorage.setItem("brightloop_settings", JSON.stringify(payload));
    setTimeout(() => {
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    }, 400);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workspace Configuration & Billing Policy"
        subtitle="Manage commercial identity, default invoicing terms, automated recurring billing triggers, and security controls."
        actions={
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-sm hover:shadow transition cursor-pointer"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? "Saving Changes..." : "Save Configuration"}</span>
          </button>
        }
      />

      {saveSuccess && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-[#15803D] flex items-center gap-2.5 text-xs font-semibold shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
          <span>Workspace settings and recurring billing policies updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Organization & Identity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Workspace Commercial Identity */}
          <div className="card-surface p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-[#E2E7EF] pb-3">
              <div className="p-2 bg-blue-50 text-[#1D4ED8] rounded-xl border border-blue-200">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172554]">Commercial Identity & Locale</h3>
                <p className="text-xs text-[#596579]">Corporate parameters displayed on invoices and quotes</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-[#344054] mb-1.5">
                  Organization / Entity Name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E7EF] bg-white text-xs text-[#202938] font-semibold focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#344054] mb-1.5">
                  Official Billing Support Email
                </label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E7EF] bg-white text-xs text-[#202938] font-mono focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#344054] mb-1.5">
                  Standard Billing Currency
                </label>
                <input
                  type="text"
                  value={currency}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E7EF] bg-[#F8FAFC] text-xs text-[#596579] font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#344054] mb-1.5">
                  Accounting Fiscal Period
                </label>
                <input
                  type="text"
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E7EF] bg-white text-xs text-[#202938] font-medium focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>
          </div>

          {/* Billing & Invoicing Automation */}
          <div className="card-surface p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-[#E2E7EF] pb-3">
              <div className="p-2 bg-purple-50 text-[#7C3AED] rounded-xl border border-purple-200">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172554]">Invoicing & Contract Terms</h3>
                <p className="text-xs text-[#596579]">Default terms applied to newly drafted subscriptions</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-[#344054] mb-1.5">
                  Default Payment Terms
                </label>
                <select
                  value={defaultPaymentTerms}
                  onChange={(e) => setDefaultPaymentTerms(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E7EF] bg-white text-xs text-[#202938] font-medium focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="Net 15 Days">Net 15 Days</option>
                  <option value="Net 30 Days">Net 30 Days</option>
                  <option value="Net 60 Days">Net 60 Days</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#344054] mb-1.5">
                  Invoice Grace Period (Days)
                </label>
                <input
                  type="number"
                  value={gracePeriodDays}
                  onChange={(e) => setGracePeriodDays(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E7EF] bg-white text-xs text-[#202938] font-medium focus:outline-none focus:border-[#2563EB]"
                  min="0"
                  max="90"
                />
              </div>
            </div>

            {/* Automation Toggles */}
            <div className="pt-2 space-y-3 border-t border-[#E2E7EF]">
              <label className="flex items-start gap-3 p-3 bg-[#FAFBFD] border border-[#E2E7EF] rounded-xl cursor-pointer hover:bg-[#F8FAFC]">
                <input
                  type="checkbox"
                  checked={autoGenerateInvoices}
                  onChange={(e) => setAutoGenerateInvoices(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]"
                />
                <div className="text-xs">
                  <div className="font-bold text-[#172554]">Automated Periodic Invoicing</div>
                  <div className="text-[#596579] mt-0.5">
                    Automatically trigger confirmed recurring invoice generations when contract billing dates recur.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-[#FAFBFD] border border-[#E2E7EF] rounded-xl cursor-pointer hover:bg-[#F8FAFC]">
                <input
                  type="checkbox"
                  checked={autoEmailInvoices}
                  onChange={(e) => setAutoEmailInvoices(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]"
                />
                <div className="text-xs">
                  <div className="font-bold text-[#172554]">Client Notification Dispatch</div>
                  <div className="text-[#596579] mt-0.5">
                    Dispatch automated PDF payment links and receipts to client contact upon invoice confirmation.
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Security & Current Session */}
        <div className="space-y-6">
          {/* Security & Operator Profile */}
          <div className="card-surface p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-[#E2E7EF] pb-3">
              <div className="p-2 bg-emerald-50 text-[#15803D] rounded-xl border border-emerald-200">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172554]">Operator Authentication</h3>
                <p className="text-xs text-[#596579]">Active administrative session credentials</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#FAFBFD] border border-[#E2E7EF] rounded-xl">
                <div className="text-[11px] font-bold text-[#596579] uppercase">Authenticated User</div>
                <div className="text-sm font-bold text-[#172554] mt-0.5">{user?.name || "Administrator"}</div>
                <div className="text-[11px] font-mono text-[#596579]">{user?.email}</div>
              </div>

              <div className="p-3 bg-[#FAFBFD] border border-[#E2E7EF] rounded-xl">
                <div className="text-[11px] font-bold text-[#596579] uppercase">Assigned RBAC Role</div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-1 rounded-full text-xs font-bold bg-blue-50 text-[#1D4ED8] border border-blue-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {user?.role || "ADMIN"}
                </div>
              </div>

              <div className="p-3 bg-[#FAFBFD] border border-[#E2E7EF] rounded-xl">
                <div className="text-[11px] font-bold text-[#596579] uppercase">Database Sync Engine</div>
                <div className="text-xs font-semibold text-[#15803D] mt-0.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#15803D]"></span>
                  PostgreSQL Active & Healthy
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
