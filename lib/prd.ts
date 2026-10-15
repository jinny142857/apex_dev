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

## Build and delivery instructions

Build a small, working web app based on this PRD. Focus on the stated users, implement the core features in a usable first version, and state any assumptions or unfinished parts honestly.

The app will be built and deployed as a Google Apps Script web app. Deliver the complete, ready-to-paste source as exactly two named files: \`index.html\` and \`Code.gs\`. In \`Code.gs\`, include \`doGet()\` that returns \`HtmlService.createHtmlOutputFromFile('index')\` for the file named \`index.html\`. Put the UI, styles, and browser-side behavior in the self-contained \`index.html\`; put server-side operations in \`Code.gs\`. Do not require npm, bundling, or additional source files. When the UI needs server data or actions, call Apps Script functions through asynchronous \`google.script.run\` success and failure handlers. Use Google Sheets, PropertiesService, or other Apps Script services only when the PRD needs them, and give brief setup and deployment steps for any required resource or permission. Never put API keys or secrets in \`index.html\`.

Add a visible Privacy Policy link in the app footer. Clicking it must open an accessible modal (dialog label and focus management) with the full policy, a close button, and Escape-key dismissal. Write the policy for the data and services this particular app actually uses: what is collected, why, where it is stored, who can access it, how long it is kept, any third-party services, and how users can make a privacy request. Do not invent an organization, contact address, retention period, or data practice; use a clearly labeled placeholder where an operator decision is still needed. Write the policy in the app’s user-facing language. If the app collects no personal data, say that accurately. Use sample or anonymized information in the prototype and do not include real student personal information.
`;
}
