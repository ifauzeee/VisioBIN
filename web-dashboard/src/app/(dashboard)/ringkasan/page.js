"use client";

import React from "react";
import RingkasanView from "../../components/RingkasanView";
import { useDashboardContext } from "../../context/DashboardContext";
import { motion } from "framer-motion";

export default function RingkasanPage() {
  const { summary, binLevel, binLevelOrg, binLevelInorg, vision, logs, forecast, wsActive } = useDashboardContext();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <RingkasanView
        summary={summary}
        binLevel={binLevel}
        binLevelOrg={binLevelOrg}
        binLevelInorg={binLevelInorg}
        vision={vision}
        logs={logs}
        forecast={forecast}
        wsActive={wsActive}
      />
    </motion.div>
  );
}
