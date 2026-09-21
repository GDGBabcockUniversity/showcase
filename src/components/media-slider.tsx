"use client";

import { useRef } from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

import { Button } from "@/components/ui/button";

import { isVideoUrl } from "@/lib/limits";

// Native scroll-snap does the sliding; the arrows just nudge the scroll
// container by one viewport.
// ponytail: no disabled state at the ends — scrollBy clamps on its own, and
// tracking it would mean a scroll listener for a cosmetic detail.
export function MediaSlider({ images, title }: { images: string[]; title: string }) {
  const track = useRef<HTMLUListElement>(null);

  function nudge(direction: 1 | -1) {
    track.current?.scrollBy({ left: direction * track.current.clientWidth, behavior: "smooth" });
  }

  // Only the positioning and the translucent backdrop; the rest comes from the
  // Button component's outline variant.
  const arrowClass = "absolute top-1/2 z-10 h-9 w-9 -translate-y-1/2 bg-bg/85 backdrop-blur-sm";

  return (
    <div className="relative mt-2">
      <ul
        ref={track}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((src, i) => (
          <li key={src} className="w-full shrink-0 snap-start">
            {isVideoUrl(src) ? (
              <video
                src={src}
                controls
                playsInline
                preload="metadata"
                className="aspect-[16/9] w-full rounded-2xl border border-border bg-black object-contain"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={i === 0 ? `${title} cover` : `${title} image ${i + 1}`}
                className="aspect-[16/9] w-full rounded-2xl border border-border object-cover"
              />
            )}
          </li>
        ))}
      </ul>

      {images.length > 1 && (
        <>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Previous image"
            onClick={() => nudge(-1)}
            className={`${arrowClass} left-2`}
          >
            <LuChevronLeft size={18} aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Next image"
            onClick={() => nudge(1)}
            className={`${arrowClass} right-2`}
          >
            <LuChevronRight size={18} aria-hidden />
          </Button>
        </>
      )}
    </div>
  );
}
