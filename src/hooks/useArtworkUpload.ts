import { useEffect, useState } from "react";

import { analyzeContour, isSupportedFile, readFile, type Artwork, type Contour, type UploadStatus } from "../simulator";

export function useArtworkUpload(initialArtwork: Artwork | null = null) {
  const [artwork, setArtwork] = useState<Artwork | null>(initialArtwork);
  const [status, setStatus] = useState<UploadStatus>(initialArtwork ? "ready" : "empty");
  const [error, setError] = useState<string | null>(null);
  const [contour, setContour] = useState<Contour | null>(null);

  useEffect(() => {
    if (!artwork) {
      setContour(null);
      return;
    }

    let cancelled = false;
    analyzeContour(artwork.previewUrl)
      .then((nextContour) => {
        if (!cancelled) {
          setContour(nextContour);
        }
      })
      .catch(() => {
        if (!cancelled) setContour(null);
      });

    return () => {
      cancelled = true;
    };
  }, [artwork]);

  const processFile = async (file?: File) => {
    if (!file) return null;
    if (!isSupportedFile(file)) {
      setStatus("error");
      setError("PNG / JPG / WEBP の画像を選んでください。");
      return null;
    }

    setStatus("loading");
    setError(null);

    try {
      const nextArtwork = await readFile(file);
      setArtwork(nextArtwork);
      setStatus("ready");
      return nextArtwork;
    } catch (nextError) {
      setStatus("error");
      setError(nextError instanceof Error ? nextError.message : "画像の読み込みに失敗しました");
      return null;
    }
  };

  return {
    artwork,
    contour,
    error,
    processFile,
    status,
  };
}
