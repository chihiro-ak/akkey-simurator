import type { PointerEvent, RefObject } from "react";

import { HardwareStack } from "./HardwareStack";
import type { Artwork, UploadStatus } from "../simulator";

type Props = {
  artwork: Artwork | null;
  artworkSize: number;
  hardwareBottomPx: number;
  hardwareHeight: number;
  hardwareWidth: number;
  cardRef: RefObject<HTMLDivElement | null>;
  error: string | null;
  holePositionLabel: string;
  holeX: number;
  holeY: number;
  onBeginHoleDrag: (event: PointerEvent<HTMLButtonElement>) => void;
  onResetHole: () => void;
  partImage: string;
  ringSize: number;
  status: UploadStatus;
  thicknessClass: string;
};

export function EditorCanvas({
  artwork,
  artworkSize,
  hardwareBottomPx,
  hardwareHeight,
  hardwareWidth,
  cardRef,
  error,
  holePositionLabel,
  holeX,
  holeY,
  onBeginHoleDrag,
  onResetHole,
  partImage,
  ringSize,
  status,
  thicknessClass,
}: Props) {
  return (
    <section className="canvas-card">
      <div className="canvas-frame">
        {artwork ? (
          <>
            <div className="safety-zone">
              <div className="safety-zone-inner">
                <span>安全エリア</span>
              </div>
            </div>
            <div className="edit-hardware-anchor">
              <HardwareStack
                hardwareBottomPx={hardwareBottomPx}
                hardwareHeight={hardwareHeight}
                hardwareWidth={hardwareWidth}
                muted
                partImage={partImage}
                ringSize={ringSize}
                variant="editor"
              />
            </div>
            <div className={`editor-artwork ${thicknessClass}`} ref={cardRef} style={{ width: `${artworkSize}px` }}>
              <span className="hole-shadow" style={{ left: `${holeX}px`, top: `${holeY}px` }} />
              <button
                aria-label="穴位置を調整"
                className="hole-handle"
                onDoubleClick={onResetHole}
                onPointerDown={onBeginHoleDrag}
                style={{ left: `${holeX}px`, top: `${holeY}px` }}
                type="button"
              />
              <img alt="アップロード画像" className="artwork-image" draggable={false} src={artwork.previewUrl} />
            </div>
            <div className="canvas-caption">{holePositionLabel}</div>
          </>
        ) : (
          <div className={`empty-card is-${status}`}>
            <strong>画像を追加してください</strong>
            <span>{status === "error" ? error : "読み込むとここで穴位置を調整できます。"}</span>
          </div>
        )}
      </div>
    </section>
  );
}
