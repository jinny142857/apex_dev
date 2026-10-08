export const preworkExamples = [
  {
    id: 'example-room-bookings',
    who: 'Teachers who share school spaces and equipment',
    task: 'check availability and avoid scheduling conflicts',
    situation: 'booking rooms or shared equipment for lessons and activities',
    rootCause: 'different teachers manage their schedules separately, and there is no reliable way to see the latest bookings',
  },
  {
    id: 'example-student-support',
    who: 'Teachers who support students with ongoing learning or wellbeing needs',
    task: 'keep track of previous observations and follow-up actions',
    situation: 'several staff members support the same student',
    rootCause: 'notes and updates are recorded separately, making it difficult to see what has already been discussed or done',
  },
] as const;

export const preworkExample = preworkExamples[0];
export const preworkExampleStatement = `[${preworkExample.who}] struggle to [${preworkExample.task}] when [${preworkExample.situation}] because [${preworkExample.rootCause}].`;
export const preworkExampleStatements = preworkExamples.map(example =>
  `[${example.who}] struggle to [${example.task}] when [${example.situation}] because [${example.rootCause}].`,
);

export function splitPreworkGuide(content: string) {
  const marker = '## What each part means';
  const index = content.indexOf(marker);
  if (index === -1) return { intro: content, rest: '' };
  return { intro: content.slice(0, index), rest: content.slice(index) };
}
