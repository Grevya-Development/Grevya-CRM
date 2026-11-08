
/* ---------------- SIDEBAR ITEMS ---------------- */
const sidebarItems = [

  { label: "Contacts", icon: "👥" },
  { label: "Leads", icon: "➕👤" },
  { label: "Companies", icon: "🏢" },
  { label: "Sales & Quotes", icon: "🧾" },


  { label: "AI Hub", icon: "✨🤖" },
  { label: "Automation", icon: "⚡" },



];

export default function DataSourcesOrbit() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* 🔵 BACKGROUND GLOW */}
      <div className="absolute w-[420px] h-[420px] bg-purple-600/30 rounded-full blur-3xl" />

      {/* 🟣 CENTER LOGO */}
      <div className="absolute z-[20] w-28 h-28 rounded-full bg-white overflow-hidden flex items-center justify-center animate-pulse-slow shadow-[0_0_40px_rgba(0,212,255,0.6)]">
        <img 
          src="/grevya-icon.png" 
          alt="Grevya CRM Logo" 
          className="w-full h-full object-contain p-4"
        />
      </div>

      {/* 🔵 CONNECTION LINES */}
      <svg
        className="absolute inset-0 w-full h-full z-[1] opacity-40"
        viewBox="0 0 400 400"
      >
        {sidebarItems.map((_, index) => {
          const angle = (index * 360) / sidebarItems.length;
          const radius = 120;
          const centerX = 200;
          const centerY = 200;

          const x = Math.cos((angle * Math.PI) / 180) * radius + centerX;
          const y = Math.sin((angle * Math.PI) / 180) * radius + centerY;

          return (
            <line
              key={index}
              x1={centerX}
              y1={centerY}
              x2={x}
              y2={y}
              stroke="#00D4FF"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          );
        })}
      </svg>

      {/* 🔄 ORBITING EMOJI ICONS */}
      <div className="absolute inset-0 z-[10] flex items-center justify-center">
        {sidebarItems.map((item, index) => (
          <div
            key={item.label}
            className="absolute animate-orbit"
            style={{ animationDelay: `${index * 0.4}s` }}
          >
            <div className="w-20 p-3 rounded-xl text-center bg-black/70 border border-white/10 backdrop-blur">
              <div className="text-2xl">{item.icon}</div>
              <div className="text-xs text-white/80 mt-1">{item.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
