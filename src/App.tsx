import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { EditorCanvas } from "./components/EditorCanvas";
import { PreviewCanvas } from "./components/PreviewCanvas";
import { SettingsSidebar } from "./components/SettingsSidebar";
import {
  defaultSizeCm,
  hardwareSizeCm,
  partOptions,
  previewAngleLimit,
  previewDragVelocityLimit,
  type PartId,
  type ViewMode,
} from "./keychainConfig";
import { useArtworkUpload } from "./hooks/useArtworkUpload";
import { useHoleDrag } from "./hooks/useHoleDrag";
import { usePartContour } from "./hooks/usePartContour";
import { usePreviewMotion } from "./hooks/usePreviewMotion";
import { defaultHole, getInsetHolePercent, getPreviewPhysicsModel, getVisibleArtworkSpanPercent, resolveHole } from "./simulator";

export default function App() {
  const [selectedPart, setSelectedPart] = useState<PartId>("nasukan");
  const [viewMode, setViewMode] = useState<ViewMode>("edit");
  const [sizeCm, setSizeCm] = useState(defaultSizeCm);
  const [holePosition, setHolePosition] = useState(defaultHole);
  const [viewportWidth, setViewportWidth] = useState(typeof window === "undefined" ? 1280 : window.innerWidth);

  const { artwork, contour, error, processFile, status } = useArtworkUpload();
  const activePart = useMemo(() => partOptions.find((part) => part.id === selectedPart) ?? partOptions[0], [selectedPart]);
  const partContour = usePartContour(activePart.image, true);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!contour) return;
    setHolePosition((current) => resolveHole(current, contour));
  }, [contour]);

  const { beginArtworkDrag, cardRef, dragging } = useHoleDrag({
    contour,
    currentValue: holePosition,
    onChange: setHolePosition,
  });

  const previewReady = !!artwork && status === "ready";
  const cardBase =
    viewportWidth >= 1400
      ? Math.min(Math.max(viewportWidth * 0.17, 250), 332)
      : viewportWidth >= 900
        ? Math.min(Math.max(viewportWidth * 0.22, 220), 300)
        : Math.min(Math.max(viewportWidth - 126, 170), 240);
  const pixelsPerCm = cardBase / defaultSizeCm;
  const artworkSize = (pixelsPerCm * sizeCm * 100) / getVisibleArtworkSpanPercent(contour);
  const holeTopPercent = getInsetHolePercent(holePosition, contour, artworkSize);
  const holeX = (artworkSize * holePosition) / 100;
  const holeY = (artworkSize * holeTopPercent) / 100;
  const hardwareSize = Math.min(Math.max(pixelsPerCm * hardwareSizeCm, 84), 192);
  const hardwareWidth = hardwareSize;
  const hardwareHeight = hardwareSize;
  const hardwareBottomPx = hardwareHeight * ((partContour?.bottomOpaquePercent ?? 86) / 100);
  const ringSize = Math.min(Math.max(hardwareSize * 0.36, 34), 48);
  const anchorTop = viewportWidth >= 1200 ? 124 : viewportWidth >= 768 ? 102 : 92;

  const physicsModel = useMemo(
    () =>
      getPreviewPhysicsModel(
        activePart.id,
        holePosition,
        holeTopPercent,
        contour,
        partContour,
        artworkSize,
        hardwareWidth,
        hardwareHeight,
        hardwareBottomPx,
      ),
    [activePart.id, artworkSize, contour, hardwareBottomPx, hardwareHeight, hardwareWidth, holePosition, holeTopPercent, partContour],
  );

  const artworkLeft = physicsModel.cardCenterLocalX * artworkSize - artworkSize / 2;
  const artworkTop = -physicsModel.cardCenterLocalY * artworkSize - artworkSize / 2;

  const { angle, beginPreviewDrag, endPreviewDrag, movePreviewDrag, previewRef } = usePreviewMotion({
    anchorTop,
    artworkSize,
    disabled: dragging || viewMode !== "preview",
    enabled: previewReady,
    physicsModel,
    previewAngleLimit,
    previewDragVelocityLimit,
  });

  const renderedAngle = viewMode === "edit" || dragging ? 0 : angle;
  const hardwareCounterRotation = "0deg";
  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    const nextArtwork = await processFile(file);
    if (nextArtwork) setViewMode("edit");
  };

  const handleDropFile = (file?: File) => {
    void processFile(file).then((nextArtwork) => {
      if (nextArtwork) setViewMode("edit");
    });
  };

  const sizeLabel = `${(sizeCm * 10).toFixed(0)}mm`;
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <h1>アクキーシミュレーター</h1>
        </div>
      </header>

      <main className="workspace-shell">
        <div className="workspace-grid">
          <SettingsSidebar
            artwork={artwork}
            error={error}
            onDropFile={handleDropFile}
            onSelectPart={setSelectedPart}
            onUpload={handleUpload}
            parts={partOptions}
            selectedPartId={selectedPart}
            setSizeCm={setSizeCm}
            sizeCm={sizeCm}
            sizeLabel={sizeLabel}
            status={status}
          />

          <section className="canvas-column">
            <div className="canvas-switch" role="tablist" aria-label="表示切り替え">
              <button
                aria-selected={viewMode === "edit"}
                className={viewMode === "edit" ? "is-active" : ""}
                onClick={() => setViewMode("edit")}
                type="button"
              >
                編集
              </button>
              <button
                aria-selected={viewMode === "preview"}
                className={viewMode === "preview" ? "is-active" : ""}
                onClick={() => setViewMode("preview")}
                type="button"
              >
                プレビュー
              </button>
            </div>

            {viewMode === "edit" ? (
              <EditorCanvas
                artwork={artwork}
                artworkSize={artworkSize}
                cardRef={cardRef}
              error={error}
              hardwareBottomPx={hardwareBottomPx}
              hardwareHeight={hardwareHeight}
              hardwareWidth={hardwareWidth}
              holeX={holeX}
              holeY={holeY}
              onBeginArtworkDrag={beginArtworkDrag}
              anchorTop={anchorTop}
              artworkLeft={artworkLeft}
              partImage={activePart.image}
              ringSize={ringSize}
              status={status}
              artworkTop={artworkTop}
            />
            ) : (
              <PreviewCanvas
                angle={angle}
                anchorTop={anchorTop}
                artwork={artwork}
                artworkLeft={artworkLeft}
                artworkSize={artworkSize}
                artworkTop={artworkTop}
                hardwareBottomPx={hardwareBottomPx}
                hardwareCounterRotation={hardwareCounterRotation}
                hardwareHeight={hardwareHeight}
                hardwareWidth={hardwareWidth}
                holeX={holeX}
                holeY={holeY}
                onEndPreviewDrag={endPreviewDrag}
                onMovePreviewDrag={movePreviewDrag}
                onPreviewDrag={beginPreviewDrag}
                previewReady={previewReady}
                previewRef={previewRef}
                renderedPart={activePart}
                ringSize={ringSize}
              />
            )}
          </section>
        </div>
      </main>
    </>
  );
}
