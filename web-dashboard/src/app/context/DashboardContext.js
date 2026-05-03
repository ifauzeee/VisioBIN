"use client";

import React, { createContext, useContext } from "react";
import { useDashboard } from "../hooks/useDashboard";
import { useAlerts } from "../hooks/useAlerts";
import { useAuth } from "../hooks/useAuth";

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  
  const dashboardData = useDashboard(isAuthenticated ? token : null);
  const alertData = useAlerts(isAuthenticated ? token : null);

  return (
    <DashboardContext.Provider value={{ ...dashboardData, ...alertData }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboardContext must be used within a DashboardProvider");
  }
  return context;
}
