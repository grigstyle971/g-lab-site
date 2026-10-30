import type { MetadataRoute } from "next";
import { appOrigin } from "../lib/account/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${appOrigin()}/sitemap.xml`,
  };
}
