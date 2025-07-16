// next.config.js
/** @type {import('next').NextConfig} */
module.exports = {
    rewrites: async function() {
        return [
            {
                source: '/api/:path*',
                destination: `${process.env.API_BASE_URL}/api/:path*`,
            },
        ];
    },
};