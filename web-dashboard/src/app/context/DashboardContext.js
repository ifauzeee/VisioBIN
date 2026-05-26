"use client";

import React, { createContext, useContext, useState } from "react";
import { useDashboard } from "../hooks/useDashboard";
import { useAlerts } from "../hooks/useAlerts";
import { useAuth } from "../hooks/useAuth";

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  
  const dashboardState = useDashboard(isAuthenticated ? token : null);
  const alertData = useAlerts(isAuthenticated ? token : null);

  const [searchQuery, setSearchQuery] = useState("");

  return (
    <DashboardContext.Provider value={{ ...dashboardState, ...alertData, searchQuery, setSearchQuery }}>
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
