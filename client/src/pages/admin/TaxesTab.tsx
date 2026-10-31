import React, { useEffect, useState } from "react";
import { catalogService, TaxRule } from "../../services/catalogService";
import { Percent, Plus, CheckCircle2, Star, Loader2 } from "lucide-react";

export const TaxesTab: React.FC = () => {
  const [taxes, setTaxes] = useState<TaxRule[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [taxRate, setTaxRate] = useState("18.00");
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTaxes = async () => {
    try {
      setLoading(true);
      const data = await catalogService.getTaxes();
      setTaxes(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxes();
  }, []);

  const handleCreateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await catalogService.createTax({
        name,
        taxRate,
        taxType: "PERCENTAGE",
        isDefault,
        isActive: true,
      });
      setShowModal(false);
      setName("");
      setIsDefault(false);
      fetchTaxes();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Percent className="h-5 w-5 text-emerald-400" />
            Tax Configuration & Jurisdiction Rules
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Define automated tax rules applied during invoice calculations using exact Decimal arithmetic.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Tax Rule
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          Loading tax rules...
        </div>
      ) : taxes.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400">
          No tax rules configured yet.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Tax Name</th>
                <th className="py-3 px-4 font-semibold">Tax Rate</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Default Rule</th>
                <th className="py-3 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {taxes.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-semibold text-white">{t.name}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-sm">
                    {Number(t.taxRate).toFixed(2)}%
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-mono">{t.taxType}</td>
                  <td className="py-3.5 px-4">
                    {t.isDefault ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Star className="h-3 w-3 fill-amber-400" /> System Default
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">No</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h4 className="text-lg font-bold text-white">Create Tax Rule</h4>
            <form onSubmit={handleCreateTax} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Tax Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. GST 18% or VAT 5%"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Tax Rate (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded"
                />
                Set as Default Tax Rule for all new invoices
              </label>

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
                  {isSubmitting ? "Saving..." : "Save Tax Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
