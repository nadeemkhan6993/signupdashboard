/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'query1.finance.yahoo.com',
            },
        ],
    },
    experimental: {
        // Disable parallel worker threads for page data collection
        // as this causes ENOENT race conditions on Windows
        workerThreads: false,
        cpus: 1,
    },
};

export default nextConfig;
