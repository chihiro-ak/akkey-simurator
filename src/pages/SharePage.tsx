import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";

import { AppHeader } from "../components/AppHeader";
import { PreviewCanvas } from "../components/PreviewCanvas";
import { getMockProjectBySlug } from "../features/projects/mockProjects";
import { useArtworkUpload } from "../hooks/useArtworkUpload";
import { useConnectedPreviewMotion } from "../hooks/useConnectedPreviewMotion";
import { usePartContour } from "../hooks/usePartContour";
import { defaultSizeCm, hardwareSizeCm, partOptions, previewAngleLimit, previewDragVelocityLimit } from "../keychainConfig";
import { createEmptyProjectDraft } from "../lib/projectDraft";
import {
  defaultHole,
  getArtworkSizePx,
  getHoleLayout,
  getLinkedAttachment,
  getPreviewPhysicsModel,
  normalizedToPercent,
} from "../simulator";

export function SharePage() {
  const { shareSlug } = useParams();
  const draft =
    getMockProjectBySlug(shareSlug) ??
    createEmptyProjectDraft({
      isPublic: true,
      shareSlug: shareSlug ?? "shared-preview",
      title: "共有プレビュー",
    });

  const activePart = useMemo(
    () => partOptions.find((part) => part.id === draft.selectedPart) ?? partOptions[0],
    [draft.selectedPart],
  );
  const partContour = usePartContour(activePart.image, true);
  const mainUpload = useArtworkUpload(draft.slots.main.artwork);
  const subUpload = useArtworkUpload(draft.slots.sub.artwork);
  const previewReady = !!mainUpload.artwork && mainUpload.status === "ready";
  const connectedVisible = draft.mode === "connected";
  const connectedMotionEnabled =
    connectedVisible && !!subUpload.artwork && subUpload.status === "ready" && previewReady;
  const cardBase = 300;
  const pixelsPerCm = cardBase / defaultSizeCm;
  const mainSize = getArtworkSizePx(pixelsPerCm, draft.slots.main.sizeCm, mainUpload.contour);
  const subSize = getArtworkSizePx(pixelsPerCm, draft.slots.sub.sizeCm, subUpload.contour);
  const mainPrimaryHole = getHoleLayout(draft.slots.main.holes.primary, mainUpload.contour, "top", mainSize);
  const mainLinkHole = getHoleLayout(draft.slots.main.holes.link ?? defaultHole, mainUpload.contour, "bottom", mainSize);
  const subPrimaryHole = getHoleLayout(draft.slots.sub.holes.primary, subUpload.contour, "top", subSize);
  const hardwareSize = Math.min(Math.max(pixelsPerCm * hardwareSizeCm, 84), 192);
  const hardwareWidth = hardwareSize;
  const hardwareHeight = hardwareSize;
  const hardwareBottomPx = hardwareHeight * ((partContour?.bottomOpaquePercent ?? 86) / 100);
  const ringSize = Math.min(Math.max(hardwareSize * 0.36, 34), 48);
  const anchorTop = 92;
  const linkLength = 12;
  const linkedAttachment = useMemo(
    () =>
      getLinkedAttachment({
        doubleReady: connectedMotionEnabled,
        linkLength,
        lowerContour: subUpload.contour,
        lowerHole: subPrimaryHole,
        lowerSize: subSize,
        topLinkHole: mainLinkHole,
        topPrimaryHole: mainPrimaryHole,
        topSize: mainSize,
      }),
    [connectedMotionEnabled, linkLength, mainLinkHole, mainPrimaryHole, mainSize, subPrimaryHole, subSize, subUpload.contour],
  );

  const physicsModel = useMemo(
    () =>
      getPreviewPhysicsModel(
        activePart.id,
        normalizedToPercent(draft.slots.main.holes.primary),
        mainPrimaryHole.yPercent,
        mainUpload.contour,
        partContour,
        mainSize,
        hardwareWidth,
        hardwareHeight,
        hardwareBottomPx,
        linkedAttachment,
      ),
    [
      activePart.id,
      draft.slots.main.holes.primary,
      hardwareBottomPx,
      hardwareHeight,
      hardwareWidth,
      linkedAttachment,
      mainPrimaryHole.yPercent,
      mainSize,
      mainUpload.contour,
      partContour,
    ],
  );

  const mainCardLeft = physicsModel.cardCenterLocalX * mainSize - mainSize / 2;
  const mainCardTop = -physicsModel.cardCenterLocalY * mainSize - mainSize / 2;
  const lowerCardLeft = -subPrimaryHole.xPx;
  const lowerCardTop = -subPrimaryHole.yPx;
  const lowerCenterRadius = 0;
  const lowerBaseAngle = 0;
  const lowerEquilibrium = ((subPrimaryHole.xPercent - 50) / 100) * 0.14;
  const linkAnchorX = mainCardLeft + mainLinkHole.xPx;
  const linkAnchorY = mainCardTop + mainLinkHole.yPx;

  const { angle, beginPreviewDrag, endPreviewDrag, movePreviewDrag, previewRef, subSwingAngle, subTiltAngle } =
    useConnectedPreviewMotion({
      anchorTop,
      artworkSize: mainSize,
      connectedEnabled: connectedMotionEnabled,
      disabled: false,
      enabled: previewReady,
      lowerEquilibrium,
      physicsModel,
      previewAngleLimit,
      previewDragVelocityLimit,
    });

  const holeOffsetRatio = Math.min(1, Math.abs(mainPrimaryHole.xPercent - 50) / Math.max(82 - 50, 1));
  const hardwareUprightFactor = 0.34 + holeOffsetRatio * 0.44;
  const hardwareCounterRotation = `${((angle * 180) / Math.PI) * hardwareUprightFactor}deg`;

  return (
    <>
      <AppHeader
        actions={
          <Link className="ghost-link" to="/projects">
            一覧へ戻る
          </Link>
        }
      />

      <main className="page-shell share-shell">
        <section className="share-meta">
          <h1>{draft.title}</h1>
          <p>{draft.mode === "connected" ? "つながるアクキー" : "単体アクキー"}</p>
        </section>
        <section className="share-stage">
          <div className="canvas-column share-canvas-column">
            <PreviewCanvas
              angle={angle}
              allowLinkAdjust={false}
              anchorTop={anchorTop}
              connected={connectedVisible}
              hardwareBottomPx={hardwareBottomPx}
              hardwareCounterRotation={hardwareCounterRotation}
              hardwareHeight={hardwareHeight}
              hardwareWidth={hardwareWidth}
              linkAnchorX={linkAnchorX}
              linkAnchorY={linkAnchorY}
              linkLength={linkLength}
              lowerBaseAngle={lowerBaseAngle}
              lowerCard={{
                artwork: subUpload.artwork,
                cardRef: { current: null },
                left: lowerCardLeft,
                primaryHole: subPrimaryHole,
                size: subSize,
                top: lowerCardTop,
              }}
              lowerCenterRadius={lowerCenterRadius}
              mainCard={{
                artwork: mainUpload.artwork,
                cardRef: { current: null },
                left: mainCardLeft,
                primaryHole: mainPrimaryHole,
                size: mainSize,
                top: mainCardTop,
              }}
              onBeginLinkDrag={() => undefined}
              onEndPreviewDrag={endPreviewDrag}
              onMovePreviewDrag={movePreviewDrag}
              onPreviewDrag={beginPreviewDrag}
              previewReady={previewReady}
              previewRef={previewRef}
              renderedPart={activePart}
              ringSize={ringSize}
              subSwingAngle={subSwingAngle}
              subTiltAngle={subTiltAngle}
            />
          </div>
          <p className="share-caption">ドラッグして揺れ方を見られます。</p>
        </section>
      </main>
    </>
  );
}
