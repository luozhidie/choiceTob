"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">后台页面出错</h2>
        <p className="text-sm text-gray-500 mb-2">{error.message || "未知错误"}</p>
        {error.digest && (
          <p className="text-xs text-gray-400 mb-4">错误ID: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium"
          >
            重试
          </button>
          <a
            href="/admin/login"
            className="px-5 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            返回登录
          </a>
        </div>
      </div>
    </div>
  );
}
