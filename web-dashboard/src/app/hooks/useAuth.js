"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { login as apiLogin, loginGuest as apiLoginGuest, updateProfile as apiUpdateProfile } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    setMounted(true);
    const storedAuth = window.localStorage.getItem("visiobin_auth");
    const storedToken = window.localStorage.getItem("visiobin_token");
    const storedUser = window.localStorage.getItem("visiobin_user");

    if (storedAuth === "true" && storedToken) {
      setIsAuthenticated(true);
      setToken(storedToken);
      if (storedUser) {
        try { setUser(JSON.parse(storedUser)); } catch {}
      }
    }
    setIsCheckingAuth(false);
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      const res = await apiLogin(username, password);
      if (res.success) {
        const { token: t, user: u } = res.data;
        localStorage.setItem("visiobin_auth", "true");
        localStorage.setItem("visiobin_token", t);
        localStorage.setItem("visiobin_user", JSON.stringify(u));
        setToken(t);
        setUser(u);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, error: "Kredensial tidak valid." };
    } catch (err) {
      if (err.status === 401) {
        return { success: false, error: "Username atau password salah." };
      }
      if (err.status === 403) {
        return { success: false, error: "Akun Anda tidak memiliki akses." };
      }
      return {
        success: false,
        error: "Gagal menghubungkan ke server. Silakan periksa koneksi Anda.",
      };
    }
  }, []);

  const guestLogin = useCallback(async () => {
    try {
      const res = await apiLoginGuest();
      if (res.success) {
        const { token: t, user: u } = res.data;
        localStorage.setItem("visiobin_auth", "true");
        localStorage.setItem("visiobin_token", t);
        localStorage.setItem("visiobin_user", JSON.stringify(u));
        setToken(t);
        setUser(u);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, error: "Gagal masuk sebagai tamu." };
    } catch (err) {
      return {
        success: false,
        error: "Gagal menghubungkan ke server. Silakan periksa koneksi Anda.",
      };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("visiobin_auth");
    localStorage.removeItem("visiobin_token");
    localStorage.removeItem("visiobin_user");
    setIsAuthenticated(false);
    setToken("");
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (payload) => {
    try {
      const res = await apiUpdateProfile(token, payload);
      if (res.success) {
        const u = res.data;
        localStorage.setItem("visiobin_user", JSON.stringify(u));
        setUser(u);
        return { success: true };
      }
      return { success: false, error: res.message || "Gagal memperbarui profil." };
    } catch (err) {
      return {
        success: false,
        error: err.message || "Gagal menghubungkan ke server. Silakan periksa koneksi Anda.",
      };
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        mounted,
        isAuthenticated,
        isCheckingAuth,
        token,
        user,
        login,
        guestLogin,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
