import { useEffect, useMemo, useRef, useState } from "react";

import ballChainImage from "./assets/parts/ball-chain.png";
import nasukanImage from "./assets/parts/nasukan.png";
import strapImage from "./assets/parts/strap.png";

type PartId = "nasukan" | "ball-chain" | "strap";
type SlotId = "main" | "sub";
type Mode = "single" | "double";
type UploadStatus = "empty" | "loading" | "ready" | "error";

type Artwork = {
  fileName: string;
  previewUrl: string;
  naturalWidth: number;
  naturalHeight: number;
};

type Contour = {
  centerOfMassXPercent: number;
  centerOfMassYPercent: number;
  firstOpaquePercent: number;
  lastOpaquePercent: number;
  meanSquaredRadiusLocal: number;
  topOpaquePercent: number;
  bottomOpaquePercent: number;
  topEdgeByPercent: Array<number | null>;
  bottomEdgeByPercent: Array<number | null>;
};

type HoleId = "main" | "main-link" | "sub";

type PreviewPhysicsProfile = {
  alignDamping: number;
  alignStiffness: number;
  angularDamping: number;
  combinedComTorqueScale: number;
  desiredAngleFollow: number;
  dragDamping: number;
  dragFollowStiffness: number;
  hardwareMass: number;
  holeConstraintDamping: number;
  holeConstraintStiffness: number;
  inertiaBase: number;
  linearDamping: number;
  maxAngularSpeed: number;
  maxSpeed: number;
  positionCorrection: number;
  totalMass: number;
  velocityCorrection: number;
};

type PreviewPhysicsModel = {
  cardCenterLocalX: number;
  cardCenterLocalY: number;
  equilibriumAngle: number;
  inertia: number;
  pivotToComLocalX: number;
  pivotToComLocalY: number;
  profile: PreviewPhysicsProfile;
};

type LinkedAttachment = {
  comLocalX: number;
  comLocalY: number;
  mass: number;
};

const parts = [
  { id: "nasukan" as PartId, label: "ナスカン", image: nasukanImage, fallbackIcon: "◎" },
  { id: "ball-chain" as PartId, label: "ボールチェーン", image: ballChainImage, fallbackIcon: "◌" },
  { id: "strap" as PartId, label: "ストラップ", image: strapImage, fallbackIcon: "◍" },
];

const slotMeta = {
  main: { badge: "上", label: "上段パーツ", helper: "金具につながる上段です" },
  sub: { badge: "下", label: "下段パーツ", helper: "2連で下へぶら下がる下段です" },
} satisfies Record<SlotId, { badge: string; label: string; helper: string }>;

const acceptedTypes = ["image/png", "image/jpeg", "image/webp"];
const acceptedExtensions = [".png", ".jpg", ".jpeg", ".webp"];
const defaultHole = 50;
const holeMin = 18;
const holeMax = 82;
const sizeMinCm = 3;
const sizeMaxCm = 8;
const defaultSizeCm = 5;
const alphaThreshold = 16;
const holeDragSensitivity = 0.42;
const holeInsetPx = 8;
const previewAngleLimit = Math.PI * 0.58;
const previewDragVelocityLimit = 4;
const partSizeCm = 4;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const normalizeAngle = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));
const rotatePoint = (x: number, y: number, angle: number) => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: x * cos - y * sin, y: x * sin + y * cos };
};

const partMotionProfiles: Record<PartId, PreviewPhysicsProfile> = {
  nasukan: {
    alignDamping: 0.72,
    alignStiffness: 4.9,
    angularDamping: 0.9993,
    combinedComTorqueScale: 0.46,
    desiredAngleFollow: 0.16,
    dragDamping: 7.2,
    dragFollowStiffness: 16.5,
    hardwareMass: 0.22,
    holeConstraintDamping: 14,
    holeConstraintStiffness: 92,
    inertiaBase: 0.32,
    linearDamping: 0.988,
    maxAngularSpeed: 6.8,
    maxSpeed: 2.7,
    positionCorrection: 0.02,
    totalMass: 1.98,
    velocityCorrection: 0.06,
  },
  "ball-chain": {
    alignDamping: 0.68,
    alignStiffness: 4.7,
    angularDamping: 0.99935,
    combinedComTorqueScale: 0.43,
    desiredAngleFollow: 0.16,
    dragDamping: 6.9,
    dragFollowStiffness: 15.8,
    hardwareMass: 0.14,
    holeConstraintDamping: 13,
    holeConstraintStiffness: 88,
    inertiaBase: 0.3,
    linearDamping: 0.989,
    maxAngularSpeed: 6.9,
    maxSpeed: 2.9,
    positionCorrection: 0.018,
    totalMass: 1.66,
    velocityCorrection: 0.055,
  },
  strap: {
    alignDamping: 0.64,
    alignStiffness: 4.5,
    angularDamping: 0.99935,
    combinedComTorqueScale: 0.42,
    desiredAngleFollow: 0.16,
    dragDamping: 6.8,
    dragFollowStiffness: 15.6,
    hardwareMass: 0.12,
    holeConstraintDamping: 13,
    holeConstraintStiffness: 86,
    inertiaBase: 0.29,
    linearDamping: 0.989,
    maxAngularSpeed: 6.9,
    maxSpeed: 2.8,
    positionCorrection: 0.018,
    totalMass: 1.58,
    velocityCorrection: 0.055,
  },
};

