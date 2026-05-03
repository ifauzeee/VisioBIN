"use client";
import StasiunBinView from "../../components/StasiunBinView";
import { motion } from "framer-motion";
export default function StasiunPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <StasiunBinView />
    </motion.div>
  );
}
