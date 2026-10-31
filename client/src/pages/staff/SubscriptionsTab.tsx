import React, { useEffect, useState } from "react";
import {
  subscriptionService,
  Subscription,
  CreateSubscriptionPayload,
} from "../../services/subscriptionService";
import { quotationService, CustomerInfo } from "../../services/quotationService";
import { catalogService, Product, Plan } from "../../services/catalogService";
import {
  ShieldCheck,
  Plus,
  Play,
  Pause,
  XCircle,
  RotateCcw,
  RefreshCw,
  Search,
  Calendar,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Trash2,
  X,
  Loader2,
  Clock,
} from "lucide-react";

export const SubscriptionsTab: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [customers, setCustomers] = useState<CustomerInfo[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);

  const [showPauseModal, setShowPauseModal] = useState(false);
  const [subToPause, setSubToPause] = useState<Subscription | null>(null);
  const [pauseReason, setPauseReason] = useState("");

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [subToClose, setSubToClose] = useState<Subscription | null>(null);
  const [closeReason, setCloseReason] = useState("");

  const [showRenewModal, setShowRenewModal] = useState(false);
  const [subToRenew, setSubToRenew] = useState<Subscription | null>(null);
  const [renewIntervals, setRenewIntervals] = useState(1);

  // Form State for Manual Contract Onboarding
  const [newCustomerId, setNewCustomerId] = useState("");
  const [newPlanId, setNewPlanId] = useState("");
  const [newPaymentTerms, setNewPaymentTerms] = useState("Due on receipt");
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [newItems, setNewItems] = useState<
    { productId: string; variantId: string; quantity: number }[]
  >([{ productId: "", variantId: "", quantity: 1 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subsRes, custRes, prodRes, planRes] = await Promise.all([
        subscriptionService.getSubscriptions(),
        quotationService.listCustomers(),
        catalogService.getProducts(),
        catalogService.getPlans(),
      ]);

      setSubscriptions(subsRes.subscriptions);
      setCustomers(custRes);
      setProducts(prodRes);
      setPlans(planRes);

      if (custRes.length > 0 && !newCustomerId) setNewCustomerId(custRes[0].id);
      if (planRes.length > 0 && !newPlanId) setNewPlanId(planRes[0].id);
      if (prodRes.length > 0 && newItems[0].productId === "") {
        setNewItems([
          {
            productId: prodRes[0].id,
            variantId: prodRes[0].variants[0]?.id || "",
            quantity: 1,
          },
        ]);
      }
    } catch (err: any) {
      console.error("Failed to load subscriptions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePause = async () => {
    if (!subToPause) return;
    try {
      setActionLoadingId(subToPause.id);
      const updated = await subscriptionService.pauseSubscription(subToPause.id, pauseReason);
      setSubscriptions((prev) => prev.map((s) => (s.id === subToPause.id ? updated : s)));
      if (selectedSub?.id === subToPause.id) setSelectedSub(updated);
      setShowPauseModal(false);
      setPauseReason("");
      setFeedback({ type: "success", text: `Contract ${updated.subscriptionNumber} paused successfully.` });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.response?.data?.error?.message || "Failed to pause subscription." });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResume = async (sub: Subscription) => {
    try {
      setActionLoadingId(sub.id);
      const updated = await subscriptionService.resumeSubscription(sub.id);
      setSubscriptions((prev) => prev.map((s) => (s.id === sub.id ? updated : s)));
      if (selectedSub?.id === sub.id) setSelectedSub(updated);
      setFeedback({
        type: "success",
        text: `Contract ${updated.subscriptionNumber} resumed! Next billing recalibrated to ${new Date(
          updated.nextBillingDate
        ).toLocaleDateString()}.`,
      });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.response?.data?.error?.message || "Failed to resume subscription." });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleClose = async () => {
    if (!subToClose || !closeReason.trim()) return;
    try {
      setActionLoadingId(subToClose.id);
      const updated = await subscriptionService.closeSubscription(subToClose.id, closeReason);
      setSubscriptions((prev) => prev.map((s) => (s.id === subToClose.id ? updated : s)));
      if (selectedSub?.id === subToClose.id) setSelectedSub(updated);
      setShowCloseModal(false);
      setCloseReason("");
      setFeedback({ type: "success", text: `Contract ${updated.subscriptionNumber} closed early.` });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.response?.data?.error?.message || "Failed to close subscription." });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRenew = async () => {
    if (!subToRenew) return;
    try {
      setActionLoadingId(subToRenew.id);
      const updated = await subscriptionService.renewSubscription(subToRenew.id, renewIntervals);
      setSubscriptions((prev) => prev.map((s) => (s.id === subToRenew.id ? updated : s)));
      if (selectedSub?.id === subToRenew.id) setSelectedSub(updated);
      setShowRenewModal(false);
      setFeedback({
        type: "success",
        text: `Contract ${updated.subscriptionNumber} renewed! Next billing: ${new Date(
          updated.nextBillingDate
        ).toLocaleDateString()}.`,
      });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.response?.data?.error?.message || "Failed to renew subscription." });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerId || !newPlanId) {
      setFeedback({ type: "error", text: "Please select customer and subscription plan." });
      return;
    }

    const validItems = newItems.filter((i) => i.productId);
    if (validItems.length === 0) {
      setFeedback({ type: "error", text: "Please specify at least one product item." });
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CreateSubscriptionPayload = {
        customerId: newCustomerId,
        planId: newPlanId,
        paymentTerms: newPaymentTerms,
        startDate: new Date(newStartDate).toISOString(),
        items: validItems.map((it) => ({
          productId: it.productId,
          variantId: it.variantId || undefined,
          quantity: it.quantity,
        })),
      };

      const created = await subscriptionService.createSubscription(payload);
      setShowCreateModal(false);
      setFeedback({
        type: "success",
        text: `Active Subscription Contract ${created.subscriptionNumber} onboarded successfully!`,
      });
      fetchData();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.response?.data?.error?.message || "Failed to create subscription." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics
  const totalCount = subscriptions.length;
  const activeCount = subscriptions.filter((s) => s.status === "ACTIVE").length;
  const pausedCount = subscriptions.filter((s) => s.status === "PAUSED").length;
  const closedCount = subscriptions.filter((s) => s.status === "CLOSED").length;

  const totalMonthlyValue = subscriptions
    .filter((s) => s.status === "ACTIVE")
    .reduce((sum, s) => {
      const itemsSum = s.items.reduce((acc, it) => acc + Number(it.unitPrice) * it.quantity, 0);
      return sum + itemsSum;
    }, 0);

  const filteredSubs = subscriptions.filter((s) => {
    const matchesSearch =
      s.subscriptionNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.customer?.companyName.toLowerCase().includes(search.toLowerCase()) ||
      s.customer?.email.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === "ALL") return true;
    return s.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ACTIVE
          </span>
        );
      case "PAUSED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="h-3 w-3" />
            PAUSED
          </span>
        );
      case "CLOSED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="h-3 w-3" />
            CLOSED
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
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-400" />
            )}
            <span className="text-sm font-medium">{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white text-xs cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-purple-400" />
            Subscription Lifecycle Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage live recurring contracts, fair billing pauses, plan policy enforcements, and renewals.
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
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow-lg shadow-purple-500/20 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            New Subscription Contract
          </button>
        </div>
      </div>

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Contracts</div>
          <div className="text-xl font-bold text-white mt-1">{totalCount}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur">
          <div className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Active Contracts</div>
          <div className="text-xl font-bold text-emerald-300 mt-1">{activeCount}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 backdrop-blur">
          <div className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">Paused Contracts</div>
          <div className="text-xl font-bold text-amber-300 mt-1">{pausedCount}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 backdrop-blur">
          <div className="text-[11px] font-medium text-rose-400 uppercase tracking-wider">Closed Contracts</div>
          <div className="text-xl font-bold text-rose-300 mt-1">{closedCount}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-purple-500/20 bg-purple-500/5 backdrop-blur">
          <div className="text-[11px] font-medium text-purple-400 uppercase tracking-wider">Active Contract MRR</div>
          <div className="text-xl font-bold text-purple-300 mt-1">
            ₹{totalMonthlyValue.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/40">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "ACTIVE", "PAUSED", "CLOSED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                statusFilter === status
                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
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
            placeholder="Search sub # or client company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/70 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/70 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Contract #</th>
                <th className="px-4 py-3.5">Client Organization</th>
                <th className="px-4 py-3.5">Subscription Plan</th>
                <th className="px-4 py-3.5">Snapshotted Items</th>
                <th className="px-4 py-3.5">Next Billing Date</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-purple-500 mb-2" />
                    Loading subscription contracts...
                  </td>
                </tr>
              ) : filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    No subscription contracts found. Convert confirmed quotations or click "New Subscription Contract".
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub) => {
                  const contractValue = sub.items.reduce(
                    (acc, it) => acc + Number(it.unitPrice) * it.quantity,
                    0
                  );

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-800/40 transition cursor-pointer"
                      onClick={() => {
                        setSelectedSub(sub);
                        setShowDetailModal(true);
                      }}
                    >
                      <td className="px-4 py-3.5 font-semibold text-purple-400">
                        {sub.subscriptionNumber}
                        {sub.quotation && (
                          <div className="text-[10px] text-slate-500">
                            Ref: {sub.quotation.quotationNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-white">{sub.customer?.companyName || "N/A"}</div>
                        <div className="text-[11px] text-slate-400">{sub.customer?.email}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-200">{sub.plan?.name}</div>
                        <div className="text-[10px] text-slate-400">
                          Billed {sub.plan?.billingFrequency.toLowerCase()} (interval {sub.plan?.billingInterval})
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-white">
                          ₹{contractValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {sub.items.length} {sub.items.length === 1 ? "product" : "products"}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-medium text-slate-200">
                          <Calendar className="h-3.5 w-3.5 text-slate-500" />
                          {new Date(sub.nextBillingDate).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Terms: {sub.paymentTerms}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">{getStatusBadge(sub.status)}</td>
                      <td
                        className="px-4 py-3.5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {sub.status === "ACTIVE" && (
                            <>
                              <button
                                onClick={() => {
                                  setSubToPause(sub);
                                  setShowPauseModal(true);
                                }}
                                disabled={actionLoadingId === sub.id}
                                className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-medium text-[11px] flex items-center gap-1 transition"
                                title="Pause Recurring Billing"
                              >
                                <Pause className="h-3 w-3" />
                                Pause
                              </button>
                              <button
                                onClick={() => {
                                  setSubToClose(sub);
                                  setShowCloseModal(true);
                                }}
                                disabled={actionLoadingId === sub.id}
                                className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-medium text-[11px] flex items-center gap-1 transition"
                                title="Early Closure"
                              >
                                <XCircle className="h-3 w-3" />
                                Close
                              </button>
                            </>
                          )}

                          {sub.status === "PAUSED" && (
                            <>
                              <button
                                onClick={() => handleResume(sub)}
                                disabled={actionLoadingId === sub.id}
                                className="px-2.5 py-1 rounded bg-emerald-600/80 hover:bg-emerald-600 text-white font-medium text-[11px] flex items-center gap-1 transition"
                                title="Resume Subscription"
                              >
                                <Play className="h-3 w-3" />
                                Resume
                              </button>
                              <button
                                onClick={() => {
                                  setSubToClose(sub);
                                  setShowCloseModal(true);
                                }}
                                disabled={actionLoadingId === sub.id}
                                className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-medium text-[11px] flex items-center gap-1 transition"
                                title="Close Contract"
                              >
                                <XCircle className="h-3 w-3" />
                                Close
                              </button>
                            </>
                          )}

                          {sub.status === "CLOSED" && (
                            <button
                              onClick={() => {
                                setSubToRenew(sub);
                                setShowRenewModal(true);
                              }}
                              disabled={actionLoadingId === sub.id}
                              className="px-2.5 py-1 rounded bg-purple-600/80 hover:bg-purple-600 text-white font-medium text-[11px] flex items-center gap-1 transition"
                              title="Renew Contract"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Renew
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedSub(sub);
                              setShowDetailModal(true);
                            }}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                            title="View Contract"
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

      {/* PAUSE CONFIRMATION MODAL */}
      {showPauseModal && subToPause && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <Pause className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Pause Subscription Contract</h3>
                <p className="text-xs text-slate-400">Contract: {subToPause.subscriptionNumber}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Pausing halts automated recurring invoices for this client. When resumed later, the next billing date will be automatically recalibrated forward by the paused duration.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reason for Pause (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Seasonal company pause, client project hiatus"
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowPauseModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePause}
                disabled={actionLoadingId === subToPause.id}
                className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <Pause className="h-4 w-4" />
                Confirm Pause
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLOSE CONFIRMATION MODAL */}
      {showCloseModal && subToClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Terminate Contract Early</h3>
                <p className="text-xs text-slate-400">Contract: {subToClose.subscriptionNumber}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Early closure permanently marks this contract as closed. Future automated recurring invoices will cease immediately.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Termination Reason *
              </label>
              <textarea
                placeholder="Reason for early contract closure..."
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-rose-500 resize-none h-20"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={!closeReason.trim() || actionLoadingId === subToClose.id}
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-rose-500/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <XCircle className="h-4 w-4" />
                Close Contract
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENEW CONFIRMATION MODAL */}
      {showRenewModal && subToRenew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                <RotateCcw className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Renew Contract</h3>
                <p className="text-xs text-slate-400">Contract: {subToRenew.subscriptionNumber}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Renewing reactivates the contract, advancing the next billing date by the plan's recurrence interval.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Extension Cycles
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={renewIntervals}
                onChange={(e) => setRenewIntervals(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowRenewModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRenew}
                disabled={actionLoadingId === subToRenew.id}
                className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-500/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="h-4 w-4" />
                Confirm Renewal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL SUBSCRIPTION MODAL */}
      {showDetailModal && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl my-8">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    Subscription Contract {selectedSub.subscriptionNumber}
                  </h3>
                  {getStatusBadge(selectedSub.status)}
                </div>
                <p className="text-xs text-slate-400">
                  Onboarded on {new Date(selectedSub.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Client & Recurrence Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-800 bg-slate-950/60">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Subscriber Entity
                  </div>
                  <div className="text-sm font-semibold text-white">{selectedSub.customer?.companyName}</div>
                  <div className="text-slate-300 mt-0.5">{selectedSub.customer?.contactName}</div>
                  <div className="text-slate-400">{selectedSub.customer?.email}</div>
                  <div className="text-slate-400 mt-1">Payment Terms: {selectedSub.paymentTerms}</div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Plan Policy & Schedule
                  </div>
                  <div className="text-sm font-semibold text-purple-400">{selectedSub.plan?.name}</div>
                  <div className="text-slate-300 mt-0.5">
                    Next Scheduled Billing:{" "}
                    <span className="font-semibold text-white">
                      {new Date(selectedSub.nextBillingDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap gap-2">
                    <span className={selectedSub.plan?.allowPause ? "text-emerald-400" : "text-rose-400"}>
                      • Pause: {selectedSub.plan?.allowPause ? "Allowed" : "Blocked"}
                    </span>
                    <span className={selectedSub.plan?.allowEarlyClosure ? "text-emerald-400" : "text-rose-400"}>
                      • Early Close: {selectedSub.plan?.allowEarlyClosure ? "Allowed" : "Blocked"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Snapshotted Items Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Snapshotted Contract Products & Pricing
                </h4>
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                      <tr>
                        <th className="px-3.5 py-2.5">Product & Variant</th>
                        <th className="px-3.5 py-2.5 text-center">Qty</th>
                        <th className="px-3.5 py-2.5 text-right">Agreed Unit Price</th>
                        <th className="px-3.5 py-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {selectedSub.items.map((it) => (
                        <tr key={it.id}>
                          <td className="px-3.5 py-2.5">
                            <div className="font-medium text-white">{it.product?.name || "Product"}</div>
                            {it.variant && (
                              <div className="text-[10px] text-slate-400">Variant: {it.variant.name}</div>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 text-center">{it.quantity}</td>
                          <td className="px-3.5 py-2.5 text-right font-mono">
                            ₹{Number(it.unitPrice).toFixed(2)}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-white">
                            ₹{(Number(it.unitPrice) * it.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedSub.closureReason && (
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-400">
                  <span className="font-semibold text-slate-300">Status Note / Reason: </span>
                  {selectedSub.closureReason}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {selectedSub.status === "ACTIVE" && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSubToPause(selectedSub);
                      setShowPauseModal(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Pause className="h-3.5 w-3.5" />
                    Pause
                  </button>
                )}
                {selectedSub.status === "PAUSED" && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleResume(selectedSub);
                    }}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Resume
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SUBSCRIPTION CONTRACT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl my-8">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-purple-400" />
                  Manual Subscription Contract Onboarding
                </h3>
                <p className="text-xs text-slate-400">
                  Directly onboard an active recurring client contract with agreed snapshot pricing.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubscription} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Subscriber Entity *
                  </label>
                  <select
                    value={newCustomerId}
                    onChange={(e) => setNewCustomerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-purple-500"
                    required
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} ({c.contactName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Subscription Plan *
                  </label>
                  <select
                    value={newPlanId}
                    onChange={(e) => setNewPlanId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-purple-500"
                    required
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - ₹{Number(p.price).toFixed(0)} ({p.billingFrequency})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Contract Start Date
                  </label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={newPaymentTerms}
                    onChange={(e) => setNewPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Due on receipt">Due on receipt</option>
                    <option value="Net 15 Days">Net 15 Days</option>
                    <option value="Net 30 Days">Net 30 Days</option>
                  </select>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Contract Line Products
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const first = products[0];
                      setNewItems([
                        ...newItems,
                        {
                          productId: first?.id || "",
                          variantId: first?.variants[0]?.id || "",
                          quantity: 1,
                        },
                      ]);
                    }}
                    className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Product
                  </button>
                </div>

                {newItems.map((item, idx) => {
                  const currentProduct = products.find((p) => p.id === item.productId);
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 grid grid-cols-12 gap-3 items-center"
                    >
                      <div className="col-span-5">
                        <select
                          value={item.productId}
                          onChange={(e) => {
                            const pId = e.target.value;
                            const prod = products.find((p) => p.id === pId);
                            const updated = [...newItems];
                            updated[idx].productId = pId;
                            updated[idx].variantId = prod?.variants[0]?.id || "";
                            setNewItems(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white focus:outline-none focus:border-purple-500"
                          required
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-4">
                        <select
                          value={item.variantId}
                          onChange={(e) => {
                            const updated = [...newItems];
                            updated[idx].variantId = e.target.value;
                            setNewItems(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white focus:outline-none focus:border-purple-500"
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
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...newItems];
                            updated[idx].quantity = Math.max(1, parseInt(e.target.value, 10) || 1);
                            setNewItems(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white focus:outline-none focus:border-purple-500"
                          required
                        />
                      </div>

                      <div className="col-span-1 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setNewItems(newItems.filter((_, i) => i !== idx))}
                          disabled={newItems.length <= 1}
                          className="p-1 text-slate-500 hover:text-rose-400 disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
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
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-500/20 transition cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating Contract...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Activate Contract
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
