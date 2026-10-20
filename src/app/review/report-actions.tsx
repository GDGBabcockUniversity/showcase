"use client";

import { useFormStatus } from "react-dom";
import { LuLoaderCircle } from "react-icons/lu";
import { dismissCollaborationRequestReport } from "@/app/community-actions";

export function ReviewSubmitButton({
  children,
  pendingLabel,
  danger = false,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  danger?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={`review-control ${danger ? "review-tone-red" : ""}`}
      disabled={pending}
    >
      {pending && (
        <LuLoaderCircle
          size={15}
          aria-hidden
          className="animate-spin motion-reduce:animate-none"
        />
      )}
      {pending ? pendingLabel : children}
    </button>
  );
}

export function DismissReportButton({ requestId }: { requestId: string }) {
  return (
    <form action={dismissCollaborationRequestReport.bind(null, requestId)}>
      <ReviewSubmitButton pendingLabel="Dismissing…">
        Dismiss report
      </ReviewSubmitButton>
    </form>
  );
}
