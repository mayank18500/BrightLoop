import React, { useEffect, useState } from "react";
import {
  invoiceService,
  Invoice,
  InvoiceMetrics,
  CreateInvoicePayload,
} from "../../services/invoiceService";
import { quotationService, CustomerInfo } from "../../services/quotationService";
import { catalogService, Product } from "../../services/catalogService";
import { subscriptionService, Subscription } from "../../services/subscriptionService";
import {
  FileText,
  Plus,
  Play,
  XCircle,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Trash2,
  X,
  Loader2,
  Clock,
  Printer,
  Receipt,
  TrendingUp,
  AlertTriangle,
  IndianRupee,
} from "lucide-react";

export const InvoicesTab: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [metrics, setMetrics] = useState<InvoiceMetrics | null>(null);
  const [customers, setCustomers] = useState<CustomerInfo[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [billingRunning, setBillingRunning] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Form State for Manual Invoice Creation
  const [newCustomerId, setNewCustomerId] = useState("");
  const [newSubscriptionId, setNewSubscriptionId] = useState("");
  const [newDueDate, setNewDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split("T")[0];
  });
  const [newNotes, setNewNotes] = useState("");
  const [newDiscountCode, setNewDiscountCode] = useState("");
  const [newItems, setNewItems] = useState<
    Array<{
      productId: string;
      variantId: string;
      description: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
      discountAmount: number;
    }>
  >([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invRes, metricsRes, custRes, prodRes, subRes] = await Promise.all([
        invoiceService.getInvoices({
          status: statusFilter === "ALL" || statusFilter === "OVERDUE" ? undefined : statusFilter,
          isOverdue: statusFilter === "OVERDUE" ? true : undefined,
          search: search || undefined,
        }),
        invoiceService.getInvoiceMetrics(),
        quotationService.listCustomers(),
        catalogService.getProducts(),
        subscriptionService.getSubscriptions({ limit: 100 }),
      ]);

      setInvoices(invRes.data);
      setMetrics(metricsRes);
      setCustomers(custRes);
      setProducts(prodRes);
      setSubscriptions(subRes.subscriptions);
    } catch (err: any) {
      console.error("Failed to load invoice data", err);
      setFeedback({ type: "error", text: err.response?.data?.error?.message || "Failed to load invoices." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, search]);

  const handleRunBilling = async () => {
    try {
      setBillingRunning(true);
      setFeedback(null);
      const res = await invoiceService.runRecurringBilling();
      const count = res.data.createdInvoices.length;
      const skipped = res.data.skippedDuplicates.length;
      setFeedback({
        type: "success",
        text: `Billing Runner completed: ${count} invoice(s) generated, ${skipped} duplicate periods safely skipped.`,
      });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.response?.data?.error?.message || "Failed to run billing engine." });
    } finally {
      setBillingRunning(false);
    }
  };

  const handleConfirmInvoice = async (id: string) => {
    try {
      setActionLoadingId(id);
      await invoiceService.confirmInvoice(id);
      setFeedback({ type: "success", text: "Invoice confirmed and issued to customer." });
      await loadData();
      if (selectedInvoice?.id === id) {
        const updated = await invoiceService.getInvoiceById(id);
        setSelectedInvoice(updated);
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.response?.data?.error?.message || "Failed to confirm invoice." });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelInvoice = async (id: string) => {
    if (!window.confirm("Are you sure you want to void/cancel this invoice?")) return;
    try {
      setActionLoadingId(id);
      await invoiceService.cancelInvoice(id, "Cancelled by administrative staff");
      setFeedback({ type: "success", text: "Invoice has been cancelled." });
      await loadData();
      if (selectedInvoice?.id === id) {
        const updated = await invoiceService.getInvoiceById(id);
        setSelectedInvoice(updated);
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.response?.data?.error?.message || "Failed to cancel invoice." });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAddItem = () => {
    if (products.length === 0) return;
    const defaultProduct = products[0];
    const defaultVariant = defaultProduct.variants?.[0];
    const basePrice = parseFloat(String(defaultProduct.salesPrice)) || 0;
    const varAdj = defaultVariant ? parseFloat(String(defaultVariant.priceAdjustment)) || 0 : 0;
    const unitPrice = basePrice + varAdj;

    setNewItems([
      ...newItems,
      {
        productId: defaultProduct.id,
        variantId: defaultVariant?.id || "",
        description: `${defaultProduct.name}${defaultVariant ? ` - ${defaultVariant.name}` : ""}`,
        quantity: 1,
        unitPrice,
        taxRate: 18,
        discountAmount: 0,
      },
    ]);
  };

  const handleProductSelect = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const variant = prod.variants?.[0];
    const basePrice = parseFloat(String(prod.salesPrice)) || 0;
    const varAdj = variant ? parseFloat(String(variant.priceAdjustment)) || 0 : 0;

    const updated = [...newItems];
    updated[index] = {
      ...updated[index],
      productId,
      variantId: variant?.id || "",
      description: `${prod.name}${variant ? ` - ${variant.name}` : ""}`,
      unitPrice: basePrice + varAdj,
    };
    setNewItems(updated);
  };

  const handleVariantSelect = (index: number, variantId: string) => {
    const current = newItems[index];
    const prod = products.find((p) => p.id === current.productId);
    if (!prod) return;
    const variant = prod.variants?.find((v) => v.id === variantId);
    const basePrice = parseFloat(String(prod.salesPrice)) || 0;
    const varAdj = variant ? parseFloat(String(variant.priceAdjustment)) || 0 : 0;

    const updated = [...newItems];
    updated[index] = {
      ...updated[index],
      variantId,
      description: `${prod.name}${variant ? ` - ${variant.name}` : ""}`,
      unitPrice: basePrice + varAdj,
    };
    setNewItems(updated);
  };

  const handleItemFieldChange = (
    index: number,
    field: "quantity" | "unitPrice" | "taxRate" | "discountAmount" | "description",
    value: any
  ) => {
    const updated = [...newItems];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setNewItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setNewItems(newItems.filter((_, i) => i !== index));
  };

  const calculateFormTotals = () => {
    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;

    for (const item of newItems) {
      const lineSub = (item.unitPrice || 0) * (item.quantity || 1);
      const lineDisc = item.discountAmount || 0;
      const taxable = Math.max(0, lineSub - lineDisc);
      const lineTax = taxable * ((item.taxRate || 0) / 100);

      subtotal += lineSub;
      taxAmount += lineTax;
      discountAmount += lineDisc;
    }

    const total = Math.max(0, subtotal + taxAmount - discountAmount);
    return { subtotal, taxAmount, discountAmount, total };
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerId) {
      setFeedback({ type: "error", text: "Please select a customer" });
      return;
    }
    if (newItems.length === 0) {
      setFeedback({ type: "error", text: "Add at least one item to invoice" });
      return;
    }

    try {
      setLoading(true);
      const payload: CreateInvoicePayload = {
        customerId: newCustomerId,
        subscriptionId: newSubscriptionId || undefined,
        dueDate: new Date(newDueDate).toISOString(),
        notes: newNotes || undefined,
        discountCode: newDiscountCode || undefined,
        items: newItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId || undefined,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          discountAmount: item.discountAmount,
        })),
      };

      const created = await invoiceService.createInvoice(payload);
      setFeedback({ type: "success", text: `Invoice ${created.invoiceNumber} drafted successfully!` });
      setShowCreateModal(false);
      // Reset form
      setNewCustomerId("");
      setNewSubscriptionId("");
      setNewNotes("");
      setNewDiscountCode("");
      setNewItems([]);
      await loadData();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.response?.data?.error?.message || "Failed to create invoice." });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Invoice["status"], isOverdue?: boolean) => {
    if (isOverdue && status === "CONFIRMED") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-[#B91C1C] border border-rose-200">
          <AlertTriangle className="w-3.5 h-3.5 mr-1" />
          OVERDUE
        </span>
      );
    }
    switch (status) {
      case "DRAFT":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-[#B45309] border border-amber-200">
            <Clock className="w-3.5 h-3.5 mr-1" />
            DRAFT
          </span>
        );
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#1D4ED8] border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            CONFIRMED
          </span>
        );
      case "PAID":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#15803D] border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            PAID
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F1F5F9] text-[#64748B] border border-[#E2E7EF]">
            <XCircle className="w-3.5 h-3.5 mr-1" />
            CANCELLED
          </span>
        );
    }
  };

  const formTotals = calculateFormTotals();

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#172554] flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-[#2563EB]" />
            Invoices & Automated Billing
          </h2>
          <p className="text-sm text-[#596579] mt-1">
            Generate recurring invoices, monitor receivables, record line snapshots, and audit payments.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRunBilling}
            disabled={billingRunning}
            className="inline-flex items-center px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
          >
            {billingRunning ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2 fill-current" />
            )}
            Run Recurring Billing
          </button>
          <button
            onClick={() => {
              handleAddItem();
              setShowCreateModal(true);
            }}
            className="inline-flex items-center px-4 py-2.5 bg-white border border-[#E2E7EF] hover:bg-[#F8FAFC] text-[#172554] font-semibold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Invoice
          </button>
        </div>
      </div>

      {/* Metrics Ribbon */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-[#E2E7EF] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#596579]">Total Invoiced</span>
              <div className="p-2 bg-blue-50 text-[#1D4ED8] rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-bold text-[#172554]">₹{metrics.totalInvoiced}</div>
              <div className="text-xs text-[#596579] mt-1">{metrics.totalCount} total generated invoices</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#15803D]">Total Collected</span>
              <div className="p-2 bg-emerald-100/60 text-[#15803D] rounded-lg">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-bold text-[#15803D]">₹{metrics.totalPaid}</div>
              <div className="text-xs text-[#596579] mt-1">{metrics.paidCount} fully paid invoices</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#B45309]">Outstanding Balance</span>
              <div className="p-2 bg-amber-100/60 text-[#B45309] rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-bold text-[#B45309]">₹{metrics.totalOutstanding}</div>
              <div className="text-xs text-[#596579] mt-1">{metrics.confirmedCount} confirmed awaiting payment</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/40 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#B91C1C]">Overdue Invoices</span>
              <div className="p-2 bg-rose-100/60 text-[#B91C1C] rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-bold text-[#B91C1C]">
                {metrics.overdueCount || 0}
              </div>
              <div className="text-xs text-[#596579] mt-1">Requires overdue payment dunning</div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 text-[#15803D] border border-emerald-200"
              : "bg-rose-50 text-[#B91C1C] border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-[#15803D]" />
            ) : (
              <AlertCircle className="w-5 h-5 text-[#B91C1C]" />
            )}
            <span className="text-sm font-medium">{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-[#6B7280] hover:text-[#172554] p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3.5 rounded-xl border border-[#E2E7EF] shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
          {(["ALL", "DRAFT", "CONFIRMED", "PAID", "CANCELLED", "OVERDUE"] as const).map((status) => (
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

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#687386]" />
          <input
            type="text"
            placeholder="Search invoice #, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E2E7EF] rounded-lg text-xs text-[#202938] placeholder-[#687386] focus:outline-none focus:border-[#2563EB]"
          />
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-xl border border-[#E2E7EF] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#596579] flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#2563EB] mb-2" />
            <span className="text-xs">Loading billing and invoice records...</span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-[#596579]">
            <FileText className="w-12 h-12 text-[#687386] mx-auto mb-3" />
            <h3 className="text-base font-semibold text-[#172554]">No Invoices Found</h3>
            <p className="text-xs text-[#596579] mt-1">
              {statusFilter !== "ALL"
                ? `No invoices match the filter "${statusFilter}".`
                : "Create a manual invoice or run the recurring billing runner above."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#263247]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E7EF] text-[11px] font-bold text-[#344054] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 text-right">Paid</th>
                  <th className="py-3.5 px-4 text-right">Balance Due</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E7EF]">
                {invoices.map((inv) => {
                  const total = parseFloat(String(inv.totalAmount)) || 0;
                  const paid = parseFloat(String(inv.amountPaid)) || 0;
                  const balance = Math.max(0, total - paid);
                  const isOverdue =
                    inv.status === "CONFIRMED" &&
                    new Date(inv.dueDate) < new Date() &&
                    balance > 0;

                  return (
                    <tr key={inv.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#2563EB]">
                        <div className="flex items-center gap-2">
                          <span>{inv.invoiceNumber}</span>
                          {inv.subscription && (
                            <span className="text-[10px] bg-[#F1F5F9] text-[#475569] border border-[#E2E7EF] px-1.5 py-0.5 rounded font-sans font-medium">
                              {inv.subscription.subscriptionNumber}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#172554]">{inv.customer?.companyName || "N/A"}</div>
                        <div className="text-[11px] text-[#596579]">{inv.customer?.contactName}</div>
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(inv.status, isOverdue)}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-[#263247]">
                          <Calendar className="w-3.5 h-3.5 text-[#596579]" />
                          <span>{new Date(inv.dueDate).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#172554]">
                        ₹{total.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#15803D]">
                        ₹{paid.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#172554]">
                        <span className={balance > 0 && isOverdue ? "text-[#B91C1C]" : ""}>
                          ₹{balance.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setShowDetailModal(true);
                            }}
                            className="p-1.5 text-[#596579] hover:text-[#2563EB] hover:bg-blue-50 rounded-lg transition-colors"
                            title="View / Print Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {inv.status === "DRAFT" && (
                            <button
                              onClick={() => handleConfirmInvoice(inv.id)}
                              disabled={actionLoadingId === inv.id}
                              className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-[#1D4ED8] hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-sm"
                              title="Confirm and issue invoice"
                            >
                              {actionLoadingId === inv.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                "Confirm"
                              )}
                            </button>
                          )}

                          {inv.status !== "PAID" && inv.status !== "CANCELLED" && paid === 0 && (
                            <button
                              onClick={() => handleCancelInvoice(inv.id)}
                              disabled={actionLoadingId === inv.id}
                              className="p-1.5 text-[#6B7280] hover:text-[#B91C1C] hover:bg-rose-50 rounded-lg transition-colors"
                              title="Cancel / Void invoice"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Invoice Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E2E7EF] shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#E2E7EF] bg-[#F8FAFC]">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-6 h-6 text-[#2563EB]" />
                <h3 className="text-lg font-bold text-[#172554]">Create Manual Invoice</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#6B7280] hover:text-[#172554] p-1.5 rounded-lg hover:bg-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">Customer *</label>
                  <select
                    required
                    value={newCustomerId}
                    onChange={(e) => {
                      setNewCustomerId(e.target.value);
                      setNewSubscriptionId("");
                    }}
                    className="w-full px-3 py-2 bg-white border border-[#E2E7EF] rounded-lg text-xs text-[#202938] focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="">Select Customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} ({c.contactName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">Linked Subscription (Optional)</label>
                  <select
                    value={newSubscriptionId}
                    onChange={(e) => setNewSubscriptionId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E2E7EF] rounded-lg text-xs text-[#202938] focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="">None (Ad-hoc Invoice)</option>
                    {subscriptions
                      .filter((s) => !newCustomerId || s.customerId === newCustomerId)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.subscriptionNumber} - {s.plan?.name} ({s.status})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E2E7EF] rounded-lg text-xs text-[#202938] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">Coupon Discount Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. WELCOME2026"
                    value={newDiscountCode}
                    onChange={(e) => setNewDiscountCode(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E2E7EF] rounded-lg text-xs text-[#202938] focus:outline-none focus:border-[#2563EB] uppercase font-mono"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#E2E7EF] pb-2">
                  <h4 className="text-xs font-bold text-[#172554] uppercase tracking-wider">Line Items & Snapshots</h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </button>
                </div>

                {newItems.map((item, index) => {
                  const selectedProduct = products.find((p) => p.id === item.productId);
                  return (
                    <div
                      key={index}
                      className="p-4 bg-[#F8FAFC] border border-[#E2E7EF] rounded-xl space-y-3 relative"
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="absolute top-3 right-3 text-[#6B7280] hover:text-[#B91C1C] p-1 rounded-lg hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#596579] mb-1">Product</label>
                          <select
                            value={item.productId}
                            onChange={(e) => handleProductSelect(index, e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-[#E2E7EF] rounded-lg text-xs text-[#202938]"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 0 && (
                          <div>
                            <label className="block text-[11px] font-semibold text-[#596579] mb-1">Variant Tier</label>
                            <select
                              value={item.variantId}
                              onChange={(e) => handleVariantSelect(index, e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-[#E2E7EF] rounded-lg text-xs text-[#202938]"
                            >
                              {selectedProduct.variants.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.name} (+₹{v.priceAdjustment})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-semibold text-[#596579] mb-1">Description</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemFieldChange(index, "description", e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-[#E2E7EF] rounded-lg text-xs text-[#202938]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[#596579] mb-1">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemFieldChange(index, "quantity", Math.max(1, parseInt(e.target.value, 10) || 1))
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-[#E2E7EF] rounded-lg text-xs text-[#202938] text-center"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[#596579] mb-1">Unit Price (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleItemFieldChange(index, "unitPrice", parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-[#E2E7EF] rounded-lg text-xs text-[#202938] font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#596579] mb-1">Tax Rate (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.taxRate}
                            onChange={(e) =>
                              handleItemFieldChange(index, "taxRate", parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-[#E2E7EF] rounded-lg text-xs text-[#202938] font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[#596579] mb-1">Line Discount (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.discountAmount}
                            onChange={(e) =>
                              handleItemFieldChange(index, "discountAmount", parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-[#E2E7EF] rounded-lg text-xs text-[#202938] font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Financial Calculation Preview */}
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E7EF] rounded-xl space-y-2 text-xs">
                <div className="flex justify-between text-[#596579]">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#172554]">₹{formTotals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#596579]">
                  <span>Estimated Tax</span>
                  <span className="font-semibold text-[#172554]">+₹{formTotals.taxAmount.toFixed(2)}</span>
                </div>
                {formTotals.discountAmount > 0 && (
                  <div className="flex justify-between text-[#15803D]">
                    <span>Line Discounts</span>
                    <span className="font-semibold">-₹{formTotals.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-[#E2E7EF] pt-2 flex justify-between text-sm font-bold text-[#172554]">
                  <span>Total Amount</span>
                  <span className="text-[#15803D] text-base">₹{formTotals.total.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Payment instructions, bank wire remarks..."
                  className="w-full px-3 py-2 bg-white border border-[#E2E7EF] rounded-lg text-xs text-[#202938] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E2E7EF]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#596579] hover:bg-[#F8FAFC] border border-[#E2E7EF] rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg shadow-sm hover:shadow transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Generating..." : "Save Draft Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Invoice Details Modal */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E2E7EF] shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 px-6 border-b border-[#E2E7EF] bg-[#F8FAFC]">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-5 h-5 text-[#2563EB]" />
                <span className="font-bold text-[#172554] text-base">
                  Invoice {selectedInvoice.invoiceNumber}
                </span>
                {getStatusBadge(selectedInvoice.status, selectedInvoice.isOverdue)}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-white hover:bg-[#F8FAFC] border border-[#E2E7EF] rounded-lg text-[#172554] shadow-sm transition"
                >
                  <Printer className="w-3.5 h-3.5 mr-1 text-[#596579]" />
                  Print
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-[#6B7280] hover:text-[#172554] p-1.5 rounded-lg hover:bg-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="p-8 overflow-y-auto space-y-6 flex-1 bg-white print:p-0">
              {/* Branding & Invoice Meta */}
              <div className="flex justify-between items-start border-b border-[#E2E7EF] pb-6">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-[#172554]">
                    Bright<span className="text-[#2563EB]">Loop</span>
                  </h1>
                  <p className="text-xs text-[#596579] mt-1 font-medium">Enterprise Subscription Billing Platform</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold font-mono text-[#172554]">
                    {selectedInvoice.invoiceNumber}
                  </div>
                  <div className="text-xs text-[#596579] mt-1 font-medium">
                    Issue Date: {new Date(selectedInvoice.issueDate).toLocaleDateString()}
                  </div>
                  <div className="text-xs font-semibold text-[#172554] mt-0.5">
                    Due Date: {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Bill To Info */}
              <div className="grid grid-cols-2 gap-6 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E7EF]">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#596579] mb-2">Billed To</h4>
                  <div className="text-sm font-bold text-[#172554]">
                    {selectedInvoice.customer?.companyName || "N/A"}
                  </div>
                  <div className="text-xs text-[#263247] mt-0.5 font-medium">
                    Attn: {selectedInvoice.customer?.contactName}
                  </div>
                  <div className="text-xs text-[#596579]">{selectedInvoice.customer?.email}</div>
                  {selectedInvoice.customer?.billingAddress && (
                    <div className="text-xs text-[#596579] mt-1">{selectedInvoice.customer.billingAddress}</div>
                  )}
                  {selectedInvoice.customer?.taxId && (
                    <div className="text-xs text-[#596579] font-mono mt-0.5 font-medium">
                      Tax ID: {selectedInvoice.customer.taxId}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#596579] mb-2">Subscription Details</h4>
                  {selectedInvoice.subscription ? (
                    <div className="text-xs space-y-1 text-[#263247]">
                      <div>
                        Contract:{" "}
                        <span className="font-mono font-bold text-[#7C3AED]">
                          {selectedInvoice.subscription.subscriptionNumber}
                        </span>
                      </div>
                      <div>Plan: <span className="font-semibold text-[#172554]">{selectedInvoice.subscription.plan?.name}</span></div>
                      <div>Terms: <span className="font-medium text-[#596579]">{selectedInvoice.subscription.paymentTerms}</span></div>
                    </div>
                  ) : (
                    <div className="text-xs text-[#596579] italic">Direct Ad-hoc Commercial Invoice</div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-[#E2E7EF] rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E7EF] text-[11px] font-bold text-[#344054] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Item & Description</th>
                      <th className="py-3 px-4 text-center">Qty</th>
                      <th className="py-3 px-4 text-right">Unit Price</th>
                      <th className="py-3 px-4 text-right">Tax</th>
                      <th className="py-3 px-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E7EF] text-[#263247]">
                    {(selectedInvoice.items || []).map((item) => {
                      const lineSub = parseFloat(String(item.unitPrice)) * (item.quantity || 1);
                      const lineTax = parseFloat(String(item.taxAmount)) || 0;
                      const lineDisc = parseFloat(String(item.discountAmount)) || 0;
                      const lineTot = lineSub + lineTax - lineDisc;

                      return (
                        <tr key={item.id} className="hover:bg-[#F8FAFC]">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-[#172554]">{item.description || item.product?.name}</div>
                            {item.variant && (
                              <div className="text-[11px] text-[#596579]">Variant: {item.variant.name}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-[#172554]">{item.quantity}</td>
                          <td className="py-3.5 px-4 text-right font-mono text-[#263247]">
                            ₹{parseFloat(String(item.unitPrice)).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-[#596579]">
                            {parseFloat(String(item.taxRate))}% (₹{lineTax.toFixed(2)})
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-[#172554]">
                            ₹{lineTot.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals Breakdown */}
              <div className="flex justify-end">
                <div className="w-72 space-y-2 text-xs bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E7EF]">
                  <div className="flex justify-between text-[#596579]">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-[#172554]">
                      ₹
                      {(
                        parseFloat(String(selectedInvoice.totalAmount)) -
                        parseFloat(String(selectedInvoice.taxAmount)) +
                        parseFloat(String(selectedInvoice.discountAmount))
                      ).toFixed(2)}
                    </span>
                  </div>
                  {parseFloat(String(selectedInvoice.discountAmount)) > 0 && (
                    <div className="flex justify-between text-[#15803D]">
                      <span>Discount Applied:</span>
                      <span className="font-semibold">
                        -₹{parseFloat(String(selectedInvoice.discountAmount)).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#596579]">
                    <span>Taxes & GST:</span>
                    <span className="font-semibold text-[#172554]">
                      +₹{parseFloat(String(selectedInvoice.taxAmount)).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-[#E2E7EF] pt-2 flex justify-between font-bold text-sm text-[#172554]">
                    <span>Invoice Total:</span>
                    <span>₹{parseFloat(String(selectedInvoice.totalAmount)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#15803D] font-semibold">
                    <span>Amount Paid:</span>
                    <span>₹{parseFloat(String(selectedInvoice.amountPaid)).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-[#E2E7EF] pt-2 flex justify-between font-black text-sm text-[#172554]">
                    <span>Balance Due:</span>
                    <span
                      className={
                        parseFloat(String(selectedInvoice.totalAmount)) -
                          parseFloat(String(selectedInvoice.amountPaid)) >
                        0
                          ? "text-[#B91C1C]"
                          : "text-[#15803D]"
                      }
                    >
                      ₹
                      {Math.max(
                        0,
                        parseFloat(String(selectedInvoice.totalAmount)) -
                          parseFloat(String(selectedInvoice.amountPaid))
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 px-6 border-t border-[#E2E7EF] bg-[#F8FAFC] flex items-center justify-between">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[#596579] hover:bg-white border border-[#E2E7EF] rounded-lg transition shadow-sm"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {selectedInvoice.status === "DRAFT" && (
                  <button
                    onClick={() => handleConfirmInvoice(selectedInvoice.id)}
                    disabled={actionLoadingId === selectedInvoice.id}
                    className="px-4 py-2 text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg shadow-sm hover:shadow transition"
                  >
                    Confirm & Issue Invoice
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
