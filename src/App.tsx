import { useEffect, useMemo, useRef, useState } from "react";

import ballChainImage from "./assets/parts/ball-chain.png";
import nasukanImage from "./assets/parts/nasukan.png";
import strapImage from "./assets/parts/strap.png";

type PartId = "nasukan" | "ball-chain" | "strap";
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
  centerOfMassXPercent: number;
  centerOfMassYPercent: number;
  firstOpaquePercent: number;
  lastOpaquePercent: number;
  meanSquaredRadiusLocal: number;
  topOpaquePercent: number;
  bottomOpaquePercent: number;
  topEdgeByPercent: Array<number | null>;
};

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
  combinedComLocalX: number;
  combinedComLocalY: number;
  cardCenterLocalX: number;
  cardCenterLocalY: number;
  equilibriumAngle: number;
  inertia: number;
  pivotToComLocalX: number;
  pivotToComLocalY: number;
  profile: PreviewPhysicsProfile;
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
const holeDragSensitivity = 0.42;
const previewAngleLimit = Math.PI * 0.58;
const previewDragVelocityLimit = 4.8;

const partMotionProfiles: Record<
  PartId,
  PreviewPhysicsProfile
> = {
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

const isSupportedImageFile = (file: File) => {
  const lowerName = file.name.toLowerCase();
  return (
    acceptedTypes.includes(file.type) ||
    acceptedExtensions.some((extension) => lowerName.endsWith(extension))
  );
};

const clampPercent = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const clampValue = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const normalizeAngle = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));

