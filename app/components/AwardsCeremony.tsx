'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Phase = 'ready' | 'countdown' | 'revealed';

function playDrumroll(): () => void {
  try {
    const context = new AudioContext();
    const master = context.createGain();
    master.gain.value = 0.26;
    master.connect(context.destination);
    let time = context.currentTime;
    for (let beat = 0; beat < 24; beat++) {
      const drum = context.createOscillator();
      const body = context.createGain();
      drum.type = 'sine';
      drum.frequency.setValueAtTime(112, time);
      drum.frequency.exponentialRampToValueAtTime(43, time + 0.16);
      body.gain.setValueAtTime(0.001, time);
      body.gain.exponentialRampToValueAtTime(0.52 + beat * 0.012, time + 0.008);
      body.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
      drum.connect(body).connect(master);
      drum.start(time);
      drum.stop(time + 0.23);
      time += beat < 8 ? 0.16 : beat < 16 ? 0.125 : 0.095;
    }
    void context.resume();
    return () => { void context.close().catch(() => {}); };
  } catch { return () => {}; }
}

export default function AwardsCeremony({ team, presenter, members, onClose, onReveal }: { team: string; presenter: string; members: string[]; onClose: () => void; onReveal?: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const timers = useRef<number[]>([]);
  const stopAudio = useRef<() => void>(() => {});
  const [phase, setPhase] = useState<Phase>('ready');
  const [count, setCount] = useState(3);
  const start = useCallback(() => {
    if (phase === 'countdown') return;
    timers.current.forEach(window.clearTimeout);
    stopAudio.current();
    setCount(3);
    setPhase('countdown');
    stopAudio.current = playDrumroll();
    timers.current = [
      window.setTimeout(() => setCount(2), 950),
      window.setTimeout(() => setCount(1), 1900),
      window.setTimeout(() => { setPhase('revealed'); stopAudio.current(); onReveal?.(); }, 2850),
    ];
  }, [phase, onReveal]);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => { document.body.style.overflow = previous; timers.current.forEach(window.clearTimeout); stopAudio.current(); };
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      else if (phase === 'ready' && ['Enter', ' '].includes(event.key) && !(event.target instanceof HTMLButtonElement)) { event.preventDefault(); start(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, phase, start]);
  return <div className={`awards-ceremony ceremony-${phase}`} role="dialog" aria-modal="true" aria-label="Final award ceremony">
    <div className="ceremony-top"><span>APEX DEV · AWARDS</span><button ref={closeRef} onClick={onClose}>Close ×</button></div>
    {phase === 'revealed' && <><div className="ceremony-spotlights" aria-hidden="true"><i/><i/><i/></div><div className="ceremony-confetti" aria-hidden="true">{Array.from({ length: 90 }, (_, index) => <i key={index} style={{ left: `${(index * 47.3) % 100}%`, animationDelay: `${-(index % 29) * 0.19}s`, animationDuration: `${4 + index % 4}s`, transform: `rotate(${index * 31}deg)` }}/>)}</div></>}
    <div className="ceremony-card" key={phase}>
      {phase === 'ready' && <><span className="ceremony-trophy" aria-hidden="true">🏆</span><p>THE FINAL AWARD</p><h1>The moment is here</h1><h2>One team. One shared achievement.</h2><p>Ready to celebrate the winning team?</p><button className="ceremony-reveal" onClick={start}>Start the reveal →</button></>}
      {phase === 'countdown' && <div className="ceremony-countdown" aria-live="assertive" aria-atomic="true"><p>DRUMROLL, PLEASE</p><span key={count}>{count}</span><h2>The winner is almost here</h2></div>}
      {phase === 'revealed' && <><span className="ceremony-trophy ceremony-winner-trophy" aria-hidden="true">🏆</span><p>FINAL AWARD</p><h1>Team {team}</h1><h2>Our winning team!</h2><p>Presented by {presenter}</p><div className="ceremony-members">{members.map(member => <span key={member}>{member}</span>)}</div><small>The award belongs to the entire team.</small><div><button className="ceremony-replay" onClick={start}>↻ Celebrate again</button></div></>}
    </div>
  </div>;
}
