"use client";
import LaporanView from "../../components/LaporanView";
import { motion } from "framer-motion";
export default function LaporanPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <LaporanView />
    </motion.div>
  );
}
