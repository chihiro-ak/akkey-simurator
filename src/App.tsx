import { useEffect, useMemo, useRef, useState } from "react";

import ballChainImage from "./assets/parts/ball-chain.png";
import nasukanImage from "./assets/parts/nasukan.png";
import strapImage from "./assets/parts/strap.png";

type PartId = "nasukan" | "ball-chain" | "strap";
type PreviewMode = "edit" | "preview";
type UploadStatus = "empty" | "loading" | "ready" | "error";

type PartOption = {
  id: PartId;
  label: string;
  image: string;
  fallbackIcon: string;
};

type UploadedArtwork = {
  fileName: string;
  previewUrl: string;
};

type ArtworkContour = {
  firstOpaquePercent: number;
  lastOpaquePercent: number;
  topEdgeByPercent: Array<number | null>;
};

type ImageOpaqueBounds = {
  bottomOpaquePercent: number;
};

const parts: PartOption[] = [
  { id: "nasukan", label: "ナスカン", image: nasukanImage, fallbackIcon: "◎" },
  { id: "ball-chain", label: "ボールチェーン", image: ballChainImage, fallbackIcon: "◌" },
  { id: "strap", label: "ストラップ", image: strapImage, fallbackIcon: "◍" },
];

const acceptedTypes = ["image/png", "image/jpeg", "image/webp"];
const acceptedExtensions = [".png", ".jpg", ".jpeg", ".webp"];
const initialImageAvailability: Record<PartId, boolean> = {
  nasukan: true,
  "ball-chain": true,
  strap: true,
};
const holePositionMin = 18;
const holePositionMax = 82;
const defaultHolePosition = 50;
const contourAlphaThreshold = 16;

const isSupportedImageFile = (file: File) => {
  const lowerName = file.name.toLowerCase();
  return (
    acceptedTypes.includes(file.type) ||
    acceptedExtensions.some((extension) => lowerName.endsWith(extension))
  );
};

const clampPercent = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const getContainBounds = (width: number, height: number) => {
  const aspectRatio = width / height;

  if (aspectRatio >= 1) {
    const renderHeight = 100 / aspectRatio;
    return {
      leftPercent: 0,
      topPercent: (100 - renderHeight) / 2,
      widthPercent: 100,
      heightPercent: renderHeight,
    };
  }

  const renderWidth = aspectRatio * 100;
  return {
    leftPercent: (100 - renderWidth) / 2,
    topPercent: 0,
    widthPercent: renderWidth,
    heightPercent: 100,
  };
};

const analyzeArtworkContour = (source: string) =>
  new Promise<ArtworkContour>((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvasWidth = Math.max(1, Math.round(image.naturalWidth * scale));
      const canvasHeight = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        reject(new Error("Canvas context is not available"));
        return;
      }

      context.clearRect(0, 0, canvasWidth, canvasHeight);
      context.drawImage(image, 0, 0, canvasWidth, canvasHeight);

      const { data } = context.getImageData(0, 0, canvasWidth, canvasHeight);
      const bounds = getContainBounds(image.naturalWidth, image.naturalHeight);
      const topEdgeByPercent: Array<number | null> = Array.from({ length: 101 }, (_, percent) => {
        if (percent < bounds.leftPercent || percent > bounds.leftPercent + bounds.widthPercent) {
          return null;
        }

        const normalizedX = (percent - bounds.leftPercent) / bounds.widthPercent;
        const x = clampPercent(
          Math.round(normalizedX * (canvasWidth - 1)),
          0,
          Math.max(0, canvasWidth - 1),
        );

        for (let y = 0; y < canvasHeight; y += 1) {
          const alpha = data[(y * canvasWidth + x) * 4 + 3];
          if (alpha > contourAlphaThreshold) {
            const normalizedY = canvasHeight === 1 ? 0 : y / (canvasHeight - 1);
            return bounds.topPercent + normalizedY * bounds.heightPercent;
          }
        }

        return null;
      });

      const validPercents = topEdgeByPercent.flatMap((value, percent) =>
        value === null ? [] : percent,
      );

      if (validPercents.length === 0) {
        const firstOpaquePercent = Math.round(bounds.leftPercent);
        const lastOpaquePercent = Math.round(bounds.leftPercent + bounds.widthPercent);
        resolve({
          firstOpaquePercent,
          lastOpaquePercent,
          topEdgeByPercent: Array.from({ length: 101 }, (_, percent) =>
            percent >= firstOpaquePercent && percent <= lastOpaquePercent ? bounds.topPercent : null,
          ),
        });
        return;
      }

      resolve({
        firstOpaquePercent: validPercents[0],
        lastOpaquePercent: validPercents[validPercents.length - 1],
        topEdgeByPercent,
      });
    };

    image.onerror = () => {
      reject(new Error("Failed to analyze uploaded artwork"));
    };

    image.src = source;
  });

