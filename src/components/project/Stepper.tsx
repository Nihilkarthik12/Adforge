import Link from "next/link";

export type Step = "input" | "angles" | "brand" | "templates" | "editor";

const STEPS: {
  key: Step;
  label: string;
  icon: string;
  href?: (id: string) => string;
}[] = [
  {
    key: "input", label: "Input",
    icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm-2 0v6h6M16 13H8M16 17H8M10 9H8",
    href: (id) => `/project/${id}/input`,
  },
  {
    key: "angles", label: "Angles",
    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    href: (id) => `/project/${id}/angles`,
  },
  {
    key: "brand", label: "Brand",
    icon: "M7 21a4 4 0 0 1-4-4V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v12a4 4 0 0 1-4 4zm0 0h12a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 0 1 2.828 0l2.829 2.829a2 2 0 0 1 0 2.828l-8.486 8.485M7 17h.01",
    href: (id) => `/project/${id}/brand`,
  },
  {
    key: "templates", label: "Template",
    icon: "M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5zm0 8a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6zm12 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-6z",
    href: (id) => `/project/${id}/templates`,
  },
  {
    key: "editor", label: "Editor",
    icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 1 1 3.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
  },
];

export function Stepper({ current, projectId }: { current: Step; projectId: string }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);
  const progressPct = (currentIdx / (STEPS.length - 1)) * 100;

  return (
    <div className="border-b border-zinc-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-3">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2 mr-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
            </svg>
          </div>
          <span className="hidden text-sm font-semibold text-zinc-800 tracking-tight sm:block">AdForge</span>
        </Link>

        {/* Steps */}
        <div className="flex flex-1 items-center">
          {STEPS.map((step, i) => {
            const done   = i < currentIdx;
            const active = i === currentIdx;

            const node = (
              <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 transition-all select-none ${
                active  ? "bg-indigo-600 shadow-sm shadow-indigo-500/30" :
                done    ? "hover:bg-zinc-100" : ""
              }`}>
                {/* Icon circle */}
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  active ? "bg-white/20" :
                  done   ? "bg-indigo-100" :
                           "bg-zinc-100"
                }`}>
                  {done ? (
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke={done ? "#4f46e5" : "currentColor"} strokeWidth="1.8" strokeLinecap="round">
                      <path d="M1.5 4.5L3.5 6.5L7.5 2.5" />
                    </svg>
                  ) : (
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
                      stroke={active ? "white" : "#a1a1aa"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={step.icon} />
                    </svg>
                  )}
                </span>
                <span className={`hidden text-xs font-semibold sm:block ${
                  active ? "text-white" :
                  done   ? "text-zinc-500" :
                           "text-zinc-300"
                }`}>
                  {step.label}
                </span>
              </div>
            );

            return (
              <div key={step.key} className="flex items-center">
                {step.href && (done || active)
                  ? <Link href={step.href(projectId)}>{node}</Link>
                  : node}
                {i < STEPS.length - 1 && (
                  <div className={`mx-1 h-px w-4 transition-colors duration-300 ${i < currentIdx ? "bg-indigo-300" : "bg-zinc-200"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Gradient progress bar */}
      <div className="h-[2px] bg-zinc-100">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${progressPct}%`,
            background: "linear-gradient(to right, #4f46e5, #7c3aed)",
          }}
        />
      </div>
    </div>
  );
}
