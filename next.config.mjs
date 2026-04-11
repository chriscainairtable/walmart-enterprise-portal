import { execSync } from 'child_process';

const sha = (() => {
  try { return execSync('git rev-parse --short HEAD').toString().trim(); }
  catch { return 'unknown'; }
})();

const buildTime = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_SHA: sha,
    NEXT_PUBLIC_BUILD_TIME: buildTime,
  },
};

export default nextConfig;
