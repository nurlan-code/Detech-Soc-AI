import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "MMM dd, yyyy HH:mm");
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function severityColor(severity: string): string {
  const map: Record<string, string> = {
    critical: "text-red-500",
    high: "text-orange-500",
    medium: "text-yellow-500",
    low: "text-green-500",
    info: "text-blue-500",
  };
  return map[severity?.toLowerCase()] ?? "text-gray-400";
}

export function severityBadgeClass(severity: string): string {
  const map: Record<string, string> = {
    critical: "bg-red-500/10 text-red-500 border-red-500/30",
    high: "bg-orange-500/10 text-orange-500 border-orange-500/30",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    low: "bg-green-500/10 text-green-500 border-green-500/30",
    info: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  };
  return map[severity?.toLowerCase()] ?? "bg-gray-500/10 text-gray-400 border-gray-500/30";
}

export function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    new: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    triaging: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    in_progress: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    escalated: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    resolved: "bg-green-500/10 text-green-400 border-green-500/30",
    false_positive: "bg-gray-500/10 text-gray-400 border-gray-500/30",
    open: "bg-red-500/10 text-red-400 border-red-500/30",
    closed: "bg-green-500/10 text-green-400 border-green-500/30",
    phishing: "bg-red-500/10 text-red-400 border-red-500/30",
    suspicious: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    clean: "bg-green-500/10 text-green-400 border-green-500/30",
  };
  return map[status?.toLowerCase()] ?? "bg-gray-500/10 text-gray-400 border-gray-500/30";
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}

export function riskScoreColor(score: number): string {
  if (score >= 80) return "text-red-500";
  if (score >= 60) return "text-orange-500";
  if (score >= 40) return "text-yellow-500";
  return "text-green-500";
}
