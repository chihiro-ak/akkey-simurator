import type { PartOption } from "../keychainConfig";
import { HardwareStack } from "./HardwareStack";
import type { Artwork } from "../simulator";

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
  onMovePreviewDrag: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPreviewDrag: (event: React.PointerEvent<HTMLDivElement>) => void;
  previewReady: boolean;
  previewRef: React.RefObject<HTMLDivElement | null>;
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

      <p className="canvas-note">編集用マーカーは出さず、金具 PNG + 丸カン PNG + 本体画像だけで完成見えを確認します。</p>

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
                <img alt="アクキー完成プレビュー" className="artwork-image" draggable={false} src={artwork.previewUrl} />
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-card large">
            <strong>まだプレビューできません</strong>
            <span>画像をアップロードすると、ここに完成見えと揺れ確認が表示されます。</span>
          </div>
        )}
      </div>

      <div className="canvas-footer">
        <p>ドラッグで揺れ方を確認</p>
        <p>丸カン位置は編集画面の穴位置を基準に反映</p>
      </div>
    </section>
  );
}
