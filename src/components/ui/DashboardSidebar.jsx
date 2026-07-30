import { useState, useEffect } from 'react';

/**
 * DashboardSidebar — collapsible left sidebar navigation.
 *
 * Props:
 *   groups      — array of { label, color, tabs: [{ id, label }] }
 *                 Each tab.label is "emoji text" (space-separated).
 *   activeTab   — currently active tab id string
 *   onTabChange — (tabId: string) => void
 *   badge       — optional chip shown in header (e.g. "🏫 ห้อง ป.1")
 */
const AUTO_COLLAPSE_BREAKPOINT = 900; // px

export default function DashboardSidebar({ groups, activeTab, onTabChange, badge }) {
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < AUTO_COLLAPSE_BREAKPOINT);
  const [hoveredId, setHoveredId] = useState(null);

  /* ── Auto-collapse เมื่อหน้าจอแคบ ── */
  useEffect(() => {
    const handleResize = () => {
      setCollapsed(window.innerWidth < AUTO_COLLAPSE_BREAKPOINT);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* ── find which group owns the active tab ── */
  const activeGroupLabel = groups.find(g => g.tabs.some(t => t.id === activeTab))?.label;

  /* ── expanded groups state ── */
  const [expandedGroups, setExpandedGroups] = useState(() => {
    const s = new Set();
    if (activeGroupLabel) s.add(activeGroupLabel);
    else if (groups.length > 0) s.add(groups[0].label);
    return s;
  });

  const toggleGroup = (label) =>
    setExpandedGroups(prev => {
      const s = new Set(prev);
      s.has(label) ? s.delete(label) : s.add(label);
      return s;
    });

  /* ── tab click — auto-expand its group ── */
  const handleTabChange = (tabId) => {
    const grp = groups.find(g => g.tabs.some(t => t.id === tabId));
    if (grp) setExpandedGroups(prev => { const s = new Set(prev); s.add(grp.label); return s; });
    onTabChange(tabId);
  };

  /* ── parse "emoji rest" ── */
  const splitLabel = (label) => {
    const idx = label.indexOf(' ');
    return idx > 0 ? [label.slice(0, idx), label.slice(idx + 1)] : [label, ''];
  };

  const W = collapsed ? 62 : 236;

  return (
    <div style={{
      width: W, minWidth: W, flexShrink: 0,
      background: 'white',
      borderRadius: '16px',
      border: '1.5px solid #e5e7eb',
      boxShadow: '0 2px 12px rgba(0,0,0,.07)',
      display: 'flex', flexDirection: 'column',
      alignSelf: 'flex-start',
      position: 'sticky', top: '1rem',
      /* allow tooltips to overflow right edge */
      overflow: 'visible',
      transition: 'width .22s ease, min-width .22s ease',
    }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: '.5rem .6rem',
        borderBottom: '1.5px solid #f3f4f6',
        gap: '.5rem', flexShrink: 0,
        borderRadius: '16px 16px 0 0',
        background: '#fafafa',
      }}>
        {!collapsed && badge && (
          <span style={{
            background: '#ede9fe', color: '#7c3aed',
            borderRadius: '999px', padding: '.2rem .75rem',
            fontSize: '.8rem', fontWeight: 800,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {badge}
          </span>
        )}
        {!collapsed && !badge && (
          <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#c4c9d4' }}>เมนู</span>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'ขยายเมนู' : 'ย่อเมนู'}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '.8rem', padding: '.28rem .38rem',
            borderRadius: '7px', color: '#c4c9d4', lineHeight: 1, flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f5'; e.currentTarget.style.color = '#555'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#c4c9d4'; }}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* ── Menu — no overflow-y so tooltips can escape ── */}
      <div style={{ padding: '.38rem .32rem', paddingBottom: '.75rem' }}>
        {groups.map(group => {
          const isOpen = collapsed || expandedGroups.has(group.label);
          const groupHasActive = group.tabs.some(t => t.id === activeTab);

          return (
            <div key={group.label} style={{ marginBottom: '.18rem' }}>

              {/* ── Group label / toggle ── */}
              {!collapsed ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    gap: '.45rem', padding: '.36rem .55rem',
                    border: 'none', borderRadius: '9px',
                    background: groupHasActive ? `${group.color}0e` : 'transparent',
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'background .12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = `${group.color}0b`}
                  onMouseLeave={e => e.currentTarget.style.background = groupHasActive ? `${group.color}0e` : 'transparent'}
                >
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: group.color, flexShrink: 0,
                  }} />
                  <span style={{
                    flex: 1, textAlign: 'left',
                    fontSize: '.72rem', fontWeight: 800, color: group.color,
                    textTransform: 'uppercase', letterSpacing: '.07em',
                    lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {group.label}
                  </span>
                  <span style={{
                    fontSize: '.62rem', color: '#c4c9d4',
                    transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform .15s', display: 'inline-block',
                  }}>▶</span>
                </button>
              ) : (
                /* Collapsed: thin color divider between groups */
                <div style={{
                  height: '1.5px', background: `${group.color}30`,
                  margin: '.45rem .4rem',
                }} />
              )}

              {/* ── Tab items ── */}
              {isOpen && (
                <div style={{ paddingLeft: collapsed ? 0 : '.1rem', marginTop: '.05rem' }}>
                  {group.tabs.map(t => {
                    const isActive = activeTab === t.id;
                    const [emoji, text] = splitLabel(t.label);

                    return (
                      <div
                        key={t.id}
                        style={{ position: 'relative' }}
                        onMouseEnter={() => collapsed && setHoveredId(t.id)}
                        onMouseLeave={() => collapsed && setHoveredId(null)}
                      >
                        <button
                          type="button"
                          onClick={() => handleTabChange(t.id)}
                          style={{
                            width: '100%',
                            display: 'flex', alignItems: 'center',
                            gap: '.48rem',
                            padding: collapsed ? '.5rem' : '.44rem .52rem',
                            borderRadius: '9px',
                            border: 'none',
                            borderLeft: isActive && !collapsed ? `3px solid ${group.color}` : '3px solid transparent',
                            background: isActive ? group.color : 'transparent',
                            color: isActive ? 'white' : '#4b5563',
                            fontFamily: 'inherit',
                            fontSize: '.86rem',
                            fontWeight: isActive ? 700 : 500,
                            cursor: 'pointer',
                            transition: 'background .12s, color .12s',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            boxShadow: isActive ? `0 2px 8px ${group.color}38` : 'none',
                          }}
                          onMouseEnter={e => {
                            if (!isActive) {
                              e.currentTarget.style.background = `${group.color}14`;
                              e.currentTarget.style.color = group.color;
                            }
                          }}
                          onMouseLeave={e => {
                            if (!isActive) {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = '#4b5563';
                            }
                          }}
                        >
                          <span style={{ fontSize: '1.1rem', lineHeight: 1, flexShrink: 0 }}>{emoji}</span>
                          {!collapsed && (
                            <span style={{
                              overflow: 'hidden', textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap', lineHeight: 1.3, fontSize: '.86rem',
                            }}>
                              {text}
                            </span>
                          )}
                        </button>

                        {/* Tooltip in collapsed mode */}
                        {collapsed && hoveredId === t.id && (
                          <div style={{
                            position: 'absolute',
                            left: '100%', top: '50%',
                            transform: 'translateY(-50%)',
                            marginLeft: '10px',
                            background: '#1f2937', color: 'white',
                            padding: '.35rem .7rem',
                            borderRadius: '8px',
                            fontSize: '.82rem', fontWeight: 600,
                            whiteSpace: 'nowrap',
                            zIndex: 9999,
                            pointerEvents: 'none',
                            boxShadow: '0 4px 16px rgba(0,0,0,.28)',
                          }}>
                            {t.label}
                            {/* small arrow */}
                            <div style={{
                              position: 'absolute', left: '-4px', top: '50%',
                              transform: 'translateY(-50%)',
                              width: 0, height: 0,
                              borderTop: '4px solid transparent',
                              borderBottom: '4px solid transparent',
                              borderRight: '4px solid #1f2937',
                            }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
