export type CuratedIdea = {
  id: string;
  title: string;
  appIdea: string;
  features: string[];
};

export type PreworkReview = {
  status: string;
  feedback: string;
  suggestedProblem: string;
  caution: string;
  ideas: CuratedIdea[];
};
