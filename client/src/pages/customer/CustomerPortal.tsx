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

export const CustomerPortal: React.FC = () => {
  const { user, customer, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/20">
            BL
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-white leading-none">BrightLoop</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                CUSTOMER PORTAL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {customer?.companyName || "Commercial Client Workspace"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <div className="text-xs font-semibold text-white">{user?.name}</div>
            <div className="text-[11px] text-slate-400">{user?.email}</div>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 font-medium transition cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5 text-slate-400" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex">
        {/* Sidebar Nav */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/40 p-4 space-y-1 hidden md:block">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
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
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </aside>

        {/* Workspace Body */}
        <main className="flex-1 p-6 md:p-8 space-y-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Customer Portal</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    View your active software contracts, recurring renewals, and invoice settlement history.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Verified Client
                </span>
              </div>

              {/* Customer Profile Card */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-400" />
                  Registered Commercial Entity
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-lg border border-slate-800 bg-slate-950/60 space-y-2">
                    <div className="flex items-center gap-2 text-slate-400 font-medium">
                      <User className="h-4 w-4 text-slate-500" />
                      Contact Person
                    </div>
                    <div className="text-sm font-semibold text-white">{customer?.contactName || user?.name}</div>
                    <div className="flex items-center gap-2 text-slate-400 pt-1">
                      <Mail className="h-3.5 w-3.5 text-slate-500" />
                      {customer?.email || user?.email}
                    </div>
                    {customer?.phone && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Phone className="h-3.5 w-3.5 text-slate-500" />
                        {customer.phone}
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-lg border border-slate-800 bg-slate-950/60 space-y-2">
                    <div className="flex items-center gap-2 text-slate-400 font-medium">
                      <Receipt className="h-4 w-4 text-slate-500" />
                      Billing & Tax Details
                    </div>
                    <div className="text-sm font-semibold text-white">{customer?.companyName}</div>
                    <div className="text-slate-400 pt-1">
                      Tax / GST ID: <span className="font-mono text-slate-300">{customer?.taxId || "Not Registered"}</span>
                    </div>
                    <div className="flex items-start gap-2 text-slate-400 pt-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
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
            <div className="p-12 text-center border border-slate-800 rounded-xl bg-slate-900/30">
              <h3 className="text-sm font-semibold text-slate-300 capitalize">{activeTab}</h3>
              <p className="text-xs text-slate-500 mt-1">Select from the sidebar to review your account details.</p>
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
      // Filter out internal DRAFTs if any - customer only sees SENT, CONFIRMED, EXPIRED, CANCELLED
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
          className={`p-4 rounded-xl border flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-medium">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400" />
            )}
            {feedback.text}
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div>
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-400" />
          Software Proposals & Quotations
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Review formal software proposals issued to your organization, agreed unit prices, and confirm contract activation.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-500 mb-2" />
          Loading your proposals...
        </div>
      ) : quotations.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-slate-800 bg-slate-900/30 text-slate-400">
          <FileText className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <div className="text-sm font-semibold text-slate-300">No Proposals Found</div>
          <p className="text-xs text-slate-500 mt-1">
            You currently have no pending proposals. Please contact our sales team to request a quote.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quotations.map((q) => {
            const hasSub = !!(q.subscriptions && q.subscriptions.length > 0);
            return (
              <div
                key={q.id}
                onClick={() => setSelectedQuotation(q)}
                className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700 transition cursor-pointer space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 text-sm">{q.quotationNumber}</span>
                  {hasSub ? (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      ACTIVE CONTRACT
                    </span>
                  ) : q.status === "SENT" ? (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      PENDING YOUR REVIEW
                    </span>
                  ) : q.status === "CONFIRMED" ? (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      CONFIRMED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-400">
                      {q.status}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-slate-400">Recurrence Plan:</div>
                  <div className="text-sm font-semibold text-white">
                    {q.plan ? q.plan.name : "Custom Contract"}
                  </div>
                  {q.plan && (
                    <div className="text-[11px] text-slate-400">
                      Billed {q.plan.billingFrequency.toLowerCase()}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Total Contract Value</div>
                    <div className="text-base font-bold text-white">
                      ₹{Number(q.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Valid Until</div>
                    <div className="text-xs text-slate-300 font-medium">
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
                    className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl my-8">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Proposal {selectedQuotation.quotationNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  Issued on {new Date(selectedQuotation.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedQuotation(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                    <tr>
                      <th className="px-3 py-2.5">Product</th>
                      <th className="px-3 py-2.5 text-center">Qty</th>
                      <th className="px-3 py-2.5 text-right">Agreed Unit Price</th>
                      <th className="px-3 py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {selectedQuotation.items.map((it) => (
                      <tr key={it.id}>
                        <td className="px-3 py-2.5">
                          <div className="font-semibold text-white">{it.product?.name || "Product"}</div>
                          {it.variant && (
                            <div className="text-[10px] text-slate-400">Tier: {it.variant.name}</div>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">{it.quantity}</td>
                        <td className="px-3 py-2.5 text-right font-mono">
                          ₹{Number(it.unitPrice).toFixed(2)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold text-white">
                          ₹{Number(it.total).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 p-3 rounded-xl border border-slate-800 bg-slate-950/60">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-mono text-white">₹{Number(selectedQuotation.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Tax:</span>
                    <span className="font-mono text-white">₹{Number(selectedQuotation.taxAmount).toFixed(2)}</span>
                  </div>
                  {Number(selectedQuotation.discountAmount) > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount:</span>
                      <span className="font-mono">-₹{Number(selectedQuotation.discountAmount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-white text-sm">
                    <span>Grand Total:</span>
                    <span className="text-emerald-400">
                      ₹{Number(selectedQuotation.totalAmount).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setSelectedQuotation(null)}
                className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Close
              </button>
              {selectedQuotation.status === "SENT" && (
                <button
                  onClick={() => handleAcceptProposal(selectedQuotation.id)}
                  disabled={actionLoadingId === selectedQuotation.id}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition cursor-pointer"
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
          className={`p-4 rounded-xl border flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-medium">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400" />
            )}
            {feedback.text}
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div>
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          My Active Subscriptions & Contracts
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Review your recurring software licenses, fair billing renewal schedules, and manage lifecycle pauses.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-500 mb-2" />
          Loading your active contracts...
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-slate-800 bg-slate-900/30 text-slate-400">
          <ShieldCheck className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <div className="text-sm font-semibold text-slate-300">No Active Subscriptions</div>
          <p className="text-xs text-slate-500 mt-1">
            You do not currently have any active subscription contracts. Check "Proposals & Quotes" to review pending proposals.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subscriptions.map((sub) => {
            const contractTotal = sub.items.reduce(
              (acc, it) => acc + Number(it.unitPrice) * it.quantity,
              0
            );

            return (
              <div
                key={sub.id}
                onClick={() => setSelectedSub(sub)}
                className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700 transition cursor-pointer space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 text-sm">{sub.subscriptionNumber}</span>
                  {sub.status === "ACTIVE" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ACTIVE
                    </span>
                  ) : sub.status === "PAUSED" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Clock className="h-3 w-3" />
                      PAUSED
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">
                      {sub.status}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-slate-400">Plan:</div>
                  <div className="text-sm font-semibold text-white">{sub.plan?.name}</div>
                  <div className="text-[11px] text-slate-400">
                    Billed every {sub.plan?.billingInterval} {sub.plan?.billingFrequency.toLowerCase()}
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Recurring Value</div>
                    <div className="text-base font-bold text-white">
                      ₹{contractTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Next Billing</div>
                    <div className="text-xs text-slate-300 font-medium flex items-center gap-1 justify-end">
                      <Calendar className="h-3 w-3 text-slate-500" />
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
                      className="px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                    >
                      <Pause className="h-3.5 w-3.5" />
                      Pause Billing
                    </button>
                  )}

                  {sub.status === "PAUSED" && (
                    <button
                      onClick={() => handleResume(sub.id)}
                      disabled={actionLoadingId === sub.id}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl my-8">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Contract {selectedSub.subscriptionNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  Plan: {selectedSub.plan?.name} • Terms: {selectedSub.paymentTerms}
                </p>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                    <tr>
                      <th className="px-3 py-2.5">Licensed Product</th>
                      <th className="px-3 py-2.5 text-center">Seats / Qty</th>
                      <th className="px-3 py-2.5 text-right">Agreed Rate</th>
                      <th className="px-3 py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {selectedSub.items.map((it) => (
                      <tr key={it.id}>
                        <td className="px-3 py-2.5">
                          <div className="font-semibold text-white">{it.product?.name || "Product"}</div>
                          {it.variant && (
                            <div className="text-[10px] text-slate-400">Variant: {it.variant.name}</div>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">{it.quantity}</td>
                        <td className="px-3 py-2.5 text-right font-mono">
                          ₹{Number(it.unitPrice).toFixed(2)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold text-white">
                          ₹{(Number(it.unitPrice) * it.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
                <div className="text-slate-400">
                  Next Scheduled Billing:{" "}
                  <span className="text-white font-semibold">
                    {new Date(selectedSub.nextBillingDate).toLocaleDateString()}
                  </span>
                </div>
                {selectedSub.pausedAt && (
                  <div className="text-amber-400">
                    Paused on: {new Date(selectedSub.pausedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-end">
              <button
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
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
      // Only show CONFIRMED, PAID, CANCELLED to customers (exclude internal DRAFTs)
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
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse">
          <AlertTriangle className="h-3 w-3" />
          OVERDUE
        </span>
      );
    }
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Clock className="h-3 w-3" />
            PAYMENT DUE
          </span>
        );
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3" />
            PAID
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30">
            <X className="h-3 w-3" />
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
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Receipt className="h-5 w-5 text-emerald-400" />
            My Invoices & Billing Statements
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review billing statements, verify tax breakdowns, and inspect payment receipts.
          </p>
        </div>
      </div>

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Invoiced</div>
          <div className="text-xl font-bold text-white mt-1">₹{totalBilled.toFixed(2)}</div>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Paid</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">₹{totalPaid.toFixed(2)}</div>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Outstanding Balance</div>
          <div className="text-xl font-bold text-amber-400 mt-1">₹{totalOutstanding.toFixed(2)}</div>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Overdue Invoices</div>
          <div className={`text-xl font-bold mt-1 ${overdueCount > 0 ? "text-rose-400" : "text-slate-300"}`}>
            {overdueCount}
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mb-2" />
            <span className="text-xs">Loading billing statements...</span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Receipt className="h-10 w-10 text-slate-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-slate-300">No Invoices Issued</div>
            <div className="text-xs text-slate-500 mt-1">
              Invoices will automatically appear here when generated for your subscriptions.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Invoice #</th>
                  <th className="px-4 py-3 font-semibold">Subscription</th>
                  <th className="px-4 py-3 font-semibold">Issue Date</th>
                  <th className="px-4 py-3 font-semibold">Due Date</th>
                  <th className="px-4 py-3 font-semibold text-right">Total</th>
                  <th className="px-4 py-3 font-semibold text-right">Paid</th>
                  <th className="px-4 py-3 font-semibold text-right">Balance</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {invoices.map((inv) => {
                  const tot = parseFloat(String(inv.totalAmount)) || 0;
                  const pd = parseFloat(String(inv.amountPaid)) || 0;
                  const bal = Math.max(0, tot - pd);
                  const isOverdue =
                    inv.status === "CONFIRMED" && new Date(inv.dueDate) < new Date() && bal > 0;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-white">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 text-slate-400 font-mono">
                        {inv.subscription?.subscriptionNumber || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(inv.issueDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-medium">
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-white font-medium">
                        ₹{tot.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-400">
                        ₹{pd.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-white">
                        <span className={bal > 0 && isOverdue ? "text-rose-400" : ""}>
                          ₹{bal.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">{getBadge(inv.status, isOverdue)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-400" />
                <span className="font-bold text-white text-sm">
                  Invoice {selectedInvoice.invoiceNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs text-slate-300 font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <div className="text-lg font-black tracking-tight text-white">
                    Bright<span className="text-emerald-400">Loop</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Software Subscriptions & Billing</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-white text-sm">{selectedInvoice.invoiceNumber}</div>
                  <div className="text-slate-400 mt-1">
                    Issue Date: {new Date(selectedInvoice.issueDate).toLocaleDateString()}
                  </div>
                  <div className="text-amber-400 font-medium">
                    Due Date: {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="px-3 py-2">Item Description</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Price</th>
                      <th className="px-3 py-2 text-right">Tax</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {selectedInvoice.items?.map((item) => (
                      <tr key={item.id} className="text-slate-200">
                        <td className="px-3 py-2.5 font-medium">{item.description}</td>
                        <td className="px-3 py-2.5 text-center">{item.quantity}</td>
                        <td className="px-3 py-2.5 text-right font-mono">
                          ₹{parseFloat(String(item.unitPrice)).toFixed(2)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-400 font-mono">{item.taxRate}%</td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-white">
                          ₹{parseFloat(String(item.totalAmount)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Breakdown */}
              <div className="flex justify-end">
                <div className="w-60 space-y-1.5 text-slate-400">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-mono text-slate-200">
                      ₹{parseFloat(String(selectedInvoice.subtotal)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes:</span>
                    <span className="font-mono text-slate-200">
                      +₹{parseFloat(String(selectedInvoice.taxAmount)).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-slate-800 pt-1.5 flex justify-between font-bold text-white">
                    <span>Total Amount:</span>
                    <span className="font-mono">
                      ₹{parseFloat(String(selectedInvoice.totalAmount)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Amount Paid:</span>
                    <span className="font-mono">
                      ₹{parseFloat(String(selectedInvoice.amountPaid)).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-slate-800 pt-1.5 flex justify-between font-bold text-amber-400">
                    <span>Balance Due:</span>
                    <span className="font-mono">
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
                <div className="border-t border-slate-800 pt-4">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Settled Payment Transactions
                  </div>
                  <div className="space-y-1.5">
                    {selectedInvoice.allocations.map((alloc) => (
                      <div
                        key={alloc.id}
                        className="flex justify-between items-center p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="font-mono">{alloc.payment?.paymentNumber}</span>
                          <span className="text-slate-400">
                            ({alloc.payment?.paymentMethod}) on{" "}
                            {new Date(alloc.allocatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="font-mono font-bold">
                          +₹{parseFloat(String(alloc.amount)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 px-6 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
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
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-400" />
            Payment History & Receipts
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete transaction record of payments and invoice settlement allocations.
          </p>
        </div>
      </div>

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Remitted</div>
          <div className="text-xl font-bold text-white mt-1">₹{totalPaid.toFixed(2)}</div>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Settled on Invoices</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">₹{totalAllocated.toFixed(2)}</div>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Advance / Credit Float</div>
          <div className="text-xl font-bold text-amber-400 mt-1">₹{totalFloat.toFixed(2)}</div>
        </div>
      </div>

      {/* Payments List */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mb-2" />
            <span className="text-xs">Loading payment transactions...</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CreditCard className="h-10 w-10 text-slate-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-slate-300">No Payments Recorded</div>
            <div className="text-xs text-slate-500 mt-1">
              Your payments will appear here once recorded and verified by our finance team.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Payment #</th>
                  <th className="px-4 py-3 font-semibold">Method</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold text-right">Allocated</th>
                  <th className="px-4 py-3 font-semibold text-right">Advance Balance</th>
                  <th className="px-4 py-3 font-semibold text-center">Invoices</th>
                  <th className="px-4 py-3 font-semibold text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payments.map((p) => {
                  const amt = parseFloat(String(p.amount)) || 0;
                  const unalloc = parseFloat(String(p.unallocatedAmount)) || 0;
                  const alloc = amt - unalloc;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-white">{p.paymentNumber}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {p.paymentMethod.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(p.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-white">
                        ₹{amt.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-emerald-400">
                        ₹{alloc.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">
                        <span className={unalloc > 0 ? "text-amber-400 font-bold" : ""}>
                          ₹{unalloc.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-400">
                        {p.allocations?.length || 0} settled
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-400" />
                <span className="font-bold text-white text-sm">
                  Payment Receipt {selectedPayment.paymentNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs text-slate-300 font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print
                </button>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <div className="text-lg font-black tracking-tight text-white">
                    Bright<span className="text-emerald-400">Loop</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Payment Acknowledgement Voucher</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-white text-sm">
                    {selectedPayment.paymentNumber}
                  </div>
                  <div className="text-slate-400 mt-1">
                    Date: {new Date(selectedPayment.paymentDate).toLocaleDateString()}
                  </div>
                  <div className="text-emerald-400 font-medium mt-0.5">
                    Mode: {selectedPayment.paymentMethod.replace("_", " ")}
                  </div>
                </div>
              </div>

              {/* Allocation List */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Settled Invoice Accounts
                </div>
                {selectedPayment.allocations && selectedPayment.allocations.length > 0 ? (
                  <div className="border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                        <tr>
                          <th className="px-3 py-2">Invoice #</th>
                          <th className="px-3 py-2">Allocated Date</th>
                          <th className="px-3 py-2 text-right">Settled Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-200">
                        {selectedPayment.allocations.map((alloc) => (
                          <tr key={alloc.id}>
                            <td className="px-3 py-2 font-mono">{alloc.invoice?.invoiceNumber || alloc.invoiceId}</td>
                            <td className="px-3 py-2 text-slate-400">
                              {new Date(alloc.allocatedAt).toLocaleDateString()}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-emerald-400">
                              +₹{parseFloat(String(alloc.amount)).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center text-slate-500">
                    Full payment amount maintained as unallocated advance balance.
                  </div>
                )}
              </div>

              {/* Financial Totals */}
              <div className="flex justify-end">
                <div className="w-60 space-y-1.5 text-slate-400">
                  <div className="flex justify-between">
                    <span>Total Payment Received:</span>
                    <span className="font-mono text-white font-bold">
                      ₹{parseFloat(String(selectedPayment.amount)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Applied to Invoices:</span>
                    <span className="font-mono">
                      ₹
                      {(
                        parseFloat(String(selectedPayment.amount)) -
                        parseFloat(String(selectedPayment.unallocatedAmount))
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-slate-800 pt-1.5 flex justify-between font-bold text-amber-400">
                    <span>Available Advance Balance:</span>
                    <span className="font-mono">
                      ₹{parseFloat(String(selectedPayment.unallocatedAmount)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 px-6 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
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




