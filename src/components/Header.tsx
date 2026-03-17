interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = ["Theory", "Simulator", "Quiz"];

const Header = ({ activeTab, onTabChange }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <h1 className="text-lg font-bold text-foreground">
          Implementation of Regularization Methods for Neural Networks
        </h1>
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`nav-link ${activeTab === tab ? "nav-link-active" : ""}`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
