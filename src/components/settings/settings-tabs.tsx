interface SettingsTabsProps {
  activeTab: string;

  setActiveTab: (
    value: string,
  ) => void;
}

const tabs = [
  "General",
  "Notifications",
  "Security",
  "Integration",
];

export default function SettingsTabs({
  activeTab,
  setActiveTab,
}: SettingsTabsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-card p-1 sm:flex sm:w-fit">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() =>
            setActiveTab(tab)
          }
          // Selected uses the rail's selected language: signal edge, tint and ink. The old
          // bg-muted matched the light page exactly, so selection showed by text colour
          // alone. aria-pressed exposes the state to assistive tech.
          aria-pressed={activeTab === tab}
          className={`rounded-lg border px-4 py-2 text-center text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            activeTab === tab
              ? "border-primary bg-primary/10 text-primary-ink"
              : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}