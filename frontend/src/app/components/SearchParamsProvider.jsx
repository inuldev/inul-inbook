"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

// This component safely accesses search params inside a Suspense boundary
function SearchParamsReader({ children }) {
  const searchParams = useSearchParams();
  return children(searchParams);
}

// Wrapper component that provides search params with proper Suspense boundary
export default function SearchParamsProvider({ children }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchParamsReader>
        {(searchParams) => children(searchParams)}
      </SearchParamsReader>
    </Suspense>
  );
}
