import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer is a large native-ish lib; keep it out of the bundle.
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
