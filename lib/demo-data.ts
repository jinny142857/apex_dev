import type { OutcomePost } from '@/app/components/OutcomeShowcase';

export const demoPeople = [
  ['Alex', 'A'], ['Mina', 'A'], ['Sam', 'A'], ['June', 'A'],
  ['Taylor', 'B'], ['Robin', 'B'], ['Jin', 'B'], ['Chris', 'B'],
  ['Morgan', 'C'], ['Dana', 'C'], ['Casey', 'C'], ['Ari', 'C'],
  ['Lee', 'D'], ['Noah', 'D'], ['Sky', 'D'],
] as const;

export const demoWorks = [
  ['Classroom Compass', 'A simple way to notice patterns in classroom participation.', 'Teachers need a clearer view of who has spoken during group discussions.'],
  ['Quick Feedback Wall', 'Collect short exit tickets and spot common questions.', 'Students often leave class without a simple way to share confusion.'],
  ['Reading Quest', 'A playful reading tracker with small weekly goals.', 'Readers need visible progress without a complicated reward system.'],
  ['Lesson Planner', 'Draft a week of activities from a learning goal.', 'Planning repeatable lesson structures takes too much time.'],
  ['Fraction Lab', 'Explore equivalent fractions with interactive bars.', 'Fractions feel abstract when learners only see symbols.'],
  ['Schedule Studio', 'Coordinate shared classroom resources at a glance.', 'Teams lose time resolving room and equipment conflicts.'],
  ['Question Garden', 'Gather anonymous questions before the next lesson.', 'Quiet students need a low-pressure way to ask questions.'],
  ['Peer Check', 'Support thoughtful peer feedback with short prompts.', 'Peer comments are often too vague to be useful.'],
  ['Science Snapshot', 'Organize photos and observations from experiments.', 'Experiment notes get scattered across devices and notebooks.'],
  ['Math Minute', 'A focused daily practice game with instant feedback.', 'A short practice routine should feel achievable.'],
  ['School News Desk', 'Turn classroom updates into a clear family digest.', 'Important messages are buried in long announcement threads.'],
  ['Group Builder', 'Create balanced groups from teaching priorities.', 'Group work is hard to organize fairly and quickly.'],
  ['Vocabulary Cards', 'Build illustrated word cards together.', 'New vocabulary sticks better when students make examples.'],
  ['Reflection Map', 'See how student thinking changes during a project.', 'Learning progress is hard to notice in long projects.'],
  ['Idea Notebook', 'Capture, revisit, and connect classroom ideas.', 'Good ideas are lost between workshop sessions.'],
] as const;

export function makeDemoOutcomes(origin: string): OutcomePost[] {
  return demoPeople.map(([name], index) => ({
    id: `sample-outcome-${index + 1}`,
    ownerId: `sample-user-${index + 1}`,
    ownerName: name,
    name: demoWorks[index][0],
    url: origin ? `${origin}/preview/project/${({ 0: 0, 4: 3, 8: 4, 12: 5 } as Record<number, number>)[index] ?? index % 4}` : '',
    problem: demoWorks[index][2],
    features: demoWorks[index][1],
    guide: 'Try the interactive preview, then share one idea that could make it more useful in a real classroom.',
    demoComments: index < 4 ? [
      { id: `sample-comment-${index}-1`, text: 'The first screen makes the purpose easy to understand.', authorName: 'Mina', authorId: 'sample-user-2' },
      { id: `sample-comment-${index}-2`, text: 'I would love to try this with a small group.', authorName: 'Sam', authorId: 'sample-user-3' },
    ] : [],
  }));
}

export const demoPrework = [
  { id: 'sample-pre-1', ownerName: 'admin', text: '[Elementary school teachers] struggle to [plan seating arrangements that support positive peer interaction] when [classroom needs change] because [student needs and relationships must be considered together].', isExample: true },
  { id: 'sample-pre-2', ownerName: 'Alex', text: '[Grade 5 teachers] struggle to [hear from every student] during [whole-class discussions] because [a few confident voices often take most of the time].' },
  { id: 'sample-pre-3', ownerName: 'Mina', text: '[Students learning fractions] struggle to [compare different fractions] when [they only see written symbols] because [the relative size is hard to picture].' },
  { id: 'sample-pre-4', ownerName: 'Taylor', text: '[Homeroom teachers] struggle to [summarize weekly updates for families] when [news comes from several channels] because [there is no single place to collect it].' },
];

export const demoPractice = [
  { id: 'sample-practice-1', ownerName: 'Alex', name: 'My first AI-made quiz', guide: 'I followed the example and changed the question style for my class.' },
  { id: 'sample-practice-2', ownerName: 'Mina', name: 'A tiny timetable app', guide: 'I practiced adjusting the layout and button labels.' },
  { id: 'sample-practice-3', ownerName: 'Sam', name: 'Quick feedback form', guide: 'I learned how to test the form on a phone.' },
];

export const demoPrd = [
  { id: 'sample-prd-1', ownerName: 'Alex', problem: 'A few voices dominate classroom discussion.', user: 'Classroom teachers', goal: 'See participation patterns and invite quieter students in.', features: 'Tap to record a contribution; review a simple weekly view.' },
  { id: 'sample-prd-2', ownerName: 'Mina', problem: 'Fractions are difficult to compare visually.', user: 'Upper elementary students', goal: 'Explore equivalent fractions through visual models.', features: 'Interactive fraction bars and short practice prompts.' },
];
