export type TemplateId = "classic" | "modern";

export type TemplateMeta = {
  id: TemplateId;
  name: string;
  description: string;
};

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Clean single-column layout for traditional applications",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Two-tone layout with stronger visual hierarchy",
  },
];

export function isTemplateId(value: string): value is TemplateId {
  return value === "classic" || value === "modern";
}
