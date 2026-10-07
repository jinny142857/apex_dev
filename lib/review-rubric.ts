export const reviewRubric = [
  {
    id: 'criterion-1',
    label: 'Practical Applicability and Versatility',
    question: 'Is the tool relevant to a real school administrative task, and could its approach be adapted to similar tasks or school contexts?',
    descriptions: [
      'The intended user or school task is unclear, and practical use is not demonstrated.',
      'The tool addresses a narrowly defined situation and would need major changes for similar use.',
      'The tool is relevant to one clearly defined administrative task.',
      'The tool could support several similar tasks or contexts with minor adjustments.',
      'The approach is practical and adaptable across multiple school contexts or administrative tasks.',
    ],
  },
  {
    id: 'criterion-2',
    label: 'Improvement to Administrative Work',
    question: 'To what extent does the tool reduce time, repetition, manual effort, confusion, or the risk of missing information?',
    descriptions: [
      'The tool does not improve the task, or it adds work without a clear benefit.',
      'It offers a small or uncertain improvement.',
      'It reduces effort in at least one specific part of the task.',
      'It noticeably reduces repetitive work, time, confusion, or avoidable omissions.',
      'It substantially simplifies the workflow and clearly frees teachers’ time for other work.',
    ],
  },
  {
    id: 'criterion-3',
    label: 'Ease of Use',
    question: 'Can a teacher understand and use the main workflow without extensive instructions?',
    descriptions: [
      'The main actions or navigation are difficult to understand.',
      'The user needs frequent help to complete the main task.',
      'The main task can be completed, but some steps or labels need clarification.',
      'The workflow is clear, and most teachers could use it independently.',
      'The interface is intuitive and lets the user complete the task with little unnecessary effort.',
    ],
  },
  {
    id: 'criterion-4',
    label: 'Completeness and Reliability',
    question: 'Do the MVP’s stated core features work as expected, without errors that prevent the main task?',
    descriptions: [
      'The core feature is missing or does not work.',
      'The core feature works only partially, with major errors or interruptions.',
      'The main workflow works, though minor errors or unfinished parts remain.',
      'The stated core features work reliably, with no major usability-blocking errors.',
      'The key workflow has been tested from start to finish and works consistently as described.',
    ],
  },
] as const;

export const officialCriteria = reviewRubric.map(({ id, label }) => ({ id, label, maxScore: 5 }));
export const scoreLabels = ['Not yet demonstrated', 'Emerging', 'Functional', 'Strong', 'Highly effective'] as const;
