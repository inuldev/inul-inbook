"use client";

import React from "react";
import LeftSideBar from "../components/LeftSideBar";
import AuthGuard from "../components/AuthGuard";

export default function FriendsListLayout({ children }) {
  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <main className="flex flex-1 pt-16">
          <LeftSideBar />
          <div className="flex-1 px-4 py-6 md:ml-64">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
