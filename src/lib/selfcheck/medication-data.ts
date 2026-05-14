/**
 * Medication × heat evidence base, derived from docs/MedicationHeatEvidence.md.
 * Every claim in this file is sourced via the `sources` array on each entry.
 * Never display warning text that is not present here.
 */

export type MedicationTier = 'A' | 'B' | 'C';

export type RiskMechanism =
  | 'anticholinergic_high'   // ACB scale = 3
  | 'thermoregulation_central'
  | 'sweat_inhibition'
  | 'sedation'
  | 'volume_depletion'
  | 'electrolyte_disturbance'
  | 'hyponatraemia_siadh'
  | 'renal_autoregulation'
  | 'hypotension_cardiac_output'
  | 'beta_blockade_nonselective'
  | 'hypoglycaemia'
  | 'metabolic_increase';

export interface MedicationSource {
  id: string;
  short: string;
  citation: string;
  url: string;
}

export interface Medication {
  id: string;
  generic: string;
  brands_au: string[];
  atc?: string;
  tier: MedicationTier;
  mechanisms: RiskMechanism[];
  /** Numbered source ids — must match keys of SOURCES. */
  sources: string[];
  /** Short, plain-English explanation (one sentence) of what happens on hot days. */
  note: string;
  /** One concrete action the person can take. Never says to stop the medicine. */
  tip: string;
  /** Higher level grouping for combination rules. */
  group:
    | 'anticholinergic'
    | 'antipsychotic'
    | 'antidepressant'
    | 'benzodiazepine'
    | 'antiparkinson'
    | 'antiepileptic'
    | 'beta_blocker_nonselective'
    | 'beta_blocker_selective'
    | 'loop_diuretic'
    | 'thiazide_diuretic'
    | 'ace_inhibitor'
    | 'arb'
    | 'ccb'
    | 'diabetes_insulin_sulfonylurea'
    | 'diabetes_sglt2'
    | 'antihistamine_second_gen';
}

export interface CombinationRule {
  id: string;
  label: string;
  trigger: (selected: Medication[]) => boolean;
  message: string;
  tip: string;
  sources: string[];
  escalateTo: MedicationTier;
}

// ─── Sources ──────────────────────────────────────────────────────────────

export const SOURCES: Record<string, MedicationSource> = {
  S1: {
    id: 'S1',
    short: 'Bouchama 2007 (meta-analysis)',
    citation:
      'Bouchama A, Dehbi M, Mohamed G, et al. Prognostic factors in heat wave–related deaths: a meta-analysis. Arch Intern Med. 2007;167(20):2170–2176.',
    url: 'https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/413470',
  },
  S2: {
    id: 'S2',
    short: 'Layton 2020 (US Medicare elderly)',
    citation:
      'Layton JB, Li W, Yuan J, et al. Heatwaves, medications, and heat-related hospitalization in older Medicare beneficiaries with chronic conditions. PLoS ONE. 2020;15(12):e0243665.',
    url: 'https://doi.org/10.1371/journal.pone.0243665',
  },
  S3: {
    id: 'S3',
    short: 'Nordon 2009 (French 2003 heatwave deaths)',
    citation:
      'Nordon C, Martin-Latry K, de Roquefeuil L, et al. Risk of death related to psychotropic drug use in older people during the European 2003 heatwave: a population-based case-control study. Am J Geriatr Psychiatry. 2009;17(12):1059–1067.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/20104062/',
  },
  S4: {
    id: 'S4',
    short: 'Martin-Latry 2007 (French 2003 hospitalisations)',
    citation:
      'Martin-Latry K, Goumy MP, Latry P, et al. Psychotropic drugs use and risk of heat-related hospitalisation. Eur Psychiatry. 2007;22(6):335–338.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/17513091/',
  },
  S5: {
    id: 'S5',
    short: 'Hospers 2024 (Monash systematic review)',
    citation:
      'Hospers L, Dillon GA, McLachlan AJ, et al. The effect of prescription and over-the-counter medications on core temperature in adults during heat stress: a systematic review and meta-analysis. eClinicalMedicine. 2024;77:102886.',
    url: 'https://doi.org/10.1016/j.eclinm.2024.102886',
  },
  S6: {
    id: 'S6',
    short: 'Boudreault 2025 (BC heat dome)',
    citation:
      'Boudreault J, McLean KE, Henderson SB. Exploring the relationship between medications and heat-related community deaths during the 2021 heat dome. eBioMedicine. 2025;117:105788.',
    url: 'https://doi.org/10.1016/j.ebiom.2025.105788',
  },
  S7: {
    id: 'S7',
    short: 'Westaway 2015 (AU clinical review)',
    citation:
      'Westaway K, Frank O, Husband A, et al. Medicines can affect thermoregulation and accentuate the risk of dehydration and heat-related illness during hot weather. J Clin Pharm Ther. 2015;40(4):363–367.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/26073686/',
  },
  S8: {
    id: 'S8',
    short: 'BC schizophrenia heat dome 2025',
    citation:
      'Antipsychotics and other risk factors for mortality among people with schizophrenia during an extreme heat event: a population-based case-control study. Sci Rep. 2025.',
    url: 'https://www.nature.com/articles/s41598-025-17591-0',
  },
  S9: {
    id: 'S9',
    short: 'Vic DoH (Better Health Channel)',
    citation:
      'Department of Health, Victorian Government — Better Health Channel. Heat and older people. Reviewed 9 December 2024.',
    url: 'https://www.betterhealth.vic.gov.au/health/healthyliving/heat-stress-and-older-people',
  },
  S10: {
    id: 'S10',
    short: 'NIA (NIH) older adults',
    citation:
      'National Institute on Aging (NIH). Hot Weather Safety for Older Adults.',
    url: 'https://www.nia.nih.gov/health/safety/hot-weather-safety-older-adults',
  },
};

