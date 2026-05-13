/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  },
  webpack: (config, { isServer }) => {
    // @react-pdf/renderer uses canvas for font metrics — not available in
    // webpack's bundle environment. Stub it out so the chunk loads cleanly.
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;

    if (isServer) {
      // Prevent server-side bundling of browser-only PDF renderer
      config.externals = [...(config.externals || []), '@react-pdf/renderer'];
    }

    return config;
  },
};

export default nextConfig;