const containBounds = (width: number, height: number) => {
  const ratio = width / height;
  if (ratio >= 1) {
    const renderHeight = 100 / ratio;
    return { left: 0, top: (100 - renderHeight) / 2, width: 100, height: renderHeight };
  }
  const renderWidth = ratio * 100;
  return { left: (100 - renderWidth) / 2, top: 0, width: renderWidth, height: 100 };
};

const isSupportedFile = (file: File) =>
  acceptedTypes.includes(file.type) || acceptedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

const readFile = (file: File) =>
  new Promise<Artwork>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("画像のプレビュー生成に失敗しました"));
        return;
      }
      const image = new Image();
      image.onload = () => {
        resolve({
          fileName: file.name,
          naturalHeight: image.naturalHeight,
          naturalWidth: image.naturalWidth,
          previewUrl: reader.result as string,
        });
      };
      image.onerror = () => reject(new Error("画像の解析に失敗しました"));
      image.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

const analyzeContour = (src: string) =>
  new Promise<Contour>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        reject(new Error("Canvas context is not available"));
        return;
      }
      context.drawImage(image, 0, 0, width, height);
      const { data } = context.getImageData(0, 0, width, height);
      const bounds = containBounds(image.naturalWidth, image.naturalHeight);
      let alphaWeightedX = 0;
      let alphaWeightedY = 0;
      let alphaWeightedX2 = 0;
      let alphaWeightedY2 = 0;
      let totalAlpha = 0;
      let top = height - 1;
      let bottom = 0;
      const topEdgeByPercent: Array<number | null> = Array.from({ length: 101 }, (_, percent) => {
        if (percent < bounds.left || percent > bounds.left + bounds.width) return null;
        const x = clamp(
          Math.round(((percent - bounds.left) / bounds.width) * (width - 1)),
          0,
          Math.max(0, width - 1),
        );
        for (let y = 0; y < height; y += 1) {
          const alpha = data[(y * width + x) * 4 + 3];
          if (alpha > alphaThreshold) {
            return bounds.top + ((height === 1 ? 0 : y / (height - 1)) * bounds.height);
          }
        }
        return null;
      });
      const bottomEdgeByPercent: Array<number | null> = Array.from({ length: 101 }, (_, percent) => {
        if (percent < bounds.left || percent > bounds.left + bounds.width) return null;
        const x = clamp(
          Math.round(((percent - bounds.left) / bounds.width) * (width - 1)),
          0,
          Math.max(0, width - 1),
        );
        for (let y = height - 1; y >= 0; y -= 1) {
          const alpha = data[(y * width + x) * 4 + 3];
          if (alpha > alphaThreshold) {
            return bounds.top + ((height === 1 ? 0 : y / (height - 1)) * bounds.height);
          }
        }
        return null;
      });
      const valid = topEdgeByPercent.flatMap((value, index) => (value === null ? [] : index));
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const alpha = data[(y * width + x) * 4 + 3];
          if (alpha <= alphaThreshold) continue;
          alphaWeightedX += x * alpha;
          alphaWeightedY += y * alpha;
          alphaWeightedX2 += x * x * alpha;
          alphaWeightedY2 += y * y * alpha;
          totalAlpha += alpha;
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      }
      const fallbackCenterXPercent = bounds.left + bounds.width / 2;
      const fallbackCenterYPercent = bounds.top + bounds.height / 2;
      const alphaCenterXPercent =
        totalAlpha > 0
          ? bounds.left + ((alphaWeightedX / totalAlpha) / Math.max(1, width - 1)) * bounds.width
          : fallbackCenterXPercent;
      const alphaCenterYPercent =
        totalAlpha > 0
          ? bounds.top + ((alphaWeightedY / totalAlpha) / Math.max(1, height - 1)) * bounds.height
          : fallbackCenterYPercent;
      const pixelMeanX = totalAlpha > 0 ? alphaWeightedX / totalAlpha : (width - 1) / 2;
      const pixelMeanY = totalAlpha > 0 ? alphaWeightedY / totalAlpha : (height - 1) / 2;
      const pixelVarianceX =
        totalAlpha > 0 ? Math.max(0, alphaWeightedX2 / totalAlpha - pixelMeanX * pixelMeanX) : 0;
      const pixelVarianceY =
        totalAlpha > 0 ? Math.max(0, alphaWeightedY2 / totalAlpha - pixelMeanY * pixelMeanY) : 0;
      const percentScaleX = bounds.width / Math.max(1, width - 1);
      const percentScaleY = bounds.height / Math.max(1, height - 1);
      const meanSquaredRadiusLocal =
        ((pixelVarianceX * percentScaleX * percentScaleX) +
          (pixelVarianceY * percentScaleY * percentScaleY)) /
        10000;
      const centerBlendRatio = 0.9;
      resolve({
        centerOfMassXPercent:
          fallbackCenterXPercent * (1 - centerBlendRatio) + alphaCenterXPercent * centerBlendRatio,
        centerOfMassYPercent:
          fallbackCenterYPercent * (1 - centerBlendRatio) + alphaCenterYPercent * centerBlendRatio,
        bottomOpaquePercent:
          bounds.top + ((bottom / Math.max(1, height - 1)) * bounds.height),
        firstOpaquePercent: valid[0] ?? Math.round(bounds.left),
        lastOpaquePercent: valid[valid.length - 1] ?? Math.round(bounds.left + bounds.width),
        meanSquaredRadiusLocal,
        topOpaquePercent: bounds.top + ((top / Math.max(1, height - 1)) * bounds.height),
        topEdgeByPercent,
        bottomEdgeByPercent,
      });
    };
    image.onerror = () => reject(new Error("画像輪郭の解析に失敗しました"));
    image.src = src;
  });

