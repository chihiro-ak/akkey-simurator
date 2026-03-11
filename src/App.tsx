import { useEffect, useMemo, useState } from "react";

import ballChainImage from "./assets/parts/ball-chain.png";
import nasukanImage from "./assets/parts/nasukan.png";
import strapImage from "./assets/parts/strap.png";

type PartId = "nasukan" | "ball-chain" | "strap";
type PreviewMode = "edit" | "preview";
type UploadStatus = "empty" | "loading" | "ready" | "error";

type PartOption = {
  id: PartId;
  label: string;
  image: string;
  fallbackIcon: string;
};

type UploadedArtwork = {
  fileName: string;
  previewUrl: string;
};

const parts: PartOption[] = [
  { id: "nasukan", label: "ナスカン", image: nasukanImage, fallbackIcon: "◎" },
  { id: "ball-chain", label: "ボールチェーン", image: ballChainImage, fallbackIcon: "◌" },
  { id: "strap", label: "ストラップ", image: strapImage, fallbackIcon: "◍" },
];

const acceptedTypes = ["image/png", "image/jpeg", "image/webp"];
const acceptedExtensions = [".png", ".jpg", ".jpeg", ".webp"];

const initialImageAvailability: Record<PartId, boolean> = {
  nasukan: true,
  "ball-chain": true,
  strap: true,
};

const isSupportedImageFile = (file: File) => {
  const lowerName = file.name.toLowerCase();
  return (
    acceptedTypes.includes(file.type) ||
    acceptedExtensions.some((extension) => lowerName.endsWith(extension))
  );
};

