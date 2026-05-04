import type {
  AreaProfile,
  SelfCheckAnswers,
  ScoreResult,
  RiskLevel,
  RiskContributor,
} from './types';

export function scorePersonal(p: SelfCheckAnswers['personal']): number {
  let s = 0;
  if (p.age_band === '65-74') s += 1;
  else if (p.age_band === '75-84') s += 2;
  else if (p.age_band === '85+') s += 3;

  if (p.has_chronic === 'yes') s += 1;
  if (p.takes_medication === 'yes' || p.takes_medication === 'unsure') s += 1;
  if (p.prior_heat_discomfort === 'sometimes') s += 1;
  else if (p.prior_heat_discomfort === 'often') s += 2;
  if (p.mobility === 'a_little') s += 1;
  else if (p.mobility === 'yes') s += 2;

  return clamp(s, 0, 5);
}

export function scoreHome(h: SelfCheckAnswers['home']): number {
  let s = 0;
  if (h.has_ac === 'fan_only') s += 1;
  else if (h.has_ac === 'no') s += 2;

  if (h.keeps_cool === 'sometimes') s += 1;
  else if (h.keeps_cool === 'rarely') s += 2;

  if (h.sun_exposure === 'some') s += 1;
  else if (h.sun_exposure === 'many') s += 2;

  if (h.upper_floor === 'yes') s += 1;
  if (h.knows_cool_place === 'no' || h.knows_cool_place === 'unsure') s += 1;

  return clamp(s, 0, 5);
}

export function scoreSocial(s: SelfCheckAnswers['social']): number {
  let v = 0;
  if (s.lives_alone === 'yes') v += 1;
  if (s.check_in === 'sometimes') v += 1;
  else if (s.check_in === 'no') v += 2;
  if (s.emergency_contact === 'no' || s.emergency_contact === 'unsure') v += 1;
  if (s.comm_frequency === 'few_per_week') v += 1;
  else if (s.comm_frequency === 'rarely') v += 2;
  if (s.knows_local_services === 'no') v += 1;
  return clamp(v, 0, 5);
}

export function scoreLocation(area: AreaProfile | null): number {
  if (!area) return 0;
  return clamp(area.overall_location_exposure_score, 0, 5);
}

export function deriveRiskLevel(total: number): RiskLevel {
  if (total <= 5) return 'Lower';
  if (total <= 12) return 'Moderate';
  return 'Higher';
}

export function calculateScores(
  area: AreaProfile | null,
  answers: SelfCheckAnswers
): ScoreResult {
  const locationExposureScore = scoreLocation(area);
  const personalSensitivityScore = scorePersonal(answers.personal);
  const homeCoolingRiskScore = scoreHome(answers.home);
  const socialSupportGapScore = scoreSocial(answers.social);
  const totalScore =
    locationExposureScore + personalSensitivityScore + homeCoolingRiskScore + socialSupportGapScore;

  return {
    locationExposureScore,
    personalSensitivityScore,
    homeCoolingRiskScore,
    socialSupportGapScore,
    totalScore,
    riskLevel: deriveRiskLevel(totalScore),
    contributors: collectContributors(area, answers),
  };
}

