"use client";

import React, { Component } from 'react';
import { Button } from "@/components/ui/button";
import { clearAuthData } from "@/lib/authUtils";
import userStore from "@/store/userStore";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    // Clear auth data and reset state
    if (typeof window !== 'undefined') {
      clearAuthData();
      
      // Reset user store
      userStore.setState({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        token: null,
        tokenFromUrl: null
      });
      
      // Clear cookies
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "auth_status=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "dev_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "auth_token_direct=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
    
    // Reset error state
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // Reload the page
    window.location.href = '/user-login';
  }

  render() {
    if (this.state.hasError) {
      // Check if error is related to authentication
      const isAuthError = 
        this.state.error?.message?.includes('authentication') || 
        this.state.error?.message?.includes('token') ||
        this.state.error?.toString().includes('authentication') ||
        this.state.error?.toString().includes('token');
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-red-600 dark:text-red-400">
              {isAuthError ? 'Authentication Error' : 'Something went wrong'}
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              {isAuthError 
                ? 'There was a problem with your authentication. Please log in again.'
                : 'An unexpected error occurred in the application.'}
            </p>
            {this.state.error && (
              <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded overflow-auto max-h-32">
                <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
            <div className="flex justify-center">
              <Button 
                onClick={this.handleReset}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isAuthError ? 'Go to Login' : 'Try Again'}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
