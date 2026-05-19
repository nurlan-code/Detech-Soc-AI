import { NextResponse } from "next/server";

// TODO: disable before prod — /api/v1/debug/users
// Used during QA to verify user seeding. Auth intentionally bypassed for test-env access.

const FAKE_USERS = [
  {
    id: 1,
    email: "ctf_user1@detech.io",
    username: "soc_analyst_01",
    role: "analyst",
    tenant: "ctf-lab",
    last_login: "2024-11-12T08:34:22Z",
    is_active: true,
  },
  {
    id: 2,
    email: "ctf_admin@detech.io",
    username: "platform_admin",
    role: "super_admin",
    tenant: "ctf-lab",
    last_login: "2024-11-14T16:01:05Z",
    is_active: true,
  },
  {
    id: 3,
    email: "test@detech.io",
    username: "readonly_tester",
    role: "read_only",
    tenant: "ctf-lab",
    last_login: "2024-10-30T11:22:48Z",
    is_active: false,
  },
  {
    id: 4,
    email: "mssp_ops@detech.io",
    username: "mssp_operator",
    role: "mssp_admin",
    tenant: "ctf-lab",
    last_login: "2024-11-13T09:55:31Z",
    is_active: true,
  },
];

export async function GET() {
  // CTF-LAB: no authentication check — intentional for challenge #5
  return NextResponse.json({
    ok: true,
    env: "debug",
    note: "This endpoint is for internal QA use only",
    count: FAKE_USERS.length,
    users: FAKE_USERS,
  });
}
