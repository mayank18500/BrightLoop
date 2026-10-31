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
  Check,
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
  const convertedCount = quotations.filter((q) => q.subscription || (q.subscriptions && q.subscriptions.length > 0)).length;

  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch =
      q.quotationNumber.toLowerCase().includes(search.toLowerCase()) ||
      q.customer?.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      q.customer?.email?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === "ALL") return true;
    if (statusFilter === "CONVERTED") return !!(q.subscription || (q.subscriptions && q.subscriptions.length > 0));
    return q.status === statusFilter;
  });

  const getStatusBadge = (status: string, hasSubscription = false) => {
    if (hasSubscription) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-[#7C3AED] border border-purple-200">
          <ShieldCheck className="h-3.5 w-3.5" />
          CONVERTED
        </span>
      );
    }
    switch (status) {
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-[#B45309] border border-amber-200">
            <Clock className="h-3.5 w-3.5" />
            DRAFT
          </span>
        );
      case "SENT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#1D4ED8] border border-blue-200">
            <Send className="h-3.5 w-3.5" />
            SENT
          </span>
        );
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#15803D] border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            CONFIRMED
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-[#B91C1C] border border-rose-200">
            <AlertCircle className="h-3.5 w-3.5" />
            EXPIRED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F1F5F9] text-[#475569] border border-[#E2E7EF]">
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
              ? "bg-emerald-50 border-emerald-200 text-[#15803D]"
              : "bg-rose-50 border-rose-200 text-[#B91C1C]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-[#15803D] flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-[#B91C1C] flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-[#6B7280] hover:text-[#172554] p-1 rounded-lg transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Ribbon Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#172554] flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-[#2563EB]" />
            Quotations & Conversion Pipeline
          </h2>
          <p className="text-sm text-[#596579] mt-1">
            Build formal price proposals, lock immutable price snapshots, and convert confirmed quotes to recurring subscriptions.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-lg border border-[#E2E7EF] bg-white hover:bg-[#F8FAFC] text-[#596579] hover:text-[#172554] transition shadow-sm"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs shadow-sm hover:shadow transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Quotation
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl border border-[#E2E7EF] bg-white shadow-sm">
          <div className="text-xs font-semibold text-[#596579] uppercase tracking-wider">Total Proposals</div>
          <div className="text-2xl font-bold text-[#172554] mt-1.5">{totalCount}</div>
        </div>
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-sm">
          <div className="text-xs font-semibold text-[#B45309] uppercase tracking-wider">Drafts</div>
          <div className="text-2xl font-bold text-[#B45309] mt-1.5">{draftCount}</div>
        </div>
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 shadow-sm">
          <div className="text-xs font-semibold text-[#1D4ED8] uppercase tracking-wider">Sent / Pending</div>
          <div className="text-2xl font-bold text-[#1D4ED8] mt-1.5">{sentCount}</div>
        </div>
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-sm">
          <div className="text-xs font-semibold text-[#15803D] uppercase tracking-wider">Confirmed</div>
          <div className="text-2xl font-bold text-[#15803D] mt-1.5">{confirmedCount}</div>
        </div>
        <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 shadow-sm">
          <div className="text-xs font-semibold text-[#7C3AED] uppercase tracking-wider">Converted Contracts</div>
          <div className="text-2xl font-bold text-[#7C3AED] mt-1.5">{convertedCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-[#E2E7EF] bg-white shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "DRAFT", "SENT", "CONFIRMED", "CONVERTED", "EXPIRED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                statusFilter === status
                  ? "bg-[#2563EB] text-white shadow-sm"
                  : "bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#596579] border border-[#E2E7EF]"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#687386]" />
          <input
            type="text"
            placeholder="Search quote # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-lg border border-[#E2E7EF] bg-white text-xs text-[#202938] placeholder-[#687386] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
          />
        </div>
      </div>

      {/* Quotations Main Table */}
      <div className="rounded-xl border border-[#E2E7EF] bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E7EF] text-[11px] font-bold text-[#344054] uppercase tracking-wider">
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
            <tbody className="divide-y divide-[#E2E7EF] text-[#263247]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[#596579]">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#2563EB] mb-2" />
                    Loading quotations and pricing snapshots...
                  </td>
                </tr>
              ) : filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[#596579]">
                    No quotations found matching criteria. Click &quot;Create Quotation&quot; to generate your first proposal.
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
                      className="hover:bg-[#F8FAFC] transition cursor-pointer"
                      onClick={() => {
                        setSelectedQuotation(q);
                        setShowDetailModal(true);
                      }}
                    >
                      <td className="px-4 py-3.5 font-bold text-[#1D4ED8]">
                        {q.quotationNumber}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-[#172554]">{q.customer?.companyName || "N/A"}</div>
                        <div className="text-[11px] text-[#596579]">{q.customer?.email}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        {q.plan ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-[#263247]">{q.plan.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#475569] border border-[#E2E7EF] font-medium">
                              {q.plan.billingFrequency}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#6B7280] italic">One-Off / Custom</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-[#263247]">
                          {itemsCount} {itemsCount === 1 ? "line item" : "line items"}
                        </span>
                        <div className="text-[11px] text-[#596579]">
                          {firstItemName}
                          {itemsCount > 1 ? ` +${itemsCount - 1} more` : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-[#172554] text-sm">
                          ₹{Number(q.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                        {Number(q.discountAmount) > 0 && (
                          <div className="text-[11px] text-[#15803D] font-medium">
                            -₹{Number(q.discountAmount).toFixed(2)} off
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-[#596579] text-[11px]">
                        <div className="font-medium text-[#263247]">{new Date(q.expiresAt).toLocaleDateString()}</div>
                        {isExpired && !hasSub && (
                          <span className="text-[10px] text-[#B91C1C] font-semibold">Expired</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">{getStatusBadge(q.status, hasSub)}</td>
                      <td
                        className="px-4 py-3.5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {q.status === "DRAFT" && (
                            <button
                              onClick={() => handleSendQuotation(q.id)}
                              disabled={actionLoadingId === q.id}
                              className="px-2.5 py-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-[11px] flex items-center gap-1 transition shadow-sm"
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
                              className="px-2.5 py-1 rounded-lg bg-[#15803D] hover:bg-[#166534] text-white font-medium text-[11px] flex items-center gap-1 transition shadow-sm"
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
                              className="px-2.5 py-1 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium text-[11px] flex items-center gap-1 shadow-sm transition"
                              title="Convert to Active Subscription"
                            >
                              <ShieldCheck className="h-3 w-3" />
                              Convert to Sub
                            </button>
                          )}

                          {hasSub && (
                            <span className="text-[11px] text-[#7C3AED] font-semibold font-mono">
                              {q.subscription?.subscriptionNumber || q.subscriptions?.[0]?.subscriptionNumber}
                            </span>
                          )}

                          <button
                            onClick={() => {
                              setSelectedQuotation(q);
                              setShowDetailModal(true);
                            }}
                            className="p-1 rounded-lg hover:bg-[#F1F5F9] text-[#596579] hover:text-[#172554] transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2E7EF] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl my-8">
            <div className="px-6 py-4 border-b border-[#E2E7EF] bg-[#F8FAFC] rounded-t-2xl flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#172554] flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#2563EB]" />
                  Create New Commercial Quotation
                </h3>
                <p className="text-xs text-[#596579] mt-0.5">
                  Select customer, recurrence plan, products, and snapshot agreed contract pricing.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#6B7280] hover:text-[#172554] p-1.5 rounded-lg hover:bg-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Template Preset Selector */}
              {templates.length > 0 && (
                <div className="p-3.5 rounded-xl border border-[#E2E7EF] bg-[#F8FAFC]">
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
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
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E7EF] bg-white text-xs text-[#202938] focus:outline-none focus:border-[#2563EB]"
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
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Customer Account *
                  </label>
                  <select
                    value={newCustomerId}
                    onChange={(e) => setNewCustomerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E7EF] bg-white text-xs text-[#202938] focus:outline-none focus:border-[#2563EB]"
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
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Subscription Recurrence Plan
                  </label>
                  <select
                    value={newPlanId}
                    onChange={(e) => setNewPlanId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E7EF] bg-white text-xs text-[#202938] focus:outline-none focus:border-[#2563EB]"
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
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Proposal Validity (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={newValidityDays}
                    onChange={(e) => setNewValidityDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E7EF] bg-white text-xs text-[#202938] focus:outline-none focus:border-[#2563EB]"
                    required
                  />
                  <p className="text-[11px] text-[#6B7280] mt-1">
                    Auto-expires on:{" "}
                    {new Date(Date.now() + newValidityDays * 86400000).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Coupon / Discount Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. WELCOME10 or ENTERPRISE20"
                    value={newDiscountCode}
                    onChange={(e) => setNewDiscountCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E7EF] bg-white text-xs text-[#202938] focus:outline-none focus:border-[#2563EB] font-mono uppercase"
                  />
                </div>
              </div>

              {/* Dynamic Items Table */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-[#E2E7EF] pb-2">
                  <h4 className="text-xs font-bold text-[#172554] uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-[#2563EB]" />
                    Quotation Line Items & Tier Selection
                  </h4>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold flex items-center gap-1 cursor-pointer"
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
                        className="p-3.5 rounded-xl border border-[#E2E7EF] bg-[#F8FAFC] grid grid-cols-12 gap-3 items-center"
                      >
                        <div className="col-span-5">
                          <label className="block text-[10px] text-[#596579] uppercase font-bold mb-1">
                            Product
                          </label>
                          <select
                            value={row.productId}
                            onChange={(e) => handleProductChange(idx, e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2E7EF] bg-white text-xs text-[#202938] focus:outline-none focus:border-[#2563EB]"
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
                          <label className="block text-[10px] text-[#596579] uppercase font-bold mb-1">
                            Variant / Tier
                          </label>
                          <select
                            value={row.variantId}
                            onChange={(e) => {
                              const updated = [...items];
                              updated[idx].variantId = e.target.value;
                              setItems(updated);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2E7EF] bg-white text-xs text-[#202938] focus:outline-none focus:border-[#2563EB]"
                          >
                            <option value="">Base Tier (No Adjustment)</option>
                            {currentProduct?.variants.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.name} (+₹{Number(v.priceAdjustment).toFixed(0)})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-2">
                          <label className="block text-[10px] text-[#596579] uppercase font-bold mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={row.quantity}
                            onChange={(e) => {
                              const updated = [...items];
                              updated[idx].quantity = Math.max(1, parseInt(e.target.value) || 1);
                              setItems(updated);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2E7EF] bg-white text-xs text-[#202938] focus:outline-none focus:border-[#2563EB] text-center"
                            required
                          />
                        </div>

                        <div className="col-span-1 flex justify-center pt-4">
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            disabled={items.length <= 1}
                            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#B91C1C] hover:bg-rose-50 disabled:opacity-30 cursor-pointer transition"
                            title="Remove row"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="col-span-12 text-[11px] text-[#596579] flex justify-between border-t border-[#E2E7EF] pt-2">
                          <span>
                            Effective Snapshot Price: ₹{unitPrice.toFixed(2)} / unit
                          </span>
                          <span className="font-semibold text-[#172554]">
                            Line Subtotal: ₹{(unitPrice * row.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Estimated Pricing Summary */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#172554]">Estimated Base Subtotal</div>
                  <div className="text-[11px] text-[#596579]">
                    Exact taxes and coupons will be snapshotted on server creation
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-[#172554]">
                    ₹{estimateSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E7EF]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#E2E7EF] hover:bg-[#F8FAFC] text-[#596579] text-xs font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs shadow-sm hover:shadow transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2E7EF] rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#E2E7EF] flex items-center justify-between bg-[#F8FAFC] rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#2563EB] flex items-center justify-center font-bold text-white shadow-sm">
                  BL
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#172554]">
                      Commercial Proposal {selectedQuotation.quotationNumber}
                    </h3>
                    {getStatusBadge(
                      selectedQuotation.status,
                      !!(selectedQuotation.subscription || (selectedQuotation.subscriptions && selectedQuotation.subscriptions.length > 0))
                    )}
                  </div>
                  <p className="text-xs text-[#596579]">
                    Created on {new Date(selectedQuotation.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-[#6B7280] hover:text-[#172554] p-1.5 rounded-lg hover:bg-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Document */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* Customer and Recurrence Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-[#E2E7EF] bg-[#F8FAFC]">
                <div>
                  <div className="text-[11px] font-bold text-[#596579] uppercase tracking-wider mb-1">
                    Client Details
                  </div>
                  <div className="text-sm font-bold text-[#172554]">
                    {selectedQuotation.customer?.companyName}
                  </div>
                  <div className="text-[#263247] mt-0.5">{selectedQuotation.customer?.contactName}</div>
                  <div className="text-[#596579]">{selectedQuotation.customer?.email}</div>
                  {selectedQuotation.customer?.billingAddress && (
                    <div className="text-[#596579] mt-1">{selectedQuotation.customer.billingAddress}</div>
                  )}
                  {selectedQuotation.customer?.taxId && (
                    <div className="text-[11px] text-[#6B7280] font-mono mt-0.5">
                      GST / Tax ID: {selectedQuotation.customer.taxId}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-[11px] font-bold text-[#596579] uppercase tracking-wider mb-1">
                    Proposal Terms & Lifecycle
                  </div>
                  <div className="text-sm font-bold text-[#2563EB]">
                    {selectedQuotation.plan ? selectedQuotation.plan.name : "Custom Contract"}
                  </div>
                  {selectedQuotation.plan && (
                    <div className="text-[#263247] mt-0.5">
                      Billing Cycle: Every {selectedQuotation.plan.billingInterval}{" "}
                      {selectedQuotation.plan.billingFrequency.toLowerCase()}
                    </div>
                  )}
                  <div className="text-[#596579] mt-1">
                    Valid Until:{" "}
                    <span className="text-[#172554] font-semibold">
                      {new Date(selectedQuotation.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                  {selectedQuotation.confirmedAt && (
                    <div className="text-[#15803D] font-semibold mt-0.5">
                      Confirmed At: {new Date(selectedQuotation.confirmedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Line Items Table with Snapshots */}
              <div className="border border-[#E2E7EF] rounded-xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E7EF] text-[11px] font-bold text-[#344054] uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Product Item</th>
                      <th className="px-4 py-3">Snapshot Variant</th>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E7EF] text-[#263247]">
                    {selectedQuotation.items?.map((it) => (
                      <tr key={it.id} className="hover:bg-[#F8FAFC]">
                        <td className="px-4 py-3 font-semibold text-[#172554]">
                          {it.product?.name || "Product"}
                        </td>
                        <td className="px-4 py-3 text-[#596579]">
                          {it.variant?.name || "Standard Base"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-[#263247]">
                          ₹{Number(it.unitPrice).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-[#172554]">{it.quantity}</td>
                        <td className="px-4 py-3 text-right font-bold text-[#172554]">
                          ₹{(Number(it.unitPrice) * it.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Price Calculation Breakdown */}
              <div className="flex justify-end">
                <div className="w-full max-w-xs space-y-2 text-xs border border-[#E2E7EF] bg-[#F8FAFC] p-4 rounded-xl">
                  <div className="flex justify-between text-[#596579]">
                    <span>Items Subtotal:</span>
                    <span className="font-semibold text-[#172554]">
                      ₹
                      {(
                        Number(selectedQuotation.totalAmount) -
                        Number(selectedQuotation.taxAmount) +
                        Number(selectedQuotation.discountAmount)
                      ).toFixed(2)}
                    </span>
                  </div>

                  {Number(selectedQuotation.discountAmount) > 0 && (
                    <div className="flex justify-between text-[#15803D]">
                      <span>Discount / Coupon Applied:</span>
                      <span className="font-semibold">
                        -₹{Number(selectedQuotation.discountAmount).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-[#596579]">
                    <span>Taxes & GST:</span>
                    <span className="font-semibold text-[#172554]">
                      +₹{Number(selectedQuotation.taxAmount).toFixed(2)}
                    </span>
                  </div>

                  <div className="border-t border-[#E2E7EF] pt-2 flex justify-between text-sm font-bold text-[#172554]">
                    <span>Total Proposal Value:</span>
                    <span>
                      ₹{Number(selectedQuotation.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="px-6 py-4 border-t border-[#E2E7EF] bg-[#F8FAFC] rounded-b-2xl flex items-center justify-between">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 rounded-lg border border-[#E2E7EF] hover:bg-white text-[#596579] text-xs font-semibold cursor-pointer transition shadow-sm"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {selectedQuotation.status === "DRAFT" && (
                  <button
                    onClick={() => handleSendQuotation(selectedQuotation.id)}
                    disabled={actionLoadingId === selectedQuotation.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs shadow-sm hover:shadow transition cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                    Send Proposal to Customer
                  </button>
                )}

                {selectedQuotation.status === "SENT" && (
                  <button
                    onClick={() => handleConfirmQuotation(selectedQuotation.id)}
                    disabled={actionLoadingId === selectedQuotation.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#15803D] hover:bg-[#166534] text-white font-semibold text-xs shadow-sm hover:shadow transition cursor-pointer"
                  >
                    <Check className="h-4 w-4" />
                    Customer Has Confirmed
                  </button>
                )}

                {selectedQuotation.status === "CONFIRMED" &&
                  !selectedQuotation.subscription &&
                  (!selectedQuotation.subscriptions || selectedQuotation.subscriptions.length === 0) && (
                    <button
                      onClick={() => {
                        setQuotationToConvert(selectedQuotation);
                        setShowConvertModal(true);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-xs shadow-sm hover:shadow transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E2E7EF] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-[#7C3AED]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172554]">Convert to Active Contract</h3>
                <p className="text-xs text-[#596579]">
                  Proposal: {quotationToConvert.quotationNumber}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#263247] leading-relaxed">
              Converting this confirmed proposal creates an active recurring subscription contract. The agreed unit prices will be locked into the contract snapshots, protecting the customer from future catalog price adjustments.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">
                  Contract Effective Start Date
                </label>
                <input
                  type="date"
                  value={convertStartDate}
                  onChange={(e) => setConvertStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E7EF] bg-white text-xs text-[#202938] focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">
                  Payment Terms
                </label>
                <select
                  value={convertPaymentTerms}
                  onChange={(e) => setConvertPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E7EF] bg-white text-xs text-[#202938] focus:outline-none focus:border-[#7C3AED]"
                >
                  <option value="Due on receipt">Due on receipt</option>
                  <option value="Net 15 Days">Net 15 Days</option>
                  <option value="Net 30 Days">Net 30 Days</option>
                  <option value="Net 60 Days">Net 60 Days</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E7EF]">
              <button
                type="button"
                onClick={() => setShowConvertModal(false)}
                className="px-4 py-2 rounded-lg border border-[#E2E7EF] hover:bg-[#F8FAFC] text-[#596579] text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConvertToSubscription}
                disabled={actionLoadingId === quotationToConvert.id}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-xs shadow-sm hover:shadow transition cursor-pointer"
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
