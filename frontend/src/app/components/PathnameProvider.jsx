"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";

import Loader from "@/components/ui/loader";

// This component safely accesses pathname inside a Suspense boundary
function PathnameReader({ children }) {
  const pathname = usePathname();
  return children(pathname);
}

// Wrapper component that provides pathname with proper Suspense boundary
export default function PathnameProvider({ children }) {
  return (
    <Suspense
      fallback={
        <div>
          <Loader />
        </div>
      }
    >
      <PathnameReader>{(pathname) => children(pathname)}</PathnameReader>
    </Suspense>
  );
}
