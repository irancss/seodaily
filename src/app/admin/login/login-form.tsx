"use client";

import { useActionState } from "react";

import { login, type LoginState } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="mt-8 flex flex-col gap-5">
      {state.error && (
        <p role="alert" className="rounded-sm bg-error-bg px-4 py-3 text-sm font-medium text-error">
          {state.error}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="field-label">
          ایمیل
        </label>
        <input id="email" name="email" type="email" dir="ltr" autoComplete="username" required defaultValue={state.email} className="field" />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="field-label">
          رمز عبور
        </label>
        <input id="password" name="password" type="password" dir="ltr" autoComplete="current-password" required className="field" />
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary mt-2 h-12">
        {pending ? "در حال ورود…" : "ورود به پنل"}
      </button>
    </form>
  );
}
