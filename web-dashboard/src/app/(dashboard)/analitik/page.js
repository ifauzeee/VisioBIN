"use client";

import React from "react";
import AnalitikView from "../../components/AnalitikView";
import { motion } from "framer-motion";

export default function AnalitikPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <AnalitikView />
    </motion.div>
  );
}
