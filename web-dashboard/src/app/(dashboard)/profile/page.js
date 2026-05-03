"use client";

import React from "react";
import ProfileView from "../../components/ProfileView";
import { motion } from "framer-motion";

export default function ProfilePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <ProfileView />
    </motion.div>
  );
}
