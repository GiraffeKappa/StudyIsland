import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "臭凝會考讀書島",
    short_name: "讀書島",
    lang: "zh-Hant",
    description: "把每天的努力，種成自己的讀書島。",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FAF9F5",
    theme_color: "#60A8B0",
    orientation: "landscape",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
