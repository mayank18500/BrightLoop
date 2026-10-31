import React, { useEffect, useState } from "react";
import { reportService, FinancialAnalytics } from "../../services/reportService";
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Receipt,
  CreditCard,
  Layers,
  Loader2,
  RefreshCw,
  XCircle,
  PieChart,
} from "lucide-react";

export const OverviewTab: React.FC = () => {
  const [analytics, setAnalytics] = useState<FinancialAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await reportService.getFinancialAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load financial analytics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <span className="text-sm font-medium">Aggregating real-time financial metrics & MRR...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-12 text-center text-slate-400">
        Failed to load analytics. Please ensure backend connectivity.
      </div>
    );
  }

  const overdueTotalNum = parseFloat(analytics.totalOverdue) || 0;
  const under30 = parseFloat(analytics.agingBuckets.under30Days) || 0;
  const days31to60 = parseFloat(analytics.agingBuckets.days31To60) || 0;
  const days61to90 = parseFloat(analytics.agingBuckets.days61To90) || 0;
  const over90 = parseFloat(analytics.agingBuckets.over90Days) || 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-500" />
            Executive Financial & SaaS Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time Monthly Recurring Revenue, annualized run-rate, overdue receivables aging, and subscriber retention.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Metrics
        </button>
      </div>

      {/* Core SaaS Revenue KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Monthly Recurring Revenue (MRR)</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white">${analytics.mrr}</div>
            <div className="text-xs text-blue-400 mt-1 font-medium flex items-center gap-1">
              <span>Normalized active subscription run-rate</span>
            </div>
          </div>
        </div>

        {/* ARR */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Annual Run-Rate (ARR)</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-purple-400">${analytics.arr}</div>
            <div className="text-xs text-slate-400 mt-1">Projected 12-month revenue</div>
          </div>
        </div>

        {/* Total Collected */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Settled Revenue</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-emerald-400">${analytics.totalPaymentsReceived}</div>
            <div className="text-xs text-slate-400 mt-1">
              Float credit: <span className="text-amber-400">${analytics.totalUnallocatedFloat}</span>
            </div>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Outstanding</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-amber-400">${analytics.totalOutstanding}</div>
            <div className="text-xs text-rose-400 mt-1 font-medium">
              Overdue portion: ${analytics.totalOverdue}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Overdue Aging Breakdown & Subscriber Retention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Receivables Aging Analysis */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <h3 className="text-base font-semibold text-white">Receivables Aging Buckets</h3>
            </div>
            <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              Total Overdue: ${analytics.totalOverdue}
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {/* 1 - 30 Days */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>1 - 30 Days Overdue</span>
                <span className="font-mono font-bold">${analytics.agingBuckets.under30Days}</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{
                    width: overdueTotalNum > 0 ? `${(under30 / overdueTotalNum) * 100}%` : "0%",
                  }}
                />
              </div>
            </div>

            {/* 31 - 60 Days */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>31 - 60 Days Overdue</span>
                <span className="font-mono font-bold">${analytics.agingBuckets.days31To60}</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{
                    width: overdueTotalNum > 0 ? `${(days31to60 / overdueTotalNum) * 100}%` : "0%",
                  }}
                />
              </div>
            </div>

            {/* 61 - 90 Days */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>61 - 90 Days Overdue</span>
                <span className="font-mono font-bold">${analytics.agingBuckets.days61To90}</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{
                    width: overdueTotalNum > 0 ? `${(days61to90 / overdueTotalNum) * 100}%` : "0%",
                  }}
                />
              </div>
            </div>

            {/* 90+ Days */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>90+ Days Overdue (Critical)</span>
                <span className="font-mono font-bold text-rose-400">${analytics.agingBuckets.over90Days}</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-600 rounded-full"
                  style={{
                    width: overdueTotalNum > 0 ? `${(over90 / overdueTotalNum) * 100}%` : "0%",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Subscriber Retention & Health */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-semibold text-white">Subscriber Lifecycle & Churn</h3>
            </div>
            <span className="text-xs font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              Churn Rate: {analytics.churnRate}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                Active Contracts
              </div>
              <div className="text-2xl font-bold text-white">{analytics.activeSubscriptions}</div>
              <div className="text-[11px] text-slate-500">Generating live MRR</div>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold mb-1">
                <Clock className="w-4 h-4" />
                Paused Contracts
              </div>
              <div className="text-2xl font-bold text-white">{analytics.pausedSubscriptions}</div>
              <div className="text-[11px] text-slate-500">Billing fair paused</div>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold mb-1">
                <XCircle className="w-4 h-4" />
                Closed Contracts
              </div>
              <div className="text-2xl font-bold text-white">{analytics.closedSubscriptions}</div>
              <div className="text-[11px] text-slate-500">Completed or churned</div>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold mb-1">
                <Layers className="w-4 h-4" />
                Draft Onboarding
              </div>
              <div className="text-2xl font-bold text-white">{analytics.draftSubscriptions}</div>
              <div className="text-[11px] text-slate-500">Pending activation</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Live Activity Stream */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Latest Invoices */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-blue-400" />
            Recent Billing Invoices
          </h3>
          <div className="space-y-2">
            {analytics.recentActivity.invoices.map((inv) => (
              <div
                key={inv.id}
                className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-mono font-medium text-white">{inv.invoiceNumber}</div>
                  <div className="text-slate-400 text-[11px]">{inv.customerName}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-semibold text-slate-200">${inv.amount}</div>
                  <div className="text-[10px] text-blue-400">{inv.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Payments */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            Recent Incoming Payments
          </h3>
          <div className="space-y-2">
            {analytics.recentActivity.payments.map((p) => (
              <div
                key={p.id}
                className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-mono font-medium text-white">{p.paymentNumber}</div>
                  <div className="text-slate-400 text-[11px]">{p.customerName}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-emerald-400">+${p.amount}</div>
                  <div className="text-[10px] text-slate-500">{p.method}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Subscriptions */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-purple-400" />
            Recent Subscriptions
          </h3>
          <div className="space-y-2">
            {analytics.recentActivity.subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-mono font-medium text-white">{sub.subscriptionNumber}</div>
                  <div className="text-slate-400 text-[11px]">{sub.customerName}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-300 font-medium">{sub.planName}</div>
                  <div className="text-[10px] text-emerald-400">{sub.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
