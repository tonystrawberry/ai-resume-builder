import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/onboarding/:path*",
    "/resumes/:path*",
    "/workspace/:path*",
    "/sharing/:path*",
    "/settings/:path*",
  ],
};
