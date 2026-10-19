export type Prd = {
  problem: string; user: string; goal: string; appIdea: string; features: string; inclusiveDesign: string; design: string;
  referenceId: string; curatedIdeaId: string;
  // Keep the old fields so previously saved drafts still open.
  startingProblem: string; refinedProblem: string; focusMoment: string; desiredAction: string;
};

export const emptyPrd: Prd = { problem: '', user: '', goal: '', appIdea: '', features: '', inclusiveDesign: '', design: '', referenceId: '', curatedIdeaId: '', startingProblem: '', refinedProblem: '', focusMoment: '', desiredAction: '' };

// Pre-work uses brackets to teach the sentence structure. They are not part of the final prose.
export function stripProblemBrackets(text: string) {
  return text.replace(/\[([^\[\]]+)\]/g, '$1');
}

export function outcomeSummaryFromPrd(prd: Partial<Prd>, prework = '') {
  const featureLines = (prd.features || '').split('\n').map(line => line.trim().replace(/^([-*]|\d+[.)])\s*/, '')).filter(Boolean);
  return {
    problem: stripProblemBrackets(prd.problem || prd.refinedProblem || prework),
    features: [(prd.appIdea || '').trim(), ...featureLines.map(line => `• ${line}`)].filter(Boolean).join('\n'),
  };
}

export function buildPrdMarkdown(prd: Prd, currentPrework: string) {
  const problem = stripProblemBrackets(prd.problem.trim() || prd.refinedProblem.trim() || currentPrework.trim());
  const user = prd.user.trim();
  const appIdea = prd.appIdea.trim();
  const features = prd.features.split('\n').map(item => item.trim().replace(/^([-*]|\d+[.)])\s*/, '')).filter(Boolean);
  const sections = [`# Product Requirements Document`, '', '## Problem', problem || 'Not provided', '', '## User', user || 'Not provided', '', '## App idea', appIdea || 'Not provided', ...(features.length ? ['', '## Core features', features.map((item, index) => `${index + 1}. ${item}`).join('\n')] : [])].join('\n');
  const inclusiveDesign = (prd.inclusiveDesign || '').trim();
  const design = prd.design.trim();
  const inclusiveSection = inclusiveDesign ? `\n\n## Inclusive design\n${inclusiveDesign}` : '';
  const designSection = design ? `\n\n## Design requirements\n${design}` : '';
  return `${sections}${inclusiveSection}${designSection}

---

## Build and delivery instructions

Build a small, working web app based on this PRD. Focus on the stated users and implement the core features in a usable first version. Note any assumptions or unfinished parts honestly in the relevant code comments.

The app will be built and deployed as a Google Apps Script web app. Deliver the complete, ready-to-paste source as exactly two named files: \`Index.html\` and \`Code.gs\`. In \`Code.gs\`, include \`doGet()\` that returns \`HtmlService.createHtmlOutputFromFile('Index')\` for the file named \`Index.html\`. Put the UI, styles, and browser-side behavior in the self-contained \`Index.html\`; put server-side operations in \`Code.gs\`. Do not require npm, bundling, or additional source files. When the UI needs server data or actions, call Apps Script functions through asynchronous \`google.script.run\` success and failure handlers. Use Google Sheets, PropertiesService, or other Apps Script services only when the PRD needs them. Never put API keys or secrets in \`Index.html\`.

In your initial code response, show only the complete contents of both files directly in the chat: first \`Index.html\` in its own \`html\` fenced code block, then \`Code.gs\` in its own \`javascript\` fenced code block. Put each filename immediately above its block. Do not add GAS setup, usage, or deployment instructions, explanatory prose, attachments, download links, ZIP files, diffs, shortened snippets, or "unchanged code" placeholders.

If the participant later reports an error or requests a fix, return the complete revised contents of each file that actually changed, in its own labeled code block. If only \`Code.gs\` changed, provide the full \`Code.gs\` only; if only \`Index.html\` changed, provide the full \`Index.html\` only; if both changed, provide both complete files. Briefly tell the participant to replace the entire contents of each provided file in Apps Script. Never provide only changed lines, a patch, or partial code.

Provide enough realistic, fictional sample data to demonstrate every core feature from the first launch. If the app uses Google Sheets, include a \`setup()\` function that creates the required sheets and populates them with 10–20 sample rows. Unless another style is specified, use a clean, restrained glassmorphism design.

If a core feature depends on official terminology, curriculum codes, institutional criteria, or expert-authored content, ask the user for the authoritative source or examples before treating that data as final. Do not invent authoritative values. You may use clearly labeled fictional placeholders to demonstrate the interface, but require the user to review and replace them before real use.

Add a visible Privacy Policy link in the app footer. Clicking it must open an accessible modal (dialog label and focus management) with the full policy, a close button, and Escape-key dismissal. Write the policy for the data and services this particular app actually uses: what is collected, why, where it is stored, who can access it, how long it is kept, any third-party services, and how users can make a privacy request. Do not invent an organization, contact address, retention period, or data practice; use a clearly labeled placeholder where an operator decision is still needed. Write the policy in the app’s user-facing language. If the app collects no personal data, say that accurately. Use sample or anonymized information in the prototype and do not include real student personal information.
`;
}
