import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow mobile access via network IP
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
