export const SKILL_PROFICIENCIES = [
  {
    id: "everyday_work",
    label: "Use every day at work",
  },
  {
    id: "occasional",
    label: "Occasionally use it",
  },
  {
    id: "personal_project",
    label: "Used for personal projects",
  },
  {
    id: "once",
    label: "Used it once",
  },
] as const;

export type SkillProficiency = (typeof SKILL_PROFICIENCIES)[number]["id"];

export const skillProficiencyIds = SKILL_PROFICIENCIES.map((p) => p.id) as [
  SkillProficiency,
  ...SkillProficiency[],
];

const LABELS: Record<string, Record<SkillProficiency, string>> = {
  en: {
    everyday_work: "Use every day at work",
    occasional: "Occasionally use it",
    personal_project: "Used for personal projects",
    once: "Used it once",
  },
  ja: {
    everyday_work: "仕事で毎日使用",
    occasional: "たまに使用",
    personal_project: "個人プロジェクトで使用",
    once: "一度だけ使用",
  },
  fr: {
    everyday_work: "Utilisé tous les jours au travail",
    occasional: "Utilisé occasionnellement",
    personal_project: "Utilisé pour des projets personnels",
    once: "Utilisé une seule fois",
  },
};

export function skillProficiencyLabel(
  proficiency: SkillProficiency | undefined,
  locale = "en",
): string | undefined {
  if (!proficiency) return undefined;
  const table = LABELS[locale] ?? LABELS.en;
  return table[proficiency] ?? LABELS.en[proficiency];
}

export function formatSkillWithProficiency(
  skill: {
    name: string;
    proficiency?: SkillProficiency;
  },
  locale = "en",
): string {
  const label = skillProficiencyLabel(skill.proficiency, locale);
  return label ? `${skill.name} (${label})` : skill.name;
}