const analyzeImageOpaqueBounds = (source: string) =>
  new Promise<ImageOpaqueBounds>((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvasWidth = Math.max(1, Math.round(image.naturalWidth * scale));
      const canvasHeight = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        reject(new Error("Canvas context is not available"));
        return;
      }

      context.clearRect(0, 0, canvasWidth, canvasHeight);
      context.drawImage(image, 0, 0, canvasWidth, canvasHeight);

      const { data } = context.getImageData(0, 0, canvasWidth, canvasHeight);
      let bottomOpaqueRow = canvasHeight - 1;

      for (let y = canvasHeight - 1; y >= 0; y -= 1) {
        let foundOpaque = false;

        for (let x = 0; x < canvasWidth; x += 1) {
          const alpha = data[(y * canvasWidth + x) * 4 + 3];
          if (alpha > contourAlphaThreshold) {
            bottomOpaqueRow = y;
            foundOpaque = true;
            break;
          }
        }

        if (foundOpaque) {
          break;
        }
      }

      resolve({
        bottomOpaquePercent: canvasHeight === 1 ? 100 : (bottomOpaqueRow / (canvasHeight - 1)) * 100,
      });
    };

    image.onerror = () => {
      reject(new Error("Failed to analyze part image"));
    };

    image.src = source;
  });

const resolveHolePosition = (targetPercent: number, contour: ArtworkContour | null) => {
  if (!contour) {
    return clampPercent(targetPercent, holePositionMin, holePositionMax);
  }

  const safeTarget = clampPercent(targetPercent, contour.firstOpaquePercent, contour.lastOpaquePercent);
  const nearestOpaquePercent = contour.topEdgeByPercent.reduce<number | null>((nearest, _, percent) => {
    if (percent < contour.firstOpaquePercent || percent > contour.lastOpaquePercent) {
      return nearest;
    }

    if (contour.topEdgeByPercent[percent] === null) {
      return nearest;
    }

    if (nearest === null) {
      return percent;
    }

    return Math.abs(percent - safeTarget) < Math.abs(nearest - safeTarget) ? percent : nearest;
  }, null);

  return nearestOpaquePercent ?? clampPercent(safeTarget, holePositionMin, holePositionMax);
};

const getHoleTopPercent = (holePosition: number, contour: ArtworkContour | null) => {
  if (!contour) {
    return 0;
  }

  const sampleIndex = clampPercent(Math.round(holePosition), 0, 100);
  const sampledTop = contour.topEdgeByPercent[sampleIndex];

  if (sampledTop !== null) {
    return sampledTop;
  }

  for (let offset = 1; offset <= 100; offset += 1) {
    const leftIndex = sampleIndex - offset;
    if (leftIndex >= 0 && contour.topEdgeByPercent[leftIndex] !== null) {
      return contour.topEdgeByPercent[leftIndex] ?? 0;
    }

    const rightIndex = sampleIndex + offset;
    if (rightIndex <= 100 && contour.topEdgeByPercent[rightIndex] !== null) {
      return contour.topEdgeByPercent[rightIndex] ?? 0;
    }
  }

  return 0;
};

