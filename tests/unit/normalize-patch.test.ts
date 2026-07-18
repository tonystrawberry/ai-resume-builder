import { describe, expect, it } from "vitest";
import {
  extractJsonPatch,
  normalizeResumePatch,
} from "@/lib/ai/enrich-chat";

describe("normalizeResumePatch", () => {
  it("passes through partial resume objects", () => {
    const patch = {
      skills: [
        {
          id: "skill_1",
          name: "TypeScript",
          proficiency: "everyday_work",
          provenance: "ai_suggested",
        },
      ],
    };
    expect(normalizeResumePatch(patch)).toEqual(patch);
  });

  it("converts RFC 6902 replace ops into section objects", () => {
    const ops = [
      {
        op: "replace",
        path: "/skills",
        value: [
          {
            id: "skill_1",
            name: "TypeScript",
            proficiency: "everyday_work",
            provenance: "ai_suggested",
          },
        ],
      },
    ];
    expect(normalizeResumePatch(ops)).toEqual({
      skills: ops[0].value,
    });
  });
});

describe("extractJsonPatch", () => {
  it("extracts and normalizes ops arrays from fenced blocks", () => {
    const text = `Here is an update:
\`\`\`json-patch
[{"op":"replace","path":"/skills","value":[{"id":"s1","name":"Go","provenance":"ai_suggested"}]}]
\`\`\`
`;
    expect(extractJsonPatch(text)).toEqual({
      skills: [{ id: "s1", name: "Go", provenance: "ai_suggested" }],
    });
  });
});
