export const revalidate = 3600;
export { default } from "../../../courses/build-with-codex/CourseRoute";
import { courseMetadata } from "../../../courses/build-with-codex/CourseRoute";
export function generateMetadata() { return courseMetadata("ru"); }
