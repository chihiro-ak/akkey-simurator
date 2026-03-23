import type { ChangeEvent, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { EditorCanvas } from "../../components/EditorCanvas";
import { PreviewCanvas } from "../../components/PreviewCanvas";
import { SettingsSidebar } from "../../components/SettingsSidebar";
import {
  defaultSizeCm,
  hardwareSizeCm,
  partOptions,
  previewAngleLimit,
  previewDragVelocityLimit,
  type ViewMode,
} from "../../keychainConfig";
import { createShareSlug } from "../../lib/projectDraft";
import { useArtworkUpload } from "../../hooks/useArtworkUpload";
import { useConnectedPreviewMotion } from "../../hooks/useConnectedPreviewMotion";
import { usePartContour } from "../../hooks/usePartContour";
import {
  defaultHole,
  getArtworkSizePx,
  getHoleLayout,
  getLinkedAttachment,
  getPreviewPhysicsModel,
  type HoleEdge,
  type HoleKind,
  type SlotId,
  type UploadStatus,
  normalizedToPercent,
  percentToNormalized,
  resolveHole,
  resolveHoleNormalized,
} from "../../simulator";
import type { ProjectDraft } from "../../types/project";

type DragSurface = "editor" | "preview";

type DragState =
  | {
      slot: SlotId;
      startClientX: number;
      startValue: number;
      surface: DragSurface;
      type: "artwork";
      width: number;
    }
  | {
      hole: HoleKind;
      slot: SlotId;
      startClientX?: number;
      startValue?: number;
      surface: DragSurface;
      type: "hole";
      width?: number;
    }
  | null;

type Props = {
  initialDraft: ProjectDraft;
};

const ARTWORK_DRAG_SCALE = 0.7;

const getHoleEdge = (slot: SlotId, hole: HoleKind): HoleEdge =>
  slot === "main" && hole === "link" ? "bottom" : "top";

const formatSavedAt = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    month: "numeric",
    day: "numeric",
  }).format(new Date(value));