// ─── Medications ──────────────────────────────────────────────────────────
//
// Selection criteria:
//   1. Frequently prescribed to older Australians (PBS-listed where applicable).
//   2. Has either elderly real-world OR thermoregulation evidence in the source set.
//   3. Has a recognised AU brand name patients are likely to identify.

export const MEDICATIONS: Medication[] = [
  // ── Tier A — strong anticholinergics ────────────────────────────────────
  {
    id: 'amitriptyline',
    generic: 'Amitriptyline',
    brands_au: ['Endep', 'Tryptanol'],
    atc: 'N06AA09',
    group: 'antidepressant',
    tier: 'A',
    mechanisms: ['anticholinergic_high', 'sweat_inhibition', 'sedation'],
    sources: ['S4', 'S5', 'S7'],
    note:
      'This medicine reduces how much you sweat and can dull your sense of thirst — two of the main ways your body keeps cool.',
    tip:
      'Drink a small glass of water every hour on hot days, even if you do not feel thirsty.',
  },
  {
    id: 'nortriptyline',
    generic: 'Nortriptyline',
    brands_au: ['Allegron', 'Nortab'],
    atc: 'N06AA10',
    group: 'antidepressant',
    tier: 'A',
    mechanisms: ['anticholinergic_high', 'sweat_inhibition'],
    sources: ['S4', 'S5', 'S7'],
    note:
      'This medicine reduces how much you sweat, which is a main way your body cools itself.',
    tip:
      'Drink water on a regular schedule and cool your skin with a damp cloth on hot afternoons.',
  },
  {
    id: 'doxepin',
    generic: 'Doxepin',
    brands_au: ['Sinequan', 'Deptran'],
    atc: 'N06AA12',
    group: 'antidepressant',
    tier: 'A',
    mechanisms: ['anticholinergic_high', 'sedation'],
    sources: ['S4', 'S7'],
    note:
      'This medicine reduces sweating and can make you sleepy — both make hot days harder for the body.',
    tip:
      'Drink water often and ask someone to check on you on very hot afternoons.',
  },
  {
    id: 'oxybutynin',
    generic: 'Oxybutynin',
    brands_au: ['Ditropan', 'Oxytrol'],
    atc: 'G04BD04',
    group: 'anticholinergic',
    tier: 'A',
    mechanisms: ['anticholinergic_high', 'sweat_inhibition'],
    sources: ['S4', 'S5', 'S7'],
    note:
      'This bladder medicine directly reduces how much you sweat, which makes it harder for your body to cool down.',
    tip:
      'Sip water through the day and use a fan or a damp towel on your neck if you start to feel hot.',
  },
  {
    id: 'hyoscine_butylbromide',
    generic: 'Hyoscine butylbromide',
    brands_au: ['Buscopan'],
    atc: 'A03BB01',
    group: 'anticholinergic',
    tier: 'A',
    mechanisms: ['anticholinergic_high', 'sweat_inhibition'],
    sources: ['S5', 'S7'],
    note:
      'This medicine can reduce how much you sweat — your main way of cooling down.',
    tip:
      'Drink water on a schedule on hot days, even if you do not feel thirsty.',
  },
  {
    id: 'benztropine',
    generic: 'Benztropine',
    brands_au: ['Cogentin', 'Benztrop'],
    atc: 'N04AC01',
    group: 'antiparkinson',
    tier: 'A',
    mechanisms: ['anticholinergic_high', 'thermoregulation_central'],
    sources: ['S6', 'S7'],
    note:
      'This medicine reduces sweating and can interfere with how your body controls its temperature.',
    tip:
      'Stay in your coolest room during hot afternoons. Use a fan and drink water often.',
  },
  {
    id: 'promethazine',
    generic: 'Promethazine',
    brands_au: ['Phenergan'],
    atc: 'R06AD02',
    group: 'anticholinergic',
    tier: 'A',
    mechanisms: ['anticholinergic_high', 'sedation', 'sweat_inhibition'],
    sources: ['S5', 'S7'],
    note:
      'This medicine makes you drowsy and reduces sweating — both make hot days harder to handle.',
    tip:
      'Avoid taking it in the middle of a hot day and ask someone to check on you.',
  },
  {
    id: 'diphenhydramine',
    generic: 'Diphenhydramine',
    brands_au: ['Benadryl Original', 'Unisom SleepGels'],
    atc: 'R06AA02',
    group: 'anticholinergic',
    tier: 'A',
    mechanisms: ['anticholinergic_high', 'sedation', 'sweat_inhibition'],
    sources: ['S5', 'S7'],
    note:
      'This medicine (often in over-the-counter sleep aids) makes you sleepy and reduces sweating.',
    tip:
      'Skip it on very hot nights if you can. Sleep in your coolest room and keep water beside the bed.',
  },

  // ── Tier A — antipsychotics ─────────────────────────────────────────────
  {
    id: 'haloperidol',
    generic: 'Haloperidol',
    brands_au: ['Serenace', 'Haldol'],
    atc: 'N05AD01',
    group: 'antipsychotic',
    tier: 'A',
    mechanisms: ['thermoregulation_central', 'sedation'],
    sources: ['S2', 'S3', 'S4', 'S8'],
    note:
      'This medicine reduces your body’s ability to control its own temperature and can make you sleepy.',
    tip:
      'Plan to spend hot afternoons in air-conditioning. Ask a family member or buddy to phone you.',
  },
  {
    id: 'chlorpromazine',
    generic: 'Chlorpromazine',
    brands_au: ['Largactil'],
    atc: 'N05AA01',
    group: 'antipsychotic',
    tier: 'A',
    mechanisms: ['thermoregulation_central', 'anticholinergic_high', 'sedation'],
    sources: ['S3', 'S4', 'S7'],
    note:
      'This medicine reduces sweating and slows your body’s ability to cool down.',
    tip:
      'Stay in a cool room during the hottest hours and drink water through the day.',
  },
  {
    id: 'clozapine',
    generic: 'Clozapine',
    brands_au: ['Clopine', 'Clozaril'],
    atc: 'N05AH02',
    group: 'antipsychotic',
    tier: 'A',
    mechanisms: ['thermoregulation_central', 'anticholinergic_high'],
    sources: ['S8'],
    note:
      'This medicine reduces how well your body cools itself and can make you drowsy.',
    tip:
      'Plan air-conditioned time on hot afternoons and keep water beside you.',
  },
  {
    id: 'olanzapine',
    generic: 'Olanzapine',
    brands_au: ['Zyprexa', 'Zypine'],
    atc: 'N05AH03',
    group: 'antipsychotic',
    tier: 'A',
    mechanisms: ['anticholinergic_high', 'sedation'],
    sources: ['S2', 'S3'],
    note:
      'This medicine can reduce sweating and slow how your body cools itself on hot days.',
    tip:
      'Stay in your coolest room in the afternoon and drink water regularly.',
  },
  {
    id: 'quetiapine',
    generic: 'Quetiapine',
    brands_au: ['Seroquel', 'Quetia'],
    atc: 'N05AH04',
    group: 'antipsychotic',
    tier: 'A',
    mechanisms: ['anticholinergic_high', 'sedation', 'hypotension_cardiac_output'],
    sources: ['S2', 'S3'],
    note:
      'This medicine can reduce sweating, leave you sleepy, and lower your blood pressure.',
    tip:
      'Get up slowly to avoid feeling faint. Stay in a cool room and sip water often.',
  },
  {
    id: 'risperidone',
    generic: 'Risperidone',
    brands_au: ['Risperdal', 'Rispa'],
    atc: 'N05AX08',
    group: 'antipsychotic',
    tier: 'A',
    mechanisms: ['thermoregulation_central', 'hypotension_cardiac_output'],
    sources: ['S2', 'S3'],
    note:
      'This medicine can affect how your body controls its temperature on hot days.',
    tip:
      'Spend hot afternoons in a cool place. Drink water and rest more than usual.',
  },

  // ── Tier A — anti-Parkinson ─────────────────────────────────────────────
  {
    id: 'levodopa_carbidopa',
    generic: 'Levodopa with carbidopa',
    brands_au: ['Sinemet', 'Madopar'],
    atc: 'N04BA02',
    group: 'antiparkinson',
    tier: 'A',
    mechanisms: ['thermoregulation_central'],
    sources: ['S5', 'S6'],
    note:
      'This Parkinson’s medicine can affect how your body controls its temperature on hot days.',
    tip:
      'Avoid the hottest hours outdoors. Drink water on a regular schedule.',
  },
  {
    id: 'bromocriptine',
    generic: 'Bromocriptine',
    brands_au: ['Parlodel'],
    atc: 'N04BC01',
    group: 'antiparkinson',
    tier: 'A',
    mechanisms: ['thermoregulation_central'],
    sources: ['S5', 'S6'],
    note:
      'This medicine can interfere with how your body controls heat.',
    tip:
      'Stay indoors or in shade during the hottest part of the day, and drink water often.',
  },
  {
    id: 'pramipexole',
    generic: 'Pramipexole',
    brands_au: ['Sifrol', 'Pramin'],
    atc: 'N04BC05',
    group: 'antiparkinson',
    tier: 'A',
    mechanisms: ['thermoregulation_central'],
    sources: ['S6'],
    note:
      'This Parkinson’s medicine can affect how your body handles heat.',
    tip:
      'Plan a cool room for hot afternoons and drink water through the day.',
  },

  // ── Tier A — antiepileptics ─────────────────────────────────────────────
  {
    id: 'topiramate',
    generic: 'Topiramate',
    brands_au: ['Topamax', 'Tamate'],
    atc: 'N03AX11',
    group: 'antiepileptic',
    tier: 'A',
    mechanisms: ['sweat_inhibition'],
    sources: ['S6'],
    note:
      'This medicine reduces how much you sweat — a main way your body cools down on hot days.',
    tip:
      'Drink water on a schedule and cool your skin with damp towels on hot afternoons.',
  },
  {
    id: 'carbamazepine',
    generic: 'Carbamazepine',
    brands_au: ['Tegretol', 'Teril'],
    atc: 'N03AF01',
    group: 'antiepileptic',
    tier: 'A',
    mechanisms: ['hyponatraemia_siadh'],
    sources: ['S6'],
    note:
      'This medicine can lower your blood salt levels, and that gets worse when you sweat a lot.',
    tip:
      'Eat normally on hot days. Tell your GP if you feel weak, headache-y, or confused.',
  },
  {
    id: 'sodium_valproate',
    generic: 'Sodium valproate',
    brands_au: ['Epilim', 'Valpro'],
    atc: 'N03AG01',
    group: 'antiepileptic',
    tier: 'A',
    mechanisms: ['sedation'],
    sources: ['S6'],
    note:
      'Seizure medicines like this one have been linked with higher heat-related risk for older adults.',
    tip:
      'Drink water on a schedule and ask a buddy to phone you on heatwave days.',
  },

  // ── Tier A — non-selective beta-blockers ────────────────────────────────
  {
    id: 'propranolol',
    generic: 'Propranolol',
    brands_au: ['Inderal', 'Deralin'],
    atc: 'C07AA05',
    group: 'beta_blocker_nonselective',
    tier: 'A',
    mechanisms: ['beta_blockade_nonselective', 'hypotension_cardiac_output'],
    sources: ['S5', 'S9'],
    note:
      'On hot days, your heart cannot speed up as easily to help cool your body.',
    tip:
      'Avoid the hottest hours (11am–4pm). Stand up slowly to prevent dizziness.',
  },
  {
    id: 'sotalol',
    generic: 'Sotalol',
    brands_au: ['Sotacor', 'Cardol'],
    atc: 'C07AA07',
    group: 'beta_blocker_nonselective',
    tier: 'A',
    mechanisms: ['beta_blockade_nonselective', 'hypotension_cardiac_output'],
    sources: ['S5', 'S9'],
    note:
      'On hot days, your heart cannot speed up as much to help your body cool down.',
    tip:
      'Rest more on hot days and avoid the hottest hours outdoors.',
  },
  {
    id: 'carvedilol',
    generic: 'Carvedilol',
    brands_au: ['Dilatrend', 'Kredex'],
    atc: 'C07AG02',
    group: 'beta_blocker_nonselective',
    tier: 'A',
    mechanisms: ['beta_blockade_nonselective'],
    sources: ['S5', 'S9'],
    note:
      'This blood-pressure medicine blunts your body’s usual response to heat.',
    tip:
      'Take rest breaks in a cool room. Stand up slowly to avoid feeling faint.',
  },

  // ── Tier B — loop diuretics ─────────────────────────────────────────────
  {
    id: 'furosemide',
    generic: 'Furosemide (frusemide)',
    brands_au: ['Lasix', 'Frusehexal', 'Urex'],
    atc: 'C03CA01',
    group: 'loop_diuretic',
    tier: 'B',
    mechanisms: ['volume_depletion', 'electrolyte_disturbance'],
    sources: ['S2', 'S7', 'S9'],
    note:
      'This "water tablet" makes your body lose extra fluid. Hot weather adds to that loss.',
    tip:
      'Drink extra water through the day. Sit down if you feel light-headed.',
  },
  {
    id: 'bumetanide',
    generic: 'Bumetanide',
    brands_au: ['Burinex'],
    atc: 'C03CA02',
    group: 'loop_diuretic',
    tier: 'B',
    mechanisms: ['volume_depletion', 'electrolyte_disturbance'],
    sources: ['S2', 'S7'],
    note:
      'This "water tablet" makes your body lose fluid, and hot days make dehydration more likely.',
    tip:
      'Drink water through the day. Watch for dizziness or feeling very thirsty.',
  },

  // ── Tier B — thiazide diuretics ─────────────────────────────────────────
  {
    id: 'hydrochlorothiazide',
    generic: 'Hydrochlorothiazide',
    brands_au: ['Dithiazide (combo products)'],
    atc: 'C03AA03',
    group: 'thiazide_diuretic',
    tier: 'B',
    mechanisms: ['volume_depletion', 'hyponatraemia_siadh'],
    sources: ['S7', 'S9'],
    note:
      'This "water tablet" makes you lose fluid and salt. Hot days speed this up.',
    tip:
      'Drink water regularly. Tell your GP if you have muscle cramps or feel weak.',
  },
  {
    id: 'indapamide',
    generic: 'Indapamide',
    brands_au: ['Natrilix', 'Dapa-tabs'],
    atc: 'C03BA11',
    group: 'thiazide_diuretic',
    tier: 'B',
    mechanisms: ['volume_depletion', 'hyponatraemia_siadh'],
    sources: ['S7', 'S9'],
    note:
      'This "water tablet" makes you lose fluid and salt — easier to get dehydrated on hot days.',
    tip:
      'Drink water through the day. Watch for cramps, weakness, or feeling unwell.',
  },

  // ── Tier B — ACE inhibitors ─────────────────────────────────────────────
  {
    id: 'perindopril',
    generic: 'Perindopril',
    brands_au: ['Coversyl'],
    atc: 'C09AA04',
    group: 'ace_inhibitor',
    tier: 'B',
    mechanisms: ['renal_autoregulation', 'hypotension_cardiac_output'],
    sources: ['S2', 'S7'],
    note:
      'On hot days when you sweat more, this blood-pressure medicine makes your kidneys work harder.',
    tip:
      'Drink water often. Do not stop the tablet — call your pharmacist if you feel unwell.',
  },
  {
    id: 'ramipril',
    generic: 'Ramipril',
    brands_au: ['Tritace', 'Ramace'],
    atc: 'C09AA05',
    group: 'ace_inhibitor',
    tier: 'B',
    mechanisms: ['renal_autoregulation', 'hypotension_cardiac_output'],
    sources: ['S2', 'S7'],
    note:
      'On hot days when you lose fluid, this blood-pressure medicine adds strain on your kidneys.',
    tip:
      'Drink water regularly. Do not skip the tablet — ask your pharmacist if you feel light-headed.',
  },
  {
    id: 'enalapril',
    generic: 'Enalapril',
    brands_au: ['Renitec', 'Acetec'],
    atc: 'C09AA02',
    group: 'ace_inhibitor',
    tier: 'B',
    mechanisms: ['renal_autoregulation'],
    sources: ['S2', 'S7'],
    note:
      'On hot days, this blood-pressure medicine can be harder on your kidneys when you sweat a lot.',
    tip:
      'Drink water often. Do not stop the tablet — ask your pharmacist if you feel unwell.',
  },
  {
    id: 'lisinopril',
    generic: 'Lisinopril',
    brands_au: ['Prinivil', 'Zestril'],
    atc: 'C09AA03',
    group: 'ace_inhibitor',
    tier: 'B',
    mechanisms: ['renal_autoregulation'],
    sources: ['S2', 'S7'],
    note:
      'On hot days, this blood-pressure medicine puts more strain on your kidneys when you lose fluid.',
    tip:
      'Drink water regularly and talk to a pharmacist before any forecast hot week.',
  },

  // ── Tier B — ARBs ───────────────────────────────────────────────────────
  {
    id: 'candesartan',
    generic: 'Candesartan',
    brands_au: ['Atacand'],
    atc: 'C09CA06',
    group: 'arb',
    tier: 'B',
    mechanisms: ['renal_autoregulation'],
    sources: ['S2', 'S7'],
    note:
      'On hot days, this blood-pressure medicine puts more strain on your kidneys.',
    tip:
      'Drink water often. Do not skip the tablet — ask your pharmacist if you feel unwell.',
  },
  {
    id: 'irbesartan',
    generic: 'Irbesartan',
    brands_au: ['Avapro', 'Karvea'],
    atc: 'C09CA04',
    group: 'arb',
    tier: 'B',
    mechanisms: ['renal_autoregulation'],
    sources: ['S2', 'S7'],
    note:
      'On hot days, this medicine makes your kidneys more sensitive to losing fluid.',
    tip:
      'Drink water through the day. Talk to your pharmacist if you also take a "water tablet".',
  },
  {
    id: 'telmisartan',
    generic: 'Telmisartan',
    brands_au: ['Micardis'],
    atc: 'C09CA07',
    group: 'arb',
    tier: 'B',
    mechanisms: ['renal_autoregulation'],
    sources: ['S2', 'S7'],
    note:
      'On hot days, this blood-pressure medicine can be harder on your kidneys when you sweat more.',
    tip:
      'Drink water often. Tell your GP if you feel light-headed or dizzy.',
  },

  // ── Tier B — SSRIs / SNRIs ──────────────────────────────────────────────
  {
    id: 'sertraline',
    generic: 'Sertraline',
    brands_au: ['Zoloft', 'Eleva'],
    atc: 'N06AB06',
    group: 'antidepressant',
    tier: 'B',
    mechanisms: ['hyponatraemia_siadh'],
    sources: ['S3'],
    note:
      'On hot days, this medicine can lower the salt level in your blood, which may make you weak or confused.',
    tip:
      'Eat normally. Drink water — but not huge amounts at once. Tell your GP if you feel off.',
  },
  {
    id: 'escitalopram',
    generic: 'Escitalopram',
    brands_au: ['Lexapro', 'Esitalo'],
    atc: 'N06AB10',
    group: 'antidepressant',
    tier: 'B',
    mechanisms: ['hyponatraemia_siadh'],
    sources: ['S3'],
    note:
      'On hot days, this medicine can lower your blood salt, which can cause tiredness or confusion.',
    tip:
      'Eat normally. Watch for headache, weakness, or muddled thinking and call your GP.',
  },
  {
    id: 'citalopram',
    generic: 'Citalopram',
    brands_au: ['Cipramil', 'Talam'],
    atc: 'N06AB04',
    group: 'antidepressant',
    tier: 'B',
    mechanisms: ['hyponatraemia_siadh'],
    sources: ['S3', 'S5'],
    note:
      'On hot days, this medicine can lower your blood salt, which makes you feel weak or unwell.',
    tip:
      'Eat normally and sip water — but not huge amounts at once. Call your GP if you feel off.',
  },
  {
    id: 'venlafaxine',
    generic: 'Venlafaxine',
    brands_au: ['Efexor', 'Elaxine'],
    atc: 'N06AX16',
    group: 'antidepressant',
    tier: 'B',
    mechanisms: ['hyponatraemia_siadh'],
    sources: ['S3'],
    note:
      'On hot days, this medicine can lower your blood salt, which may make you feel weak or muddled.',
    tip:
      'Do not skip meals. Watch for tiredness or confusion and call your GP.',
  },
  {
    id: 'duloxetine',
    generic: 'Duloxetine',
    brands_au: ['Cymbalta', 'Andepra'],
    atc: 'N06AX21',
    group: 'antidepressant',
    tier: 'B',
    mechanisms: ['hyponatraemia_siadh'],
    sources: ['S3'],
    note:
      'On hot days, this medicine can lower your blood salt, leading to tiredness or confusion.',
    tip:
      'Eat normally. Tell your GP if you feel weak, headache-y, or muddled.',
  },
  {
    id: 'mirtazapine',
    generic: 'Mirtazapine',
    brands_au: ['Avanza', 'Remeron'],
    atc: 'N06AX11',
    group: 'antidepressant',
    tier: 'B',
    mechanisms: ['sedation'],
    sources: ['S3'],
    note:
      'This antidepressant can make you sleepy, so you may not notice early signs of heat illness.',
    tip:
      'Ask a friend or family member to phone you on very hot days.',
  },

  // ── Tier B — benzodiazepines / Z-drugs ──────────────────────────────────
  {
    id: 'diazepam',
    generic: 'Diazepam',
    brands_au: ['Valium', 'Antenex', 'Ducene'],
    atc: 'N05BA01',
    group: 'benzodiazepine',
    tier: 'B',
    mechanisms: ['sedation'],
    sources: ['S3', 'S4'],
    note:
      'This medicine can make you drowsy, so you might miss the early warning signs of heat illness.',
    tip:
      'Ask a buddy to phone you on hot days and keep water beside you.',
  },
  {
    id: 'temazepam',
    generic: 'Temazepam',
    brands_au: ['Normison', 'Temaze'],
    atc: 'N05CD07',
    group: 'benzodiazepine',
    tier: 'B',
    mechanisms: ['sedation'],
    sources: ['S3', 'S4'],
    note:
      'This sleep tablet can leave you drowsy in the morning, so early heat signs are easier to miss.',
    tip:
      'Have someone check on you on hot mornings. Keep water and a fan by your bed.',
  },
  {
    id: 'oxazepam',
    generic: 'Oxazepam',
    brands_au: ['Serepax', 'Murelax'],
    atc: 'N05BA04',
    group: 'benzodiazepine',
    tier: 'B',
    mechanisms: ['sedation'],
    sources: ['S3', 'S4'],
    note:
      'This medicine can make you drowsy, so you may not notice when you are getting too hot.',
    tip:
      'Set a phone reminder to drink water and ask someone to check in on hot days.',
  },
  {
    id: 'zopiclone',
    generic: 'Zopiclone',
    brands_au: ['Imovane', 'Imrest'],
    atc: 'N05CF01',
    group: 'benzodiazepine',
    tier: 'B',
    mechanisms: ['sedation'],
    sources: ['S3'],
    note:
      'This sleep tablet can leave you drowsy in the morning, so heat signs are harder to spot.',
    tip:
      'Have a buddy phone you on hot mornings. Keep water within reach.',
  },

  // ── Tier B — diabetes ───────────────────────────────────────────────────
  {
    id: 'insulin',
    generic: 'Insulin (any form)',
    brands_au: ['Lantus', 'Levemir', 'Humulin', 'NovoRapid', 'Actrapid'],
    atc: 'A10A',
    group: 'diabetes_insulin_sulfonylurea',
    tier: 'B',
    mechanisms: ['hypoglycaemia'],
    sources: ['S6'],
    note:
      'On hot days insulin can work a little faster and you may sweat more — blood sugar can drop.',
    tip:
      'Check your blood sugar more often and keep juice or biscuits within reach.',
  },
  {
    id: 'gliclazide',
    generic: 'Gliclazide',
    brands_au: ['Diamicron', 'Glyade'],
    atc: 'A10BB09',
    group: 'diabetes_insulin_sulfonylurea',
    tier: 'B',
    mechanisms: ['hypoglycaemia'],
    sources: ['S6'],
    note:
      'On hot days you may eat less and sweat more, which can drop your blood sugar lower than usual.',
    tip:
      'Check your sugar more often. Keep biscuits, juice, or a sugar lolly nearby.',
  },
  {
    id: 'empagliflozin',
    generic: 'Empagliflozin',
    brands_au: ['Jardiance'],
    atc: 'A10BK03',
    group: 'diabetes_sglt2',
    tier: 'B',
    mechanisms: ['volume_depletion', 'renal_autoregulation'],
    sources: ['S6', 'S7'],
    note:
      'This diabetes medicine makes you urinate more, which adds to dehydration on hot days.',
    tip:
      'Drink water often. Call your GP if you cannot keep fluids down or feel light-headed.',
  },
  {
    id: 'dapagliflozin',
    generic: 'Dapagliflozin',
    brands_au: ['Forxiga'],
    atc: 'A10BK01',
    group: 'diabetes_sglt2',
    tier: 'B',
    mechanisms: ['volume_depletion', 'renal_autoregulation'],
    sources: ['S6', 'S7'],
    note:
      'This diabetes medicine makes you urinate more — easier to get dehydrated on hot days.',
    tip:
      'Drink water through the day. Call your GP if you feel light-headed or very thirsty.',
  },

  // ── Tier C — selective beta-blockers (reassurance) ──────────────────────
  {
    id: 'atenolol',
    generic: 'Atenolol',
    brands_au: ['Tenormin', 'Noten'],
    atc: 'C07AB03',
    group: 'beta_blocker_selective',
    tier: 'C',
    mechanisms: [],
    sources: ['S2', 'S5'],
    note:
      'Current research does not show this blood-pressure medicine adds heat-day risk.',
    tip:
      'Follow the usual hot-day rules: drink water, stay in shade, rest in the hottest hours.',
  },
  {
    id: 'metoprolol',
    generic: 'Metoprolol',
    brands_au: ['Betaloc', 'Lopresor', 'Toprol-XL'],
    atc: 'C07AB02',
    group: 'beta_blocker_selective',
    tier: 'C',
    mechanisms: [],
    sources: ['S2', 'S5'],
    note:
      'Current research does not show this blood-pressure medicine adds heat-day risk.',
    tip:
      'Follow the usual hot-day rules: drink water, stay cool, and rest more.',
  },
  {
    id: 'bisoprolol',
    generic: 'Bisoprolol',
    brands_au: ['Bicor', 'Concor'],
    atc: 'C07AB07',
    group: 'beta_blocker_selective',
    tier: 'C',
    mechanisms: [],
    sources: ['S5'],
    note:
      'Current research does not show this blood-pressure medicine adds heat-day risk.',
    tip:
      'Follow the usual hot-day rules: drink water, stay in your coolest room, and rest more.',
  },

  // ── Tier C — CCBs (potentially protective) ──────────────────────────────
  {
    id: 'amlodipine',
    generic: 'Amlodipine',
    brands_au: ['Norvasc', 'Amlocor'],
    atc: 'C08CA01',
    group: 'ccb',
    tier: 'C',
    mechanisms: [],
    sources: ['S6'],
    note:
      'Research suggests this blood-pressure medicine may even slightly help your body cope with heat.',
    tip:
      'Still follow the usual hot-day rules — drink water, stay cool, rest in the heat.',
  },
  {
    id: 'lercanidipine',
    generic: 'Lercanidipine',
    brands_au: ['Zanidip'],
    atc: 'C08CA13',
    group: 'ccb',
    tier: 'C',
    mechanisms: [],
    sources: ['S6'],
    note:
      'This blood-pressure medicine does not add heat-day risk and may slightly help.',
    tip:
      'Drink water, stay in shade, and rest more on hot days.',
  },
  {
    id: 'diltiazem',
    generic: 'Diltiazem',
    brands_au: ['Cardizem', 'Vasocardol'],
    atc: 'C08DB01',
    group: 'ccb',
    tier: 'C',
    mechanisms: [],
    sources: ['S6'],
    note:
      'Current research does not show this blood-pressure medicine adds heat-day risk.',
    tip:
      'Drink water, stay cool, and rest more on hot days.',
  },

  // ── Tier C — second-generation antihistamines (reassurance) ─────────────
  {
    id: 'fexofenadine',
    generic: 'Fexofenadine',
    brands_au: ['Telfast', 'Tefodine'],
    atc: 'R06AX26',
    group: 'antihistamine_second_gen',
    tier: 'C',
    mechanisms: [],
    sources: ['S5'],
    note:
      'This non-drowsy antihistamine does not appear to affect how your body handles heat.',
    tip:
      'Follow the usual hot-day rules — water, shade, cool room in the afternoon.',
  },
  {
    id: 'loratadine',
    generic: 'Loratadine',
    brands_au: ['Claratyne', 'Lorastyne'],
    atc: 'R06AX13',
    group: 'antihistamine_second_gen',
    tier: 'C',
    mechanisms: [],
    sources: ['S5'],
    note:
      'This non-drowsy antihistamine does not appear to affect how your body handles heat.',
    tip:
      'Follow the usual hot-day rules — water, shade, cool room.',
  },
  {
    id: 'cetirizine',
    generic: 'Cetirizine',
    brands_au: ['Zyrtec', 'Alzene'],
    atc: 'R06AE07',
    group: 'antihistamine_second_gen',
    tier: 'C',
    mechanisms: [],
    sources: ['S5'],
    note:
      'This non-drowsy antihistamine does not appear to affect how your body handles heat.',
    tip:
      'Follow the usual hot-day rules — water, shade, rest in the heat.',
  },
];

