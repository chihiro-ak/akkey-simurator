import { useEffect, useMemo, useRef, useState } from "react";

import ballChainImage from "./assets/parts/ball-chain.png";
import nasukanImage from "./assets/parts/nasukan.png";
import strapImage from "./assets/parts/strap.png";
import {
  analyzeContour,
  Artwork,
  clamp,
  Contour,
  defaultHole,
  getInsetHolePercent,
  isSupportedFile,
  readFile,
  resolveHole,
  UploadStatus,
} from "./simulator";

type PartId = "nasukan" | "ball-chain" | "strap";
type ViewMode = "edit" | "preview";
type ThicknessMm = 3 | 5 | 8;

type PartOption = {
  id: PartId;
  label: string;
  image: string;
  fallbackIcon: string;
};

type MotionProfile = {
  alignDamping: number;
  alignStiffness: number;
  angularDamping: number;
  dragDamping: number;
  dragFollowStiffness: number;
  hardwareMass: number;
  maxAngularSpeed: number;
};

type PhysicsModel = {
  cardCenterLocalX: number;
  cardCenterLocalY: number;
  equilibriumAngle: number;
  inertia: number;
  pivotToComLocalX: number;
  pivotToComLocalY: number;
  profile: MotionProfile;
};

const parts: PartOption[] = [
  { id: "ball-chain", label: "ボールチェーン", image: ballChainImage, fallbackIcon: "◌" },
  { id: "nasukan", label: "ナスカン", image: nasukanImage, fallbackIcon: "◎" },
  { id: "strap", label: "ストラップ", image: strapImage, fallbackIcon: "◍" },
];

const motionProfiles: Record<PartId, MotionProfile> = {
  nasukan: {
    alignDamping: 0.72,
    alignStiffness: 4.9,
    angularDamping: 0.9993,
    dragDamping: 7.2,
    dragFollowStiffness: 16.5,
    hardwareMass: 0.22,
    maxAngularSpeed: 6.8,
  },
  "ball-chain": {
    alignDamping: 0.68,
    alignStiffness: 4.7,
    angularDamping: 0.99935,
    dragDamping: 6.9,
    dragFollowStiffness: 15.8,
    hardwareMass: 0.14,
    maxAngularSpeed: 6.9,
  },
  strap: {
    alignDamping: 0.64,
    alignStiffness: 4.5,
    angularDamping: 0.99935,
    dragDamping: 6.8,
    dragFollowStiffness: 15.6,
    hardwareMass: 0.12,
    maxAngularSpeed: 6.9,
  },
};

const defaultSizeMm = 50;
const minSizeMm = 30;
const maxSizeMm = 100;
const sizeStepMm = 5;
const defaultThickness: ThicknessMm = 3;
const previewAngleLimit = Math.PI * 0.58;
const previewDragVelocityLimit = 4;
const holeDragSensitivity = 0.42;
const hardwareSizeCm = 4;

const normalizeAngle = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));

const rotatePoint = (x: number, y: number, angle: number) => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: x * cos - y * sin, y: x * sin + y * cos };
};

const getVisibleArtworkSpanPercent = (contour: Contour | null) => {
  if (!contour) return 100;
  const visibleWidth = Math.max(1, contour.lastOpaquePercent - contour.firstOpaquePercent);
  const visibleHeight = Math.max(1, contour.bottomOpaquePercent - contour.topOpaquePercent);
  return Math.max(visibleWidth, visibleHeight);
};

