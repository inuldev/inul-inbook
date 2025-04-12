"use client";

import Header from "./Header";
import PathnameProvider from "./PathnameProvider";

// List of routes where the header should not be shown
const noHeaderRoutes = ["/user-login", "/user-register", "/forgot-password"];

// Inner component that receives pathname safely
function ConditionalHeaderInner({ pathname }) {
  // Check if the current path is in the list of routes where header should not be shown
  const shouldShowHeader = !noHeaderRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Only render the header if it should be shown
  return shouldShowHeader ? <Header /> : null;
}

// Main component that wraps the inner component with PathnameProvider
export default function ConditionalHeader() {
  return (
    <PathnameProvider>
      {(pathname) => <ConditionalHeaderInner pathname={pathname} />}
    </PathnameProvider>
  );
}
