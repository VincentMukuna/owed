import type { NextConfig } from "next";

const allowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS?.split(",") || ["localhost"];

const nextConfig: NextConfig = {
  allowedDevOrigins,
};

export default nextConfig;
