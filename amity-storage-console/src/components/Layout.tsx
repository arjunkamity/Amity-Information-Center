import { NavLink, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import {
  LayoutDashboard, Database, KeyRound, Workflow, Search,
  Shield, ScrollText, Boxes, Bell, Settings, Server,
  Code2, BookOpen,
} from 'lucide-react'

const nav = [
  { section: 'Overview', items: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  ] },
  { section: 'Storage', items: [
    { to: '/buckets', label: 'Buckets', icon: Database },
    { to: '/objects', label: 'All Objects', icon: Boxes },
  ] },
  { section: 'AI Platform', items: [
    { to: '/pipeline', label: 'Enrichment Pipeline', icon: Workflow },
    { to: '/search', label: 'Semantic Search', icon: Search },
  ] },
  { section: 'Governance', items: [
    { to: '/access', label: 'Access & Keys', icon: KeyRound },
    { to: '/policies', label: 'Policies (RBAC)', icon: Shield },
    { to: '/categories', label: 'Categories', icon: Boxes },
    { to: '/audit', label: 'Audit Log', icon: ScrollText },
  ] },
  { section: 'Developers', items: [
    { to: '/developers', label: 'Integration Guide', icon: Code2, end: true },
    { to: '/developers/api', label: 'API Reference', icon: BookOpen },
  ] },
]

export function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo"><Server size={18} /></div>
          <div>
            <div className="name">Amity Storage</div>
            <div className="sub">Enterprise File Platform</div>
          </div>
        </div>
        <nav className="nav">
          {nav.map((group) => (
            <div key={group.section}>
              <div className="nav-section-label">{group.section}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={'end' in item ? item.end : false}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <item.icon size={17} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="avatar">AD</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Platform Admin</div>
            <div className="dim text-xs">admin@amity.edu</div>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="searchbox" onClick={() => navigate('/search')} style={{ cursor: 'pointer' }}>
            <Search size={16} />
            <input
              placeholder="Search assets semantically…"
              onFocus={() => navigate('/search')}
              readOnly
            />
          </div>
          <div className="spacer" />
          <span className="badge green" style={{ marginRight: 4 }}><span className="dot" />All systems operational</span>
          <button className="icon-btn" title="Notifications"><Bell size={17} /></button>
          <button className="icon-btn" title="Settings"><Settings size={17} /></button>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  )
}
