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
  onBeginArtworkDrag: (event: PointerEvent<HTMLElement>) => void;
  partImage: string;
  ringSize: number;
  status: UploadStatus;
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
  onBeginArtworkDrag,
  partImage,
  ringSize,
  status,
}: Props) {
  return (
    <section className="canvas-card">
      <div className="canvas-frame">
        {artwork ? (
          <>
            <div className="canvas-caption">ドラッグで位置調整</div>
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
                  className="editor-artwork"
                  ref={cardRef}
                  onPointerDown={onBeginArtworkDrag}
                  style={{ left: `${artworkLeft}px`, top: `${artworkTop}px`, width: `${artworkSize}px` }}
                >
                  <span className="hole-shadow" style={{ left: `${holeX}px`, top: `${holeY}px` }} />
                  <img
                    alt="アップロード画像"
                    className="artwork-image"
                    draggable={false}
                    src={artwork.previewUrl}
                  />
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
