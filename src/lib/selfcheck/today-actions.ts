import type { AreaProfile, SelfCheckAnswers, HeatSnapshot, ScoreResult } from './types';

export type ActionCategory =
  | 'hydration'
  | 'home_cooling'
  | 'going_out'
  | 'social'
  | 'cool_place'
  | 'planning';

export interface ActionCard {
  id: string;
  category: ActionCategory;
  title: string;
  body: string;
  why?: string;
  pinned?: boolean;
}

interface RuleContext {
  today: HeatSnapshot;
  area: AreaProfile | null;
  answers: SelfCheckAnswers;
  scores: ScoreResult;
  hour: number;
}

interface Rule {
  id: string;
  category: ActionCategory;
  weight: number;
  pinned?: boolean;
  match: (ctx: RuleContext) => boolean;
  build: (ctx: RuleContext) => { title: string; body: string; why?: string };
}

const RULES: Rule[] = [
  {
    id: 'E1',
    category: 'hydration',
    weight: 100,
    pinned: true,
    match: ({ today }) => today.alert_level === 'extreme',
    build: () => ({
      title: 'Extreme heat — drink water and stay indoors',
      body:
        'Drink water often even if not thirsty. Stay in a cool room. Call 000 if you feel confused, dizzy, or stop sweating.',
      why: 'Today reached extreme heat thresholds for your area.',
    }),
  },
  {
    id: 'E2',
    category: 'social',
    weight: 100,
    pinned: true,
    match: ({ today, answers }) =>
      today.alert_level === 'extreme' && answers.social.lives_alone === 'yes',
    build: () => ({
      title: 'Ask someone to come check on you today',
      body:
        'In extreme heat and living alone, please ask one person to visit or call you in person — not just message.',
      why: 'You marked living alone, and today is an extreme heat day.',
    }),
  },
  {
    id: 'H1',
    category: 'hydration',
    weight: 7,
    match: ({ today, answers }) =>
      (today.max_today ?? 0) >= 32 && (answers.personal.age_band === '75-84' || answers.personal.age_band === '85+'),
    build: () => ({
      title: 'Drink a glass of water now and again at lunchtime',
      body:
        "Even if you don't feel thirsty. Older bodies feel thirst less reliably, and today is hot enough that small sips matter.",
      why: 'Forecast peak ≥ 32°C and you are in an older age band.',
    }),
  },
  {
    id: 'H2',
    category: 'hydration',
    weight: 6,
    match: ({ today, answers }) =>
      (today.max_today ?? 0) >= 32 &&
      (answers.personal.takes_medication === 'yes' || answers.personal.takes_medication === 'unsure'),
    build: () => ({
      title: 'Call your pharmacist about medication and heat',
      body:
        'Some medicines affect how the body handles heat. A pharmacist can review yours in about five minutes by phone.',
      why: 'Forecast peak ≥ 32°C and you marked taking medication or being unsure.',
    }),
  },
  {
    id: 'C1',
    category: 'home_cooling',
    weight: 8,
    match: ({ today, answers, area }) =>
      (today.max_today ?? 0) >= 32 &&
      answers.home.has_ac === 'no' &&
      area?.surface_heat_level === 'High',
    build: ({ area }) => ({
      title: 'No AC and a hot suburb today — close blinds before 10am',
      body: `Then plan to visit a cooler place if your home becomes uncomfortable. ${area?.area_name} tends to retain heat into the evening.`,
      why: `Forecast peak ≥ 32°C, no air conditioning, and ${area?.area_name} has high surface heat.`,
    }),
  },
  {
    id: 'C2',
    category: 'home_cooling',
    weight: 6,
    match: ({ today, answers, hour }) =>
      (today.max_today ?? 0) >= 32 && answers.home.keeps_cool !== 'usually' && hour < 12,
    build: () => ({
      title: 'Prepare one cool room before midday',
      body:
        'Choose one room: close its door, draw the blinds, and set up a fan now. Cooling one room is much easier than cooling the whole house.',
      why: 'Forecast peak ≥ 32°C and you said your home does not always stay cool.',
    }),
  },
  {
    id: 'C3',
    category: 'home_cooling',
    weight: 7,
    match: ({ today, answers }) =>
      (today.max_today ?? 0) >= 36 && answers.home.upper_floor === 'yes',
    build: () => ({
      title: 'Upper-floor homes hold heat longest — plan an out-trip',
      body:
        'A nearby library or shopping centre is open and air-conditioned today. Even an hour helps your body recover.',
      why: 'Forecast peak ≥ 36°C and you live on an upper floor.',
    }),
  },
  {
    id: 'M1',
    category: 'going_out',
    weight: 7,
    match: ({ today, answers }) =>
      (today.uv_max_today ?? 0) >= 8 && (answers.personal.mobility === 'a_little' || answers.personal.mobility === 'yes'),
    build: () => ({
      title: 'Avoid going out between 11am and 4pm if you can',
      body:
        "Today's UV is very high, and you've told us walking is harder for you. If you must go out, ask someone to come along.",
      why: 'UV ≥ 8 today and you marked limited mobility.',
    }),
  },
  {
    id: 'M2',
    category: 'going_out',
    weight: 6,
    match: ({ today, answers }) =>
      (today.max_today ?? 0) >= 32 &&
      answers.personal.mobility !== 'no' &&
      answers.social.lives_alone === 'yes',
    build: () => ({
      title: 'Ask someone to help with errands today',
      body:
        'Heat is harder when carrying groceries. A neighbour, family member, or carer can help — even a phone call to delay till tomorrow is fine.',
      why: 'Hot day, limited mobility, and you live alone.',
    }),
  },
  {
    id: 'M3',
    category: 'going_out',
    weight: 5,
    match: ({ today, area }) =>
      (today.max_today ?? 0) >= 32 && area?.tree_canopy_level === 'Low',
    build: ({ area }) => ({
      title: `Choose shaded streets for any walks in ${area?.area_name}`,
      body:
        'Look for routes past parks or tree-lined streets rather than open footpaths. Even a small detour can lower your sun exposure.',
      why: `Hot day and ${area?.area_name} has limited tree canopy.`,
    }),
  },
  {
    id: 'S1',
    category: 'social',
    weight: 9,
    match: ({ today, answers }) =>
      (today.max_today ?? 0) >= 32 &&
      answers.social.lives_alone === 'yes' &&
      answers.social.check_in === 'no',
    build: () => ({
      title: 'Send one message asking someone to check in tonight',
      body:
        'A short text to a family member, neighbour, or friend is enough — "Hot day, please call me later" works well.',
      why: 'Hot day, you live alone, and no one regularly checks in.',
    }),
  },
  {
    id: 'S2',
    category: 'social',
    weight: 5,
    match: ({ today, answers }) =>
      (today.max_today ?? 0) >= 32 &&
      (answers.social.emergency_contact === 'no' || answers.social.emergency_contact === 'unsure'),
    build: () => ({
      title: 'Save one emergency contact where you can see it',
      body:
        'Family member, neighbour, or 000 — write it on the fridge or save in your phone favourites. Once is enough.',
      why: 'Hot day and you marked having no clear emergency contact.',
    }),
  },
  {
    id: 'S3',
    category: 'social',
    weight: 7,
    match: ({ today, answers }) =>
      (today.alert_level === 'severe' || today.alert_level === 'extreme') &&
      answers.social.lives_alone === 'yes',
    build: () => ({
      title: 'Call family today rather than waiting for them',
      body:
        'A heat alert is forecast for your area. If you usually talk to family weekly, today is a good day to call rather than wait.',
      why: 'Heat alert level is elevated and you live alone.',
    }),
  },
  {
    id: 'S4',
    category: 'social',
    weight: 4,
    match: ({ today, answers, area }) =>
      (today.max_today ?? 0) >= 32 &&
      answers.social.comm_frequency === 'rarely' &&
      area?.older_population_level === 'High',
    build: ({ area }) => ({
      title: 'A short chat with a neighbour today helps both of you',
      body: `Many of your neighbours in ${area?.area_name} are also seniors. A two-minute conversation is real support on a hot day.`,
      why: `${area?.area_name} has many older residents, and you said you don't talk to others often.`,
    }),
  },
  {
    id: 'P1',
    category: 'cool_place',
    weight: 6,
    match: ({ today, answers }) =>
      (today.max_today ?? 0) >= 32 &&
      answers.home.has_ac === 'no' &&
      answers.home.knows_cool_place === 'no',
    build: () => ({
      title: 'Find a free, air-conditioned spot from the list above',
      body:
        'Most libraries welcome people just dropping in for a few hours. No purchase needed, with seating and water.',
      why: 'Hot day, no AC at home, and no known cool place.',
    }),
  },
  {
    id: 'P2',
    category: 'cool_place',
    weight: 5,
    match: ({ today, area }) =>
      (today.alert_level === 'severe' || today.alert_level === 'extreme') &&
      area?.cool_place_access === 'High',
    build: ({ area }) => ({
      title: `Several cool places are easy to reach from ${area?.area_name}`,
      body: 'Even an hour at a library helps your body recover. Bring water and rest — you do not need to plan a long visit.',
      why: 'Heat alert is elevated and your area has good access to cool public places.',
    }),
  },
  {
    id: 'MP1',
    category: 'planning',
    weight: 5,
    match: ({ today, scores }) =>
      today.forecast_peak_3d >= 36 && scores.socialSupportGapScore >= 3 && (today.max_today ?? 0) < 32,
    build: () => ({
      title: 'A hot stretch is coming — line up your check-in person now',
      body:
        'Today is mild, which makes it the easiest day this week to ask one trusted person to be your check-in for the hot days.',
      why: 'Forecast within 3 days reaches ≥ 36°C, and your support score is elevated.',
    }),
  },
  {
    id: 'MP2',
    category: 'planning',
    weight: 6,
    match: ({ today, answers }) =>
      today.consecutive_hot_days >= 2 && answers.personal.prior_heat_discomfort === 'often',
    build: () => ({
      title: 'Take it slower than yesterday — heat builds up',
      body:
        "It's been hot for several days, and your body has been working harder. Plan a quiet day, drink early, and rest in a cool spot.",
      why: 'Multiple consecutive hot days and you have a history of heat discomfort.',
    }),
  },
  {
    id: 'D1',
    category: 'planning',
    weight: 4,
    match: ({ today, scores }) => (today.max_today ?? 0) < 28 && scores.totalScore >= 13,
    build: () => ({
      title: 'A mild day — a good day to plan ahead',
      body:
        'Identify one cool place near you and choose one trusted person to check in on hot days. Two small steps that pay off later.',
      why: 'Mild forecast and your overall score suggests several factors to prepare for.',
    }),
  },
  {
    id: 'D2',
    category: 'planning',
    weight: 2,
    match: ({ today, scores }) => (today.max_today ?? 0) < 28 && scores.totalScore < 6,
    build: () => ({
      title: 'A pleasant day — keep an eye on weather alerts',
      body:
        'Continue to stay connected with people around you who may be more affected on hotter days.',
      why: 'Mild forecast and a low overall vulnerability score.',
    }),
  },
];

