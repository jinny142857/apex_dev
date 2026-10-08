import { preworkExample } from '@/lib/prework-example';

export default function PreworkExample() {
  return <div className="example-card">
    <div className="column-label">WORKED EXAMPLE</div>
    <div className="example-legend"><span className="hl hl-who">WHO</span><span className="hl hl-task">TASK</span><span className="hl hl-situation">SITUATION</span><span className="hl hl-cause">ROOT CAUSE</span></div>
    <p className="example-sentence"><span className="hl hl-who">{preworkExample.who}</span> struggle to <span className="hl hl-task">{preworkExample.task}</span> when <span className="hl hl-situation">{preworkExample.situation}</span> because <span className="hl hl-cause">{preworkExample.rootCause}</span>.</p>
    <p className="example-compare">Compare: "Teachers struggle with paperwork" — true, but too broad to design for.</p>
  </div>;
}
