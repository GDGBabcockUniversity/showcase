"use client";

import { useActionState, useState } from "react";
import { FaFacebookF, FaLinkedinIn, FaWhatsapp, FaXTwitter } from "react-icons/fa6";
import { LuLink } from "react-icons/lu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  requestCollaboration,
  type CollaborationRequestState,
} from "@/app/community-actions";
import { Button } from "./ui/button";
import Link from "next/link";
import { Textarea } from "./ui/textarea";

export function ShareLink({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const absolute = () => new URL(url, window.location.origin).href;

  async function copy() {
    const href = absolute();
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
    } catch {
      window.prompt("Copy this link", href);
    }
  }

  // Resolved at click time, so it only runs in the browser.
  function networks() {
    const u = encodeURIComponent(absolute());
    const t = encodeURIComponent(document.title);
    return [
      { name: "X", Icon: FaXTwitter, href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
      { name: "LinkedIn", Icon: FaLinkedinIn, href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
      { name: "Facebook", Icon: FaFacebookF, href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
      { name: "WhatsApp", Icon: FaWhatsapp, href: `https://wa.me/?text=${t}%20${u}` },
    ];
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          aria-label={copied ? "Project link copied" : `Share ${title}`}
          onClick={async (e) => {
            // iOS, Android and some desktop browsers have a native share sheet;
            // everything else gets the popover below.
            if (!navigator.share) return;
            e.preventDefault();
            try {
              await navigator.share({ title: document.title, url: absolute() });
            } catch {
              // dismissed by the user, nothing to do
            }
          }}
          className="rounded-full border border-border px-4 py-2 text-xs hover:border-blue"
        >
          {copied ? "Link copied" : `Share ${title}`}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-1.5">
        {networks().map(({ name, Icon, href }) => (
          <Link
            key={name}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-surface"
          >
            <Icon size={14} aria-hidden />
            {name}
          </Link>
        ))}
        <Button
          type="button"
          onClick={() => {
            copy();
            setOpen(false);
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface"
        >
          <LuLink size={14} aria-hidden />
          Copy link
        </Button>
      </PopoverContent>
    </Popover>
  );
}

export function CollaborationForm({ projectId }: { projectId: string }) {
  const initialState: CollaborationRequestState = { status: "idle" };
  const action = requestCollaboration.bind(null, projectId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="mt-5 border-t border-green/20 pt-4">
      <p className="text-sm font-medium">Have a skill to contribute?</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Send a short introduction. Keep contact details and next steps in your
        message.
      </p>
      {state.status === "success" ? (
        <p
          role="status"
          className="mt-4 border border-green/30 px-3 py-3 text-sm text-green"
        >
          {state.message}
        </p>
      ) : (
        <form action={formAction} className="mt-4 grid gap-3">
          <label
            htmlFor="collab-message"
            className="font-mono text-[10px] uppercase tracking-wider text-muted"
          >
            Your message
          </label>
          <Textarea
            id="collab-message"
            name="message"
            required
            minLength={10}
            maxLength={1000}
            placeholder="I can help with…"
            aria-describedby="collab-hint collab-feedback"
            aria-invalid={state.status === "error"}
            className="min-h-28 resize-y rounded-lg border border-border bg-bg px-3 py-2.5 text-sm leading-relaxed placeholder:text-muted/70 focus-visible:border-blue focus-visible:ring-1 focus-visible:ring-blue"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p id="collab-hint" className="text-[11px] text-muted">
              10–1,000 characters
            </p>
            <Button
              type="submit"
              disabled={pending}
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-green px-4 text-xs font-semibold text-bg transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
            >
              {pending ? "Sending…" : "Send collaboration request"}
            </Button>
          </div>
          <p
            id="collab-feedback"
            aria-live="polite"
            role={state.status === "error" ? "alert" : "status"}
            className={`min-h-5 text-xs ${state.status === "error" ? "text-red" : "text-muted"}`}
          >
            {state.message ?? ""}
          </p>
        </form>
      )}
    </div>
  );
}
