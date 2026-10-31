import React, { useEffect, useState } from "react";
import { catalogService, Plan } from "../../services/catalogService";
import { Layers, Plus, CheckCircle2, PauseCircle, RefreshCw, XCircle, Loader2 } from "lucide-react";

export const PlansTab: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("2000.00");
  const [billingFrequency, setBillingFrequency] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY">("MONTHLY");
  const [billingInterval, setBillingInterval] = useState(1);
  const [minQuantity, setMinQuantity] = useState(1);
  const [allowPause, setAllowPause] = useState(true);
  const [allowEarlyClosure, setAllowEarlyClosure] = useState(true);
  const [allowRenewal, setAllowRenewal] = useState(true);
  const [autoCloseOnExpiry, setAutoCloseOnExpiry] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await catalogService.getPlans();
      setPlans(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await catalogService.createPlan({
        name,
        description,
        price,
        billingFrequency,
        billingInterval,
        minQuantity,
        allowPause,
        allowEarlyClosure,
        allowRenewal,
        autoCloseOnExpiry,
        isActive: true,
      });
      setShowModal(false);
      setName("");
      setDescription("");
      fetchPlans();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#172554] flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-[#2563EB]" />
            Subscription Agreements & Billing Plans
          </h2>
          <p className="text-sm text-[#596579] mt-1">
            Define recurring agreement policies: frequency, interval counts, pause rights, and renewal permissions.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-sm hover:shadow transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create Plan
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-[#596579] flex items-center justify-center gap-2 bg-white rounded-xl border border-[#E2E7EF] shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-[#2563EB]" />
          Loading subscription plans...
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-xl border border-[#E2E7EF] bg-white p-8 text-center text-[#596579] shadow-sm">
          No subscription plans configured yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-xl border border-[#E2E7EF] bg-white p-5 space-y-4 hover:border-[#CBD5E1] transition shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-bold text-[#172554]">{plan.name}</h4>
                  <p className="text-xs text-[#596579] mt-0.5 line-clamp-2">
                    {plan.description || "Recurring software agreement"}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-[#1D4ED8] border border-blue-200 uppercase font-mono">
                  {plan.billingFrequency}
                </span>
              </div>

              <div className="pt-3 border-t border-[#E2E7EF] flex items-baseline gap-1">
                <span className="text-2xl font-black text-[#172554] font-mono">
                  ₹{Number(plan.price).toFixed(2)}
                </span>
                <span className="text-xs text-[#596579]">
                  / every {plan.billingInterval} {plan.billingFrequency.toLowerCase().replace("ly", "(s)")}
                </span>
              </div>

              {/* Policy Badges */}
              <div className="pt-3 border-t border-[#E2E7EF] space-y-2 text-xs">
                <div className="text-[11px] font-bold text-[#596579] uppercase tracking-wider">
                  Agreement Lifecycle Policies
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className={`flex items-center gap-1.5 font-medium ${plan.allowPause ? "text-[#15803D]" : "text-[#94A3B8]"}`}>
                    <PauseCircle className="h-3.5 w-3.5" />
                    Pause: {plan.allowPause ? "Allowed" : "No"}
                  </div>
                  <div className={`flex items-center gap-1.5 font-medium ${plan.allowRenewal ? "text-[#15803D]" : "text-[#94A3B8]"}`}>
                    <RefreshCw className="h-3.5 w-3.5" />
                    Renewal: {plan.allowRenewal ? "Allowed" : "No"}
                  </div>
                  <div className={`flex items-center gap-1.5 font-medium ${plan.allowEarlyClosure ? "text-[#15803D]" : "text-[#94A3B8]"}`}>
                    <XCircle className="h-3.5 w-3.5" />
                    Early Close: {plan.allowEarlyClosure ? "Allowed" : "No"}
                  </div>
                  <div className="flex items-center gap-1.5 text-[#263247] font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#2563EB]" />
                    Min Qty: {plan.minQuantity}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Plan Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E2E7EF] rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <h4 className="text-lg font-bold text-[#172554]">Create Subscription Plan</h4>
            <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#344054] font-semibold mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Enterprise Annual Growth"
                  className="w-full p-2.5 bg-white border border-[#E2E7EF] rounded-lg text-[#202938] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-[#344054] font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#E2E7EF] rounded-lg text-[#202938] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-[#344054] font-semibold mb-1">Base Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#E2E7EF] rounded-lg text-[#202938] font-mono focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-[#344054] font-semibold mb-1">Frequency *</label>
                  <select
                    value={billingFrequency}
                    onChange={(e) =>
                      setBillingFrequency(e.target.value as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY")
                    }
                    className="w-full p-2.5 bg-white border border-[#E2E7EF] rounded-lg text-[#202938] focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="DAILY">DAILY</option>
                    <option value="WEEKLY">WEEKLY</option>
                    <option value="MONTHLY">MONTHLY</option>
                    <option value="YEARLY">YEARLY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#344054] font-semibold mb-1">Interval *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={billingInterval}
                    onChange={(e) => setBillingInterval(parseInt(e.target.value, 10))}
                    className="w-full p-2.5 bg-white border border-[#E2E7EF] rounded-lg text-[#202938] font-mono focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-[#344054] font-semibold mb-1">Min Qty *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(parseInt(e.target.value, 10))}
                    className="w-full p-2.5 bg-white border border-[#E2E7EF] rounded-lg text-[#202938] font-mono focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              {/* Lifecycle Permission Checkboxes */}
              <div className="space-y-2 pt-2 border-t border-[#E2E7EF]">
                <span className="font-bold text-[#172554] block">Lifecycle Policies</span>
                <div className="grid grid-cols-2 gap-2 text-[#263247]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowPause}
                      onChange={(e) => setAllowPause(e.target.checked)}
                      className="rounded text-[#2563EB]"
                    />
                    Allow Pause Operation
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowRenewal}
                      onChange={(e) => setAllowRenewal(e.target.checked)}
                      className="rounded text-[#2563EB]"
                    />
                    Allow Contract Renewal
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowEarlyClosure}
                      onChange={(e) => setAllowEarlyClosure(e.target.checked)}
                      className="rounded text-[#2563EB]"
                    />
                    Allow Early Closure
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoCloseOnExpiry}
                      onChange={(e) => setAutoCloseOnExpiry(e.target.checked)}
                      className="rounded text-[#2563EB]"
                    />
                    Auto-Close on Expiry
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E2E7EF]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#E2E7EF] text-[#596579] hover:bg-[#F8FAFC] font-semibold text-xs cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs shadow-sm hover:shadow transition cursor-pointer"
                >
                  {isSubmitting ? "Creating..." : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
