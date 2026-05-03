"use client";

import React from "react";
import PemantauanView from "../../components/PemantauanView";
import { motion } from "framer-motion";

export default function PemantauanPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <PemantauanView />
    </motion.div>
  );
}
