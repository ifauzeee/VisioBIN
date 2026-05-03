"use client";
import TeamView from "../../components/TeamView";
import { motion } from "framer-motion";
export default function TeamPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <TeamView />
    </motion.div>
  );
}
