import type { PointerEvent, RefObject } from "react";

import type { PartOption } from "../keychainConfig";
import type { Artwork } from "../simulator";
import { HardwareStack } from "./HardwareStack";

type Props = {
  angle: number;
  anchorTop: number;
  artwork: Artwork | null;
  artworkLeft: number;
  artworkSize: number;
  artworkTop: number;
  hardwareBottomPx: number;
  hardwareCounterRotation: string;
  hardwareHeight: number;
  hardwareWidth: number;
  holeX: number;
  holeY: number;
  onEndPreviewDrag: (pointerId?: number) => void;
  onMovePreviewDrag: (event: PointerEvent<HTMLDivElement>) => void;
  onPreviewDrag: (event: PointerEvent<HTMLDivElement>) => void;
  previewReady: boolean;
  previewRef: RefObject<HTMLDivElement | null>;
  renderedPart: PartOption;
  ringSize: number;
  thicknessClass: string;
};

export function PreviewCanvas({
  angle,
  anchorTop,
  artwork,
  artworkLeft,
  artworkSize,
  artworkTop,
  hardwareBottomPx,
  hardwareCounterRotation,
  hardwareHeight,
  hardwareWidth,
  holeX,
  holeY,
  onEndPreviewDrag,
  onMovePreviewDrag,
  onPreviewDrag,
  previewReady,
  previewRef,
  renderedPart,
  ringSize,
  thicknessClass,
}: Props) {
  return (
    <section className="canvas-card">
      <div
        className="canvas-frame is-preview"
        onPointerCancel={(event) => onEndPreviewDrag(event.pointerId)}
        onPointerDown={onPreviewDrag}
        onPointerMove={onMovePreviewDrag}
        onPointerUp={(event) => onEndPreviewDrag(event.pointerId)}
        ref={previewRef}
      >
        {previewReady && artwork ? (
          <>
            <div className="preview-drag-hint">ドラッグして揺れを確認</div>
            <div className="swing-anchor" style={{ top: `${anchorTop}px` }}>
              <div className="swing-body" style={{ transform: `rotate(${(-angle * 180) / Math.PI}deg)` }}>
                <HardwareStack
                  counterRotation={hardwareCounterRotation}
                  hardwareBottomPx={hardwareBottomPx}
                  hardwareHeight={hardwareHeight}
                  hardwareWidth={hardwareWidth}
                  partImage={renderedPart.image}
                  ringSize={ringSize}
                  variant="preview"
                />
                <div
                  className={`preview-artwork ${thicknessClass}`}
                  style={{ left: `${artworkLeft}px`, top: `${artworkTop}px`, width: `${artworkSize}px` }}
                >
                  <span className="acrylic-back-layer" />
                  <span className="acrylic-side-band" />
                  <span className="acrylic-side-glow" />
                  <span className="hole-shadow is-preview" style={{ left: `${holeX}px`, top: `${holeY}px` }} />
                  <img alt="アクキープレビュー" className="artwork-image" draggable={false} src={artwork.previewUrl} />
                  <span className="acrylic-front-gloss" />
                  <span className="acrylic-side-specular" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-card large">
            <strong>ここにプレビューが表示されます</strong>
            <span>画像を追加すると、金具と丸カンを重ねた完成見えを確認できます。</span>
          </div>
        )}
      </div>
    </section>
  );
}