// ─── Combination rules ────────────────────────────────────────────────────

const PSYCHOTROPIC_GROUPS = new Set([
  'antipsychotic',
  'antidepressant',
  'benzodiazepine',
  'antiparkinson',
  'antiepileptic',
]);

export const COMBINATION_RULES: CombinationRule[] = [
  {
    id: 'combo_diuretic_acei_arb',
    label: 'Water tablet + blood-pressure tablet',
    escalateTo: 'A',
    sources: ['S7', 'S9'],
    message:
      'You take a "water tablet" together with a blood-pressure tablet. On very hot days the body loses extra fluid, and these two together can stress the kidneys.',
    tip:
      'Drink water often through the day. Do not stop either tablet — book a quick pharmacist chat before a forecast hot week.',
    trigger: (selected) => {
      const hasDiuretic = selected.some(
        (m) => m.group === 'loop_diuretic' || m.group === 'thiazide_diuretic',
      );
      const hasAceArb = selected.some(
        (m) => m.group === 'ace_inhibitor' || m.group === 'arb',
      );
      return hasDiuretic && hasAceArb;
    },
  },
  {
    id: 'combo_polypharmacy_psychotropic',
    label: 'Three or more mental-health medicines',
    escalateTo: 'A',
    sources: ['S3'],
    message:
      'Taking three or more mental-health medicines together makes hot days noticeably harder for the body. Each extra one adds a small amount of risk.',
    tip:
      'Plan an air-conditioned spot for hot afternoons and ask a buddy to phone you on heatwave days.',
    trigger: (selected) =>
      selected.filter((m) => PSYCHOTROPIC_GROUPS.has(m.group)).length >= 3,
  },
  {
    id: 'combo_high_anticholinergic',
    label: 'Two or more strong sweat-reducing medicines',
    escalateTo: 'A',
    sources: ['S7'],
    message:
      'Two or more of your medicines strongly reduce sweating. Sweating is your body’s main way to cool down — losing it makes hot days much harder.',
    tip:
      'Drink water on a schedule, not when thirsty. Cool your skin with a damp cloth and stay in your coolest room in the afternoon.',
    trigger: (selected) =>
      selected.filter((m) => m.mechanisms.includes('anticholinergic_high')).length >= 2,
  },
];

