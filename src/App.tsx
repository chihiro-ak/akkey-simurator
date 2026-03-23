import { Navigate, Route, Routes } from "react-router-dom";

import { EditorPage } from "./pages/EditorPage";
import { LoginPage } from "./pages/LoginPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { SharePage } from "./pages/SharePage";

export default function App() {
  return (
    <Routes>
      <Route element={<Navigate replace to="/projects" />} path="/" />
      <Route element={<LoginPage />} path="/login" />
      <Route element={<ProjectsPage />} path="/projects" />
      <Route element={<EditorPage />} path="/editor/new" />
      <Route element={<EditorPage />} path="/editor/:projectId" />
      <Route element={<SharePage />} path="/share/:shareSlug" />
      <Route element={<Navigate replace to="/projects" />} path="*" />
    </Routes>
  );
}
