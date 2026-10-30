export type ConciseStep = {
  title: string;
  actions: string[];
  expected: string;
  chapters: number[];
  screens?: string[];
  prompt?: string;
};
export type ConciseGuide = {
  title: string;
  summary: string;
  why: string;
  steps: ConciseStep[];
  checks: string[];
  checkKeys: string[];
};
