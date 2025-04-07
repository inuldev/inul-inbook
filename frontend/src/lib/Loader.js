"use client";

import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Loader() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dotVariants = {
    hidden: { opacity: 0.3, scale: 0.5 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: i * 0.2,
        repeat: Infinity,
        repeatType: "reverse",
        duration: 0.6,
      },
    }),
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-background dark:bg-background z-50"
      style={{ position: "fixed", top: 0, left: 0 }}
    >
      <div className="relative w-40 h-40">
        {mounted && (
          <motion.img
            src="/images/logo.png"
            className={`w-full h-full ${theme === "dark" ? "dark:hidden" : ""}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </div>
      <div className="flex space-x-3">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-6 h-6 bg-primary dark:bg-primary rounded-full"
            initial="hidden"
            animate="visible"
            custom={index}
            variants={dotVariants}
          />
        ))}
      </div>
      <motion.div
        className="text-primary dark:text-primary text-3xl mt-4 font-bold tracking-widest"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        Inbook
      </motion.div>
    </div>
  );
}
