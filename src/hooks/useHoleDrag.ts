import { useEffect, useRef, useState } from "react";

import { resolveHole, type Contour } from "../simulator";

type Options = {
  contour: Contour | null;
  onChange: (value: number) => void;
};

export function useHoleDrag({ contour, onChange }: Options) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef({ startClientX: 0, startPosition: 50, width: 1 });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!dragging) return;

    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      const delta = ((event.clientX - drag.startClientX) / Math.max(drag.width, 1)) * 100 * 0.42;
      onChange(resolveHole(drag.startPosition - delta, contour));
    };
    const onUp = () => setDragging(false);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [contour, dragging, onChange]);

  const beginHoleDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const ratio = ((event.clientX - rect.left) / rect.width) * 100;
    dragRef.current = {
      startClientX: event.clientX,
      startPosition: resolveHole(ratio, contour),
      width: rect.width,
    };
    onChange(resolveHole(ratio, contour));
    setDragging(true);
  };

  return {
    beginHoleDrag,
    cardRef,
    dragging,
  };
}