function App() {
  const [selectedPart, setSelectedPart] = useState<PartId>("nasukan");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("edit");
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("empty");
  const [uploadedArtwork, setUploadedArtwork] = useState<UploadedArtwork | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageAvailability, setImageAvailability] = useState(initialImageAvailability);

  const activePart = useMemo(
    () => parts.find((part) => part.id === selectedPart) ?? parts[0],
    [selectedPart],
  );
  const hasUploadedArtwork = uploadedArtwork !== null;
  const isPreviewReady = hasUploadedArtwork && uploadStatus !== "loading";
  const isPartImageAvailable = imageAvailability[activePart.id];
  const uploadCtaTitle = hasUploadedArtwork
    ? "別の画像に差し替える"
    : "タップして画像を選択";
  const uploadCtaDescription = hasUploadedArtwork
    ? "新しい画像を選ぶと、今のプレビューを差し替えます。"
    : "";

  useEffect(() => {
    if (isPreviewReady) return;

    setPreviewMode("edit");
  }, [isPreviewReady]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!isSupportedImageFile(file)) {
      setUploadStatus("error");
      setUploadError(
        hasUploadedArtwork
          ? "PNG / JPG / WEBP の画像を選択してください。現在のプレビューはそのまま保持しています。"
          : "PNG / JPG / WEBP の画像を選択してください。",
      );
      return;
    }

    setUploadStatus("loading");
    setUploadError(null);

    const reader = new FileReader();
    reader.onerror = () => {
      setUploadStatus("error");
      setUploadError(
        hasUploadedArtwork
          ? "画像の読み込みに失敗しました。現在のプレビューはそのまま保持しています。"
          : "画像の読み込みに失敗しました。別のファイルでもう一度お試しください。",
      );
    };
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setUploadedArtwork({
          fileName: file.name,
          previewUrl: result,
        });
        setUploadStatus("ready");
        return;
      }

      setUploadStatus("error");
      setUploadError(
        hasUploadedArtwork
          ? "プレビューの生成に失敗しました。現在のプレビューはそのまま保持しています。"
          : "プレビューの生成に失敗しました。",
      );
    };
    reader.readAsDataURL(file);
  };

  const handlePartImageError = (partId: PartId) => {
    setImageAvailability((current) =>
      current[partId] ? { ...current, [partId]: false } : current,
    );
  };

  return (
    <main className="app-shell">
      <section className="phone-frame">
        <header className="hero">
          <p className="hero-kicker">Acrylic Keychain Maker</p>
          <h1>アクキーシミュレーター</h1>
        </header>

        <div className="content-layout">
          <div className="control-column">
            <section className="panel">
              <div className="section-heading">
                <span aria-hidden="true">🖼️</span>
                <h2>画像アップロード</h2>
              </div>

              <label className="upload-dropzone">
                <input
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={handleFileChange}
                  type="file"
                />
                <div className="upload-badge" aria-hidden="true">
                  🏞️
                </div>
                <strong>{uploadCtaTitle}</strong>
                <span>{uploadCtaDescription}</span>
              </label>

              {/* <div className={`upload-status-card is-${uploadStatus}`} aria-live="polite">
                {uploadStatus === "empty" ? (
                  <>
                    <strong>画像を選択してください</strong>
                  </>
                ) : null}
                {uploadStatus === "loading" ? (
                  <>
                    <strong>プレビューを作成中です</strong>
                    <span>選択した画像を読み込んでいます。少しお待ちください。</span>
                  </>
                ) : null}
                {uploadStatus === "ready" && uploadedArtwork ? (
                  <>
                    <strong>画像を読み込みました</strong>
                    <span>{uploadedArtwork.fileName}</span>
                  </>
                ) : null}
                {uploadStatus === "error" ? (
                  <>
                    <strong>画像を読み込めませんでした</strong>
                    <span>{uploadError}</span>
                  </>
                ) : null}
              </div> */}
            </section>

            <section className="panel">
              <div className="section-heading">
                <span aria-hidden="true">🧩</span>
                <h2>パーツ選択</h2>
              </div>

              <div className="parts-grid">
                {parts.map((part) => {
                  const isActive = part.id === selectedPart;

                  return (
                    <button
                      key={part.id}
                      className={`part-card ${isActive ? "is-active" : ""}`}
                      onClick={() => setSelectedPart(part.id)}
                      type="button"
                    >
                      <span aria-hidden="true" className="part-icon">
                        {imageAvailability[part.id] ? (
                          <span className="part-image-crop">
                            <img
                              alt=""
                              className="part-image"
                              onError={() => handlePartImageError(part.id)}
                              src={part.image}
                            />
                          </span>
                        ) : (
                          part.fallbackIcon
                        )}
                      </span>
                      <span className="part-label">{part.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <section className="panel panel-preview">
            <div className="section-heading">
              <span aria-hidden="true">📷</span>
              <h2>プレビュー</h2>
            </div>

            <div className="mode-switch" role="tablist" aria-label="表示モード">
              <button
                aria-selected={previewMode === "edit"}
                className={previewMode === "edit" ? "is-selected" : ""}
                onClick={() => setPreviewMode("edit")}
                role="tab"
                type="button"
              >
                編集モード
              </button>
              <button
                aria-selected={previewMode === "preview"}
                className={previewMode === "preview" ? "is-selected" : ""}
                disabled={!isPreviewReady}
                onClick={() => setPreviewMode("preview")}
                role="tab"
                type="button"
              >
                プレビューモード
              </button>
            </div>

            <div className={`preview-stage ${previewMode === "preview" ? "is-clean" : ""}`}>
              <div className="preview-hardware" aria-hidden="true">
                {isPartImageAvailable ? (
                  <span className="preview-image-crop">
                    <img
                      alt=""
                      className="preview-image"
                      onError={() => handlePartImageError(activePart.id)}
                      src={activePart.image}
                    />
                  </span>
                ) : (
                  <span className="preview-fallback">{activePart.fallbackIcon}</span>
                )}
              </div>

              <div className="acrylic-card">
                {uploadedArtwork ? (
                  <img
                    alt="アクキーの完成イメージ"
                    className="artwork"
                    src={uploadedArtwork.previewUrl}
                  />
                ) : (
                  <div className={`artwork-placeholder is-${uploadStatus}`}>
                    <div className="artwork-placeholder-badge" aria-hidden="true">
                      {uploadStatus === "error" ? "!" : "＋"}
                    </div>
                    <strong>
                      {uploadStatus === "error"
                        ? "画像を表示できません"
                        : "画像をアップロードしてください"}
                    </strong>
                    <span>
                      {uploadStatus === "loading"
                        ? "読み込み中です..."
                        : uploadStatus === "error"
                          ? uploadError
                          : ""}
                    </span>
                  </div>
                )}
                {previewMode === "edit" && uploadedArtwork ? (
                  <div className="edit-overlay">
                    <span>ドラッグして配置</span>
                    <small>{activePart.label}パーツで確認中</small>
                  </div>
                ) : null}
              </div>

              <p className="preview-caption" aria-live="polite">
                {uploadedArtwork ? `${activePart.label}パーツでプレビュー中` : ""}
              </p>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

export default App;
