import React, { useEffect, useState } from "react";
import { catalogService, Discount } from "../../services/catalogService";
import { Tag, Plus, Ticket, Loader2 } from "lucide-react";

export const DiscountsTab: React.FC = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE");
  const [value, setValue] = useState("10.00");
  const [minPurchaseAmount, setMinPurchaseAmount] = useState("1000.00");
  const [maxUsageCount, setMaxUsageCount] = useState<number>(100);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const data = await catalogService.getDiscounts();
      setDiscounts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await catalogService.createDiscount({
        code: code.toUpperCase(),
        name,
        discountType,
        value,
        minPurchaseAmount,
        maxUsageCount,
        isActive: true,
      });
      setShowModal(false);
      setCode("");
      setName("");
      fetchDiscounts();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#172554] flex items-center gap-2.5">
            <Tag className="h-6 w-6 text-[#2563EB]" />
            Promotional & Volume Discount Rules
          </h2>
          <p className="text-sm text-[#596579] mt-1">
            Configure coupons, volume discounts, usage caps, and order value thresholds.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-sm hover:shadow transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create Discount
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-[#596579] flex items-center justify-center gap-2 bg-white rounded-xl border border-[#E2E7EF] shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-[#2563EB]" />
          Loading discount rules...
        </div>
      ) : discounts.length === 0 ? (
        <div className="rounded-xl border border-[#E2E7EF] bg-white p-8 text-center text-[#596579] shadow-sm">
          No discount rules configured yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {discounts.map((d) => {
            const usagePercent = d.maxUsageCount
              ? Math.min(100, Math.round((d.currentUsageCount / d.maxUsageCount) * 100))
              : 0;

            return (
              <div
                key={d.id}
                className="rounded-xl border border-[#E2E7EF] bg-white p-5 space-y-4 hover:border-[#CBD5E1] transition shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#B91C1C]">
                      <Ticket className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-mono font-bold text-[#172554] tracking-wider">{d.code}</div>
                      <div className="text-xs text-[#596579]">{d.name}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F1F5F9] text-[#475569] border border-[#E2E7EF] font-mono">
                    {d.discountType}
                  </span>
                </div>

                <div className="pt-3 border-t border-[#E2E7EF] flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-black text-[#B91C1C] font-mono">
                      {d.discountType === "PERCENTAGE" ? `${Number(d.value)}%` : `₹${Number(d.value).toFixed(2)}`}
                    </span>
                    <span className="text-xs text-[#596579] ml-1.5 font-medium">OFF</span>
                  </div>
                  {d.minPurchaseAmount && (
                    <div className="text-[11px] text-[#596579] text-right">
                      Min Order: <span className="font-mono font-bold text-[#172554]">₹{Number(d.minPurchaseAmount).toFixed(0)}</span>
                    </div>
                  )}
                </div>

                {/* Usage Cap Progress Bar */}
                {d.maxUsageCount ? (
                  <div className="pt-3 border-t border-[#E2E7EF] space-y-1.5">
                    <div className="flex justify-between text-[11px] text-[#596579] font-mono">
                      <span>Redemptions</span>
                      <span className="font-semibold text-[#172554]">
                        {d.currentUsageCount} / {d.maxUsageCount} ({usagePercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#F1F5F9] border border-[#E2E7EF] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#2563EB] h-2 rounded-full transition-all"
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-[#E2E7EF] text-[11px] text-[#596579] font-mono">
                    Redemptions: <span className="font-semibold text-[#172554]">{d.currentUsageCount} (Unlimited)</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E2E7EF] rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h4 className="text-lg font-bold text-[#172554]">Create Discount Rule</h4>
            <form onSubmit={handleCreateDiscount} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#344054] font-semibold mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. FLASH25"
                    className="w-full p-2.5 bg-white border border-[#E2E7EF] rounded-lg text-[#202938] font-mono uppercase focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-[#344054] font-semibold mb-1">Type *</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as "PERCENTAGE" | "FIXED_AMOUNT")}
                    className="w-full p-2.5 bg-white border border-[#E2E7EF] rounded-lg text-[#202938] focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="PERCENTAGE">PERCENTAGE</option>
                    <option value="FIXED_AMOUNT">FIXED AMOUNT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#344054] font-semibold mb-1">Display Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Holiday Season Promotion"
                  className="w-full p-2.5 bg-white border border-[#E2E7EF] rounded-lg text-[#202938] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#344054] font-semibold mb-1">Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#E2E7EF] rounded-lg text-[#202938] font-mono focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-[#344054] font-semibold mb-1">Min Order (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={minPurchaseAmount}
                    onChange={(e) => setMinPurchaseAmount(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#E2E7EF] rounded-lg text-[#202938] font-mono focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-[#344054] font-semibold mb-1">Max Usages</label>
                  <input
                    type="number"
                    min="1"
                    value={maxUsageCount}
                    onChange={(e) => setMaxUsageCount(parseInt(e.target.value, 10))}
                    className="w-full p-2.5 bg-white border border-[#E2E7EF] rounded-lg text-[#202938] font-mono focus:outline-none focus:border-[#2563EB]"
                  />
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
                  {isSubmitting ? "Creating..." : "Create Discount"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