const resolveHole = (target: number, contour: Contour | null, edge: "top" | "bottom" = "top") => {
  if (!contour) return clamp(target, holeMin, holeMax);
  const edgePoints = edge === "top" ? contour.topEdgeByPercent : contour.bottomEdgeByPercent;
  const safe = clamp(target, contour.firstOpaquePercent, contour.lastOpaquePercent);
  let nearest: number | null = null;
  edgePoints.forEach((value, index) => {
    if (value === null || index < contour.firstOpaquePercent || index > contour.lastOpaquePercent) return;
    if (nearest === null || Math.abs(index - safe) < Math.abs(nearest - safe)) nearest = index;
  });
  return nearest ?? clamp(safe, holeMin, holeMax);
};

const getHoleEdge = (position: number, contour: Contour | null, edge: "top" | "bottom") => {
  if (!contour) return 0;
  const edgePoints = edge === "top" ? contour.topEdgeByPercent : contour.bottomEdgeByPercent;
  const index = clamp(Math.round(position), 0, 100);
  if (edgePoints[index] !== null) return edgePoints[index] ?? 0;
  for (let offset = 1; offset <= 100; offset += 1) {
    const left = index - offset;
    const right = index + offset;
    if (left >= 0 && edgePoints[left] !== null) return edgePoints[left] ?? 0;
    if (right <= 100 && edgePoints[right] !== null) return edgePoints[right] ?? 0;
  }
  return 0;
};

const getInsetHolePercent = (
  position: number,
  contour: Contour | null,
  edge: "top" | "bottom",
  size: number,
) => {
  const raw = getHoleEdge(position, contour, edge);
  const insetPercent = (holeInsetPx / Math.max(size, 1)) * 100;
  return edge === "top"
    ? clamp(raw + insetPercent, 0, 100)
    : clamp(raw - insetPercent, 0, 100);
};

