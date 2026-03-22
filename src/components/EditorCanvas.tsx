import type { PointerEvent, RefObject } from "react";

import { HardwareStack } from "./HardwareStack";
import type { Artwork, UploadStatus } from "../simulator";

type Props = {
  anchorTop: number;
  artwork: Artwork | null;
  artworkLeft: number;
  artworkSize: number;
  artworkTop: number;
  hardwareBottomPx: number;
  hardwareHeight: number;
  hardwareWidth: number;
  cardRef: RefObject<HTMLDivElement | null>;
  error: string | null;
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
  anchorTop,
  artwork,
  artworkLeft,
  artworkSize,
  artworkTop,
  hardwareBottomPx,
  hardwareHeight,
  hardwareWidth,
  cardRef,
  error,
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
            <div className="swing-anchor" style={{ top: `${anchorTop}px` }}>
              <div className="swing-body">
                <HardwareStack
                  hardwareBottomPx={hardwareBottomPx}
                  hardwareHeight={hardwareHeight}
                  hardwareWidth={hardwareWidth}
                  partImage={partImage}
                  ringSize={ringSize}
                  variant="editor"
                />
                <div
                  className={`editor-artwork ${thicknessClass}`}
                  ref={cardRef}
                  style={{ left: `${artworkLeft}px`, top: `${artworkTop}px`, width: `${artworkSize}px` }}
                >
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
              </div>
            </div>
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
