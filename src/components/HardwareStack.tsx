import { jumpRingAsset } from "../keychainConfig";

type Props = {
  counterRotation?: string;
  hardwareBottomPx: number;
  hardwareHeight: number;
  hardwareWidth: number;
  muted?: boolean;
  partImage: string;
  ringSize: number;
  variant: "editor" | "preview";
};

export function HardwareStack({
  counterRotation = "0deg",
  hardwareBottomPx,
  hardwareHeight,
  hardwareWidth,
  muted = false,
  partImage,
  ringSize,
  variant,
}: Props) {
  const connectorHeight = Math.max(10, Math.min(ringSize * 0.9, 20));

  return (
    <div className={`hardware-stack is-${variant} ${muted ? "is-muted" : ""}`}>
      <div
        className="hardware-layer"
        style={{
          width: `${hardwareWidth}px`,
          height: `${hardwareHeight}px`,
          transform: `translateX(-50%) rotate(${counterRotation})`,
        }}
      >
        <img alt="" className="hardware-image" draggable={false} src={partImage} />
      </div>

      <span
        className="hardware-connector"
        style={{
          height: `${connectorHeight}px`,
          top: `${hardwareBottomPx - connectorHeight * 0.5}px`,
        }}
      />

      <div className="ring-layer" style={{ top: `${hardwareBottomPx + ringSize * 0.08}px` }}>
        <span className="ring-cap" />
        <img
          alt=""
          className="ring-image"
          draggable={false}
          src={jumpRingAsset}
          style={{ width: `${ringSize}px`, height: `${ringSize}px` }}
        />
      </div>
    </div>
  );
}
