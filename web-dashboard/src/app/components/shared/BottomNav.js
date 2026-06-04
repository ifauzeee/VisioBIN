"use client";

import React from "react";
import { SquareTerminal, Activity, MapPin, Bell, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from 'next-intl';
import { useDashboardContext } from "../../context/DashboardContext";

export default function BottomNav() {
  const t = useTranslations('common');
  const pathname = usePathname();
  const { unreadCount } = useDashboardContext();

  const items = [
    { key: "ringkasan", label: t('dashboard'), icon: SquareTerminal, href: "/ringkasan" },
    { key: "pemantauan", label: t('monitoring'), icon: Activity, href: "/pemantauan" },
    { key: "map", label: t('map'), icon: MapPin, href: "/map" },
    { key: "profile", label: t('profile'), icon: User, href: "/profile" },
  ];

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        const isAlert = item.key === "alert";

        return (
          <Link
            key={item.key}
            href={item.href}
            className={`bottom-nav-item ${isActive ? "active" : ""}`}
          >
            <div className="bottom-nav-icon-wrapper">
              <Icon size={20} />
              {isAlert && unreadCount > 0 && (
                <span className="bottom-nav-badge">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            <span className="bottom-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
