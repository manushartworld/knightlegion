import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import TopNav from "./TopNav";
import Sidebar from "./Sidebar";
import { Toaster } from "sonner";

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="min-h-screen bg-[#0b0b10] text-slate-200">
      <TopNav />
      <div className="flex">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
      <Toaster richColors theme="dark" position="top-right" />
    </div>
  );
}
