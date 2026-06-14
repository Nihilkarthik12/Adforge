"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
            <h1 className="text-xl font-bold text-slate-900">Something went wrong</h1>
            <p className="max-w-md text-sm text-slate-500">
              {this.state.error.message}
            </p>
            <button
              onClick={() => this.setState({ error: null })}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Try again
            </button>
          </main>
        )
      );
    }
    return this.props.children;
  }
}
