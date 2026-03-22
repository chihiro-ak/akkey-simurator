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

export const defaultHole = 50;
export const holeMin = 18;
export const holeMax = 82;

const alphaThreshold = 16;
const holeInsetPx = 10;
const acceptedTypes = ["image/png", "image/jpeg", "image/webp"];
const acceptedExtensions = [".png", ".jpg", ".jpeg", ".webp"];

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

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
