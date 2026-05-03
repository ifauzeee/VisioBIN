"use client";
import ConfigView from "../../components/ConfigView";
import { motion } from "framer-motion";
export default function ConfigPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <ConfigView />
    </motion.div>
  );
}
