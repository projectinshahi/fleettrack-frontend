import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle at .next/standalone, tracing in only the
  // node_modules actually reached at runtime. Cuts the deployment image from ~1GB to
  // ~150MB, which matters on a 3.8GB / 48GB VPS.
  //
  // Note for whoever writes the container: the standalone server is started with
  // `node .next/standalone/server.js`, NOT `next start`, and it does not bundle static
  // assets — `.next/static` and `public/` must be copied alongside server.js or every
  // stylesheet, chunk and image 404s.
  output: "standalone",
};

export default nextConfig;
