import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// SHA-256 hash of the inline theme detection script in app/layout.tsx.
// Regenerate after any change to themeScript:
//   echo -n '<script content>' | openssl dgst -sha256 -binary | openssl base64
const themeScriptHash = "sha256-+DIFQ9jI70f9oJcQ98WgFxZCQiEQzba2AqCxgI9q600=";

const cspHeader = [
  `script-src 'self' '${themeScriptHash}'`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value: cspHeader,
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
