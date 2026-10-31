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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-400" />
            Product Catalog & Tiered Variants
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Configure base products and multi-tier variants with automated effective price calculations.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          Loading product catalog...
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400">
          No products created yet. Click &quot;Add Product&quot; to create your first catalog item.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 w-10"></th>
                <th className="py-3 px-4 font-semibold">Product Name</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Base Sales Price</th>
                <th className="py-3 px-4 font-semibold">Cost Price</th>
                <th className="py-3 px-4 font-semibold">Variants Count</th>
                <th className="py-3 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {products.map((p) => {
                const isExpanded = expandedId === p.id;
                return (
                  <React.Fragment key={p.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : p.id)}
                      className="hover:bg-slate-800/40 transition cursor-pointer"
                    >
                      <td className="py-3.5 px-4 text-slate-500">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {p.name}
                        {p.description && (
                          <div className="text-[11px] text-slate-400 font-normal truncate max-w-xs">
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono">{p.type}</td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-400 font-mono">
                        ₹{Number(p.salesPrice).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">
                        ₹{Number(p.costPrice).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300">
                          {p.variants?.length || 0} variant(s)
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {p.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-medium">
                            <XCircle className="h-3.5 w-3.5" /> Inactive
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* Expandable Variants Sub-Table */}
                    {isExpanded && (
                      <tr className="bg-slate-950/70 border-b border-slate-800">
                        <td colSpan={7} className="p-4 pl-12">
                          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-2">
                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              Configured Variants & Effective Calculations
                            </div>
                            <div className="grid grid-cols-4 gap-3 text-xs font-mono py-1.5 border-b border-slate-800/60 text-slate-400">
                              <div>Variant Tier</div>
                              <div>Adjustment (₹)</div>
                              <div>Effective Price (₹)</div>
                              <div>Status</div>
                            </div>
                            {p.variants?.map((v) => (
                              <div
                                key={v.id}
                                className="grid grid-cols-4 gap-3 text-xs items-center py-1 font-mono text-slate-200"
                              >
                                <div className="font-semibold text-white">{v.name}</div>
                                <div className="text-slate-400">
                                  {Number(v.priceAdjustment) >= 0 ? "+" : ""}
                                  ₹{Number(v.priceAdjustment).toFixed(2)}
                                </div>
                                <div className="text-emerald-400 font-bold">
                                  ₹{Number(v.effectivePrice || Number(p.salesPrice) + Number(v.priceAdjustment)).toFixed(2)}
                                </div>
                                <div>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <h4 className="text-lg font-bold text-white">Create New Product</h4>
            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. BrightLoop Helpdesk"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Sales Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={salesPrice}
                    onChange={(e) => setSalesPrice(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Cost Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Product description and contract notes..."
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>

              {/* Variants Section */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Product Variants</span>
                  <button
                    type="button"
                    onClick={addVariantRow}
                    className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer"
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
                      className="flex-1 p-1.5 bg-slate-950 border border-slate-800 rounded text-white"
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
                      className="w-28 p-1.5 bg-slate-950 border border-slate-800 rounded text-white font-mono"
                    />
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariantRow(i)}
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
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
