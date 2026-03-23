import type { PointerEvent } from "react";

import { jumpRingAsset } from "../keychainConfig";

type Props = {
  ariaLabel?: string;
  bottomConnectorHeight?: number;
  className?: string;
  interactive?: boolean;
  onPointerDown?: (event: PointerEvent<HTMLElement>) => void;
  size: number;
  topConnectorHeight?: number;
  withCaps?: boolean;
};

export function PreviewJumpRing({
  ariaLabel,
  bottomConnectorHeight = 0,
  className = "",
  interactive = false,
  onPointerDown,
  size,
  topConnectorHeight = 0,
  withCaps = false,
}: Props) {
  const content = (
    <>
      {topConnectorHeight > 0 ? <span className="preview-jump-ring-connector is-top" style={{ height: `${topConnectorHeight}px` }} /> : null}
      {withCaps ? <span className="preview-jump-ring-cap is-top" /> : null}
      <img
        alt=""
        className="preview-jump-ring-asset"
        draggable={false}
        src={jumpRingAsset}
        style={{ width: `${size}px`, height: `${size}px` }}
      />
      {withCaps ? <span className="preview-jump-ring-cap is-bottom" /> : null}
      {bottomConnectorHeight > 0 ? <span className="preview-jump-ring-connector is-bottom" style={{ height: `${bottomConnectorHeight}px` }} /> : null}
    </>
  );

  if (interactive) {
    return (
      <button
        aria-label={ariaLabel}
        className={`linked-anchor-button preview-jump-ring is-interactive ${className}`.trim()}
        onPointerDown={onPointerDown}
        type="button"
      >
        {content}
      </button>
    );
  }

  return <span className={`preview-jump-ring ${className}`.trim()}>{content}</span>;
}