function App() {
  const [selectedPart, setSelectedPart] = useState<PartId>("nasukan");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("edit");
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("empty");
  const [uploadedArtwork, setUploadedArtwork] = useState<UploadedArtwork | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageAvailability, setImageAvailability] = useState(initialImageAvailability);
  const [holePosition, setHolePosition] = useState(defaultHolePosition);
  const [artworkContour, setArtworkContour] = useState<ArtworkContour | null>(null);
  const [partBottomOpaquePercent, setPartBottomOpaquePercent] = useState(100);
  const [isDraggingHole, setIsDraggingHole] = useState(false);

  const cardRef = useRef<HTMLDivElement | null>(null);

  const activePart = useMemo(
    () => parts.find((part) => part.id === selectedPart) ?? parts[0],
    [selectedPart],
  );
  const hasUploadedArtwork = uploadedArtwork !== null;
  const isPreviewReady = hasUploadedArtwork && uploadStatus !== "loading";
  const isPartImageAvailable = imageAvailability[activePart.id];
  const uploadCtaTitle = hasUploadedArtwork
    ? "別の画像に差し替える"
    : "タップして画像を選択";
  const uploadCtaDescription = hasUploadedArtwork
    ? "新しい画像を選ぶと、今のプレビューを差し替えます。"
    : "";
  const holeTopPercent = getHoleTopPercent(holePosition, artworkContour);

  useEffect(() => {
    if (isPreviewReady) return;
    setPreviewMode("edit");
  }, [isPreviewReady]);

  useEffect(() => {
    if (!uploadedArtwork) {
      setArtworkContour(null);
      setHolePosition(defaultHolePosition);
      return;
    }

    let ignore = false;
    analyzeArtworkContour(uploadedArtwork.previewUrl)
      .then((contour) => {
        if (ignore) return;
        setArtworkContour(contour);
        setHolePosition((current) => resolveHolePosition(current, contour));
      })
      .catch(() => {
        if (ignore) return;
        setArtworkContour(null);
      });

    return () => {
      ignore = true;
    };
  }, [uploadedArtwork]);

  useEffect(() => {
    if (!isPartImageAvailable) {
      setPartBottomOpaquePercent(100);
      return;
    }

    let ignore = false;
    analyzeImageOpaqueBounds(activePart.image)
      .then((bounds) => {
        if (ignore) return;
        setPartBottomOpaquePercent(bounds.bottomOpaquePercent);
      })
      .catch(() => {
        if (ignore) return;
        setPartBottomOpaquePercent(100);
      });

    return () => {
      ignore = true;
    };
  }, [activePart.image, isPartImageAvailable]);

  useEffect(() => {
    if (!isDraggingHole) return;

    const handlePointerMove = (event: PointerEvent) => {
      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const ratio = ((event.clientX - rect.left) / rect.width) * 100;
      setHolePosition(resolveHolePosition(ratio, artworkContour));
    };

    const handlePointerUp = () => {
      setIsDraggingHole(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [artworkContour, isDraggingHole]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!isSupportedImageFile(file)) {
      setUploadStatus("error");
      setUploadError(
        hasUploadedArtwork
          ? "PNG / JPG / WEBP の画像を選択してください。現在のプレビューはそのまま保持しています。"
          : "PNG / JPG / WEBP の画像を選択してください。",
      );
      return;
    }

    setUploadStatus("loading");
    setUploadError(null);

    const reader = new FileReader();
    reader.onerror = () => {
      setUploadStatus("error");
      setUploadError(
        hasUploadedArtwork
          ? "画像の読み込みに失敗しました。現在のプレビューはそのまま保持しています。"
          : "画像の読み込みに失敗しました。別のファイルでもう一度お試しください。",
      );
    };
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setUploadedArtwork({
          fileName: file.name,
          previewUrl: result,
        });
        setUploadStatus("ready");
        return;
      }

      setUploadStatus("error");
      setUploadError(
        hasUploadedArtwork
          ? "プレビューの生成に失敗しました。現在のプレビューはそのまま保持しています。"
          : "プレビューの生成に失敗しました。",
      );
    };
    reader.readAsDataURL(file);
  };

  const handlePartImageError = (partId: PartId) => {
    setImageAvailability((current) =>
      current[partId] ? { ...current, [partId]: false } : current,
    );
  };

  const handleHolePointerDown = (event: React.PointerEvent<HTMLButtonElement | HTMLDivElement>) => {
    event.preventDefault();

    const card = cardRef.current;
    if (card) {
      const rect = card.getBoundingClientRect();
      const ratio = ((event.clientX - rect.left) / rect.width) * 100;
      setHolePosition(resolveHolePosition(ratio, artworkContour));
    }

    setIsDraggingHole(true);
  };

  const handleHoleReset = () => {
    setHolePosition(resolveHolePosition(defaultHolePosition, artworkContour));
  };

  return (
    <main className="app-shell">
      <section className="phone-frame">
        <header className="hero">
          <p className="hero-kicker">Acrylic Keychain Maker</p>
          <h1>アクキーシミュレーター</h1>
        </header>

        <div className="content-layout">
          <div className="control-column">
            <section className="panel">
              <div className="section-heading">
                <span aria-hidden="true">🖼️</span>
                <h2>画像アップロード</h2>
              </div>

              <label className="upload-dropzone">
                <input
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={handleFileChange}
                  type="file"
                />
                <div className="upload-badge" aria-hidden="true">
                  🏞️
                </div>
                <strong>{uploadCtaTitle}</strong>
                <span>{uploadCtaDescription}</span>
              </label>

              <div className={`upload-status-card is-${uploadStatus}`} aria-live="polite">
                {uploadStatus === "empty" ? (
                  <>
                    <strong>画像を選択してください</strong>
                  </>
                ) : null}
                {uploadStatus === "loading" ? (
                  <>
                    <strong>プレビューを作成中です</strong>
                  </>
                ) : null}
                {uploadStatus === "ready" && uploadedArtwork ? (
                  <>
                    <strong>画像を読み込みました</strong>
                    <span>{uploadedArtwork.fileName}</span>
                  </>
                ) : null}
                {uploadStatus === "error" ? (
                  <>
                    <strong>画像を読み込めませんでした</strong>
                    <span>{uploadError}</span>
                  </>
                ) : null}
              </div>
            </section>

            <section className="panel">
              <div className="section-heading">
                <span aria-hidden="true">🧩</span>
                <h2>パーツ選択</h2>
              </div>

              <div className="parts-grid">
                {parts.map((part) => {
                  const isActive = part.id === selectedPart;

                  return (
                    <button
                      key={part.id}
                      className={`part-card ${isActive ? "is-active" : ""}`}
                      onClick={() => setSelectedPart(part.id)}
                      type="button"
                    >
                      <span aria-hidden="true" className="part-icon">
                        {imageAvailability[part.id] ? (
                          <span className="part-image-crop">
                            <img
                              alt=""
                              className="part-image"
                              onError={() => handlePartImageError(part.id)}
                              src={part.image}
                            />
                          </span>
                        ) : (
                          part.fallbackIcon
                        )}
                      </span>
                      <span className="part-label">{part.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <section className="panel panel-preview">
            <div className="section-heading">
              <span aria-hidden="true">📷</span>
              <h2>プレビュー</h2>
            </div>

            <div className="mode-switch" role="tablist" aria-label="表示モード">
              <button
                aria-selected={previewMode === "edit"}
                className={previewMode === "edit" ? "is-selected" : ""}
                onClick={() => setPreviewMode("edit")}
                role="tab"
                type="button"
              >
                編集モード
              </button>
              <button
                aria-selected={previewMode === "preview"}
                className={previewMode === "preview" ? "is-selected" : ""}
                disabled={!isPreviewReady}
                onClick={() => setPreviewMode("preview")}
                role="tab"
                type="button"
              >
                プレビューモード
              </button>
            </div>

            <div className={`preview-stage ${previewMode === "preview" ? "is-clean" : ""}`}>
              <div className={`preview-object ${previewMode === "preview" && isPreviewReady ? "is-animated" : ""}`}>
                <div
                  className="acrylic-card"
                  ref={cardRef}
                >
                  <div
                    className="preview-hardware"
                    aria-hidden="true"
                    style={{
                      left: `${holePosition}%`,
                      top: `${holeTopPercent}%`,
                      transform: `translate(-50%, -${partBottomOpaquePercent}%)`,
                    }}
                  >
                    {isPartImageAvailable ? (
                      <span className="preview-image-crop">
                        <img
                          alt=""
                          className="preview-image"
                          onError={() => handlePartImageError(activePart.id)}
                          src={activePart.image}
                        />
                      </span>
                    ) : (
                      <span className="preview-fallback">{activePart.fallbackIcon}</span>
                    )}
                  </div>

                  <span
                    className="hole-cutout"
                    style={{
                      left: `${holePosition}%`,
                      top: `${holeTopPercent}%`,
                    }}
                  />

                  {previewMode === "edit" ? (
                    <div className="hole-editor" onPointerDown={handleHolePointerDown}>
                      <button
                        aria-label="穴位置を調整"
                        className="hole-handle"
                        onDoubleClick={handleHoleReset}
                        onPointerDown={handleHolePointerDown}
                        style={{
                          left: `${holePosition}%`,
                          top: `${holeTopPercent}%`,
                        }}
                        type="button"
                      />
                    </div>
                  ) : null}

                  {uploadedArtwork ? (
                    <img
                      alt="アクキーの完成イメージ"
                      className="artwork"
                      src={uploadedArtwork.previewUrl}
                    />
                  ) : (
                    <div className={`artwork-placeholder is-${uploadStatus}`}>
                      <div className="artwork-placeholder-badge" aria-hidden="true">
                        {uploadStatus === "error" ? "!" : "＋"}
                      </div>
                      <strong>
                        {uploadStatus === "error"
                          ? "画像を表示できません"
                          : "画像をアップロードしてください"}
                      </strong>
                      <span>
                        {uploadStatus === "loading"
                          ? "読み込み中です..."
                          : uploadStatus === "error"
                            ? uploadError
                            : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

export default App;
