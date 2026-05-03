"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useDashboardContext } from "../../context/DashboardContext";
import { motion } from "framer-motion";

const PetaView = dynamic(() => import("../../components/PetaView"), { ssr: false });

export default function MapPage() {
  const { bins } = useDashboardContext();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ height: 'calc(100vh - 250px)' }}
    >
      <PetaView bins={bins} />
    </motion.div>
  );
}
