import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "../components/layout/AppSidebar";
import { Topbar } from "../components/layout/Topbar";
import { cn } from "../utils/cn";

export const AdminLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FCFCFA] text-[#202938] flex flex-col antialiased">
      {/* Role-Aware Sidebar */}
      <AppSidebar
        role="ADMIN"
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          isCollapsed ? "md:pl-18" : "md:pl-64"
        )}
      >
        {/* Topbar */}
        <Topbar onOpenMobileMenu={() => setIsMobileOpen(true)} />

        {/* Dynamic Route Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
