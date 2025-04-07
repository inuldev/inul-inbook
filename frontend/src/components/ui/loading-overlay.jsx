import React from "react";
import { Spinner } from "./spinner";

export const LoadingOverlay = ({ message = "Loading..." }) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
      <Spinner size="xl" className="text-primary" />
      <p className="mt-4 text-lg font-medium text-foreground">{message}</p>
    </div>
  );
};
