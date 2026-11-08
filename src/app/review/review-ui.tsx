import type { ReactNode } from "react";
import { STATUS_LABEL, type ProjectStatus } from "@/lib/project-status";

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className="review-status" data-status={status}>
      <span aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function ReviewSection({
  id,
  title,
  description,
  accessory,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  accessory?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="review-panel scroll-mt-28">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-5 sm:px-6">
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {description && (
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {description}
            </p>
          )}
        </div>
        {accessory}
      </div>
      {children}
    </section>
  );
}

export function PageHeader({
  title,
  description,
  accessory,
}: {
  title: string;
  description: string;
  accessory?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          {description}
        </p>
      </div>
      {accessory}
    </header>
  );
}
