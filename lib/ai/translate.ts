import { generateText } from "ai";
import { z } from "zod";
import { getChatModel, hasLlmKey } from "@/lib/ai/models";
import { localeLanguageName } from "@/lib/resume/locales";
import type { MasterResume } from "@/lib/resume/schema";

/** Text-only slice sent to the LLM (no photo/logo URLs, emails, links, meta). */
const translateTextSchema = z.object({
  identity: z.object({
    fullName: z.string(),
    headline: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
  }),
  summary: z.string().optional(),
  experience: z.array(
    z.object({
      id: z.string(),
      company: z.string(),
      title: z.string(),
      location: z.string().optional(),
      bullets: z.array(z.string()),
      metrics: z.array(z.string()),
    }),
  ),
  education: z.array(
    z.object({
      id: z.string(),
      institution: z.string(),
      degree: z.string().optional(),
      field: z.string().optional(),
      bullets: z.array(z.string()).optional(),
    }),
  ),
  skills: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      category: z.string().optional(),
    }),
  ),
  projects: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().optional(),
      highlights: z.array(z.string()),
    }),
  ),
  certifications: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      issuer: z.string().optional(),
    }),
  ),
  references: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      role: z.string().optional(),
      company: z.string().optional(),
    }),
  ),
});

type TranslateTextPayload = z.infer<typeof translateTextSchema>;

/** Strip media URLs and non-translatable fields before calling the LLM. */
export function toTranslateTextPayload(data: MasterResume): TranslateTextPayload {
  return {
    identity: {
      fullName: data.identity.fullName,
      ...(data.identity.headline ? { headline: data.identity.headline } : {}),
      ...(data.identity.phone ? { phone: data.identity.phone } : {}),
      ...(data.identity.location ? { location: data.identity.location } : {}),
    },
    ...(data.summary ? { summary: data.summary } : {}),
    experience: data.experience.map((e) => ({
      id: e.id,
      company: e.company,
      title: e.title,
      ...(e.location ? { location: e.location } : {}),
      bullets: e.bullets,
      metrics: e.metrics,
    })),
    education: data.education.map((e) => ({
      id: e.id,
      institution: e.institution,
      ...(e.degree ? { degree: e.degree } : {}),
      ...(e.field ? { field: e.field } : {}),
      ...(e.bullets?.length ? { bullets: e.bullets } : {}),
    })),
    skills: data.skills.map((s) => ({
      id: s.id,
      name: s.name,
      ...(s.category ? { category: s.category } : {}),
    })),
    projects: data.projects.map((p) => ({
      id: p.id,
      name: p.name,
      ...(p.description ? { description: p.description } : {}),
      highlights: p.highlights,
    })),
    certifications: (data.certifications ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      ...(c.issuer ? { issuer: c.issuer } : {}),
    })),
    references: (data.references ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      ...(r.role ? { role: r.role } : {}),
      ...(r.company ? { company: r.company } : {}),
    })),
  };
}

function extractJsonObject(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced ? fenced[1] : text).trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("Model response did not contain JSON");
  }
  return JSON.parse(raw.slice(start, end + 1));
}

/** Apply translated text onto the full source resume (keeps photo/logo URLs, dates, etc.). */
export function applyTranslatedText(
  source: MasterResume,
  translated: TranslateTextPayload,
): MasterResume {
  const byId = <T extends { id: string }>(items: T[]) =>
    new Map(items.map((i) => [i.id, i]));

  const tExp = byId(translated.experience);
  const tEdu = byId(translated.education);
  const tSkills = byId(translated.skills);
  const tProjects = byId(translated.projects);
  const tCerts = byId(translated.certifications);
  const tRefs = byId(translated.references);

  return {
    ...source,
    identity: {
      ...source.identity,
      fullName: translated.identity.fullName || source.identity.fullName,
      headline: translated.identity.headline ?? source.identity.headline,
      phone: translated.identity.phone ?? source.identity.phone,
      location: translated.identity.location ?? source.identity.location,
    },
    summary: translated.summary ?? source.summary,
    experience: source.experience.map((e) => {
      const t = tExp.get(e.id);
      if (!t) return e;
      return {
        ...e,
        company: t.company,
        title: t.title,
        location: t.location ?? e.location,
        bullets: t.bullets,
        metrics: t.metrics,
      };
    }),
    education: source.education.map((e) => {
      const t = tEdu.get(e.id);
      if (!t) return e;
      return {
        ...e,
        institution: t.institution,
        degree: t.degree ?? e.degree,
        field: t.field ?? e.field,
        bullets: t.bullets ?? e.bullets,
      };
    }),
    skills: source.skills.map((s) => {
      const t = tSkills.get(s.id);
      if (!t) return s;
      return {
        ...s,
        name: t.name,
        category: t.category ?? s.category,
      };
    }),
    projects: source.projects.map((p) => {
      const t = tProjects.get(p.id);
      if (!t) return p;
      return {
        ...p,
        name: t.name,
        description: t.description ?? p.description,
        highlights: t.highlights,
      };
    }),
    certifications: (source.certifications ?? []).map((c) => {
      const t = tCerts.get(c.id);
      if (!t) return c;
      return {
        ...c,
        name: t.name,
        issuer: t.issuer ?? c.issuer,
      };
    }),
    references: (source.references ?? []).map((r) => {
      const t = tRefs.get(r.id);
      if (!t) return r;
      return {
        ...r,
        name: t.name,
        role: t.role ?? r.role,
        company: t.company ?? r.company,
        // email stays from source (not sent to LLM)
      };
    }),
  };
}

export async function translateMasterResume(
  data: MasterResume,
  locale: string,
): Promise<MasterResume> {
  if (locale === "en") return data;

  if (!hasLlmKey()) {
    if (locale.startsWith("ja")) {
      return {
        ...data,
        summary: data.summary ? `【翻訳デモ】${data.summary}` : data.summary,
        experience: data.experience.map((e) => ({
          ...e,
          bullets: e.bullets.map((b) => `【訳】${b}`),
          metrics: e.metrics.map((m) => `【訳】${m}`),
        })),
      };
    }
    if (locale.startsWith("fr")) {
      return {
        ...data,
        summary: data.summary ? `[Démo FR] ${data.summary}` : data.summary,
        experience: data.experience.map((e) => ({
          ...e,
          bullets: e.bullets.map((b) => `[TR] ${b}`),
          metrics: e.metrics.map((m) => `[TR] ${m}`),
        })),
      };
    }
    return data;
  }

  const language = localeLanguageName(locale);
  const textPayload = toTranslateTextPayload(data);

  const { text } = await generateText({
    model: getChatModel(),
    prompt: `You are a professional resume translator. Translate the following resume text into ${language}.

Rules:
- Return ONLY a JSON object with the same shape and the same "id" values.
- Translate user-facing text (names of roles/schools when natural, summary, bullets, metrics, skills, projects, certifications, references role/company/name, location).
- Do not invent new fields or content.
- Do not add URLs, emails, dates, or image paths — they are omitted on purpose.

Source JSON:
${JSON.stringify(textPayload)}`,
  });

  const parsed = translateTextSchema.parse(extractJsonObject(text));
  return applyTranslatedText(data, parsed);
}
