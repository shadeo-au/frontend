import type {
  HeatSnapshot,
  HousePlan,
  HouseActionCard,
  HouseWindow,
  Orientation,
} from './types';
import {
  getCurrentSunOrientation,
  getPeakSunOrientation,
  isAdjacentOrientation,
  isOppositeOrientation,
} from './sun-position';
import { orientationForWall } from './grid-geometry';

export interface HousePlannerInput {
  plan: HousePlan;
  snapshot: HeatSnapshot | null;
  lat: number;
  lng: number;
  now?: Date;
}

export interface HousePlannerAnalysis {
  actions: HouseActionCard[];
  sunlitNow: HouseWindow[];
  sunlitPeak: HouseWindow[];
  peakSunOrientation: Orientation;
  currentSunOrientation: Orientation | null;
}

interface RuleCtx {
  plan: HousePlan;
  snapshot: HeatSnapshot | null;
  maxToday: number;
  sunlitNow: HouseWindow[];
  sunlitPeak: HouseWindow[];
  peakSunOrientation: Orientation;
  currentSunOrientation: Orientation | null;
  roomLabel: (roomId: string) => string;
}

interface Rule {
  id: string;
  category: HouseActionCard['category'];
  severity?: HouseActionCard['severity'];
  weight: number;
  match: (ctx: RuleCtx) => boolean;
  build: (ctx: RuleCtx) => Omit<HouseActionCard, 'id' | 'category' | 'severity'>;
}

