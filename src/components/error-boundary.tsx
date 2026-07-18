/**
 * Error Boundary Component
 * Catches and displays React component errors
 */

"use client";

import { Component, type ReactNode } from "react";
import { getErrorInfo } from "@/utils/error-handler";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: unknown) {
    const errorInfoObj = getErrorInfo(error);
    console.error("ErrorBoundary caught an error:", {
      error,
      errorInfo,
      errorInfoObj,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      const errorInfo = getErrorInfo(this.state.error);

      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <h2 className="mb-2 text-xl font-semibold text-red-800">
              Something went wrong
            </h2>
            <p className="mb-4 text-sm text-red-600">{errorInfo.userMessage}</p>
            <button
              onClick={this.handleReset}
              className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
