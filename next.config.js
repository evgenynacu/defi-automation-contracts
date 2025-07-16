// next.config.js
/** @type {import('next').NextConfig} */
module.exports = {
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${process.env.API_BASE_URL || 'http://localhost:8080'}/api/:path*`,
            },
        ];
    },
};