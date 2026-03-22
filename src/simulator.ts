import type { PartId } from "./keychainConfig";

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
  topOpaquePercent: number;
  bottomOpaquePercent: number;
  topEdgeByPercent: Array<number | null>;
  bottomEdgeByPercent: Array<number | null>;
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

export const defaultHole = 50;
export const holeMin = 18;
export const holeMax = 82;

const alphaThreshold = 16;
const holeInsetPx = 10;
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

const containBounds = (width: number, height: number) => {
  const ratio = width / height;

  if (ratio >= 1) {
    const renderHeight = 100 / ratio;
    return { left: 0, top: (100 - renderHeight) / 2, width: 100, height: renderHeight };
  }

  const renderWidth = ratio * 100;
  return { left: (100 - renderWidth) / 2, top: 0, width: renderWidth, height: 100 };
};

export const isSupportedFile = (file: File) =>
  acceptedTypes.includes(file.type) || acceptedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

export const readFile = (file: File) =>
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
          opaquePixelCount += 1;
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      }

      const fallbackCenterXPercent = bounds.left + bounds.width / 2;
      const fallbackCenterYPercent = bounds.top + bounds.height / 2;

      resolve({
        centerOfMassXPercent:
          opaquePixelCount > 0
            ? bounds.left + ((opaqueWeightedX / opaquePixelCount) / Math.max(1, width - 1)) * bounds.width
            : fallbackCenterXPercent,
        centerOfMassYPercent:
          opaquePixelCount > 0
            ? bounds.top + ((opaqueWeightedY / opaquePixelCount) / Math.max(1, height - 1)) * bounds.height
            : fallbackCenterYPercent,
        firstOpaquePercent: validIndexes[0] ?? Math.round(bounds.left),
        lastOpaquePercent: validIndexes[validIndexes.length - 1] ?? Math.round(bounds.left + bounds.width),
        topOpaquePercent: bounds.top + ((top / Math.max(1, height - 1)) * bounds.height),
        bottomOpaquePercent: bounds.top + ((bottom / Math.max(1, height - 1)) * bounds.height),
        topEdgeByPercent,
        bottomEdgeByPercent,
      });
    };

    image.onerror = () => reject(new Error("画像輪郭の解析に失敗しました"));
    image.src = src;
  });

export const resolveHole = (target: number, contour: Contour | null) => {
  if (!contour) return clamp(target, holeMin, holeMax);

  const safe = clamp(target, contour.firstOpaquePercent, contour.lastOpaquePercent);
  let nearest: number | null = null;

  contour.topEdgeByPercent.forEach((value, index) => {
    if (value === null || index < contour.firstOpaquePercent || index > contour.lastOpaquePercent) return;
    if (nearest === null || Math.abs(index - safe) < Math.abs(nearest - safe)) nearest = index;
  });

  return nearest ?? clamp(safe, holeMin, holeMax);
};

const getHoleEdge = (position: number, contour: Contour | null) => {
  if (!contour) return 12;

  const index = clamp(Math.round(position), 0, 100);
  if (contour.topEdgeByPercent[index] !== null) {
    return contour.topEdgeByPercent[index] ?? 12;
  }

  for (let offset = 1; offset <= 100; offset += 1) {
    const left = index - offset;
    const right = index + offset;
    if (left >= 0 && contour.topEdgeByPercent[left] !== null) return contour.topEdgeByPercent[left] ?? 12;
    if (right <= 100 && contour.topEdgeByPercent[right] !== null) return contour.topEdgeByPercent[right] ?? 12;
  }

  return 12;
};

export const getInsetHolePercent = (position: number, contour: Contour | null, sizePx: number) => {
  const raw = getHoleEdge(position, contour);
  const insetPercent = (holeInsetPx / Math.max(sizePx, 1)) * 100;
  return clamp(raw + insetPercent, 0, 100);
};

export const getVisibleArtworkSpanPercent = (contour: Contour | null) => {
  if (!contour) return 100;
  const visibleWidth = Math.max(1, contour.lastOpaquePercent - contour.firstOpaquePercent);
  const visibleHeight = Math.max(1, contour.bottomOpaquePercent - contour.topOpaquePercent);
  return Math.max(visibleWidth, visibleHeight);
};

export const getPreviewPhysicsModel = (
  partId: PartId,
  holePosition: number,
  holeTopPercent: number,
  artworkContour: Contour | null,
  partContour: Contour | null,
  cardSize: number,
  hardwareFrameWidth: number,
  hardwareFrameHeight: number,
  hardwareBottomPx: number,
) => {
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
  const combinedMass = artworkMass + profile.hardwareMass;
  const combinedComLocalX =
    (artworkComLocalX * artworkMass + hardwareComLocalX * profile.hardwareMass) / combinedMass;
  const combinedComLocalY =
    (artworkComLocalY * artworkMass + hardwareComLocalY * profile.hardwareMass) / combinedMass;
  const cardCenterLocalX = -holeLocalX;
  const cardCenterLocalY = -(hardwareBottomLocalY + holeLocalY);
  const pivotToComLocalX = cardCenterLocalX + combinedComLocalX * 0.34;
  const pivotToComLocalY = cardCenterLocalY + combinedComLocalY * 0.34;
  const equilibriumAngle = normalizeAngle(-Math.PI / 2 - Math.atan2(pivotToComLocalY, pivotToComLocalX));
  const balanceDistance = Math.hypot(pivotToComLocalX, pivotToComLocalY);
  const inertia =
    profile.inertiaBase +
    balanceDistance * balanceDistance * 0.42 +
    (artworkContour ? 0.04 : 0.02);

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