export function pickTodayActions(
  today: HeatSnapshot,
  area: AreaProfile | null,
  answers: SelfCheckAnswers,
  scores: ScoreResult,
  now: Date = new Date()
): ActionCard[] {
  const ctx: RuleContext = { today, area, answers, scores, hour: now.getHours() };

  const matched = RULES.filter((r) => r.match(ctx))
    .map((r) => ({
      rule: r,
      score: r.weight + heatBonus(today, r),
    }))
    .sort((a, b) => b.score - a.score);

  const pinned: ActionCard[] = [];
  const seenCats = new Set<ActionCategory>();
  const rest: ActionCard[] = [];

  for (const { rule } of matched) {
    const built = rule.build(ctx);
    const card: ActionCard = {
      id: rule.id,
      category: rule.category,
      pinned: rule.pinned,
      ...built,
    };
    if (rule.pinned) {
      pinned.push(card);
      continue;
    }
    if (seenCats.has(rule.category)) continue;
    seenCats.add(rule.category);
    rest.push(card);
    if (rest.length >= 3) break;
  }

  return [...pinned, ...rest];
}

function heatBonus(today: HeatSnapshot, rule: Rule): number {
  if (rule.pinned) return 0;
  const t = today.max_today ?? 0;
  if (t >= 36 && rule.weight >= 6) return 2;
  if (t >= 32 && rule.weight >= 5) return 1;
  return 0;
}

export const CATEGORY_LABEL: Record<ActionCategory, string> = {
  hydration: 'Hydration',
  home_cooling: 'Home cooling',
  going_out: 'Going out',
  social: 'Support',
  cool_place: 'Cool places',
  planning: 'Plan ahead',
};
