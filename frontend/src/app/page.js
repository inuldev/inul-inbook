"use client";

import React from "react";
import HomePage from "./Homepage/page";
import LeftSideBar from "./components/LeftSideBar";
import RightSideBar from "./components/RightSideBar";
import AuthGuard from "./components/AuthGuard";

export default function Home() {
  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <main className="flex flex-1 pt-16">
          <LeftSideBar />
          <div className="flex-1 px-4 py-6 md:ml-64 lg:mr-64 lg:max-w-2xl xl:max-w-3xl mx-auto">
            <div className="lg:ml-2 xl:ml-28">
              <HomePage />
            </div>
          </div>
          <div className="hidden lg:block lg:w-64 xl:w-80 fixed right-0 top-16 bottom-0 overflow-y-auto p-4">
            <RightSideBar />
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