// ─── Lookup helpers ───────────────────────────────────────────────────────

export function findMedication(id: string): Medication | null {
  return MEDICATIONS.find((m) => m.id === id) ?? null;
}

export interface MedicationRiskResult {
  selected: Medication[];
  highestTier: MedicationTier | null;
  firedRules: CombinationRule[];
}

export function evaluateMedicationRisk(selectedIds: string[]): MedicationRiskResult {
  const selected = selectedIds
    .map(findMedication)
    .filter((m): m is Medication => m !== null);

  const firedRules = COMBINATION_RULES.filter((r) => r.trigger(selected));

  const tierRank: Record<MedicationTier, number> = { C: 0, B: 1, A: 2 };
  let topTier: MedicationTier | null = null;
  for (const m of selected) {
    if (topTier === null || tierRank[m.tier] > tierRank[topTier]) topTier = m.tier;
  }
  // combination rules can only escalate
  for (const rule of firedRules) {
    if (topTier === null || tierRank[rule.escalateTo] > tierRank[topTier]) {
      topTier = rule.escalateTo;
    }
  }

  return { selected, highestTier: topTier, firedRules };
}

/**
 * Group medications for the picker UI (one section per group with a friendly label).
 */
export const GROUP_LABELS: Record<Medication['group'], string> = {
  anticholinergic: 'Anticholinergic medicines',
  antipsychotic: 'Antipsychotics',
  antidepressant: 'Antidepressants',
  benzodiazepine: 'Sleep / anxiety medicines',
  antiparkinson: 'Parkinson’s medicines',
  antiepileptic: 'Anti-seizure medicines',
  beta_blocker_nonselective: 'Non-selective beta-blockers',
  beta_blocker_selective: 'Selective beta-blockers',
  loop_diuretic: 'Loop diuretics (water tablets)',
  thiazide_diuretic: 'Thiazide diuretics',
  ace_inhibitor: 'ACE inhibitors',
  arb: 'Angiotensin receptor blockers',
  ccb: 'Calcium channel blockers',
  diabetes_insulin_sulfonylurea: 'Insulin / sulfonylureas',
  diabetes_sglt2: 'SGLT2 inhibitors',
  antihistamine_second_gen: 'Antihistamines (non-drowsy)',
};

export const TIER_LABEL: Record<MedicationTier, string> = {
  A: 'Higher heat-day risk',
  B: 'Some heat-day risk',
  C: 'No detected risk',
};

export const DISCLAIMER =
  'This is general information based on published research. It is not a substitute for advice from your GP or pharmacist. Do not change how you take your medicines without talking to a health professional first. In a medical emergency, call 000.';
