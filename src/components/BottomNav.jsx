import { useApp } from '../hooks/AppContext';

const NAV_ITEMS = [
  { id: 'coach',    icon: '🤖', label: 'Coach' },
  { id: 'workout',  icon: '🏋️', label: 'Plan' },
  { id: 'log',      icon: '📊', label: 'Log' },
  { id: 'nutrition',icon: '🥩', label: 'Food' },
  { id: 'progress', icon: '📈', label: 'Progress' },
  { id: 'account',  icon: '👤', label: 'Account' },
];

export default function BottomNav() {
  const { activePanel, setActivePanel, currentUser, userProfile } = useApp();
  const isAdmin = currentUser?.email === 'kevinklem9@gmail.com';

  const items = isAdmin
    ? [...NAV_ITEMS, { id: 'admin', icon: '⚙️', label: 'Admin' }]
    : NAV_ITEMS;

  return (
    <nav className="bottom-nav">
      {items.map(item => (
        <button
          key={item.id}
          id={`nav-${item.id}`}
          className={`nav-btn${activePanel === item.id ? ' active' : ''}`}
          onClick={() => setActivePanel(item.id)}
        >
          <div className="nav-icon">{item.icon}</div>
          <div className="nav-label">{item.label}</div>
        </button>
      ))}
    </nav>
  );
}
