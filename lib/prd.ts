export type Prd = {
  problem: string; user: string; goal: string; appIdea: string; features: string; design: string;
  // Keep the old fields so previously saved drafts still open.
  startingProblem: string; refinedProblem: string; focusMoment: string; desiredAction: string;
};

export const emptyPrd: Prd = { problem: '', user: '', goal: '', appIdea: '', features: '', design: '', startingProblem: '', refinedProblem: '', focusMoment: '', desiredAction: '' };

// Pre-work uses brackets to teach the sentence structure. They are not part of the final prose.
export function stripProblemBrackets(text: string) {
  return text.replace(/\[([^\[\]]+)\]/g, '$1');
}

export function buildPrdMarkdown(prd: Prd, currentPrework: string) {
  const problem = stripProblemBrackets(prd.problem.trim() || prd.refinedProblem.trim() || currentPrework.trim());
  const features = prd.features.split('\n').map(item => item.trim().replace(/^([-*]|\d+[.)])\s*/, '')).filter(Boolean).slice(0, 3);
  return `# Product requirements document

## Problem
${problem || 'Not provided'}

## User
${prd.user.trim() || 'Not provided'}

## Goal
${prd.goal.trim() || 'Not provided'}

## App idea
${prd.appIdea.trim() || 'Not provided'}

## Core features
${features.length ? features.map(item => `- ${item}`).join('\n') : '- Not provided'}

## Design requirements
${prd.design.trim() || 'Not specified'}

Build a simple web app based on this PRD. Start with the core features and keep the first version small.
`;
}
