export { default } from "../../learn/LearnRoute";
import { generateMetadata as originalMetadata } from "../../learn/LearnRoute";
import { translate } from "../../../lib/i18n/translate";
export async function generateMetadata() {const metadata=await originalMetadata();return {...metadata,title:translate(String(metadata.title||""),"ru"),description:translate(metadata.description||"","ru")};}
