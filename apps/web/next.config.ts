import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // Salida standalone para Node.js deployment en Render
  output: "standalone",
  // Quitar header X-Powered-By: Next.js (menos huella + un byte menos)
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Configuración de imágenes remotas
  images: {
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
