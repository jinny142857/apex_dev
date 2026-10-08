export const preworkExample = {
  who: 'Homeroom teachers',
  task: 'see who has returned a signed permission slip',
  situation: 'a field trip or school event requires a form from every student',
  rootCause: 'slips come back on different days and get mixed in with other classroom paperwork',
};

export const preworkExampleStatement = `[${preworkExample.who}] struggle to [${preworkExample.task}] when [${preworkExample.situation}] because [${preworkExample.rootCause}].`;

export function splitPreworkGuide(content: string) {
  const marker = '## What each part means';
  const index = content.indexOf(marker);
  if (index === -1) return { intro: content, rest: '' };
  return { intro: content.slice(0, index), rest: content.slice(index) };
}
