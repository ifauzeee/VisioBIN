"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useTranslations } from "next-intl";
import {
  SquareTerminal, Activity, MapPin, Bell, User,
  FileText, Settings, BarChart3, Wrench, HelpCircle,
  Search, RefreshCw, CheckCheck
} from "lucide-react";
import { useDashboardContext } from "../../context/DashboardContext";

const PAGES = [
  { id: "ringkasan", label: "Dashboard", icon: SquareTerminal, href: "/ringkasan" },
  { id: "pemantauan", label: "Live Monitoring", icon: Activity, href: "/pemantauan" },
  { id: "analitik", label: "Analytics", icon: BarChart3, href: "/analitik" },
  { id: "map", label: "Map", icon: MapPin, href: "/map" },
  { id: "laporan", label: "Reports", icon: FileText, href: "/laporan" },
  { id: "data", label: "Data Exploration", icon: Search, href: "/data" },
  { id: "maint", label: "Maintenance", icon: Wrench, href: "/maint" },
  { id: "config", label: "Configuration", icon: Settings, href: "/config" },
  { id: "help", label: "Help", icon: HelpCircle, href: "/help" },
  { id: "notifications", label: "Notifications", icon: Bell, href: "/profile" },
  { id: "profile", label: "Profile", icon: User, href: "/profile" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const t = useTranslations("common");
  const { refetch, alertRefetch, markAllRead } = useDashboardContext();

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const runAction = useCallback(
    (action) => {
      setOpen(false);
      if (action.href) {
        router.push(action.href);
      } else if (action.type === "action") {
        action.handler();
      }
    },
    [router]
  );

  return (
    <>
      {/* Invisible trigger area for styling */}
      <style jsx global>{`
        [cmdk-root] {
          position: fixed;
          top: 20%;
          left: 50%;
          transform: translateX(-50%);
          width: 520px;
          max-width: 90vw;
          max-height: 400px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
          z-index: 9999;
          overflow: hidden;
          font-family: inherit;
        }
        [cmdk-overlay] {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 9998;
        }
        [cmdk-input] {
          width: 100%;
          border: none;
          border-bottom: 1px solid var(--border-color);
          background: transparent;
          padding: 16px 20px;
          font-size: 15px;
          color: var(--text-main);
          outline: none;
          font-family: inherit;
        }
        [cmdk-input]::placeholder {
          color: var(--text-muted);
        }
        [cmdk-list] {
          max-height: 300px;
          overflow-y: auto;
          padding: 8px;
        }
        [cmdk-item] {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 14px;
          color: var(--text-main);
          cursor: pointer;
          transition: background 0.1s;
          position: relative;
        }
        [cmdk-item][data-selected="true"] {
          background: var(--bg-hover);
        }
        [cmdk-item][data-disabled="true"] {
          color: var(--text-muted);
          cursor: not-allowed;
        }
        [cmdk-group-heading] {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-muted);
          padding: 8px 12px 4px;
        }
        [cmdk-empty] {
          padding: 32px;
          text-align: center;
          color: var(--text-muted);
          font-size: 13px;
        }
        .cmd-shortcut {
          margin-left: auto;
          font-size: 10px;
          color: var(--text-muted);
          background: var(--bg-hover);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: inherit;
        }
      `}</style>

      {open && (
        <>
          <div cmdk-overlay="" onClick={() => setOpen(false)} />
          <Command label="Command Palette">
            <Command.Input placeholder={t("search") || "Search pages, bins, actions..."} />
            <Command.List>
              <Command.Empty>No results found.</Command.Empty>

              <Command.Group heading="Pages">
                {PAGES.map((page) => (
                  <Command.Item
                    key={page.id}
                    onSelect={() => runAction(page)}
                  >
                    <page.icon size={16} />
                    {page.label}
                    <span className="cmd-shortcut">{page.id}</span>
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Group heading="Actions">
                <Command.Item
                  onSelect={() => {
                    runAction({ type: "action", handler: () => { refetch(); } });
                  }}
                >
                  <RefreshCw size={16} />
                  Refresh Dashboard Data
                </Command.Item>
                <Command.Item
                  onSelect={() => {
                    runAction({ type: "action", handler: () => { alertRefetch(); } });
                  }}
                >
                  <Bell size={16} />
                  Refresh Alerts
                </Command.Item>
                <Command.Item
                  onSelect={() => {
                    runAction({ type: "action", handler: () => { markAllRead?.(); } });
                  }}
                >
                  <CheckCheck size={16} />
                  Mark All Alerts Read
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </>
      )}
    </>
  );
}
