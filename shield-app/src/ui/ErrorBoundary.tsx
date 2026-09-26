import { Component, ReactNode, ErrorInfo } from 'react';
import { InteractiveCadFallback } from '../three/InteractiveCadFallback';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackComponent?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('SHIELD Error Boundary caught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      const isWebGLError = this.state.error?.message?.toLowerCase().includes('webgl') ||
                           this.state.error?.message?.toLowerCase().includes('context');

      if (isWebGLError) {
        return <InteractiveCadFallback />;
      }

      return (
        <div
          style={{
            padding: 24,
            margin: 16,
            background: 'var(--bg2, #141c24)',
            border: '1px solid var(--amber, #f2b94e)',
            borderRadius: 8,
            color: 'var(--text, #e6edf2)',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--amber, #f2b94e)', marginBottom: 8 }}>
            ⚠ {this.props.fallbackTitle ?? 'Viewport Error Occurred'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted, #8fa2b5)', marginBottom: 12 }}>
            {this.state.error?.message ?? 'An unexpected error occurred while rendering the workspace view.'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: 12,
                cursor: 'pointer',
                background: 'var(--cyan, #38d9cf)',
                color: '#0a1014',
                border: 'none',
                borderRadius: 4,
                fontWeight: 600,
              }}
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              ⟲ Reload Viewport
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
