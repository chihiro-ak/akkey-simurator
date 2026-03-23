import type { PointerEvent, RefObject } from "react";

import { HardwareStack } from "./HardwareStack";
import type { Artwork, HoleLayout, SlotId, UploadStatus } from "../simulator";

type CardVisual = {
  artwork: Artwork | null;
  cardRef: RefObject<HTMLDivElement | null>;
  error: string | null;
  isActive: boolean;
  left: number;
  primaryHole: HoleLayout;
  size: number;
  status: UploadStatus;
  top: number;
};

type Props = {
  activeSlot: SlotId;
  anchorTop: number;
  connected: boolean;
  hardwareBottomPx: number;
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
  onActivateSlot: (slot: SlotId) => void;
  onBeginArtworkDrag: (slot: SlotId, event: PointerEvent<HTMLElement>) => void;
  onBeginHoleDrag: (slot: SlotId, hole: "primary" | "link", event: PointerEvent<HTMLButtonElement>) => void;
  partImage: string;
  ringSize: number;
};

function renderPlaceholder(status: UploadStatus, error: string | null, message: string) {
  return (
    <div className={`artwork-placeholder is-${status}`}>
      <strong>{message}</strong>
      <span>{status === "error" ? error : status === "loading" ? "画像を読み込み中です" : "画像を追加すると位置を調整できます。"}</span>
    </div>
  );
}

export function EditorCanvas({
  activeSlot,
  anchorTop,
  connected,
  hardwareBottomPx,
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
  onActivateSlot,
  onBeginArtworkDrag,
  onBeginHoleDrag,
  partImage,
  ringSize,
}: Props) {
  const mainPrimaryActive = activeSlot === "main";
  const mainLinkActive = activeSlot === "main";
  const lowerPrimaryActive = activeSlot === "sub";

  return (
    <section className="canvas-card">
      <div className="canvas-frame">
        {mainCard.artwork ? (
          <>
            <div className="canvas-caption">編集したい画像を選んで、穴位置を調整できます</div>
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
                  className={`editor-artwork editor-card ${mainCard.isActive ? "is-active" : "is-muted"}`}
                  onClick={() => onActivateSlot("main")}
                  onPointerDown={(event) => {
                    onActivateSlot("main");
                    if (mainPrimaryActive) onBeginArtworkDrag("main", event);
                  }}
                  ref={mainCard.cardRef}
                  style={{ left: `${mainCard.left}px`, top: `${mainCard.top}px`, width: `${mainCard.size}px` }}
                >
                  <span className="hole-shadow" style={{ left: `${mainCard.primaryHole.xPx}px`, top: `${mainCard.primaryHole.yPx}px` }} />
                  <button
                    aria-label="穴位置を調整"
                    className={`hole-handle ${mainPrimaryActive ? "is-active" : "is-muted"}`}
                    onPointerDown={(event) => onBeginHoleDrag("main", "primary", event)}
                    style={{ left: `${mainCard.primaryHole.xPx}px`, top: `${mainCard.primaryHole.yPx}px` }}
                    type="button"
                  />
                  {connected ? (
                    <>
                      <span className="hole-shadow is-link-point" style={{ left: `${linkHole.xPx}px`, top: `${linkHole.yPx}px` }} />
                      <button
                        aria-label="つなぎ位置を調整"
                        className={`hole-handle is-link-point ${mainLinkActive ? "is-active" : "is-muted"}`}
                        onPointerDown={(event) => onBeginHoleDrag("main", "link", event)}
                        style={{ left: `${linkHole.xPx}px`, top: `${linkHole.yPx}px` }}
                        type="button"
                      />
                    </>
                  ) : null}
                  <img alt="アップロード画像" className="artwork-image" draggable={false} src={mainCard.artwork.previewUrl} />
                </div>

                {connected ? (
                  <div className="linked-anchor is-ready" style={{ left: `${linkAnchorX}px`, top: `${linkAnchorY}px` }}>
                    <span className="linked-anchor-ring" />
                    <div className="linked-swing-group">
                      <span className="linked-anchor-chain" style={{ height: `${linkLength}px` }} />
                      <div
                        className="linked-body-group"
                        style={{ transform: `translateY(${linkLength + lowerCenterRadius}px) rotate(${(-lowerBaseAngle * 180) / Math.PI}deg)` }}
                      >
                        <div
                          className={`editor-artwork editor-card linked-card ${lowerCard.isActive ? "is-active" : "is-muted"}`}
                          onClick={() => onActivateSlot("sub")}
                          onPointerDown={(event) => {
                            onActivateSlot("sub");
                            if (lowerPrimaryActive) onBeginArtworkDrag("sub", event);
                          }}
                          ref={lowerCard.cardRef}
                          style={{ left: `${lowerCard.left}px`, top: `${lowerCard.top}px`, width: `${lowerCard.size}px` }}
                        >
                          <span className="hole-shadow is-secondary" style={{ left: `${lowerCard.primaryHole.xPx}px`, top: `${lowerCard.primaryHole.yPx}px` }} />
                          <button
                            aria-label="つながる側の穴位置を調整"
                            className={`hole-handle is-secondary ${lowerPrimaryActive ? "is-active" : "is-muted"}`}
                            onPointerDown={(event) => onBeginHoleDrag("sub", "primary", event)}
                            style={{ left: `${lowerCard.primaryHole.xPx}px`, top: `${lowerCard.primaryHole.yPx}px` }}
                            type="button"
                          />
                          {lowerCard.artwork ? (
                            <img alt="つながる画像" className="artwork-image" draggable={false} src={lowerCard.artwork.previewUrl} />
                          ) : (
                            renderPlaceholder(lowerCard.status, lowerCard.error, "もうひとつ画像を追加")
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
          <div className={`empty-card is-${mainCard.status}`}>
            <strong>画像をアップロードしてください</strong>
            {mainCard.status === "error" && mainCard.error ? <span>{mainCard.error}</span> : null}
          </div>
        )}
      </div>
    </section>
  );
}
