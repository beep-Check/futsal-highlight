const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'self' https://sites.google.com https://*.googleusercontent.com;",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;