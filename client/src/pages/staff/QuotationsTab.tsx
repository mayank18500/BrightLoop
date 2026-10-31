import React, { useEffect, useState } from "react";
import {
  quotationService,
  Quotation,
  CustomerInfo,
  QuotationTemplate,
} from "../../services/quotationService";
import { catalogService, Product, Plan } from "../../services/catalogService";
import {
  FileText,
  Plus,
  Send,
  CheckCircle2,
  RefreshCw,
  Search,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Trash2,
  Clock,
  Layers,
  X,
  Loader2,
} from "lucide-react";

export const QuotationsTab: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<CustomerInfo[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [quotationToConvert, setQuotationToConvert] = useState<Quotation | null>(null);
  const [convertPaymentTerms, setConvertPaymentTerms] = useState("Due on receipt");
  const [convertStartDate, setConvertStartDate] = useState(new Date().toISOString().split("T")[0]);

  // Form State for New Quotation
  const [newCustomerId, setNewCustomerId] = useState("");
  const [newPlanId, setNewPlanId] = useState("");
  const [newValidityDays, setNewValidityDays] = useState(30);
  const [newDiscountCode, setNewDiscountCode] = useState("");
  const [items, setItems] = useState<
    { productId: string; variantId: string; quantity: number }[]
  >([{ productId: "", variantId: "", quantity: 1 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [quotesRes, custRes, prodRes, planRes, tmplRes] = await Promise.all([
        quotationService.getQuotations(),
        quotationService.listCustomers(),
        catalogService.getProducts(),
        catalogService.getPlans(),
        quotationService.listTemplates(),
      ]);

      setQuotations(quotesRes.quotations);
      setCustomers(custRes);
      setProducts(prodRes);
      setPlans(planRes);
      setTemplates(tmplRes);

      if (custRes.length > 0 && !newCustomerId) {
        setNewCustomerId(custRes[0].id);
      }
      if (planRes.length > 0 && !newPlanId) {
        setNewPlanId(planRes[0].id);
      }
      if (prodRes.length > 0 && items[0].productId === "") {
        setItems([
          {
            productId: prodRes[0].id,
            variantId: prodRes[0].variants[0]?.id || "",
            quantity: 1,
          },
        ]);
      }
    } catch (err: any) {
      console.error("Failed to load quotation tab data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendQuotation = async (id: string) => {
    try {
      setActionLoadingId(id);
      const updated = await quotationService.sendQuotation(id);
      setQuotations((prev) => prev.map((q) => (q.id === id ? updated : q)));
      if (selectedQuotation?.id === id) setSelectedQuotation(updated);
      setFeedbackMessage({ type: "success", text: `Proposal ${updated.quotationNumber} marked as SENT to customer.` });
    } catch (err: any) {
      setFeedbackMessage({ type: "error", text: err.response?.data?.error?.message || "Failed to send quotation." });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmQuotation = async (id: string) => {
    try {
      setActionLoadingId(id);
      const updated = await quotationService.confirmQuotation(id);
      setQuotations((prev) => prev.map((q) => (q.id === id ? updated : q)));
      if (selectedQuotation?.id === id) setSelectedQuotation(updated);
      setFeedbackMessage({ type: "success", text: `Proposal ${updated.quotationNumber} has been CONFIRMED by customer.` });
    } catch (err: any) {
      setFeedbackMessage({ type: "error", text: err.response?.data?.error?.message || "Failed to confirm quotation." });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConvertToSubscription = async () => {
    if (!quotationToConvert) return;
    try {
      setActionLoadingId(quotationToConvert.id);
      const result = await quotationService.convertToSubscription(quotationToConvert.id, {
        startDate: new Date(convertStartDate).toISOString(),
        paymentTerms: convertPaymentTerms,
      });

      setShowConvertModal(false);
      setShowDetailModal(false);
      setFeedbackMessage({
        type: "success",
        text: `🎉 Converted to Active Contract: ${result.subscription.subscriptionNumber}! Next Billing: ${new Date(
          result.subscription.nextBillingDate
        ).toLocaleDateString()}`,
      });
      fetchData();
    } catch (err: any) {
      setFeedbackMessage({
        type: "error",
        text: err.response?.data?.error?.message || "Failed to convert quotation to subscription.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerId) {
      setFeedbackMessage({ type: "error", text: "Please select a customer." });
      return;
    }
    const validItems = items.filter((it) => it.productId);
    if (validItems.length === 0) {
      setFeedbackMessage({ type: "error", text: "Please add at least one product." });
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await quotationService.createQuotation({
        customerId: newCustomerId,
        planId: newPlanId || undefined,
        validityDays: newValidityDays,
        discountCode: newDiscountCode.trim() || undefined,
        items: validItems.map((it) => ({
          productId: it.productId,
          variantId: it.variantId || undefined,
          quantity: it.quantity,
        })),
      });

      setShowCreateModal(false);
      setFeedbackMessage({
        type: "success",
        text: `Quotation ${created.quotationNumber} created successfully in DRAFT mode.`,
      });
      fetchData();
    } catch (err: any) {
      setFeedbackMessage({
        type: "error",
        text: err.response?.data?.error?.message || "Failed to create quotation.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addItemRow = () => {
    const firstProduct = products[0];
    setItems([
      ...items,
      {
        productId: firstProduct ? firstProduct.id : "",
        variantId: firstProduct?.variants[0]?.id || "",
        quantity: 1,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    const updated = [...items];
    updated[index].productId = productId;
    updated[index].variantId = product?.variants[0]?.id || "";
    setItems(updated);
  };

  // Live total estimates in modal
  const estimateSubtotal = items.reduce((sum, it) => {
    const prod = products.find((p) => p.id === it.productId);
    if (!prod) return sum;
    let price = Number(prod.salesPrice);
    if (it.variantId) {
      const v = prod.variants.find((vr) => vr.id === it.variantId);
      if (v) price += Number(v.priceAdjustment);
    }
    return sum + price * it.quantity;
  }, 0);

  // Statistics calculation
  const totalCount = quotations.length;
  const draftCount = quotations.filter((q) => q.status === "DRAFT").length;
  const sentCount = quotations.filter((q) => q.status === "SENT").length;
  const confirmedCount = quotations.filter((q) => q.status === "CONFIRMED").length;
  const convertedCount = quotations.filter((q) => q.subscriptions && q.subscriptions.length > 0).length;

  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch =
      q.quotationNumber.toLowerCase().includes(search.toLowerCase()) ||
      q.customer?.companyName.toLowerCase().includes(search.toLowerCase()) ||
      q.customer?.email.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === "ALL") return true;
    if (statusFilter === "CONVERTED") return q.subscriptions && q.subscriptions.length > 0;
    return q.status === statusFilter;
  });

  const getStatusBadge = (status: string, hasSubscription = false) => {
    if (hasSubscription) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <ShieldCheck className="h-3 w-3" />
          CONVERTED
        </span>
      );
    }
    switch (status) {
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="h-3 w-3" />
            DRAFT
          </span>
        );
      case "SENT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Send className="h-3 w-3" />
            SENT
          </span>
        );
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            CONFIRMED
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="h-3 w-3" />
            EXPIRED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert Feedback */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
            feedbackMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-400" />
            )}
            <span className="text-sm font-medium">{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-white text-xs cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Ribbon Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            Quotations & Conversion Pipeline
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Build formal price proposals, lock immutable price snapshots, and convert confirmed quotes to recurring subscriptions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 transition"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-500/20 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Quotation
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Proposals</div>
          <div className="text-xl font-bold text-white mt-1">{totalCount}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 backdrop-blur">
          <div className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">Drafts</div>
          <div className="text-xl font-bold text-amber-300 mt-1">{draftCount}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 backdrop-blur">
          <div className="text-[11px] font-medium text-blue-400 uppercase tracking-wider">Sent / Pending</div>
          <div className="text-xl font-bold text-blue-300 mt-1">{sentCount}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur">
          <div className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Confirmed</div>
          <div className="text-xl font-bold text-emerald-300 mt-1">{confirmedCount}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-purple-500/20 bg-purple-500/5 backdrop-blur">
          <div className="text-[11px] font-medium text-purple-400 uppercase tracking-wider">Converted Contracts</div>
          <div className="text-xl font-bold text-purple-300 mt-1">{convertedCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/40">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "DRAFT", "SENT", "CONFIRMED", "CONVERTED", "EXPIRED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                statusFilter === status
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search quote # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/70 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Quotations Main Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/70 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Quotation #</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Plan Attached</th>
                <th className="px-4 py-3.5">Items Snapshot</th>
                <th className="px-4 py-3.5">Total Amount</th>
                <th className="px-4 py-3.5">Valid Until</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500 mb-2" />
                    Loading quotations and pricing snapshots...
                  </td>
                </tr>
              ) : filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    No quotations found matching criteria. Click "Create Quotation" to generate your first proposal.
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((q) => {
                  const hasSub = !!q.subscription || !!(q.subscriptions && q.subscriptions.length > 0);
                  const isExpired = new Date() > new Date(q.expiresAt) && q.status !== "CONFIRMED";
                  const itemsCount = q.items?.length ?? (q as any)._count?.items ?? 0;
                  const firstItemName = q.items?.[0]?.product?.name || "Product";

                  return (
                    <tr
                      key={q.id}
                      className="hover:bg-slate-800/40 transition cursor-pointer"
                      onClick={() => {
                        setSelectedQuotation(q);
                        setShowDetailModal(true);
                      }}
                    >
                      <td className="px-4 py-3.5 font-semibold text-blue-400">
                        {q.quotationNumber}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-white">{q.customer?.companyName || "N/A"}</div>
                        <div className="text-[11px] text-slate-400">{q.customer?.email}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        {q.plan ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-slate-200">{q.plan.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              {q.plan.billingFrequency}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">One-Off / Custom</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-slate-300">
                          {itemsCount} {itemsCount === 1 ? "line item" : "line items"}
                        </span>
                        <div className="text-[11px] text-slate-400">
                          {firstItemName}
                          {itemsCount > 1 ? ` +${itemsCount - 1} more` : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white text-sm">
                          ₹{Number(q.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                        {Number(q.discountAmount) > 0 && (
                          <div className="text-[10px] text-emerald-400">
                            -₹{Number(q.discountAmount).toFixed(2)} off
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-300 text-[11px]">
                        <div>{new Date(q.expiresAt).toLocaleDateString()}</div>
                        {isExpired && !hasSub && (
                          <span className="text-[10px] text-rose-400 font-medium">Expired</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">{getStatusBadge(q.status, hasSub)}</td>
                      <td
                        className="px-4 py-3.5 text-right"
                        onClick={(e) => e.stopPropagation()} // Prevent opening details modal when clicking action buttons
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {q.status === "DRAFT" && (
                            <button
                              onClick={() => handleSendQuotation(q.id)}
                              disabled={actionLoadingId === q.id}
                              className="px-2.5 py-1 rounded bg-blue-600/80 hover:bg-blue-600 text-white font-medium text-[11px] flex items-center gap-1 transition"
                              title="Send Proposal to Customer"
                            >
                              <Send className="h-3 w-3" />
                              Send
                            </button>
                          )}

                          {q.status === "SENT" && (
                            <button
                              onClick={() => handleConfirmQuotation(q.id)}
                              disabled={actionLoadingId === q.id}
                              className="px-2.5 py-1 rounded bg-emerald-600/80 hover:bg-emerald-600 text-white font-medium text-[11px] flex items-center gap-1 transition"
                              title="Mark as Confirmed by Customer"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Confirm
                            </button>
                          )}

                          {q.status === "CONFIRMED" && !hasSub && (
                            <button
                              onClick={() => {
                                setQuotationToConvert(q);
                                setShowConvertModal(true);
                              }}
                              className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-medium text-[11px] flex items-center gap-1 shadow-md shadow-purple-500/20 transition"
                              title="Convert to Active Subscription"
                            >
                              <ShieldCheck className="h-3 w-3" />
                              Convert to Sub
                            </button>
                          )}

                          {hasSub && (
                            <span className="text-[11px] text-purple-400 font-mono">
                              {q.subscriptions![0].subscriptionNumber}
                            </span>
                          )}

                          <button
                            onClick={() => {
                              setSelectedQuotation(q);
                              setShowDetailModal(true);
                            }}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                            title="View Full Proposal"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE QUOTATION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl my-8">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-400" />
                  Create New Commercial Quotation
                </h3>
                <p className="text-xs text-slate-400">
                  Select customer, recurrence plan, products, and snapshot agreed contract pricing.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Template Preset Selector */}
              {templates.length > 0 && (
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Load from Reusable Quotation Template (Optional)
                  </label>
                  <select
                    onChange={(e) => {
                      const tmpl = templates.find((t) => t.id === e.target.value);
                      if (tmpl && Array.isArray(tmpl.templateData)) {
                        setNewValidityDays(tmpl.validityDays);
                        setItems(
                          tmpl.templateData.map((d: any) => ({
                            productId: d.productId,
                            variantId: d.variantId || "",
                            quantity: d.quantity || 1,
                          }))
                        );
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white focus:outline-none focus:border-blue-500"
                    defaultValue=""
                  >
                    <option value="">Choose a preset template or configure manually...</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.validityDays} days validity)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Customer & Plan Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Customer Account *
                  </label>
                  <select
                    value={newCustomerId}
                    onChange={(e) => setNewCustomerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="" disabled>
                      Select a customer...
                    </option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} ({c.contactName} - {c.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Subscription Recurrence Plan
                  </label>
                  <select
                    value={newPlanId}
                    onChange={(e) => setNewPlanId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">No Plan (Custom / Ad-hoc)</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - ₹{Number(p.price).toFixed(2)} ({p.billingFrequency})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Validity & Discount Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Proposal Validity (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={newValidityDays}
                    onChange={(e) => setNewValidityDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Auto-expires on:{" "}
                    {new Date(Date.now() + newValidityDays * 86400000).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Coupon / Discount Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. WELCOME10 or ENTERPRISE20"
                    value={newDiscountCode}
                    onChange={(e) => setNewDiscountCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-blue-500 font-mono uppercase"
                  />
                </div>
              </div>

              {/* Dynamic Items Table */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-blue-400" />
                    Quotation Line Items & Tier Selection
                  </h4>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((row, idx) => {
                    const currentProduct = products.find((p) => p.id === row.productId);
                    const currentVariant = currentProduct?.variants.find((v) => v.id === row.variantId);
                    const unitPrice =
                      Number(currentProduct?.salesPrice || 0) + Number(currentVariant?.priceAdjustment || 0);

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 grid grid-cols-12 gap-3 items-center"
                      >
                        <div className="col-span-5">
                          <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
                            Product
                          </label>
                          <select
                            value={row.productId}
                            onChange={(e) => handleProductChange(idx, e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white focus:outline-none focus:border-blue-500"
                            required
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (Base ₹{Number(p.salesPrice).toFixed(0)})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-4">
                          <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
                            Variant / Tier
                          </label>
                          <select
                            value={row.variantId}
                            onChange={(e) => {
                              const updated = [...items];
                              updated[idx].variantId = e.target.value;
                              setItems(updated);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white focus:outline-none focus:border-blue-500"
                          >
                            <option value="">No Variant (+₹0)</option>
                            {currentProduct?.variants.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.name} (+₹{Number(v.priceAdjustment).toFixed(0)})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-2">
                          <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
                            Qty
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={row.quantity}
                            onChange={(e) => {
                              const updated = [...items];
                              updated[idx].quantity = Math.max(1, parseInt(e.target.value, 10) || 1);
                              setItems(updated);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white focus:outline-none focus:border-blue-500"
                            required
                          />
                        </div>

                        <div className="col-span-1 flex items-end justify-center pt-4">
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            disabled={items.length <= 1}
                            className="p-1.5 text-slate-500 hover:text-rose-400 disabled:opacity-30 cursor-pointer"
                            title="Remove row"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="col-span-12 text-[11px] text-slate-400 flex justify-between border-t border-slate-800/60 pt-1.5">
                          <span>
                            Effective Snapshot Price: ₹{unitPrice.toFixed(2)} / unit
                          </span>
                          <span className="font-semibold text-slate-200">
                            Line Subtotal: ₹{(unitPrice * row.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Estimated Pricing Summary */}
              <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-300">Estimated Base Subtotal</div>
                  <div className="text-[11px] text-slate-500">
                    Exact taxes and coupons will be snapshotted on server creation
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-white">
                    ₹{estimateSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 transition cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating Quotation...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Create Formal Quotation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED QUOTATION PROPOSAL MODAL */}
      {showDetailModal && selectedQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
                  BL
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      Commercial Proposal {selectedQuotation.quotationNumber}
                    </h3>
                    {getStatusBadge(
                      selectedQuotation.status,
                      !!(selectedQuotation.subscriptions && selectedQuotation.subscriptions.length > 0)
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Created on {new Date(selectedQuotation.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Document */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* Customer and Recurrence Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-800 bg-slate-950/60">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Client Details
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {selectedQuotation.customer?.companyName}
                  </div>
                  <div className="text-slate-300 mt-0.5">{selectedQuotation.customer?.contactName}</div>
                  <div className="text-slate-400">{selectedQuotation.customer?.email}</div>
                  {selectedQuotation.customer?.billingAddress && (
                    <div className="text-slate-400 mt-1">{selectedQuotation.customer.billingAddress}</div>
                  )}
                  {selectedQuotation.customer?.taxId && (
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      GST / Tax ID: {selectedQuotation.customer.taxId}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Proposal Terms & Lifecycle
                  </div>
                  <div className="text-sm font-semibold text-blue-400">
                    {selectedQuotation.plan ? selectedQuotation.plan.name : "Custom Contract"}
                  </div>
                  {selectedQuotation.plan && (
                    <div className="text-slate-300 mt-0.5">
                      Billing Cycle: Every {selectedQuotation.plan.billingInterval}{" "}
                      {selectedQuotation.plan.billingFrequency.toLowerCase()}
                    </div>
                  )}
                  <div className="text-slate-400 mt-1">
                    Valid Until:{" "}
                    <span className="text-white font-medium">
                      {new Date(selectedQuotation.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                  {selectedQuotation.confirmedAt && (
                    <div className="text-emerald-400 mt-0.5">
                      Confirmed At: {new Date(selectedQuotation.confirmedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Line Items Table with Snapshots */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Snapshotted Contract Line Items
                </h4>
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                      <tr>
                        <th className="px-3.5 py-2.5">Product & Variant</th>
                        <th className="px-3.5 py-2.5 text-center">Qty</th>
                        <th className="px-3.5 py-2.5 text-right">Agreed Unit Price</th>
                        <th className="px-3.5 py-2.5 text-right">Tax Rate</th>
                        <th className="px-3.5 py-2.5 text-right">Tax Amount</th>
                        <th className="px-3.5 py-2.5 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {(selectedQuotation.items || []).map((it) => (
                        <tr key={it.id}>
                          <td className="px-3.5 py-2.5">
                            <div className="font-medium text-white">{it.product?.name || "Product"}</div>
                            {it.variant && (
                              <div className="text-[10px] text-slate-400">Tier: {it.variant.name}</div>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 text-center">{it.quantity}</td>
                          <td className="px-3.5 py-2.5 text-right font-mono">
                            ₹{Number(it.unitPrice).toFixed(2)}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono">
                            {Number(it.taxRate).toFixed(1)}%
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono text-slate-400">
                            ₹{Number(it.taxAmount).toFixed(2)}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-white">
                            ₹{Number(it.total).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="flex justify-end">
                <div className="w-72 space-y-2 p-3.5 rounded-xl border border-slate-800 bg-slate-950/60">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-mono text-white">
                      ₹{Number(selectedQuotation.subtotal).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Tax Amount:</span>
                    <span className="font-mono text-white">
                      +₹{Number(selectedQuotation.taxAmount).toFixed(2)}
                    </span>
                  </div>
                  {Number(selectedQuotation.discountAmount) > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount / Coupon:</span>
                      <span className="font-mono">
                        -₹{Number(selectedQuotation.discountAmount).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-bold text-white">
                    <span>Grand Total:</span>
                    <span className="text-blue-400">
                      ₹{Number(selectedQuotation.totalAmount).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subscriptions Linked */}
              {selectedQuotation.subscriptions && selectedQuotation.subscriptions.length > 0 && (
                <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-purple-400" />
                    <div>
                      <div className="font-semibold text-purple-200">
                        Active Subscription Contract: {selectedQuotation.subscriptions[0].subscriptionNumber}
                      </div>
                      <div className="text-[11px] text-purple-300">
                        Status: {selectedQuotation.subscriptions[0].status}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/40 rounded-b-2xl">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {selectedQuotation.status === "DRAFT" && (
                  <button
                    onClick={() => handleSendQuotation(selectedQuotation.id)}
                    disabled={actionLoadingId === selectedQuotation.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 transition cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                    Send Proposal to Customer
                  </button>
                )}

                {selectedQuotation.status === "SENT" && (
                  <button
                    onClick={() => handleConfirmQuotation(selectedQuotation.id)}
                    disabled={actionLoadingId === selectedQuotation.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Customer Has Confirmed
                  </button>
                )}

                {selectedQuotation.status === "CONFIRMED" &&
                  (!selectedQuotation.subscriptions || selectedQuotation.subscriptions.length === 0) && (
                    <button
                      onClick={() => {
                        setQuotationToConvert(selectedQuotation);
                        setShowConvertModal(true);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-500/20 transition cursor-pointer"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Convert to Subscription Contract
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONVERT TO SUBSCRIPTION CONFIRMATION MODAL */}
      {showConvertModal && quotationToConvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Convert to Active Contract</h3>
                <p className="text-xs text-slate-400">
                  Proposal: {quotationToConvert.quotationNumber}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Converting this confirmed proposal creates an active recurring subscription contract. The agreed unit prices will be locked into the contract snapshots, protecting the customer from future catalog price adjustments.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Contract Effective Start Date
                </label>
                <input
                  type="date"
                  value={convertStartDate}
                  onChange={(e) => setConvertStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Payment Terms
                </label>
                <select
                  value={convertPaymentTerms}
                  onChange={(e) => setConvertPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Due on receipt">Due on receipt</option>
                  <option value="Net 15 Days">Net 15 Days</option>
                  <option value="Net 30 Days">Net 30 Days</option>
                  <option value="Net 60 Days">Net 60 Days</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConvertModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConvertToSubscription}
                disabled={actionLoadingId === quotationToConvert.id}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-500/20 transition cursor-pointer"
              >
                {actionLoadingId === quotationToConvert.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Confirm & Activate Subscription
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
