/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets the Docker image copy just .next/standalone instead of node_modules.
  output: "standalone",
};

export default nextConfig;
