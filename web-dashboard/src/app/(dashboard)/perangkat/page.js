"use client";
import PerangkatView from "../../components/PerangkatView";
import { motion } from "framer-motion";
export default function PerangkatPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <PerangkatView />
    </motion.div>
  );
}
