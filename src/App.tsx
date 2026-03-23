import type { ChangeEvent, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

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
import { useConnectedPreviewMotion } from "./hooks/useConnectedPreviewMotion";
import { usePartContour } from "./hooks/usePartContour";
import {
  defaultHole,
  getArtworkSizePx,
  getHoleLayout,
  getLinkedAttachment,
  getPreviewPhysicsModel,
  type HoleEdge,
  type HoleKind,
  type Mode,
  type SlotId,
  type UploadStatus,
  normalizedToPercent,
  percentToNormalized,
  resolveHole,
  resolveHoleNormalized,
} from "./simulator";

type DragState =
  | {
      startClientX: number;
      startValue: number;
      type: "artwork";
      width: number;
      slot: SlotId;
    }
  | {
      hole: HoleKind;
      slot: SlotId;
      type: "hole";
    }
  | null;

const ARTWORK_DRAG_SCALE = 0.7;

const getHoleEdge = (slot: SlotId, hole: HoleKind): HoleEdge =>
  slot === "main" && hole === "link" ? "bottom" : "top";

export default function App() {
  const [mode, setMode] = useState<Mode>("single");
  const [activeSlot, setActiveSlot] = useState<SlotId>("main");
  const [selectedPart, setSelectedPart] = useState<PartId>("nasukan");
  const [viewMode, setViewMode] = useState<ViewMode>("edit");
  const [viewportWidth, setViewportWidth] = useState(typeof window === "undefined" ? 1280 : window.innerWidth);
  const [slotSizes, setSlotSizes] = useState<Record<SlotId, number>>({ main: defaultSizeCm, sub: defaultSizeCm });
  const [slotHoles, setSlotHoles] = useState({
    main: { link: defaultHole, primary: defaultHole },
    sub: { primary: defaultHole },
  });
  const [dragState, setDragState] = useState<DragState>(null);

  const mainUpload = useArtworkUpload();
  const subUpload = useArtworkUpload();
  const uploads = { main: mainUpload, sub: subUpload } as const;
  const mainCardRef = useRef<HTMLDivElement | null>(null);
  const subCardRef = useRef<HTMLDivElement | null>(null);

  const activePart = useMemo(() => partOptions.find((part) => part.id === selectedPart) ?? partOptions[0], [selectedPart]);
  const partContour = usePartContour(activePart.image, true);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (mode === "single" && activeSlot === "sub") {
      setActiveSlot("main");
    }
  }, [activeSlot, mode]);

  useEffect(() => {
    if (!mainUpload.contour) return;
    setSlotHoles((current) => ({
      ...current,
      main: {
        link: resolveHoleNormalized(current.main.link, mainUpload.contour, "bottom"),
        primary: resolveHoleNormalized(current.main.primary, mainUpload.contour, "top"),
      },
    }));
  }, [mainUpload.contour]);

  useEffect(() => {
    if (!subUpload.contour) return;
    setSlotHoles((current) => ({
      ...current,
      sub: {
        primary: resolveHoleNormalized(current.sub.primary, subUpload.contour, "top"),
      },
    }));
  }, [subUpload.contour]);

  const previewReady = !!mainUpload.artwork && mainUpload.status === "ready";
  const connectedVisible = mode === "connected";
  const connectedMotionEnabled =
    connectedVisible && !!subUpload.artwork && subUpload.status === "ready" && previewReady;
  const cardBase =
    viewportWidth >= 1400
      ? Math.min(Math.max(viewportWidth * 0.17, 250), 332)
      : viewportWidth >= 900
        ? Math.min(Math.max(viewportWidth * 0.22, 220), 300)
        : Math.min(Math.max(viewportWidth - 126, 170), 240);
  const pixelsPerCm = cardBase / defaultSizeCm;
  const mainSize = getArtworkSizePx(pixelsPerCm, slotSizes.main, mainUpload.contour);
  const subSize = getArtworkSizePx(pixelsPerCm, slotSizes.sub, subUpload.contour);
  const mainPrimaryHole = getHoleLayout(slotHoles.main.primary, mainUpload.contour, "top", mainSize);
  const mainLinkHole = getHoleLayout(slotHoles.main.link, mainUpload.contour, "bottom", mainSize);
  const subPrimaryHole = getHoleLayout(slotHoles.sub.primary, subUpload.contour, "top", subSize);
  const hardwareSize = Math.min(Math.max(pixelsPerCm * hardwareSizeCm, 84), 192);
  const hardwareWidth = hardwareSize;
  const hardwareHeight = hardwareSize;
  const hardwareBottomPx = hardwareHeight * ((partContour?.bottomOpaquePercent ?? 86) / 100);
  const ringSize = Math.min(Math.max(hardwareSize * 0.36, 34), 48);
  const anchorTop = viewportWidth >= 1200 ? 124 : viewportWidth >= 768 ? 102 : 92;
  const linkLength = viewportWidth >= 1200 ? 14 : viewportWidth >= 768 ? 12 : 9;
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
        normalizedToPercent(slotHoles.main.primary),
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
      hardwareBottomPx,
      hardwareHeight,
      hardwareWidth,
      linkedAttachment,
      mainPrimaryHole.yPercent,
      mainSize,
      mainUpload.contour,
      partContour,
      slotHoles.main.primary,
    ],
  );

  const mainCardLeft = physicsModel.cardCenterLocalX * mainSize - mainSize / 2;
  const mainCardTop = -physicsModel.cardCenterLocalY * mainSize - mainSize / 2;
  const lowerComX = (subSize * (subUpload.contour?.centerOfMassXPercent ?? 50)) / 100;
  const lowerComY = (subSize * (subUpload.contour?.centerOfMassYPercent ?? 58)) / 100;
  const lowerCardLeft = -lowerComX;
  const lowerCardTop = -lowerComY;
  const lowerHoleOffsetLocalX = subPrimaryHole.xPx - lowerComX;
  const lowerHoleOffsetLocalY = lowerComY - subPrimaryHole.yPx;
  const lowerCenterRadius = Math.max(1, Math.hypot(lowerHoleOffsetLocalX, lowerHoleOffsetLocalY));
  const lowerBaseAngle = Math.PI / 2 - Math.atan2(lowerHoleOffsetLocalY, lowerHoleOffsetLocalX);
  const lowerEquilibrium = ((subPrimaryHole.xPercent - 50) / 100) * 0.14;

  const { angle, beginPreviewDrag, endPreviewDrag, movePreviewDrag, previewRef, subSwingAngle, subTiltAngle } =
    useConnectedPreviewMotion({
      anchorTop,
      artworkSize: mainSize,
      connectedEnabled: connectedMotionEnabled,
      disabled: dragState !== null || viewMode !== "preview",
      enabled: previewReady,
      lowerEquilibrium,
      physicsModel,
      previewAngleLimit,
      previewDragVelocityLimit,
    });

  const renderedAngle = viewMode === "edit" || dragState !== null ? 0 : angle;
  const holeOffsetRatio = Math.min(1, Math.abs(mainPrimaryHole.xPercent - 50) / Math.max(82 - 50, 1));
  const hardwareUprightFactor = 0.34 + holeOffsetRatio * 0.44;
  const hardwareCounterRotation = `${((renderedAngle * 180) / Math.PI) * hardwareUprightFactor}deg`;

  const getCardRef = (slot: SlotId) => (slot === "main" ? mainCardRef : subCardRef);

  const projectPointerToHole = (slot: SlotId, hole: HoleKind, clientX: number, clientY: number) => {
    const card = getCardRef(slot).current;
    const contour = uploads[slot].contour;
    const edge = getHoleEdge(slot, hole);
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const xPercent = ((clientX - rect.left) / rect.width) * 100;
    if (!contour) {
      const resolved = resolveHole(xPercent, contour, edge);
      return percentToNormalized(resolved);
    }

    const yPercent = ((clientY - rect.top) / rect.height) * 100;
    const edgePoints = edge === "bottom" ? contour.bottomEdgeByPercent : contour.topEdgeByPercent;
    const anchor = resolveHole(xPercent, contour, edge);
    let nearest = anchor;
    let bestDistance = Number.POSITIVE_INFINITY;

    edgePoints.forEach((edgeY, index) => {
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

    return percentToNormalized(resolveHole(nearest, contour, edge));
  };

  useEffect(() => {
    if (!dragState) return;

    const onMove = (event: PointerEvent) => {
      if (dragState.type === "artwork") {
        const contour = uploads[dragState.slot].contour;
        const delta = (event.clientX - dragState.startClientX) / Math.max(dragState.width, 1);
        const target = dragState.startValue - delta * ARTWORK_DRAG_SCALE;
        const resolved = resolveHoleNormalized(target, contour, "top");
        setSlotHoles((current) => ({
          ...current,
          [dragState.slot]: {
            ...current[dragState.slot],
            primary: dragState.startValue + (resolved - dragState.startValue) * 0.75,
          },
        }));
        return;
      }

      const nextValue = projectPointerToHole(dragState.slot, dragState.hole, event.clientX, event.clientY);
      if (nextValue === undefined) return;
      setSlotHoles((current) => ({
        ...current,
        [dragState.slot]: {
          ...current[dragState.slot],
          [dragState.hole]: nextValue,
        },
      }));
    };

    const onUp = () => setDragState(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragState, mainUpload.contour, subUpload.contour]);

  const beginHoleDrag = (slot: SlotId, hole: HoleKind, event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveSlot(slot);
    endPreviewDrag();
    const nextValue = projectPointerToHole(slot, hole, event.clientX, event.clientY);
    if (nextValue !== undefined) {
      setSlotHoles((current) => ({
        ...current,
        [slot]: {
          ...current[slot],
          [hole]: nextValue,
        },
      }));
    }
    setDragState({ hole, slot, type: "hole" });
  };

  const beginArtworkDrag = (slot: SlotId, event: ReactPointerEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const card = getCardRef(slot).current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    setActiveSlot(slot);
    setDragState({
      slot,
      startClientX: event.clientX,
      startValue: slotHoles[slot].primary,
      type: "artwork",
      width: rect.width,
    });
  };

  const handleUpload = async (slot: SlotId, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    const nextArtwork = await uploads[slot].processFile(file);
    if (nextArtwork) {
      setActiveSlot(slot);
      setViewMode("edit");
    }
  };

  const handleDropFile = (slot: SlotId, file?: File) => {
    void uploads[slot].processFile(file).then((nextArtwork) => {
      if (nextArtwork) {
        setActiveSlot(slot);
        setViewMode("edit");
      }
    });
  };

  const sizeLabels = {
    main: `${(slotSizes.main * 10).toFixed(0)}mm`,
    sub: `${(slotSizes.sub * 10).toFixed(0)}mm`,
  };
  const cards = [
    {
      artwork: mainUpload.artwork,
      error: mainUpload.error,
      isActive: activeSlot === "main",
      placeholder: "画像をアップロード",
      sizeCm: slotSizes.main,
      sizeLabel: sizeLabels.main,
      slotId: "main" as const,
      status: mainUpload.status as UploadStatus,
    },
    ...(connectedVisible
      ? [
          {
            artwork: subUpload.artwork,
            error: subUpload.error,
            isActive: activeSlot === "sub",
            placeholder: "画像をアップロード",
            sizeCm: slotSizes.sub,
            sizeLabel: sizeLabels.sub,
            slotId: "sub" as const,
            status: subUpload.status as UploadStatus,
          },
        ]
      : []),
  ];

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
            activeSlot={activeSlot}
            cards={cards}
            mode={mode}
            onActivateSlot={setActiveSlot}
            onDropFile={handleDropFile}
            onModeChange={(nextMode) => {
              setMode(nextMode);
              if (nextMode === "single") setActiveSlot("main");
            }}
            onSelectPart={setSelectedPart}
            onSetSizeCm={(slot, value) => setSlotSizes((current) => ({ ...current, [slot]: value }))}
            onUpload={handleUpload}
            parts={partOptions}
            selectedPartId={selectedPart}
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
                activeSlot={activeSlot}
                anchorTop={anchorTop}
                connected={connectedVisible}
                hardwareBottomPx={hardwareBottomPx}
                hardwareHeight={hardwareHeight}
                hardwareWidth={hardwareWidth}
                linkAnchorX={mainLinkHole.xPx}
                linkAnchorY={mainLinkHole.yPx}
                linkHole={mainLinkHole}
                linkLength={linkLength}
                lowerBaseAngle={lowerBaseAngle}
                lowerCard={{
                  artwork: subUpload.artwork,
                  cardRef: subCardRef,
                  error: subUpload.error,
                  isActive: activeSlot === "sub",
                  left: lowerCardLeft,
                  primaryHole: subPrimaryHole,
                  size: subSize,
                  status: subUpload.status,
                  top: lowerCardTop,
                }}
                lowerCenterRadius={lowerCenterRadius}
                mainCard={{
                  artwork: mainUpload.artwork,
                  cardRef: mainCardRef,
                  error: mainUpload.error,
                  isActive: activeSlot === "main",
                  left: mainCardLeft,
                  primaryHole: mainPrimaryHole,
                  size: mainSize,
                  status: mainUpload.status,
                  top: mainCardTop,
                }}
                onActivateSlot={setActiveSlot}
                onBeginArtworkDrag={beginArtworkDrag}
                onBeginHoleDrag={beginHoleDrag}
                partImage={activePart.image}
                ringSize={ringSize}
              />
            ) : (
              <PreviewCanvas
                angle={renderedAngle}
                anchorTop={anchorTop}
                connected={connectedVisible}
                hardwareBottomPx={hardwareBottomPx}
                hardwareCounterRotation={hardwareCounterRotation}
                hardwareHeight={hardwareHeight}
                hardwareWidth={hardwareWidth}
                linkAnchorX={mainLinkHole.xPx}
                linkAnchorY={mainLinkHole.yPx}
                linkHole={mainLinkHole}
                linkLength={linkLength}
                lowerBaseAngle={lowerBaseAngle}
                lowerCard={{
                  artwork: subUpload.artwork,
                  left: lowerCardLeft,
                  primaryHole: subPrimaryHole,
                  size: subSize,
                  top: lowerCardTop,
                }}
                lowerCenterRadius={lowerCenterRadius}
                mainCard={{
                  artwork: mainUpload.artwork,
                  left: mainCardLeft,
                  primaryHole: mainPrimaryHole,
                  size: mainSize,
                  top: mainCardTop,
                }}
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
            )}
          </section>
        </div>
      </main>
    </>
  );
}
