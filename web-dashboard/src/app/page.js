"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./hooks/useAuth";
import LoginScreen from "./components/LoginScreen";

export default function RootPage() {
  const { mounted, isAuthenticated, isCheckingAuth, login, guestLogin } = useAuth();
  const router = useRouter();
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
    error: "",
    loading: false,
  });

  useEffect(() => {
    if (mounted && !isCheckingAuth && isAuthenticated) {
      router.push("/ringkasan");
    }
  }, [mounted, isCheckingAuth, isAuthenticated, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginForm((p) => ({ ...p, loading: true, error: "" }));
    const result = await login(loginForm.username, loginForm.password);
    if (!result.success) {
      setLoginForm((p) => ({ ...p, error: result.error }));
    }
    setLoginForm((p) => ({ ...p, loading: false }));
  };

  const handleGuestLogin = async () => {
    setLoginForm((p) => ({ ...p, loading: true, error: "" }));
    const result = await guestLogin();
    if (!result.success) {
      setLoginForm((p) => ({ ...p, error: result.error }));
    }
    setLoginForm((p) => ({ ...p, loading: false }));
  };

  if (!mounted || isCheckingAuth) return null;
  
  if (isAuthenticated) return null; // Will redirect via useEffect

  return (
    <LoginScreen
      loginForm={loginForm}
      setLoginForm={setLoginForm}
      handleLogin={handleLogin}
      handleGuestLogin={handleGuestLogin}
    />
  );
}