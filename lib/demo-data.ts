import type { OutcomePost } from '@/app/components/OutcomeShowcase';
import { preworkExampleStatements } from '@/lib/prework-example';

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

export function makeDemoOutcomes(): OutcomePost[] {
  const featured = [
    { personIndex: 0, name: '별빛 카페', url: 'https://cafecabbage.vercel.app/', features: '수학 문제를 풀고 미션을 해결하며 나만의 카페를 경영하는 게이미피케이션 수학 교육 웹앱입니다.', problem: '수학 학습에 게임의 목표와 보상을 더해 꾸준히 참여할 수 있도록 돕습니다.' },
    { personIndex: 4, name: '양배추의 여름나기', url: 'https://summer-vacation-seven.vercel.app/', features: '여름방학 과제를 확인하고 방학 동안 친구들과 소통하는 웹앱입니다.', problem: '방학 과제와 친구들의 소식을 한곳에서 확인하고 나눌 수 있습니다.' },
    { personIndex: 8, name: '모두모아', url: 'https://moa-blush.vercel.app/', features: '모아의 진행에 따라 의견을 나누고 토의 내용을 기록하는 실시간 협력 토의 웹앱입니다.', problem: '모든 참여자가 의견을 나누고 토의 과정을 함께 기록하도록 지원합니다.' },
    { personIndex: 12, name: '한점한점', url: 'https://mygallery-jet.vercel.app/', features: '학생의 미술 작품을 온라인 전시 공간에서 공유하는 웹앱입니다.', problem: '학생 작품을 한곳에 전시하고 서로 감상할 수 있는 공간을 제공합니다.' },
  ] as const;
  return featured.map(({ personIndex, ...work }, index) => {
    const [name] = demoPeople[personIndex];
    return {
    id: `sample-outcome-${index + 1}`,
    ownerId: `sample-user-${personIndex + 1}`,
    ownerName: name,
    name: work.name,
    url: work.url,
    problem: work.problem,
    features: work.features,
    guide: 'Explore the working prototype, then share one concrete idea to make it more useful in a real classroom.',
    demoComments: [
      { id: `sample-comment-${index}-1`, text: 'The first screen makes the purpose easy to understand.', authorName: 'Mina', authorId: 'sample-user-2' },
      { id: `sample-comment-${index}-2`, text: 'I would love to try this with a small group.', authorName: 'Sam', authorId: 'sample-user-3' },
    ],
    demoLikes: demoPeople.slice(0, 3 + index).map((_, personOffset) => `sample-user-${personOffset + 1}`),
  }; });
}

export const demoPrework = preworkExampleStatements.map((text, index) => ({
  id: `sample-pre-${index + 1}`,
  ownerName: 'admin',
  text,
  isExample: true,
}));

export const demoPractice = [
  { id: 'sample-practice-1', ownerName: 'Alex', name: 'My first AI-made quiz', url: '/preview/project/1', guide: 'I followed the example and changed the question style for my class.' },
  { id: 'sample-practice-2', ownerName: 'Mina', name: 'A tiny timetable app', url: '/preview/project/2', guide: 'I practiced adjusting the layout and button labels.' },
  { id: 'sample-practice-3', ownerName: 'Sam', name: 'Quick feedback form', url: '/preview/project/1', guide: 'I learned how to test the form on a phone.' },
];

export const demoPrd = [
  { id: 'sample-prd-1', ownerName: 'Alex', problem: 'A few voices dominate classroom discussion.', user: 'Classroom teachers', goal: 'See participation patterns and invite quieter students in.', features: 'Tap to record a contribution; review a simple weekly view.' },
  { id: 'sample-prd-2', ownerName: 'Mina', problem: 'Fractions are difficult to compare visually.', user: 'Upper elementary students', goal: 'Explore equivalent fractions through visual models.', features: 'Interactive fraction bars and short practice prompts.' },
];
