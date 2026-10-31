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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Tag className="h-5 w-5 text-rose-400" />
            Promotional & Volume Discount Rules
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Configure coupons, volume discounts, usage caps, and order value thresholds.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Create Discount
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          Loading discount rules...
        </div>
      ) : discounts.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400">
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
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 hover:border-slate-700 transition shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                      <Ticket className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-mono font-bold text-white tracking-wider">{d.code}</div>
                      <div className="text-xs text-slate-400">{d.name}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 font-mono">
                    {d.discountType}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-extrabold text-rose-400 font-mono">
                      {d.discountType === "PERCENTAGE" ? `${Number(d.value)}%` : `₹${Number(d.value).toFixed(2)}`}
                    </span>
                    <span className="text-xs text-slate-400 ml-1.5">OFF</span>
                  </div>
                  {d.minPurchaseAmount && (
                    <div className="text-[11px] text-slate-400 text-right">
                      Min Order: <span className="font-mono text-white">₹{Number(d.minPurchaseAmount).toFixed(0)}</span>
                    </div>
                  )}
                </div>

                {/* Usage Cap Progress Bar */}
                {d.maxUsageCount ? (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>Redemptions</span>
                      <span>
                        {d.currentUsageCount} / {d.maxUsageCount} ({usagePercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
                    Redemptions: {d.currentUsageCount} (Unlimited)
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h4 className="text-lg font-bold text-white">Create Discount Rule</h4>
            <form onSubmit={handleCreateDiscount} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. FLASH25"
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Type *</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as "PERCENTAGE" | "FIXED_AMOUNT")}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  >
                    <option value="PERCENTAGE">PERCENTAGE</option>
                    <option value="FIXED_AMOUNT">FIXED AMOUNT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Display Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Holiday Season Promotion"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Min Order (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={minPurchaseAmount}
                    onChange={(e) => setMinPurchaseAmount(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Max Usages</label>
                  <input
                    type="number"
                    min="1"
                    value={maxUsageCount}
                    onChange={(e) => setMaxUsageCount(parseInt(e.target.value, 10))}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer"
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
