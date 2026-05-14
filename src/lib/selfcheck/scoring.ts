import type {
  AreaProfile,
  SelfCheckAnswers,
  ScoreResult,
  RiskLevel,
  RiskContributor,
} from './types';

export function scoreEnvironment(ans: SelfCheckAnswers): number {
  return q1CoolPlaces(ans) + q2OutdoorNeed(ans);
}

export function scorePersonal(p: SelfCheckAnswers['personal']): number {
  return q3Age(p) + q4HeatDiscomfort(p);
}

export function scoreHome(h: SelfCheckAnswers['home']): number {
  return q5CoolingEquipment(h) + q6HomeHeat(h) + q7CoolDestination(h);
}

export function scoreSocial(s: SelfCheckAnswers['social']): number {
  return q8LivingSituation(s) + q9CheckIn(s);
}

export function scoreLocation(_area: AreaProfile | null): number {
  return 0;
}

export function deriveRiskLevel(total20: number): RiskLevel {
  if (total20 <= 6) return 'Lower';
  if (total20 <= 13) return 'Moderate';
  return 'Higher';
}

export function calculateScores(
  _area: AreaProfile | null,
  answers: SelfCheckAnswers
): ScoreResult {
  const locationExposureScore = scoreEnvironment(answers);
  const personalSensitivityScore = scorePersonal(answers.personal);
  const homeCoolingRiskScore = scoreHome(answers.home);
  const socialSupportGapScore = scoreSocial(answers.social);
  const rawTotal =
    locationExposureScore + personalSensitivityScore + homeCoolingRiskScore + socialSupportGapScore;
  const totalScore = Math.round((rawTotal / 18) * 20);

  return {
    locationExposureScore,
    personalSensitivityScore,
    homeCoolingRiskScore,
    socialSupportGapScore,
    totalScore,
    riskLevel: deriveRiskLevel(totalScore),
    contributors: collectContributors(answers),
  };
}

function q1CoolPlaces(ans: SelfCheckAnswers): number {
  const value = ans.social.knows_local_services;
  if (value === 'yes') return 0;
  if (value === 'unsure') return 1;
  return 2;
}

function q2OutdoorNeed(ans: SelfCheckAnswers): number {
  const value = ans.personal.mobility;
  if (value === 'no') return 0;
  if (value === 'a_little') return 1;
  return 2;
}

function q3Age(p: SelfCheckAnswers['personal']): number {
  if (p.age_band === '65-74') return 0;
  if (p.age_band === '75-84') return 1;
  return 2;
}

function q4HeatDiscomfort(p: SelfCheckAnswers['personal']): number {
  if (p.prior_heat_discomfort === 'never') return 0;
  if (p.prior_heat_discomfort === 'sometimes') return 1;
  return 2;
}

function q5CoolingEquipment(h: SelfCheckAnswers['home']): number {
  if (h.has_ac === 'yes') return 0;
  if (h.has_ac === 'fan_only') return 1;
  return 2;
}

function q6HomeHeat(h: SelfCheckAnswers['home']): number {
  if (h.keeps_cool === 'usually') return 0;
  if (h.keeps_cool === 'sometimes') return 1;
  return 2;
}

function q7CoolDestination(h: SelfCheckAnswers['home']): number {
  if (h.knows_cool_place === 'yes') return 0;
  if (h.knows_cool_place === 'unsure') return 1;
  return 2;
}

function q8LivingSituation(s: SelfCheckAnswers['social']): number {
  if (s.lives_alone === 'no') return 0;
  if (s.lives_alone === 'sometimes') return 1;
  return 2;
}

function q9CheckIn(s: SelfCheckAnswers['social']): number {
  if (s.check_in === 'yes') return 0;
  if (s.check_in === 'sometimes') return 1;
  return 2;
}

function collectContributors(ans: SelfCheckAnswers): RiskContributor[] {
  const contributors: RiskContributor[] = [];
  const dimensions = [
    {
      score: scoreHome(ans.home),
      dimension: 'home' as const,
      label: 'Limited home cooling conditions',
      explanation: 'Your home may become hot and may not cool down easily.',
    },
    {
      score: scoreEnvironment(ans),
      dimension: 'location' as const,
      label: 'Frequent outdoor exposure or limited cool places',
      explanation: 'In hot weather, you may come into contact with high-temperature environments more often.',
    },
    {
      score: scorePersonal(ans.personal),
      dimension: 'personal' as const,
      label: 'Higher body sensitivity to heat',
      explanation: 'When the weather becomes hot, you may be more likely to feel uncomfortable.',
    },
    {
      score: scoreSocial(ans.social),
      dimension: 'social' as const,
      label: 'Limited social support',
      explanation: 'During hot weather, fewer people may be available to contact or check in on you.',
    },
  ];

  const primary = dimensions.reduce((best, dimension) => (
    dimension.score > best.score ? dimension : best
  ));
  if (primary.score <= 0) return contributors;

  contributors.push({
    id: primary.dimension,
    label: primary.label,
    explanation: primary.explanation,
    dimension: primary.dimension,
  });

  return contributors;
}

export function riskLevelCopy(level: RiskLevel): { title: string; body: string } {
  switch (level) {
    case 'Lower':
      return {
        title: 'Low Risk',
        body: 'You are generally adapting well in hot weather. Keep your normal routine and drink enough water during summer.',
      };
    case 'Moderate':
      return {
        title: 'Moderate Risk',
        body: 'In hot weather, you may occasionally feel uncomfortable. Pay attention to cooling, hydration, and avoiding the hottest time of day.',
      };
    case 'Higher':
      return {
        title: 'High Risk',
        body: 'Your main heat risk comes from the highest-scoring area of your answers. Follow the targeted recommendations and safety reminder.',
      };
  }
}

export function emptyAnswers(): SelfCheckAnswers {
  return {
    personal: {
      age_band: null,
      has_chronic: null,
      prior_heat_discomfort: null,
      takes_medication: null,
      mobility: null,
    },
    home: {
      has_ac: null,
      keeps_cool: null,
      sun_exposure: null,
      upper_floor: null,
      knows_cool_place: null,
    },
    social: {
      lives_alone: null,
      check_in: null,
      emergency_contact: null,
      comm_frequency: null,
      knows_local_services: null,
    },
  };
}

export function isAnswerComplete(a: SelfCheckAnswers): boolean {
  const required: (string | null)[] = [
    a.personal.age_band,
    a.personal.prior_heat_discomfort,
    a.personal.mobility,
    a.home.has_ac,
    a.home.keeps_cool,
    a.home.knows_cool_place,
    a.social.lives_alone,
    a.social.check_in,
    a.social.knows_local_services,
  ];
  return required.every((v) => v !== null);
}
