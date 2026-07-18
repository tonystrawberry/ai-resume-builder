import { describe, expect, it } from "vitest";
import {
  applyTranslatedText,
  toTranslateTextPayload,
} from "@/lib/ai/translate";
import type { MasterResume } from "@/lib/resume/schema";

const sample: MasterResume = {
  identity: {
    fullName: "Jane Doe",
    email: "jane@example.com",
    location: "Berlin",
    photoUrl: "/uploads/user/photo.png",
    links: [{ label: "GitHub", url: "https://github.com/jane" }],
  },
  summary: "Engineer",
  experience: [
    {
      id: "exp1",
      company: "Acme",
      title: "Engineer",
      bullets: ["Built APIs"],
      metrics: [],
      logoUrl: "/uploads/logos/exp1.png",
      provenance: "user",
    },
  ],
  education: [
    {
      id: "edu1",
      institution: "TU",
      degree: "B.Sc.",
      field: "CS",
      logoUrl: "/uploads/logos/edu1.png",
      provenance: "user",
    },
  ],
  skills: [
    { id: "sk1", name: "TypeScript", proficiency: "everyday_work", provenance: "user" },
  ],
  projects: [
    {
      id: "pr1",
      name: "App",
      description: "Cool app",
      url: "https://example.com",
      highlights: ["Shipped"],
      technologies: ["Rails"],
      provenance: "user",
    },
  ],
  certifications: [
    {
      id: "cert1",
      name: "AWS SAP",
      issuer: "Amazon",
      logoUrl: "/uploads/logos/cert1.png",
      provenance: "user",
    },
  ],
  references: [
    {
      id: "ref1",
      name: "Alex Manager",
      role: "Engineering Manager",
      company: "Acme",
      email: "alex@acme.com",
      provenance: "user",
    },
  ],
  meta: { schemaVersion: 1, gaps: [] },
};

describe("translate text payload", () => {
  it("omits photo and logo URLs from the LLM payload", () => {
    const payload = toTranslateTextPayload(sample);
    const json = JSON.stringify(payload);
    expect(json).not.toContain("/uploads/");
    expect(json).not.toContain("photoUrl");
    expect(json).not.toContain("logoUrl");
    expect(json).not.toContain("jane@example.com");
    expect(json).not.toContain("alex@acme.com");
    expect(payload.identity.fullName).toBe("Jane Doe");
    expect(payload.experience[0].id).toBe("exp1");
    expect(payload.references[0].name).toBe("Alex Manager");
    expect(payload.references[0]).not.toHaveProperty("email");
  });

  it("re-applies translated text without losing media URLs", () => {
    const payload = toTranslateTextPayload(sample);
    const translated = {
      ...payload,
      summary: "エンジニア",
      experience: [
        {
          ...payload.experience[0],
          title: "エンジニア",
          bullets: ["APIを構築"],
        },
      ],
      references: [
        {
          ...payload.references[0],
          role: "エンジニアリングマネージャー",
        },
      ],
    };
    const merged = applyTranslatedText(sample, translated);
    expect(merged.summary).toBe("エンジニア");
    expect(merged.experience[0].title).toBe("エンジニア");
    expect(merged.identity.photoUrl).toBe("/uploads/user/photo.png");
    expect(merged.experience[0].logoUrl).toBe("/uploads/logos/exp1.png");
    expect(merged.identity.email).toBe("jane@example.com");
    expect(merged.projects[0].url).toBe("https://example.com");
    expect(merged.references[0].role).toBe("エンジニアリングマネージャー");
    expect(merged.references[0].email).toBe("alex@acme.com");
  });
});
