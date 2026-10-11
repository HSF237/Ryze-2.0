import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle Firebase Auth and its ESM dependencies for the serverless runtime.
  transpilePackages: ["firebase-admin", "jwks-rsa", "jose"],
};

export default nextConfig;
