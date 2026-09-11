import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleClearStorageAndReload = () => {
    if (confirm('คุณต้องการรีเซ็ตข้อมูลแคชในบราวเซอร์และโหลดระบบใหม่หรือไม่?')) {
      // Clear current user session
      localStorage.removeItem('wb_takhli_curr_user_v1');
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-3xl">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold font-prompt text-white">
                {this.props.fallbackTitle || 'เกิดข้อผิดพลาดในการแสดงผลหน้าจอ'}
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                ระบบตรวจพบข้อผิดพลาดชั่วคราวในการประมวลผล กรุณากดปุ่มด้านล่างเพื่อโหลดหน้าจอใหม่
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-700/60 text-left font-mono text-[11px] text-rose-300 overflow-x-auto max-h-32">
                <strong>Error:</strong> {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>รีโหลดหน้าจอใหม่</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearStorageAndReload}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>กลับหน้าหลัก (Login)</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
