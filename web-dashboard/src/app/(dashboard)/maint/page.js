"use client";
import LogPerawatanView from "../../components/LogPerawatanView";
import { motion } from "framer-motion";
export default function MaintPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <LogPerawatanView />
    </motion.div>
  );
}
