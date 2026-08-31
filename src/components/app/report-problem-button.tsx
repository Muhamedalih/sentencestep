"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2, TriangleAlert, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { submitProblemReport } from "@/lib/reports/actions";

const MAX_MESSAGE_LENGTH = 1000;
const SUCCESS_AUTOCLOSE_MS = 1800;

/**
 * A floating "Report a problem" affordance, mounted once for every
 * signed-in learner (src/app/learn/(dashboard)/layout.tsx) — guests are
 * never shown this, since a report needs a real email to follow up on (see
 * submitProblemReport, and problem_reports' RLS insert policy). Submissions
 * land in Admin > Reports (src/app/admin/reports/page.tsx).
 */
export function ReportProblemButton() {
  const { t } = useLocale();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [phase, setPhase] = useState<"idle" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      const id = window.setTimeout(() => textareaRef.current?.focus(), 150);
      return () => window.clearTimeout(id);
    }
  }, [isOpen]);

  useEffect(() => {
    if (phase !== "success") return;
    const id = window.setTimeout(() => closeAndReset(), SUCCESS_AUTOCLOSE_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  function closeAndReset() {
    setIsOpen(false);
    // Deferred past the close animation so the card doesn't visibly reset mid-exit.
    window.setTimeout(() => {
      setMessage("");
      setPhase("idle");
      setError(null);
    }, 300);
  }

  function handleSubmit() {
    if (!message.trim()) {
      setError(t.reportProblem.errorEmpty);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await submitProblemReport({ message, pagePath: pathname });
      if (!result.ok) {
        setError(
          result.code === "empty" ? t.reportProblem.errorEmpty : t.reportProblem.errorGeneric,
        );
        return;
      }
      setPhase("success");
    });
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setIsOpen(true)}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="border-border bg-card text-foreground fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium shadow-lg backdrop-blur-sm hover:border-amber-500/40"
        aria-haspopup="dialog"
      >
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500/60 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
        </span>
        <TriangleAlert className="size-4 text-amber-500" aria-hidden="true" />
        {t.reportProblem.buttonLabel}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-background/80 fixed inset-0 z-100 flex items-center justify-center p-6 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={t.reportProblem.modalTitle}
            onClick={(event) => {
              if (event.target === event.currentTarget && !isPending) closeAndReset();
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="border-border bg-card relative w-full max-w-md rounded-2xl border p-6 shadow-2xl"
            >
              <button
                type="button"
                onClick={closeAndReset}
                disabled={isPending}
                aria-label={t.reportProblem.cancel}
                className="text-muted-foreground hover:text-foreground hover:bg-muted absolute top-4 right-4 rounded-full p-1 transition-colors disabled:opacity-40"
              >
                <X className="size-4" />
              </button>

              <AnimatePresence mode="wait">
                {phase === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-3 py-6 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.05 }}
                    >
                      <CheckCircle2 className="text-success size-12" />
                    </motion.div>
                    <h2 className="text-lg font-semibold tracking-tight">
                      {t.reportProblem.successTitle}
                    </h2>
                    <p className="text-muted-foreground text-sm">{t.reportProblem.successBody}</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-4"
                  >
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight">
                        {t.reportProblem.modalTitle}
                      </h2>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {t.reportProblem.modalSubtitle}
                      </p>
                    </div>

                    <div>
                      <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(event) =>
                          setMessage(event.target.value.slice(0, MAX_MESSAGE_LENGTH))
                        }
                        placeholder={t.reportProblem.placeholder}
                        rows={4}
                        disabled={isPending}
                        className="border-border bg-background focus-visible:ring-ring w-full resize-none rounded-xl border p-3 text-sm outline-none focus-visible:ring-2"
                      />
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-muted-foreground text-xs">
                          {message.length}/{MAX_MESSAGE_LENGTH}
                        </span>
                        {error && (
                          <span role="alert" className="text-danger text-xs">
                            {error}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={closeAndReset}
                        disabled={isPending}
                      >
                        {t.reportProblem.cancel}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={isPending || !message.trim()}
                      >
                        {isPending && <Loader2 className="size-4 animate-spin" />}
                        {isPending ? t.reportProblem.submitting : t.reportProblem.submit}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
