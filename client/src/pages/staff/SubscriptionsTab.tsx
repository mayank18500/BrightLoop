import React, { useEffect, useState } from "react";
import {
  subscriptionService,
  Subscription,
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
      setSubscriptions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      if (selectedSub?.id === updated.id) setSelectedSub(updated);
      setShowPauseModal(false);
      setPauseReason("");
      setFeedback({ type: "success", text: `Subscription ${updated.subscriptionNumber} PAUSED.` });
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
      setSubscriptions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      if (selectedSub?.id === updated.id) setSelectedSub(updated);
      setFeedback({
        type: "success",
        text: `Subscription ${updated.subscriptionNumber} RESUMED. Next Billing: ${new Date(
          updated.nextBillingDate
        ).toLocaleDateString()}`,
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
      setSubscriptions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      if (selectedSub?.id === updated.id) setSelectedSub(updated);
      setShowCloseModal(false);
      setCloseReason("");
      setFeedback({ type: "success", text: `Subscription ${updated.subscriptionNumber} CLOSED.` });
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
      setSubscriptions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      if (selectedSub?.id === updated.id) setSelectedSub(updated);
      setShowRenewModal(false);
      setFeedback({
        type: "success",
        text: `Subscription ${updated.subscriptionNumber} RENEWED. Next Billing: ${new Date(
          updated.nextBillingDate
        ).toLocaleDateString()}`,
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
      setFeedback({ type: "error", text: "Please add at least one line product." });
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await subscriptionService.createSubscription({
        customerId: newCustomerId,
        planId: newPlanId,
        paymentTerms: newPaymentTerms,
        startDate: new Date(newStartDate).toISOString(),
        items: validItems.map((i) => ({
          productId: i.productId,
          variantId: i.variantId || undefined,
          quantity: i.quantity,
        })),
      });

      setShowCreateModal(false);
      setFeedback({
        type: "success",
        text: `Active contract ${created.subscriptionNumber} created successfully.`,
      });
      fetchData();
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.response?.data?.error?.message || "Failed to onboard contract.",
      });
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
      const itemsVal = (s.items || []).reduce((isum, it) => isum + Number(it.unitPrice) * it.quantity, 0);
      return sum + itemsVal;
    }, 0);

  const filteredSubs = subscriptions.filter((s) => {
    const matches =
      s.subscriptionNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.customer?.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      s.customer?.email?.toLowerCase().includes(search.toLowerCase());
    if (!matches) return false;
    if (statusFilter === "ALL") return true;
    return s.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#15803D] border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            ACTIVE
          </span>
        );
      case "PAUSED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-[#B45309] border border-amber-200">
            <Pause className="h-3.5 w-3.5" />
            PAUSED
          </span>
        );
      case "CLOSED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-[#B91C1C] border border-rose-200">
            <XCircle className="h-3.5 w-3.5" />
            CLOSED
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
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-[#15803D]"
              : "bg-rose-50 border-rose-200 text-[#B91C1C]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-[#15803D] flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-[#B91C1C] flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-[#6B7280] hover:text-[#172554] p-1 rounded-lg transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#172554] flex items-center gap-2.5">
            <ShieldCheck className="h-6 w-6 text-[#7C3AED]" />
            Subscription Lifecycle Management
          </h2>
          <p className="text-sm text-[#596579] mt-1">
            Manage live recurring contracts, fair billing pauses, plan policy enforcements, and renewals.
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
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium text-xs shadow-sm hover:shadow transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            New Subscription Contract
          </button>
        </div>
      </div>

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl border border-[#E2E7EF] bg-white shadow-sm">
          <div className="text-xs font-semibold text-[#596579] uppercase tracking-wider">Total Contracts</div>
          <div className="text-2xl font-bold text-[#172554] mt-1.5">{totalCount}</div>
        </div>
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-sm">
          <div className="text-xs font-semibold text-[#15803D] uppercase tracking-wider">Active Contracts</div>
          <div className="text-2xl font-bold text-[#15803D] mt-1.5">{activeCount}</div>
        </div>
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-sm">
          <div className="text-xs font-semibold text-[#B45309] uppercase tracking-wider">Paused Contracts</div>
          <div className="text-2xl font-bold text-[#B45309] mt-1.5">{pausedCount}</div>
        </div>
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 shadow-sm">
          <div className="text-xs font-semibold text-[#B91C1C] uppercase tracking-wider">Closed Contracts</div>
          <div className="text-2xl font-bold text-[#B91C1C] mt-1.5">{closedCount}</div>
        </div>
        <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 shadow-sm">
          <div className="text-xs font-semibold text-[#7C3AED] uppercase tracking-wider">Active Contract MRR</div>
          <div className="text-2xl font-bold text-[#7C3AED] mt-1.5">
            ₹{totalMonthlyValue.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-[#E2E7EF] bg-white shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "ACTIVE", "PAUSED", "CLOSED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                statusFilter === status
                  ? "bg-[#7C3AED] text-white shadow-sm"
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
            placeholder="Search sub # or client company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-lg border border-[#E2E7EF] bg-white text-xs text-[#202938] placeholder-[#687386] focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
          />
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-xl border border-[#E2E7EF] bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E7EF] text-[11px] font-bold text-[#344054] uppercase tracking-wider">
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
            <tbody className="divide-y divide-[#E2E7EF] text-[#263247]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[#596579]">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#7C3AED] mb-2" />
                    Loading subscription contracts...
                  </td>
                </tr>
              ) : filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[#596579]">
                    No subscription contracts found. Convert confirmed quotations or click &quot;New Subscription Contract&quot;.
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub) => {
                  const itemsCount = sub.items?.length ?? 0;
                  const contractValue = (sub.items || []).reduce(
                    (acc, it) => acc + Number(it.unitPrice) * it.quantity,
                    0
                  );

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-[#F8FAFC] transition cursor-pointer"
                      onClick={() => {
                        setSelectedSub(sub);
                        setShowDetailModal(true);
                      }}
                    >
                      <td className="px-4 py-3.5 font-bold text-[#7C3AED]">
                        {sub.subscriptionNumber}
                        {sub.quotation && (
                          <div className="text-[10px] text-[#596579]">
                            Ref: {sub.quotation.quotationNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-[#172554]">{sub.customer?.companyName || "N/A"}</div>
                        <div className="text-[11px] text-[#596579]">{sub.customer?.email}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-[#263247]">{sub.plan?.name}</div>
                        <div className="text-[10px] text-[#596579]">
                          Billed {sub.plan?.billingFrequency?.toLowerCase()} (interval {sub.plan?.billingInterval})
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-[#172554]">
                          ₹{contractValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[11px] text-[#596579]">
                          {itemsCount} {itemsCount === 1 ? "product" : "products"}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-medium text-[#263247]">
                          <Calendar className="h-3.5 w-3.5 text-[#596579]" />
                          {new Date(sub.nextBillingDate).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-[#596579]">
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
                                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-[#B45309] border border-amber-200 font-medium text-[11px] flex items-center gap-1 transition shadow-sm"
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
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-[#B91C1C] border border-rose-200 font-medium text-[11px] flex items-center gap-1 transition shadow-sm"
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
                                className="px-2.5 py-1 rounded-lg bg-[#15803D] hover:bg-[#166534] text-white font-medium text-[11px] flex items-center gap-1 transition shadow-sm"
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
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-[#B91C1C] border border-rose-200 font-medium text-[11px] flex items-center gap-1 transition shadow-sm"
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
                              className="px-2.5 py-1 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium text-[11px] flex items-center gap-1 transition shadow-sm"
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
                            className="p-1 rounded-lg hover:bg-[#F1F5F9] text-[#596579] hover:text-[#172554] transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E2E7EF] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                <Pause className="h-5 w-5 text-[#B45309]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172554]">Pause Subscription Contract</h3>
                <p className="text-xs text-[#596579]">Contract: {subToPause.subscriptionNumber}</p>
              </div>
            </div>

            <p className="text-xs text-[#263247] leading-relaxed">
              Pausing halts automated recurring invoices for this client. When resumed later, the next billing date will be automatically recalibrated forward by the paused duration.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1">
                Reason for Pause (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Seasonal company pause, client project hiatus"
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E7EF] bg-white text-xs text-[#202938] focus:outline-none focus:border-[#B45309]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E7EF]">
              <button
                type="button"
                onClick={() => setShowPauseModal(false)}
                className="px-4 py-2 rounded-lg border border-[#E2E7EF] hover:bg-[#F8FAFC] text-[#596579] text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePause}
                disabled={actionLoadingId === subToPause.id}
                className="px-5 py-2 rounded-lg bg-[#B45309] hover:bg-[#92400E] text-white font-semibold text-xs shadow-sm hover:shadow transition cursor-pointer flex items-center gap-1.5"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E2E7EF] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-[#B91C1C]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172554]">Terminate Contract Early</h3>
                <p className="text-xs text-[#596579]">Contract: {subToClose.subscriptionNumber}</p>
              </div>
            </div>

            <p className="text-xs text-[#263247] leading-relaxed">
              Early closure permanently marks this contract as closed. Future automated recurring invoices will cease immediately.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1">
                Termination Reason *
              </label>
              <textarea
                placeholder="Reason for early contract closure..."
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E7EF] bg-white text-xs text-[#202938] focus:outline-none focus:border-[#B91C1C] resize-none h-20"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E7EF]">
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 rounded-lg border border-[#E2E7EF] hover:bg-[#F8FAFC] text-[#596579] text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={!closeReason.trim() || actionLoadingId === subToClose.id}
                className="px-5 py-2 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] disabled:opacity-50 text-white font-semibold text-xs shadow-sm hover:shadow transition cursor-pointer flex items-center gap-1.5"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E2E7EF] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center">
                <RotateCcw className="h-5 w-5 text-[#7C3AED]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172554]">Renew Contract</h3>
                <p className="text-xs text-[#596579]">Contract: {subToRenew.subscriptionNumber}</p>
              </div>
            </div>

            <p className="text-xs text-[#263247] leading-relaxed">
              Renewing reactivates the contract, advancing the next billing date by the plan&apos;s recurrence interval.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#344054] mb-1">
                Extension Cycles
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={renewIntervals}
                onChange={(e) => setRenewIntervals(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E7EF] bg-white text-xs text-[#202938] focus:outline-none focus:border-[#7C3AED]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E7EF]">
              <button
                type="button"
                onClick={() => setShowRenewModal(false)}
                className="px-4 py-2 rounded-lg border border-[#E2E7EF] hover:bg-[#F8FAFC] text-[#596579] text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRenew}
                disabled={actionLoadingId === subToRenew.id}
                className="px-5 py-2 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-xs shadow-sm hover:shadow transition cursor-pointer flex items-center gap-1.5"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2E7EF] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl my-8">
            <div className="px-6 py-4 border-b border-[#E2E7EF] bg-[#F8FAFC] rounded-t-2xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#172554]">
                    Subscription Contract {selectedSub.subscriptionNumber}
                  </h3>
                  {getStatusBadge(selectedSub.status)}
                </div>
                <p className="text-xs text-[#596579] mt-0.5">
                  Onboarded on {new Date(selectedSub.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-[#6B7280] hover:text-[#172554] p-1.5 rounded-lg hover:bg-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Client & Recurrence Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-[#E2E7EF] bg-[#F8FAFC]">
                <div>
                  <div className="text-[10px] font-bold text-[#596579] uppercase tracking-wider mb-1">
                    Subscriber Entity
                  </div>
                  <div className="text-sm font-bold text-[#172554]">{selectedSub.customer?.companyName}</div>
                  <div className="text-[#263247] mt-0.5">{selectedSub.customer?.contactName}</div>
                  <div className="text-[#596579]">{selectedSub.customer?.email}</div>
                  <div className="text-[#596579] mt-1 font-medium">Payment Terms: {selectedSub.paymentTerms}</div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-[#596579] uppercase tracking-wider mb-1">
                    Plan Policy & Schedule
                  </div>
                  <div className="text-sm font-bold text-[#7C3AED]">{selectedSub.plan?.name}</div>
                  <div className="text-[#263247] mt-0.5">
                    Next Scheduled Billing:{" "}
                    <span className="font-semibold text-[#172554]">
                      {new Date(selectedSub.nextBillingDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#596579] mt-1.5 flex flex-wrap gap-2">
                    <span className={selectedSub.plan?.allowPause ? "text-[#15803D] font-medium" : "text-[#B91C1C] font-medium"}>
                      • Pause: {selectedSub.plan?.allowPause ? "Allowed" : "Blocked"}
                    </span>
                    <span className={selectedSub.plan?.allowEarlyClosure ? "text-[#15803D] font-medium" : "text-[#B91C1C] font-medium"}>
                      • Early Close: {selectedSub.plan?.allowEarlyClosure ? "Allowed" : "Blocked"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Snapshotted Items Table */}
              <div>
                <h4 className="text-xs font-bold text-[#172554] uppercase tracking-wider mb-2">
                  Snapshotted Contract Products & Pricing
                </h4>
                <div className="border border-[#E2E7EF] rounded-xl overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-[#F8FAFC] border-b border-[#E2E7EF] text-[10px] text-[#344054] font-bold uppercase">
                      <tr>
                        <th className="px-3.5 py-2.5">Product & Variant</th>
                        <th className="px-3.5 py-2.5 text-center">Qty</th>
                        <th className="px-3.5 py-2.5 text-right">Agreed Unit Price</th>
                        <th className="px-3.5 py-2.5 text-right">Subtotal</th>
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
              </div>

              {selectedSub.closureReason && (
                <div className="p-3.5 rounded-xl border border-[#E2E7EF] bg-[#F8FAFC] text-[#596579]">
                  <span className="font-semibold text-[#172554]">Status Note / Reason: </span>
                  {selectedSub.closureReason}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#E2E7EF] bg-[#F8FAFC] rounded-b-2xl flex items-center justify-between">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 rounded-lg border border-[#E2E7EF] hover:bg-white text-[#596579] text-xs font-semibold cursor-pointer transition shadow-sm"
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
                    className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-[#B45309] border border-amber-200 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
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
                    className="px-4 py-1.5 rounded-lg bg-[#15803D] hover:bg-[#166534] text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2E7EF] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl my-8">
            <div className="px-6 py-4 border-b border-[#E2E7EF] bg-[#F8FAFC] rounded-t-2xl flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#172554] flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#7C3AED]" />
                  Manual Subscription Contract Onboarding
                </h3>
                <p className="text-xs text-[#596579] mt-0.5">
                  Directly onboard an active recurring client contract with agreed snapshot pricing.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#6B7280] hover:text-[#172554] p-1.5 rounded-lg hover:bg-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubscription} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">
                    Subscriber Entity *
                  </label>
                  <select
                    value={newCustomerId}
                    onChange={(e) => setNewCustomerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E7EF] bg-white text-xs text-[#202938] focus:outline-none focus:border-[#7C3AED]"
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
                  <label className="block text-xs font-semibold text-[#344054] mb-1">
                    Subscription Plan *
                  </label>
                  <select
                    value={newPlanId}
                    onChange={(e) => setNewPlanId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E7EF] bg-white text-xs text-[#202938] focus:outline-none focus:border-[#7C3AED]"
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
                  <label className="block text-xs font-semibold text-[#344054] mb-1">
                    Contract Start Date
                  </label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E7EF] bg-white text-xs text-[#202938] focus:outline-none focus:border-[#7C3AED]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={newPaymentTerms}
                    onChange={(e) => setNewPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E7EF] bg-white text-xs text-[#202938] focus:outline-none focus:border-[#7C3AED]"
                  >
                    <option value="Due on receipt">Due on receipt</option>
                    <option value="Net 15 Days">Net 15 Days</option>
                    <option value="Net 30 Days">Net 30 Days</option>
                  </select>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2 pt-2 border-t border-[#E2E7EF]">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#172554] uppercase tracking-wider">
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
                    className="text-xs text-[#7C3AED] hover:text-[#6D28D9] font-semibold flex items-center gap-1 cursor-pointer"
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
                      className="p-3 rounded-xl border border-[#E2E7EF] bg-[#F8FAFC] grid grid-cols-12 gap-3 items-center"
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
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2E7EF] bg-white text-xs text-[#202938] focus:outline-none focus:border-[#7C3AED]"
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
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2E7EF] bg-white text-xs text-[#202938] focus:outline-none focus:border-[#7C3AED]"
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
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2E7EF] bg-white text-xs text-[#202938] focus:outline-none focus:border-[#7C3AED] text-center"
                          required
                        />
                      </div>

                      <div className="col-span-1 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setNewItems(newItems.filter((_, i) => i !== idx))}
                          disabled={newItems.length <= 1}
                          className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#B91C1C] hover:bg-rose-50 disabled:opacity-30 cursor-pointer transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E7EF]">
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
                  className="px-5 py-2 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-xs shadow-sm hover:shadow transition cursor-pointer flex items-center gap-1.5"
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
