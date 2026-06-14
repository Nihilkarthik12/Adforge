// Top stepper for orientation through the project flow (spec §9).
// Input → Angle → Brand → Template → Edit.

import Link from "next/link";

export type Step = "input" | "angles" | "brand" | "templates" | "editor";

const STEPS: { key: Step; label: string; href?: (id: string) => string }[] = [
  { key: "input", label: "Input", href: (id) => `/project/${id}/input` },
  { key: "angles", label: "Angle", href: (id) => `/project/${id}/angles` },
  { key: "brand", label: "Brand", href: (id) => `/project/${id}/brand` },
  { key: "templates", label: "Template", href: (id) => `/project/${id}/templates` },
  { key: "editor", label: "Edit" },
];

export function Stepper({
  current,
  projectId,
}: {
  current: Step;
  projectId: string;
}) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center gap-3">
      {/* Logo back link */}
      <Link
        href="/"
        className="mr-4 flex items-center gap-2 shrink-0"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
          <span className="text-xs font-black text-white">A</span>
        </div>
        <span className="text-sm font-bold text-slate-700">AdForge</span>
      </Link>

      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;

        const circle = (
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              done
                ? "bg-blue-600 text-white"
                : active
                  ? "border-2 border-blue-600 bg-white text-blue-600"
                  : "border-2 border-slate-300 bg-white text-slate-400"
            }`}
          >
            {done ? "✓" : i + 1}
          </div>
        );

        const labelEl = (
          <span
            className={`hidden text-xs font-medium sm:block ${
              active
                ? "text-blue-600"
                : done
                  ? "text-slate-600"
                  : "text-slate-400"
            }`}
          >
            {step.label}
          </span>
        );

        return (
          <div key={step.key} className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-0.5">
              {step.href && (done || active) ? (
                <Link href={step.href(projectId)} className="flex flex-col items-center gap-0.5">
                  {circle}
                  {labelEl}
                </Link>
              ) : (
                <>
                  {circle}
                  {labelEl}
                </>
              )}
            </div>

            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-8 rounded-full transition-colors ${
                  i < currentIdx ? "bg-blue-600" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
