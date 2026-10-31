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
import { PageHeader } from "../../components/layout/PageHeader";

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
      <div className="p-16 flex flex-col items-center justify-center text-[#596579]">
        <Loader2 className="w-8 h-8 animate-spin text-[#4169E1] mb-3" />
        <span className="text-sm font-medium text-[#263247]">Aggregating real-time financial metrics & MRR...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="card-surface p-12 text-center text-[#596579]">
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
      <PageHeader
        title="Executive Financial & SaaS Analytics"
        subtitle="Real-time Monthly Recurring Revenue, annualized run-rate, overdue receivables aging, and subscriber retention."
        actions={
          <button
            type="button"
            onClick={fetchAnalytics}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E2E7EF] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#263247] transition shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#596579]" />
            Refresh Metrics
          </button>
        }
      />

      {/* Core SaaS Revenue KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR */}
        <div className="card-surface p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#596579]">
              Monthly Recurring Revenue (MRR)
            </span>
            <div className="p-2 bg-[#EEF4FF] text-[#4169E1] rounded-xl border border-[#D4E3FF]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-[#172554] tracking-tight">₹{analytics.mrr}</div>
            <div className="text-xs text-[#4169E1] mt-1 font-medium flex items-center gap-1">
              <span>Normalized active subscription run-rate</span>
            </div>
          </div>
        </div>

        {/* ARR */}
        <div className="card-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#596579]">
              Annual Run-Rate (ARR)
            </span>
            <div className="p-2 bg-[#F3E8FF] text-[#9333EA] rounded-xl border border-[#E9D5FF]">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-[#172554] tracking-tight">₹{analytics.arr}</div>
            <div className="text-xs text-[#596579] mt-1">Projected 12-month revenue</div>
          </div>
        </div>

        {/* Total Settled Revenue */}
        <div className="card-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#596579]">
              Total Settled Revenue
            </span>
            <div className="p-2 bg-[#DCFCE7] text-[#15803D] rounded-xl border border-[#BBF7D0]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-[#15803D] tracking-tight">₹{analytics.totalPaymentsReceived}</div>
            <div className="text-xs text-[#596579] mt-1">
              Float credit: <span className="font-semibold text-[#B45309]">₹{analytics.totalUnallocatedFloat}</span>
            </div>
          </div>
        </div>

        {/* Total Outstanding */}
        <div className="card-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#596579]">
              Total Outstanding
            </span>
            <div className="p-2 bg-[#FEF3C7] text-[#B45309] rounded-xl border border-[#FDE68A]">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-[#B45309] tracking-tight">₹{analytics.totalOutstanding}</div>
            <div className="text-xs text-[#B91C1C] mt-1 font-medium">
              Overdue portion: ₹{analytics.totalOverdue}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Overdue Aging Breakdown & Subscriber Retention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Receivables Aging Analysis */}
        <div className="card-surface p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E7EF] pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#B91C1C]" />
              <h3 className="text-base font-bold text-[#172554]">Receivables Aging Buckets</h3>
            </div>
            <span className="text-xs font-bold text-[#B91C1C] bg-[#FEE2E2] px-2.5 py-1 rounded-full border border-[#FECACA]">
              Total Overdue: ₹{analytics.totalOverdue}
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {/* 1 - 30 Days */}
            <div>
              <div className="flex justify-between text-xs text-[#263247] mb-1 font-medium">
                <span>1 - 30 Days Overdue</span>
                <span className="font-mono font-bold text-[#172554]">₹{analytics.agingBuckets.under30Days}</span>
              </div>
              <div className="w-full h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#EAB308] rounded-full"
                  style={{
                    width: overdueTotalNum > 0 ? `${(under30 / overdueTotalNum) * 100}%` : "0%",
                  }}
                />
              </div>
            </div>

            {/* 31 - 60 Days */}
            <div>
              <div className="flex justify-between text-xs text-[#263247] mb-1 font-medium">
                <span>31 - 60 Days Overdue</span>
                <span className="font-mono font-bold text-[#172554]">₹{analytics.agingBuckets.days31To60}</span>
              </div>
              <div className="w-full h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#F97316] rounded-full"
                  style={{
                    width: overdueTotalNum > 0 ? `${(days31to60 / overdueTotalNum) * 100}%` : "0%",
                  }}
                />
              </div>
            </div>

            {/* 61 - 90 Days */}
            <div>
              <div className="flex justify-between text-xs text-[#263247] mb-1 font-medium">
                <span>61 - 90 Days Overdue</span>
                <span className="font-mono font-bold text-[#172554]">₹{analytics.agingBuckets.days61To90}</span>
              </div>
              <div className="w-full h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#EF4444] rounded-full"
                  style={{
                    width: overdueTotalNum > 0 ? `${(days61to90 / overdueTotalNum) * 100}%` : "0%",
                  }}
                />
              </div>
            </div>

            {/* 90+ Days */}
            <div>
              <div className="flex justify-between text-xs text-[#263247] mb-1 font-medium">
                <span>90+ Days Overdue (Critical)</span>
                <span className="font-mono font-bold text-[#B91C1C]">₹{analytics.agingBuckets.over90Days}</span>
              </div>
              <div className="w-full h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#B91C1C] rounded-full"
                  style={{
                    width: overdueTotalNum > 0 ? `${(over90 / overdueTotalNum) * 100}%` : "0%",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Subscriber Retention & Health */}
        <div className="card-surface p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E7EF] pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-[#4169E1]" />
              <h3 className="text-base font-bold text-[#172554]">Subscriber Lifecycle & Churn</h3>
            </div>
            <span className="text-xs font-bold text-[#1D4ED8] bg-[#DBEAFE] px-2.5 py-1 rounded-full border border-[#BFDBFE]">
              Churn Rate: {analytics.churnRate}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 bg-[#FAFBFD] border border-[#E2E7EF] rounded-xl">
              <div className="flex items-center gap-2 text-xs text-[#15803D] font-semibold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                Active Contracts
              </div>
              <div className="text-2xl font-extrabold text-[#172554]">{analytics.activeSubscriptions}</div>
              <div className="text-[11px] text-[#596579]">Generating live MRR</div>
            </div>

            <div className="p-3.5 bg-[#FAFBFD] border border-[#E2E7EF] rounded-xl">
              <div className="flex items-center gap-2 text-xs text-[#B45309] font-semibold mb-1">
                <Clock className="w-4 h-4" />
                Paused Contracts
              </div>
              <div className="text-2xl font-extrabold text-[#172554]">{analytics.pausedSubscriptions}</div>
              <div className="text-[11px] text-[#596579]">Billing fair paused</div>
            </div>

            <div className="p-3.5 bg-[#FAFBFD] border border-[#E2E7EF] rounded-xl">
              <div className="flex items-center gap-2 text-xs text-[#596579] font-semibold mb-1">
                <XCircle className="w-4 h-4" />
                Closed Contracts
              </div>
              <div className="text-2xl font-extrabold text-[#172554]">{analytics.closedSubscriptions}</div>
              <div className="text-[11px] text-[#596579]">Completed or churned</div>
            </div>

            <div className="p-3.5 bg-[#FAFBFD] border border-[#E2E7EF] rounded-xl">
              <div className="flex items-center gap-2 text-xs text-[#1D4ED8] font-semibold mb-1">
                <Layers className="w-4 h-4" />
                Draft Onboarding
              </div>
              <div className="text-2xl font-extrabold text-[#172554]">{analytics.draftSubscriptions}</div>
              <div className="text-[11px] text-[#596579]">Pending activation</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Live Activity Stream */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Latest Invoices */}
        <div className="card-surface p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#596579] flex items-center gap-1.5 border-b border-[#E2E7EF] pb-2.5">
            <Receipt className="w-4 h-4 text-[#4169E1]" />
            Recent Billing Invoices
          </h3>
          <div className="space-y-2">
            {analytics.recentActivity.invoices.length === 0 ? (
              <p className="text-xs text-[#6B7280] py-4 text-center">No recent invoices recorded.</p>
            ) : (
              analytics.recentActivity.invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3 bg-[#FAFBFD] border border-[#E2E7EF] rounded-xl flex items-center justify-between text-xs hover:border-[#CBD5E1] transition-colors"
                >
                  <div>
                    <div className="font-mono font-bold text-[#172554]">{inv.invoiceNumber}</div>
                    <div className="text-[#596579] text-[11px]">{inv.customerName}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-[#263247]">₹{inv.amount}</div>
                    <div className="text-[10px] font-semibold text-[#4169E1]">{inv.status}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Latest Payments */}
        <div className="card-surface p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#596579] flex items-center gap-1.5 border-b border-[#E2E7EF] pb-2.5">
            <CreditCard className="w-4 h-4 text-[#15803D]" />
            Recent Incoming Payments
          </h3>
          <div className="space-y-2">
            {analytics.recentActivity.payments.length === 0 ? (
              <p className="text-xs text-[#6B7280] py-4 text-center">No recent payments recorded.</p>
            ) : (
              analytics.recentActivity.payments.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-[#FAFBFD] border border-[#E2E7EF] rounded-xl flex items-center justify-between text-xs hover:border-[#CBD5E1] transition-colors"
                >
                  <div>
                    <div className="font-mono font-bold text-[#172554]">{p.paymentNumber}</div>
                    <div className="text-[#596579] text-[11px]">{p.customerName}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-[#15803D]">+₹{p.amount}</div>
                    <div className="text-[10px] text-[#6B7280]">{p.method}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Latest Subscriptions */}
        <div className="card-surface p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#596579] flex items-center gap-1.5 border-b border-[#E2E7EF] pb-2.5">
            <Layers className="w-4 h-4 text-[#9333EA]" />
            Recent Subscriptions
          </h3>
          <div className="space-y-2">
            {analytics.recentActivity.subscriptions.length === 0 ? (
              <p className="text-xs text-[#6B7280] py-4 text-center">No subscriptions recorded.</p>
            ) : (
              analytics.recentActivity.subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3 bg-[#FAFBFD] border border-[#E2E7EF] rounded-xl flex items-center justify-between text-xs hover:border-[#CBD5E1] transition-colors"
                >
                  <div>
                    <div className="font-mono font-bold text-[#172554]">{sub.subscriptionNumber}</div>
                    <div className="text-[#596579] text-[11px]">{sub.customerName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#263247] font-semibold">{sub.planName}</div>
                    <div className="text-[10px] font-bold text-[#15803D]">{sub.status}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
