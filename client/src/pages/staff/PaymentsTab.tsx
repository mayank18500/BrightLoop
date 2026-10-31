import React, { useEffect, useState } from "react";
import {
  paymentService,
  Payment,
  PaymentMetrics,
  PaymentMethodType,
  RecordPaymentPayload,
} from "../../services/paymentService";
import { quotationService, CustomerInfo } from "../../services/quotationService";
import { invoiceService, Invoice } from "../../services/invoiceService";
import {
  CreditCard,
  Plus,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  Printer,
  DollarSign,
  TrendingUp,
  Receipt,
  Split,
} from "lucide-react";

export const PaymentsTab: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [metrics, setMetrics] = useState<PaymentMetrics | null>(null);
  const [customers, setCustomers] = useState<CustomerInfo[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");
  const [onlyFloat, setOnlyFloat] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Form State for Recording Payment
  const [recordCustomerId, setRecordCustomerId] = useState("");
  const [recordMethod, setRecordMethod] = useState<PaymentMethodType>("UPI");
  const [recordAmount, setRecordAmount] = useState<number | string>("");
  const [recordDate, setRecordDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [recordNotes, setRecordNotes] = useState("");
  const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([]);
  const [invoiceAllocations, setInvoiceAllocations] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  // Allocate Existing Payment Modal State
  const [allocatePaymentTarget, setAllocatePaymentTarget] = useState<Payment | null>(null);
  const [targetCustomerInvoices, setTargetCustomerInvoices] = useState<Invoice[]>([]);
  const [secondaryAllocations, setSecondaryAllocations] = useState<Record<string, number>>({});

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, metricsRes, customersRes] = await Promise.all([
        paymentService.getPayments({
          paymentMethod: methodFilter !== "ALL" ? methodFilter : undefined,
          hasUnallocated: onlyFloat ? true : undefined,
          search: search || undefined,
        }),
        paymentService.getPaymentMetrics(),
        quotationService.listCustomers(),
      ]);

      setPayments(paymentsRes.data);
      setMetrics(metricsRes);
      setCustomers(customersRes);
    } catch (err: any) {
      console.error("Failed to load payment records", err);
      setFeedback({
        type: "error",
        text: err.response?.data?.error?.message || "Failed to load payment history.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [methodFilter, onlyFloat, search]);

  // When customer changes in record modal, fetch customer's unpaid invoices
  useEffect(() => {
    if (!recordCustomerId) {
      setCustomerInvoices([]);
      setInvoiceAllocations({});
      return;
    }

    const fetchInvoices = async () => {
      try {
        const res = await invoiceService.getInvoices({
          customerId: recordCustomerId,
          status: "CONFIRMED",
        });
        // Filter invoices with positive balance due
        const unpaid = res.data.filter((inv) => {
          const tot = parseFloat(String(inv.totalAmount)) || 0;
          const pd = parseFloat(String(inv.amountPaid)) || 0;
          return tot - pd > 0;
        });
        setCustomerInvoices(unpaid);
        setInvoiceAllocations({});
      } catch (err) {
        console.error("Failed to fetch customer invoices", err);
      }
    };

    fetchInvoices();
  }, [recordCustomerId]);

  const handleOpenAllocateModal = async (payment: Payment) => {
    setAllocatePaymentTarget(payment);
    setSecondaryAllocations({});
    try {
      const res = await invoiceService.getInvoices({
        customerId: payment.customerId,
        status: "CONFIRMED",
      });
      const unpaid = res.data.filter((inv) => {
        const tot = parseFloat(String(inv.totalAmount)) || 0;
        const pd = parseFloat(String(inv.amountPaid)) || 0;
        return tot - pd > 0;
      });
      setTargetCustomerInvoices(unpaid);
      setShowAllocateModal(true);
    } catch (err) {
      console.error("Failed to fetch target invoices for allocation", err);
    }
  };

  const handleAllocationChange = (invoiceId: string, val: number) => {
    setInvoiceAllocations((prev) => ({
      ...prev,
      [invoiceId]: Math.max(0, val),
    }));
  };

  const handlePayFullInvoice = (inv: Invoice) => {
    const tot = parseFloat(String(inv.totalAmount)) || 0;
    const pd = parseFloat(String(inv.amountPaid)) || 0;
    const balance = Math.max(0, tot - pd);
    setInvoiceAllocations((prev) => ({
      ...prev,
      [inv.id]: balance,
    }));
  };

  const getTotalAllocatedInForm = () => {
    return Object.values(invoiceAllocations).reduce((sum, v) => sum + (v || 0), 0);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(String(recordAmount)) || 0;
    if (amountNum <= 0) {
      setFeedback({ type: "error", text: "Please enter a valid positive payment amount." });
      return;
    }

    const totalAlloc = getTotalAllocatedInForm();
    if (totalAlloc > amountNum) {
      setFeedback({
        type: "error",
        text: `Allocations ($${totalAlloc.toFixed(2)}) cannot exceed payment amount ($${amountNum.toFixed(2)}).`,
      });
      return;
    }

    try {
      setSubmitting(true);
      const allocationsPayload = Object.entries(invoiceAllocations)
        .filter(([_, amt]) => amt > 0)
        .map(([invoiceId, amt]) => ({
          invoiceId,
          amount: amt,
        }));

      const payload: RecordPaymentPayload = {
        customerId: recordCustomerId,
        paymentMethod: recordMethod,
        amount: amountNum,
        paymentDate: new Date(recordDate).toISOString(),
        notes: recordNotes || undefined,
        allocations: allocationsPayload.length > 0 ? allocationsPayload : undefined,
      };

      const created = await paymentService.recordPayment(payload);
      setFeedback({
        type: "success",
        text: `Payment ${created.paymentNumber} recorded successfully ($${amountNum.toFixed(2)}).`,
      });
      setShowRecordModal(false);
      // Reset
      setRecordCustomerId("");
      setRecordAmount("");
      setRecordNotes("");
      setInvoiceAllocations({});
      await loadData();
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.response?.data?.error?.message || "Failed to record payment.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSecondaryAllocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocatePaymentTarget) return;

    const allocationsPayload = Object.entries(secondaryAllocations)
      .filter(([_, amt]) => amt > 0)
      .map(([invoiceId, amt]) => ({
        invoiceId,
        amount: amt,
      }));

    if (allocationsPayload.length === 0) {
      setFeedback({ type: "error", text: "Specify at least one invoice allocation." });
      return;
    }

    const totalToAllocate = allocationsPayload.reduce((sum, a) => sum + a.amount, 0);
    const availableFloat = parseFloat(String(allocatePaymentTarget.unallocatedAmount)) || 0;

    if (totalToAllocate > availableFloat) {
      setFeedback({
        type: "error",
        text: `Allocation ($${totalToAllocate.toFixed(2)}) exceeds available float ($${availableFloat.toFixed(2)}).`,
      });
      return;
    }

    try {
      setSubmitting(true);
      await paymentService.allocatePayment(allocatePaymentTarget.id, {
        allocations: allocationsPayload,
      });
      setFeedback({
        type: "success",
        text: `Successfully allocated $${totalToAllocate.toFixed(2)} to selected invoices.`,
      });
      setShowAllocateModal(false);
      setAllocatePaymentTarget(null);
      await loadData();
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.response?.data?.error?.message || "Failed to allocate funds.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getMethodBadge = (method: PaymentMethodType) => {
    switch (method) {
      case "UPI":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            UPI
          </span>
        );
      case "BANK_TRANSFER":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Bank Transfer
          </span>
        );
      case "CASH":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Cash
          </span>
        );
      case "CHEQUE":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Cheque
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-50 text-slate-700 border border-slate-200">
            Other
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-indigo-600" />
            Payment Management & Multi-Invoice Allocation
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Record manual incoming receipts (UPI, Bank Wire, Cheque) and allocate funds across customer invoices.
          </p>
        </div>
        <button
          onClick={() => {
            setRecordCustomerId("");
            setRecordAmount("");
            setRecordNotes("");
            setInvoiceAllocations({});
            setShowRecordModal(true);
          }}
          className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Record Payment
        </button>
      </div>

      {/* Financial Metrics Ribbon */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Collected</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-emerald-600">${metrics.totalRecorded}</div>
              <div className="text-xs text-slate-500 mt-1">{metrics.paymentCount} total payment receipts</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Allocated to Invoices</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-blue-600">${metrics.totalAllocated}</div>
              <div className="text-xs text-slate-500 mt-1">Directly settled receivables</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Unallocated Float</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-amber-600">${metrics.totalUnallocated}</div>
              <div className="text-xs text-slate-500 mt-1">Customer credit balance / advance</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Settlement Ratio</span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Split className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900">
                {parseFloat(metrics.totalRecorded) > 0
                  ? `${((parseFloat(metrics.totalAllocated) / parseFloat(metrics.totalRecorded)) * 100).toFixed(1)}%`
                  : "0.0%"}
              </div>
              <div className="text-xs text-slate-500 mt-1">Funds allocated to invoices</div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <span className="text-sm font-medium">{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          {(["ALL", "UPI", "BANK_TRANSFER", "CASH", "CHEQUE", "OTHER"] as const).map((method) => (
            <button
              key={method}
              onClick={() => setMethodFilter(method)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                methodFilter === method
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {method === "ALL" ? "All Methods" : method.replace("_", " ")}
            </button>
          ))}
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 ml-3 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyFloat}
              onChange={(e) => setOnlyFloat(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Unallocated Float Only</span>
          </label>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search payment #, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <span>Loading payment records...</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No Payments Found</h3>
            <p className="text-sm text-slate-500 mt-1">
              Record a payment above to allocate funds across customer invoices.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Payment #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">Payment Date</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-right">Allocated</th>
                  <th className="py-3.5 px-4 text-right">Unallocated Float</th>
                  <th className="py-3.5 px-4 text-center">Allocations</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => {
                  const amt = parseFloat(String(p.amount)) || 0;
                  const unalloc = parseFloat(String(p.unallocatedAmount)) || 0;
                  const alloc = amt - unalloc;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                        {p.paymentNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{p.customer?.companyName || "N/A"}</div>
                        <div className="text-xs text-slate-500">{p.customer?.contactName}</div>
                      </td>
                      <td className="py-3.5 px-4">{getMethodBadge(p.paymentMethod)}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(p.paymentDate).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-900">
                        ${amt.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-emerald-600">
                        ${alloc.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold">
                        <span className={unalloc > 0 ? "text-amber-600" : "text-slate-400"}>
                          ${unalloc.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {p.allocations?.length || 0} invoice(s)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedPayment(p);
                              setShowReceiptModal(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {unalloc > 0 && (
                            <button
                              onClick={() => handleOpenAllocateModal(p)}
                              className="px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                              title="Allocate unallocated float to unpaid invoices"
                            >
                              Allocate Float
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

      {/* Record Payment Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-bold text-slate-900">Record Incoming Payment</h2>
              </div>
              <button
                onClick={() => setShowRecordModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Customer *</label>
                  <select
                    required
                    value={recordCustomerId}
                    onChange={(e) => setRecordCustomerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">Payment Method *</label>
                  <select
                    value={recordMethod}
                    onChange={(e) => setRecordMethod(e.target.value as PaymentMethodType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank Wire / Transfer</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Total Payment Received ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="e.g. 500.00"
                    value={recordAmount}
                    onChange={(e) => setRecordAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Multi-Invoice Allocation Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                      <Split className="w-4 h-4 text-indigo-600" />
                      Multi-Invoice Allocation (Optional Split)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Allocate incoming funds directly against outstanding invoices. Any excess becomes unallocated customer float.
                    </p>
                  </div>
                </div>

                {!recordCustomerId ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                    Select a customer above to view their outstanding invoices.
                  </div>
                ) : customerInvoices.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                    No confirmed unpaid invoices found for this customer. Total payment will be preserved as unallocated float.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Invoice #</th>
                          <th className="py-2.5 px-3">Due Date</th>
                          <th className="py-2.5 px-3 text-right">Total</th>
                          <th className="py-2.5 px-3 text-right">Balance Due</th>
                          <th className="py-2.5 px-3 text-right">Amount to Allocate ($)</th>
                          <th className="py-2.5 px-3 text-center">Quick Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customerInvoices.map((inv) => {
                          const tot = parseFloat(String(inv.totalAmount)) || 0;
                          const pd = parseFloat(String(inv.amountPaid)) || 0;
                          const bal = Math.max(0, tot - pd);
                          const allocVal = invoiceAllocations[inv.id] || 0;

                          return (
                            <tr key={inv.id}>
                              <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                                {inv.invoiceNumber}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500">
                                {new Date(inv.dueDate).toLocaleDateString()}
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-600">
                                ${tot.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-medium text-slate-900">
                                ${bal.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max={bal}
                                  value={allocVal > 0 ? allocVal : ""}
                                  placeholder="0.00"
                                  onChange={(e) =>
                                    handleAllocationChange(inv.id, parseFloat(e.target.value) || 0)
                                  }
                                  className="w-24 px-2 py-1 text-right bg-white border border-slate-200 rounded text-xs font-semibold"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handlePayFullInvoice(inv)}
                                  className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                                >
                                  Pay Full
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Allocation Summary Preview */}
              {parseFloat(String(recordAmount)) > 0 && (
                <div className="p-4 bg-slate-900 text-white rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Payment:</span>
                    <span className="font-bold text-sm">
                      ${parseFloat(String(recordAmount)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Allocated to Invoices:</span>
                    <span className="text-emerald-400 font-medium">
                      -${getTotalAllocatedInForm().toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-slate-800 pt-1.5 flex justify-between font-bold text-sm text-amber-400">
                    <span>Remaining Unallocated Float:</span>
                    <span>
                      $
                      {Math.max(
                        0,
                        parseFloat(String(recordAmount)) - getTotalAllocatedInForm()
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reference Notes</label>
                <textarea
                  rows={2}
                  value={recordNotes}
                  onChange={(e) => setRecordNotes(e.target.value)}
                  placeholder="Bank UTR #, Cheque number, deposit slip remarks..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Save Payment & Allocations"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocate Funds from Existing Payment Float Modal */}
      {showAllocateModal && allocatePaymentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Allocate Payment Float</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Payment #{allocatePaymentTarget.paymentNumber} • Available Float:{" "}
                  <span className="font-bold text-amber-600">
                    ${parseFloat(String(allocatePaymentTarget.unallocatedAmount)).toFixed(2)}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setShowAllocateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSecondaryAllocateSubmit} className="p-6 space-y-6">
              {targetCustomerInvoices.length === 0 ? (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm text-slate-500">
                  No confirmed unpaid invoices found for this customer.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Invoice #</th>
                        <th className="py-2.5 px-3">Due Date</th>
                        <th className="py-2.5 px-3 text-right">Balance Due</th>
                        <th className="py-2.5 px-3 text-right">Allocate Amount ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {targetCustomerInvoices.map((inv) => {
                        const tot = parseFloat(String(inv.totalAmount)) || 0;
                        const pd = parseFloat(String(inv.amountPaid)) || 0;
                        const bal = Math.max(0, tot - pd);
                        const val = secondaryAllocations[inv.id] || 0;

                        return (
                          <tr key={inv.id}>
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                              {inv.invoiceNumber}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">
                              {new Date(inv.dueDate).toLocaleDateString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-slate-900">
                              ${bal.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max={bal}
                                value={val > 0 ? val : ""}
                                placeholder="0.00"
                                onChange={(e) =>
                                  setSecondaryAllocations({
                                    ...secondaryAllocations,
                                    [inv.id]: Math.max(0, parseFloat(e.target.value) || 0),
                                  })
                                }
                                className="w-24 px-2 py-1 text-right bg-white border border-slate-200 rounded text-xs font-semibold"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || targetCustomerInvoices.length === 0}
                  className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {submitting ? "Allocating..." : "Confirm Allocations"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Receipt / Audit Modal */}
      {showReceiptModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 px-6 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <span className="font-semibold text-slate-800">
                  Payment Receipt {selectedPayment.paymentNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  Print
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 flex-1 bg-white print:p-0">
              <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900">
                    Bright<span className="text-indigo-600">Loop</span>
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">Official Payment Voucher & Receipt</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold font-mono text-slate-900">
                    {selectedPayment.paymentNumber}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Date: {new Date(selectedPayment.paymentDate).toLocaleDateString()}
                  </div>
                  <div className="mt-1">{getMethodBadge(selectedPayment.paymentMethod)}</div>
                </div>
              </div>

              {/* Customer Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs space-y-1">
                <span className="font-semibold uppercase tracking-wider text-slate-500">Customer Details</span>
                <div className="text-sm font-bold text-slate-900">
                  {selectedPayment.customer?.companyName || "N/A"}
                </div>
                <div className="text-slate-600">Attn: {selectedPayment.customer?.contactName}</div>
                <div className="text-slate-600">{selectedPayment.customer?.email}</div>
              </div>

              {/* Payment Allocation Breakdown */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Invoice Allocation Details
                </h3>
                {selectedPayment.allocations && selectedPayment.allocations.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Invoice Number</th>
                          <th className="py-2.5 px-3">Allocated Date</th>
                          <th className="py-2.5 px-3 text-right">Settled Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedPayment.allocations.map((alloc) => (
                          <tr key={alloc.id}>
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                              {alloc.invoice?.invoiceNumber || alloc.invoiceId}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">
                              {new Date(alloc.allocatedAt).toLocaleDateString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-emerald-600">
                              +${parseFloat(String(alloc.amount)).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                    No allocations created yet. Entire amount remains as customer float credit.
                  </div>
                )}
              </div>

              {/* Financial Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Payment:</span>
                    <span className="font-bold text-slate-900">
                      ${parseFloat(String(selectedPayment.amount)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Total Allocated:</span>
                    <span>
                      $
                      {(
                        parseFloat(String(selectedPayment.amount)) -
                        parseFloat(String(selectedPayment.unallocatedAmount))
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-amber-600">
                    <span>Unallocated Credit Balance:</span>
                    <span>${parseFloat(String(selectedPayment.unallocatedAmount)).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {selectedPayment.notes && (
                <div className="border-t border-slate-100 pt-4 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">Remarks: </span>
                  {selectedPayment.notes}
                </div>
              )}
            </div>

            <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
