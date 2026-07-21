import { describe, expect, it } from "vitest";
import { createEmptyMasterResume } from "@/lib/resume/empty-profile";
import {
  PRIVACY_REDACTION,
  collectSensitiveTerms,
  redactMasterResumeForExport,
  redactSensitiveText,
} from "@/lib/resume/privacy";

describe("collectSensitiveTerms", () => {
  it("collects full name, name tokens, and project names (longest first)", () => {
    const data = createEmptyMasterResume("Alex Rivera");
    data.projects = [
      {
        id: "p1",
        name: "Acme Dashboard",
        highlights: [],
        technologies: [],
        provenance: "user",
      },
    ];
    const terms = collectSensitiveTerms(data);
    expect(terms[0]).toBe("Acme Dashboard");
    expect(terms).toContain("Alex Rivera");
    expect(terms).toContain("Alex");
    expect(terms).toContain("Rivera");
  });

  it("skips placeholder Your Name", () => {
    const data = createEmptyMasterResume("Your Name");
    expect(collectSensitiveTerms(data)).toEqual([]);
  });
});

describe("redactSensitiveText", () => {
  it("replaces project mentions case-insensitively", () => {
    const out = redactSensitiveText(
      "Shipped Acme Dashboard and acme dashboard polish",
      ["Acme Dashboard"],
    );
    expect(out).toBe(
      `Shipped ${PRIVACY_REDACTION} and ${PRIVACY_REDACTION} polish`,
    );
  });
});

describe("redactMasterResumeForExport", () => {
  it("clears identity PII, photo, links and redacts project names in text", () => {
    const data = createEmptyMasterResume("Alex Rivera");
    data.identity.email = "alex@example.com";
    data.identity.phone = "+1 555";
    data.identity.location = "Tokyo";
    data.identity.photoUrl = "/photo.png";
    data.identity.links = [{ label: "GitHub", url: "https://github.com/a" }];
    data.identity.headline = "Engineer";
    data.summary = "Built Acme Dashboard at Spacely.";
    data.experience = [
      {
        id: "e1",
        company: "Spacely",
        title: "Engineer",
        bullets: ["Led Acme Dashboard launch"],
        provenance: "user",
      },
    ];
    data.education = [
      {
        id: "ed1",
        institution: "Tokyo Tech",
        logoUrl: "/school.png",
        bullets: ["Research at Tokyo Tech"],
        provenance: "user",
      },
    ];
    data.projects = [
      {
        id: "p1",
        name: "Acme Dashboard",
        url: "https://acme.example.com",
        description: "Internal tool",
        highlights: ["Acme Dashboard v2"],
        technologies: ["TS"],
        provenance: "user",
      },
    ];
    data.references = [
      {
        id: "r1",
        name: "Jordan Lee",
        role: "Manager",
        company: "Spacely",
        email: "jordan@example.com",
        provenance: "user",
      },
    ];

    const next = redactMasterResumeForExport(data);

    expect(next.identity.fullName).toBe(PRIVACY_REDACTION);
    expect(next.identity.email).toBe(PRIVACY_REDACTION);
    expect(next.identity.phone).toBe(PRIVACY_REDACTION);
    expect(next.identity.location).toBe(PRIVACY_REDACTION);
    expect(next.identity.photoUrl).toBeUndefined();
    expect(next.identity.links).toEqual([]);
    expect(next.identity.headline).toBe("Engineer");
    expect(next.summary).toContain(PRIVACY_REDACTION);
    expect(next.summary).not.toContain("Acme Dashboard");
    expect(next.experience[0].bullets[0]).not.toContain("Acme Dashboard");
    expect(next.projects[0].name).toBe(PRIVACY_REDACTION);
    expect(next.projects[0].url).toBe(PRIVACY_REDACTION);
    expect(next.projects[0].highlights[0]).toContain(PRIVACY_REDACTION);
    expect(next.projects[0].highlights[0]).not.toContain("Acme Dashboard");
    expect(next.references?.[0].name).toBe(PRIVACY_REDACTION);
    expect(next.references?.[0].email).toBe(PRIVACY_REDACTION);
    expect(next.references?.[0].company).toBe(PRIVACY_REDACTION);
    expect(next.references?.[0].role).toBe("Manager");
    expect(next.experience[0].company).toBe(PRIVACY_REDACTION);
    expect(next.education[0].institution).toBe(PRIVACY_REDACTION);
    expect(next.education[0].logoUrl).toBeUndefined();
    expect(next.education[0].bullets?.[0]).not.toContain("Tokyo Tech");
    // Original untouched
    expect(data.identity.fullName).toBe("Alex Rivera");
    expect(data.identity.photoUrl).toBe("/photo.png");
    expect(data.references?.[0].name).toBe("Jordan Lee");
    expect(data.education[0].institution).toBe("Tokyo Tech");
  });
});
