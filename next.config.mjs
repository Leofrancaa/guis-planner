import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  customWorkerSrc: "custom-sw.js",
});

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withPWA(nextConfig);
