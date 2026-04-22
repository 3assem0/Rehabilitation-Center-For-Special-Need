import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const isFirestoreError =
        this.state.error?.message?.includes("FIRESTORE") ||
        this.state.error?.message?.includes("INTERNAL ASSERTION");

      return (
        <div className="min-h-screen flex items-center justify-center bg-bg p-8">
          <div className="card max-w-lg w-full text-center shadow-2xl">
            <div className="w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-6 text-danger">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>

            <h1 className="text-2xl font-bold text-primary mb-3">
              حدث خطأ في النظام
            </h1>

            <p className="text-text-muted mb-2 text-sm leading-relaxed">
              {isFirestoreError
                ? "انقطع الاتصال بقاعدة البيانات. اضغط على «إعادة المحاولة» لاستئناف العمل."
                : "واجه النظام مشكلة تقنية. يرجى المحاولة مجدداً."}
            </p>

            <div className="flex gap-3 justify-center mt-8">
              <button
                onClick={this.handleReset}
                className="btn btn-primary px-8"
              >
                إعادة المحاولة
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-secondary px-8"
              >
                تحديث الصفحة
              </button>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-text-muted cursor-pointer mb-2">تفاصيل تقنية (للمطور)</summary>
                <div className="bg-bg/50 p-4 rounded-lg text-xs font-mono overflow-auto max-h-40 border border-border text-danger">
                  {this.state.error.toString()}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

