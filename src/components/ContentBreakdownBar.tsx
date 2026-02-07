import { FileText, Quote, Eye } from "lucide-react";

interface ContentBreakdownBarProps {
  factual: number;
  opinion: number;
  interpretation: number;
  variant?: "compact" | "prominent";
}

const ContentBreakdownBar = ({ factual, opinion, interpretation, variant = "compact" }: ContentBreakdownBarProps) => {
  const isProminent = variant === "prominent";

  return (
    <div className={isProminent ? "rounded-xl border border-border bg-card p-4" : ""}>
      {isProminent && (
        <div className="text-xs font-semibold text-foreground mb-3 font-display">
          Content Composition
        </div>
      )}

      {/* Bar */}
      <div className={`flex overflow-hidden rounded-full bg-muted ${isProminent ? "h-3" : "h-1.5"}`}>
        <div
          className="h-full bg-signal-fact transition-all"
          style={{ width: `${factual}%` }}
        />
        <div
          className="h-full bg-signal-opinion transition-all"
          style={{ width: `${opinion}%` }}
        />
        <div
          className="h-full bg-signal-interpretation transition-all"
          style={{ width: `${interpretation}%` }}
        />
      </div>

      {/* Legend */}
      <div className={`flex items-center gap-4 mt-2 ${isProminent ? "text-xs" : "text-[10px]"} text-muted-foreground`}>
        <span className="flex items-center gap-1.5">
          {isProminent && <FileText className="h-3 w-3 text-signal-fact" />}
          {!isProminent && <span className="h-1.5 w-1.5 rounded-full bg-signal-fact" />}
          Factual {isProminent && <span className="font-medium text-foreground">{factual}%</span>}
          {!isProminent && `${factual}%`}
        </span>
        <span className="flex items-center gap-1.5">
          {isProminent && <Quote className="h-3 w-3 text-signal-opinion" />}
          {!isProminent && <span className="h-1.5 w-1.5 rounded-full bg-signal-opinion" />}
          Opinion {isProminent && <span className="font-medium text-foreground">{opinion}%</span>}
          {!isProminent && `${opinion}%`}
        </span>
        <span className="flex items-center gap-1.5">
          {isProminent && <Eye className="h-3 w-3 text-signal-interpretation" />}
          {!isProminent && <span className="h-1.5 w-1.5 rounded-full bg-signal-interpretation" />}
          Analysis {isProminent && <span className="font-medium text-foreground">{interpretation}%</span>}
          {!isProminent && `${interpretation}%`}
        </span>
      </div>
    </div>
  );
};

export default ContentBreakdownBar;
