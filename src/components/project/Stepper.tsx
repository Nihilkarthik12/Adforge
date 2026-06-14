import Link from "next/link";

export type Step = "input" | "angles" | "brand" | "templates" | "editor";

const STEPS: {
  key: Step;
  label: string;
  href?: (id: string) => string;
}[] = [
  { key: "input",     label: "Input",    href: (id) => `/project/${id}/input` },
  { key: "angles",    label: "Angles",   href: (id) => `/project/${id}/angles` },
  { key: "brand",     label: "Brand",    href: (id) => `/project/${id}/brand` },
  { key: "templates", label: "Template", href: (id) => `/project/${id}/templates` },
  { key: "editor",    label: "Editor" },
];

export function Stepper({ current, projectId }: { current: Step; projectId: string }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center justify-between w-full">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 shrink-0 mr-8">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
          </svg>
        </div>
        <span className="hidden text-sm font-semibold text-zinc-800 tracking-tight sm:block">AdForge</span>
      </Link>

      {/* Steps */}
      <div className="flex items-center gap-0 flex-1">
        {STEPS.map((step, i) => {
          const done   = i < currentIdx;
          const active = i === currentIdx;

          const node = (
            <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-all select-none ${
              active
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                : done
                  ? "text-zinc-500 hover:text-zinc-700"
                  : "text-zinc-300"
            }`}>
              <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                done
                  ? "bg-indigo-100 text-indigo-600"
                  : active
                    ? "bg-white/20 text-white"
                    : "bg-zinc-100 text-zinc-400"
              }`}>
                {done ? (
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3 5.5L6.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span className="hidden sm:block">{step.label}</span>
            </div>
          );

          return (
            <div key={step.key} className="flex items-center">
              {step.href && (done || active) ? (
                <Link href={step.href(projectId)}>{node}</Link>
              ) : node}

              {i < STEPS.length - 1 && (
                <div className={`h-px w-5 mx-0.5 ${i < currentIdx ? "bg-indigo-300" : "bg-zinc-200"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
