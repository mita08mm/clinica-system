import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // Static export para Cloudflare Pages
  output: "export",
  // Quitar header X-Powered-By: Next.js (menos huella + un byte menos)
  poweredByHeader: false,
  // Trailing slash para static hosting
  trailingSlash: true,
  reactStrictMode: true,
  
  // Configuración de imágenes remotas
  images: {
    unoptimized: true, // Required for static export
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.magnific.com',
      },
      {
        protocol: 'https',
        hostname: 'skin-fusion.ca',
      },
    ],
  },

  experimental: {
    // Importa sólo los íconos usados de lucide-react (tree-shaking efectivo en Turbopack).
    // Agregar aquí cualquier otra librería pesada con barrel grande.
    optimizePackageImports: ["lucide-react"],
  },
};

export default withBundleAnalyzer(nextConfig);
