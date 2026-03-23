import type { PartId } from "../keychainConfig";
import type { Artwork, Mode } from "../simulator";

export type ProjectSlotDraft = {
  artwork: Artwork | null;
  holes: {
    link?: number;
    primary: number;
  };
  sizeCm: number;
};

export type ProjectDraft = {
  id?: string;
  isPublic: boolean;
  mode: Mode;
  selectedPart: PartId;
  shareSlug: string;
  slots: {
    main: ProjectSlotDraft;
    sub: ProjectSlotDraft;
  };
  title: string;
  updatedAt: string;
};

export type ProjectSummary = {
  id: string;
  isPublic: boolean;
  mode: Mode;
  shareSlug: string;
  thumbnailUrl: string | null;
  title: string;
  updatedAt: string;
};
