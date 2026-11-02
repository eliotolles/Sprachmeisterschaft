import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Sprachmeisterschaft ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHardReset = () => {
    try {
      localStorage.removeItem('sprach_sidebar_collapsed');
      localStorage.removeItem('sprach_active_tab');
    } catch (e) {}
    window.location.hash = '#/';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
          <div className="surface max-w-md w-full p-6 sm:p-8 text-center border border-border rounded-sm shadow-xl space-y-4 animate-rise">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 border-2 border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <div className="font-mono text-[10px] tracking-wider uppercase text-amber-600 font-bold">
                KHÔI PHỤC HỆ THỐNG
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Đã xảy ra lỗi hiển thị
              </h2>
              <p className="font-body text-xs text-muted-foreground leading-relaxed pt-1">
                Hệ thống gặp sự cố không mong muốn trong quá trình kết xuất giao diện. Dữ liệu học tập và tài khoản của bạn vẫn được lưu trữ an toàn.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 rounded bg-muted/60 text-left font-mono text-[11px] text-muted-foreground break-all border border-border">
                {this.state.error.message}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={this.handleReload}
                className="tap w-full sm:w-auto px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground font-mono text-xs font-semibold rounded-sm shadow-sm inline-flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Tải lại trang</span>
              </button>

              <button
                type="button"
                onClick={this.handleHardReset}
                className="tap w-full sm:w-auto px-4 py-2 bg-card hover:bg-muted border border-border text-foreground font-mono text-xs font-medium rounded-sm inline-flex items-center justify-center gap-1.5"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Về trang chủ</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
