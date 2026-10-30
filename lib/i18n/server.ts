import type { Locale } from "./translate";
// English route metadata is reused and translated by the explicit Russian routes.
export async function getLocale():Promise<Locale>{return "en";}
