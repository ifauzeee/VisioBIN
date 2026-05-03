"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { DashboardProvider } from "../context/DashboardContext";
import Sidebar from "../components/shared/Sidebar";
import Header from "../components/shared/Header";
import { useRouter, usePathname } from "next/navigation";

export default function DashboardLayout({ children }) {
  const { mounted, isAuthenticated, isCheckingAuth, logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState("dark");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const savedTheme = localStorage.getItem("visiobin-theme") || "dark";
    setTheme(savedTheme);
    document.body.classList.toggle("light-mode", savedTheme === "light");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("visiobin-theme", newTheme);
    document.body.classList.toggle("light-mode", newTheme === "light");
  };

  // Auth Protection
  useEffect(() => {
    if (mounted && !isCheckingAuth && !isAuthenticated) {
      router.push("/");
    }
  }, [mounted, isCheckingAuth, isAuthenticated, router]);

  // Close mobile sidebar on path change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (!mounted || isCheckingAuth) return null;
  if (!isAuthenticated) return null;

  return (
    <DashboardProvider>
      <div className="app-container">
        {sidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          theme={theme} 
          toggleTheme={toggleTheme}
          user={user}
          logout={logout}
        />

        <main className={`main-content ${pathname === '/map' ? 'no-scroll' : ''}`}>
          <Header setSidebarOpen={setSidebarOpen} />
          {children}
        </main>
      </div>
    </DashboardProvider>
  );
}
