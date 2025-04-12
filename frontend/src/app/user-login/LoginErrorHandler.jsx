"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearAuthData } from "@/lib/authUtils";

const LoginErrorHandler = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(null);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    // Check for error in URL parameters
    const errorParam = searchParams.get('error');
    const errorMessage = searchParams.get('message');
    
    if (errorParam) {
      setError({
        type: errorParam,
        message: errorMessage || 'An authentication error occurred'
      });
      setShowAlert(true);
      
      // Clear any invalid auth data
      if (typeof window !== 'undefined') {
        clearAuthData();
      }
    }
    
    // Check for localStorage error
    const storedError = localStorage.getItem('auth_error');
    if (storedError) {
      try {
        const parsedError = JSON.parse(storedError);
        setError(parsedError);
        setShowAlert(true);
        localStorage.removeItem('auth_error');
      } catch (e) {
        console.error('Error parsing stored auth error:', e);
        localStorage.removeItem('auth_error');
      }
    }
  }, [searchParams]);

  const handleDismiss = () => {
    setShowAlert(false);
    
    // Remove error from URL if present
    if (searchParams.has('error')) {
      const newUrl = window.location.pathname;
      router.replace(newUrl);
    }
  };

  if (!showAlert || !error) return null;

  return (
    <Alert variant="destructive" className="mb-6 relative">
      <AlertCircle className="h-4 w-4 mr-2" />
      <AlertTitle>Authentication Error</AlertTitle>
      <AlertDescription>
        {error.message || 'There was a problem with your authentication. Please try logging in again.'}
      </AlertDescription>
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-2 right-2"
        onClick={handleDismiss}
      >
        <XCircle className="h-4 w-4" />
      </Button>
    </Alert>
  );
};

export default LoginErrorHandler;
