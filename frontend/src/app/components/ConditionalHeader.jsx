"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

// List of routes where the header should not be shown
const noHeaderRoutes = [
  "/user-login",
  "/user-register",
  "/forgot-password",
];

export default function ConditionalHeader() {
  const pathname = usePathname();
  
  // Check if the current path is in the list of routes where header should not be shown
  const shouldShowHeader = !noHeaderRoutes.some(route => pathname.startsWith(route));
  
  // Only render the header if it should be shown
  return shouldShowHeader ? <Header /> : null;
}
