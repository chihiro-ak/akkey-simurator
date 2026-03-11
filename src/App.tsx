import { useMemo, useState } from "react";

type PartId = "standard" | "star" | "heart" | "cat";
type PreviewMode = "edit" | "preview";

type PartOption = {
  id: PartId;
  label: string;
  icon: string;
  accent: string;
};

const parts: PartOption[] = [
  { id: "standard", label: "標準", icon: "🔗", accent: "#7ecbe4" },
  { id: "star", label: "星", icon: "★", accent: "#95a0bf" },
  { id: "heart", label: "ハート", icon: "♥", accent: "#8f9bb8" },
  { id: "cat", label: "猫", icon: "🐾", accent: "#8d98b4" },
];

const defaultArtwork =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fff5f0"/>
          <stop offset="100%" stop-color="#d8ebf8"/>
        </linearGradient>
        <linearGradient id="hair" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#86614c"/>
          <stop offset="100%" stop-color="#b58b73"/>
        </linearGradient>
      </defs>
      <rect width="480" height="480" rx="72" fill="url(#bg)"/>
      <circle cx="240" cy="184" r="92" fill="#f7d7c9"/>
      <path d="M152 174c12-66 57-100 106-100 54 0 96 36 106 98-28-18-56-28-100-28-38 0-76 10-112 30z" fill="url(#hair)"/>
      <path d="M146 178c-6 58 2 136 40 182-58-20-92-86-80-142 6-30 20-52 40-66z" fill="url(#hair)"/>
      <path d="M334 160c34 18 52 52 52 96 0 56-32 104-80 122 30-44 38-108 28-170z" fill="url(#hair)"/>
      <circle cx="206" cy="193" r="10" fill="#5f483f"/>
      <circle cx="276" cy="193" r="10" fill="#5f483f"/>
      <path d="M224 244c10 8 24 8 34 0" stroke="#8e6056" stroke-width="8" stroke-linecap="round" fill="none"/>
      <path d="M178 292c40 14 84 14 124 0 18 24 26 44 26 76H152c0-32 8-52 26-76z" fill="#fffdfc" opacity="0.92"/>
      <path d="M176 284c18-18 34-28 66-28 34 0 52 10 70 28" stroke="#c99f8a" stroke-width="12" stroke-linecap="round" fill="none"/>
      <circle cx="240" cy="34" r="10" fill="#e3eef6"/>
      <text x="240" y="430" text-anchor="middle" font-size="28" font-family="'Zen Maru Gothic', sans-serif" fill="#70849f">サンプル画像</text>
    </svg>
  `);

function App() {
  const [selectedPart, setSelectedPart] = useState<PartId>("standard");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("edit");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const activePart = useMemo(
    () => parts.find((part) => part.id === selectedPart) ?? parts[0],
    [selectedPart],
  );

  const currentImage = uploadedImage ?? defaultArtwork;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setUploadedImage(result);
      }
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
                <strong>タップして画像を選択</strong>
                <span>PNG、JPG 推奨。背景が透過された画像だと確認しやすいです。</span>
              </label>
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
                <img alt="アクキーの完成イメージ" className="artwork" src={currentImage} />
                {previewMode === "edit" ? (
                  <div className="edit-overlay">
                    <span>ドラッグして配置</span>
                    <small>{activePart.label}パーツで確認中</small>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

export default App;
