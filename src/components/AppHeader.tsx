import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type Props = {
  actions?: ReactNode;
  subtitle?: string;
  title?: string;
};

export function AppHeader({ actions, subtitle, title }: Props) {
  return (
    <header className="topbar">
      <div className="topbar-inner page-topbar app-header">
        <div className="topbar-copy app-header-copy">
          <Link className="app-brand" to="/projects">
            アクキーシミュレーター
          </Link>
          {(title || subtitle) && (
            <div className="app-header-meta">
              {title ? <p className="app-header-title">{title}</p> : null}
              {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
            </div>
          )}
        </div>
        {actions ? <div className="topbar-actions compact">{actions}</div> : null}
      </div>
    </header>
  );
}
