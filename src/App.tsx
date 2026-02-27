import { useEffect, useState } from 'react';

import agentAiLogo from './assets/agent-ai.svg';
import chainLogo from './assets/chain.svg';
import chatLogo from './assets/chat.svg';
import loopDiamondLogo from './assets/loop-diamond.svg';
import { AppShell } from './components/layouts';
import { ChatPage, useChatSession } from './features/chat';
import { ConnectorsPage } from './features/connectors';
import { DomainsPage } from './features/domains';

const SIDEBAR_EXPANDED_STORAGE_KEY = 'app.sidebarExpanded.v1';

interface NavItem {
  id: 'connectors' | 'domains' | 'chat' | 'runs';
  label: string;
  meta: string;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  { id: 'connectors', label: 'Connectors', meta: 'Configure Connectors' },
  { id: 'domains', label: 'Agents', meta: 'Configure Agents' },
  { id: 'chat', label: 'Chat', meta: 'Chat with Agents' },
  { id: 'runs', label: 'Runs', meta: 'Coming soon', disabled: true },
];

function ConnectorsIcon() {
  return <img src={chainLogo} alt="" className="app-nav__icon-image" aria-hidden="true" />;
}

function DomainsIcon() {
  return <img src={agentAiLogo} alt="" className="app-nav__icon-image" aria-hidden="true" />;
}

function ChatIcon() {
  return <img src={chatLogo} alt="" className="app-nav__icon-image" aria-hidden="true" />;
}

function RunsIcon() {
  return <img src={loopDiamondLogo} alt="" className="app-nav__icon-image" aria-hidden="true" />;
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={expanded ? '' : 'is-collapsed'}>
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function getIcon(id: NavItem['id']) {
  if (id === 'connectors') {
    return <ConnectorsIcon />;
  }

  if (id === 'domains') {
    return <DomainsIcon />;
  }

  if (id === 'runs') {
    return <RunsIcon />;
  }

  return <ChatIcon />;
}

function getInitialSidebarExpanded() {
  if (typeof window === 'undefined') {
    return false;
  }

  const stored = window.localStorage.getItem(SIDEBAR_EXPANDED_STORAGE_KEY);
  if (stored === 'true') {
    return true;
  }

  if (stored === 'false') {
    return false;
  }

  return false;
}

export default function App() {
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(getInitialSidebarExpanded);
  const [activePage, setActivePage] = useState<'connectors' | 'domains' | 'chat'>('connectors');
  const chatSession = useChatSession();

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_EXPANDED_STORAGE_KEY, String(sidebarExpanded));
  }, [sidebarExpanded]);

  const toggleLabel = sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar';
  const sidebarClassName = sidebarExpanded ? 'app-sidebar app-sidebar--expanded' : 'app-sidebar app-sidebar--collapsed';
  const appShellClassName = sidebarExpanded
    ? 'layout-app-shell--sidebar-expanded'
    : 'layout-app-shell--sidebar-collapsed';
  const appShellContentClassName = activePage === 'chat' ? 'layout-app-shell__content--chat' : undefined;

  const sidebar = (
    <section className={sidebarClassName} data-expanded={sidebarExpanded ? 'true' : 'false'} aria-labelledby="sidebar-title">
      <div className="app-sidebar__header">
        <div className="app-sidebar__branding">
          <span className="app-sidebar__logo" aria-hidden="true">
            D
          </span>
          <div className="app-sidebar__branding-copy">
            <h2 id="sidebar-title" className="app-sidebar__title">
              DataClaw Console
            </h2>
            <p className="app-sidebar__subtext">Admin operations</p>
          </div>
        </div>
      </div>

      <nav aria-label="Primary navigation" className="app-sidebar__nav">
        <ul className="app-nav">
          {navItems.map((item) => {
            const title = `${item.label} - ${item.meta}`;

            return (
              <li key={item.id} className="app-nav__item">
                <button
                  type="button"
                  className="app-nav__link"
                  aria-current={activePage === item.id ? 'page' : undefined}
                  data-disabled={item.disabled ? 'true' : undefined}
                  disabled={item.disabled}
                  aria-label={item.label}
                  title={title}
                  onClick={() => {
                    if (item.disabled) return;
                    if (item.id === 'chat') {
                      setActivePage('chat');
                      return;
                    }
                    if (item.id === 'domains') {
                      setActivePage('domains');
                      return;
                    }
                    setActivePage('connectors');
                  }}
                >
                  <span className="app-nav__icon">{getIcon(item.id)}</span>
                  <span className="app-nav__content">
                    <span className="app-nav__label">{item.label}</span>
                    <span className="app-nav__meta">{item.meta}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="app-sidebar__footer">
        <button
          type="button"
          className="app-sidebar__toggle"
          onClick={() => setSidebarExpanded((current) => !current)}
          aria-pressed={sidebarExpanded}
          aria-label={toggleLabel}
          title={toggleLabel}
        >
          <ChevronIcon expanded={sidebarExpanded} />
        </button>
      </div>
    </section>
  );

  return (
    <main className="app-shell">
      <AppShell sidebar={sidebar} className={appShellClassName} contentClassName={appShellContentClassName}>
        {activePage === 'domains' ? <DomainsPage /> : null}
        {activePage === 'chat' ? <ChatPage session={chatSession} /> : null}
        {activePage === 'connectors' ? <ConnectorsPage /> : null}
      </AppShell>
    </main>
  );
}
