"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || "Beklenmeyen bir arayüz hatası oluştu.",
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("UI Error:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <Alert variant="destructive" className="m-4">
            <AlertTitle>Bir şeyler ters gitti</AlertTitle>
            <AlertDescription>{this.state.message}</AlertDescription>
          </Alert>
        )
      );
    }

    return this.props.children;
  }
}
