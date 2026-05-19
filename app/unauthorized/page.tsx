"use client";

import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-center px-4">
      <div className="text-6xl font-bold text-red-500 mb-4">403</div>
      <h1 className="text-2xl font-semibold text-white mb-2">Access Denied</h1>
      <p className="text-gray-400 text-sm mb-8 max-w-sm">
        You do not have the required role to view this page.
        Admin access is required.
      </p>
      <Link
        href="/dashboard"
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
