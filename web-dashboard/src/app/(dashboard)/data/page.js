"use client";
import DataManagementView from "../../components/DataManagementView";
import { motion } from "framer-motion";
export default function DataPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <DataManagementView />
    </motion.div>
  );
}
