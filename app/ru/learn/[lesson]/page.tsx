import LessonPage, {generateMetadata as originalMetadata} from '../../../learn/[lesson]/LessonRoute';
import {translate} from '../../../../lib/i18n/translate';
export const dynamic='force-dynamic';
export default function Page(props:{params:Promise<{lesson:string}>}){return <LessonPage {...props} locale="ru"/>;}
export async function generateMetadata(props:Parameters<typeof originalMetadata>[0]){const metadata=await originalMetadata(props);return {...metadata,title:translate(String(metadata.title||""),"ru"),description:translate(metadata.description||"","ru")};}
