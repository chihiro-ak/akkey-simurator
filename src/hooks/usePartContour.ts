import { useEffect, useState } from "react";

import { analyzeContour, type Contour } from "../simulator";

export function usePartContour(imageSrc: string, enabled: boolean) {
  const [contour, setContour] = useState<Contour | null>(null);

  useEffect(() => {
    if (!enabled) {
      setContour(null);
      return;
    }

    let cancelled = false;
    analyzeContour(imageSrc)
      .then((nextContour) => {
        if (!cancelled) setContour(nextContour);
      })
      .catch(() => {
        if (!cancelled) setContour(null);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, imageSrc]);

  return contour;
}
