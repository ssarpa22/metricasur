"use client";

import type { FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { deleteBusiness } from "./actions";

type DeleteBusinessFormProps = {
  businessId: string;
  businessName: string;
};

export function DeleteBusinessForm({ businessId, businessName }: DeleteBusinessFormProps) {
  function confirmDeletion(event: FormEvent<HTMLFormElement>) {
    const confirmed = window.confirm(
      `¿Eliminar definitivamente “${businessName}”? Se borrarán también sus miembros y módulos. Esta acción no se puede deshacer.`,
    );

    if (!confirmed) event.preventDefault();
  }

  return (
    <form action={deleteBusiness} onSubmit={confirmDeletion} className="mt-3">
      <input type="hidden" name="businessId" value={businessId}/>
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--error)] hover:bg-[var(--error-light)]/50 hover:text-[var(--error)]"
      >
        <Trash2 size={14}/> Eliminar “{businessName}”
      </button>
    </form>
  );
}
