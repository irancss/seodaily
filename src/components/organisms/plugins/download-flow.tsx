"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { Icon } from "@/components/atoms";
import { downloadStatusAction, logoutDownloadAction, requestGrantAction, requestOtpAction, verifyOtpAction } from "@/modules/downloads/actions";

type Step = "phone" | "code";

const toLatin = (s: string) => s.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

function useCountdown(seconds: number) {
  const [left, setLeft] = useState(seconds);
  const [anchor, setAnchor] = useState(0);
  useEffect(() => {
    if (!anchor) return;
    const t = setInterval(() => setLeft(Math.max(0, Math.ceil((anchor - Date.now()) / 1000))), 500);
    return () => clearInterval(t);
  }, [anchor]);
  return { left, start: (s: number) => { setLeft(s); setAnchor(Date.now() + s * 1000); } };
}

/** Button for one version: link request, and the phone/code dialog when this browser is not verified yet. */
export function DownloadButton({ releaseId, version, primary }: { releaseId: number; version: string; primary: boolean }) {
  const [link, setLink] = useState<{ url: string; expiresAt: number } | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!link) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [link]);

  const getLink = () =>
    start(async () => {
      setError("");
      const r = await requestGrantAction({ releaseId });
      if (r.ok) setLink({ url: r.url, expiresAt: Date.parse(r.expiresAt) });
      else if ("needsVerification" in r && r.needsVerification) setOpen(true);
      else setError(r.message);
    });

  const expired = link && now > 0 && now >= link.expiresAt;
  return (
    <div className="flex flex-col items-end gap-2">
      {link && !expired ? (
        <a href={link.url} className="btn btn-primary h-11 gap-2 px-5 text-sm" download>
          <Icon name="download" size={18} />
          دریافت فایل <span dir="ltr">{version}</span>
        </a>
      ) : (
        <button type="button" onClick={getLink} disabled={pending} className={`btn h-11 gap-2 px-5 text-sm ${primary ? "btn-primary" : "btn-secondary"}`}>
          <Icon name="download" size={18} />
          {pending ? "لطفاً صبر کنید…" : expired ? "لینک تازه" : <>دانلود نسخه <span dir="ltr">{version}</span></>}
        </button>
      )}
      {link && !expired && <p className="text-xs text-muted">این لینک تا ۱۰ دقیقه و فقط در همین مرورگر کار می‌کند.</p>}
      {error && (
        <p role="alert" className="max-w-[320px] text-end text-xs text-error">
          {error}
        </p>
      )}
      {open && <VerifyDialog onClose={() => setOpen(false)} onVerified={() => { setOpen(false); getLink(); }} />}
    </div>
  );
}

function VerifyDialog({ onClose, onVerified }: { onClose: () => void; onVerified: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState("");
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const resend = useCountdown(0);
  const expiry = useCountdown(0);

  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);

  const send = (form?: FormData) =>
    start(async () => {
      setMessage("");
      const r = await requestOtpAction({ phone, website: String(form?.get("website") ?? "") });
      if (!r.ok) {
        setMessage(r.message);
        if (r.retryAfterS && r.retryAfterS < 120) resend.start(r.retryAfterS);
        return;
      }
      setChallenge(r.challengeId);
      setCode("");
      setStep("code");
      resend.start(r.resendInS);
      expiry.start(r.expiresInS);
    });

  const verify = () =>
    start(async () => {
      setMessage("");
      const r = await verifyOtpAction({ challengeId: challenge, phone, code });
      if (r.ok) onVerified();
      else setMessage(r.message);
    });

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="verify-title" className="m-auto w-[min(92vw,420px)] rounded-xl border border-line bg-white p-0 text-ink shadow-xl backdrop:bg-black/40">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id="verify-title" className="text-lg font-bold">
            {step === "phone" ? "تأیید شماره موبایل" : "کد تأیید"}
          </h2>
          <button type="button" onClick={() => ref.current?.close()} className="rounded p-1 text-muted hover:text-ink" aria-label="بستن">
            <Icon name="close" size={20} />
          </button>
        </div>
        {step === "phone" ? (
          <form
            className="mt-4 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(new FormData(e.currentTarget));
            }}
          >
            <label htmlFor="dl-phone" className="text-sm font-medium">
              شماره موبایل ایران
            </label>
            <input
              id="dl-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              required
              maxLength={20}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09121234567"
              className="field h-12 text-center text-lg tracking-wide"
              aria-describedby="dl-phone-hint"
            />
            <p id="dl-phone-hint" className="text-xs leading-[1.8] text-muted">
              یک کد {`۴`} رقمی پیامک می‌شود. فقط شماره‌های ایران پذیرفته می‌شوند.
            </p>
            {/* Honeypot: hidden from people and assistive tech, never autofilled. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label>
                وب‌سایت
                <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
              </label>
            </div>
            <button type="submit" disabled={pending || resend.left > 0} className="btn btn-primary h-12">
              {pending ? "در حال ارسال…" : resend.left > 0 ? `ارسال دوباره تا ${resend.left.toLocaleString("fa-IR")} ثانیه` : "ارسال کد"}
            </button>
          </form>
        ) : (
          <form
            className="mt-4 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              verify();
            }}
          >
            <label htmlFor="dl-code" className="text-sm font-medium">
              کد پیامک‌شده به <span dir="ltr">{phone}</span>
            </label>
            <input
              id="dl-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              dir="ltr"
              required
              maxLength={4}
              pattern="[0-9۰-۹٠-٩]{4}"
              value={code}
              onChange={(e) => setCode(toLatin(e.target.value).replace(/\D/g, "").slice(0, 4))}
              className="field h-12 text-center text-2xl tracking-[0.5em]"
              aria-describedby="dl-code-hint"
              autoFocus
            />
            <p id="dl-code-hint" className="text-xs text-muted" aria-live="polite">
              {expiry.left > 0 ? `اعتبار کد: ${expiry.left.toLocaleString("fa-IR")} ثانیه` : "مهلت کد تمام شده است؛ کد تازه بگیرید."}
            </p>
            <button type="submit" disabled={pending || code.length !== 4} className="btn btn-primary h-12">
              {pending ? "در حال بررسی…" : "تأیید و ادامه"}
            </button>
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <button type="button" className="text-brand-hover disabled:text-muted" disabled={pending || resend.left > 0} onClick={() => send()}>
                {resend.left > 0 ? `ارسال دوباره (${resend.left.toLocaleString("fa-IR")})` : "ارسال دوباره کد"}
              </button>
              <button type="button" className="text-ink-2" onClick={() => { setStep("phone"); setMessage(""); }}>
                تغییر شماره
              </button>
            </div>
          </form>
        )}
        {message && (
          <p role="alert" className="mt-3 rounded-md bg-error-bg p-2.5 text-sm text-error">
            {message}
          </p>
        )}
      </div>
    </dialog>
  );
}

/** «Not you?» link: ends this browser's download session. */
export function DownloadSessionNote() {
  const [state, setState] = useState<{ verified: boolean; phoneMasked: string } | null>(null);
  const [pending, start] = useTransition();
  useEffect(() => {
    void downloadStatusAction().then(setState);
  }, []);
  if (!state?.verified) return null;
  return (
    <p className="mt-2 text-xs text-muted">
      شماره تأییدشده این مرورگر: <span dir="ltr">{state.phoneMasked}</span> ·{" "}
      <button type="button" disabled={pending} className="text-brand-hover underline" onClick={() => start(async () => { await logoutDownloadAction(); setState({ verified: false, phoneMasked: "" }); })}>
        خروج از این مرورگر
      </button>
    </p>
  );
}
