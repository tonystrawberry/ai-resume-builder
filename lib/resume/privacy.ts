import type { MasterResume } from "@/lib/resume/schema";

export const PRIVACY_REDACTION = "••••••••";

/** Terms to blur/redact: full name (+ tokens) and project/app names. */
export function collectSensitiveTerms(data: MasterResume): string[] {
  const terms = new Set<string>();

  const fullName = data.identity.fullName?.trim();
  if (fullName && fullName.length >= 2 && fullName !== "Your Name") {
    terms.add(fullName);
    for (const part of fullName.split(/\s+/)) {
      const token = part.replace(/[^\p{L}\p{N}'-]/gu, "").trim();
      if (token.length >= 2) terms.add(token);
    }
  }

  for (const project of data.projects ?? []) {
    const name = project.name?.trim();
    if (name && name.length >= 2) terms.add(name);
  }

  for (const exp of data.experience ?? []) {
    const company = exp.company?.trim();
    if (company && company.length >= 2) terms.add(company);
  }

  for (const ref of data.references ?? []) {
    const company = ref.company?.trim();
    if (company && company.length >= 2) terms.add(company);
  }

  for (const ed of data.education ?? []) {
    const institution = ed.institution?.trim();
    if (institution && institution.length >= 2) terms.add(institution);
  }

  return Array.from(terms).sort((a, b) => b.length - a.length);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Replace sensitive terms in free text (longest-first). */
export function redactSensitiveText(
  text: string,
  terms: string[],
  replacement = PRIVACY_REDACTION,
): string {
  if (!text || terms.length === 0) return text;
  let next = text;
  for (const term of terms) {
    if (!term) continue;
    const re = new RegExp(escapeRegExp(term), "gi");
    next = next.replace(re, replacement);
  }
  return next;
}

/**
 * Deep copy of master resume with identity + project names cleared/redacted
 * for Word export (no CSS blur in .docx).
 */
export function redactMasterResumeForExport(data: MasterResume): MasterResume {
  const terms = collectSensitiveTerms(data);
  const redact = (text: string) => redactSensitiveText(text, terms);

  return {
    ...data,
    identity: {
      ...data.identity,
      fullName: PRIVACY_REDACTION,
      photoUrl: undefined,
      email: data.identity.email ? PRIVACY_REDACTION : undefined,
      phone: data.identity.phone ? PRIVACY_REDACTION : undefined,
      location: data.identity.location ? PRIVACY_REDACTION : undefined,
      links: [],
    },
    summary: data.summary ? redact(data.summary) : data.summary,
    experience: data.experience.map((exp) => ({
      ...exp,
      company: PRIVACY_REDACTION,
      logoUrl: undefined,
      bullets: exp.bullets.map(redact),
    })),
    education: data.education.map((ed) => ({
      ...ed,
      institution: PRIVACY_REDACTION,
      logoUrl: undefined,
      bullets: ed.bullets?.map(redact),
    })),
    projects: data.projects.map((p) => ({
      ...p,
      name: PRIVACY_REDACTION,
      url: p.url ? PRIVACY_REDACTION : p.url,
      logoUrl: undefined,
      description: p.description ? redact(p.description) : p.description,
      highlights: p.highlights.map(redact),
    })),
    certifications: data.certifications?.map((c) => ({
      ...c,
      name: redact(c.name),
    })),
    hobbies: data.hobbies?.map((h) => ({
      ...h,
      name: redact(h.name),
      description: h.description ? redact(h.description) : h.description,
    })),
    references: data.references?.map((r) => ({
      ...r,
      name: PRIVACY_REDACTION,
      company: r.company ? PRIVACY_REDACTION : r.company,
      email: r.email ? PRIVACY_REDACTION : r.email,
    })),
    skills: data.skills,
    meta: data.meta,
  };
}