const RULES: Rule[] = [
  {
    id: 'HE1',
    category: 'emergency',
    severity: 'urgent',
    weight: 100,
    match: ({ snapshot }) => snapshot?.alert_level === 'extreme',
    build: () => ({
      title: 'Extreme heat — close everything that faces the sun',
      body:
        'On extreme-heat days, keep all sun-facing windows and external doors closed during daylight. Open them only after sunset when outdoor air drops below indoor air.',
      why: 'Today\'s forecast reached extreme heat thresholds — outdoor air will be hotter than indoor air for most of the day.',
    }),
  },
  {
    id: 'HE2',
    category: 'emergency',
    severity: 'urgent',
    weight: 90,
    match: ({ snapshot, plan }) =>
      snapshot?.alert_level === 'extreme' &&
      plan.floorLevel === 'top' &&
      plan.windows.every((w) => !w.hasCurtain),
    build: () => ({
      title: 'Top floor with no curtains on an extreme day — plan to head out',
      body:
        'Top-floor rooms heat fastest and stay hot longest. With no curtains in place, indoor temperatures can become dangerous. A library or shopping centre for a few hours is the safest option.',
      why: 'Extreme heat + top floor + no curtains marked on any window.',
    }),
  },
  {
    id: 'HW1',
    category: 'shade',
    severity: 'warn',
    weight: 22,
    match: ({ sunlitPeak, maxToday }) =>
      maxToday >= 30 && sunlitPeak.some((w) => !w.hasCurtain),
    build: ({ sunlitPeak, roomLabel }) => {
      const w = sunlitPeak.find((x) => !x.hasCurtain)!;
      return {
        title: `Cover the ${roomLabel(w.roomId)} window before midday`,
        body: `This ${w.orientation}-facing window has no curtain or blind, and it will catch direct sun this afternoon. A spare sheet, towel, or even cardboard taped over the glass works if no blind is available.`,
        why: `Forecast peak ≥ 30°C and this window will face the sun at peak heat.`,
        targetWindowId: w.id,
        targetRoomId: w.roomId,
      };
    },
  },
  {
    id: 'HW2',
    category: 'shade',
    weight: 16,
    match: ({ sunlitPeak, maxToday }) =>
      maxToday >= 32 &&
      sunlitPeak.length >= 2 &&
      sunlitPeak.filter((w) => !w.hasCurtain).length >= 2,
    build: ({ sunlitPeak, roomLabel }) => {
      const list = sunlitPeak
        .filter((w) => !w.hasCurtain)
        .map((w) => roomLabel(w.roomId))
        .join(', ');
      return {
        title: 'Several uncovered windows will face the afternoon sun',
        body: `${list} all have windows in the line of direct sun this afternoon. Cover the largest one first — it makes the biggest difference.`,
        why: 'Forecast peak ≥ 32°C and multiple uncovered windows in the sun.',
      };
    },
  },
  {
    id: 'HA1',
    category: 'airflow',
    weight: 14,
    match: ({ plan, snapshot, maxToday }) => {
      if (!snapshot || maxToday >= 36) return false;
      const orientations = new Set(plan.windows.map((w) => w.orientation));
      for (const o of orientations) {
        for (const p of orientations) {
          if (isOppositeOrientation(o, p)) return true;
        }
      }
      return false;
    },
    build: () => ({
      title: 'Open windows on opposite walls for cross-breeze',
      body:
        'Your plan has windows facing opposite directions. Once the outdoor air drops below indoor air (usually after 6pm), open both for 30-60 minutes to flush hot air out.',
      why: 'Opposite-facing windows create the strongest natural airflow.',
    }),
  },
  {
    id: 'HA2',
    category: 'airflow',
    severity: 'warn',
    weight: 12,
    match: ({ maxToday, snapshot }) =>
      maxToday >= 36 || snapshot?.alert_level === 'severe' || snapshot?.alert_level === 'extreme',
    build: () => ({
      title: 'Keep all windows shut until sundown',
      body:
        'When it is hotter outside than inside, opening windows makes the home hotter, not cooler. Open them only once the outdoor temperature drops below your indoor temperature.',
      why: 'Forecast peak ≥ 36°C or heat alert issued — outdoor air will exceed indoor air all afternoon.',
    }),
  },
  {
    id: 'HF1',
    category: 'fan',
    weight: 18,
    match: ({ sunlitPeak, maxToday }) =>
      maxToday >= 30 && sunlitPeak.some((w) => !w.fanNearby),
    build: ({ sunlitPeak, roomLabel }) => {
      const w = sunlitPeak.find((x) => !x.fanNearby)!;
      return {
        title: `Move a fan into the ${roomLabel(w.roomId)}`,
        body: `Place the fan a few steps back from the ${w.orientation}-facing window, pointing toward where you sit. Aim it across your body, not directly at your face — this is what helps you cool down.`,
        why: 'This room has a sun-facing window and no fan marked nearby.',
        targetWindowId: w.id,
        targetRoomId: w.roomId,
      };
    },
  },
  {
    id: 'HF2',
    category: 'fan',
    weight: 10,
    match: ({ plan, maxToday }) =>
      maxToday >= 32 &&
      plan.windows.some((w) => w.fanNearby) &&
      plan.windows.some((w) => isOppositeOrientation(w.orientation, plan.windows.find((x) => x.fanNearby)!.orientation)),
    build: ({ plan, roomLabel }) => {
      const fanWin = plan.windows.find((w) => w.fanNearby)!;
      const exit = plan.windows.find((w) => isOppositeOrientation(w.orientation, fanWin.orientation));
      return {
        title: 'Use the fan to push hot air out the opposite window',
        body: `Aim the fan toward the ${exit ? roomLabel(exit.roomId) : 'far'} window once the outside air is cooler. This pulls cool air in on the other side without needing to move the fan.`,
        why: 'You have a fan on one side and an opposite-facing window — this setup creates a one-room wind tunnel.',
      };
    },
  },
  {
    id: 'HD1',
    category: 'shade',
    weight: 8,
    match: ({ plan, peakSunOrientation, maxToday }) =>
      maxToday >= 32 &&
      plan.doors.some((d) => d.isExternal) &&
      isAdjacentOrientation(
        peakSunOrientation,
        // map door wall → orientation through the plan's facing
        orientationOfDoor(plan, plan.doors.find((d) => d.isExternal)!),
      ),
    build: () => ({
      title: 'Keep external doors closed during the afternoon',
      body:
        'Even a few minutes of an open door on a hot day brings in a lot of heat. Use a side window or a back door for ventilation instead, and only when the outdoor air is cooler.',
      why: 'Your main external door faces toward the afternoon sun.',
    }),
  },
  {
    id: 'HM1',
    category: 'planning',
    weight: 7,
    match: ({ plan, maxToday }) =>
      maxToday >= 32 &&
      plan.windows.length > 0 &&
      plan.windows.every((w) => !w.fanNearby),
    build: () => ({
      title: 'Set up one fan before the afternoon',
      body:
        "You haven't marked a fan near any window. Even one pedestal fan, placed a few steps from a shaded window and pointing toward where you spend time, makes a real difference on hot days.",
      why: 'Forecast peak ≥ 32°C and no fans marked anywhere in the plan.',
    }),
  },
  {
    id: 'HM2',
    category: 'planning',
    weight: 6,
    match: ({ plan, maxToday }) =>
      maxToday >= 30 &&
      plan.windows.length > 0 &&
      plan.windows.every((w) => !w.hasCurtain),
    build: () => ({
      title: 'No curtains or blinds marked anywhere',
      body:
        'Covering even one or two of the sun-facing windows is the cheapest, fastest way to lower indoor temperature. Cardboard, a folded sheet, or aluminium foil on the glass all work.',
      why: 'Forecast peak ≥ 30°C and no curtains marked on any window.',
    }),
  },
  {
    id: 'HM3',
    category: 'planning',
    weight: 5,
    match: ({ maxToday }) => maxToday < 28,
    build: () => ({
      title: 'A mild day — a good day to set up for the next hot one',
      body:
        'Today is comfortable, which makes it the easiest day this week to put curtains up, move a fan into the right room, or buy a window covering for the rooms with most sun.',
      why: 'Forecast peak below 28°C — a low-stress day to prepare your home.',
    }),
  },
];

