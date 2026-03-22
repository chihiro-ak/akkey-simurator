import type { ChangeEvent } from "react";

import { maxSizeCm, minSizeCm, thicknessOptions, type PartOption, type ThicknessMm } from "../keychainConfig";
import type { Artwork, UploadStatus } from "../simulator";

type Props = {
  artwork: Artwork | null;
  error: string | null;
  onDropFile: (file?: File) => void;
  onSelectPart: (id: PartOption["id"]) => void;
  onThicknessChange: (value: ThicknessMm) => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  parts: PartOption[];
  selectedPartId: PartOption["id"];
  sizeCm: number;
  sizeLabel: string;
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
  sizeLabel,
  status,
  thicknessMm,
}: Props) {
  return (
    <aside className="settings-column">
      <section className="config-card">
        <h2 className="config-title">画像をアップロード</h2>
        <label
          className={`upload-drop ${artwork ? "is-filled" : ""}`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            onDropFile(event.dataTransfer.files?.[0]);
          }}
        >
          <input accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={onUpload} type="file" />
          <span className="upload-icon">{artwork ? <img alt="" className="upload-thumb" src={artwork.previewUrl} /> : "＋"}</span>
          <strong>{artwork?.fileName ?? "ドラッグ＆ドロップ またはクリックして選択"}</strong>
          <span>{status === "loading" ? "読み込み中" : status === "error" ? error : "透過PNG推奨"}</span>
        </label>
      </section>

      <section className="config-card">
        <h2 className="config-title">金具選択</h2>
        <div className="attachment-grid">
          {parts.map((part) => (
            <button
              className={`attachment-button ${selectedPartId === part.id ? "is-active" : ""}`}
              key={part.id}
              onClick={() => onSelectPart(part.id)}
              type="button"
            >
              {part.label}
            </button>
          ))}
        </div>
      </section>

      <section className="config-card">
        <div className="size-header">
          <h2 className="config-title">サイズ</h2>
          <span>{sizeLabel}</span>
        </div>
        <input
          className="size-slider"
          max={maxSizeCm}
          min={minSizeCm}
          onChange={(event) => setSizeCm(Number(event.currentTarget.value))}
          step={0.5}
          type="range"
          value={sizeCm}
        />
        <div className="size-scale">
          <span>30mm</span>
          <span>100mm</span>
        </div>
      </section>

      <section className="config-card">
        <h2 className="config-title">厚み</h2>
        <div className="thickness-row">
          {thicknessOptions.map((option) => (
            <button
              className={`thickness-button ${thicknessMm === option ? "is-active" : ""}`}
              key={option}
              onClick={() => onThicknessChange(option)}
              type="button"
            >
              {option}mm
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}
