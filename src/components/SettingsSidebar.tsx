import { maxSizeCm, minSizeCm, sizeChipOptions, thicknessOptions, type PartOption, type ThicknessMm } from "../keychainConfig";
import type { Artwork, UploadStatus } from "../simulator";

type Props = {
  artwork: Artwork | null;
  error: string | null;
  onDropFile: (file?: File) => void;
  onSelectPart: (id: PartOption["id"]) => void;
  onThicknessChange: (value: ThicknessMm) => void;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  parts: PartOption[];
  selectedPartId: PartOption["id"];
  sizeCm: number;
  status: UploadStatus;
  thicknessMm: ThicknessMm;
  setSizeCm: (value: number) => void;
};

export function SettingsSidebar({
  artwork,
  error,
  onDropFile,
  onSelectPart,
  onThicknessChange,
  onUpload,
  parts,
  selectedPartId,
  setSizeCm,
  sizeCm,
  status,
  thicknessMm,
}: Props) {
  return (
    <aside className="settings-panel">
      <section className="surface-card">
        <div className="section-header">
          <p className="section-label">設定</p>
          <h2>画像アップロード</h2>
        </div>

        <label
          className={`upload-field ${artwork ? "is-filled" : ""}`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            onDropFile(event.dataTransfer.files?.[0]);
          }}
        >
          <input accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={onUpload} type="file" />
          <div className="upload-badge">
            {artwork ? <img alt="" className="upload-image" src={artwork.previewUrl} /> : <span>+</span>}
          </div>
          <div className="upload-copy">
            <strong>{artwork?.fileName ?? "クリックして画像を選択"}</strong>
            <span>
              {status === "loading"
                ? "画像を読み込み中です"
                : status === "error"
                  ? error
                  : "透過 PNG 推奨。ドラッグ&ドロップでも追加できます。"}
            </span>
          </div>
        </label>
      </section>

      <section className="surface-card">
        <div className="section-header">
          <p className="section-label">設定</p>
          <h2>金具選択</h2>
        </div>

        <div className="part-grid">
          {parts.map((part) => (
            <button
              className={`part-card ${selectedPartId === part.id ? "is-active" : ""}`}
              key={part.id}
              onClick={() => onSelectPart(part.id)}
              type="button"
            >
              <span className="part-card-preview">
                <img alt="" className="part-card-image" src={part.image} />
              </span>
              <strong>{part.label}</strong>
              <span>{part.note}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="surface-card">
        <div className="section-header">
          <p className="section-label">設定</p>
          <h2>サイズ</h2>
        </div>

        <div className="chip-grid">
          {sizeChipOptions.map((option) => (
            <button
              className={`chip-button ${sizeCm === option ? "is-active" : ""}`}
              key={option}
              onClick={() => setSizeCm(option)}
              type="button"
            >
              {option}cm
            </button>
          ))}
        </div>

        <label className="slider-block">
          <div className="slider-header">
            <span>微調整</span>
            <strong>{sizeCm.toFixed(sizeCm % 1 === 0 ? 0 : 1)}cm</strong>
          </div>
          <input
            className="slider"
            max={maxSizeCm}
            min={minSizeCm}
            onChange={(event) => setSizeCm(Number(event.currentTarget.value))}
            step={0.5}
            type="range"
            value={sizeCm}
          />
        </label>
      </section>

      <section className="surface-card">
        <div className="section-header">
          <p className="section-label">設定</p>
          <h2>厚み</h2>
        </div>

        <div className="chip-grid compact">
          {thicknessOptions.map((option) => (
            <button
              className={`chip-button ${thicknessMm === option ? "is-active" : ""}`}
              key={option}
              onClick={() => onThicknessChange(option)}
              type="button"
            >
              {option}mm
            </button>
          ))}
        </div>
        <p className="helper-copy">要約に反映し、今後の見た目調整にもつなげられる状態にしています。</p>
      </section>
    </aside>
  );
}
