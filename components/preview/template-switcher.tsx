"use client";

import { TEMPLATES, type TemplateId } from "@/lib/resume/templates";
import { Button } from "@/components/ui/button";

export function TemplateSwitcher({
  value,
  onChange,
}: {
  value: TemplateId;
  onChange: (id: TemplateId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {TEMPLATES.map((t) => (
        <Button
          key={t.id}
          size="sm"
          variant={value === t.id ? "default" : "outline"}
          onClick={() => onChange(t.id)}
        >
          {t.name}
        </Button>
      ))}
    </div>
  );
}
