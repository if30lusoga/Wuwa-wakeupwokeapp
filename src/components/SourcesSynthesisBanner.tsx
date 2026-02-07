import { Layers } from "lucide-react";

interface SourcesSynthesisBannerProps {
  sourceCount: number;
  sourceNames?: string[];
}

const SourcesSynthesisBanner = ({ sourceCount, sourceNames }: SourcesSynthesisBannerProps) => {
  return (
    <div className="rounded-xl gradient-card border border-border p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
          <Layers className="h-4 w-4 text-accent" />
        </div>
        <div>
          <div className="text-xs font-semibold text-foreground mb-0.5 font-display">
            Synthesized from {sourceCount} sources
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This summary combines reporting from multiple outlets to present a consolidated view of the event. No single source's framing is prioritized.
          </p>
          {sourceNames && sourceNames.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {sourceNames.map((name) => (
                <span key={name} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SourcesSynthesisBanner;
