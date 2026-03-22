import { useEffect, useMemo, useState } from "react";

import { DesignSummary } from "./components/DesignSummary";
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
  type ThicknessMm,
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
  const [thicknessMm, setThicknessMm] = useState<ThicknessMm>(3);
  const [holePosition, setHolePosition] = useState(defaultHole);
  const [viewportWidth, setViewportWidth] = useState(typeof window === "undefined" ? 1280 : window.innerWidth);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

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

  const { beginHoleDrag, cardRef, dragging } = useHoleDrag({
    contour,
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
  const anchorTop = viewportWidth >= 1200 ? 120 : viewportWidth >= 768 ? 100 : 92;
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
  const holeOffsetRatio = Math.min(1, Math.abs(holePosition - 50) / 32);
  const hardwareCounterRotation = `${((renderedAngle * 180) / Math.PI) * (0.34 + holeOffsetRatio * 0.44)}deg`;
  const thicknessClass = `thickness-${thicknessMm}`;

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleResetHole = () => setHolePosition(resolveHole(defaultHole, contour));
  const holePositionLabel = `${Math.round(holePosition)}%`;

  return (
    <main className="workspace-shell">
      <header className="page-header">
        <p className="section-label">Single Acrylic Keychain MVP</p>
        <h1>アクキーシミュレーター</h1>
        <p>Stitch モックに寄せながら、穴位置調整と完成見え確認を 1 画面で行える単体アクキー用の構成です。</p>
      </header>

      <div className="workspace-grid">
        <SettingsSidebar
          artwork={artwork}
          error={error}
          onDropFile={handleDropFile}
          onSelectPart={setSelectedPart}
          onThicknessChange={setThicknessMm}
          onUpload={handleUpload}
          parts={partOptions}
          selectedPartId={selectedPart}
          setSizeCm={setSizeCm}
          sizeCm={sizeCm}
          status={status}
          thicknessMm={thicknessMm}
        />

        <section className="canvas-panel">
          <div className="canvas-switch">
            <button className={viewMode === "edit" ? "is-active" : ""} onClick={() => setViewMode("edit")} type="button">
              編集
            </button>
            <button className={viewMode === "preview" ? "is-active" : ""} onClick={() => setViewMode("preview")} type="button">
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
              holePositionLabel={holePositionLabel}
              holeX={holeX}
              holeY={holeY}
              onBeginHoleDrag={beginHoleDrag}
              onResetHole={handleResetHole}
              partImage={activePart.image}
              ringSize={ringSize}
              status={status}
              thicknessClass={thicknessClass}
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
              thicknessClass={thicknessClass}
            />
          )}

          <DesignSummary
            actionMessage={actionMessage}
            holeAdjusted={previewReady}
            holePositionLabel={holePositionLabel}
            onSave={() => setActionMessage("保存は準備中です。現在の設定を保持しやすい構造だけ先に追加しています。")}
            onShare={() => setActionMessage("共有は準備中です。共有リンクや画像書き出しへ後から接続できます。")}
            partLabel={activePart.label}
            sizeLabel={`${sizeCm.toFixed(sizeCm % 1 === 0 ? 0 : 1)}cm`}
            thicknessLabel={`${thicknessMm}mm`}
          />
        </section>
      </div>
    </main>
  );
}
