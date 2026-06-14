import Link from "next/link";

export type Step = "input" | "angles" | "brand" | "templates" | "editor";

const STEPS: { key: Step; label: string; icon: string; href?: (id: string) => string }[] = [
  { key: "input",     label: "Input",    icon: "1", href: (id) => `/project/${id}/input` },
  { key: "angles",    label: "Angles",   icon: "2", href: (id) => `/project/${id}/angles` },
  { key: "brand",     label: "Brand",    icon: "3", href: (id) => `/project/${id}/brand` },
  { key: "templates", label: "Template", icon: "4", href: (id) => `/project/${id}/templates` },
  { key: "editor",    label: "Editor",   icon: "5" },
];

export function Stepper({ current, projectId }: { current: Step; projectId: string }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center justify-between w-full">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 shrink-0 mr-6">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
          <span className="text-xs font-black text-white">A</span>
        </div>
        <span className="text-sm font-bold text-slate-800 tracking-tight hidden sm:block">AdForge</span>
      </Link>

      {/* Steps */}
      <div className="flex items-center gap-0 flex-1">
        {STEPS.map((step, i) => {
          const done   = i < currentIdx;
          const active = i === currentIdx;

          const pill = (
            <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
              active
                ? "bg-blue-600 text-white shadow-sm"
                : done
                  ? "text-slate-500"
                  : "text-slate-400"
            }`}>
              <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                done
                  ? "bg-blue-100 text-blue-600"
                  : active
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-400"
              }`}>
                {done ? "✓" : step.icon}
              </span>
              <span className="hidden sm:block">{step.label}</span>
            </div>
          );

          return (
            <div key={step.key} className="flex items-center">
              {step.href && (done || active) ? (
                <Link href={step.href(projectId)}>{pill}</Link>
              ) : pill}

              {i < STEPS.length - 1 && (
                <div className={`w-6 h-px mx-1 ${i < currentIdx ? "bg-blue-300" : "bg-slate-200"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