export function EditorWorkspace({ initialDraft }: Props) {
  const [draft, setDraft] = useState<ProjectDraft>(initialDraft);
  const [activeSlot, setActiveSlot] = useState<SlotId>("main");
  const [viewMode, setViewMode] = useState<ViewMode>("edit");
  const [viewportWidth, setViewportWidth] = useState(typeof window === "undefined" ? 1280 : window.innerWidth);
  const [dragState, setDragState] = useState<DragState>(null);
  const [isPublishPanelOpen, setIsPublishPanelOpen] = useState(false);
  const [hasSavedOnce, setHasSavedOnce] = useState(Boolean(initialDraft.id));
  const [savedAt, setSavedAt] = useState(initialDraft.updatedAt);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const mainUpload = useArtworkUpload(initialDraft.slots.main.artwork);
  const subUpload = useArtworkUpload(initialDraft.slots.sub.artwork);
  const uploads = { main: mainUpload, sub: subUpload } as const;
  const mainCardRef = useRef<HTMLDivElement | null>(null);
  const subCardRef = useRef<HTMLDivElement | null>(null);
  const mainPreviewCardRef = useRef<HTMLDivElement | null>(null);
  const subPreviewCardRef = useRef<HTMLDivElement | null>(null);

  const activePart = useMemo(
    () => partOptions.find((part) => part.id === draft.selectedPart) ?? partOptions[0],
    [draft.selectedPart],
  );
  const partContour = usePartContour(activePart.image, true);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (draft.mode === "single" && activeSlot === "sub") {
      setActiveSlot("main");
    }
  }, [activeSlot, draft.mode]);

  useEffect(() => {
    if (!mainUpload.contour) return;
    setDraft((current) => ({
      ...current,
      slots: {
        ...current.slots,
        main: {
          ...current.slots.main,
          holes: {
            link: resolveHoleNormalized(current.slots.main.holes.link ?? defaultHole, mainUpload.contour, "bottom"),
            primary: resolveHoleNormalized(current.slots.main.holes.primary, mainUpload.contour, "top"),
          },
        },
      },
    }));
  }, [mainUpload.contour]);

  useEffect(() => {
    if (!subUpload.contour) return;
    setDraft((current) => ({
      ...current,
      slots: {
        ...current.slots,
        sub: {
          ...current.slots.sub,
          holes: {
            primary: resolveHoleNormalized(current.slots.sub.holes.primary, subUpload.contour, "top"),
          },
        },
      },
    }));
  }, [subUpload.contour]);

  const previewReady = !!mainUpload.artwork && mainUpload.status === "ready";
  const connectedVisible = draft.mode === "connected";
  const connectedMotionEnabled =
    connectedVisible && !!subUpload.artwork && subUpload.status === "ready" && previewReady;
  const cardBase =
    viewportWidth >= 1400
      ? Math.min(Math.max(viewportWidth * 0.17, 250), 332)
      : viewportWidth >= 900
        ? Math.min(Math.max(viewportWidth * 0.22, 220), 300)
        : Math.min(Math.max(viewportWidth - 126, 170), 240);
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
  const anchorTop = viewportWidth >= 1200 ? 108 : viewportWidth >= 768 ? 88 : 80;
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

  const getCardRef = (slot: SlotId, surface: DragSurface) => {
    if (surface === "preview") {
      return slot === "main" ? mainPreviewCardRef : subPreviewCardRef;
    }
    return slot === "main" ? mainCardRef : subCardRef;
  };

  const updateSlot = (slot: SlotId, updater: (slotDraft: ProjectDraft["slots"][SlotId]) => ProjectDraft["slots"][SlotId]) => {
    setDraft((current) => ({
      ...current,
      slots: {
        ...current.slots,
        [slot]: updater(current.slots[slot]),
      },
    }));
  };

  const projectPointerToHole = (slot: SlotId, hole: HoleKind, surface: DragSurface, clientX: number, clientY: number) => {
    const card = getCardRef(slot, surface).current;
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
        updateSlot(dragState.slot, (slotDraft) => ({
          ...slotDraft,
          holes: {
            ...slotDraft.holes,
            primary: dragState.startValue + (resolved - dragState.startValue) * 0.75,
          },
        }));
        return;
      }

      if (
        dragState.hole === "link" &&
        dragState.slot === "main" &&
        dragState.startClientX !== undefined &&
        dragState.startValue !== undefined &&
        dragState.width !== undefined
      ) {
        const startValue = dragState.startValue;
        const delta = (event.clientX - dragState.startClientX) / Math.max(dragState.width, 1);
        const target = startValue + delta * ARTWORK_DRAG_SCALE;
        const resolved = resolveHoleNormalized(target, uploads.main.contour, "bottom");
        updateSlot("main", (slotDraft) => ({
          ...slotDraft,
          holes: {
            ...slotDraft.holes,
            link: startValue + (resolved - startValue) * 0.75,
          },
        }));
        return;
      }

      const nextValue = projectPointerToHole(dragState.slot, dragState.hole, dragState.surface, event.clientX, event.clientY);
      if (nextValue === undefined) return;
      updateSlot(dragState.slot, (slotDraft) => ({
        ...slotDraft,
        holes: {
          ...slotDraft.holes,
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

  const beginHoleDrag = (slot: SlotId, hole: HoleKind, surface: DragSurface, event: ReactPointerEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveSlot(slot);
    endPreviewDrag();
    const card = getCardRef(slot, surface).current;
    const rect = card?.getBoundingClientRect();
    const nextValue = projectPointerToHole(slot, hole, surface, event.clientX, event.clientY);
    if (nextValue !== undefined) {
      updateSlot(slot, (slotDraft) => ({
        ...slotDraft,
        holes: {
          ...slotDraft.holes,
          [hole]: nextValue,
        },
      }));
    }
    setDragState({
      hole,
      slot,
      surface,
      startClientX: hole === "link" ? event.clientX : undefined,
      startValue: hole === "link" ? draft.slots.main.holes.link : undefined,
      type: "hole",
      width: hole === "link" ? rect?.width : undefined,
    });
  };

  const beginArtworkDrag = (slot: SlotId, surface: DragSurface, event: ReactPointerEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const card = getCardRef(slot, surface).current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    setActiveSlot(slot);
    endPreviewDrag();
    setDragState({
      slot,
      startClientX: event.clientX,
      startValue: draft.slots[slot].holes.primary,
      surface,
      type: "artwork",
      width: rect.width,
    });
  };

  const markSaved = () => {
    const timestamp = new Date().toISOString();
    setSavedAt(timestamp);
    setHasSavedOnce(true);
    setDraft((current) => ({
      ...current,
      id: current.id ?? `local-${Date.now()}`,
      updatedAt: timestamp,
    }));
  };

  const handleSave = () => {
    markSaved();
    setIsPublishPanelOpen(true);
  };

  const handleUpload = async (slot: SlotId, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    const nextArtwork = await uploads[slot].processFile(file);
    if (nextArtwork) {
      updateSlot(slot, (slotDraft) => ({
        ...slotDraft,
        artwork: nextArtwork,
      }));
      setActiveSlot(slot);
      setViewMode("edit");
    }
  };

  const handleDropFile = (slot: SlotId, file?: File) => {
    void uploads[slot].processFile(file).then((nextArtwork) => {
      if (nextArtwork) {
        updateSlot(slot, (slotDraft) => ({
          ...slotDraft,
          artwork: nextArtwork,
        }));
        setActiveSlot(slot);
        setViewMode("edit");
      }
    });
  };

  const sizeLabels = {
    main: `${(draft.slots.main.sizeCm * 10).toFixed(0)}mm`,
    sub: `${(draft.slots.sub.sizeCm * 10).toFixed(0)}mm`,
  };

  const cards = [
    {
      artwork: mainUpload.artwork,
      error: mainUpload.error,
      isActive: activeSlot === "main",
      placeholder: "画像をアップロード",
      sizeCm: draft.slots.main.sizeCm,
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
            sizeCm: draft.slots.sub.sizeCm,
            sizeLabel: sizeLabels.sub,
            slotId: "sub" as const,
            status: subUpload.status as UploadStatus,
          },
        ]
      : []),
  ];

  const shareHref = `/share/${draft.shareSlug}`;

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner topbar-editor">
          <div className="topbar-copy">
            <h1>アクキーシミュレーター</h1>
            <p className="page-subtitle">保存しながら編集を続けられます。</p>
          </div>
          <div className="topbar-actions editor-actions">
            <Link className="ghost-link" to="/projects">
              一覧
            </Link>
            <button className="ghost-button" onClick={() => setIsPublishPanelOpen((current) => !current)} type="button">
              公開設定
            </button>
            <Link className={`ghost-button ${draft.isPublic ? "" : "is-disabled"}`} to={shareHref}>
              公開ページ
            </Link>
            <button className="primary-button" onClick={handleSave} type="button">
              {hasSavedOnce ? "保存" : "初回保存"}
            </button>
          </div>
        </div>
      </header>

      <main className="workspace-shell editor-shell">
        <section className="project-toolbar-card project-toolbar-card-compact">
          <div className="project-toolbar-main">
            <label className="project-title-field">
              <span className="field-label">プロジェクト名</span>
              <input
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    shareSlug: current.shareSlug === createShareSlug(current.title) ? createShareSlug(event.target.value) : current.shareSlug,
                    title: event.target.value,
                  }))
                }
                ref={titleInputRef}
                type="text"
                value={draft.title}
              />
            </label>
            <div className="project-meta-row">
              <span className={`status-pill ${draft.isPublic ? "is-public" : ""}`}>{draft.isPublic ? "公開中" : "下書き"}</span>
              <button
                className="text-link-button"
                onClick={() => {
                  titleInputRef.current?.focus();
                  titleInputRef.current?.select();
                }}
                type="button"
              >
                名前を変更
              </button>
            </div>
          </div>
          <div className="project-toolbar-side">
            <div className="project-meta-card">
              <span className="field-label">保存状態</span>
              <strong>{hasSavedOnce ? "保存済み" : "未保存"}</strong>
              <span>最終保存: {formatSavedAt(savedAt)}</span>
            </div>
          </div>
        </section>

        <div className="workspace-grid">
          <SettingsSidebar
            activeSlot={activeSlot}
            cards={cards}
            mode={draft.mode}
            onActivateSlot={setActiveSlot}
            onDropFile={handleDropFile}
            onModeChange={(nextMode) => {
              setDraft((current) => ({ ...current, mode: nextMode }));
              if (nextMode === "single") setActiveSlot("main");
            }}
            onSelectPart={(selectedPart) => setDraft((current) => ({ ...current, selectedPart }))}
            onSetSizeCm={(slot, value) => updateSlot(slot, (slotDraft) => ({ ...slotDraft, sizeCm: value }))}
            onUpload={handleUpload}
            parts={partOptions}
            selectedPartId={draft.selectedPart}
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
                linkAnchorX={linkAnchorX}
                linkAnchorY={linkAnchorY}
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
                linkAnchorX={linkAnchorX}
                linkAnchorY={linkAnchorY}
                linkLength={linkLength}
                lowerBaseAngle={lowerBaseAngle}
                lowerCard={{
                  artwork: subUpload.artwork,
                  left: lowerCardLeft,
                  primaryHole: subPrimaryHole,
                  cardRef: subPreviewCardRef,
                  size: subSize,
                  top: lowerCardTop,
                }}
                lowerCenterRadius={lowerCenterRadius}
                mainCard={{
                  artwork: mainUpload.artwork,
                  left: mainCardLeft,
                  primaryHole: mainPrimaryHole,
                  cardRef: mainPreviewCardRef,
                  size: mainSize,
                  top: mainCardTop,
                }}
                onBeginLinkDrag={(event) => beginHoleDrag("main", "link", "preview", event)}
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

        <aside className={`side-panel ${isPublishPanelOpen ? "is-open" : ""}`}>
          <div className="side-panel-card">
            <div className="side-panel-header">
              <div>
                <h2>公開設定</h2>
              </div>
              <button className="ghost-button" onClick={() => setIsPublishPanelOpen(false)} type="button">
                閉じる
              </button>
            </div>

            <label className="panel-field">
              <span className="field-label">公開URL</span>
              <input
                onChange={(event) => setDraft((current) => ({ ...current, shareSlug: createShareSlug(event.target.value) }))}
                type="text"
                value={draft.shareSlug}
              />
            </label>

            <div className="panel-toggle-row">
              <div>
                <strong>{draft.isPublic ? "公開ページを表示中" : "非公開のまま保存"}</strong>
                <span>保存と公開状態だけを先に確認できる仮UIです。</span>
              </div>
              <button
                className={`toggle-chip ${draft.isPublic ? "is-active" : ""}`}
                onClick={() => setDraft((current) => ({ ...current, isPublic: !current.isPublic }))}
                type="button"
              >
                {draft.isPublic ? "公開中" : "非公開"}
              </button>
            </div>

            <div className="panel-summary">
              <div>
                <span className="field-label">保存モード</span>
                <strong>{hasSavedOnce ? "上書き保存" : "初回保存"}</strong>
              </div>
              <div>
                <span className="field-label">共有先</span>
                <strong>{shareHref}</strong>
              </div>
            </div>

            <div className="panel-actions">
              <button
                className="secondary-button"
                onClick={() => {
                  markSaved();
                  setDraft((current) => ({ ...current, isPublic: false }));
                }}
                type="button"
              >
                下書き保存
              </button>
              <button
                className="primary-button"
                onClick={() => {
                  markSaved();
                  setDraft((current) => ({ ...current, isPublic: true }));
                }}
                type="button"
              >
                保存して公開
              </button>
            </div>
          </div>
        </aside>
      </main>
    </>
  );
}
