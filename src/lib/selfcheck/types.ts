export type Level3 = 'Low' | 'Moderate' | 'High';

export interface AreaProfile {
  area_id: string;
  area_name: string;
  postcode: string;
  lat: number;
  lng: number;
  tree_canopy_level: Level3;
  tree_canopy_pct: number;
  surface_heat_level: Level3;
  cool_place_access: Level3;
  cool_place_count_within_1km: number;
  older_population_level: Level3;
  older_population_pct: number;
  overall_location_exposure_score: number;
}

export type CoolPlaceType = 'library' | 'community_centre' | 'shopping_centre' | 'park';

export interface CoolPlace {
  id: string;
  name: string;
  type: CoolPlaceType;
  lat: number;
  lng: number;
  distance_m: number;
  open_hours: string;
  features: string[];
}

export interface SuburbIndexEntry {
  key: string;
  name: string;
  postcode: string;
  state: string;
  lat: number;
  lng: number;
}

export type AgeBand = '60-64' | '65-74' | '75-84' | '85+';
export type YesNoUnsure = 'yes' | 'no' | 'unsure' | 'prefer_not';
export type Frequency = 'never' | 'sometimes' | 'often';
export type AcOption = 'yes' | 'fan_only' | 'no' | 'unsure';
export type CapacityOption = 'usually' | 'sometimes' | 'rarely';
export type SunOption = 'no' | 'some' | 'many';
export type MobilityOption = 'no' | 'a_little' | 'yes';
export type CommFreq = 'daily' | 'few_per_week' | 'rarely';

export interface PersonalAnswers {
  age_band: AgeBand | null;
  has_chronic: YesNoUnsure | null;
  prior_heat_discomfort: Frequency | null;
  takes_medication: YesNoUnsure | null;
  mobility: MobilityOption | null;
}

export interface HomeAnswers {
  has_ac: AcOption | null;
  keeps_cool: CapacityOption | null;
  sun_exposure: SunOption | null;
  upper_floor: YesNoUnsure | null;
  knows_cool_place: YesNoUnsure | null;
}

export interface SocialAnswers {
  lives_alone: 'yes' | 'no' | 'sometimes' | null;
  check_in: 'yes' | 'sometimes' | 'no' | null;
  emergency_contact: YesNoUnsure | null;
  comm_frequency: CommFreq | null;
  knows_local_services: YesNoUnsure | null;
}

export interface SelfCheckAnswers {
  personal: PersonalAnswers;
  home: HomeAnswers;
  social: SocialAnswers;
}

export interface DimensionScores {
  locationExposureScore: number;
  personalSensitivityScore: number;
  homeCoolingRiskScore: number;
  socialSupportGapScore: number;
}

export type RiskLevel = 'Lower' | 'Moderate' | 'Higher';

export interface ScoreResult extends DimensionScores {
  totalScore: number;
  riskLevel: RiskLevel;
  contributors: RiskContributor[];
}

export interface RiskContributor {
  id: string;
  label: string;
  explanation: string;
  dimension: 'location' | 'personal' | 'home' | 'social';
}

export interface HeatSnapshot {
  current_temp: number | null;
  max_today: number | null;
  uv_max_today: number | null;
  apparent_max_today: number | null;
  daily: DailyForecast[];
  alert_level: HeatAlertLevel;
  consecutive_hot_days: number;
  forecast_peak_3d: number;
}

export type HeatAlertLevel = 'none' | 'low' | 'severe' | 'extreme';

export interface DailyForecast {
  date: string;
  max: number;
  min: number;
  uv_max: number;
  apparent_max: number;
}
