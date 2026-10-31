import React from "react";
import { NavLink } from "react-router-dom";
import {
  TrendingUp,
  Users,
  Package,
  Layers,
  FileText,
  ShieldAlert,
  CreditCard,
  Percent,
  Tag,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building,
  UserCheck,
} from "lucide-react";
import { cn } from "../../utils/cn";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface AppSidebarProps {
  role: "ADMIN" | "STAFF" | "CUSTOMER";
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  role,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  // Navigation structure based on role
  const getNavGroups = (): NavGroup[] => {
    if (role === "ADMIN") {
      return [
        {
          title: "Overview",
          items: [
            { id: "dashboard", label: "Dashboard", href: "/admin/dashboard", icon: TrendingUp },
          ],
        },
        {
          title: "Business",
          items: [
            { id: "customers", label: "Customers", href: "/admin/customers", icon: Building },
            { id: "products", label: "Products", href: "/admin/products", icon: Package },
            { id: "plans", label: "Plans", href: "/admin/plans", icon: Layers },
            { id: "quotations", label: "Quotations", href: "/admin/quotations", icon: FileText },
            {
              id: "subscriptions",
              label: "Subscriptions",
              href: "/admin/subscriptions",
              icon: ShieldAlert,
            },
          ],
        },
        {
          title: "Finance",
          items: [
            { id: "invoices", label: "Invoices", href: "/admin/invoices", icon: FileText },
            { id: "payments", label: "Payments", href: "/admin/payments", icon: CreditCard },
            { id: "discounts", label: "Discounts", href: "/admin/discounts", icon: Tag },
            { id: "taxes", label: "Taxes", href: "/admin/taxes", icon: Percent },
            { id: "reports", label: "Reports", href: "/admin/reports", icon: BarChart3 },
          ],
        },
        {
          title: "Administration",
          items: [
            {
              id: "staff",
              label: "Staff Management",
              href: "/admin/staff",
              icon: Users,
            },
            { id: "settings", label: "Settings", href: "/admin/settings", icon: Settings },
          ],
        },
      ];
    }

    if (role === "STAFF") {
      return [
        {
          title: "Overview",
          items: [
            { id: "dashboard", label: "Dashboard", href: "/staff/dashboard", icon: TrendingUp },
          ],
        },
        {
          title: "Business",
          items: [
            { id: "customers", label: "Customers", href: "/staff/customers", icon: Building },
            { id: "quotations", label: "Quotations", href: "/staff/quotations", icon: FileText },
            {
              id: "subscriptions",
              label: "Subscriptions",
              href: "/staff/subscriptions",
              icon: ShieldAlert,
            },
          ],
        },
        {
          title: "Finance",
          items: [
            { id: "invoices", label: "Invoices", href: "/staff/invoices", icon: FileText },
            { id: "payments", label: "Payments", href: "/staff/payments", icon: CreditCard },
          ],
        },
      ];
    }

    // CUSTOMER PORTAL
    return [
      {
        title: "Overview",
        items: [
          { id: "overview", label: "Overview", href: "/portal/overview", icon: TrendingUp },
        ],
      },
      {
        title: "Commercial",
        items: [
          {
            id: "quotations",
            label: "Proposals & Quotes",
            href: "/portal/quotations",
            icon: FileText,
          },
        ],
      },
      {
        title: "Contracts",
        items: [
          {
            id: "subscriptions",
            label: "My Subscriptions",
            href: "/portal/subscriptions",
            icon: ShieldAlert,
          },
        ],
      },
      {
        title: "Billing",
        items: [
          { id: "invoices", label: "My Invoices", href: "/portal/invoices", icon: FileText },
          {
            id: "payments",
            label: "Payment History",
            href: "/portal/payments",
            icon: CreditCard,
          },
          { id: "profile", label: "My Profile", href: "/portal/profile", icon: UserCheck },
        ],
      },
    ];
  };

  const navGroups = getNavGroups();

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-[#E8EAF0] flex flex-col transition-all duration-300 ease-in-out",
          // Width based on collapsed state on desktop
          isCollapsed ? "md:w-18" : "md:w-64",
          // Mobile responsive drawer translation
          isMobileOpen
            ? "translate-x-0 w-64 shadow-2xl"
            : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Brand & Workspace Indicator */}
        <div className="h-16 px-4 border-b border-[#E8EAF0] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 rounded-xl bg-[#172554] flex items-center justify-center font-bold text-white shadow-sm shrink-0">
              <span className="text-sm tracking-tight text-white font-extrabold">BL</span>
            </div>
            {!isCollapsed && (
              <div className="leading-none overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight text-[#202938]">BrightLoop</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#EEF4FF] text-[#4169E1]">
                    {role}
                  </span>
                </div>
                <p className="text-[11px] text-[#758096] truncate mt-1">Acme Workspace</p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg text-[#758096] hover:text-[#202938] hover:bg-[#F4F5F7] transition cursor-pointer"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Group Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!isCollapsed ? (
                <div className="px-3 pb-1 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                  {group.title}
                </div>
              ) : (
                <div className="h-2" />
              )}

              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.id}
                    to={item.href}
                    onClick={() => onCloseMobile?.()}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer",
                        isActive
                          ? "bg-[#EEF4FF] text-[#4169E1] font-semibold shadow-xs"
                          : "text-[#758096] hover:text-[#202938] hover:bg-[#F4F5F7]",
                        isCollapsed && "justify-center px-2"
                      )
                    }
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0 transition-colors" />

                    {!isCollapsed && <span className="truncate">{item.label}</span>}

                    {!isCollapsed && item.badge && (
                      <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F4F5F7] text-[#758096]">
                        {item.badge}
                      </span>
                    )}

                    {/* Tooltip in collapsed mode */}
                    {isCollapsed && (
                      <span className="absolute left-full ml-2 px-2.5 py-1 bg-[#172554] text-white text-[11px] font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50 whitespace-nowrap">
                        {item.label}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer (Status / Help) */}
        <div className="p-3 border-t border-[#E8EAF0] bg-[#FAFBFD] shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center justify-between text-xs text-[#758096] px-2 py-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#16A36A]" />
                <span className="text-[11px] font-medium text-[#202938]">Platform Live</span>
              </div>
              <span className="text-[10px] font-mono text-[#9CA3AF]">v1.0.0</span>
            </div>
          ) : (
            <div className="flex justify-center py-1" title="Platform Live">
              <span className="h-2 w-2 rounded-full bg-[#16A36A]" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
