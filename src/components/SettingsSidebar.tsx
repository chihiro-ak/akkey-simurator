import type { ChangeEvent } from "react";

import { maxSizeCm, minSizeCm, type PartOption } from "../keychainConfig";
import type { Artwork, Mode, SlotId, UploadStatus } from "../simulator";

type UploadCard = {
  artwork: Artwork | null;
  error: string | null;
  isActive: boolean;
  placeholder: string;
  sizeCm: number;
  sizeLabel: string;
  slotId: SlotId;
  status: UploadStatus;
};

type Props = {
  activeSlot: SlotId;
  cards: UploadCard[];
  mode: Mode;
  onActivateSlot: (slot: SlotId) => void;
  onDropFile: (slot: SlotId, file?: File) => void;
  onModeChange: (mode: Mode) => void;
  onSelectPart: (id: PartOption["id"]) => void;
  onSetSizeCm: (slot: SlotId, value: number) => void;
  onUpload: (slot: SlotId, event: ChangeEvent<HTMLInputElement>) => void;
  parts: PartOption[];
  selectedPartId: PartOption["id"];
};

function UploadCardSection({ card, onActivateSlot, onDropFile, onSetSizeCm, onUpload }: {
  card: UploadCard;
  onActivateSlot: (slot: SlotId) => void;
  onDropFile: (slot: SlotId, file?: File) => void;
  onSetSizeCm: (slot: SlotId, value: number) => void;
  onUpload: (slot: SlotId, event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <section className={`config-card upload-card-shell ${card.isActive ? "is-active" : ""}`}>
      <label
        className={`upload-drop ${card.artwork ? "is-filled" : ""}`}
        onClick={() => onActivateSlot(card.slotId)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          onDropFile(card.slotId, event.dataTransfer.files?.[0]);
        }}
      >
        <input
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(event) => onUpload(card.slotId, event)}
          type="file"
        />
        <span className="upload-icon">
          {card.artwork ? <img alt="" className="upload-thumb" src={card.artwork.previewUrl} /> : "＋"}
        </span>
        <strong>{card.artwork?.fileName ?? "ドラッグ＆ドロップ またはクリックして選択"}</strong>
        <span>
          {card.status === "loading"
            ? "読み込み中"
            : card.status === "error"
              ? card.error
              : "透過PNG推奨"}
        </span>
      </label>

      <div className="size-card">
        <div className="size-header">
          <h2 className="config-title">サイズ</h2>
          <span>{card.sizeLabel}</span>
        </div>
        <input
          className="size-slider"
          max={maxSizeCm}
          min={minSizeCm}
          onChange={(event) => onSetSizeCm(card.slotId, Number(event.currentTarget.value))}
          step={0.5}
          type="range"
          value={card.sizeCm}
        />
        <div className="size-scale">
          <span>30mm</span>
          <span>100mm</span>
        </div>
      </div>
    </section>
  );
}

export function SettingsSidebar({
  activeSlot,
  cards,
  mode,
  onActivateSlot,
  onDropFile,
  onModeChange,
  onSelectPart,
  onSetSizeCm,
  onUpload,
  parts,
  selectedPartId,
}: Props) {
  return (
    <aside className="settings-column">
      <section className="config-card">
        <h2 className="config-title">表示モード</h2>
        <div className="mode-switch">
          <button
            className={`mode-button ${mode === "single" ? "is-active" : ""}`}
            onClick={() => onModeChange("single")}
            type="button"
          >
            <strong>単体</strong>
          </button>
          <button
            className={`mode-button ${mode === "connected" ? "is-active" : ""}`}
            onClick={() => onModeChange("connected")}
            type="button"
          >
            <strong>つながるアクキー(2連まで)</strong>
          </button>
        </div>
      </section>

      <section className="config-card grouped-upload-card">
        <h2 className="config-title">画像</h2>
        <div className="grouped-upload-list">
          {cards.map((card) => (
            <UploadCardSection
              card={card}
              key={card.slotId}
              onActivateSlot={onActivateSlot}
              onDropFile={onDropFile}
              onSetSizeCm={onSetSizeCm}
              onUpload={onUpload}
            />
          ))}
        </div>
      </section>

      <section className="config-card">
        <div className="config-title-row">
          <h2 className="config-title">金具</h2>
        </div>
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
    </aside>
  );
}
