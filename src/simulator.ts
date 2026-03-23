import type { PartId } from "./keychainConfig";

export type Mode = "single" | "connected";
export type SlotId = "main" | "sub";
export type HoleKind = "primary" | "link";
export type HoleEdge = "top" | "bottom";
export type UploadStatus = "empty" | "loading" | "ready" | "error";

export type Artwork = {
  fileName: string;
  previewUrl: string;
  naturalWidth: number;
  naturalHeight: number;
};

export type Contour = {
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

export type UploadState = {
  error: string | null;
  status: UploadStatus;
};

export type HoleState = {
  edge: HoleEdge;
  kind: HoleKind;
  x: number;
};

export type SlotState = {
  artwork: Artwork | null;
  contour: Contour | null;
  holes: {
    link?: HoleState;
    primary: HoleState;
  };
  sizeCm: number;
  upload: UploadState;
};

export type SceneState = {
  mode: Mode;
  slots: Record<SlotId, SlotState>;
};

export type PreviewPhysicsProfile = {
  alignDamping: number;
  alignStiffness: number;
  angularDamping: number;
  combinedComTorqueScale: number;
  dragDamping: number;
  dragFollowStiffness: number;
  hardwareMass: number;
  inertiaBase: number;
  maxAngularSpeed: number;
  totalMass: number;
};

export type PreviewPhysicsModel = {
  cardCenterLocalX: number;
  cardCenterLocalY: number;
  equilibriumAngle: number;
  inertia: number;
  pivotToComLocalX: number;
  pivotToComLocalY: number;
  profile: PreviewPhysicsProfile;
};

export type LinkedAttachment = {
  comLocalX: number;
  comLocalY: number;
  mass: number;
};

export type HoleLayout = {
  xNormalized: number;
  xPercent: number;
  xPx: number;
  yPercent: number;
  yPx: number;
};

export const defaultHole = 0.5;
export const holeMin = 18;
export const holeMax = 82;
export const defaultSubCardPrompt = "別の画像を追加すると、つながり方を確認できます。";

const alphaThreshold = 16;
const holeInsetPx = 8;
const acceptedTypes = ["image/png", "image/jpeg", "image/webp"];
const acceptedExtensions = [".png", ".jpg", ".jpeg", ".webp"];

const partMotionProfiles: Record<PartId, PreviewPhysicsProfile> = {
  nasukan: {
    alignDamping: 0.72,
    alignStiffness: 4.9,
    angularDamping: 0.9993,
    combinedComTorqueScale: 0.46,
    dragDamping: 7.2,
    dragFollowStiffness: 16.5,
    hardwareMass: 0.22,
    inertiaBase: 0.32,
    maxAngularSpeed: 6.8,
    totalMass: 1.98,
  },
  "ball-chain": {
    alignDamping: 0.68,
    alignStiffness: 4.7,
    angularDamping: 0.99935,
    combinedComTorqueScale: 0.43,
    dragDamping: 6.9,
    dragFollowStiffness: 15.8,
    hardwareMass: 0.14,
    inertiaBase: 0.3,
    maxAngularSpeed: 6.9,
    totalMass: 1.66,
  },
  strap: {
    alignDamping: 0.64,
    alignStiffness: 4.5,
    angularDamping: 0.99935,
    combinedComTorqueScale: 0.42,
    dragDamping: 6.8,
    dragFollowStiffness: 15.6,
    hardwareMass: 0.12,
    inertiaBase: 0.29,
    maxAngularSpeed: 6.9,
    totalMass: 1.58,
  },
};

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export const normalizeAngle = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));
export const rotatePoint = (x: number, y: number, angle: number) => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: x * cos - y * sin, y: x * sin + y * cos };
};
export const normalizedToPercent = (value: number) => clamp(value, 0, 1) * 100;
export const percentToNormalized = (value: number) => clamp(value, 0, 100) / 100;

const containBounds = (width: number, height: number) => {
  const ratio = width / height;

  if (ratio >= 1) {
    const renderHeight = 100 / ratio;
    return { height: renderHeight, left: 0, top: (100 - renderHeight) / 2, width: 100 };
  }

  const renderWidth = ratio * 100;
  return { height: 100, left: (100 - renderWidth) / 2, top: 0, width: renderWidth };
};

