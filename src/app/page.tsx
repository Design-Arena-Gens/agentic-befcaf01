"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

import { ledgerParties } from "@/data/ledgerData";
import { DEFAULT_EMAIL_BODY, DEFAULT_EMAIL_SUBJECT } from "@/constants/emailDefaults";
import { getFinancialYearStart } from "@/lib/ledger";

type SendStatus =
  | { state: "idle" }
  | { state: "success"; message: string }
  | { state: "error"; message: string };

const dateRangeLabel = () => {
  const start = getFinancialYearStart();
  const end = dayjs();
  return `${start.format("DD MMM YYYY")} → ${end.format("DD MMM YYYY")}`;
};

const hotkeyLegend = [
  { keys: "Alt + B", action: "Open custom email from vouchers" },
  { keys: "Alt + S", action: "Send email while popup is open" },
  { keys: "Esc", action: "Close popup without sending" },
];

const EmailModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const [partyId, setPartyId] = useState(() => ledgerParties[0]?.id ?? "");
  const party = useMemo(() => ledgerParties.find((item) => item.id === partyId), [partyId]);
  const [email, setEmail] = useState(party?.email ?? "");
  const [subject, setSubject] = useState(DEFAULT_EMAIL_SUBJECT);
  const [body, setBody] = useState(DEFAULT_EMAIL_BODY);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<SendStatus>({ state: "idle" });

  const handleSubmit = useCallback(async () => {
    if (!partyId) {
      setStatus({ state: "error", message: "Please select a Party Ledger" });
      return;
    }

    if (!email) {
      setStatus({ state: "error", message: "Please enter an Email Address" });
      return;
    }

    setIsSending(true);
    setStatus({ state: "idle" });

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partyId,
          email,
          subject,
          body,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? "Failed to send email");
      }

      const payload = await response.json();
      const successMessage = payload?.message ?? "Email sent successfully!";
      const savedPathSegment = payload?.savedPath ? ` Saved to ${payload.savedPath}.` : "";
      setStatus({ state: "success", message: `${successMessage}${savedPathSegment}` });
    } catch (error) {
      setStatus({
        state: "error",
        message: error instanceof Error ? error.message : "Failed to send email",
      });
    } finally {
      setIsSending(false);
    }
  }, [body, email, partyId, subject]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        handleSubmit();
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSubmit, onClose, open]);

  useEffect(() => {
    if (party) {
      setEmail(party.email);
    }
  }, [party]);

  useEffect(() => {
    if (open) {
      setStatus({ state: "idle" });
      setIsSending(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        <header className="border-b border-zinc-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-zinc-900">Send Custom Email</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Attach ledger statement PDF automatically generated for the selected party.
          </p>
        </header>
        <div className="grid gap-6 px-6 py-6 sm:grid-cols-[minmax(0,1fr)_16rem]">
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmit();
            }}
          >
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-zinc-800">Select Party</span>
              <select
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                value={partyId}
                onChange={(event) => setPartyId(event.target.value)}
              >
                <option value="" disabled>
                  -- Select Ledger --
                </option>
                {ledgerParties.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-zinc-800">Email Address</span>
              <input
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="party@example.com"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-zinc-800">Subject</span>
              <input
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-zinc-800">Body</span>
              <textarea
                className="min-h-[160px] w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />
            </label>

            {status.state !== "idle" ? (
              <div
                className={`rounded-lg border px-3 py-2 text-sm ${
                  status.state === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {status.message}
              </div>
            ) : null}

            <div className="mt-1 flex flex-wrap gap-3">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:bg-sky-300"
                disabled={isSending}
              >
                {isSending ? "Sending..." : "Send Email (Alt+S)"}
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
                onClick={onClose}
              >
                Cancel (Esc)
              </button>
            </div>
          </form>

          <aside className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Ledger Snapshot
              </h3>
              <p className="mt-2 font-semibold text-zinc-900">{party?.name ?? "No party selected"}</p>
              <p className="text-xs text-zinc-500">Date range: {dateRangeLabel()}</p>
            </div>
            <ul className="flex flex-col gap-3 text-xs text-zinc-600">
              <li>
                • PDF saved to <span className="font-medium text-zinc-900">E:\Tally Test\Tally PDF\</span>
              </li>
              <li>
                • Auto attaches ledger statement formatted the same way Tally generates it.
              </li>
              <li>
                • Uses your SMTP configuration from Tally (F12 &gt; E-Mailing).
              </li>
            </ul>
            <div className="rounded-lg border border-dashed border-sky-300 bg-white p-3 text-xs text-sky-700">
              Subject, body, and recipient are fully editable right before sending.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showShortcutHint, setShowShortcutHint] = useState(false);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.altKey && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setIsModalOpen(true);
        setShowShortcutHint(true);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-16 md:px-12 lg:px-24">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-400">Tally Prime</p>
            <h1 className="mt-2 text-3xl font-semibold md:text-4xl">
              Custom Email with Ledger Statement Attachment
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-300">
              Send invoices and ledger statements without leaving your voucher screens. Press{" "}
              <span className="rounded bg-sky-500/20 px-2 py-1 font-semibold text-sky-200">Alt + B</span> from any Sales
              or Accounting voucher to open the email composer instantly.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200 shadow-lg shadow-sky-500/5 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-300">Financial Year</p>
            <p className="mt-2 text-lg font-semibold text-white">{dateRangeLabel()}</p>
            <p className="text-xs text-slate-400">Ledger PDFs generated within this date window.</p>
          </div>
        </header>

        <main className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <section className="flex flex-col justify-between gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-sky-950/20">
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Method 1: From Voucher (Recommended)</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Open any voucher, press <span className="font-semibold text-sky-200">Alt + B</span>, and the email
                  window appears with party details auto-filled.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-200">
                <p className="font-semibold text-white">Voucher Actions</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>1) Pick a Sales, Purchase, or Journal voucher</li>
                  <li>2) Confirm the party &amp; entries</li>
                  <li>3) Hit Alt + B to compose and attach instantly</li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-sky-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-sky-500/40 transition hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200"
            >
              Open Custom Email (Alt + B)
            </button>
          </section>

          <aside className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200 shadow-xl shadow-sky-950/20">
            <div>
              <h3 className="text-base font-semibold text-white">Method 2: From Gateway</h3>
              <p className="mt-2 text-sm text-slate-300">
                Gateway of Tally → <span className="font-semibold text-sky-200">&ldquo;Send Custom Email&rdquo;</span>.
                You will see the same email popup ready for dispatch.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-300">Your Shortcuts</h4>
              <ul className="mt-3 space-y-3">
                {hotkeyLegend.map((item) => (
                  <li
                    key={item.keys}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2"
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">{item.action}</span>
                    <span className="rounded-lg bg-sky-500/20 px-3 py-1 text-xs font-semibold text-sky-200">
                      {item.keys}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-dashed border-emerald-400/40 bg-emerald-500/10 p-4 text-xs text-emerald-100">
              Make sure <span className="font-semibold">E:\Tally Test\Tally PDF\</span> exists so PDFs save without any
              interruptions.
            </div>
          </aside>
        </main>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200 shadow-xl shadow-sky-950/20">
          <h2 className="text-lg font-semibold text-white">What Happens When You Send</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            {[
              {
                title: "1. Validation",
                description: "Checks that the party and email address are present before sending.",
              },
              {
                title: "2. Ledger PDF",
                description: "Generates a fresh ledger statement PDF covering the financial year-to-date.",
              },
              {
                title: "3. Email Dispatch",
                description: "Uses your SMTP settings to email the party with the PDF attached.",
              },
              {
                title: "4. Confirmation",
                description: 'Displays “Email sent successfully with Ledger attachment!” once done.',
              },
            ].map((step) => (
              <div key={step.title} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-sm font-semibold text-white">{step.title}</p>
                <p className="mt-2 text-xs text-slate-300">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {showShortcutHint ? (
          <div className="fixed bottom-6 right-6 rounded-2xl border border-white/20 bg-sky-600/80 px-4 py-3 text-sm shadow-lg shadow-sky-500/40">
            Email popup triggered — try Alt + S to send instantly.
          </div>
        ) : null}
      </div>

      <EmailModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setShowShortcutHint(false);
        }}
      />
    </div>
  );
}
