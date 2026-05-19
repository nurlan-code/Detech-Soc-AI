import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  // CTF-LAB challenge-6: source maps exposed in production build
  productionBrowserSourceMaps: true,
  transpilePackages: [
    "react-markdown",
    "remark-parse", "remark-rehype",
    "unified", "bail", "is-plain-obj", "trough",
    "vfile", "vfile-message",
    "unist-util-stringify-position", "unist-util-visit", "unist-util-is",
    "mdast-util-from-markdown", "mdast-util-to-hast",
    "micromark", "micromark-core-commonmark",
    "micromark-factory-destination", "micromark-factory-label",
    "micromark-factory-space", "micromark-factory-title",
    "micromark-factory-whitespace", "micromark-util-character",
    "micromark-util-chunked", "micromark-util-classify-character",
    "micromark-util-combine-extensions",
    "micromark-util-decode-numeric-character-reference",
    "micromark-util-encode", "micromark-util-html-tag-name",
    "micromark-util-normalize-identifier", "micromark-util-resolve-all",
    "micromark-util-sanitize-uri", "micromark-util-subtokenize",
    "decode-named-character-reference", "character-entities",
    "property-information", "hast-util-whitespace",
    "space-separated-tokens", "comma-separated-tokens",
    "hastscript", "web-namespaces",
  ],
  images: {
    remotePatterns: [],
  },
  // CTF-LAB challenge-4: serve simulated .git files at /.git/* path
  async rewrites() {
    return [
      { source: "/.git/:path*", destination: "/dot-git/:path*" },
    ];
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
    NEXT_PUBLIC_APP_NAME: "Detech SOC AI",
    NEXT_PUBLIC_MOCK: process.env.NEXT_PUBLIC_MOCK || "true",
  },
};

export default nextConfig;
