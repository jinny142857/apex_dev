export const selfAssessmentItems = [
  { key: 'privacy', title: 'Protecting personal data', description: 'No real student or sensitive information is exposed.' },
  { key: 'attribution', title: 'Taking responsibility and crediting sources', description: 'I checked AI-generated content and credited borrowed materials.' },
  { key: 'publicGood', title: 'Helping the school community', description: 'The app benefits its users and considers others affected.' },
  { key: 'explainability', title: 'Making the app understandable', description: 'Users can tell what the app does and how it works.' },
  { key: 'safeTesting', title: 'Testing safely', description: 'Key actions were checked, and possible risks were considered.' },
] as const;

export type SelfAssessmentKey = typeof selfAssessmentItems[number]['key'];
export type OutcomeSelfAssessment = Record<SelfAssessmentKey, number | null>;

export const emptySelfAssessment: OutcomeSelfAssessment = {
  privacy: null,
  attribution: null,
  publicGood: null,
  explainability: null,
  safeTesting: null,
};

export function validSelfAssessment(value?: Partial<OutcomeSelfAssessment> | null) {
  return selfAssessmentItems.every(({ key }) => Number.isInteger(value?.[key]) && Number(value?.[key]) >= 1 && Number(value?.[key]) <= 5);
}

export function normalizeSelfAssessment(value?: Partial<OutcomeSelfAssessment> | null, scale?: number): OutcomeSelfAssessment {
  return Object.fromEntries(selfAssessmentItems.map(({ key }) => {
    const score = value?.[key];
    if (!Number.isInteger(score) || score === null || score === undefined || score < 1) return [key, null];
    return [key, scale === 5 ? (score <= 5 ? score : null) : (score <= 10 ? Math.ceil(score / 2) : null)];
  })) as OutcomeSelfAssessment;
}
