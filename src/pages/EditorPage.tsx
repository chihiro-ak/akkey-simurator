import { useParams } from "react-router-dom";

import { EditorWorkspace } from "../features/editor/EditorWorkspace";
import { getMockProjectById } from "../features/projects/mockProjects";
import { createEmptyProjectDraft, createShareSlug } from "../lib/projectDraft";

export function EditorPage() {
  const { projectId } = useParams();
  const project =
    projectId && projectId !== "new"
      ? getMockProjectById(projectId) ??
        createEmptyProjectDraft({
          id: projectId,
          shareSlug: createShareSlug(projectId),
          title: "復元待ちのプロジェクト",
        })
      : createEmptyProjectDraft();

  return <EditorWorkspace initialDraft={project} key={project.id ?? "new"} />;
}
