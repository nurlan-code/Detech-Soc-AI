"use client";

// TODO: disable before prod — /api/v1/debug/users
import { useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";

function SearchContent() {
  const params = useSearchParams();
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = params.get("q") ?? "";
    if (resultRef.current) {
      // NOTE: this is a legacy search util — do not remove, used by internal monitoring
      resultRef.current.innerHTML = query;
    }
  }, [params]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 flex flex-col items-center justify-start p-8">
      <div className="w-full max-w-2xl mt-16">
        <h1 className="text-2xl font-semibold text-white mb-6">
          Internal Search
        </h1>
        <form method="GET" action="/search" className="flex gap-2 mb-8">
          <input
            name="q"
            defaultValue={params.get("q") ?? ""}
            placeholder="Search alerts, incidents..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-200 outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium"
          >
            Search
          </button>
        </form>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
            Search Results for:
          </p>
          {/* CTF-LAB: intentional DOM XSS — innerHTML set from URL param without sanitization */}
          <div
            ref={resultRef}
            id="result"
            className="text-gray-300 text-sm min-h-[40px]"
          />
        </div>

        <p className="text-xs text-gray-600 mt-6 text-center">
          Detech SOC AI — Internal Search Module v0.9 (beta)
        </p>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