const getPhysicsModel = (
  partId: PartId,
  holePosition: number,
  holeTopPercent: number,
  artworkContour: Contour | null,
  hardwareContour: Contour | null,
  cardSize: number,
  hardwareFrameWidth: number,
  hardwareFrameHeight: number,
  hardwareBottomPx: number,
): PhysicsModel => {
  const holeLocalX = (holePosition - 50) / 100;
  const holeLocalY = (50 - holeTopPercent) / 100;
  const hardwareBottomLocalY = hardwareBottomPx / Math.max(cardSize, 1);
  const artworkComLocalX = ((artworkContour?.centerOfMassXPercent ?? 50) - 50) / 100;
  const artworkComLocalY = (50 - (artworkContour?.centerOfMassYPercent ?? 58)) / 100;
  const hardwareComXPercentInCard =
    holePosition +
    (((hardwareContour?.centerOfMassXPercent ?? 50) - 50) / 100) * ((hardwareFrameWidth / Math.max(cardSize, 1)) * 100);
  const hardwareComYPx = -hardwareBottomPx + ((hardwareContour?.centerOfMassYPercent ?? 62) / 100) * hardwareFrameHeight;
  const hardwareComYPercentInCard = (hardwareComYPx / Math.max(cardSize, 1)) * 100;
  const hardwareComLocalX = (hardwareComXPercentInCard - 50) / 100;
  const hardwareComLocalY = (50 - hardwareComYPercentInCard) / 100;
  const profile = motionProfiles[partId];
  const combinedComLocalX = artworkComLocalX * 0.84 + hardwareComLocalX * profile.hardwareMass;
  const combinedComLocalY = artworkComLocalY * 0.84 + hardwareComLocalY * profile.hardwareMass;
  const cardCenterLocalX = -holeLocalX;
  const cardCenterLocalY = -(hardwareBottomLocalY + holeLocalY);
  const pivotToComLocalX = cardCenterLocalX + combinedComLocalX * 0.42;
  const pivotToComLocalY = cardCenterLocalY + combinedComLocalY * 0.42;
  const equilibriumAngle = normalizeAngle(-Math.PI / 2 - Math.atan2(pivotToComLocalY, pivotToComLocalX));
  const balanceDistance = Math.hypot(pivotToComLocalX, pivotToComLocalY);
  const inertia = 0.28 + balanceDistance * balanceDistance * 0.46;

  return {
    cardCenterLocalX,
    cardCenterLocalY,
    equilibriumAngle,
    inertia,
    pivotToComLocalX,
    pivotToComLocalY,
    profile,
  };
};

