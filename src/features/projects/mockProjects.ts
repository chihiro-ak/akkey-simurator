import type { Artwork } from "../../simulator";
import { cloneProjectDraft, createEmptyProjectDraft, toProjectSummary } from "../../lib/projectDraft";
import type { ProjectDraft } from "../../types/project";

function createMockArtwork(label: string, accent: string, surface: string): Artwork {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${surface}" />
          <stop offset="100%" stop-color="#ffffff" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" rx="120" fill="url(#bg)" />
      <path d="M90 220c0-78 64-142 142-142 28 0 54 8 76 22-12 6-22 16-30 28-18-10-38-16-60-16-61 0-110 49-110 110 0 26 10 49 24 68C106 276 90 249 90 220Z" fill="${accent}" opacity="0.18" />
      <circle cx="170" cy="160" r="66" fill="${accent}" opacity="0.2" />
      <circle cx="248" cy="238" r="84" fill="${accent}" opacity="0.34" />
      <text x="200" y="218" text-anchor="middle" font-family="'M PLUS Rounded 1c', sans-serif" font-size="42" font-weight="700" fill="#69556a">${label}</text>
    </svg>
  `.trim();

  return {
    fileName: `${label}.svg`,
    naturalHeight: 400,
    naturalWidth: 400,
    previewUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
  };
}

const projectSeeds: ProjectDraft[] = [
  createEmptyProjectDraft({
    id: "sakura-swing",
    isPublic: true,
    mode: "connected",
    selectedPart: "nasukan",
    shareSlug: "sakura-swing",
    slots: {
      main: {
        artwork: createMockArtwork("さくら", "#f3b7c8", "#fff4f7"),
        holes: { link: 0.48, primary: 0.54 },
        sizeCm: 5.5,
      },
      sub: {
        artwork: createMockArtwork("ゆれ", "#f4cfd8", "#fef8fb"),
        holes: { primary: 0.45 },
        sizeCm: 4.5,
      },
    },
    title: "さくら つながるアクキー",
    updatedAt: "2026-03-23T22:10:00.000Z",
  }),
  createEmptyProjectDraft({
    id: "atelier-cat",
    isPublic: false,
    mode: "single",
    selectedPart: "ball-chain",
    shareSlug: "atelier-cat",
    slots: {
      main: {
        artwork: createMockArtwork("ねこ", "#b9cfe2", "#f5f9ff"),
        holes: { link: 0.5, primary: 0.42 },
        sizeCm: 5,
      },
      sub: {
        artwork: null,
        holes: { primary: 0.5 },
        sizeCm: 5,
      },
    },
    title: "アトリエねこ",
    updatedAt: "2026-03-22T14:32:00.000Z",
  }),
  createEmptyProjectDraft({
    id: "festival-ribbon",
    isPublic: true,
    mode: "single",
    selectedPart: "strap",
    shareSlug: "festival-ribbon",
    slots: {
      main: {
        artwork: createMockArtwork("りぼん", "#ffd3a8", "#fff9f2"),
        holes: { link: 0.5, primary: 0.63 },
        sizeCm: 6,
      },
      sub: {
        artwork: null,
        holes: { primary: 0.5 },
        sizeCm: 5,
      },
    },
    title: "フェス用りぼん",
    updatedAt: "2026-03-20T09:15:00.000Z",
  }),
];

export const mockProjects = projectSeeds.map((project) => cloneProjectDraft(project));
export const mockProjectSummaries = mockProjects.map((project) => toProjectSummary(project));

export function getMockProjectById(projectId?: string) {
  const project = mockProjects.find((candidate) => candidate.id === projectId);
  return project ? cloneProjectDraft(project) : null;
}

export function getMockProjectBySlug(shareSlug?: string) {
  const project = mockProjects.find((candidate) => candidate.shareSlug === shareSlug);
  return project ? cloneProjectDraft(project) : null;
}
