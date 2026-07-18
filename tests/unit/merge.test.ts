import { describe, expect, it } from "vitest";
import { mergeMasterResume, applyConfirmedPatch } from "@/lib/resume/merge";
import { createEmptyMasterResume } from "@/lib/resume/empty-profile";

describe("mergeMasterResume", () => {
  it("dedupes experience by company+title when ids differ on re-import", () => {
    const base = createEmptyMasterResume("Ada");
    base.experience = [
      {
        id: "exp_old",
        company: "Acme Cloud",
        title: "Senior Software Engineer",
        bullets: ["Led platform work"],
        metrics: [],
        provenance: "linkedin",
      },
    ];
    const incoming = createEmptyMasterResume("Ada");
    incoming.experience = [
      {
        id: "exp_new",
        company: "Acme Cloud",
        title: "Senior Software Engineer",
        bullets: ["Led platform reliability initiatives"],
        metrics: [],
        provenance: "linkedin",
      },
    ];
    const { data } = mergeMasterResume(base, incoming, {
      incomingSource: "linkedin",
    });
    expect(data.experience).toHaveLength(1);
    expect(data.experience[0].id).toBe("exp_old");
  });

  it("does not overwrite user-confirmed experience", () => {
    const base = createEmptyMasterResume("Ada");
    base.experience = [
      {
        id: "exp1",
        company: "Acme",
        title: "Engineer",
        bullets: ["Built APIs"],
        metrics: ["+20% conversion"],
        provenance: "user",
      },
    ];
    const incoming = createEmptyMasterResume("Ada");
    incoming.experience = [
      {
        id: "exp1",
        company: "Acme",
        title: "Junior Engineer",
        bullets: ["Did things"],
        metrics: [],
        provenance: "linkedin",
      },
    ];
    const { data } = mergeMasterResume(base, incoming, {
      incomingSource: "linkedin",
    });
    expect(data.experience[0].title).toBe("Engineer");
    expect(data.experience[0].provenance).toBe("user");
  });
});

describe("applyConfirmedPatch", () => {
  it("upgrades ai_suggested provenance to user", () => {
    const base = createEmptyMasterResume("Ada");
    const next = applyConfirmedPatch(base, {
      experience: [
        {
          id: "exp2",
          company: "Beta",
          title: "Lead",
          bullets: ["Shipped feature"],
          metrics: ["Cut latency 40%"],
          provenance: "ai_suggested",
        },
      ],
    });
    expect(next.experience[0].provenance).toBe("user");
  });
});