const formatSize = (sizeMm: number) => `${sizeMm}mm`;

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("edit");
  const [selectedPart, setSelectedPart] = useState<PartId>("ball-chain");
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [status, setStatus] = useState<UploadStatus>("empty");
  const [error, setError] = useState<string | null>(null);
  const [contour, setContour] = useState<Contour | null>(null);
  const [hardwareContour, setHardwareContour] = useState<Contour | null>(null);
  const [sizeMm, setSizeMm] = useState(defaultSizeMm);
  const [thicknessMm, setThicknessMm] = useState<ThicknessMm>(defaultThickness);
  const [holePosition, setHolePosition] = useState(defaultHole);
  const [previewAngle, setPreviewAngle] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(typeof window === "undefined" ? 1280 : window.innerWidth);
  const [draggingHole, setDraggingHole] = useState(false);
  const [imageAvailability, setImageAvailability] = useState<Record<PartId, boolean>>({
    nasukan: true,
    "ball-chain": true,
    strap: true,
  });

  const previewRef = useRef<HTMLDivElement | null>(null);
  const mainCardRef = useRef<HTMLDivElement | null>(null);
  const holeDragRef = useRef({ startClientX: 0, startPosition: defaultHole, width: 1 });
  const previewMotionRef = useRef({
    angle: 0,
    angularVelocity: 0,
    desiredAngle: 0,
    lastDragAngle: 0,
    lastDragTimestamp: 0,
    isDragging: false,
    lastTimestamp: null as number | null,
    pointerId: null as number | null,
  });

  const activePart = useMemo(() => parts.find((part) => part.id === selectedPart) ?? parts[0], [selectedPart]);
  const previewReady = !!artwork && status === "ready";
  const cardBase =
    viewportWidth >= 1440
      ? clamp(viewportWidth * 0.17, 280, 360)
      : viewportWidth >= 1200
        ? clamp(viewportWidth * 0.19, 250, 330)
        : viewportWidth >= 768
          ? clamp(viewportWidth * 0.24, 210, 300)
          : clamp(viewportWidth - 156, 176, 240);
  const sizeCm = sizeMm / 10;
  const pixelsPerCm = cardBase / 5;
  const artworkSize = previewReady
    ? (pixelsPerCm * sizeCm * 100) / getVisibleArtworkSpanPercent(contour)
    : clamp(cardBase, 180, 280);
  const hardwareVisibleSize = pixelsPerCm * hardwareSizeCm;
  const hardwareWidth = hardwareVisibleSize;
  const hardwareHeight = hardwareVisibleSize;
  const hardwareBottomPx = hardwareHeight * ((hardwareContour?.bottomOpaquePercent ?? 86) / 100);
  const anchorTop = viewportWidth >= 1200 ? 62 : viewportWidth >= 768 ? 54 : 44;
  const holeTopPercent = getInsetHolePercent(holePosition, contour, artworkSize);
  const holeX = (artworkSize * holePosition) / 100;
  const holeY = (artworkSize * holeTopPercent) / 100;
  const physicsModel = useMemo(
    () =>
      getPhysicsModel(
        activePart.id,
        holePosition,
        holeTopPercent,
        contour,
        hardwareContour,
        artworkSize,
        hardwareWidth,
        hardwareHeight,
        hardwareBottomPx,
      ),
    [activePart.id, artworkSize, contour, hardwareBottomPx, hardwareContour, hardwareHeight, hardwareWidth, holePosition, holeTopPercent],
  );
  const cardLeft = physicsModel.cardCenterLocalX * artworkSize - artworkSize / 2;
  const cardTop = -physicsModel.cardCenterLocalY * artworkSize - artworkSize / 2;
  const renderedAngle = viewMode === "edit" || draggingHole ? 0 : previewAngle;
  const holeOffsetRatio = Math.min(1, Math.abs(holePosition - 50) / 32);
  const hardwareCounterRotation = `${((renderedAngle * 180) / Math.PI) * (0.34 + holeOffsetRatio * 0.44)}deg`;

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!artwork) {
      setContour(null);
      return;
    }

    let cancelled = false;
    analyzeContour(artwork.previewUrl)
      .then((nextContour) => {
        if (cancelled) return;
        setContour(nextContour);
        setHolePosition((current) => resolveHole(current, nextContour));
      })
      .catch(() => {
        if (!cancelled) setContour(null);
      });

    return () => {
      cancelled = true;
    };
  }, [artwork]);

  useEffect(() => {
    if (!imageAvailability[activePart.id]) {
      setHardwareContour(null);
      return;
    }

    let cancelled = false;
    analyzeContour(activePart.image)
      .then((nextContour) => {
        if (!cancelled) setHardwareContour(nextContour);
      })
      .catch(() => {
        if (!cancelled) setHardwareContour(null);
      });

    return () => {
      cancelled = true;
    };
  }, [activePart.id, activePart.image, imageAvailability]);

  useEffect(() => {
    if (!draggingHole) return;

    const onMove = (event: PointerEvent) => {
      const drag = holeDragRef.current;
      const delta = ((event.clientX - drag.startClientX) / Math.max(drag.width, 1)) * 100 * holeDragSensitivity;
      setHolePosition(resolveHole(drag.startPosition - delta, contour));
    };
    const onUp = () => setDraggingHole(false);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [contour, draggingHole]);

  useEffect(() => {
    if (!previewReady) {
      previewMotionRef.current = {
        angle: 0,
        angularVelocity: 0,
        desiredAngle: 0,
        lastDragAngle: 0,
        lastDragTimestamp: 0,
        isDragging: false,
        lastTimestamp: null,
        pointerId: null,
      };
      setPreviewAngle(0);
      return;
    }
  }, [previewReady]);

  useEffect(() => {
    if (!previewReady) return;

    let frame = 0;
    const motion = previewMotionRef.current;
    motion.lastTimestamp = null;

    const tick = (timestamp: number) => {
      const elapsed =
        motion.lastTimestamp === null
          ? 1 / 60
          : clamp((timestamp - motion.lastTimestamp) / 1000, 1 / 240, 1 / 24);
      const fixedStep = 1 / 120;
      const subSteps = Math.max(1, Math.ceil(elapsed / fixedStep));
      const stepDt = elapsed / subSteps;

      for (let step = 0; step < subSteps; step += 1) {
        const profile = physicsModel.profile;
        const pivotToComOffset = rotatePoint(physicsModel.pivotToComLocalX, physicsModel.pivotToComLocalY, motion.angle);
        let torque = pivotToComOffset.x * -9.81 * (1 + profile.hardwareMass) * 0.42;
        const targetAngle = motion.isDragging ? motion.desiredAngle : physicsModel.equilibriumAngle;
        const angleError = normalizeAngle(targetAngle - motion.angle);
        const followStiffness = motion.isDragging ? profile.dragFollowStiffness : profile.alignStiffness;
        const followDamping = motion.isDragging ? profile.dragDamping : profile.alignDamping;
        torque += angleError * followStiffness - motion.angularVelocity * followDamping;

        motion.angularVelocity += (torque / physicsModel.inertia) * stepDt;
        motion.angularVelocity = clamp(motion.angularVelocity, -profile.maxAngularSpeed, profile.maxAngularSpeed);
        motion.angularVelocity *= profile.angularDamping;
        motion.angle = normalizeAngle(motion.angle + motion.angularVelocity * stepDt);

        const relativeTilt = normalizeAngle(motion.angle - physicsModel.equilibriumAngle);
        if (relativeTilt > previewAngleLimit) {
          motion.angle = physicsModel.equilibriumAngle + previewAngleLimit;
          motion.angularVelocity = Math.min(motion.angularVelocity, 0);
        } else if (relativeTilt < -previewAngleLimit) {
          motion.angle = physicsModel.equilibriumAngle - previewAngleLimit;
          motion.angularVelocity = Math.max(motion.angularVelocity, 0);
        }
      }

      setPreviewAngle(motion.angle);
      motion.lastTimestamp = timestamp;
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [physicsModel, previewReady]);

  useEffect(() => {
    if (!previewReady || draggingHole) return;
    const motion = previewMotionRef.current;
    if (motion.isDragging) return;

    motion.angle = physicsModel.equilibriumAngle;
    motion.angularVelocity = 0;
    motion.desiredAngle = physicsModel.equilibriumAngle;
    motion.lastTimestamp = null;
    setPreviewAngle(physicsModel.equilibriumAngle);
  }, [draggingHole, physicsModel.equilibriumAngle, previewReady]);

  const processFile = async (file?: File) => {
    if (!file) return;
    if (!isSupportedFile(file)) {
      setStatus("error");
      setError("PNG / JPG / WEBP の画像を選んでください。");
      return;
    }

    setStatus("loading");
    setError(null);
    try {
      const nextArtwork = await readFile(file);
      setArtwork(nextArtwork);
      setStatus("ready");
      setViewMode("edit");
    } catch (nextError) {
      setStatus("error");
      setError(nextError instanceof Error ? nextError.message : "画像の読み込みに失敗しました");
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    await processFile(file);
  };

  const beginHoleDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    endPreviewDrag();
    const card = mainCardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const ratio = ((event.clientX - rect.left) / rect.width) * 100;
    holeDragRef.current = {
      startClientX: event.clientX,
      startPosition: resolveHole(ratio, contour),
      width: rect.width,
    };
    setHolePosition(resolveHole(ratio, contour));
    setDraggingHole(true);
  };

  const getPreviewAnchor = () => {
    const interaction = previewRef.current;
    if (!interaction) return null;
    const rect = interaction.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + anchorTop,
    };
  };

  const getPointerWorldPosition = (clientX: number, clientY: number) => {
    const anchor = getPreviewAnchor();
    if (!anchor) return null;
    return {
      x: (clientX - anchor.x) / Math.max(artworkSize, 1),
      y: (anchor.y - clientY) / Math.max(artworkSize, 1),
    };
  };

  const getDragTargetAngle = (pointerWorldX: number) =>
    clamp(Math.atan(pointerWorldX * 1.7) * 0.98, -previewAngleLimit, previewAngleLimit);

  const beginPreviewDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!previewReady || viewMode !== "preview" || draggingHole || !previewRef.current) return;
    event.preventDefault();
    const motion = previewMotionRef.current;
    const pointerWorld = getPointerWorldPosition(event.clientX, event.clientY);
    if (!pointerWorld) return;

    previewRef.current.setPointerCapture(event.pointerId);
    motion.isDragging = true;
    motion.pointerId = event.pointerId;
    motion.lastDragAngle = getDragTargetAngle(pointerWorld.x);
    motion.lastDragTimestamp = performance.now();
    motion.desiredAngle = motion.lastDragAngle;
    motion.lastTimestamp = motion.lastDragTimestamp;
  };

  const movePreviewDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const motion = previewMotionRef.current;
    if (!motion.isDragging || motion.pointerId !== event.pointerId) return;

    const nextTarget = getPointerWorldPosition(event.clientX, event.clientY);
    if (!nextTarget) return;

    const nextAngle = getDragTargetAngle(nextTarget.x);
    const now = performance.now();
    const dt = Math.max(now - motion.lastDragTimestamp, 8) / 1000;
    const angleDelta = normalizeAngle(nextAngle - motion.lastDragAngle);
    motion.angularVelocity += clamp((angleDelta / dt) * 0.14, -previewDragVelocityLimit, previewDragVelocityLimit);
    motion.lastDragAngle = nextAngle;
    motion.lastDragTimestamp = now;
    motion.desiredAngle = nextAngle;
  };

  const endPreviewDrag = (pointerId?: number) => {
    const motion = previewMotionRef.current;
    if (pointerId !== undefined && motion.pointerId !== pointerId) return;
    if (previewRef.current && pointerId !== undefined) {
      try {
        previewRef.current.releasePointerCapture(pointerId);
      } catch {
        // Ignore when capture is already released.
      }
    }
    motion.isDragging = false;
    motion.pointerId = null;
    motion.angularVelocity = clamp(motion.angularVelocity * 1.25, -4.8, 4.8);
    motion.lastTimestamp = performance.now();
    motion.lastDragTimestamp = 0;
    motion.desiredAngle = physicsModel.equilibriumAngle;
  };

  return (
    <main className="page-shell">
      <header className="topbar">
        <div>
          <p className="topbar-eyebrow">Single Acrylic Keychain MVP</p>
          <h1>アクキーシミュレーター</h1>
        </div>
        <p className="topbar-copy">Stitch UI ベースで、穴位置調整と揺れ確認に絞った単体アクキー用の構成です。</p>
      </header>

      <div className="workspace-grid">
        <aside className="control-column">
          <section className="surface-card">
            <div className="section-title">
              <span aria-hidden="true">upload_file</span>
              <h2>画像をアップロード</h2>
            </div>

            <label
              className={`upload-dropzone ${artwork ? "is-filled" : ""}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void processFile(event.dataTransfer.files?.[0]);
              }}
            >
              <input
                accept="image/png,image/jpeg,image/webp"
                aria-label="アクキー画像を選択"
                className="sr-only"
                onChange={(event) => void handleUpload(event)}
                type="file"
              />
              <div className="upload-dropzone-icon">{artwork ? "✓" : "cloud_upload"}</div>
              <div className="upload-dropzone-copy">
                <strong>{artwork?.fileName ?? "ドラッグ&ドロップ またはクリックして選択"}</strong>
                <span>
                  {status === "loading"
                    ? "画像を読み込み中です"
                    : status === "error"
                      ? error
                      : "透過PNG推奨。読み込み後に穴位置を左右へ調整できます。"}
                </span>
              </div>
              {artwork ? (
                <div className="upload-preview-frame">
                  <img alt="" className="upload-preview-image" src={artwork.previewUrl} />
                </div>
              ) : null}
            </label>
          </section>

          <section className="surface-card">
            <div className="section-title">
              <span aria-hidden="true">key</span>
              <h2>金具選択</h2>
            </div>

            <div className="part-grid">
              {parts.map((part) => (
                <button
                  key={part.id}
                  className={`part-button ${selectedPart === part.id ? "is-active" : ""}`}
                  onClick={() => setSelectedPart(part.id)}
                  type="button"
                >
                  <span className="part-button-preview" aria-hidden="true">
                    {imageAvailability[part.id] ? (
                      <img
                        alt=""
                        className="part-button-image"
                        onError={() => setImageAvailability((current) => ({ ...current, [part.id]: false }))}
                        src={part.image}
                      />
                    ) : (
                      <span className="part-button-fallback">{part.fallbackIcon}</span>
                    )}
                  </span>
                  <span className="part-button-label">{part.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="surface-card">
            <div className="slider-title-row">
              <div className="section-title">
                <span aria-hidden="true">straighten</span>
                <h2>サイズ</h2>
              </div>
              <strong>{formatSize(sizeMm)}</strong>
            </div>

            <input
              aria-label="サイズ"
              className="size-slider"
              max={maxSizeMm}
              min={minSizeMm}
              onChange={(event) => setSizeMm(Number(event.currentTarget.value))}
              step={sizeStepMm}
              type="range"
              value={sizeMm}
            />
            <div className="slider-scale">
              <span>{minSizeMm}mm</span>
              <span>{maxSizeMm}mm</span>
            </div>
          </section>

          <section className="surface-card">
            <div className="section-title">
              <span aria-hidden="true">layers</span>
              <h2>厚み</h2>
            </div>

            <div className="thickness-row">
              {([3, 5, 8] as ThicknessMm[]).map((value) => (
                <button
                  key={value}
                  className={`thickness-button ${thicknessMm === value ? "is-active" : ""}`}
                  onClick={() => setThicknessMm(value)}
                  type="button"
                >
                  {value}mm
                </button>
              ))}
            </div>
          </section>
        </aside>

        <section className="canvas-column">
          <div className="mode-switch">
            <button
              className={`mode-switch-button ${viewMode === "edit" ? "is-active" : ""}`}
              onClick={() => setViewMode("edit")}
              type="button"
            >
              編集
            </button>
            <button
              className={`mode-switch-button ${viewMode === "preview" ? "is-active" : ""}`}
              onClick={() => setViewMode("preview")}
              type="button"
            >
              プレビュー
            </button>
          </div>

          <div className="canvas-surface">
            {viewMode === "edit" ? (
              <div className="safe-zone" aria-hidden="true">
                <div className="safe-zone-inner">
                  <span>安全エリア</span>
                </div>
              </div>
            ) : null}

            <div
              ref={previewRef}
              className={`keychain-stage ${previewReady ? "is-ready" : "is-empty"} ${viewMode === "preview" ? "is-preview" : "is-edit"}`}
              onPointerCancel={(event) => endPreviewDrag(event.pointerId)}
              onPointerDown={beginPreviewDrag}
              onPointerMove={movePreviewDrag}
              onPointerUp={(event) => endPreviewDrag(event.pointerId)}
            >
              <div className="stage-anchor" style={{ left: "50%", top: `${anchorTop}px` }}>
                <div className="keychain-body" style={{ transform: `rotate(${(-renderedAngle * 180) / Math.PI}deg)` }}>
                  <div
                    className="hardware-shell"
                    style={{
                      width: `${hardwareWidth}px`,
                      height: `${hardwareHeight}px`,
                      top: `${-hardwareBottomPx}px`,
                      transform: `translateX(-50%) rotate(${hardwareCounterRotation})`,
                    }}
                  >
                    {imageAvailability[activePart.id] ? (
                      <img alt="" className="hardware-image" draggable={false} src={activePart.image} />
                    ) : (
                      <span className="hardware-fallback">{activePart.fallbackIcon}</span>
                    )}
                  </div>

                  {previewReady ? <span className="ring-connector" aria-hidden="true" /> : null}

                  <div
                    ref={mainCardRef}
                    className={`artwork-shell ${previewReady ? "is-artwork-ready" : "is-artwork-empty"}`}
                    style={{ left: `${cardLeft}px`, top: `${cardTop}px`, width: `${artworkSize}px` }}
                  >
                    {previewReady && artwork ? (
                      <>
                        <span className="hole-cutout" style={{ left: `${holeX}px`, top: `${holeY}px` }} />
                        {viewMode === "edit" ? (
                          <button
                            aria-label="穴位置を調整"
                            className="hole-handle"
                            onDoubleClick={() => setHolePosition(resolveHole(defaultHole, contour))}
                            onPointerDown={beginHoleDrag}
                            style={{ left: `${holeX}px`, top: `${holeY}px` }}
                            type="button"
                          />
                        ) : null}
                        <img alt="アップロードしたアクキー画像" className="artwork-image" draggable={false} src={artwork.previewUrl} />
                      </>
                    ) : (
                      <div className={`empty-artwork-card is-${status}`}>
                        <div className="empty-artwork-badge">upload</div>
                        <strong>画像を入れるとここに反映されます</strong>
                        <span>
                          {status === "loading"
                            ? "輪郭を解析しています"
                            : status === "error"
                              ? error
                              : "編集では穴位置を、プレビューでは揺れ方を確認できます。"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="canvas-help-row">
              {viewMode === "edit" ? (
                <>
                  <p className="canvas-help">穴ハンドルを左右へドラッグして接続位置を決めます。</p>
                  <p className="canvas-metric">穴位置 {Math.round(holePosition)}%</p>
                </>
              ) : (
                <>
                  <p className="canvas-help">本体をドラッグすると、穴位置を基準に揺れ方を確認できます。</p>
                  <p className="canvas-metric">厚み {thicknessMm}mm</p>
                </>
              )}
            </div>
          </div>

          <div className="summary-panel">
            <div className="summary-item">
              <span>サイズ</span>
              <strong>{formatSize(sizeMm)}</strong>
            </div>
            <div className="summary-item">
              <span>厚み</span>
              <strong>{thicknessMm}mm</strong>
            </div>
            <div className="summary-item">
              <span>金具</span>
              <strong>{activePart.label}</strong>
            </div>
            <div className="summary-item">
              <span>穴位置</span>
              <strong>{Math.round(holePosition)}%</strong>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
