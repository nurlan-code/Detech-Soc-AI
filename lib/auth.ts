import Cookies from "js-cookie";
import { authApi } from "./api";

const COOKIE_OPTIONS = {
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
};

export function setTokens(accessToken: string, refreshToken: string) {
  Cookies.set("access_token", accessToken, { ...COOKIE_OPTIONS, expires: 1 / 48 }); // 30 min
  Cookies.set("refresh_token", refreshToken, { ...COOKIE_OPTIONS, expires: 7 });
}

export function clearTokens() {
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
}

export function getAccessToken(): string | undefined {
  return Cookies.get("access_token");
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export async function logout() {
  try {
    await authApi.logout();
  } finally {
    clearTokens();
    window.location.href = "/login";
  }
}
