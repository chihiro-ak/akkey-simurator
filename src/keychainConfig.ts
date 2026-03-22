import ballChainImage from "./assets/parts/ball-chain.png";
import jumpRingImage from "./assets/parts/jump-ring.png";
import nasukanImage from "./assets/parts/nasukan.png";
import strapImage from "./assets/parts/strap.png";

export type PartId = "nasukan" | "ball-chain" | "strap";
export type ViewMode = "edit" | "preview";
export type ThicknessMm = 3 | 5 | 8;

export type PartOption = {
  id: PartId;
  label: string;
  image: string;
  fallbackIcon: string;
  note: string;
};

export const partOptions: PartOption[] = [
  { id: "nasukan", label: "ナスカン", image: nasukanImage, fallbackIcon: "◎", note: "定番の見え方" },
  { id: "ball-chain", label: "ボールチェーン", image: ballChainImage, fallbackIcon: "◌", note: "軽めの印象" },
  { id: "strap", label: "ストラップ", image: strapImage, fallbackIcon: "◍", note: "やわらかな見え方" },
];

export const jumpRingAsset = jumpRingImage;
export const thicknessOptions: ThicknessMm[] = [3, 5, 8];
export const sizeChipOptions = [3, 5, 7, 8];
export const defaultSizeCm = 5;
export const minSizeCm = 3;
export const maxSizeCm = 8;
export const previewAngleLimit = Math.PI * 0.58;
export const previewDragVelocityLimit = 4;
export const hardwareSizeCm = 4;
