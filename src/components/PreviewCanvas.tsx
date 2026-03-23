import type { PointerEvent, RefObject } from "react";

import type { PartOption } from "../keychainConfig";
import type { Artwork, HoleLayout } from "../simulator";
import { HardwareStack } from "./HardwareStack";

type CardVisual = {
  artwork: Artwork | null;
  left: number;
  primaryHole: HoleLayout;
  size: number;
  top: number;
};

type Props = {
  angle: number;
  anchorTop: number;
  connected: boolean;
  hardwareBottomPx: number;
  hardwareCounterRotation: string;
  hardwareHeight: number;
  hardwareWidth: number;
  linkAnchorX: number;
  linkAnchorY: number;
  linkHole: HoleLayout;
  linkLength: number;
  lowerBaseAngle: number;
  lowerCard: CardVisual;
  lowerCenterRadius: number;
  mainCard: CardVisual;
  onEndPreviewDrag: (pointerId?: number) => void;
  onMovePreviewDrag: (event: PointerEvent<HTMLDivElement>) => void;
  onPreviewDrag: (event: PointerEvent<HTMLDivElement>) => void;
  previewReady: boolean;
  previewRef: RefObject<HTMLDivElement | null>;
  renderedPart: PartOption;
  ringSize: number;
  subSwingAngle: number;
  subTiltAngle: number;
};

export function PreviewCanvas({
  angle,
  anchorTop,
  connected,
  hardwareBottomPx,
  hardwareCounterRotation,
  hardwareHeight,
  hardwareWidth,
  linkAnchorX,
  linkAnchorY,
  linkHole,
  linkLength,
  lowerBaseAngle,
  lowerCard,
  lowerCenterRadius,
  mainCard,
  onEndPreviewDrag,
  onMovePreviewDrag,
  onPreviewDrag,
  previewReady,
  previewRef,
  renderedPart,
  ringSize,
  subSwingAngle,
  subTiltAngle,
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
        {previewReady && mainCard.artwork ? (
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
                  className="preview-artwork"
                  style={{ left: `${mainCard.left}px`, top: `${mainCard.top}px`, width: `${mainCard.size}px` }}
                >
                  <span className="acrylic-back-layer" />
                  <span className="acrylic-side-band" />
                  <span className="acrylic-side-glow" />
                  <span className="hole-shadow is-preview" style={{ left: `${mainCard.primaryHole.xPx}px`, top: `${mainCard.primaryHole.yPx}px` }} />
                  {connected ? (
                    <span className="hole-shadow is-preview is-link-point" style={{ left: `${linkHole.xPx}px`, top: `${linkHole.yPx}px` }} />
                  ) : null}
                  <img alt="プレビュー画像" className="artwork-image" draggable={false} src={mainCard.artwork.previewUrl} />
                  <span className="acrylic-front-gloss" />
                  <span className="acrylic-side-specular" />
                </div>

                {connected ? (
                  <div className="linked-anchor is-ready" style={{ left: `${linkAnchorX}px`, top: `${linkAnchorY}px` }}>
                    <span className="linked-anchor-ring" />
                    <div className="linked-swing-group" style={{ transform: `rotate(${(-subSwingAngle * 180) / Math.PI}deg)` }}>
                      <span className="linked-anchor-chain" style={{ height: `${linkLength}px` }} />
                      <div
                        className="linked-body-group"
                        style={{
                          transform: `translateY(${linkLength + lowerCenterRadius}px) rotate(${((-(lowerBaseAngle + subTiltAngle)) * 180) / Math.PI}deg)`,
                        }}
                      >
                        <div
                          className="preview-artwork linked-card"
                          style={{ left: `${lowerCard.left}px`, top: `${lowerCard.top}px`, width: `${lowerCard.size}px` }}
                        >
                          <span className="acrylic-back-layer" />
                          <span className="acrylic-side-band" />
                          <span className="acrylic-side-glow" />
                          <span className="hole-shadow is-preview is-secondary" style={{ left: `${lowerCard.primaryHole.xPx}px`, top: `${lowerCard.primaryHole.yPx}px` }} />
                          {lowerCard.artwork ? (
                            <>
                              <img alt="つながるプレビュー画像" className="artwork-image" draggable={false} src={lowerCard.artwork.previewUrl} />
                              <span className="acrylic-front-gloss" />
                              <span className="acrylic-side-specular" />
                            </>
                          ) : (
                            <div className="artwork-placeholder is-empty is-secondary">
                              <strong>もうひとつ追加すると、つながる見えになります</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </>
        ) : (
          <div className="empty-card large">
            <strong>画像をアップロードしてください</strong>
          </div>
        )}
      </div>
    </section>
  );
}
