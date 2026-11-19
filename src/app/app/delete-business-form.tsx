"use client";

import type { FormEvent } from "react";
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
        className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
      >
        <Trash2 size={14}/> Eliminar “{businessName}”
      </button>
    </form>
  );
}