export const isSupportedFile = (file: File) =>
  acceptedTypes.includes(file.type) || acceptedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

export const readFile = (file: File) =>
  new Promise<Artwork>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("画像の読み込みに失敗しました。"));
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("プレビュー画像の生成に失敗しました。"));
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
      image.onerror = () => reject(new Error("画像の解析に失敗しました。"));
      image.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });

export const analyzeContour = (src: string) =>
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
      let opaqueWeightedX = 0;
      let opaqueWeightedY = 0;
      let opaqueWeightedX2 = 0;
      let opaqueWeightedY2 = 0;
      let opaquePixelCount = 0;
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

      const validIndexes = topEdgeByPercent.flatMap((value, index) => (value === null ? [] : index));

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const alpha = data[(y * width + x) * 4 + 3];
          if (alpha <= alphaThreshold) continue;

          opaqueWeightedX += x;
          opaqueWeightedY += y;
          opaqueWeightedX2 += x * x;
          opaqueWeightedY2 += y * y;
          opaquePixelCount += 1;
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      }

      const fallbackCenterXPercent = bounds.left + bounds.width / 2;
      const fallbackCenterYPercent = bounds.top + bounds.height / 2;
      const contourCenterXPercent =
        opaquePixelCount > 0
          ? bounds.left + ((opaqueWeightedX / opaquePixelCount) / Math.max(1, width - 1)) * bounds.width
          : fallbackCenterXPercent;
      const contourCenterYPercent =
        opaquePixelCount > 0
          ? bounds.top + ((opaqueWeightedY / opaquePixelCount) / Math.max(1, height - 1)) * bounds.height
          : fallbackCenterYPercent;
      const pixelMeanX = opaquePixelCount > 0 ? opaqueWeightedX / opaquePixelCount : (width - 1) / 2;
      const pixelMeanY = opaquePixelCount > 0 ? opaqueWeightedY / opaquePixelCount : (height - 1) / 2;
      const pixelVarianceX =
        opaquePixelCount > 0
          ? Math.max(0, opaqueWeightedX2 / opaquePixelCount - pixelMeanX * pixelMeanX)
          : 0;
      const pixelVarianceY =
        opaquePixelCount > 0
          ? Math.max(0, opaqueWeightedY2 / opaquePixelCount - pixelMeanY * pixelMeanY)
          : 0;
      const percentScaleX = bounds.width / Math.max(1, width - 1);
      const percentScaleY = bounds.height / Math.max(1, height - 1);
      const meanSquaredRadiusLocal =
        ((pixelVarianceX * percentScaleX * percentScaleX) + (pixelVarianceY * percentScaleY * percentScaleY)) / 10000;
      const centerBlendRatio = 0.9;

      resolve({
        bottomOpaquePercent: bounds.top + ((bottom / Math.max(1, height - 1)) * bounds.height),
        centerOfMassXPercent:
          fallbackCenterXPercent * (1 - centerBlendRatio) + contourCenterXPercent * centerBlendRatio,
        centerOfMassYPercent:
          fallbackCenterYPercent * (1 - centerBlendRatio) + contourCenterYPercent * centerBlendRatio,
        firstOpaquePercent: validIndexes[0] ?? Math.round(bounds.left),
        lastOpaquePercent: validIndexes[validIndexes.length - 1] ?? Math.round(bounds.left + bounds.width),
        meanSquaredRadiusLocal,
        topOpaquePercent: bounds.top + ((top / Math.max(1, height - 1)) * bounds.height),
        topEdgeByPercent,
        bottomEdgeByPercent,
      });
    };

    image.onerror = () => reject(new Error("画像輪郭の解析に失敗しました。"));
    image.src = src;
  });

export const createHoleState = (kind: HoleKind, edge: HoleEdge, x = defaultHole): HoleState => ({
  edge,
  kind,
  x,
});