const getPreviewPhysicsModel = (
  partId: PartId,
  holePosition: number,
  holeTopPercent: number,
  artworkContour: Contour | null,
  partContour: Contour | null,
  cardSize: number,
  hardwareFrameWidth: number,
  hardwareFrameHeight: number,
  hardwareBottomPx: number,
  linkedAttachment?: LinkedAttachment,
) => {
  const balanceBlend = linkedAttachment ? 0.52 : 0.34;
  const holeLocalX = (holePosition - 50) / 100;
  const holeLocalY = (50 - holeTopPercent) / 100;
  const hardwareBottomLocalY = hardwareBottomPx / Math.max(cardSize, 1);
  const artworkComLocalX = ((artworkContour?.centerOfMassXPercent ?? 50) - 50) / 100;
  const artworkComLocalY = (50 - (artworkContour?.centerOfMassYPercent ?? 58)) / 100;
  const hardwareComXPercentInCard =
    holePosition +
    (((partContour?.centerOfMassXPercent ?? 50) - 50) / 100) *
      ((hardwareFrameWidth / Math.max(cardSize, 1)) * 100);
  const hardwareComYPx =
    -hardwareBottomPx + ((partContour?.centerOfMassYPercent ?? 62) / 100) * hardwareFrameHeight;
  const hardwareComYPercentInCard = (hardwareComYPx / Math.max(cardSize, 1)) * 100;
  const hardwareComLocalX = (hardwareComXPercentInCard - 50) / 100;
  const hardwareComLocalY = (50 - hardwareComYPercentInCard) / 100;
  const profile = partMotionProfiles[partId];
  const artworkMass = Math.max(profile.totalMass - profile.hardwareMass, 0.8);
  const linkedMass = linkedAttachment?.mass ?? 0;
  const combinedMass = artworkMass + profile.hardwareMass + linkedMass;
  const combinedComLocalX =
    (
      artworkComLocalX * artworkMass +
      hardwareComLocalX * profile.hardwareMass +
      (linkedAttachment?.comLocalX ?? 0) * linkedMass
    ) / combinedMass;
  const combinedComLocalY =
    (
      artworkComLocalY * artworkMass +
      hardwareComLocalY * profile.hardwareMass +
      (linkedAttachment?.comLocalY ?? 0) * linkedMass
    ) / combinedMass;
  const cardCenterLocalX = -holeLocalX;
  const cardCenterLocalY = -(hardwareBottomLocalY + holeLocalY);
  const pivotToCardCenterLocalX = cardCenterLocalX;
  const pivotToCardCenterLocalY = cardCenterLocalY;
  const pivotToComLocalX = pivotToCardCenterLocalX + combinedComLocalX * balanceBlend;
  const pivotToComLocalY = pivotToCardCenterLocalY + combinedComLocalY * balanceBlend;
  const equilibriumAngle = normalizeAngle(
    -Math.PI / 2 - Math.atan2(pivotToComLocalY, pivotToComLocalX),
  );
  const balanceDistance = Math.hypot(pivotToComLocalX, pivotToComLocalY);
  const artworkSpread = artworkContour?.meanSquaredRadiusLocal ?? 0.03;
  const hardwareDistanceSquared =
    hardwareComLocalX * hardwareComLocalX + hardwareComLocalY * hardwareComLocalY;
  const linkedDistanceSquared =
    (linkedAttachment?.comLocalX ?? 0) * (linkedAttachment?.comLocalX ?? 0) +
    (linkedAttachment?.comLocalY ?? 0) * (linkedAttachment?.comLocalY ?? 0);
  const inertia =
    profile.inertiaBase +
    artworkSpread * 2.4 +
    balanceDistance * balanceDistance * 0.42 +
    hardwareDistanceSquared * profile.hardwareMass * 0.16 +
    linkedDistanceSquared * linkedMass * 0.22;

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

export default function App() {
  const [mode, setMode] = useState<Mode>("single");
  const [selectedPart, setSelectedPart] = useState<PartId>("nasukan");
  const [artworks, setArtworks] = useState<Record<SlotId, Artwork | null>>({ main: null, sub: null });
  const [statuses, setStatuses] = useState<Record<SlotId, UploadStatus>>({ main: "empty", sub: "empty" });
  const [errors, setErrors] = useState<Record<SlotId, string | null>>({ main: null, sub: null });
  const [contours, setContours] = useState<Record<SlotId, Contour | null>>({ main: null, sub: null });
  const [partContour, setPartContour] = useState<Contour | null>(null);
  const [scales, setScales] = useState<Record<SlotId, number>>({
    main: defaultSizeCm,
    sub: defaultSizeCm,
  });
  const [holes, setHoles] = useState<Record<HoleId, number>>({
    main: defaultHole,
    "main-link": defaultHole,
    sub: defaultHole,
  });
  const [previewAngle, setPreviewAngle] = useState(0);
  const [subAngle, setSubAngle] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(typeof window === "undefined" ? 1024 : window.innerWidth);
  const [draggingHole, setDraggingHole] = useState<HoleId | null>(null);
  const [imageAvailability, setImageAvailability] = useState<Record<PartId, boolean>>({ nasukan: true, "ball-chain": true, strap: true });
  const previewRef = useRef<HTMLDivElement | null>(null);
  const mainCardRef = useRef<HTMLDivElement | null>(null);
  const subCardRef = useRef<HTMLDivElement | null>(null);
  const holeDragRef = useRef({ slot: "main" as HoleId, startClientX: 0, startPosition: defaultHole, width: 1 });
  const previewBodyRef = useRef<HTMLDivElement | null>(null);
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
  const subMotionRef = useRef({ angle: 0, velocity: 0 });

  const mainArtwork = artworks.main;
  const subArtwork = artworks.sub;
  const isDouble = mode === "double";
  const previewReady = !!mainArtwork && statuses.main !== "loading";
  const doubleReady = isDouble && !!mainArtwork && !!subArtwork;
  const activePart = useMemo(() => parts.find((part) => part.id === selectedPart) ?? parts[0], [selectedPart]);
  const cardBase = viewportWidth >= 1600
    ? clamp(viewportWidth * 0.2, 300, 380)
    : viewportWidth >= 1200
      ? clamp(viewportWidth * 0.22, 280, 360)
      : viewportWidth >= 768
        ? clamp(viewportWidth * 0.24, 220, 300)
        : clamp(viewportWidth - 138, 168, 208);
  const pixelsPerCm = cardBase / defaultSizeCm;
  const topSize = pixelsPerCm * scales.main;
  const lowerSize = pixelsPerCm * scales.sub;
  const hardwareVisibleSize = pixelsPerCm * partSizeCm;
  const hardwareWidth = hardwareVisibleSize;
  const hardwareHeight = hardwareVisibleSize;
  const hardwareBottomPx = hardwareHeight * ((partContour?.bottomOpaquePercent ?? 86) / 100);
  const anchorTop = viewportWidth >= 1200 ? 82 : viewportWidth >= 768 ? 72 : 56;
  const linkLength = viewportWidth >= 768 ? 6 : 4;
  const topHoleY = (topSize * getInsetHolePercent(holes.main, contours.main, "top", topSize)) / 100;
  const topLinkHoleY =
    (topSize * getInsetHolePercent(holes["main-link"], contours.main, "bottom", topSize)) / 100;
  const lowerHoleY =
    (lowerSize * getInsetHolePercent(holes.sub, contours.sub, "top", lowerSize)) / 100;
  const topHoleX = (topSize * holes.main) / 100;
  const topLinkHoleX = (topSize * holes["main-link"]) / 100;
  const lowerHoleX = (lowerSize * holes.sub) / 100;
  const lowerEquilibrium = ((holes.sub - 50) / 100) * 0.28;
  const bottomAnchorX = topLinkHoleX;
  const bottomAnchorY = topLinkHoleY;
  const linkedAttachment = useMemo<LinkedAttachment | undefined>(() => {
    if (!doubleReady) {
      return undefined;
    }
    const lowerHoleTopPercent = getInsetHolePercent(holes.sub, contours.sub, "top", lowerSize);
    const lowerCardCenterLocalX = ((50 - holes.sub) / 100) * (lowerSize / Math.max(topSize, 1));
    const lowerCardCenterLocalY =
      -(((50 - lowerHoleTopPercent) / 100) * (lowerSize / Math.max(topSize, 1)));
    const lowerArtworkComLocalX =
      (((contours.sub?.centerOfMassXPercent ?? 50) - 50) / 100) * (lowerSize / Math.max(topSize, 1));
    const lowerArtworkComLocalY =
      ((50 - (contours.sub?.centerOfMassYPercent ?? 58)) / 100) * (lowerSize / Math.max(topSize, 1));
    const linkOffsetX = (topLinkHoleX - topHoleX) / Math.max(topSize, 1);
    const linkOffsetY = -(topLinkHoleY - topHoleY + linkLength) / Math.max(topSize, 1);
    return {
      comLocalX: linkOffsetX + lowerCardCenterLocalX + lowerArtworkComLocalX * 0.22,
      comLocalY: linkOffsetY + lowerCardCenterLocalY + lowerArtworkComLocalY * 0.22,
      mass: 0.92,
    };
  }, [contours.sub, doubleReady, holes.sub, linkLength, lowerSize, topHoleX, topHoleY, topLinkHoleX, topLinkHoleY, topSize]);
  const previewPhysicsModel = useMemo(
    () =>
      getPreviewPhysicsModel(
        activePart.id,
        holes.main,
        getInsetHolePercent(holes.main, contours.main, "top", topSize),
        contours.main,
        partContour,
        topSize,
        hardwareWidth,
        hardwareHeight,
        hardwareBottomPx,
        linkedAttachment,
      ),
    [activePart.id, contours.main, hardwareBottomPx, hardwareHeight, hardwareWidth, holes.main, linkedAttachment, partContour, topSize],
  );
  const topCardLeft = previewPhysicsModel.cardCenterLocalX * topSize - topSize / 2;
  const topCardTop = -previewPhysicsModel.cardCenterLocalY * topSize - topSize / 2;
  const lowerCardLeft = -lowerHoleX;
  const lowerCardTop = -lowerHoleY;
  const renderedAngle = draggingHole ? 0 : previewAngle;
  const holeOffsetRatio = Math.min(1, Math.abs(holes.main - 50) / Math.max(holeMax - 50, 1));
  const hardwareUprightFactor = 0.34 + holeOffsetRatio * 0.44;
  const hardwareCounterRotation = `${((renderedAngle * 180) / Math.PI) * hardwareUprightFactor}deg`;

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (Object.keys(artworks) as SlotId[]).forEach((slot) => {
      const artwork = artworks[slot];
      if (!artwork) {
        setContours((current) => ({ ...current, [slot]: null }));
        return;
      }
      analyzeContour(artwork.previewUrl)
        .then((contour) => {
          if (cancelled) return;
          setContours((current) => ({ ...current, [slot]: contour }));
          setHoles((current) => ({
            ...current,
            [slot]: resolveHole(current[slot], contour, "top"),
            ...(slot === "main"
              ? { "main-link": resolveHole(current["main-link"], contour, "bottom") }
              : {}),
          }));
        })
        .catch(() => {
          if (!cancelled) setContours((current) => ({ ...current, [slot]: null }));
        });
    });
    return () => {
      cancelled = true;
    };
  }, [artworks]);

  useEffect(() => {
    if (!imageAvailability[activePart.id]) {
      setPartContour(null);
      return;
    }
    let cancelled = false;
    analyzeContour(activePart.image)
      .then((contour) => {
        if (!cancelled) setPartContour(contour);
      })
      .catch(() => {
        if (!cancelled) setPartContour(null);
      });
    return () => {
      cancelled = true;
    };
  }, [activePart.id, activePart.image, imageAvailability]);

  useEffect(() => {
    if (!draggingHole) return;
    const onMove = (event: PointerEvent) => {
      const drag = holeDragRef.current;
      const delta =
        ((event.clientX - drag.startClientX) / Math.max(drag.width, 1)) * 100 * holeDragSensitivity;
      const next = drag.startPosition - (drag.slot === "main-link" ? -delta : delta);
      const targetContour = drag.slot === "sub" ? contours.sub : contours.main;
      setHoles((current) => ({
        ...current,
        [drag.slot]: resolveHole(next, targetContour, drag.slot === "main-link" ? "bottom" : "top"),
      }));
    };
    const onUp = () => setDraggingHole(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [contours, draggingHole]);

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
      subMotionRef.current = { angle: 0, velocity: 0 };
      setPreviewAngle(0);
      setSubAngle(0);
      return;
    }
  }, [previewReady]);

  useEffect(() => {
    if (!previewReady) {
      return;
    }
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
      const subMotion = subMotionRef.current;

      for (let step = 0; step < subSteps; step += 1) {
        const profile = previewPhysicsModel.profile;
        const pivotToComOffset = rotatePoint(
          previewPhysicsModel.pivotToComLocalX,
          previewPhysicsModel.pivotToComLocalY,
          motion.angle,
        );
        let torque = 0;
        torque += pivotToComOffset.x * -9.81 * profile.totalMass * profile.combinedComTorqueScale;

        const targetAngle = motion.isDragging
          ? motion.desiredAngle
          : previewPhysicsModel.equilibriumAngle;
        const angleError = normalizeAngle(targetAngle - motion.angle);
        const followStiffness = motion.isDragging
          ? profile.dragFollowStiffness
          : profile.alignStiffness;
        const followDamping = motion.isDragging ? profile.dragDamping : profile.alignDamping;
        torque += angleError * followStiffness - motion.angularVelocity * followDamping;

        motion.angularVelocity += (torque / previewPhysicsModel.inertia) * stepDt;
        motion.angularVelocity = clamp(
          motion.angularVelocity,
          -profile.maxAngularSpeed,
          profile.maxAngularSpeed,
        );
        motion.angularVelocity *= profile.angularDamping;
        if (doubleReady && !motion.isDragging) {
          motion.angularVelocity *= 0.996;
        }
        motion.angle = normalizeAngle(motion.angle + motion.angularVelocity * stepDt);

        const relativeTilt = normalizeAngle(motion.angle - previewPhysicsModel.equilibriumAngle);
        if (relativeTilt > previewAngleLimit) {
          motion.angle = previewPhysicsModel.equilibriumAngle + previewAngleLimit;
          motion.angularVelocity = Math.min(motion.angularVelocity, 0);
        } else if (relativeTilt < -previewAngleLimit) {
          motion.angle = previewPhysicsModel.equilibriumAngle - previewAngleLimit;
          motion.angularVelocity = Math.max(motion.angularVelocity, 0);
        }
      }

      if (doubleReady) {
        const subTarget = lowerEquilibrium - motion.angle * 0.68;
        subMotion.velocity +=
          ((subTarget - subMotion.angle) * 10.8 -
            subMotion.velocity * 10.4 -
            motion.angularVelocity * 0.08) *
          elapsed;
        subMotion.angle = clamp(
          normalizeAngle(subMotion.angle + subMotion.velocity * elapsed),
          -0.8,
          0.8,
        );
      } else {
        subMotion.velocity += (0 - subMotion.angle) * 12 * elapsed;
        subMotion.angle = normalizeAngle(subMotion.angle + subMotion.velocity * elapsed);
      }

      setPreviewAngle(motion.angle);
      setSubAngle(subMotion.angle);
      motion.lastTimestamp = timestamp;
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [doubleReady, lowerEquilibrium, previewPhysicsModel, previewReady]);

  useEffect(() => {
    if (!previewReady || draggingHole) {
      return;
    }

    const motion = previewMotionRef.current;
    if (motion.isDragging) {
      return;
    }

    motion.angle = previewPhysicsModel.equilibriumAngle;
    motion.angularVelocity = 0;
    motion.desiredAngle = previewPhysicsModel.equilibriumAngle;
    motion.lastTimestamp = null;
    setPreviewAngle(previewPhysicsModel.equilibriumAngle);
  }, [draggingHole, previewPhysicsModel.equilibriumAngle, previewReady]);

  const handleUpload = async (slot: SlotId, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!isSupportedFile(file)) {
      setStatuses((current) => ({ ...current, [slot]: "error" }));
      setErrors((current) => ({ ...current, [slot]: "PNG / JPG / WEBP の画像を選んでください。" }));
      return;
    }
    setStatuses((current) => ({ ...current, [slot]: "loading" }));
    setErrors((current) => ({ ...current, [slot]: null }));
    try {
      const artwork = await readFile(file);
      setArtworks((current) => ({ ...current, [slot]: artwork }));
      setStatuses((current) => ({ ...current, [slot]: "ready" }));
    } catch (error) {
      setStatuses((current) => ({ ...current, [slot]: "error" }));
      setErrors((current) => ({
        ...current,
        [slot]: error instanceof Error ? error.message : "画像の読み込みに失敗しました",
      }));
    }
  };

  const beginHoleDrag = (slot: HoleId, event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    endPreviewDrag();
    const card = slot === "sub" ? subCardRef.current : mainCardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const ratio = ((event.clientX - rect.left) / rect.width) * 100;
    const targetContour = slot === "sub" ? contours.sub : contours.main;
    const targetEdge = slot === "main-link" ? "bottom" : "top";
    holeDragRef.current = {
      slot,
      startClientX: event.clientX,
      startPosition: resolveHole(ratio, targetContour, targetEdge),
      width: rect.width,
    };
    setHoles((current) => ({ ...current, [slot]: resolveHole(ratio, targetContour, targetEdge) }));
    setDraggingHole(slot);
  };

  const getPreviewAnchor = () => {
    const interaction = previewRef.current;
    if (!interaction) {
      return null;
    }
    const rect = interaction.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + anchorTop,
    };
  };

  const getPointerWorldPosition = (clientX: number, clientY: number) => {
    const anchor = getPreviewAnchor();
    if (!anchor) {
      return null;
    }
    return {
      x: (clientX - anchor.x) / Math.max(topSize, 1),
      y: (anchor.y - clientY) / Math.max(topSize, 1),
    };
  };

  const getDragTargetAngle = (pointerWorldX: number) =>
    clamp(Math.atan(pointerWorldX * 1.7) * 0.98, -previewAngleLimit, previewAngleLimit);

  const beginPreviewDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!previewReady || draggingHole || !previewRef.current) return;
    event.preventDefault();
    const motion = previewMotionRef.current;
    const pointerWorld = getPointerWorldPosition(event.clientX, event.clientY);
    if (!pointerWorld) {
      return;
    }
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
    if (!nextTarget) {
      return;
    }
    const nextAngle = getDragTargetAngle(nextTarget.x);
    const now = performance.now();
    const dt = Math.max(now - motion.lastDragTimestamp, 8) / 1000;
    const angleDelta = normalizeAngle(nextAngle - motion.lastDragAngle);
    motion.angularVelocity += clamp(
      (angleDelta / dt) * 0.14,
      -previewDragVelocityLimit,
      previewDragVelocityLimit,
    );
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
    motion.desiredAngle = previewPhysicsModel.equilibriumAngle;
  };

  return (
    <main className="app-shell">
      <section className="phone-frame">
        <header className="hero">
          <p className="hero-kicker">Acrylic Keychain Maker</p>
          <h1>アクキーシミュレーター</h1>
          <p className="hero-copy">画像サイズを見比べながら、単体と 2 連の見え方をすばやく確認できます。</p>
        </header>
        <div className="content-layout">
          <div className="control-column">
            <section className="panel">
              <div className="section-heading"><span aria-hidden="true">🧷</span><h2>構成を選ぶ</h2></div>
              <div className="mode-switch">
                <button className={`mode-button ${mode === "single" ? "is-active" : ""}`} onClick={() => setMode("single")} type="button"><strong>単体</strong><span>1 枚で確認</span></button>
                <button className={`mode-button ${mode === "double" ? "is-active" : ""}`} onClick={() => setMode("double")} type="button"><strong>2連</strong><span>上下 2 パーツで確認</span></button>
              </div>
            </section>
            <section className="panel">
              <div className="section-heading"><span aria-hidden="true">🖼️</span><h2>画像アップロード</h2></div>
              <div className="upload-stack">
                {(["main", ...(isDouble ? ["sub"] : [])] as SlotId[]).map((slot) => (
                  <div className="upload-card" key={slot}>
                    <div className="upload-card-header"><div><p className="upload-card-eyebrow">{slotMeta[slot].label}</p><strong>{slot === "main" ? "画像を追加" : "下段画像を追加"}</strong></div><span className="upload-slot-badge">{slotMeta[slot].badge}</span></div>
                    <label className={`upload-dropzone ${artworks[slot] ? "is-filled" : ""}`}>
                      <input accept="image/png,image/jpeg,image/webp" aria-label={`${slotMeta[slot].label}の画像を選択`} className="sr-only" onChange={(event) => void handleUpload(slot, event)} type="file" />
                      <div className="upload-badge">{artworks[slot] ? <img alt="" className="upload-badge-image" src={artworks[slot]!.previewUrl} /> : slotMeta[slot].badge}</div>
                      <strong>{artworks[slot]?.fileName ?? `${slotMeta[slot].label}をアップロード`}</strong>
                      <span className="upload-dropzone-note">{slotMeta[slot].helper}</span>
                    </label>
                    <div className={`upload-status-card is-${statuses[slot]}`}>
                      {statuses[slot] === "empty" ? <><strong>まだ画像は入っていません</strong><span>{slot === "main" ? "上段を入れるとプレビューが始まります。" : "2連を試すときだけ追加してください。"}</span></> : null}
                      {statuses[slot] === "loading" ? <strong>画像を読み込み中です</strong> : null}
                      {statuses[slot] === "ready" && artworks[slot] ? <><strong>{artworks[slot]!.naturalWidth} x {artworks[slot]!.naturalHeight}px</strong><span>下のスライダーでサイズ調整できます。</span></> : null}
                      {statuses[slot] === "error" ? <><strong>画像を読み込めませんでした</strong><span>{errors[slot]}</span></> : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className="panel">
              <div className="section-heading"><span aria-hidden="true">📏</span><h2>サイズ調整</h2></div>
              <div className="scale-stack">
                {(["main", ...(isDouble ? ["sub"] : [])] as SlotId[]).map((slot) => (
                  <label className="scale-control" key={slot}>
                    <div className="scale-control-header"><span>{slot === "main" ? "上段サイズ" : "下段サイズ"}</span><strong>{Number.isInteger(scales[slot]) ? `${scales[slot]}cm` : `${scales[slot].toFixed(1)}cm`}</strong></div>
                    <input
                      aria-label={slot === "main" ? "上段サイズ" : "下段サイズ"}
                      className="scale-slider"
                      max={sizeMaxCm}
                      min={sizeMinCm}
                      onChange={(event) => {
                        const nextValue = Number(event.currentTarget.value);
                        setScales((current) => ({ ...current, [slot]: nextValue }));
                      }}
                      step={0.5}
                      type="range"
                      value={scales[slot]}
                    />
                    <span className="scale-caption">{slot === "main" ? "上段画像は 5cm、パーツは 4cm 基準です。画像は 3cm から 8cm まで 0.5cm 刻みで調整できます。" : "上下とも同じ基準で、3cm から 8cm まで 0.5cm 刻みで調整できます。"}</span>
                  </label>
                ))}
              </div>
            </section>
            <section className="panel">
              <div className="section-heading"><span aria-hidden="true">🧩</span><h2>パーツを選ぶ</h2></div>
              <div className="parts-grid">
                {parts.map((part) => <button key={part.id} className={`part-card ${selectedPart === part.id ? "is-active" : ""}`} onClick={() => setSelectedPart(part.id)} type="button"><span aria-hidden="true" className="part-icon">{imageAvailability[part.id] ? <span className="part-image-crop"><img alt="" className="part-image" onError={() => setImageAvailability((current) => ({ ...current, [part.id]: false }))} src={part.image} /></span> : part.fallbackIcon}</span><span className="part-label">{part.label}</span></button>)}
              </div>
            </section>
          </div>
          <section className="panel panel-preview">
            <div className="section-heading"><span aria-hidden="true">📷</span><h2>プレビュー</h2></div>
            <div className={`preview-stage ${previewReady ? "is-clean" : ""}`}>
              {previewReady ? <p className="preview-hint">穴を動かして位置確認。全体ドラッグで揺れ確認</p> : null}
              {previewReady ? <div className="preview-legend"><div className="preview-legend-item"><span className="preview-legend-dot" aria-hidden="true" />1つめのキーホルダーの穴</div>{isDouble ? <><div className="preview-legend-item"><span aria-hidden="true" className="preview-legend-dot is-link-point" />1つめのキーホルダーの2連用穴</div><div className="preview-legend-item"><span aria-hidden="true" className="preview-legend-dot is-secondary" />2つめのキーホルダーの穴</div></> : null}</div> : null}
              <div ref={previewRef} className={`preview-object ${previewReady ? "is-interactive" : ""}`} onPointerCancel={(event) => endPreviewDrag(event.pointerId)} onPointerDown={beginPreviewDrag} onPointerMove={movePreviewDrag} onPointerUp={(event) => endPreviewDrag(event.pointerId)}>
                <div className="preview-anchor" style={{ left: "50%", top: `${anchorTop}px` }}>
                  <div className="preview-rigid-body" ref={previewBodyRef} style={{ transform: `rotate(${(-renderedAngle * 180) / Math.PI}deg)` }}>
                    <div className="preview-hardware" style={{ width: `${hardwareWidth}px`, height: `${hardwareHeight}px`, transform: `translateX(-50%) rotate(${hardwareCounterRotation})` }}>{imageAvailability[activePart.id] ? <span className="preview-image-crop"><img alt="" className="preview-image" draggable={false} src={activePart.image} /></span> : <span className="preview-fallback">{activePart.fallbackIcon}</span>}</div>
                    <div className="acrylic-card" ref={mainCardRef} style={{ left: `${topCardLeft}px`, top: `${topCardTop}px`, width: `${topSize}px` }}>
                      <span className="hole-cutout" style={{ left: `${topHoleX}px`, top: `${topHoleY}px` }} />
                      {mainArtwork ? <button aria-label="上段の穴位置を調整" className="hole-handle" onDoubleClick={() => setHoles((current) => ({ ...current, main: resolveHole(defaultHole, contours.main, "top") }))} onPointerDown={(event) => beginHoleDrag("main", event)} style={{ left: `${topHoleX}px`, top: `${topHoleY}px` }} type="button" /> : null}
                      {mainArtwork ? <img alt="上段アートワーク" className="artwork" draggable={false} src={mainArtwork.previewUrl} /> : <div className={`artwork-placeholder is-${statuses.main}`}><div className="artwork-placeholder-badge">上</div><strong>上段画像をアップロードしてください</strong><span>{statuses.main === "error" ? errors.main : statuses.main === "loading" ? "読み込み中です..." : "アップロードすると金具とのバランスと揺れを確認できます。"}</span></div>}
                      {isDouble && mainArtwork ? <><span className="hole-cutout is-link-point" style={{ left: `${topLinkHoleX}px`, top: `${topLinkHoleY}px` }} /><button aria-label="上段の下穴位置を調整" className="hole-handle is-link-point" onDoubleClick={() => setHoles((current) => ({ ...current, "main-link": resolveHole(defaultHole, contours.main, "bottom") }))} onPointerDown={(event) => beginHoleDrag("main-link", event)} style={{ left: `${topLinkHoleX}px`, top: `${topLinkHoleY}px` }} type="button" /></> : null}
                      {isDouble ? <div className={`linked-anchor ${doubleReady ? "is-ready" : "is-pending"}`} style={{ left: `${bottomAnchorX}px`, top: `${bottomAnchorY}px` }}><span className="linked-anchor-ring" /><span className="linked-anchor-chain" style={{ height: `${linkLength}px` }} /><div className="linked-swing-group" style={{ transform: `translateY(${linkLength}px) rotate(${(-subAngle * 180) / Math.PI}deg)` }}><div className="acrylic-card linked-card" ref={subCardRef} style={{ left: `${lowerCardLeft}px`, top: `${lowerCardTop}px`, width: `${lowerSize}px` }}><span className="hole-cutout" style={{ left: `${lowerHoleX}px`, top: `${lowerHoleY}px` }} />{subArtwork ? <button aria-label="下段の穴位置を調整" className="hole-handle is-secondary" onDoubleClick={() => setHoles((current) => ({ ...current, sub: resolveHole(defaultHole, contours.sub, "top") }))} onPointerDown={(event) => beginHoleDrag("sub", event)} style={{ left: `${lowerHoleX}px`, top: `${lowerHoleY}px` }} type="button" /> : null}{subArtwork ? <img alt="下段アートワーク" className="artwork" draggable={false} src={subArtwork.previewUrl} /> : <div className="artwork-placeholder is-empty is-secondary"><div className="artwork-placeholder-badge">下</div><strong>下段画像を追加すると 2 連になります</strong><span>上下サイズのバランスと追従揺れをここで確認できます。</span></div>}</div></div></div> : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
