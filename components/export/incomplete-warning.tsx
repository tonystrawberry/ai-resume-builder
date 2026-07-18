"use client";

import { Button } from "@/components/ui/button";

export function IncompleteWarning({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="rounded-lg border border-danger/40 bg-card p-4">
      <p className="font-medium">Resume looks incomplete</p>
      <p className="mt-1 text-sm text-muted">
        Critical fields (like name or email) may be missing. Export anyway?
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="danger" onClick={onConfirm}>
          Export anyway
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Keep editing
        </Button>
      </div>
    </div>
  );
}
