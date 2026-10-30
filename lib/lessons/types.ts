export type PracticalChapter = {
  title: string;
  screen: string;
  explanation: string;
  actions: string[];
  expected: string;
  prompt?: string;
};
export type PracticalLessonData = {
  slug: string;
  moduleNumber: string;
  title: string;
  duration: string;
  summary: string;
  prerequisite: string;
  outcome: string;
  example: string;
  chapters: PracticalChapter[];
  troubleshooting: { issue: string; fix: string }[];
  exercise: string;
  checks: string[];
  quiz: { question: string; answers: string[]; correct: number; explanation: string }[];
  sources: { title: string; url: string }[];
};
