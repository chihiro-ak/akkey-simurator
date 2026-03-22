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
      <div className="canvas-header">
        <div>
          <p className="section-label">プレビュー</p>
          <h3>完成見えと揺れ確認</h3>
        </div>
      </div>

      <p className="canvas-note">金具・丸カン・本体画像のつながりだけを見せる完成イメージです。</p>

      <div
        className="preview-stage"
        onPointerCancel={(event) => onEndPreviewDrag(event.pointerId)}
        onPointerDown={onPreviewDrag}
        onPointerMove={onMovePreviewDrag}
        onPointerUp={(event) => onEndPreviewDrag(event.pointerId)}
        ref={previewRef}
      >
        {previewReady && artwork ? (
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
                <span className="hole-shadow is-preview" style={{ left: `${holeX}px`, top: `${holeY}px` }} />
                <img alt="アクキープレビュー" className="artwork-image" draggable={false} src={artwork.previewUrl} />
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-card large">
            <strong>ここに完成イメージが出ます</strong>
            <span>画像を追加すると、穴位置を反映した金具と丸カンの見え方を確認できます。</span>
          </div>
        )}
      </div>

      <div className="canvas-footer">
        <p>ドラッグで揺れを確認</p>
        <p>穴位置をそのまま反映</p>
      </div>
    </section>
  );
}
