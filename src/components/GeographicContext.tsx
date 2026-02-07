import { useState } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const states = [
  { code: "PA", name: "Pennsylvania", region: "Mid-Atlantic" },
  { code: "CA", name: "California", region: "Pacific" },
  { code: "TX", name: "Texas", region: "South Central" },
  { code: "NY", name: "New York", region: "Northeast" },
  { code: "FL", name: "Florida", region: "Southeast" },
];

const stateInsights: Record<string, string[]> = {
  PA: [
    "PA's carbon emissions fell 3.2% year-over-year, driven by natural gas-to-renewable transitions in the western part of the state.",
    "The state legislature is considering HB 1247, which would establish a carbon pricing pilot program for heavy industry.",
    "Housing affordability remains a key issue — Philadelphia metro median rent rose 6.1% in the past 12 months.",
  ],
  CA: [
    "California's cap-and-trade program generated $4.2B in auction revenue this fiscal year.",
    "The state leads in renewable energy investment, with solar accounting for 27% of electricity generation.",
    "SB 423 streamlining housing development near transit was signed into law last quarter.",
  ],
};

const GeographicContext = () => {
  const [selectedState, setSelectedState] = useState<string>("PA");
  const [isOpen, setIsOpen] = useState(false);

  const current = states.find((s) => s.code === selectedState)!;
  const insights = stateInsights[selectedState] || [
    "State-specific context will be available as coverage expands.",
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
          <MapPin className="h-4 w-4 text-accent" />
          Geographic Context
        </h2>

        {/* State Selector */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
          >
            <MapPin className="h-3 w-3 text-accent" />
            {current.code} — {current.name}
            <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute right-0 top-full mt-1 z-10 w-52 rounded-lg border border-border bg-card shadow-lg overflow-hidden"
              >
                {states.map((state) => (
                  <button
                    key={state.code}
                    onClick={() => {
                      setSelectedState(state.code);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                      selectedState === state.code
                        ? "bg-secondary text-foreground font-medium"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    }`}
                  >
                    <span>{state.name}</span>
                    <span className="text-[10px] text-muted-foreground">{state.region}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* State Insights */}
      <div className="space-y-2">
        {insights.map((insight, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
            <span className="mt-1.5 h-1 w-1 rounded-full bg-accent shrink-0" />
            <span className="leading-relaxed">{insight}</span>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground/60 mt-3">
        Geographic context is informational only. Data sourced from public records and reporting.
      </p>
    </div>
  );
};

export default GeographicContext;
