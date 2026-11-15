"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

// Form yang memanggil server action (prev, formData) => { ok } | { error } dan menampilkan hasilnya.
export function ActionForm({ action, children, className = "", resetOnOk = false }) {
  const [state, formAction] = useActionState(action, null);
  const ref = useRef(null);
  useEffect(() => {
    if (resetOnOk && state?.reset) ref.current?.reset();
  }, [state, resetOnOk]);
  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      {state?.error && <p className="note err">{state.error}</p>}
      {state?.ok && <p className="note ok">{state.ok}</p>}
    </form>
  );
}

export function Submit({ children, className = "btn btn-primary", pendingText = "Menyimpan…" }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingText : children}
    </button>
  );
}

// Tombol submit yang minta konfirmasi dulu (untuk hapus)
export function ConfirmSubmit({ children, message, className = "link-danger" }) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

export function CopyButton({ text, children = "Salin", className = "btn-mini" }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setDone(true);
        setTimeout(() => setDone(false), 1600);
      }}
    >
      {done ? "Tersalin ✓" : children}
    </button>
  );
}
