import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcryptjs", "pg", "nodemailer", "pdf-lib"],
  poweredByHeader: false,
};

export default nextConfig;
