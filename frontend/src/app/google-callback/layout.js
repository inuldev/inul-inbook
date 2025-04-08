"use client";

import React from "react";

export default function GoogleCallbackLayout({ children }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}
