import { defaultSizeCm } from "../keychainConfig";
import { defaultHole, type Mode } from "../simulator";
import type { ProjectDraft, ProjectSlotDraft, ProjectSummary } from "../types/project";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "new-project";

export function createProjectSlotDraft(includeLink = false): ProjectSlotDraft {
  return {
    artwork: null,
    holes: {
      ...(includeLink ? { link: defaultHole } : {}),
      primary: defaultHole,
    },
    sizeCm: defaultSizeCm,
  };
}

export function createEmptyProjectDraft(overrides: Partial<ProjectDraft> = {}): ProjectDraft {
  const title = overrides.title ?? "新しいアクキー";
  const mode: Mode = overrides.mode ?? "single";
  const baseMain = createProjectSlotDraft(true);
  const baseSub = createProjectSlotDraft(false);
  const mainSlot = overrides.slots?.main ?? baseMain;
  const subSlot = overrides.slots?.sub ?? baseSub;

  return {
    id: overrides.id,
    isPublic: overrides.isPublic ?? false,
    mode,
    selectedPart: overrides.selectedPart ?? "nasukan",
    shareSlug: overrides.shareSlug ?? slugify(title),
    slots: {
      main: {
        ...baseMain,
        ...mainSlot,
        holes: {
          ...baseMain.holes,
          ...mainSlot.holes,
        },
      },
      sub: {
        ...baseSub,
        ...subSlot,
        holes: {
          ...baseSub.holes,
          ...subSlot.holes,
        },
      },
    },
    title,
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
  };
}

export function cloneProjectDraft(project: ProjectDraft): ProjectDraft {
  return {
    ...project,
    slots: {
      main: {
        ...project.slots.main,
        artwork: project.slots.main.artwork ? { ...project.slots.main.artwork } : null,
        holes: { ...project.slots.main.holes },
      },
      sub: {
        ...project.slots.sub,
        artwork: project.slots.sub.artwork ? { ...project.slots.sub.artwork } : null,
        holes: { ...project.slots.sub.holes },
      },
    },
  };
}

export function toProjectSummary(project: ProjectDraft): ProjectSummary {
  return {
    id: project.id ?? project.shareSlug,
    isPublic: project.isPublic,
    mode: project.mode,
    shareSlug: project.shareSlug,
    thumbnailUrl: project.slots.main.artwork?.previewUrl ?? null,
    title: project.title,
    updatedAt: project.updatedAt,
  };
}

export function createShareSlug(title: string) {
  return slugify(title);
}
