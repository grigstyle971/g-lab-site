import "server-only";
import { codexLessons } from "./lessons/codex";
import { githubLessons } from "./lessons/github";
import { vercelLessons } from "./lessons/vercel";
import { supabaseLessons } from "./lessons/supabase";
export const practicalLessons = [...codexLessons, ...githubLessons, ...vercelLessons, ...supabaseLessons];
export const findPracticalLesson = (slug: string) => practicalLessons.find(lesson => lesson.slug === slug);
