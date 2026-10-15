'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { clientAuth, clientDb } from '@/lib/firebase';
import { makeDemoOutcomes } from '@/lib/demo-data';
import { buildOutcomeReportHtml, buildStandaloneOutcomeHtml, type OutcomeReport } from '@/lib/outcome-report';
import type { Prd } from '@/lib/prd';

export default function OutcomeReportPage() {
  const [error, setError] = useState('');
  const [report, setReport] = useState<OutcomeReport | null>(null);
  const [downloadError, setDownloadError] = useState('');
  const [downloading, setDownloading] = useState(false);

  async function downloadHtml() {
    if (!report || downloading) return;
    setDownloading(true);
    setDownloadError('');
    try {
      const response = await fetch('/outcome-report.css');
      if (!response.ok) throw new Error('Could not prepare the report style.');
      const html = buildStandaloneOutcomeHtml(report, await response.text());
      const blobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = `APEX-DEV-${(report.name || 'outcome').replace(/[\\/:*?"<>|]/g, '-').slice(0, 80)}.html`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (cause) {
      setDownloadError(cause instanceof Error ? cause.message : 'Could not download the HTML report.');
    } finally {
      setDownloading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('post') || '';
    if (!/^[\w-]{1,128}$/.test(postId)) { setError('This outcome link is invalid.'); return; }

    if (params.get('demo') === '1') {
      if (localStorage.getItem('apexDevDemoAccess') !== 'yes') { setError('Open Demo mode first.'); return; }
      let post = makeDemoOutcomes().find(item => item.id === postId);
      if (!post) {
        try { post = JSON.parse(localStorage.getItem(`apex-demo-outcome-${postId}`) || 'null'); }
        catch { /* Ignore an invalid local sample. */ }
      }
      if (!post) { setError('This sample outcome was not found.'); return; }
      let samplePrd: Partial<Prd> | undefined;
      try { samplePrd = JSON.parse(localStorage.getItem(`apex-demo-outcome-prd-${postId}`) || 'null') || undefined; }
      catch { /* Ignore an invalid demo PRD. */ }
      setReport({ name: post.name || 'Final outcome', ownerName: post.ownerName || 'Participant', url: post.url, problem: post.problem, features: post.features, prd: samplePrd, selfAssessment: post.selfAssessment, demo: true });
      return;
    }

    let cancelled = false;
    const unsubscribe = onAuthStateChanged(clientAuth(), async user => {
      if (!user) { if (!cancelled) setError('Sign in to download your outcome report.'); return; }
      try {
        const project = await getDoc(doc(clientDb(), 'projects', postId));
        const post = project.data();
        if (!post || post.ownerId !== user.uid || post.stage === 'practice') throw new Error('This report is available only for your own final outcome.');
        const [prd, prework] = await Promise.all([
          getDoc(doc(clientDb(), 'prds', user.uid)),
          getDoc(doc(clientDb(), 'prework', user.uid)),
        ]);
        if (cancelled) return;
        setReport({
          name: post.name || 'Final outcome', ownerName: post.ownerName || user.displayName || 'Participant',
          url: post.url, problem: post.problem, features: post.features, guide: post.guide,
          selfAssessment: post.selfAssessment,
          prework: prework.data()?.text, prd: prd.data() as Partial<Prd> | undefined,
        });
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Could not prepare your report.');
      }
    });
    return () => { cancelled = true; unsubscribe(); };
  }, []);

  useEffect(() => {
    if (report) document.title = `${report.name} · APEX DEV`;
  }, [report]);

  if (report) return <><link rel="stylesheet" href="/outcome-report.css"/><div className="outcome-report"><div className="toolbar"><span>APEX DEV · Final outcome report <small>HTML includes the live app. PDF includes the written report and website link.</small></span><div className="toolbar-actions"><button type="button" disabled={downloading} onClick={downloadHtml}>{downloading ? 'Preparing…' : 'Download HTML'}</button><button type="button" onClick={() => window.print()}>Save as PDF</button></div></div>{downloadError && <p className="download-error" role="alert">{downloadError}</p>}<div dangerouslySetInnerHTML={{ __html: buildOutcomeReportHtml(report) }}/></div></>;

  return <main style={{ maxWidth: 640, margin: '15vh auto', padding: 24, fontFamily: 'sans-serif' }}>
    <h1>{error ? 'Report unavailable' : 'Preparing your outcome report…'}</h1>
    {error && <><p role="alert">{error}</p><a href="/">Back to APEX DEV</a></>}
  </main>;
}
