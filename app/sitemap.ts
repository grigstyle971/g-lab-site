import type { MetadataRoute } from "next";
import { appOrigin } from "../lib/account/config";

const base = appOrigin();
export default function sitemap():MetadataRoute.Sitemap{
 const paths=["","/about","/work","/websites-for-businesses","/courses/build-with-codex","/privacy","/terms"];
 return paths.flatMap(path=>["", "/ru"].map(prefix=>({url:base+prefix+path,alternates:{languages:{en:base+path,ru:base+"/ru"+path}},priority:path===""?1:path==="/privacy"||path==="/terms"?0.3:0.7})));
}
