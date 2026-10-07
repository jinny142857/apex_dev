'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';

const products = [
  { name: 'Classroom Compass', mark: '◉', title: 'Make every voice count.', subtitle: 'A simple classroom participation tool.' },
  { name: 'Quick Feedback Wall', mark: '✳', title: 'Make feedback feel easy.', subtitle: 'A quick way to gather questions after class.' },
  { name: 'Reading Quest', mark: '✦', title: 'Turn pages into progress.', subtitle: 'A friendly reading companion.' },
  { name: 'Fraction Lab', mark: '▧', title: 'See the size of a fraction.', subtitle: 'Explore fraction relationships visually.' },
  { name: 'Science Snapshot', mark: '⚗', title: 'Catch the moment of discovery.', subtitle: 'Collect observations from every experiment.' },
  { name: 'Vocabulary Cards', mark: 'Aa', title: 'Words worth remembering.', subtitle: 'Make visual cards and practice together.' },
];

export default function SampleProject() {
  const params = useParams<{ id: string }>();
  const index = Math.abs(Number(params?.id ?? 0) || 0) % products.length;
  const product = products[index];
  const [count, setCount] = useState(0);
  const [input, setInput] = useState('');
  const [notes, setNotes] = useState<string[]>(['What made today’s activity easier?', 'What could we try next time?']);
  const [word, setWord] = useState('Curiosity');
  return <main className={`sample-project sample-project-${index}`}>
    <header><span className="sample-project-logo">{product.mark}</span><strong>{product.name}</strong><small>Interactive sample</small></header>
    <section className="sample-project-hero"><p>MADE FOR LEARNING</p><h1>{product.title}</h1><span>{product.subtitle}</span></section>
    {index === 0 && <section className="sample-project-panel"><h2>Today’s discussion</h2><p>Tap the button when a new student joins the conversation.</p><div className="sample-project-count">{count} <small>contributions</small></div><button onClick={() => setCount(value => value + 1)}>+ Add a contribution</button></section>}
    {index === 1 && <section className="sample-project-panel"><h2>What is on your mind?</h2><p>Write a question or a short reflection.</p><div className="sample-project-input"><input value={input} onChange={event => setInput(event.target.value)} placeholder="I am wondering about…"/><button onClick={() => { if (input.trim()) { setNotes(previous => [input.trim(), ...previous]); setInput(''); } }}>Share</button></div><div className="sample-project-notes">{notes.map((note, noteIndex) => <span key={noteIndex}>{note}</span>)}</div></section>}
    {index === 2 && <section className="sample-project-panel"><h2>My reading week</h2><p>Each page is one small step forward.</p><div className="sample-reading-track">{Array.from({ length: 5 }, (_, step) => <span className={step < count ? 'done' : ''} key={step}>✦</span>)}</div><button onClick={() => setCount(value => (value + 1) % 6)}>Mark a reading day</button></section>}
    {index === 3 && <section className="sample-project-panel"><h2>Fraction explorer</h2><p>Choose a fraction and compare the bars.</p><div className="sample-fraction-options">{[2, 3, 4, 6].map(value => <button className={count === value ? 'selected' : ''} key={value} onClick={() => setCount(value)}>1/{value}</button>)}</div><div className="sample-fraction-bar"><span style={{ width: `${100 / (count || 2)}%` }}/></div><small>{count ? `One out of ${count} equal parts` : 'Choose a fraction above'}</small></section>}
    {index === 4 && <section className="sample-project-panel sample-science-board"><div className="sample-science-image" aria-hidden="true">⚗️</div><div><span className="sample-science-tag">OBSERVATION 01</span><h2>What changed?</h2><p>A drop of color spreads through the water. Record what you notice.</p><div className="sample-project-input"><input value={input} onChange={event => setInput(event.target.value)} placeholder="I noticed…"/><button onClick={() => { if (input.trim()) { setNotes(previous => [input.trim(), ...previous]); setInput(''); } }}>Add note</button></div><div className="sample-science-notes">{notes.map((note, noteIndex) => <span key={noteIndex}>✦ {note}</span>)}</div></div></section>}
    {index === 5 && <section className="sample-project-panel sample-vocab-board"><div className="sample-vocab-card"><span>WORD CARD {count + 1} / 3</span><div>{['✨', '🌱', '🌊'][count]}</div><h2>{word}</h2><p>{['A strong desire to know and learn.', 'The beginning of something new.', 'A moving body of water.'][count]}</p></div><div className="sample-vocab-controls"><button onClick={() => { const next = (count + 1) % 3; setCount(next); setWord(['Curiosity', 'Growth', 'Wave'][next]); }}>Next card →</button><span>Tap to explore the next word</span></div></section>}
  </main>;
}
