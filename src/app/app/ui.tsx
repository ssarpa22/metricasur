"use client";

import { useState, useCallback, type ReactNode } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby={title ? "dialog-title" : undefined}>
      <div className="fixed inset-0 bg-[var(--foreground-secondary)]/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-[70] w-full max-w-2xl mx-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-2xl p-6 ${className ?? ""}`} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="flex items-center gap-2 mb-1">
            <Info size={20} className="text-[var(--accent)]" />
            <h2 className="text-lg font-semibold text-[var(--foreground-secondary)]" id="dialog-title">{title}</h2>
          </div>
        )}
        {description && <p className="text-sm text-[var(--muted-light)] mb-6">{description}</p>}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = "Confirmar", cancelLabel = "Cancelar", destructive = false }: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--muted-light)] hover:bg-[var(--surface-hover)]">
          {cancelLabel}
        </button>
        <button onClick={() => { onConfirm(); onClose(); }} className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${destructive ? "bg-[var(--error)] hover:bg-[var(--error-hover)]" : "bg-[var(--accent)] hover:bg-[var(--accent-hover)]"}`}>
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}

type ToastType = "success" | "error" | "info" | "warning";

const toastIcons: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertCircle,
};

const toastColors: Record<ToastType, string> = {
  success: "bg-[var(--success-light)] text-[var(--success)] border-[var(--success-light)]",
  error: "bg-[var(--error-light)] text-[var(--error)] border-[var(--error-light)]",
  info: "bg-[var(--accent-light)] text-[var(--accent)] border-[var(--accent-light)]",
  warning: "bg-[var(--warning-light)] text-[var(--warning)] border-[var(--warning-light)]",
};

type Toast = { id: string; type: ToastType; title: string; message?: string };

type ToastContainerProps = {
  toasts: Toast[];
  onDismiss: (id: string) => void;
};

type ToastItemProps = {
  toast: Toast;
  onDismiss: (id: string) => void;
};

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const Icon = toastIcons[toast.type];
  return (
    <div className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg ${toastColors[toast.type]}`}>
      <Icon size={20} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.message && <p className="mt-1 text-xs text-[var(--muted-light)]">{toast.message}</p>}
      </div>
      <button onClick={() => onDismiss(toast.id)} className="ml-2 rounded-lg p-1 text-[var(--muted-light)] hover:bg-[var(--surface-hover)]"><X size={16} /></button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed top-6 right-6 z-[70] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />)}
    </div>
  );
}

type UseToastReturn = {
  toasts: Toast[];
  toast: (type: ToastType, title: string, message?: string) => string;
  dismiss: (id: string) => void;
};

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, toast, dismiss };
}

type TableColumn<T> = {
  key: string;
  label: string;
  render?: (value: unknown, row: T) => ReactNode;
  sortable?: boolean;
};

type DataTableProps<T> = {
  columns: TableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  className?: string;
};

export function DataTable<T extends Record<string, unknown>>({ columns, data, emptyMessage = "No hay datos disponibles", className }: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className={`rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8 text-center ${className ?? ""}`}>
        <p className="text-sm font-semibold text-[var(--foreground-secondary)]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden ${className ?? ""}`}>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[var(--line-light)]">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-[10px] font-semibold text-[var(--muted-light)] uppercase tracking-[0.15em]">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--line-light)]">
          {data.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-[var(--surface-hover)]">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm text-[var(--foreground-secondary)]">
                  {col.render ? col.render(row[col.key as keyof T], row) : String(row[col.key as keyof T])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type FormFieldProps = {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  children?: ReactNode;
  multiline?: boolean;
  rows?: number;
};

export function FormField({ label, name, type = "text", defaultValue, placeholder, error, required, children, multiline = false, rows = 3 }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-xs font-semibold text-[var(--muted-light)]">
        {label}
        {required && <span className="text-[var(--error)]">*</span>}
      </label>
      {children ? (
        children
      ) : multiline ? (
        <textarea name={name} defaultValue={defaultValue ?? ""} placeholder={placeholder} rows={rows} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm font-normal outline-none focus:border-[var(--accent)]" />
      ) : (
        <input name={name} type={type} defaultValue={defaultValue ?? ""} placeholder={placeholder} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm font-normal outline-none focus:border-[var(--accent)]" />
      )}
      {error && <p className="text-[10px] text-[var(--error)]">{error}</p>}
    </div>
  );
}
