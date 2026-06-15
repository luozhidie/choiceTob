import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("[ErrorBoundary] 捕获到错误:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4a9.56 9.56 0 0 1 0 11.876 0A9.513 9.513 0 0 1 0 2.062 15.917zm10.876 0A9.513 9.513 0 0 0 2.062 15.917 15.828 15.828 0 0 0 19.938 4.517z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">页面出现错误</h3>
            <p className="text-sm text-gray-500 mb-4">
              {this.state.error?.message || "未知错误，请刷新页面重试"}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.reload();
              }}
              className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90"
            >
              刷新页面
            </button>
            <pre className="mt-4 text-xs text-left text-gray-400 bg-gray-50 rounded-lg p-3 overflow-auto max-h-32">
              {this.state.error?.stack?.slice(0, 500)}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
