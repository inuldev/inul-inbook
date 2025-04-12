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
      className="flex items-center justify-center w-full h-full"
      style={{ minHeight: "100px" }}
    >
      <div className="flex space-x-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            custom={i}
            variants={dotVariants}
            initial="hidden"
            animate="visible"
            className={`w-3 h-3 rounded-full ${
              mounted && theme === "dark" ? "bg-white" : "bg-gray-800"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
