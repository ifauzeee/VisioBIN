"use client";

import React, { createContext, useContext, useState } from "react";
import { useDashboard } from "../hooks/useDashboard";
import { useAlerts } from "../hooks/useAlerts";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  
  const dashboardState = useDashboard(isAuthenticated ? token : null);
  const alertData = useAlerts(isAuthenticated ? token : null);
  useNotifications({ token: isAuthenticated ? token : null, pushEnabled: true });

  const [searchQuery, setSearchQuery] = useState("");

  return (
    <DashboardContext.Provider
      value={{
        ...dashboardState,
        ...alertData,
        loading: dashboardState.loading,
        error: dashboardState.error,
        refetch: dashboardState.refetch,
        dashLoading: dashboardState.loading,
        dashError: dashboardState.error,
        dashRefetch: dashboardState.refetch,
        alertLoading: alertData.loading,
        alertError: alertData.error,
        alertRefetch: alertData.refetch,
        searchQuery,
        setSearchQuery,
      }}
    >
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
