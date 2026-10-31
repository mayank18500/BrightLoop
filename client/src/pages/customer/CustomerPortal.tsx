import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Building2,
  LogOut,
  Layers,
  FileText,
  CreditCard,
  User,
  MapPin,
  Receipt,
  Mail,
  Phone,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
  ShieldCheck,
  Pause,
  Play,
  Calendar,
  Clock,
  Printer,
  AlertTriangle,
} from "lucide-react";
import { quotationService, Quotation } from "../../services/quotationService";
import { subscriptionService, Subscription } from "../../services/subscriptionService";
import { invoiceService, Invoice } from "../../services/invoiceService";
import { paymentService, Payment } from "../../services/paymentService";

export interface CustomerPortalProps {
  embedded?: boolean;
  tab?: "overview" | "proposals" | "subscriptions" | "invoices" | "payments";
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({ embedded = false, tab }) => {
  const { user, customer, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(tab || "overview");

  useEffect(() => {
    if (tab) {
      setActiveTab(tab);
    }
  }, [tab]);

  return (
    <div className={embedded ? "space-y-6" : "min-h-screen bg-[#FCFCFA] text-[#263247] flex flex-col"}>
      {/* Top Navigation - only if standalone */}
      {!embedded && (
        <header className="border-b border-[#E2E7EF] bg-white px-6 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#2563EB] flex items-center justify-center font-bold text-white shadow-sm">
              BL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-[#172554] leading-none">BrightLoop</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#1D4ED8] border border-blue-200">
                  CUSTOMER PORTAL
                </span>
              </div>
              <p className="text-xs text-[#596579] mt-1">
                {customer?.companyName || "Commercial Client Workspace"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <div className="text-xs font-semibold text-[#172554]">{user?.name}</div>
              <div className="text-[11px] text-[#596579]">{user?.email}</div>
            </div>
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E7EF] bg-white hover:bg-[#F8FAFC] text-xs text-[#596579] hover:text-[#172554] font-medium transition cursor-pointer shadow-sm"
            >
              <LogOut className="h-3.5 w-3.5 text-[#596579]" />
              Sign Out
            </button>
          </div>
        </header>
      )}

      {/* Main Workspace Layout */}
      <div className={embedded ? "" : "flex-1 flex"}>
        {/* Sidebar Nav - only if standalone */}
        {!embedded && (
          <aside className="w-64 border-r border-[#E2E7EF] bg-white p-4 space-y-1 hidden md:block">
            <div className="text-[11px] font-bold text-[#596579] uppercase tracking-wider px-3 mb-2">
              My Services
            </div>
            {[
              { id: "overview", label: "Account Overview", icon: Building2 },
              { id: "proposals", label: "Proposals & Quotes", icon: FileText },
              { id: "subscriptions", label: "My Subscriptions", icon: Layers },
              { id: "invoices", label: "My Invoices", icon: Receipt },
              { id: "payments", label: "Payment History", icon: CreditCard },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() =>
                    setActiveTab(
                      item.id as "overview" | "proposals" | "subscriptions" | "invoices" | "payments"
                    )
                  }
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? "bg-[#2563EB] text-white shadow-sm"
                      : "text-[#596579] hover:text-[#172554] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </aside>
        )}

        {/* Workspace Body */}
        <main className={embedded ? "space-y-6" : "flex-1 p-6 md:p-8 space-y-6"}>
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#172554] tracking-tight">Customer Portal</h2>
                  <p className="text-sm text-[#596579] mt-1">
                    View your active software contracts, recurring renewals, and invoice settlement history.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#15803D] border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#15803D]" />
                  Verified Client
                </span>
              </div>

              {/* Customer Profile Card */}
              <div className="rounded-xl border border-[#E2E7EF] bg-white p-6 space-y-4 shadow-sm">
                <h3 className="text-base font-bold text-[#172554] flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#2563EB]" />
                  Registered Commercial Entity
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl border border-[#E2E7EF] bg-[#F8FAFC] space-y-2">
                    <div className="flex items-center gap-2 text-[#596579] font-bold uppercase tracking-wider text-[11px]">
                      <User className="h-4 w-4 text-[#2563EB]" />
                      Contact Person
                    </div>
                    <div className="text-base font-bold text-[#172554]">{customer?.contactName || user?.name}</div>
                    <div className="flex items-center gap-2 text-[#596579] pt-1">
                      <Mail className="h-3.5 w-3.5 text-[#596579]" />
                      {customer?.email || user?.email}
                    </div>
                    {customer?.phone && (
                      <div className="flex items-center gap-2 text-[#596579]">
                        <Phone className="h-3.5 w-3.5 text-[#596579]" />
                        {customer.phone}
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-xl border border-[#E2E7EF] bg-[#F8FAFC] space-y-2">
                    <div className="flex items-center gap-2 text-[#596579] font-bold uppercase tracking-wider text-[11px]">
                      <Receipt className="h-4 w-4 text-[#2563EB]" />
                      Billing & Tax Details
                    </div>
                    <div className="text-base font-bold text-[#172554]">{customer?.companyName}</div>
                    <div className="text-[#596579] pt-1">
                      Tax / GST ID: <span className="font-mono font-semibold text-[#172554]">{customer?.taxId || "Not Registered"}</span>
                    </div>
                    <div className="flex items-start gap-2 text-[#596579] pt-1">
                      <MapPin className="h-3.5 w-3.5 text-[#596579] shrink-0 mt-0.5" />
                      <span>{customer?.billingAddress || "No billing address provided"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "proposals" && <CustomerProposalsView />}
          {activeTab === "subscriptions" && <CustomerSubscriptionsView />}
          {activeTab === "invoices" && <CustomerInvoicesView />}
          {activeTab === "payments" && <CustomerPaymentsView />}

          {activeTab !== "overview" && activeTab !== "proposals" && activeTab !== "subscriptions" && activeTab !== "invoices" && activeTab !== "payments" && (
            <div className="p-12 text-center border border-[#E2E7EF] rounded-xl bg-white shadow-sm">
              <h3 className="text-sm font-semibold text-[#172554] capitalize">{activeTab}</h3>
              <p className="text-xs text-[#596579] mt-1">Select from the navigation to review your account details.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const CustomerProposalsView: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const res = await quotationService.getQuotations();
      setQuotations(res.quotations.filter((q) => q.status !== "DRAFT"));
    } catch (err: any) {
      console.error("Failed to load customer proposals", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleAcceptProposal = async (id: string) => {
    try {
      setActionLoadingId(id);
      const updated = await quotationService.confirmQuotation(id);
      setQuotations((prev) => prev.map((q) => (q.id === id ? updated : q)));
      setSelectedQuotation(updated);
      setFeedback({
        type: "success",
        text: `Proposal ${updated.quotationNumber} accepted! Our team has been notified to activate your contract.`,
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.response?.data?.error?.message || "Failed to accept proposal.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-[#15803D]"
              : "bg-rose-50 border-rose-200 text-[#B91C1C]"
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-[#15803D]" />
            ) : (
              <AlertCircle className="h-4 w-4 text-[#B91C1C]" />
            )}
            {feedback.text}
          </div>
          <button onClick={() => setFeedback(null)} className="text-[#6B7280] hover:text-[#172554] p-1 rounded-lg">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-[#172554] flex items-center gap-2.5">
          <FileText className="h-6 w-6 text-[#2563EB]" />
          Software Proposals & Quotations
        </h2>
        <p className="text-sm text-[#596579] mt-1">
          Review formal software proposals issued to your organization, agreed unit prices, and confirm contract activation.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-[#596579] bg-white rounded-xl border border-[#E2E7EF] shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#2563EB] mb-2" />
          Loading your proposals...
        </div>
      ) : quotations.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-[#E2E7EF] bg-white text-[#596579] shadow-sm">
          <FileText className="h-8 w-8 text-[#687386] mx-auto mb-2" />
          <div className="text-base font-semibold text-[#172554]">No Proposals Found</div>
          <p className="text-xs text-[#596579] mt-1">
            You currently have no pending proposals. Please contact our sales team to request a quote.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quotations.map((q) => {
            const hasSub = !!(q.subscriptions && q.subscriptions.length > 0) || !!q.subscription;
            return (
              <div
                key={q.id}
                onClick={() => setSelectedQuotation(q)}
                className="p-5 rounded-xl border border-[#E2E7EF] bg-white hover:border-[#CBD5E1] transition cursor-pointer space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#2563EB] text-sm">{q.quotationNumber}</span>
                  {hasSub ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-[#7C3AED] border border-purple-200">
                      ACTIVE CONTRACT
                    </span>
                  ) : q.status === "SENT" ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#1D4ED8] border border-blue-200">
                      PENDING YOUR REVIEW
                    </span>
                  ) : q.status === "CONFIRMED" ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-[#15803D] border border-emerald-200">
                      CONFIRMED
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F1F5F9] text-[#475569] border border-[#E2E7EF]">
                      {q.status}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-[#596579]">Recurrence Plan:</div>
                  <div className="text-sm font-bold text-[#172554]">
                    {q.plan ? q.plan.name : "Custom Contract"}
                  </div>
                  {q.plan && (
                    <div className="text-[11px] text-[#596579]">
                      Billed {q.plan.billingFrequency.toLowerCase()}
                    </div>
                  )}
                </div>

                <div className="border-t border-[#E2E7EF] pt-3 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-[#596579] uppercase font-bold">Total Contract Value</div>
                    <div className="text-base font-bold text-[#172554]">
                      ₹{Number(q.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-[#596579] uppercase font-bold">Valid Until</div>
                    <div className="text-xs text-[#263247] font-semibold">
                      {new Date(q.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {q.status === "SENT" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcceptProposal(q.id);
                    }}
                    disabled={actionLoadingId === q.id}
                    className="w-full py-2.5 rounded-lg bg-[#15803D] hover:bg-[#166534] text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    {actionLoadingId === q.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Accept & Confirm Proposal
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Proposal Details Modal */}
      {selectedQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2E7EF] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl my-8">
            <div className="px-6 py-4 border-b border-[#E2E7EF] bg-[#F8FAFC] rounded-t-2xl flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#172554]">
                  Proposal {selectedQuotation.quotationNumber}
                </h3>
                <p className="text-xs text-[#596579] mt-0.5">
                  Issued on {new Date(selectedQuotation.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedQuotation(null)}
                className="text-[#6B7280] hover:text-[#172554] p-1.5 rounded-lg hover:bg-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              <div className="border border-[#E2E7EF] rounded-xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E7EF] text-[10px] text-[#344054] font-bold uppercase">
                    <tr>
                      <th className="px-3.5 py-2.5">Product</th>
                      <th className="px-3.5 py-2.5 text-center">Qty</th>
                      <th className="px-3.5 py-2.5 text-right">Agreed Unit Price</th>
                      <th className="px-3.5 py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E7EF] text-[#263247]">
                    {(selectedQuotation.items || []).map((it) => (
                      <tr key={it.id} className="hover:bg-[#F8FAFC]">
                        <td className="px-3.5 py-2.5">
                          <div className="font-semibold text-[#172554]">{it.product?.name || "Product"}</div>
                          {it.variant && (
                            <div className="text-[10px] text-[#596579]">Tier: {it.variant.name}</div>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-bold text-[#172554]">{it.quantity}</td>
                        <td className="px-3.5 py-2.5 text-right font-mono text-[#263247]">
                          ₹{Number(it.unitPrice).toFixed(2)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-bold text-[#172554]">
                          ₹{Number(it.total || Number(it.unitPrice) * it.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-64 space-y-2 p-3.5 rounded-xl border border-[#E2E7EF] bg-[#F8FAFC]">
                  <div className="flex justify-between text-[#596579]">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold text-[#172554]">
                      ₹
                      {(
                        Number(selectedQuotation.totalAmount) -
                        Number(selectedQuotation.taxAmount) +
                        Number(selectedQuotation.discountAmount)
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#596579]">
                    <span>Tax:</span>
                    <span className="font-mono font-semibold text-[#172554]">₹{Number(selectedQuotation.taxAmount).toFixed(2)}</span>
                  </div>
                  {Number(selectedQuotation.discountAmount) > 0 && (
                    <div className="flex justify-between text-[#15803D] font-semibold">
                      <span>Discount:</span>
                      <span className="font-mono">-₹{Number(selectedQuotation.discountAmount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-[#E2E7EF] pt-2 flex justify-between font-bold text-[#172554] text-sm">
                    <span>Grand Total:</span>
                    <span className="text-[#15803D]">
                      ₹{Number(selectedQuotation.totalAmount).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#E2E7EF] bg-[#F8FAFC] rounded-b-2xl flex items-center justify-between">
              <button
                onClick={() => setSelectedQuotation(null)}
                className="px-4 py-2 rounded-lg border border-[#E2E7EF] hover:bg-white text-[#596579] text-xs font-semibold cursor-pointer transition shadow-sm"
              >
                Close
              </button>
              {selectedQuotation.status === "SENT" && (
                <button
                  onClick={() => handleAcceptProposal(selectedQuotation.id)}
                  disabled={actionLoadingId === selectedQuotation.id}
                  className="px-5 py-2 rounded-lg bg-[#15803D] hover:bg-[#166534] text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Accept & Confirm Proposal
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CustomerSubscriptionsView: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await subscriptionService.getSubscriptions();
      setSubscriptions(res.subscriptions);
    } catch (err: any) {
      console.error("Failed to load customer subscriptions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handlePause = async (id: string) => {
    try {
      setActionLoadingId(id);
      const updated = await subscriptionService.pauseSubscription(id, "Client paused from portal");
      setSubscriptions((prev) => prev.map((s) => (s.id === id ? updated : s)));
      if (selectedSub?.id === id) setSelectedSub(updated);
      setFeedback({ type: "success", text: `Subscription ${updated.subscriptionNumber} paused.` });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.response?.data?.error?.message || "Failed to pause subscription." });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResume = async (id: string) => {
    try {
      setActionLoadingId(id);
      const updated = await subscriptionService.resumeSubscription(id);
      setSubscriptions((prev) => prev.map((s) => (s.id === id ? updated : s)));
      if (selectedSub?.id === id) setSelectedSub(updated);
      setFeedback({
        type: "success",
        text: `Subscription ${updated.subscriptionNumber} resumed! Next billing recalibrated to ${new Date(
          updated.nextBillingDate
        ).toLocaleDateString()}.`,
      });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.response?.data?.error?.message || "Failed to resume subscription." });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-[#15803D]"
              : "bg-rose-50 border-rose-200 text-[#B91C1C]"
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-[#15803D]" />
            ) : (
              <AlertCircle className="h-4 w-4 text-[#B91C1C]" />
            )}
            {feedback.text}
          </div>
          <button onClick={() => setFeedback(null)} className="text-[#6B7280] hover:text-[#172554] p-1 rounded-lg">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-[#172554] flex items-center gap-2.5">
          <ShieldCheck className="h-6 w-6 text-[#7C3AED]" />
          My Active Subscriptions & Contracts
        </h2>
        <p className="text-sm text-[#596579] mt-1">
          Review your recurring software licenses, fair billing renewal schedules, and manage lifecycle pauses.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-[#596579] bg-white rounded-xl border border-[#E2E7EF] shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#7C3AED] mb-2" />
          Loading your active contracts...
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-[#E2E7EF] bg-white text-[#596579] shadow-sm">
          <ShieldCheck className="h-8 w-8 text-[#687386] mx-auto mb-2" />
          <div className="text-base font-semibold text-[#172554]">No Active Subscriptions</div>
          <p className="text-xs text-[#596579] mt-1">
            You do not currently have any active subscription contracts. Check &quot;Proposals & Quotes&quot; to review pending proposals.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subscriptions.map((sub) => {
            const contractTotal = (sub.items || []).reduce(
              (acc, it) => acc + Number(it.unitPrice) * it.quantity,
              0
            );

            return (
              <div
                key={sub.id}
                onClick={() => setSelectedSub(sub)}
                className="p-5 rounded-xl border border-[#E2E7EF] bg-white hover:border-[#CBD5E1] transition cursor-pointer space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#7C3AED] text-sm">{sub.subscriptionNumber}</span>
                  {sub.status === "ACTIVE" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#15803D] border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#15803D]" />
                      ACTIVE
                    </span>
                  ) : sub.status === "PAUSED" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-[#B45309] border border-amber-200">
                      <Clock className="h-3.5 w-3.5" />
                      PAUSED
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F1F5F9] text-[#475569] border border-[#E2E7EF]">
                      {sub.status}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-[#596579]">Plan:</div>
                  <div className="text-sm font-bold text-[#172554]">{sub.plan?.name}</div>
                  <div className="text-[11px] text-[#596579]">
                    Billed every {sub.plan?.billingInterval} {sub.plan?.billingFrequency.toLowerCase()}
                  </div>
                </div>

                <div className="border-t border-[#E2E7EF] pt-3 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-[#596579] uppercase font-bold">Recurring Value</div>
                    <div className="text-base font-bold text-[#172554]">
                      ₹{contractTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-[#596579] uppercase font-bold">Next Billing</div>
                    <div className="text-xs text-[#263247] font-semibold flex items-center gap-1 justify-end">
                      <Calendar className="h-3.5 w-3.5 text-[#596579]" />
                      {new Date(sub.nextBillingDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Pause / Resume button if permitted by plan */}
                <div
                  className="pt-1 flex items-center justify-end gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {sub.status === "ACTIVE" && sub.plan?.allowPause && (
                    <button
                      onClick={() => handlePause(sub.id)}
                      disabled={actionLoadingId === sub.id}
                      className="px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-[#B45309] text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-sm"
                    >
                      <Pause className="h-3.5 w-3.5" />
                      Pause Billing
                    </button>
                  )}

                  {sub.status === "PAUSED" && (
                    <button
                      onClick={() => handleResume(sub.id)}
                      disabled={actionLoadingId === sub.id}
                      className="px-4 py-1.5 rounded-lg bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Resume Contract
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subscription Detail Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2E7EF] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl my-8">
            <div className="px-6 py-4 border-b border-[#E2E7EF] bg-[#F8FAFC] rounded-t-2xl flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#172554]">
                  Contract {selectedSub.subscriptionNumber}
                </h3>
                <p className="text-xs text-[#596579] mt-0.5">
                  Plan: {selectedSub.plan?.name} • Terms: {selectedSub.paymentTerms}
                </p>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="text-[#6B7280] hover:text-[#172554] p-1.5 rounded-lg hover:bg-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              <div className="border border-[#E2E7EF] rounded-xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E7EF] text-[10px] text-[#344054] font-bold uppercase">
                    <tr>
                      <th className="px-3.5 py-2.5">Licensed Product</th>
                      <th className="px-3.5 py-2.5 text-center">Seats / Qty</th>
                      <th className="px-3.5 py-2.5 text-right">Agreed Rate</th>
                      <th className="px-3.5 py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E7EF] text-[#263247]">
                    {(selectedSub.items || []).map((it) => (
                      <tr key={it.id} className="hover:bg-[#F8FAFC]">
                        <td className="px-3.5 py-2.5">
                          <div className="font-semibold text-[#172554]">{it.product?.name || "Product"}</div>
                          {it.variant && (
                            <div className="text-[10px] text-[#596579]">Variant: {it.variant.name}</div>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-bold text-[#172554]">{it.quantity}</td>
                        <td className="px-3.5 py-2.5 text-right font-mono text-[#263247]">
                          ₹{Number(it.unitPrice).toFixed(2)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-bold text-[#172554]">
                          ₹{(Number(it.unitPrice) * it.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-xl border border-[#E2E7EF] bg-[#F8FAFC] space-y-1">
                <div className="text-[#596579]">
                  Next Scheduled Billing:{" "}
                  <span className="text-[#172554] font-semibold">
                    {new Date(selectedSub.nextBillingDate).toLocaleDateString()}
                  </span>
                </div>
                {selectedSub.pausedAt && (
                  <div className="text-[#B45309] font-medium">
                    Paused on: {new Date(selectedSub.pausedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#E2E7EF] bg-[#F8FAFC] rounded-b-2xl flex items-center justify-end">
              <button
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 rounded-lg border border-[#E2E7EF] hover:bg-white text-[#596579] text-xs font-semibold cursor-pointer transition shadow-sm"
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

const CustomerInvoicesView: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await invoiceService.getInvoices();
      setInvoices(res.data.filter((inv) => inv.status !== "DRAFT"));
    } catch (err: any) {
      console.error("Failed to load customer invoices", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  let totalBilled = 0;
  let totalPaid = 0;
  let totalOutstanding = 0;
  let overdueCount = 0;

  for (const inv of invoices) {
    const tot = parseFloat(String(inv.totalAmount)) || 0;
    const pd = parseFloat(String(inv.amountPaid)) || 0;
    const bal = Math.max(0, tot - pd);
    const isOverdue = inv.status === "CONFIRMED" && new Date(inv.dueDate) < new Date() && bal > 0;

    totalBilled += tot;
    totalPaid += pd;
    totalOutstanding += bal;
    if (isOverdue) overdueCount++;
  }

  const getBadge = (status: Invoice["status"], isOverdue?: boolean) => {
    if (isOverdue && status === "CONFIRMED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-[#B91C1C] border border-rose-200">
          <AlertTriangle className="h-3.5 w-3.5" />
          OVERDUE
        </span>
      );
    }
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#1D4ED8] border border-blue-200">
            <Clock className="h-3.5 w-3.5" />
            PAYMENT DUE
          </span>
        );
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#15803D] border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            PAID
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F1F5F9] text-[#64748B] border border-[#E2E7EF]">
            <X className="h-3.5 w-3.5" />
            CANCELLED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#172554] tracking-tight flex items-center gap-2.5">
            <Receipt className="h-6 w-6 text-[#2563EB]" />
            My Invoices & Billing Statements
          </h2>
          <p className="text-sm text-[#596579] mt-1">
            Review billing statements, verify tax breakdowns, and inspect payment receipts.
          </p>
        </div>
      </div>

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-[#E2E7EF] bg-white shadow-sm">
          <div className="text-xs font-semibold text-[#596579] uppercase tracking-wider">Total Invoiced</div>
          <div className="text-2xl font-bold text-[#172554] mt-1.5">₹{totalBilled.toFixed(2)}</div>
        </div>
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-sm">
          <div className="text-xs font-semibold text-[#15803D] uppercase tracking-wider">Total Paid</div>
          <div className="text-2xl font-bold text-[#15803D] mt-1.5">₹{totalPaid.toFixed(2)}</div>
        </div>
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-sm">
          <div className="text-xs font-semibold text-[#B45309] uppercase tracking-wider">Outstanding Balance</div>
          <div className="text-2xl font-bold text-[#B45309] mt-1.5">₹{totalOutstanding.toFixed(2)}</div>
        </div>
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 shadow-sm">
          <div className="text-xs font-semibold text-[#B91C1C] uppercase tracking-wider">Overdue Invoices</div>
          <div className={`text-2xl font-bold mt-1.5 ${overdueCount > 0 ? "text-[#B91C1C]" : "text-[#596579]"}`}>
            {overdueCount}
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="rounded-xl border border-[#E2E7EF] bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-[#596579] flex flex-col items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#2563EB] mb-2" />
            <span className="text-xs">Loading billing statements...</span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-[#596579]">
            <Receipt className="h-10 w-10 text-[#687386] mx-auto mb-2" />
            <div className="text-base font-semibold text-[#172554]">No Invoices Issued</div>
            <div className="text-xs text-[#596579] mt-1">
              Invoices will automatically appear here when generated for your subscriptions.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#263247]">
              <thead className="bg-[#F8FAFC] text-[#344054] font-bold uppercase tracking-wider border-b border-[#E2E7EF] text-[11px]">
                <tr>
                  <th className="px-4 py-3.5">Invoice #</th>
                  <th className="px-4 py-3.5">Subscription</th>
                  <th className="px-4 py-3.5">Issue Date</th>
                  <th className="px-4 py-3.5">Due Date</th>
                  <th className="px-4 py-3.5 text-right">Total</th>
                  <th className="px-4 py-3.5 text-right">Paid</th>
                  <th className="px-4 py-3.5 text-right">Balance</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E7EF]">
                {invoices.map((inv) => {
                  const tot = parseFloat(String(inv.totalAmount)) || 0;
                  const pd = parseFloat(String(inv.amountPaid)) || 0;
                  const bal = Math.max(0, tot - pd);
                  const isOverdue =
                    inv.status === "CONFIRMED" && new Date(inv.dueDate) < new Date() && bal > 0;

                  return (
                    <tr key={inv.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-[#2563EB]">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3.5 text-[#596579] font-mono">
                        {inv.subscription?.subscriptionNumber || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-[#596579]">
                        {new Date(inv.issueDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 text-[#263247] font-semibold">
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-[#172554] font-bold">
                        ₹{tot.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-[#15803D] font-bold">
                        ₹{pd.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-[#172554]">
                        <span className={bal > 0 && isOverdue ? "text-[#B91C1C]" : ""}>
                          ₹{bal.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">{getBadge(inv.status, isOverdue)}</td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] border border-blue-200 text-xs font-semibold transition cursor-pointer shadow-sm"
                        >
                          View / Print
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

      {/* Invoice Document Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2E7EF] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 px-6 border-b border-[#E2E7EF] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-[#2563EB]" />
                <span className="font-bold text-[#172554] text-base">
                  Invoice {selectedInvoice.invoiceNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg border border-[#E2E7EF] hover:bg-white text-xs text-[#172554] font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="h-3.5 w-3.5 text-[#596579]" />
                  Print
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#172554] hover:bg-white transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              <div className="flex justify-between items-start border-b border-[#E2E7EF] pb-4">
                <div>
                  <div className="text-xl font-black tracking-tight text-[#172554]">
                    Bright<span className="text-[#2563EB]">Loop</span>
                  </div>
                  <div className="text-xs text-[#596579] mt-0.5">Software Subscriptions & Billing</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-[#172554] text-sm">{selectedInvoice.invoiceNumber}</div>
                  <div className="text-[#596579] mt-1 font-medium">
                    Issue Date: {new Date(selectedInvoice.issueDate).toLocaleDateString()}
                  </div>
                  <div className="text-[#B45309] font-bold mt-0.5">
                    Due Date: {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-[#E2E7EF] rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] text-[#344054] uppercase font-bold text-[10px] border-b border-[#E2E7EF]">
                    <tr>
                      <th className="px-3.5 py-2.5">Item Description</th>
                      <th className="px-3.5 py-2.5 text-center">Qty</th>
                      <th className="px-3.5 py-2.5 text-right">Price</th>
                      <th className="px-3.5 py-2.5 text-right">Tax</th>
                      <th className="px-3.5 py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E7EF] text-[#263247]">
                    {selectedInvoice.items?.map((item) => (
                      <tr key={item.id} className="hover:bg-[#F8FAFC]">
                        <td className="px-3.5 py-2.5 font-semibold text-[#172554]">{item.description}</td>
                        <td className="px-3.5 py-2.5 text-center font-bold text-[#172554]">{item.quantity}</td>
                        <td className="px-3.5 py-2.5 text-right font-mono">
                          ₹{parseFloat(String(item.unitPrice)).toFixed(2)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right text-[#596579] font-mono">{item.taxRate}%</td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-bold text-[#172554]">
                          ₹{parseFloat(String(item.totalAmount || Number(item.unitPrice) * Number(item.quantity))).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Breakdown */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E7EF] text-[#596579]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold text-[#172554]">
                      ₹{parseFloat(String(selectedInvoice.subtotal || selectedInvoice.totalAmount)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes:</span>
                    <span className="font-mono font-semibold text-[#172554]">
                      +₹{parseFloat(String(selectedInvoice.taxAmount)).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-[#E2E7EF] pt-2 flex justify-between font-bold text-[#172554] text-sm">
                    <span>Total Amount:</span>
                    <span className="font-mono">
                      ₹{parseFloat(String(selectedInvoice.totalAmount)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#15803D] font-bold">
                    <span>Amount Paid:</span>
                    <span className="font-mono">
                      ₹{parseFloat(String(selectedInvoice.amountPaid)).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-[#E2E7EF] pt-2 flex justify-between font-black text-[#172554] text-sm">
                    <span>Balance Due:</span>
                    <span className="font-mono text-[#B91C1C]">
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

              {/* Allocations */}
              {selectedInvoice.allocations && selectedInvoice.allocations.length > 0 && (
                <div className="border-t border-[#E2E7EF] pt-4">
                  <div className="text-[11px] font-bold text-[#596579] uppercase tracking-wider mb-2">
                    Settled Payment Transactions
                  </div>
                  <div className="space-y-1.5">
                    {selectedInvoice.allocations.map((alloc) => (
                      <div
                        key={alloc.id}
                        className="flex justify-between items-center p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[#15803D]"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-[#15803D]" />
                          <span className="font-mono font-bold">{alloc.payment?.paymentNumber}</span>
                          <span className="text-[#596579]">
                            ({alloc.payment?.paymentMethod}) on{" "}
                            {new Date(alloc.allocatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-[#15803D]">
                          +₹{parseFloat(String(alloc.amount)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 px-6 border-t border-[#E2E7EF] bg-[#F8FAFC] flex justify-end">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-lg border border-[#E2E7EF] hover:bg-white text-[#596579] text-xs font-semibold cursor-pointer transition shadow-sm"
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

const CustomerPaymentsView: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await paymentService.getPayments();
      setPayments(res.data);
    } catch (err: any) {
      console.error("Failed to load customer payments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  let totalPaid = 0;
  let totalAllocated = 0;
  let totalFloat = 0;

  for (const p of payments) {
    const amt = parseFloat(String(p.amount)) || 0;
    const unalloc = parseFloat(String(p.unallocatedAmount)) || 0;
    totalPaid += amt;
    totalFloat += unalloc;
    totalAllocated += amt - unalloc;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#172554] tracking-tight flex items-center gap-2.5">
            <CreditCard className="h-6 w-6 text-[#2563EB]" />
            Payment History & Receipts
          </h2>
          <p className="text-sm text-[#596579] mt-1">
            Complete transaction record of payments and invoice settlement allocations.
          </p>
        </div>
      </div>

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl border border-[#E2E7EF] bg-white shadow-sm">
          <div className="text-xs font-semibold text-[#596579] uppercase tracking-wider">Total Remitted</div>
          <div className="text-2xl font-bold text-[#172554] mt-1.5">₹{totalPaid.toFixed(2)}</div>
        </div>
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-sm">
          <div className="text-xs font-semibold text-[#15803D] uppercase tracking-wider">Settled on Invoices</div>
          <div className="text-2xl font-bold text-[#15803D] mt-1.5">₹{totalAllocated.toFixed(2)}</div>
        </div>
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-sm">
          <div className="text-xs font-semibold text-[#B45309] uppercase tracking-wider">Advance / Credit Float</div>
          <div className="text-2xl font-bold text-[#B45309] mt-1.5">₹{totalFloat.toFixed(2)}</div>
        </div>
      </div>

      {/* Payments List */}
      <div className="rounded-xl border border-[#E2E7EF] bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-[#596579] flex flex-col items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#2563EB] mb-2" />
            <span className="text-xs">Loading payment transactions...</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-[#596579]">
            <CreditCard className="h-10 w-10 text-[#687386] mx-auto mb-2" />
            <div className="text-base font-semibold text-[#172554]">No Payments Recorded</div>
            <div className="text-xs text-[#596579] mt-1">
              Your payments will appear here once recorded and verified by our finance team.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#263247]">
              <thead className="bg-[#F8FAFC] text-[#344054] font-bold uppercase tracking-wider border-b border-[#E2E7EF] text-[11px]">
                <tr>
                  <th className="px-4 py-3.5">Payment #</th>
                  <th className="px-4 py-3.5">Method</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5 text-right">Amount</th>
                  <th className="px-4 py-3.5 text-right">Allocated</th>
                  <th className="px-4 py-3.5 text-right">Advance Balance</th>
                  <th className="px-4 py-3.5 text-center">Invoices</th>
                  <th className="px-4 py-3.5 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E7EF]">
                {payments.map((p) => {
                  const amt = parseFloat(String(p.amount)) || 0;
                  const unalloc = parseFloat(String(p.unallocatedAmount)) || 0;
                  const alloc = amt - unalloc;

                  return (
                    <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-[#2563EB]">{p.paymentNumber}</td>
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F1F5F9] text-[#475569] border border-[#E2E7EF]">
                          {p.paymentMethod.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[#596579]">
                        {new Date(p.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-[#172554]">
                        ₹{amt.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-[#15803D]">
                        ₹{alloc.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-[#263247]">
                        <span className={unalloc > 0 ? "text-[#B45309] font-bold" : "text-[#6B7280]"}>
                          ₹{unalloc.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center text-[#596579]">
                        {p.allocations?.length || 0} settled
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] border border-blue-200 text-xs font-semibold transition cursor-pointer shadow-sm"
                        >
                          View Receipt
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

      {/* Payment Receipt Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2E7EF] rounded-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 px-6 border-b border-[#E2E7EF] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-[#2563EB]" />
                <span className="font-bold text-[#172554] text-base">
                  Payment Receipt {selectedPayment.paymentNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg border border-[#E2E7EF] hover:bg-white text-xs text-[#172554] font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="h-3.5 w-3.5 text-[#596579]" />
                  Print
                </button>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#172554] hover:bg-white transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs bg-white">
              <div className="flex justify-between items-start border-b border-[#E2E7EF] pb-4">
                <div>
                  <div className="text-xl font-black tracking-tight text-[#172554]">
                    Bright<span className="text-[#2563EB]">Loop</span>
                  </div>
                  <div className="text-xs text-[#596579] mt-0.5 font-medium">Payment Acknowledgement Voucher</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-[#172554] text-sm">
                    {selectedPayment.paymentNumber}
                  </div>
                  <div className="text-[#596579] mt-1 font-medium">
                    Date: {new Date(selectedPayment.paymentDate).toLocaleDateString()}
                  </div>
                  <div className="text-[#15803D] font-bold mt-0.5">
                    Mode: {selectedPayment.paymentMethod.replace("_", " ")}
                  </div>
                </div>
              </div>

              {/* Allocation List */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-[#596579] uppercase tracking-wider">
                  Settled Invoice Accounts
                </div>
                {selectedPayment.allocations && selectedPayment.allocations.length > 0 ? (
                  <div className="border border-[#E2E7EF] rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8FAFC] text-[#344054] font-bold uppercase text-[10px] border-b border-[#E2E7EF]">
                        <tr>
                          <th className="px-3.5 py-2.5">Invoice #</th>
                          <th className="px-3.5 py-2.5">Allocated Date</th>
                          <th className="px-3.5 py-2.5 text-right">Settled Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E7EF] text-[#263247]">
                        {selectedPayment.allocations.map((alloc) => (
                          <tr key={alloc.id} className="hover:bg-[#F8FAFC]">
                            <td className="px-3.5 py-2 font-mono font-bold text-[#2563EB]">{alloc.invoice?.invoiceNumber || alloc.invoiceId}</td>
                            <td className="px-3.5 py-2 text-[#596579]">
                              {new Date(alloc.allocatedAt).toLocaleDateString()}
                            </td>
                            <td className="px-3.5 py-2 text-right font-mono font-bold text-[#15803D]">
                              +₹{parseFloat(String(alloc.amount)).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-[#F8FAFC] border border-[#E2E7EF] rounded-xl text-center text-[#596579]">
                    Full payment amount maintained as unallocated advance balance.
                  </div>
                )}
              </div>

              {/* Financial Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E7EF] text-[#596579]">
                  <div className="flex justify-between">
                    <span>Total Payment Received:</span>
                    <span className="font-mono text-[#172554] font-bold">
                      ₹{parseFloat(String(selectedPayment.amount)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#15803D] font-bold">
                    <span>Applied to Invoices:</span>
                    <span className="font-mono">
                      ₹
                      {(
                        parseFloat(String(selectedPayment.amount)) -
                        parseFloat(String(selectedPayment.unallocatedAmount))
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-[#E2E7EF] pt-2 flex justify-between font-bold text-[#B45309]">
                    <span>Available Advance Balance:</span>
                    <span className="font-mono">
                      ₹{parseFloat(String(selectedPayment.unallocatedAmount)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 px-6 border-t border-[#E2E7EF] bg-[#F8FAFC] flex justify-end">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 rounded-lg border border-[#E2E7EF] hover:bg-white text-[#596579] text-xs font-semibold cursor-pointer transition shadow-sm"
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