function collectContributors(area: AreaProfile | null, ans: SelfCheckAnswers): RiskContributor[] {
  const out: RiskContributor[] = [];

  if (area) {
    if (area.tree_canopy_level === 'Low') {
      out.push({
        id: 'low_canopy',
        label: 'Low tree canopy in your area',
        explanation: 'Fewer trees may mean less shade and less natural cooling in your area.',
        dimension: 'location',
      });
    }
    if (area.surface_heat_level === 'High') {
      out.push({
        id: 'high_surface_heat',
        label: 'High local surface heat',
        explanation: 'Built-up surfaces such as roads and concrete can hold heat for longer.',
        dimension: 'location',
      });
    }
    if (area.cool_place_access === 'Low') {
      out.push({
        id: 'few_cool_places',
        label: 'Limited nearby cool places',
        explanation: 'Fewer libraries or community centres nearby means fewer free places to cool down.',
        dimension: 'location',
      });
    }
  }

  const p = ans.personal;
  if (p.age_band === '75-84' || p.age_band === '85+') {
    out.push({
      id: 'older_age',
      label: 'Older age group',
      explanation: 'Older bodies regulate heat less efficiently and may feel thirst less reliably.',
      dimension: 'personal',
    });
  }
  if (p.takes_medication === 'yes' || p.takes_medication === 'unsure') {
    out.push({
      id: 'medication',
      label: 'Regular medication use',
      explanation: 'Some medicines can affect how the body responds to heat. A GP or pharmacist can advise.',
      dimension: 'personal',
    });
  }
  if (p.mobility === 'yes' || p.mobility === 'a_little') {
    out.push({
      id: 'mobility',
      label: 'Limited mobility',
      explanation: 'It can be harder to reach a cooler place quickly when temperatures rise.',
      dimension: 'personal',
    });
  }
  if (p.prior_heat_discomfort === 'often') {
    out.push({
      id: 'prior_discomfort',
      label: 'Previous discomfort in hot weather',
      explanation: 'Past heat reactions are a useful early-warning signal for future hot days.',
      dimension: 'personal',
    });
  }

  const h = ans.home;
  if (h.has_ac === 'no') {
    out.push({
      id: 'no_ac',
      label: 'No working air conditioning or fan',
      explanation: 'Without active cooling, indoor temperatures can climb close to outdoor levels.',
      dimension: 'home',
    });
  } else if (h.has_ac === 'fan_only') {
    out.push({
      id: 'fan_only',
      label: 'Fan only, no air conditioning',
      explanation: 'Fans help with air movement but do not lower air temperature on very hot days.',
      dimension: 'home',
    });
  }
  if (h.keeps_cool === 'rarely' || h.sun_exposure === 'many') {
    out.push({
      id: 'home_hot',
      label: 'Home becomes hot in the afternoon',
      explanation: 'Indoor heat builds up through the day, especially with strong sunlight.',
      dimension: 'home',
    });
  }
  if (h.knows_cool_place === 'no') {
    out.push({
      id: 'no_known_cool_place',
      label: 'No known cooler place nearby',
      explanation: 'Knowing a place to go ahead of time makes it easier to act early.',
      dimension: 'home',
    });
  }

  const s = ans.social;
  if (s.lives_alone === 'yes') {
    out.push({
      id: 'lives_alone',
      label: 'Lives alone',
      explanation: 'During heatwaves, having someone check in can help you get support earlier.',
      dimension: 'social',
    });
  }
  if (s.check_in === 'no') {
    out.push({
      id: 'no_check_in',
      label: 'No regular check-in person',
      explanation: 'A trusted check-in contact can notice early warning signs you might miss.',
      dimension: 'social',
    });
  }
  if (s.emergency_contact === 'no') {
    out.push({
      id: 'no_emergency',
      label: 'No clear emergency contact',
      explanation: 'A visible emergency contact saves time if you need help quickly.',
      dimension: 'social',
    });
  }
  if (s.comm_frequency === 'rarely') {
    out.push({
      id: 'low_communication',
      label: 'Limited regular contact with others',
      explanation: 'Regular contact helps people around you notice if something changes.',
      dimension: 'social',
    });
  }

  return out;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function riskLevelCopy(level: RiskLevel): { title: string; body: string } {
  switch (level) {
    case 'Lower':
      return {
        title: 'Lower heat vulnerability',
        body:
          'Your answers suggest fewer heat vulnerability factors. Continue checking weather alerts, keeping your home cool, and staying connected during hot days.',
      };
    case 'Moderate':
      return {
        title: 'Moderate heat vulnerability',
        body:
          'Some factors may increase your heat risk, such as limited shade in your area, reduced cooling at home, or limited regular support. Planning ahead can help reduce your risk during very hot days.',
      };
    case 'Higher':
      return {
        title: 'Higher heat vulnerability',
        body:
          'Several factors may make hot days harder for you. Consider preparing a heat plan, identifying a cooler place nearby, and arranging regular check-ins with someone you trust.',
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
    a.personal.has_chronic,
    a.personal.prior_heat_discomfort,
    a.personal.takes_medication,
    a.personal.mobility,
    a.home.has_ac,
    a.home.keeps_cool,
    a.home.sun_exposure,
    a.home.upper_floor,
    a.home.knows_cool_place,
    a.social.lives_alone,
    a.social.check_in,
    a.social.emergency_contact,
    a.social.comm_frequency,
    a.social.knows_local_services,
  ];
  return required.every((v) => v !== null);
}
