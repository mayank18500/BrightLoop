import React, { useEffect, useState } from "react";
import { catalogService, Product } from "../../services/catalogService";
import { Package, Plus, ChevronDown, ChevronRight, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export const ProductsTab: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New Product Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [salesPrice, setSalesPrice] = useState("2000.00");
  const [costPrice, setCostPrice] = useState("500.00");
  const [description, setDescription] = useState("");
  const [variants, setVariants] = useState<{ name: string; priceAdjustment: string }[]>([
    { name: "Standard", priceAdjustment: "0.00" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await catalogService.getProducts();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await catalogService.createProduct({
        name,
        type: "SOFTWARE",
        salesPrice,
        costPrice,
        description,
        variants: variants.map((v) => ({ ...v, isActive: true })),
      });
      setShowModal(false);
      setName("");
      setDescription("");
      setVariants([{ name: "Standard", priceAdjustment: "0.00" }]);
      fetchProducts();
    } finally {
      setIsSubmitting(false);
    }
  };

  const addVariantRow = () => {
    setVariants([...variants, { name: "", priceAdjustment: "0.00" }]);
  };

  const removeVariantRow = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#172554] flex items-center gap-2.5">
            <Package className="h-6 w-6 text-[#2563EB]" />
            Product Catalog & Tiered Variants
          </h2>
          <p className="text-sm text-[#596579] mt-1">
            Configure base products and multi-tier variants with automated effective price calculations.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-sm hover:shadow transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-[#596579] flex items-center justify-center gap-2 bg-white rounded-xl border border-[#E2E7EF] shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-[#2563EB]" />
          Loading product catalog...
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-[#E2E7EF] bg-white p-8 text-center text-[#596579] shadow-sm">
          No products created yet. Click &quot;Add Product&quot; to create your first catalog item.
        </div>
      ) : (
        <div className="rounded-xl border border-[#E2E7EF] bg-white overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#344054] font-bold uppercase tracking-wider text-[11px] border-b border-[#E2E7EF]">
              <tr>
                <th className="py-3 px-4 w-10"></th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Base Sales Price</th>
                <th className="py-3 px-4">Cost Price</th>
                <th className="py-3 px-4">Variants Count</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E7EF] text-[#263247]">
              {products.map((p) => {
                const isExpanded = expandedId === p.id;
                return (
                  <React.Fragment key={p.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : p.id)}
                      className="hover:bg-[#F8FAFC] transition cursor-pointer"
                    >
                      <td className="py-3.5 px-4 text-[#596579]">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#172554]">
                        {p.name}
                        {p.description && (
                          <div className="text-[11px] text-[#596579] font-normal truncate max-w-xs mt-0.5">
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#596579] font-mono text-[11px]">{p.type}</td>
                      <td className="py-3.5 px-4 font-bold text-[#15803D] font-mono text-sm">
                        ₹{Number(p.salesPrice).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-[#596579] font-mono">
                        ₹{Number(p.costPrice).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E7EF]">
                          {p.variants?.length || 0} variant(s)
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {p.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#15803D] border border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-[#B91C1C] border border-rose-200">
                            <XCircle className="h-3.5 w-3.5" /> Inactive
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* Expandable Variants Sub-Table */}
                    {isExpanded && (
                      <tr className="bg-[#F8FAFC] border-b border-[#E2E7EF]">
                        <td colSpan={7} className="p-4 pl-12">
                          <div className="rounded-xl border border-[#E2E7EF] bg-white p-4 space-y-3 shadow-sm">
                            <div className="text-xs font-bold text-[#172554] uppercase tracking-wider">
                              Configured Variants & Effective Calculations
                            </div>
                            <div className="grid grid-cols-4 gap-3 text-xs font-semibold py-1.5 border-b border-[#E2E7EF] text-[#596579]">
                              <div>Variant Tier</div>
                              <div>Adjustment (₹)</div>
                              <div>Effective Price (₹)</div>
                              <div>Status</div>
                            </div>
                            {p.variants?.map((v) => (
                              <div
                                key={v.id}
                                className="grid grid-cols-4 gap-3 text-xs items-center py-1.5 text-[#263247]"
                              >
                                <div className="font-semibold text-[#172554]">{v.name}</div>
                                <div className="text-[#596579] font-mono">
                                  {Number(v.priceAdjustment) >= 0 ? "+" : ""}
                                  ₹{Number(v.priceAdjustment).toFixed(2)}
                                </div>
                                <div className="text-[#15803D] font-bold font-mono">
                                  ₹{Number(v.effectivePrice || Number(p.salesPrice) + Number(v.priceAdjustment)).toFixed(2)}
                                </div>
                                <div>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-[#15803D] border border-emerald-200">
                                    Active
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E2E7EF] rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <h4 className="text-lg font-bold text-[#172554]">Create New Product</h4>
            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#344054] font-semibold mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. BrightLoop Helpdesk"
                  className="w-full p-2.5 bg-white border border-[#E2E7EF] rounded-lg text-[#202938] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#344054] font-semibold mb-1">Sales Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={salesPrice}
                    onChange={(e) => setSalesPrice(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#E2E7EF] rounded-lg text-[#202938] font-mono focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-[#344054] font-semibold mb-1">Cost Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#E2E7EF] rounded-lg text-[#202938] font-mono focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#344054] font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Product description and contract notes..."
                  className="w-full p-2.5 bg-white border border-[#E2E7EF] rounded-lg text-[#202938] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              {/* Variants Section */}
              <div className="space-y-2 pt-2 border-t border-[#E2E7EF]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#172554]">Product Variants</span>
                  <button
                    type="button"
                    onClick={addVariantRow}
                    className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] cursor-pointer"
                  >
                    + Add Variant
                  </button>
                </div>
                {variants.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Variant Tier Name"
                      value={v.name}
                      onChange={(e) => {
                        const copy = [...variants];
                        copy[i].name = e.target.value;
                        setVariants(copy);
                      }}
                      className="flex-1 p-2 bg-white border border-[#E2E7EF] rounded-lg text-[#202938] focus:outline-none focus:border-[#2563EB]"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Price Addon (₹)"
                      value={v.priceAdjustment}
                      onChange={(e) => {
                        const copy = [...variants];
                        copy[i].priceAdjustment = e.target.value;
                        setVariants(copy);
                      }}
                      className="w-28 p-2 bg-white border border-[#E2E7EF] rounded-lg text-[#202938] font-mono focus:outline-none focus:border-[#2563EB]"
                    />
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariantRow(i)}
                        className="text-[#6B7280] hover:text-[#B91C1C] p-1.5 rounded-lg hover:bg-rose-50 transition"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
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
                  {isSubmitting ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
