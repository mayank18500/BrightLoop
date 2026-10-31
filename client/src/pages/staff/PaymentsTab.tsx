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
  TrendingUp,
  Receipt,
  Split,
  IndianRupee,
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
        text: `Allocations (₹${totalAlloc.toFixed(2)}) cannot exceed payment amount (₹${amountNum.toFixed(2)}).`,
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
        text: `Payment ${created.paymentNumber} recorded successfully (₹${amountNum.toFixed(2)}).`,
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
        text: `Allocation (₹${totalToAllocate.toFixed(2)}) exceeds available float (₹${availableFloat.toFixed(2)}).`,
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
        text: `Successfully allocated ₹${totalToAllocate.toFixed(2)} to selected invoices.`,
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-[#7C3AED] border border-purple-200">
            UPI
          </span>
        );
      case "BANK_TRANSFER":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#1D4ED8] border border-blue-200">
            Bank Transfer
          </span>
        );
      case "CASH":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-[#15803D] border border-emerald-200">
            Cash
          </span>
        );
      case "CHEQUE":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-[#B45309] border border-amber-200">
            Cheque
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F1F5F9] text-[#475569] border border-[#E2E7EF]">
            Other
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#172554] flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-[#2563EB]" />
            Payment Management & Multi-Invoice Allocation
          </h2>
          <p className="text-sm text-[#596579] mt-1">
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
          className="inline-flex items-center px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs rounded-lg shadow-sm hover:shadow transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Record Payment
        </button>
      </div>

      {/* Financial Metrics Ribbon */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#15803D]">Total Collected</span>
              <div className="p-2 bg-emerald-100/60 text-[#15803D] rounded-lg">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-bold text-[#15803D]">₹{metrics.totalRecorded}</div>
              <div className="text-xs text-[#596579] mt-1">{metrics.paymentCount} total payment receipts</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E2E7EF] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#596579]">Allocated to Invoices</span>
              <div className="p-2 bg-blue-50 text-[#1D4ED8] rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-bold text-[#172554]">₹{metrics.totalAllocated}</div>
              <div className="text-xs text-[#596579] mt-1">Directly settled receivables</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#B45309]">Unallocated Float</span>
              <div className="p-2 bg-amber-100/60 text-[#B45309] rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-bold text-[#B45309]">₹{metrics.totalUnallocated}</div>
              <div className="text-xs text-[#596579] mt-1">Customer credit balance / advance</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E2E7EF] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#596579]">Settlement Ratio</span>
              <div className="p-2 bg-purple-50 text-[#7C3AED] rounded-lg">
                <Split className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl font-bold text-[#172554]">
                {parseFloat(metrics.totalRecorded) > 0
                  ? `${((parseFloat(metrics.totalAllocated) / parseFloat(metrics.totalRecorded)) * 100).toFixed(1)}%`
                  : "0.0%"}
              </div>
              <div className="text-xs text-[#596579] mt-1">Funds allocated to invoices</div>
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
          {(["ALL", "UPI", "BANK_TRANSFER", "CASH", "CHEQUE", "OTHER"] as const).map((method) => (
            <button
              key={method}
              onClick={() => setMethodFilter(method)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                methodFilter === method
                  ? "bg-[#2563EB] text-white shadow-sm"
                  : "bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#596579] border border-[#E2E7EF]"
              }`}
            >
              {method === "BANK_TRANSFER" ? "Bank Wire" : method}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-[#596579] font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={onlyFloat}
              onChange={(e) => setOnlyFloat(e.target.checked)}
              className="rounded text-[#2563EB]"
            />
            <span>Unallocated Float Only</span>
          </label>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#687386]" />
            <input
              type="text"
              placeholder="Search payment #, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E2E7EF] rounded-lg text-xs text-[#202938] placeholder-[#687386] focus:outline-none focus:border-[#2563EB]"
            />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-[#E2E7EF] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#596579] flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#2563EB] mb-2" />
            <span className="text-xs">Loading payment records...</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-[#596579]">
            <Receipt className="w-12 h-12 text-[#687386] mx-auto mb-3" />
            <h3 className="text-base font-semibold text-[#172554]">No Payments Found</h3>
            <p className="text-xs text-[#596579] mt-1">
              Record a payment above to allocate funds across customer invoices.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#263247]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E7EF] text-[11px] font-bold text-[#344054] uppercase tracking-wider">
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
              <tbody className="divide-y divide-[#E2E7EF]">
                {payments.map((p) => {
                  const amt = parseFloat(String(p.amount)) || 0;
                  const unalloc = parseFloat(String(p.unallocatedAmount)) || 0;
                  const alloc = amt - unalloc;

                  return (
                    <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#2563EB]">
                        {p.paymentNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#172554]">{p.customer?.companyName || "N/A"}</div>
                        <div className="text-[11px] text-[#596579]">{p.customer?.contactName}</div>
                      </td>
                      <td className="py-3.5 px-4">{getMethodBadge(p.paymentMethod)}</td>
                      <td className="py-3.5 px-4 text-xs text-[#263247]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#596579]" />
                          <span>{new Date(p.paymentDate).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#172554]">
                        ₹{amt.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#15803D]">
                        ₹{alloc.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span className={unalloc > 0 ? "text-[#B45309]" : "text-[#6B7280]"}>
                          ₹{unalloc.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F1F5F9] text-[#475569] border border-[#E2E7EF]">
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
                            className="p-1.5 text-[#596579] hover:text-[#2563EB] hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {unalloc > 0 && (
                            <button
                              onClick={() => handleOpenAllocateModal(p)}
                              className="px-2.5 py-1 text-xs font-semibold bg-amber-50 text-[#B45309] hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E2E7EF] shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#E2E7EF] bg-[#F8FAFC]">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-6 h-6 text-[#2563EB]" />
                <h3 className="text-lg font-bold text-[#172554]">Record Incoming Payment</h3>
              </div>
              <button
                onClick={() => setShowRecordModal(false)}
                className="text-[#6B7280] hover:text-[#172554] p-1.5 rounded-lg hover:bg-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">Customer *</label>
                  <select
                    required
                    value={recordCustomerId}
                    onChange={(e) => setRecordCustomerId(e.target.value)}
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
                  <label className="block text-xs font-semibold text-[#344054] mb-1">Payment Method *</label>
                  <select
                    value={recordMethod}
                    onChange={(e) => setRecordMethod(e.target.value as PaymentMethodType)}
                    className="w-full px-3 py-2 bg-white border border-[#E2E7EF] rounded-lg text-xs text-[#202938] focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank Wire / Transfer</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">Payment Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={recordAmount}
                    onChange={(e) => setRecordAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E2E7EF] rounded-lg text-xs text-[#202938] font-mono focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E2E7EF] rounded-lg text-xs text-[#202938] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              {/* Multi-Invoice Allocation Table */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-[#E2E7EF] pb-2">
                  <div>
                    <h4 className="text-xs font-bold text-[#172554] uppercase tracking-wider">
                      Allocate Directly to Outstanding Invoices
                    </h4>
                    <p className="text-[11px] text-[#596579]">
                      Unallocated balance will be retained as customer credit float.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#15803D]">
                    Allocated: ₹{getTotalAllocatedInForm().toFixed(2)}
                  </span>
                </div>

                {!recordCustomerId ? (
                  <div className="p-4 bg-[#F8FAFC] border border-[#E2E7EF] rounded-xl text-center text-xs text-[#596579]">
                    Select a customer above to view eligible confirmed unpaid invoices.
                  </div>
                ) : customerInvoices.length === 0 ? (
                  <div className="p-4 bg-[#F8FAFC] border border-[#E2E7EF] rounded-xl text-center text-xs text-[#596579]">
                    No unpaid invoices found for this customer. Entire payment will remain as unallocated credit float.
                  </div>
                ) : (
                  <div className="border border-[#E2E7EF] rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8FAFC] text-[#344054] font-bold uppercase border-b border-[#E2E7EF] text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3">Invoice #</th>
                          <th className="py-2.5 px-3">Due Date</th>
                          <th className="py-2.5 px-3 text-right">Total</th>
                          <th className="py-2.5 px-3 text-right">Balance Due</th>
                          <th className="py-2.5 px-3 text-right">Allocate (₹)</th>
                          <th className="py-2.5 px-3 text-center">Quick Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E7EF] text-[#263247]">
                        {customerInvoices.map((inv) => {
                          const tot = parseFloat(String(inv.totalAmount)) || 0;
                          const pd = parseFloat(String(inv.amountPaid)) || 0;
                          const bal = Math.max(0, tot - pd);
                          const val = invoiceAllocations[inv.id] || 0;

                          return (
                            <tr key={inv.id} className="hover:bg-[#F8FAFC]">
                              <td className="py-2.5 px-3 font-mono font-bold text-[#2563EB]">
                                {inv.invoiceNumber}
                              </td>
                              <td className="py-2.5 px-3 text-[#596579]">
                                {new Date(inv.dueDate).toLocaleDateString()}
                              </td>
                              <td className="py-2.5 px-3 text-right font-medium">₹{tot.toFixed(2)}</td>
                              <td className="py-2.5 px-3 text-right font-bold text-[#172554]">
                                ₹{bal.toFixed(2)}
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
                                    handleAllocationChange(inv.id, parseFloat(e.target.value) || 0)
                                  }
                                  className="w-24 px-2 py-1 text-right bg-white border border-[#E2E7EF] rounded text-xs font-semibold focus:outline-none focus:border-[#2563EB]"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handlePayFullInvoice(inv)}
                                  className="px-2 py-0.5 text-[10px] font-semibold bg-[#F1F5F9] hover:bg-[#E2E7EF] text-[#172554] border border-[#E2E7EF] rounded transition-colors"
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
                <div className="p-4 bg-[#F8FAFC] border border-[#E2E7EF] rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#596579]">
                    <span>Total Payment:</span>
                    <span className="font-bold text-[#172554] text-sm">
                      ₹{parseFloat(String(recordAmount)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#596579]">
                    <span>Allocated to Invoices:</span>
                    <span className="text-[#15803D] font-bold">
                      -₹{getTotalAllocatedInForm().toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-[#E2E7EF] pt-1.5 flex justify-between font-bold text-sm text-[#B45309]">
                    <span>Remaining Unallocated Float:</span>
                    <span>
                      ₹
                      {Math.max(
                        0,
                        parseFloat(String(recordAmount)) - getTotalAllocatedInForm()
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">Reference Notes</label>
                <textarea
                  rows={2}
                  value={recordNotes}
                  onChange={(e) => setRecordNotes(e.target.value)}
                  placeholder="Bank UTR #, Cheque number, deposit slip remarks..."
                  className="w-full px-3 py-2 bg-white border border-[#E2E7EF] rounded-lg text-xs text-[#202938] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E2E7EF]">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#596579] hover:bg-[#F8FAFC] border border-[#E2E7EF] rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg shadow-sm hover:shadow transition disabled:opacity-50 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E2E7EF] shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#E2E7EF] bg-[#F8FAFC]">
              <div>
                <h3 className="text-lg font-bold text-[#172554]">Allocate Payment Float</h3>
                <p className="text-xs text-[#596579] mt-0.5">
                  Payment #{allocatePaymentTarget.paymentNumber} • Available Float:{" "}
                  <span className="font-bold text-[#B45309]">
                    ₹{parseFloat(String(allocatePaymentTarget.unallocatedAmount)).toFixed(2)}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setShowAllocateModal(false)}
                className="text-[#6B7280] hover:text-[#172554] p-1.5 rounded-lg hover:bg-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSecondaryAllocateSubmit} className="p-6 space-y-5 text-xs">
              {targetCustomerInvoices.length === 0 ? (
                <div className="p-6 bg-[#F8FAFC] border border-[#E2E7EF] rounded-xl text-center text-xs text-[#596579]">
                  No confirmed unpaid invoices found for this customer.
                </div>
              ) : (
                <div className="border border-[#E2E7EF] rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] text-[#344054] font-bold uppercase border-b border-[#E2E7EF] text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Invoice #</th>
                        <th className="py-2.5 px-3">Due Date</th>
                        <th className="py-2.5 px-3 text-right">Balance Due</th>
                        <th className="py-2.5 px-3 text-right">Allocate Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E7EF] text-[#263247]">
                      {targetCustomerInvoices.map((inv) => {
                        const tot = parseFloat(String(inv.totalAmount)) || 0;
                        const pd = parseFloat(String(inv.amountPaid)) || 0;
                        const bal = Math.max(0, tot - pd);
                        const val = secondaryAllocations[inv.id] || 0;

                        return (
                          <tr key={inv.id} className="hover:bg-[#F8FAFC]">
                            <td className="py-2.5 px-3 font-mono font-bold text-[#2563EB]">
                              {inv.invoiceNumber}
                            </td>
                            <td className="py-2.5 px-3 text-[#596579]">
                              {new Date(inv.dueDate).toLocaleDateString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-[#172554]">
                              ₹{bal.toFixed(2)}
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
                                className="w-24 px-2 py-1 text-right bg-white border border-[#E2E7EF] rounded text-xs font-semibold focus:outline-none focus:border-[#2563EB]"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E2E7EF]">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#596579] hover:bg-[#F8FAFC] border border-[#E2E7EF] rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || targetCustomerInvoices.length === 0}
                  className="px-5 py-2 text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg shadow-sm hover:shadow transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Allocating..." : "Confirm Allocations"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Receipt Modal */}
      {showReceiptModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E2E7EF] shadow-2xl max-w-xl w-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 px-6 border-b border-[#E2E7EF] bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#2563EB]" />
                <span className="font-bold text-[#172554] text-base">Payment Receipt</span>
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
                  onClick={() => setShowReceiptModal(false)}
                  className="text-[#6B7280] hover:text-[#172554] p-1.5 rounded-lg hover:bg-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5 text-xs bg-white">
              <div className="flex justify-between items-start border-b border-[#E2E7EF] pb-4">
                <div>
                  <h3 className="text-xl font-black text-[#172554]">
                    Bright<span className="text-[#2563EB]">Loop</span>
                  </h3>
                  <p className="text-[11px] text-[#596579]">Official Commercial Payment Voucher</p>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-sm text-[#172554]">
                    {selectedPayment.paymentNumber}
                  </div>
                  <div className="text-[#596579] mt-0.5">
                    Date: {new Date(selectedPayment.paymentDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E7EF]">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#596579] mb-1">
                    Received From
                  </div>
                  <div className="text-sm font-bold text-[#172554]">
                    {selectedPayment.customer?.companyName || "N/A"}
                  </div>
                  <div className="text-[#263247] mt-0.5">{selectedPayment.customer?.contactName}</div>
                  <div className="text-[#596579]">{selectedPayment.customer?.email}</div>
                </div>

                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#596579] mb-1">
                    Transaction Details
                  </div>
                  <div className="text-sm font-bold text-[#15803D]">
                    ₹{parseFloat(String(selectedPayment.amount)).toFixed(2)}
                  </div>
                  <div className="text-[#263247] mt-0.5 font-medium">Method: {selectedPayment.paymentMethod}</div>
                  <div className="text-[#596579] mt-0.5">
                    Available Float: ₹{parseFloat(String(selectedPayment.unallocatedAmount)).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Allocations Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#172554] mb-2">
                  Invoice Settlements
                </h4>
                {selectedPayment.allocations && selectedPayment.allocations.length > 0 ? (
                  <div className="border border-[#E2E7EF] rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8FAFC] border-b border-[#E2E7EF] text-[11px] font-bold text-[#344054] uppercase">
                        <tr>
                          <th className="py-2.5 px-3">Invoice #</th>
                          <th className="py-2.5 px-3 text-right">Settled Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E7EF] text-[#263247]">
                        {selectedPayment.allocations.map((a) => (
                          <tr key={a.id} className="hover:bg-[#F8FAFC]">
                            <td className="py-2 px-3 font-mono font-bold text-[#2563EB]">
                              {a.invoice?.invoiceNumber || a.invoiceId}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-[#15803D]">
                              ₹{parseFloat(String(a.amount)).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E7EF] rounded-xl text-center text-[#596579]">
                    No immediate invoice settlements recorded. Retained as customer credit advance.
                  </div>
                )}
              </div>

              {selectedPayment.notes && (
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E7EF] rounded-xl text-[#596579]">
                  <span className="font-semibold text-[#172554]">Notes: </span>
                  {selectedPayment.notes}
                </div>
              )}
            </div>

            <div className="p-4 px-6 border-t border-[#E2E7EF] bg-[#F8FAFC] flex justify-end">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[#596579] hover:bg-white border border-[#E2E7EF] rounded-lg transition shadow-sm"
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
