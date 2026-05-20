"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUpdateWorkOrderNotes } from "@/hooks/useWorkOrders";

interface TechnicianNoteCardProps {
  workOrderId: string;
  initialNote?: string | null;
}

export function TechnicianNoteCard({ workOrderId, initialNote }: TechnicianNoteCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialNote ?? "");
  const { mutate: saveNote, isPending } = useUpdateWorkOrderNotes(workOrderId);

  const handleSave = () => {
    saveNote(draft, { onSuccess: () => setEditing(false) });
  };

  const handleCancel = () => {
    setDraft(initialNote ?? "");
    setEditing(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Nota del técnico</CardTitle>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            {initialNote ? "Editar" : "Agregar"}
          </button>
        )}
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-2">
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              rows={4}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Escribí las observaciones técnicas..."
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={isPending}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isPending}>
                {isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        ) : initialNote ? (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{initialNote}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Sin nota del técnico.</p>
        )}
      </CardContent>
    </Card>
  );
}