export const createEmptySlotState = (sizeCm: number, includeLink = false): SlotState => ({
  artwork: null,
  contour: null,
  holes: {
    ...(includeLink ? { link: createHoleState("link", "bottom") } : {}),
    primary: createHoleState("primary", "top"),
  },
  sizeCm,
  upload: { error: null, status: "empty" },
});

const getEdgeSeries = (contour: Contour | null, edge: HoleEdge) =>
  edge === "bottom" ? contour?.bottomEdgeByPercent : contour?.topEdgeByPercent;

export const resolveHole = (target: number, contour: Contour | null, edge: HoleEdge = "top") => {
  if (!contour) return clamp(target, holeMin, holeMax);

  const edgePoints = getEdgeSeries(contour, edge) ?? contour.topEdgeByPercent;
  const safe = clamp(target, contour.firstOpaquePercent, contour.lastOpaquePercent);
  let nearest: number | null = null;

  edgePoints.forEach((value, index) => {
    if (value === null || index < contour.firstOpaquePercent || index > contour.lastOpaquePercent) return;
    if (nearest === null || Math.abs(index - safe) < Math.abs(nearest - safe)) nearest = index;
  });

  return nearest ?? clamp(safe, holeMin, holeMax);
};

export const resolveHoleNormalized = (targetX: number, contour: Contour | null, edge: HoleEdge = "top") =>
  percentToNormalized(resolveHole(normalizedToPercent(targetX), contour, edge));

const getHoleEdge = (positionPercent: number, contour: Contour | null, edge: HoleEdge) => {
  if (!contour) return edge === "bottom" ? 88 : 12;

  const edgePoints = getEdgeSeries(contour, edge) ?? contour.topEdgeByPercent;
  const index = clamp(Math.round(positionPercent), 0, 100);
  if (edgePoints[index] !== null) {
    return edgePoints[index] ?? (edge === "bottom" ? 88 : 12);
  }

  for (let offset = 1; offset <= 100; offset += 1) {
    const left = index - offset;
    const right = index + offset;
    if (left >= 0 && edgePoints[left] !== null) return edgePoints[left] ?? (edge === "bottom" ? 88 : 12);
    if (right <= 100 && edgePoints[right] !== null) return edgePoints[right] ?? (edge === "bottom" ? 88 : 12);
  }

  return edge === "bottom" ? 88 : 12;
};

export const getInsetHolePercent = (
  positionPercent: number,
  contour: Contour | null,
  edge: HoleEdge,
  sizePx: number,
) => {
  const raw = getHoleEdge(positionPercent, contour, edge);
  const insetPercent = (holeInsetPx / Math.max(sizePx, 1)) * 100;
  return edge === "bottom" ? clamp(raw - insetPercent, 0, 100) : clamp(raw + insetPercent, 0, 100);
};

export const getHoleLayout = (
  xNormalized: number,
  contour: Contour | null,
  edge: HoleEdge,
  sizePx: number,
): HoleLayout => {
  const xPercent = normalizedToPercent(xNormalized);
  const yPercent = getInsetHolePercent(xPercent, contour, edge, sizePx);
  return {
    xNormalized,
    xPercent,
    xPx: (sizePx * xPercent) / 100,
    yPercent,
    yPx: (sizePx * yPercent) / 100,
  };
};

export const getVisibleArtworkSpanPercent = (contour: Contour | null) => {
  if (!contour) return 100;
  const visibleWidth = Math.max(1, contour.lastOpaquePercent - contour.firstOpaquePercent);
  const visibleHeight = Math.max(1, contour.bottomOpaquePercent - contour.topOpaquePercent);
  return Math.max(visibleWidth, visibleHeight);
};

export const getArtworkSizePx = (pixelsPerCm: number, sizeCm: number, contour: Contour | null) =>
  (pixelsPerCm * sizeCm * 100) / getVisibleArtworkSpanPercent(contour);

