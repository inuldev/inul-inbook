"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";

// This component safely accesses pathname inside a Suspense boundary
function PathnameReader({ children }) {
  const pathname = usePathname();
  
  // Pass the pathname to the children function
  return children(pathname);
}

// Wrapper component that provides pathname with proper Suspense boundary
export default function PathnameProvider({ children }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PathnameReader>
        {(pathname) => children(pathname)}
      </PathnameReader>
    </Suspense>
  );
}
