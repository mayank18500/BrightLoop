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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#172554] flex items-center gap-2.5">
            <Percent className="h-6 w-6 text-[#2563EB]" />
            Tax Configuration & Jurisdiction Rules
          </h2>
          <p className="text-sm text-[#596579] mt-1">
            Define automated tax rules applied during invoice calculations using exact Decimal arithmetic.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-sm hover:shadow transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Tax Rule
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-[#596579] flex items-center justify-center gap-2 bg-white rounded-xl border border-[#E2E7EF] shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-[#2563EB]" />
          Loading tax rules...
        </div>
      ) : taxes.length === 0 ? (
        <div className="rounded-xl border border-[#E2E7EF] bg-white p-8 text-center text-[#596579] shadow-sm">
          No tax rules configured yet.
        </div>
      ) : (
        <div className="rounded-xl border border-[#E2E7EF] bg-white overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#344054] font-bold uppercase tracking-wider text-[11px] border-b border-[#E2E7EF]">
              <tr>
                <th className="py-3 px-4">Tax Name</th>
                <th className="py-3 px-4">Tax Rate</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Default Rule</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E7EF] text-[#263247]">
              {taxes.map((t) => (
                <tr key={t.id} className="hover:bg-[#F8FAFC] transition">
                  <td className="py-3.5 px-4 font-semibold text-[#172554]">{t.name}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-[#15803D] text-sm">
                    {Number(t.taxRate).toFixed(2)}%
                  </td>
                  <td className="py-3.5 px-4 text-[#596579] font-mono">{t.taxType}</td>
                  <td className="py-3.5 px-4">
                    {t.isDefault ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-[#B45309] border border-amber-200">
                        <Star className="h-3 w-3 fill-[#B45309]" /> System Default
                      </span>
                    ) : (
                      <span className="text-[#6B7280] text-[11px]">No</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#15803D] border border-emerald-200">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E2E7EF] rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h4 className="text-lg font-bold text-[#172554]">Create Tax Rule</h4>
            <form onSubmit={handleCreateTax} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#344054] font-semibold mb-1">Tax Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. GST 18% or VAT 5%"
                  className="w-full p-2.5 bg-white border border-[#E2E7EF] rounded-lg text-[#202938] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-[#344054] font-semibold mb-1">Tax Rate (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#E2E7EF] rounded-lg text-[#202938] font-mono focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-[#263247] font-medium">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded text-[#2563EB]"
                />
                Set as Default Tax Rule for all new invoices
              </label>

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
