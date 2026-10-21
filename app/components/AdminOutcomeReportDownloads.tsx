'use client';

import { useMemo, useState } from 'react';
import { buildOutcomeReportHtml, buildStandaloneOutcomeCollectionHtml, type OutcomeReport } from '@/lib/outcome-report';
import type { Prd } from '@/lib/prd';

type Entry = { id: string; ownerId: string; ownerName?: string; name?: string; url?: string; problem?: string; features?: string; guide?: string; previewImage?: string; selfAssessment?: OutcomeReport['selfAssessment']; selfAssessmentScale?: number };
type ParticipantRecord = { id: string; ownerId?: string; nickname?: string; name?: string; problem?: string; appIdea?: string; user?: string; features?: string; inclusiveDesign?: string; design?: string; refinedProblem?: string; startingProblem?: string; focusMoment?: string; desiredAction?: string; text?: string };

export default function AdminOutcomeReportDownloads({ outcomes, prds, preworks }: { outcomes: Entry[]; prds: ParticipantRecord[]; preworks: ParticipantRecord[] }) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const reportJobs = useMemo(() => outcomes.map(outcome => {
    const prdRecord = prds.find(record => record.ownerId === outcome.ownerId) || prds.find(record => record.id === outcome.ownerId);
    const preworkRecord = preworks.find(record => record.ownerId === outcome.ownerId) || preworks.find(record => record.id === outcome.ownerId);
    const prd = prdRecord as Partial<Prd> | undefined;
    return { report: {
      name: outcome.name || 'Final outcome', ownerName: outcome.ownerName || prdRecord?.nickname || prdRecord?.name || 'Participant',
      url: outcome.url, problem: outcome.problem, features: outcome.features, guide: outcome.guide, previewImage: outcome.previewImage,
      selfAssessment: outcome.selfAssessment, selfAssessmentScale: outcome.selfAssessmentScale,
      prework: preworkRecord?.text, prd,
    } satisfies OutcomeReport };
  }).sort((left, right) => left.report.ownerName.localeCompare(right.report.ownerName) || left.report.name.localeCompare(right.report.name)), [outcomes, prds, preworks]);
  const reports = reportJobs.map(job => job.report);

  async function prepareHtml() {
    if (!reports.length || busy) return null;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/outcome-report.css');
      if (!response.ok) throw new Error('Could not prepare the report style.');
      return buildStandaloneOutcomeCollectionHtml(reports, await response.text());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not prepare the reports.');
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function downloadHtml() {
    const html = await prepareHtml();
    if (!html) return;
    const blobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = 'APEX-DEV-all-participant-reports.html';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  }

  async function openPdfReadyReports() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { setError('Allow pop-ups to prepare the PDF report.'); return; }
    printWindow.opener = null;
    const html = await prepareHtml();
    if (!html) { printWindow.close(); return; }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  async function downloadIndividualPdfsZip() {
    if (!reportJobs.length || busy) return;
    setBusy(true);
    setError('');
    let exportRoot: HTMLDivElement | null = null;
    try {
      const [{ default: html2pdf }, { default: JSZip }] = await Promise.all([import('html2pdf.js'), import('jszip')]);
      const zip = new JSZip();
      const cssResponse = await fetch('/outcome-report.css');
      if (!cssResponse.ok) throw new Error('Could not prepare the report style.');
      const css = await cssResponse.text();
      exportRoot = document.createElement('div');
      exportRoot.setAttribute('aria-hidden', 'true');
      exportRoot.style.cssText = 'position:fixed;left:-10000px;top:0;z-index:-1;width:182mm;background:#fff;';
      const style = document.createElement('style');
      style.textContent = `${css}\n.outcome-report.pdf-export{width:182mm!important;background:#fff!important}.outcome-report.pdf-export .sheet{max-width:none;margin:0;padding:0 8px}.outcome-report.pdf-export .live-preview{display:none!important}`;
      exportRoot.appendChild(style);
      document.body.appendChild(exportRoot);

      for (const [index, job] of reportJobs.entries()) {
        setProgress(`Generating PDF ${index + 1} of ${reportJobs.length}…`);
        const reportElement = document.createElement('div');
        reportElement.className = 'outcome-report pdf-export';
        reportElement.innerHTML = buildOutcomeReportHtml(job.report);
        exportRoot.appendChild(reportElement);
        try {
          const pdf = await html2pdf().set({
            margin: [12, 14, 12, 14],
            image: { type: 'jpeg', quality: 0.96 },
            html2canvas: { scale: 1.5, useCORS: true, backgroundColor: '#ffffff', logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'] },
          } as any).from(reportElement).outputPdf('blob');
          const slug = job.report.ownerName.normalize('NFKD').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 45) || 'participant';
          const id = String(index + 1).padStart(2, '0');
          zip.file(`${slug}-${id}.pdf`, pdf as Blob);
        } finally {
          reportElement.remove();
        }
      }

      setProgress('Creating ZIP…');
      const blob = await zip.generateAsync({ type: 'blob' }, metadata => setProgress(`Creating ZIP… ${Math.round(metadata.percent)}%`));
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = 'APEX-DEV-individual-participant-reports.zip';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not generate the PDF archive.');
    } finally {
      exportRoot?.remove();
      setBusy(false);
      setProgress('');
    }
  }

  return <div className="admin-outcome-report-downloads">
    <div><h3>Participant reports <span>{reports.length}</span></h3><p className="muted">Download one combined report for all published final outcomes. The PDF option opens a print-ready page; choose “Save as PDF” in the print dialog.</p></div>
    <div className="admin-report-actions"><button type="button" className="secondary" disabled={!reports.length || busy} onClick={() => void downloadHtml()}>{busy ? 'Preparing…' : 'Download all as HTML'}</button><button type="button" className="secondary" disabled={!reports.length || busy} onClick={() => void downloadIndividualPdfsZip()}>{busy ? 'Preparing…' : 'Download individual PDFs (.zip)'}</button><button type="button" disabled={!reports.length || busy} onClick={() => void openPdfReadyReports()}>{busy ? 'Preparing…' : 'Prepare combined PDF'}</button></div>
    {progress && <p className="muted" role="status">{progress}</p>}
    {error && <p role="alert" className="download-error">{error}</p>}
    {!reports.length && <p className="muted">No final outcome reports are available yet.</p>}
  </div>;
}