export const getLinkedAttachment = ({
  doubleReady,
  linkLength,
  lowerContour,
  lowerHole,
  lowerSize,
  topLinkHole,
  topPrimaryHole,
  topSize,
}: {
  doubleReady: boolean;
  linkLength: number;
  lowerContour: Contour | null;
  lowerHole: HoleLayout;
  lowerSize: number;
  topLinkHole: HoleLayout;
  topPrimaryHole: HoleLayout;
  topSize: number;
}): LinkedAttachment | undefined => {
  if (!doubleReady) return undefined;

  const lowerCardCenterLocalX = ((50 - lowerHole.xPercent) / 100) * (lowerSize / Math.max(topSize, 1));
  const lowerCardCenterLocalY = -(((50 - lowerHole.yPercent) / 100) * (lowerSize / Math.max(topSize, 1)));
  const lowerArtworkComLocalX =
    (((lowerContour?.centerOfMassXPercent ?? 50) - 50) / 100) * (lowerSize / Math.max(topSize, 1));
  const lowerArtworkComLocalY =
    ((50 - (lowerContour?.centerOfMassYPercent ?? 58)) / 100) * (lowerSize / Math.max(topSize, 1));
  const linkOffsetX = (topLinkHole.xPx - topPrimaryHole.xPx) / Math.max(topSize, 1);
  const linkOffsetY = -(topLinkHole.yPx - topPrimaryHole.yPx + linkLength) / Math.max(topSize, 1);

  return {
    comLocalX: linkOffsetX + lowerCardCenterLocalX + lowerArtworkComLocalX * 0.32,
    comLocalY: linkOffsetY + lowerCardCenterLocalY + lowerArtworkComLocalY * 0.48,
    mass: 1.26,
  };
};

export const getPreviewPhysicsModel = (
  partId: PartId,
  holePositionPercent: number,
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
  const holeLocalX = (holePositionPercent - 50) / 100;
  const holeLocalY = (50 - holeTopPercent) / 100;
  const hardwareBottomLocalY = hardwareBottomPx / Math.max(cardSize, 1);
  const artworkComLocalX = ((artworkContour?.centerOfMassXPercent ?? 50) - 50) / 100;
  const artworkComLocalY = (50 - (artworkContour?.centerOfMassYPercent ?? 58)) / 100;
  const hardwareComXPercentInCard =
    holePositionPercent +
    (((partContour?.centerOfMassXPercent ?? 50) - 50) / 100) * ((hardwareFrameWidth / Math.max(cardSize, 1)) * 100);
  const hardwareComYPx = -hardwareBottomPx + ((partContour?.centerOfMassYPercent ?? 62) / 100) * hardwareFrameHeight;
  const hardwareComYPercentInCard = (hardwareComYPx / Math.max(cardSize, 1)) * 100;
  const hardwareComLocalX = (hardwareComXPercentInCard - 50) / 100;
  const hardwareComLocalY = (50 - hardwareComYPercentInCard) / 100;
  const profile = partMotionProfiles[partId];
  const artworkMass = Math.max(profile.totalMass - profile.hardwareMass, 0.8);
  const linkedMass = linkedAttachment?.mass ?? 0;
  const combinedMass = artworkMass + profile.hardwareMass + linkedMass;
  const combinedComLocalX =
    (artworkComLocalX * artworkMass + hardwareComLocalX * profile.hardwareMass + (linkedAttachment?.comLocalX ?? 0) * linkedMass) /
    combinedMass;
  const combinedComLocalY =
    (artworkComLocalY * artworkMass + hardwareComLocalY * profile.hardwareMass + (linkedAttachment?.comLocalY ?? 0) * linkedMass) /
    combinedMass;
  const cardCenterLocalX = -holeLocalX;
  const cardCenterLocalY = -(hardwareBottomLocalY + holeLocalY);
  const pivotToComLocalX = cardCenterLocalX + combinedComLocalX * balanceBlend;
  const pivotToComLocalY = cardCenterLocalY + combinedComLocalY * balanceBlend;
  const equilibriumAngle = normalizeAngle(-Math.PI / 2 - Math.atan2(pivotToComLocalY, pivotToComLocalX));
  const balanceDistance = Math.hypot(pivotToComLocalX, pivotToComLocalY);
  const artworkSpread = artworkContour?.meanSquaredRadiusLocal ?? 0.03;
  const hardwareDistanceSquared = hardwareComLocalX * hardwareComLocalX + hardwareComLocalY * hardwareComLocalY;
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
  } satisfies PreviewPhysicsModel;
};