function orientationOfDoor(plan: HousePlan, door: { wall: 'top' | 'right' | 'bottom' | 'left' }): Orientation {
  return orientationForWall(door.wall, plan.houseFacing);
}

export function analyseHousePlan(input: HousePlannerInput): HousePlannerAnalysis {
  const now = input.now ?? new Date();
  const peakSunOrientation = getPeakSunOrientation(now, input.lat, input.lng);
  const currentSunOrientation = getCurrentSunOrientation(now, input.lat, input.lng);

  const sunlitPeak = input.plan.windows.filter((w) =>
    isAdjacentOrientation(w.orientation, peakSunOrientation),
  );
  const sunlitNow = currentSunOrientation
    ? input.plan.windows.filter((w) => isAdjacentOrientation(w.orientation, currentSunOrientation))
    : [];

  const maxToday = input.snapshot?.max_today ?? 0;
  const roomLabel = (roomId: string) => input.plan.rooms.find((r) => r.id === roomId)?.label ?? 'room';

  const ctx: RuleCtx = {
    plan: input.plan,
    snapshot: input.snapshot,
    maxToday,
    sunlitNow,
    sunlitPeak,
    peakSunOrientation,
    currentSunOrientation,
    roomLabel,
  };

  const matched = RULES
    .filter((r) => r.match(ctx))
    .sort((a, b) => b.weight - a.weight);

  const actions: HouseActionCard[] = matched.map((r) => {
    const built = r.build(ctx);
    return {
      id: r.id,
      category: r.category,
      severity: r.severity ?? 'info',
      ...built,
    };
  });

  return {
    actions,
    sunlitNow,
    sunlitPeak,
    peakSunOrientation,
    currentSunOrientation,
  };
}

export const HOUSE_CATEGORY_LABEL: Record<HouseActionCard['category'], string> = {
  emergency: 'Priority',
  shade: 'Shade',
  airflow: 'Airflow',
  fan: 'Fan placement',
  planning: 'Plan ahead',
};
