import React, { useState, useRef, useEffect } from "react";
import {
  Menu,
  Bell,
  HelpCircle,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Breadcrumbs } from "./Breadcrumbs";
import { SearchInput } from "../ui/SearchInput";
import { cn } from "../../utils/cn";

export interface TopbarProps {
  onOpenMobileMenu: () => void;
  className?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileMenu, className }) => {
  const { user, logout } = useAuth();
  const [searchVal, setSearchVal] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Compute user initials
  const initials = (user?.name || "BL")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <header
        className={cn(
          "h-16 bg-white border-b border-[#E8EAF0] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-all",
          className
        )}
      >
        {/* Left: Mobile Toggle & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-xl text-[#758096] hover:text-[#202938] hover:bg-[#F4F5F7] transition cursor-pointer"
            title="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Breadcrumbs />
        </div>

        {/* Right: Search, Notifications, Help & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Search */}
          <div className="hidden lg:block w-56">
            <SearchInput
              value={searchVal}
              onChange={setSearchVal}
              placeholder="Search platform..."
              shortcut="⌘K"
            />
          </div>

          {/* Notifications Popover */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl text-[#758096] hover:text-[#202938] hover:bg-[#F4F5F7] transition relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#4169E1] ring-2 ring-white" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-[#E8EAF0] shadow-xl z-50 py-3 divide-y divide-[#F0F2F6] animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 pb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#202938]">System Activity</span>
                  <span className="text-[10px] text-[#4169E1] font-semibold cursor-pointer hover:underline">
                    Mark all read
                  </span>
                </div>
                <div className="py-1 max-h-64 overflow-y-auto divide-y divide-[#F8F9FA]">
                  {[
                    {
                      title: "Recurring Billing Cycle Executed",
                      desc: "Automated billing runner completed with 0 errors.",
                      time: "10m ago",
                      read: false,
                    },
                    {
                      title: "Quotation Accepted",
                      desc: "Acme Corp accepted proposal QT-202610-0001.",
                      time: "1h ago",
                      read: false,
                    },
                    {
                      title: "Payment Allocated",
                      desc: "₹20,000 lump sum allocated across 2 invoices.",
                      time: "3h ago",
                      read: true,
                    },
                  ].map((notif, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "px-4 py-2.5 text-xs hover:bg-[#FAFBFD] transition-colors cursor-pointer",
                        !notif.read && "bg-[#F9FAFC]"
                      )}
                    >
                      <div className="flex items-center justify-between font-semibold text-[#202938]">
                        <span className="truncate pr-2">{notif.title}</span>
                        <span className="text-[10px] font-normal text-[#9CA3AF] shrink-0">
                          {notif.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#758096] mt-0.5">{notif.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Help Modal Trigger */}
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="p-2 rounded-xl text-[#758096] hover:text-[#202938] hover:bg-[#F4F5F7] transition cursor-pointer"
            title="Help & Documentation"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          {/* User Profile Menu */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 pl-2 pr-1.5 py-1 rounded-xl hover:bg-[#F4F5F7] transition cursor-pointer border border-transparent hover:border-[#E8EAF0]"
            >
              <div className="h-8 w-8 rounded-lg bg-[#EEF4FF] text-[#4169E1] font-bold text-xs flex items-center justify-center border border-[#D4E3FF] shrink-0">
                {initials}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <div className="text-xs font-semibold text-[#202938] truncate max-w-[120px]">
                  {user?.name || "User"}
                </div>
                <div className="text-[10px] text-[#758096] capitalize">{user?.role?.toLowerCase()}</div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-[#758096] ml-0.5" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[#E8EAF0] shadow-xl z-50 py-1 divide-y divide-[#F0F2F6] animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2.5">
                  <p className="text-xs font-semibold text-[#202938]">{user?.name}</p>
                  <p className="text-[11px] text-[#758096] truncate">{user?.email}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-[#EEF4FF] text-[#4169E1]">
                    {user?.role}
                  </span>
                </div>

                <div className="p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowHelpModal(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#202938] hover:bg-[#F4F5F7] rounded-xl transition cursor-pointer text-left"
                  >
                    <HelpCircle className="h-4 w-4 text-[#758096]" />
                    Documentation & Tips
                  </button>
                </div>

                <div className="p-1">
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#DC5353] hover:bg-[#FDEEEE] rounded-xl transition cursor-pointer text-left"
                  >
                    <LogOut className="h-4 w-4 text-[#DC5353]" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-[#E8EAF0] shadow-2xl p-6 overflow-hidden">
            <div className="flex items-start justify-between pb-4 border-b border-[#F0F2F6]">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-[#EEF4FF] text-[#4169E1] flex items-center justify-center font-bold">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#202938]">BrightLoop Help & Guides</h3>
                  <p className="text-xs text-[#758096]">Platform quick references and shortcuts</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-[#9CA3AF] hover:text-[#202938] text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs text-[#202938]">
              <div className="p-3 rounded-xl bg-[#FAFBFD] border border-[#E8EAF0] space-y-1">
                <div className="font-semibold text-[#172554]">Deterministic Quotation Pipeline</div>
                <p className="text-[#758096] text-[11px]">
                  Draft proposals with agreed line-item pricing snapshots. When accepted, 1-click conversion creates active contracts with exact prices.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#FAFBFD] border border-[#E8EAF0] space-y-1">
                <div className="font-semibold text-[#172554]">M:N Multi-Invoice Payment Allocation</div>
                <p className="text-[#758096] text-[11px]">
                  Record lump-sum incoming wire/cash payments and split allocations across multiple unpaid invoices. Excess remains tracked as unallocated float.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#FAFBFD] border border-[#E8EAF0] space-y-1">
                <div className="font-semibold text-[#172554]">Idempotent Recurring Billing Runner</div>
                <p className="text-[#758096] text-[11px]">
                  Scheduled periods automatically advance next billing dates and prevent duplicate charges via database unique constraints.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#F0F2F6] flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#4169E1] hover:bg-[#3055C4] rounded-xl transition cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
