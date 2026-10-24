import { FlaskConical } from "lucide-react";

export function LabSectionPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl glass-card glass-card-hover p-10 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
        <FlaskConical className="h-6 w-6" />
      </div>
      <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
        {title}
      </h1>
      <p className="mt-2 mx-auto max-w-xl text-sm text-slate-500">{description}</p>
    </div>
  );
}