const rotatePoint = (x: number, y: number, angle: number) => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
};

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
      let alphaWeightedX = 0;
      let alphaWeightedY = 0;
      let alphaWeightedX2 = 0;
      let alphaWeightedY2 = 0;
      let totalAlpha = 0;
      let topOpaqueRow = canvasHeight - 1;
      let bottomOpaqueRow = 0;
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

      for (let y = 0; y < canvasHeight; y += 1) {
        for (let x = 0; x < canvasWidth; x += 1) {
          const alpha = data[(y * canvasWidth + x) * 4 + 3];
          if (alpha <= contourAlphaThreshold) {
            continue;
          }

          alphaWeightedX += x * alpha;
          alphaWeightedY += y * alpha;
          alphaWeightedX2 += x * x * alpha;
          alphaWeightedY2 += y * y * alpha;
          totalAlpha += alpha;
          topOpaqueRow = Math.min(topOpaqueRow, y);
          bottomOpaqueRow = Math.max(bottomOpaqueRow, y);
        }
      }

      const fallbackCenterXPercent = bounds.leftPercent + bounds.widthPercent / 2;
      const fallbackCenterYPercent = bounds.topPercent + bounds.heightPercent / 2;
      const alphaCenterXPercent =
        totalAlpha > 0
          ? bounds.leftPercent +
            ((alphaWeightedX / totalAlpha) / Math.max(1, canvasWidth - 1)) * bounds.widthPercent
          : fallbackCenterXPercent;
      const alphaCenterYPercent =
        totalAlpha > 0
          ? bounds.topPercent +
            ((alphaWeightedY / totalAlpha) / Math.max(1, canvasHeight - 1)) * bounds.heightPercent
          : fallbackCenterYPercent;
      const pixelMeanX = totalAlpha > 0 ? alphaWeightedX / totalAlpha : (canvasWidth - 1) / 2;
      const pixelMeanY = totalAlpha > 0 ? alphaWeightedY / totalAlpha : (canvasHeight - 1) / 2;
      const pixelVarianceX =
        totalAlpha > 0
          ? Math.max(0, alphaWeightedX2 / totalAlpha - pixelMeanX * pixelMeanX)
          : 0;
      const pixelVarianceY =
        totalAlpha > 0
          ? Math.max(0, alphaWeightedY2 / totalAlpha - pixelMeanY * pixelMeanY)
          : 0;
      const percentScaleX = bounds.widthPercent / Math.max(1, canvasWidth - 1);
      const percentScaleY = bounds.heightPercent / Math.max(1, canvasHeight - 1);
      const meanSquaredRadiusLocal =
        ((pixelVarianceX * percentScaleX * percentScaleX) +
          (pixelVarianceY * percentScaleY * percentScaleY)) /
        10000;
      const centerBlendRatio = 0.9;
      const centerOfMassXPercent =
        fallbackCenterXPercent * (1 - centerBlendRatio) + alphaCenterXPercent * centerBlendRatio;
      const centerOfMassYPercent =
        fallbackCenterYPercent * (1 - centerBlendRatio) + alphaCenterYPercent * centerBlendRatio;
      const topOpaquePercent =
        totalAlpha > 0
          ? bounds.topPercent + (topOpaqueRow / Math.max(1, canvasHeight - 1)) * bounds.heightPercent
          : bounds.topPercent;
      const bottomOpaquePercent =
        totalAlpha > 0
          ? bounds.topPercent +
            (bottomOpaqueRow / Math.max(1, canvasHeight - 1)) * bounds.heightPercent
          : bounds.topPercent + bounds.heightPercent;

      if (validPercents.length === 0) {
        const firstOpaquePercent = Math.round(bounds.leftPercent);
        const lastOpaquePercent = Math.round(bounds.leftPercent + bounds.widthPercent);
        resolve({
          bottomOpaquePercent,
          centerOfMassXPercent,
          centerOfMassYPercent,
          firstOpaquePercent,
          lastOpaquePercent,
          meanSquaredRadiusLocal,
          topOpaquePercent,
          topEdgeByPercent: Array.from({ length: 101 }, (_, percent) =>
            percent >= firstOpaquePercent && percent <= lastOpaquePercent ? bounds.topPercent : null,
          ),
        });
        return;
      }

      resolve({
        bottomOpaquePercent,
        centerOfMassXPercent,
        centerOfMassYPercent,
        firstOpaquePercent: validPercents[0],
        lastOpaquePercent: validPercents[validPercents.length - 1],
        meanSquaredRadiusLocal,
        topOpaquePercent,
        topEdgeByPercent,
      });
    };

    image.onerror = () => {
      reject(new Error("Failed to analyze uploaded artwork"));
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

const getPreviewPhysicsModel = (
  partId: PartId,
  holePosition: number,
  holeTopPercent: number,
  artworkContour: ArtworkContour | null,
  partContour: ArtworkContour | null,
  cardSize: number,
  hardwareFrameWidth: number,
  hardwareFrameHeight: number,
  hardwareBottomPx: number,
) => {
  const balanceBlend = 0.22;
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
  const pivotToCardCenterLocalX = cardCenterLocalX;
  const pivotToCardCenterLocalY = cardCenterLocalY;
  const pivotToComLocalX = pivotToCardCenterLocalX + artworkComLocalX * balanceBlend;
  const pivotToComLocalY = pivotToCardCenterLocalY + artworkComLocalY * balanceBlend;
  const equilibriumAngle = normalizeAngle(
    -Math.PI / 2 - Math.atan2(pivotToComLocalY, pivotToComLocalX),
  );
  const balanceDistance = Math.hypot(pivotToComLocalX, pivotToComLocalY);
  const artworkSpread = artworkContour?.meanSquaredRadiusLocal ?? 0.03;
  const hardwareDistanceSquared = hardwareComLocalX * hardwareComLocalX + hardwareComLocalY * hardwareComLocalY;
  const inertia =
    profile.inertiaBase +
    artworkSpread * 2.4 +
    balanceDistance * balanceDistance * 0.42 +
    hardwareDistanceSquared * profile.hardwareMass * 0.16;

  return {
    combinedComLocalX,
    combinedComLocalY,
    cardCenterLocalX,
    cardCenterLocalY,
    equilibriumAngle,
    inertia,
    pivotToComLocalX,
    pivotToComLocalY,
    profile,
  };
};

function App() {
  const [selectedPart, setSelectedPart] = useState<PartId>("nasukan");
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("empty");
  const [uploadedArtwork, setUploadedArtwork] = useState<UploadedArtwork | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageAvailability, setImageAvailability] = useState(initialImageAvailability);
  const [holePosition, setHolePosition] = useState(defaultHolePosition);
  const [artworkContour, setArtworkContour] = useState<ArtworkContour | null>(null);
  const [partContour, setPartContour] = useState<ArtworkContour | null>(null);
  const [partBottomOpaquePercent, setPartBottomOpaquePercent] = useState(100);
  const [isDraggingHole, setIsDraggingHole] = useState(false);
  const [previewAngle, setPreviewAngle] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window === "undefined" ? 1024 : window.innerWidth,
  );

  const cardRef = useRef<HTMLDivElement | null>(null);
  const previewBodyRef = useRef<HTMLDivElement | null>(null);
  const previewInteractionRef = useRef<HTMLDivElement | null>(null);
  const holeDragRef = useRef({
    cardWidth: 1,
    startClientX: 0,
    startHolePosition: defaultHolePosition,
  });
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

  const activePart = useMemo(
    () => parts.find((part) => part.id === selectedPart) ?? parts[0],
    [selectedPart],
  );
  const hasUploadedArtwork = uploadedArtwork !== null;
  const isPreviewReady = hasUploadedArtwork && uploadStatus !== "loading";
  const isPartImageAvailable = imageAvailability[activePart.id];
  const uploadCtaTitle = "タップして画像を選ぶ";
  const holeTopPercent = getHoleTopPercent(holePosition, artworkContour);
  const previewHardwareFrameHeight =
    viewportWidth >= 1200 ? 128 : viewportWidth >= 768 ? 116 : viewportWidth <= 420 ? 84 : 96;
  const previewHardwareFrameWidth =
    viewportWidth >= 1200
      ? Math.min(viewportWidth * 0.16, 240)
      : viewportWidth >= 768
        ? Math.min(viewportWidth * 0.24, 220)
        : viewportWidth <= 420
          ? Math.min(viewportWidth * 0.52, 156)
          : Math.min(viewportWidth * 0.48, 190);
  const previewCardSize =
    viewportWidth >= 1200
      ? clampValue(viewportWidth * 0.36, 380, 560)
      : viewportWidth >= 768
        ? Math.min(viewportWidth * 0.34, 320)
        : Math.min(Math.max(viewportWidth - 112, 188), 220);
  const previewHardwareBottomPx = (previewHardwareFrameHeight * partBottomOpaquePercent) / 100;
  const previewAnchorTopPx =
    viewportWidth >= 1200 ? 82 : viewportWidth >= 768 ? 72 : viewportWidth <= 420 ? 52 : 60;
  const previewPhysicsModel = useMemo(
    () =>
      getPreviewPhysicsModel(
        activePart.id,
        holePosition,
        holeTopPercent,
        artworkContour,
        partContour,
        previewCardSize,
        previewHardwareFrameWidth,
        previewHardwareFrameHeight,
        previewHardwareBottomPx,
      ),
    [
      activePart.id,
      artworkContour,
      holePosition,
      holeTopPercent,
      partContour,
      previewCardSize,
      previewHardwareBottomPx,
      previewHardwareFrameHeight,
      previewHardwareFrameWidth,
    ],
  );
  const renderedAngle = isDraggingHole ? 0 : previewAngle;
  const previewRotation = `${(-renderedAngle * 180) / Math.PI}deg`;
  const holeOffsetRatio = Math.min(1, Math.abs(holePosition - 50) / Math.max(holePositionMax - 50, 1));
  const hardwareUprightFactor = 0.34 + holeOffsetRatio * 0.44;
  const hardwareCounterRotation = `${((renderedAngle * 180) / Math.PI) * hardwareUprightFactor}deg`;
  const holeRenderX = ((holePosition - 50) / 100) * previewCardSize;
  const holeRenderY = ((holeTopPercent - 50) / 100) * previewCardSize;
  const cardLeftPx =
    previewPhysicsModel.cardCenterLocalX * previewCardSize - previewCardSize / 2;
  const cardTopPx =
    -previewPhysicsModel.cardCenterLocalY * previewCardSize - previewCardSize / 2;
  const previewHitAreaLeft = Math.min(cardLeftPx, -previewHardwareFrameWidth / 2) - 24;
  const previewHitAreaTop = Math.min(cardTopPx, 0) - 24;
  const previewHitAreaRight = Math.max(
    cardLeftPx + previewCardSize,
    previewHardwareFrameWidth / 2,
  ) + 24;
  const previewHitAreaBottom = Math.max(cardTopPx + previewCardSize, previewHardwareFrameHeight) + 24;
  const holeInCardX = previewCardSize / 2 + holeRenderX;
  const holeInCardY = previewCardSize / 2 + holeRenderY;
  const artworkBoundsCenterX = artworkContour
    ? (artworkContour.firstOpaquePercent + artworkContour.lastOpaquePercent) / 2
    : 50;
  const artworkBoundsCenterY = artworkContour
    ? (artworkContour.topOpaquePercent + artworkContour.bottomOpaquePercent) / 2
    : 50;
  const uploadBadgeImageTransform = artworkContour
    ? `translate(${(50 - artworkBoundsCenterX) * 2.1}%, ${(50 - artworkBoundsCenterY) * 4}%)`
    : undefined;

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (isPreviewReady) {
      return;
    }

    const motion = previewMotionRef.current;
    motion.angle = 0;
    motion.angularVelocity = 0;
    motion.desiredAngle = 0;
    motion.lastDragAngle = 0;
    motion.lastDragTimestamp = 0;
    motion.isDragging = false;
    motion.lastTimestamp = null;
    motion.pointerId = null;
    setPreviewAngle(0);
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
      setPartContour(null);
      setPartBottomOpaquePercent(100);
      return;
    }

    let ignore = false;
    analyzeArtworkContour(activePart.image)
      .then((contour) => {
        if (ignore) return;
        setPartContour(contour);
        setPartBottomOpaquePercent(contour.bottomOpaquePercent);
      })
      .catch(() => {
        if (ignore) return;
        setPartContour(null);
        setPartBottomOpaquePercent(100);
      });

    return () => {
      ignore = true;
    };
  }, [activePart.image, isPartImageAvailable]);

  useEffect(() => {
    if (!isDraggingHole) return;

    const handlePointerMove = (event: PointerEvent) => {
      const drag = holeDragRef.current;
      const deltaPercent =
        ((event.clientX - drag.startClientX) / Math.max(drag.cardWidth, 1)) *
        100 *
        holeDragSensitivity;
      setHolePosition(resolveHolePosition(drag.startHolePosition - deltaPercent, artworkContour));
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

  useEffect(() => {
    if (!isPreviewReady) {
      return;
    }

    const motion = previewMotionRef.current;
    motion.lastTimestamp = null;

    let animationFrame = 0;

    const tick = (timestamp: number) => {
      const elapsed =
        motion.lastTimestamp === null
          ? 1 / 60
          : clampValue((timestamp - motion.lastTimestamp) / 1000, 1 / 240, 1 / 24);
      const fixedStep = 1 / 120;
      const subSteps = Math.max(1, Math.ceil(elapsed / fixedStep));
      const stepDt = elapsed / subSteps;

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
        motion.angularVelocity = clampValue(
          motion.angularVelocity,
          -profile.maxAngularSpeed,
          profile.maxAngularSpeed,
        );
        motion.angularVelocity *= profile.angularDamping;
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

      setPreviewAngle(motion.angle);
      motion.lastTimestamp = timestamp;
      animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [isPreviewReady, previewPhysicsModel]);

  useEffect(() => {
    if (!isPreviewReady || isDraggingHole) {
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
  }, [
    isDraggingHole,
    isPreviewReady,
    previewPhysicsModel.equilibriumAngle,
  ]);

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
    event.stopPropagation();

    finishPreviewInteraction();

    const card = cardRef.current;
    if (card) {
      const rect = card.getBoundingClientRect();
      const ratio = ((event.clientX - rect.left) / rect.width) * 100;
      holeDragRef.current = {
        cardWidth: rect.width,
        startClientX: event.clientX,
        startHolePosition: resolveHolePosition(ratio, artworkContour),
      };
      setHolePosition(resolveHolePosition(ratio, artworkContour));
    }

    setIsDraggingHole(true);
  };

  const handleHoleReset = () => {
    setHolePosition(resolveHolePosition(defaultHolePosition, artworkContour));
  };

  const getPreviewAnchor = () => {
    const interaction = previewInteractionRef.current;
    if (!interaction) {
      return null;
    }

    const rect = interaction.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + previewAnchorTopPx,
    };
  };

  const getPointerWorldPosition = (clientX: number, clientY: number) => {
    const anchor = getPreviewAnchor();
    if (!anchor) {
      return null;
    }

    return {
      x: (clientX - anchor.x) / Math.max(previewCardSize, 1),
      y: (anchor.y - clientY) / Math.max(previewCardSize, 1),
    };
  };

  const getDragTargetAngle = (pointerWorldX: number) =>
    clampValue(Math.atan(pointerWorldX * 1.7) * 0.98, -previewAngleLimit, previewAngleLimit);

  const handlePreviewPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPreviewReady || isDraggingHole) {
      return;
    }

    event.preventDefault();

    const motion = previewMotionRef.current;
    const pointerWorld = getPointerWorldPosition(event.clientX, event.clientY);
    if (!pointerWorld) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);

    motion.isDragging = true;
    motion.pointerId = event.pointerId;
    motion.lastDragAngle = getDragTargetAngle(pointerWorld.x);
    motion.lastDragTimestamp = performance.now();
    motion.desiredAngle = motion.lastDragAngle;
    motion.lastTimestamp = motion.lastDragTimestamp;
  };

  const handlePreviewPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const motion = previewMotionRef.current;
    if (!motion.isDragging || motion.pointerId !== event.pointerId) {
      return;
    }

    const nextTarget = getPointerWorldPosition(event.clientX, event.clientY);
    if (!nextTarget) {
      return;
    }

    const nextAngle = getDragTargetAngle(nextTarget.x);
    const now = performance.now();
    const dt = Math.max(now - motion.lastDragTimestamp, 8) / 1000;
    const angleDelta = normalizeAngle(nextAngle - motion.lastDragAngle);
    motion.angularVelocity += clampValue(
      (angleDelta / dt) * 0.2,
      -previewDragVelocityLimit,
      previewDragVelocityLimit,
    );
    motion.lastDragAngle = nextAngle;
    motion.lastDragTimestamp = now;
    motion.desiredAngle = nextAngle;
  };

  function finishPreviewInteraction(pointerId?: number) {
    const motion = previewMotionRef.current;
    if (pointerId !== undefined && motion.pointerId !== pointerId) {
      return;
    }

    if (previewBodyRef.current && pointerId !== undefined) {
      try {
        previewBodyRef.current.releasePointerCapture(pointerId);
      } catch {
        // Ignore when capture is already released.
      }
    }

    motion.isDragging = false;
    motion.pointerId = null;
    motion.angularVelocity = clampValue(motion.angularVelocity * 1.6, -5.6, 5.6);
    motion.lastTimestamp = performance.now();
    motion.lastDragTimestamp = 0;
    motion.desiredAngle = previewPhysicsModel.equilibriumAngle;
  }

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

              <label className={`upload-dropzone ${uploadedArtwork ? "is-filled" : ""}`}>
                <input
                  accept="image/png,image/jpeg,image/webp"
                  aria-label="画像を選択"
                  className="sr-only"
                  onChange={handleFileChange}
                  type="file"
                />
                <div className="upload-badge" aria-hidden="true">
                  {uploadedArtwork ? (
                    <img
                      alt=""
                      className="upload-badge-image"
                      src={uploadedArtwork.previewUrl}
                      style={uploadBadgeImageTransform ? { transform: uploadBadgeImageTransform } : undefined}
                    />
                  ) : (
                    "🖼️"
                  )}
                </div>
                {!uploadedArtwork ? <strong>{uploadCtaTitle}</strong> : null}
              </label>

              {uploadStatus === "loading" || uploadStatus === "error" ? (
                <div className={`upload-status-card is-${uploadStatus}`} aria-live="polite">
                  {uploadStatus === "loading" ? (
                    <strong>プレビューを作成中です</strong>
                  ) : null}
                  {uploadStatus === "error" ? (
                    <>
                      <strong>画像を読み込めませんでした</strong>
                      <span>{uploadError}</span>
                    </>
                  ) : null}
                </div>
              ) : null}
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

            <div className={`preview-stage ${isPreviewReady ? "is-clean" : ""}`}>
              {isPreviewReady ? (
                <p className="preview-hint">穴ハンドルで位置調整、作品をドラッグして揺れを確認</p>
              ) : null}
              <div
                ref={previewInteractionRef}
                className={`preview-object ${isPreviewReady ? "is-interactive" : ""}`}
                onPointerCancel={(event) => finishPreviewInteraction(event.pointerId)}
                onPointerMove={handlePreviewPointerMove}
                onPointerUp={(event) => finishPreviewInteraction(event.pointerId)}
              >
                <div className="preview-anchor" style={{ left: "50%", top: `${previewAnchorTopPx}px` }}>
                  <div className="preview-swing-group">
                    <div
                      ref={previewBodyRef}
                      className="preview-rigid-body"
                      style={{
                        transform: `rotate(${previewRotation})`,
                      }}
                    >
                      <div
                        className="preview-hit-area"
                        onPointerDown={handlePreviewPointerDown}
                        style={{
                          left: `${previewHitAreaLeft}px`,
                          top: `${previewHitAreaTop}px`,
                          width: `${previewHitAreaRight - previewHitAreaLeft}px`,
                          height: `${previewHitAreaBottom - previewHitAreaTop}px`,
                        }}
                      />
                      <div
                        className="preview-hardware"
                        aria-hidden="true"
                        style={{
                          left: "0px",
                          top: "0px",
                          transform: `translateX(-50%) rotate(${hardwareCounterRotation})`,
                          transformOrigin: "50% 100%",
                        }}
                      >
                        {isPartImageAvailable ? (
                          <span className="preview-image-crop">
                            <img
                              alt=""
                              className="preview-image"
                              draggable={false}
                              onError={() => handlePartImageError(activePart.id)}
                              src={activePart.image}
                            />
                          </span>
                        ) : (
                          <span className="preview-fallback">{activePart.fallbackIcon}</span>
                        )}
                      </div>

                      <div
                        className="acrylic-card"
                        ref={cardRef}
                        style={{
                          left: `${cardLeftPx}px`,
                          top: `${cardTopPx}px`,
                          width: `${previewCardSize}px`,
                        }}
                      >
                        <span
                          className="hole-cutout"
                          style={{
                            left: `${holeInCardX}px`,
                            top: `${holeInCardY}px`,
                          }}
                        />

                        {uploadedArtwork ? (
                          <button
                            aria-label="穴位置を調整"
                            className="hole-handle"
                            onDoubleClick={handleHoleReset}
                            onPointerDown={handleHolePointerDown}
                            style={{
                              left: `${holeInCardX}px`,
                              top: `${holeInCardY}px`,
                            }}
                            type="button"
                          />
                        ) : null}

                        {uploadedArtwork ? (
                          <img
                            alt="アクキーの完成イメージ"
                            className="artwork"
                            draggable={false}
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
                                ? "読み込み中です.."
                                : uploadStatus === "error"
                                  ? uploadError
                                  : ""}
                            </span>
                          </div>
                        )}
                      </div>

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

export default App;
