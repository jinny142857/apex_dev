export type Prd = {
  problem: string; user: string; goal: string; appIdea: string; features: string; inclusiveDesign: string; design: string;
  // Keep the old fields so previously saved drafts still open.
  startingProblem: string; refinedProblem: string; focusMoment: string; desiredAction: string;
};

export const emptyPrd: Prd = { problem: '', user: '', goal: '', appIdea: '', features: '', inclusiveDesign: '', design: '', startingProblem: '', refinedProblem: '', focusMoment: '', desiredAction: '' };

// Pre-work uses brackets to teach the sentence structure. They are not part of the final prose.
export function stripProblemBrackets(text: string) {
  return text.replace(/\[([^\[\]]+)\]/g, '$1');
}

export function buildPrdMarkdown(prd: Prd, currentPrework: string) {
  const problem = stripProblemBrackets(prd.problem.trim() || prd.refinedProblem.trim() || currentPrework.trim());
  const goal = prd.goal.trim();
  const user = prd.user.trim();
  const appIdea = prd.appIdea.trim();
  const features = prd.features.split('\n').map(item => item.trim().replace(/^([-*]|\d+[.)])\s*/, '')).filter(Boolean);
  const sections = [`# Product Requirements Document`, '', '## Problem', problem || 'Not provided', '', '## User', user || 'Not provided', '', '## Goal', goal || 'Not provided', '', '## App idea', appIdea || 'Not provided', ...(features.length ? ['', '## Core features', features.map((item, index) => `${index + 1}. ${item}`).join('\n')] : [])].join('\n');
  const inclusiveDesign = (prd.inclusiveDesign || '').trim();
  const design = prd.design.trim();
  const inclusiveSection = inclusiveDesign ? `\n\n## Inclusive design\n${inclusiveDesign}` : '';
  const designSection = design ? `\n\n## Design requirements\n${design}` : '';
  return `${sections}${inclusiveSection}${designSection}

---

Build a small, front-end-only web app based on this PRD. Focus on the stated users and the part of the problem the app can realistically improve. Implement up to three core features first.

Do not require a backend server, remote database, external API or AI API, API key, authentication, or real-time synchronization. If information needs to persist, use browser-local storage on the current device only; do not present it as shared or backed up across devices. Use sample or anonymized data, never real student personal information. Do not assume one device per student: if students use the app, it should also make sense in a computer lab, on a shared group device, or with a teacher-led display. If a requested feature cannot honestly work within these limits, build a smaller working version and clearly state the limitation.
`;
}
