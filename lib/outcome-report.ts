import { stripProblemBrackets, type Prd } from './prd';
import { normalizeSelfAssessment, selfAssessmentItems, validSelfAssessment, type OutcomeSelfAssessment } from './outcome-self-assessment';

export type OutcomeReport = {
  name: string;
  ownerName: string;
  url?: string;
  problem?: string;
  features?: string;
  guide?: string;
  demo?: boolean;
  prework?: string;
  prd?: Partial<Prd>;
  selfAssessment?: OutcomeSelfAssessment;
  selfAssessmentScale?: number;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
}

function paragraph(value?: string) {
  return escapeHtml(value?.trim() || 'Not provided').replace(/\n/g, '<br>');
}

function field(label: string, value?: string) {
  if (!value?.trim()) return '';
  return `<div class="report-field"><h3>${escapeHtml(label)}</h3><p>${paragraph(value)}</p></div>`;
}

function journeyStep(number: string, label: string, heading: string, content: string) {
  return `<section class="journey-step"><div class="journey-number">${number}</div><div class="journey-copy"><span class="journey-label">${label}</span><h2>${heading}</h2>${content}</div></section>`;
}

export function buildOutcomeReportHtml(report: OutcomeReport) {
  const prd = report.prd;
  const url = (() => {
    try { const parsed = new URL(report.url || ''); return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : ''; }
    catch { return ''; }
  })();
  const title = escapeHtml(report.name || 'Final outcome');
  const prework = stripProblemBrackets(report.prework || '');
  const problem = stripProblemBrackets(prd?.problem || prd?.refinedProblem || prework || report.problem || '');
  const prdContent = [
    field('Intended users', prd?.user), field('App idea', prd?.appIdea),
    field('Core features', prd?.features), field('Inclusive design', prd?.inclusiveDesign),
    field('Design requirements', prd?.design),
  ].join('');
  const missingPrd = report.demo ? 'This demo outcome has no linked PRD. A participant report shows their saved PRD here.' : 'No saved PRD is linked to this outcome.';
  const outcomeContent = [
    field('Web app', report.name), field('What the finished app does', report.features),
    field('Notes or instructions', report.guide),
    url ? `<div class="report-field report-link"><h3>Website</h3><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a></div>` : '',
    url ? `<div class="report-field live-preview"><h3>Live web app</h3><p class="preview-note">The site loads here when you are online and the site permits embedding. If the frame stays blank, use <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Open site ↗</a>.</p><div class="preview-frame"><iframe src="${escapeHtml(url)}" title="Live preview of ${title}" loading="lazy" referrerpolicy="no-referrer" allow="fullscreen" sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-downloads"></iframe></div></div>` : '',
  ].join('');
  const assessment = normalizeSelfAssessment(report.selfAssessment, report.selfAssessmentScale);
  const assessmentContent = validSelfAssessment(assessment)
    ? `<div class="report-field self-assessment-report"><h3>Self-check · 1–5</h3><div class="self-assessment-report-grid">${selfAssessmentItems.map(({ key, title }) => `<div><span>${escapeHtml(title)}</span><strong>${assessment[key]} / 5</strong></div>`).join('')}</div></div>`
    : '';
  return `<main class="sheet"><div class="eyebrow">APEX DEV · Final outcome</div><h1>${title}</h1><p class="meta">By ${escapeHtml(report.ownerName || 'Participant')} · ${escapeHtml(new Date().toLocaleDateString('en-CA'))}</p>
    <div class="journey-heading"><span>THE JOURNEY</span><h3>From a school challenge to a web app</h3></div>
    <div class="journey">
      ${journeyStep('01', 'DEFINE', 'Problem definition', `<p class="problem-statement">${paragraph(problem || 'Problem definition not recorded.')}</p>`)}
      ${journeyStep('02', 'PLAN', 'Product requirements document', prdContent || `<p class="empty-prd">${escapeHtml(missingPrd)}</p>`)}
      ${journeyStep('03', 'BUILD & SHARE', 'Final outcome', outcomeContent + assessmentContent)}
    </div>
    </main>`;
}

export function buildStandaloneOutcomeHtml(report: OutcomeReport, css: string) {
  // Keep exported reports self-contained. Escape the closing tag so CSS cannot end the style element.
  const safeCss = css.replace(/<\/style/gi, '<\\/style');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(report.name || 'Final outcome')} · APEX DEV</title><style>${safeCss}</style></head><body class="standalone-report"><div class="outcome-report"><div class="toolbar"><span>APEX DEV · Final outcome report<small>Use your browser’s PDF destination in the print window.</small></span><button type="button" onclick="window.print()">Save as PDF</button></div>${buildOutcomeReportHtml(report)}</div></body></html>`;
}
