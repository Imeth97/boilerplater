/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent bundling native addons for ws (they break in serverless)
      config.externals.push("bufferutil", "utf-8-validate");
    }
    return config;
  },
  experimental: {
    // Ensure Next.js doesn’t try to bundle these in RSC either
    serverComponentsExternalPackages: ["bufferutil", "utf-8-validate"],
  },
};

export default nextConfig;
