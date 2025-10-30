import React, { useState, useRef, useEffect } from "react";
import { FiInfo, FiCheck, FiCopy } from "react-icons/fi";

/**
 * SemanticSearchInfoIcon (polished UI)
 * - Crisp popover with arrow, shadow, rounded corners
 * - Hover *or* click/tap to open
 * - Copy-to-clipboard
 * - Accessible: keyboard-focusable, ESC to close, ARIA, returns focus
 */
export default function SemanticSearchInfoIcon() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click + ESC, and restore focus to button
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const el = e.target as Node;
      if (panelRef.current?.contains(el) || btnRef.current?.contains(el)) return;
      setOpen(false);
      btnRef.current?.focus();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Focus the panel when it opens (for screen readers / keyboard)
  useEffect(() => {
    if (open) {
      // Give layout a tick so the element exists
      const t = setTimeout(() => panelRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  const infoText = `Upload Exampl2.txt from the backend folder for this P6SemanticSearch project and than ask question Try these searches (semantic matches)
“get my money back”

Should match → [S1] Returns & Refunds

Why: “money back” ≈ refund (meaning match, not exact words).

“swap for a different size”

Should match → [S2] Exchange Instead of Refund

Why: “swap” ≈ exchange; “different size” matches the idea though words differ.

“airline nixed my flight, stuck overnight”

Should match → [S3] Flight Cancellations (Travel Help)

Why: “nixed my flight” ≈ flight canceled; “stuck overnight” ≈ hotel and meal vouchers.

“wifi keeps cutting out”

Should match → [S4] Internet Keeps Dropping

Why: “cutting out” ≈ “keeps dropping”; same problem, different words.

“phone dying too fast”

Should match → [S5] Phone Battery Drains Fast

Why: “dying fast” ≈ “drains fast”, plus battery-saving tips.

“post heart attack follow up to avoid readmission”

Should match → [S6] “Heart Attack” Follow-up (Health)

Why: “heart attack” ≈ “acute myocardial infarction (AMI)”; “avoid readmission” is the same goal.

“can’t log in, forgot my secret”

Should match → [S7] Password Reset

Why: “secret” is casual for password; flow mentions reset link, spam folder.

“change my appointment time”

Should match → [S8] Meeting Reschedule

Why: “change appointment” ≈ reschedule; same intent.`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(infoText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // no-op if clipboard blocked
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-center gap-2">
        <h3 id="semantic-search-heading" className="text-xl font-semibold tracking-tight">
          Semantic Search
        </h3>

        {/* Icon + hover popover */}
        <div className="relative" onMouseLeave={() => setOpen(false)}>
          <button
            ref={btnRef}
            type="button"
            aria-label="Show instructions"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls="semantic-info-panel"
            className="inline-flex items-center justify-center rounded-full p-1
                       transition ring-1 ring-transparent hover:ring-gray-300
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
            onClick={() => setOpen((v) => !v)}
            onMouseEnter={() => setOpen(true)}
          >
            <FiInfo className="w-5 h-5" />
          </button>

          {/* Popover panel */}
          <div
            id="semantic-info-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="false"
            aria-labelledby="semantic-search-heading"
            tabIndex={-1}
            className={`z-20 absolute left-1/2 -translate-x-1/2 mt-3 w-[22rem]
                        rounded-2xl border border-gray-200 bg-white shadow-xl
                        transition-all duration-150 origin-top
                        before:content-[''] before:absolute before:-top-2 before:left-1/2 before:-translate-x-1/2
                        before:border-8 before:border-transparent before:border-b-white
                        ${open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 rounded-t-2xl border-b bg-gradient-to-r from-gray-50 to-white">
              <div className="text-sm font-medium text-gray-900">Testing Guide</div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border
                             hover:bg-gray-50 active:scale-[0.98] transition"
                >
                  {copied ? <FiCheck className="h-3.5 w-3.5" /> : <FiCopy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  className="ml-1 text-xs px-2 py-1 rounded-md border hover:bg-gray-50"
                  onClick={() => {
                    setOpen(false);
                    btnRef.current?.focus();
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-3">
              <p className="text-xs mb-2 text-gray-600">
                Hover the info icon or click/tap to open. Press <kbd className="px-1 py-0.5 border rounded">Esc</kbd> to close.
              </p>
              <div
                className="rounded-xl border bg-gray-50/60 p-3 max-h-72 overflow-auto
                           [scrollbar-width:thin] [scrollbar-color:#cfcfcf_transparent]"
              >
                <pre className="whitespace-pre-wrap font-mono text-[13px] leading-6 text-gray-800">
{infoText}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Helper blurb */}
      <p className="mt-3 text-gray-600 text-sm">
        Hover or click the info icon to see instructions for testing your semantic search.
      </p>
    </div>
  );
}
