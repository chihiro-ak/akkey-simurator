import type { PointerEvent, RefObject } from "react";

import type { PartOption } from "../keychainConfig";
import type { Artwork, HoleLayout } from "../simulator";
import { HardwareStack } from "./HardwareStack";
import { PreviewJumpRing } from "./PreviewJumpRing";

type CardVisual = {
  artwork: Artwork | null;
  cardRef: RefObject<HTMLDivElement | null>;
  left: number;
  primaryHole: HoleLayout;
  size: number;
  top: number;
};

type Props = {
  angle: number;
  allowLinkAdjust?: boolean;
  anchorTop: number;
  connected: boolean;
  hardwareBottomPx: number;
  hardwareCounterRotation: string;
  hardwareHeight: number;
  hardwareWidth: number;
  linkAnchorX: number;
  linkAnchorY: number;
  linkLength: number;
  lowerBaseAngle: number;
  lowerCard: CardVisual;
  lowerCenterRadius: number;
  mainCard: CardVisual;
  onBeginLinkDrag: (event: PointerEvent<HTMLElement>) => void;
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
  allowLinkAdjust = true,
  anchorTop,
  connected,
  hardwareBottomPx,
  hardwareCounterRotation,
  hardwareHeight,
  hardwareWidth,
  linkAnchorX,
  linkAnchorY,
  linkLength,
  lowerBaseAngle,
  lowerCard,
  lowerCenterRadius,
  mainCard,
  onBeginLinkDrag,
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
                  ref={mainCard.cardRef}
                  style={{ left: `${mainCard.left}px`, top: `${mainCard.top}px`, width: `${mainCard.size}px` }}
                >
                  <span className="acrylic-back-layer" />
                  <span className="acrylic-side-band" />
                  <span className="acrylic-side-glow" />
                  <span className="preview-attachment-point" style={{ left: `${mainCard.primaryHole.xPx}px`, top: `${mainCard.primaryHole.yPx}px` }}>
                    <PreviewJumpRing className="is-main-anchor" size={12} topConnectorHeight={7} withCaps />
                  </span>
                  <img alt="プレビュー画像" className="artwork-image" draggable={false} src={mainCard.artwork.previewUrl} />
                  <span className="acrylic-front-gloss" />
                  <span className="acrylic-side-specular" />
                </div>

                {connected ? (
                  <div className="linked-anchor is-ready" style={{ left: `${linkAnchorX}px`, top: `${linkAnchorY}px` }}>
                    {allowLinkAdjust ? (
                      <button aria-label="連結位置を調整" className="preview-middle-link-bar" onPointerDown={onBeginLinkDrag} type="button">
                        <span className="preview-middle-link-core" />
                      </button>
                    ) : (
                      <span aria-hidden="true" className="preview-middle-link-core" />
                    )}
                    <div className="linked-swing-group" style={{ transform: `rotate(${(-subSwingAngle * 180) / Math.PI}deg)` }}>
                      <span className="linked-anchor-chain is-preview-hardware" style={{ height: `${linkLength}px` }} />
                      <div
                        className="linked-body-group"
                        style={{
                          transform: `translateY(${linkLength + lowerCenterRadius}px) rotate(${((-(lowerBaseAngle + subTiltAngle)) * 180) / Math.PI}deg)`,
                        }}
                      >
                        <div
                          className="preview-artwork linked-card"
                          ref={lowerCard.cardRef}
                          style={{ left: `${lowerCard.left}px`, top: `${lowerCard.top}px`, width: `${lowerCard.size}px` }}
                        >
                          <span className="acrylic-back-layer" />
                          <span className="acrylic-side-band" />
                          <span className="acrylic-side-glow" />
                          <span className="preview-attachment-point" style={{ left: `${lowerCard.primaryHole.xPx}px`, top: `${lowerCard.primaryHole.yPx}px` }}>
                            <PreviewJumpRing className="is-sub-anchor" size={12} />
                          </span>
                          {lowerCard.artwork ? (
                            <>
                              <img alt="つながるプレビュー画像" className="artwork-image" draggable={false} src={lowerCard.artwork.previewUrl} />
                              <span className="acrylic-front-gloss" />
                              <span className="acrylic-side-specular" />
                            </>
                          ) : (
                            <div className="artwork-placeholder is-empty is-secondary">
                              <strong>画像をアップロードしてください</strong>
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
