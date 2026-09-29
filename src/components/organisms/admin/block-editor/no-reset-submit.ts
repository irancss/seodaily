"use client";

import { startTransition, type FormEvent } from "react";

/**
 * Submits a form to a useActionState action without React's automatic form
 * reset. The reset would put hidden fields (the editor's JSON) back to their
 * page-load value, so a second save could send stale content.
 */
export function submitWithoutReset(action: (form: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(() => action(form));
  };
}
