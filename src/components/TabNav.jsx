const TABS = [
  { id: "players", label: "Players", icon: "👤" },
  { id: "loans", label: "Loans", icon: "🔁" },
  { id: "settle", label: "Settle", icon: "💰" },
];

export default function TabNav({ active, onChange }) {
  return (
    <nav className="tab-nav">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab-nav-btn ${active === tab.id ? "active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="tab-nav-icon" aria-hidden="true">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
