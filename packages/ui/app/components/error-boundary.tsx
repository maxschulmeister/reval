"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { H3, P } from "./ui/typography";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] items-center justify-center p-8">
          <Card className="max-w-md p-6 text-center">
            <H3 className="mb-4 text-destructive">Something went wrong</H3>
            <P className="mb-6 text-muted-foreground">
              {this.state.error?.message || "An unexpected error occurred"}
            </P>
            <Button onClick={this.handleReset} variant="outline">
              Try again
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}