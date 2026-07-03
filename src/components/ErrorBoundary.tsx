'use client';

import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-md mx-auto mt-20 text-center px-6">
          <div
            className="text-4xl mb-4"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink)' }}
          >
            Oops
          </div>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
            Something went wrong. Please refresh the page.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="cursor-pointer text-xs tracking-[0.18em] font-medium px-[22px] py-[13px] hover:opacity-85"
            style={{ background: 'var(--ink)', color: 'var(--bg)', border: 'none', transition: 'opacity 0.2s ease' }}
          >
            Refresh
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
