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
  BarChart3,
  Download,
  Calendar,
  ArrowUpRight,
} from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";

export const ReportsTab: React.FC = () => {
  const [analytics, setAnalytics] = useState<FinancialAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<"ALL" | "THIS_MONTH" | "THIS_QUARTER" | "THIS_YEAR">("ALL");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await reportService.getFinancialAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load financial reports", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportCSV = () => {
    if (!analytics) return;
    const rows = [
      ["Metric", "Value", "Currency/Unit"],
      ["Monthly Recurring Revenue (MRR)", analytics.mrr, "INR"],
      ["Annual Run-Rate (ARR)", analytics.arr, "INR"],
      ["Total Settled Payments", analytics.totalPaymentsReceived, "INR"],
      ["Total Outstanding Receivables", analytics.totalOutstanding, "INR"],
      ["Total Overdue Receivables", analytics.totalOverdue, "INR"],
      ["Unallocated Float Credit", analytics.totalUnallocatedFloat, "INR"],
      ["Active Subscriptions", analytics.activeSubscriptions, "Count"],
      ["Paused Subscriptions", analytics.pausedSubscriptions, "Count"],
      ["Closed Subscriptions", analytics.closedSubscriptions, "Count"],
      ["Draft Subscriptions", analytics.draftSubscriptions, "Count"],
      ["Subscriber Churn Rate", analytics.churnRate, "%"],
      ["Aging Overdue 1-30 Days", analytics.agingBuckets.under30Days, "INR"],
      ["Aging Overdue 31-60 Days", analytics.agingBuckets.days31To60, "INR"],
      ["Aging Overdue 61-90 Days", analytics.agingBuckets.days61To90, "INR"],
      ["Aging Overdue 90+ Days (Critical)", analytics.agingBuckets.over90Days, "INR"],
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BrightLoop_Financial_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center text-[#596579]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563EB] mb-3" />
        <span className="text-sm font-semibold text-[#172554]">
          Computing live financial reports, MRR analytics, and overdue aging...
        </span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="card-surface p-12 text-center text-[#596579]">
        <AlertTriangle className="w-10 h-10 text-[#B91C1C] mx-auto mb-2" />
        <h3 className="text-base font-bold text-[#172554]">Failed to load financial report</h3>
        <p className="text-xs text-[#596579] mt-1 mb-4">Please verify server connectivity and database health.</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-xs font-semibold cursor-pointer"
        >
          Retry Fetching
        </button>
      </div>
    );
  }

  const overdueTotalNum = parseFloat(analytics.totalOverdue) || 0;
  const under30 = parseFloat(analytics.agingBuckets.under30Days) || 0;
  const days31to60 = parseFloat(analytics.agingBuckets.days31To60) || 0;
  const days61to90 = parseFloat(analytics.agingBuckets.days61To90) || 0;
  const over90 = parseFloat(analytics.agingBuckets.over90Days) || 0;

  const totalInvoicedNum = parseFloat(analytics.totalInvoiced) || 1;
  const totalPaidNum = parseFloat(analytics.totalPaid) || 0;
  const collectionRate = totalInvoicedNum > 0 ? ((totalPaidNum / totalInvoicedNum) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Financial Reports & Recurring Billing Analytics"
        subtitle="Live automated aggregation of Monthly Recurring Revenue (MRR), ARR run-rate, collection health, and aged overdue debt."
        actions={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E2E7EF] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#172554] transition shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#2563EB]" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={fetchAnalytics}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E2E7EF] bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white transition shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Analytics
            </button>
          </div>
        }
      />

      {/* Filter / Period Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-[#E2E7EF] bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#596579]" />
          <span className="text-xs font-bold text-[#344054] uppercase tracking-wider">Audit Scope:</span>
          <div className="flex items-center gap-1.5">
            {[
              { id: "ALL", label: "All-Time Aggregate" },
              { id: "THIS_YEAR", label: "Current Fiscal Year" },
              { id: "THIS_QUARTER", label: "Current Quarter" },
              { id: "THIS_MONTH", label: "Active Month" },
            ].map((period) => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id as "ALL" | "THIS_MONTH" | "THIS_QUARTER" | "THIS_YEAR")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedPeriod === period.id
                    ? "bg-[#2563EB] text-white shadow-sm"
                    : "bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#596579] border border-[#E2E7EF]"
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
        <div className="text-xs font-medium text-[#596579] flex items-center gap-1.5 self-end sm:self-auto">
          <span>Reporting Currency:</span>
          <span className="font-bold font-mono text-[#172554] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E7EF]">
            INR (₹)
          </span>
        </div>
      </div>

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR */}
        <div className="card-surface p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#596579]">
              Monthly Recurring Revenue (MRR)
            </span>
            <div className="p-2 bg-blue-50 text-[#1D4ED8] rounded-xl border border-blue-200">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-[#172554] tracking-tight">₹{analytics.mrr}</div>
            <div className="text-xs text-[#2563EB] mt-1 font-medium flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Normalized active subscription run-rate</span>
            </div>
          </div>
        </div>

        {/* ARR */}
        <div className="card-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#596579]">
              Annualized Run-Rate (ARR)
            </span>
            <div className="p-2 bg-purple-50 text-[#7C3AED] rounded-xl border border-purple-200">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-[#172554] tracking-tight">₹{analytics.arr}</div>
            <div className="text-xs text-[#596579] mt-1 font-medium">12-month forward projection</div>
          </div>
        </div>

        {/* Settled Revenue */}
        <div className="card-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#596579]">
              Total Settled Collections
            </span>
            <div className="p-2 bg-emerald-50 text-[#15803D] rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-[#15803D] tracking-tight">
              ₹{analytics.totalPaymentsReceived}
            </div>
            <div className="text-xs text-[#596579] mt-1 font-medium">
              Collection efficiency: <span className="font-bold text-[#15803D]">{collectionRate}%</span>
            </div>
          </div>
        </div>

        {/* Receivables Outstanding */}
        <div className="card-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#596579]">
              Outstanding Receivables
            </span>
            <div className="p-2 bg-amber-50 text-[#B45309] rounded-xl border border-amber-200">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-[#B45309] tracking-tight">
              ₹{analytics.totalOutstanding}
            </div>
            <div className="text-xs text-[#B91C1C] mt-1 font-semibold">
              Overdue portion: ₹{analytics.totalOverdue}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Overdue Receivables Aging Analysis & Lifecycle Churn */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Receivables Aging Analysis */}
        <div className="card-surface p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E7EF] pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#B91C1C]" />
              <h3 className="text-base font-bold text-[#172554]">Receivables Aging Buckets</h3>
            </div>
            <span className="text-xs font-bold text-[#B91C1C] bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              Total Overdue: ₹{analytics.totalOverdue}
            </span>
          </div>

          <div className="space-y-4 pt-1">
            {/* 1 - 30 Days */}
            <div>
              <div className="flex justify-between text-xs text-[#263247] mb-1 font-medium">
                <span className="font-semibold">1 - 30 Days Overdue</span>
                <span className="font-mono font-bold text-[#172554]">
                  ₹{analytics.agingBuckets.under30Days} ({overdueTotalNum > 0 ? ((under30 / overdueTotalNum) * 100).toFixed(1) : 0}%)
                </span>
              </div>
              <div className="w-full h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#EAB308] rounded-full transition-all"
                  style={{
                    width: overdueTotalNum > 0 ? `${(under30 / overdueTotalNum) * 100}%` : "0%",
                  }}
                />
              </div>
            </div>

            {/* 31 - 60 Days */}
            <div>
              <div className="flex justify-between text-xs text-[#263247] mb-1 font-medium">
                <span className="font-semibold">31 - 60 Days Overdue</span>
                <span className="font-mono font-bold text-[#172554]">
                  ₹{analytics.agingBuckets.days31To60} ({overdueTotalNum > 0 ? ((days31to60 / overdueTotalNum) * 100).toFixed(1) : 0}%)
                </span>
              </div>
              <div className="w-full h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#F97316] rounded-full transition-all"
                  style={{
                    width: overdueTotalNum > 0 ? `${(days31to60 / overdueTotalNum) * 100}%` : "0%",
                  }}
                />
              </div>
            </div>

            {/* 61 - 90 Days */}
            <div>
              <div className="flex justify-between text-xs text-[#263247] mb-1 font-medium">
                <span className="font-semibold">61 - 90 Days Overdue</span>
                <span className="font-mono font-bold text-[#172554]">
                  ₹{analytics.agingBuckets.days61To90} ({overdueTotalNum > 0 ? ((days61to90 / overdueTotalNum) * 100).toFixed(1) : 0}%)
                </span>
              </div>
              <div className="w-full h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#EF4444] rounded-full transition-all"
                  style={{
                    width: overdueTotalNum > 0 ? `${(days61to90 / overdueTotalNum) * 100}%` : "0%",
                  }}
                />
              </div>
            </div>

            {/* 90+ Days */}
            <div>
              <div className="flex justify-between text-xs text-[#263247] mb-1 font-medium">
                <span className="font-semibold text-[#B91C1C]">90+ Days Overdue (Critical Default Risk)</span>
                <span className="font-mono font-bold text-[#B91C1C]">
                  ₹{analytics.agingBuckets.over90Days} ({overdueTotalNum > 0 ? ((over90 / overdueTotalNum) * 100).toFixed(1) : 0}%)
                </span>
              </div>
              <div className="w-full h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#B91C1C] rounded-full transition-all"
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
              <PieChart className="w-5 h-5 text-[#2563EB]" />
              <h3 className="text-base font-bold text-[#172554]">Subscriber Lifecycle & Churn</h3>
            </div>
            <span className="text-xs font-bold text-[#1D4ED8] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              Gross Churn Rate: {analytics.churnRate}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3.5 pt-1">
            <div className="p-4 bg-[#FAFBFD] border border-[#E2E7EF] rounded-xl">
              <div className="flex items-center gap-2 text-xs text-[#15803D] font-bold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                Active Contracts
              </div>
              <div className="text-2xl font-extrabold text-[#172554]">{analytics.activeSubscriptions}</div>
              <div className="text-[11px] text-[#596579] mt-0.5">Generating live recurring MRR</div>
            </div>

            <div className="p-4 bg-[#FAFBFD] border border-[#E2E7EF] rounded-xl">
              <div className="flex items-center gap-2 text-xs text-[#B45309] font-bold mb-1">
                <Clock className="w-4 h-4" />
                Paused Contracts
              </div>
              <div className="text-2xl font-extrabold text-[#172554]">{analytics.pausedSubscriptions}</div>
              <div className="text-[11px] text-[#596579] mt-0.5">Fair billing pause applied</div>
            </div>

            <div className="p-4 bg-[#FAFBFD] border border-[#E2E7EF] rounded-xl">
              <div className="flex items-center gap-2 text-xs text-[#596579] font-bold mb-1">
                <XCircle className="w-4 h-4" />
                Closed Contracts
              </div>
              <div className="text-2xl font-extrabold text-[#172554]">{analytics.closedSubscriptions}</div>
              <div className="text-[11px] text-[#596579] mt-0.5">Completed or churned</div>
            </div>

            <div className="p-4 bg-[#FAFBFD] border border-[#E2E7EF] rounded-xl">
              <div className="flex items-center gap-2 text-xs text-[#1D4ED8] font-bold mb-1">
                <Layers className="w-4 h-4" />
                Draft Contracts
              </div>
              <div className="text-2xl font-extrabold text-[#172554]">{analytics.draftSubscriptions}</div>
              <div className="text-[11px] text-[#596579] mt-0.5">Pending onboarding activation</div>
            </div>
          </div>

          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-[#1E40AF] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 shrink-0 text-[#2563EB]" />
            <span>
              Net subscriber retention is healthy with {analytics.activeSubscriptions} active billing contracts.
            </span>
          </div>
        </div>
      </div>

      {/* Row 3: Live Financial Audit Activity Streams */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Latest Invoices */}
        <div className="card-surface p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#596579] flex items-center gap-1.5 border-b border-[#E2E7EF] pb-2.5">
            <Receipt className="w-4 h-4 text-[#2563EB]" />
            Recent Billing Invoices
          </h3>
          <div className="space-y-2">
            {analytics.recentActivity.invoices.length === 0 ? (
              <p className="text-xs text-[#6B7280] py-6 text-center">No recent invoices recorded.</p>
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
                    <div className="text-[10px] font-bold text-[#2563EB]">{inv.status}</div>
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
            Recent Collections
          </h3>
          <div className="space-y-2">
            {analytics.recentActivity.payments.length === 0 ? (
              <p className="text-xs text-[#6B7280] py-6 text-center">No recent payments recorded.</p>
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
                    <div className="text-[10px] font-semibold text-[#596579]">{p.method}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Latest Subscriptions */}
        <div className="card-surface p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#596579] flex items-center gap-1.5 border-b border-[#E2E7EF] pb-2.5">
            <Layers className="w-4 h-4 text-[#7C3AED]" />
            Active Subscriptions
          </h3>
          <div className="space-y-2">
            {analytics.recentActivity.subscriptions.length === 0 ? (
              <p className="text-xs text-[#6B7280] py-6 text-center">No subscriptions recorded.</p>
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
