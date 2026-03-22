type Props = {
  actionMessage: string | null;
  holeAdjusted: boolean;
  holePositionLabel: string;
  onSave: () => void;
  onShare: () => void;
  partLabel: string;
  sizeLabel: string;
  thicknessLabel: string;
};

export function DesignSummary({
  actionMessage,
  holeAdjusted,
  holePositionLabel,
  onSave,
  onShare,
  partLabel,
  sizeLabel,
  thicknessLabel,
}: Props) {
  return (
    <section className="summary-card">
      <div className="summary-main">
        <div className="summary-header">
          <div>
            <p className="section-label">デザイン要約</p>
            <h2>完成見えと設定</h2>
          </div>
        </div>

        <div className="summary-grid">
          <div className="summary-item">
            <span>サイズ</span>
            <strong>{sizeLabel}</strong>
          </div>
          <div className="summary-item">
            <span>厚み</span>
            <strong>{thicknessLabel}</strong>
          </div>
          <div className="summary-item">
            <span>金具</span>
            <strong>{partLabel}</strong>
          </div>
          <div className="summary-item">
            <span>穴位置</span>
            <strong>{holeAdjusted ? `調整済み (${holePositionLabel})` : "未調整"}</strong>
          </div>
        </div>
      </div>

      <div className="summary-actions">
        <button className="secondary-button" onClick={onShare} type="button">
          共有
        </button>
        <button className="primary-button" onClick={onSave} type="button">
          デザインを保存
        </button>
      </div>

      {actionMessage ? <p className="helper-copy">{actionMessage}</p> : null}
    </section>
  );
}
