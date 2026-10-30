import LessonPage from '../../../learn/[lesson]/LessonRoute';

export const dynamic = 'force-dynamic';
export { generateMetadata } from '../../../learn/[lesson]/LessonRoute';

export default function Page(props: { params: Promise<{ lesson: string }> }) {
  return <LessonPage {...props} locale="en" />;
}
