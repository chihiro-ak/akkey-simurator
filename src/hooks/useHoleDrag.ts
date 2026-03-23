import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { resolveHole, type Contour } from "../simulator";

type Options = {
  contour: Contour | null;
  currentValue: number;
  onChange: (value: number) => void;
};

const DRAG_LERP = 0.18;

export function useHoleDrag({ contour, currentValue, onChange }: Options) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const projectPointerToHole = (clientX: number, clientY: number, rect: DOMRect) => {
    const xPercent = ((clientX - rect.left) / rect.width) * 100;
    if (!contour) {
      const resolved = resolveHole(xPercent, contour);
      return currentValue + (resolved - currentValue) * DRAG_LERP;
    }

    const yPercent = ((clientY - rect.top) / rect.height) * 100;
    const anchor = resolveHole(xPercent, contour);
    let nearest = anchor;
    let bestDistance = Number.POSITIVE_INFINITY;

    contour.topEdgeByPercent.forEach((edgeY, index) => {
      if (edgeY === null) return;
      if (Math.abs(index - anchor) > 12) return;
      const dx = index - xPercent;
      const dy = edgeY - yPercent;
      const distance = dx * dx + dy * dy;
      if (distance < bestDistance) {
        bestDistance = distance;
        nearest = index;
      }
    });

    const resolved = resolveHole(nearest, contour);
    return currentValue + (resolved - currentValue) * DRAG_LERP;
  };

  useEffect(() => {
    if (!dragging) return;

    const onMove = (event: PointerEvent) => {
      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      onChange(projectPointerToHole(event.clientX, event.clientY, rect));
    };
    const onUp = () => setDragging(false);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [contour, currentValue, dragging, onChange]);

  const beginHoleDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    onChange(projectPointerToHole(event.clientX, event.clientY, rect));
    setDragging(true);
  };

  return {
    beginHoleDrag,
    cardRef,
    dragging,
  };
}
