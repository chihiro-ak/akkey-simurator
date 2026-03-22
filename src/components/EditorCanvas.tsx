import { HardwareStack } from "./HardwareStack";
import type { Artwork, UploadStatus } from "../simulator";

type Props = {
  artwork: Artwork | null;
  artworkSize: number;
  hardwareBottomPx: number;
  hardwareHeight: number;
  hardwareWidth: number;
  cardRef: React.RefObject<HTMLDivElement | null>;
  error: string | null;
  holePositionLabel: string;
  holeX: number;
  holeY: number;
  onBeginHoleDrag: (event: React.PointerEvent<HTMLButtonElement>) => void;
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
      <div className="canvas-header">
        <div>
          <p className="section-label">編集</p>
          <h3>穴位置調整</h3>
        </div>
        <button className="ghost-button" onClick={onResetHole} type="button">
          中央へ戻す
        </button>
      </div>

      <p className="canvas-note">安全エリアと穴マーカーを見ながら、接続位置だけを調整します。</p>

      <div className="editor-stage">
        <div className="editor-hardware-wrap">
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
          {artwork ? (
            <>
              <span className="safe-area-band" />
              <span className="safe-area-band is-secondary" />
              <span className="safe-area-label">安全エリア</span>
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
            </>
          ) : (
            <div className={`empty-card is-${status}`}>
              <strong>画像を読み込むと編集できます</strong>
              <span>{status === "error" ? error : "穴位置 = 本体画像の上端輪郭に沿った穴中心として扱います。"}</span>
            </div>
          )}
        </div>
      </div>

      <div className="canvas-footer">
        <p>穴位置 {holePositionLabel}</p>
        <p>揺れ確認はプレビュー画面で行います</p>
      </div>
    </section>
  );
}
