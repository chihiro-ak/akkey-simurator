import { useEffect, useMemo, useState } from "react";

type PartId = "standard" | "star" | "heart" | "cat";
type PreviewMode = "edit" | "preview";
type UploadStatus = "empty" | "loading" | "ready" | "error";

type PartOption = {
  id: PartId;
  label: string;
  icon: string;
  accent: string;
};

type UploadedArtwork = {
  fileName: string;
  previewUrl: string;
};

const parts: PartOption[] = [
  { id: "standard", label: "標準", icon: "🔗", accent: "#7ecbe4" },
  { id: "star", label: "星", icon: "★", accent: "#95a0bf" },
  { id: "heart", label: "ハート", icon: "♥", accent: "#8f9bb8" },
  { id: "cat", label: "猫", icon: "🐾", accent: "#8d98b4" },
];

const acceptedTypes = ["image/png", "image/jpeg", "image/webp"];
const acceptedExtensions = [".png", ".jpg", ".jpeg", ".webp"];

const isSupportedImageFile = (file: File) => {
  const lowerName = file.name.toLowerCase();
  return (
    acceptedTypes.includes(file.type) ||
    acceptedExtensions.some((extension) => lowerName.endsWith(extension))
  );
};

function App() {
  const [selectedPart, setSelectedPart] = useState<PartId>("standard");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("edit");
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("empty");
  const [uploadedArtwork, setUploadedArtwork] = useState<UploadedArtwork | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const activePart = useMemo(
    () => parts.find((part) => part.id === selectedPart) ?? parts[0],
    [selectedPart],
  );
  const hasUploadedArtwork = uploadedArtwork !== null;
  const isPreviewReady = hasUploadedArtwork && uploadStatus !== "loading";
  const uploadCtaTitle = hasUploadedArtwork ? "別の画像に差し替える" : "タップして画像を選択";
  const uploadCtaDescription = hasUploadedArtwork
    ? "新しい画像を選ぶと、今のプレビューを保ったまま差し替えできます。"
    : "PNG / JPG / WEBP に対応。背景透過の画像だと確認しやすいです。";

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

  return (
    <main className="app-shell">
      <section className="phone-frame">
        <header className="hero">
          <p className="hero-kicker">Acrylic Keychain Maker</p>
          <h1>アクキーシミュレーター</h1>
          <p className="hero-copy">
            画像を選んで、パーツを切り替えながら完成イメージを確認できます。
          </p>
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

              <div className={`upload-status-card is-${uploadStatus}`} aria-live="polite">
                {uploadStatus === "empty" ? (
                  <>
                    <strong>画像はまだ選択されていません</strong>
                    <span>まずはアートワークを 1 枚読み込むと、右側のプレビューに反映されます。</span>
                  </>
                ) : null}
                {uploadStatus === "loading" ? (
                  <>
                    <strong>プレビューを作成中です</strong>
                    <span>選択した画像を読み込んでいます。数秒お待ちください。</span>
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
              </div>
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
                      <span
                        aria-hidden="true"
                        className="part-icon"
                        style={{ color: isActive ? part.accent : undefined }}
                      >
                        {part.icon}
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
              <div className={`hanger hanger-${activePart.id}`} aria-hidden="true">
                <span className="hanger-loop" />
                <span className="hanger-arm" />
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
                          : "選択したアートワークがここに反映されます。"}
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
                {uploadedArtwork
                  ? `${activePart.label}パーツでプレビュー中`
                  : "画像未選択のためプレビューモードは無効です"}
              </p>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

export default App;
