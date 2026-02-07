import { motion } from "framer-motion";
import { Users, ScrollText, BookOpen, Building, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
const civicTools = [{
  id: "representatives",
  title: "Representative Finder",
  description: "Locate your local, state, and federal representatives. View contact information and jurisdictions.",
  icon: Users
}, {
  id: "legislation",
  title: "Issue & Legislation Tracker",
  description: "Browse active legislation related to selected topics. View bill status, sponsors, and summaries.",
  icon: ScrollText
}, {
  id: "education",
  title: "Civic Education Resources",
  description: "High-level explanations of civic processes — how a bill becomes law, how elections work, and more.",
  icon: BookOpen
}, {
  id: "organizations",
  title: "Related Organizations Directory",
  description: "Browse organizations connected to topics you follow. No ranking, endorsement, or calls to action.",
  icon: Building
}];
const CivicToolsPage = () => {
  return <div>
      <motion.div initial={{
      opacity: 0,
      y: -10
    }} animate={{
      opacity: 1,
      y: 0
    }} className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-2">Em-pact Links</h1>
        <p className="text-muted-foreground text-sm max-w-lg">
          Neutral civic infrastructure you can explore independently. These tools are separate from news content and designed for clarity, not persuasion.
        </p>
      </motion.div>

      {/* Info Banner */}
      <div className="rounded-xl bg-civic-bg border border-civic/20 p-4 mb-8">
        <p className="text-sm text-foreground/80">About Civic Tools: Intentionally separated from news content to avoid conflating information with advocacy. No actions are suggested or promoted.<strong className="text-foreground">About Civic Tools:</strong> This section provides factual civic information as a public resource. It is intentionally separated from news content to avoid conflating information with advocacy. No actions are suggested or promoted.
        </p>
      </div>

      {/* Tool Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {civicTools.map((tool, i) => <motion.div key={tool.id} initial={{
        opacity: 0,
        y: 16
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: i * 0.08,
        duration: 0.3
      }}>
            <div className="group rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:shadow-md hover:border-civic/30 cursor-pointer h-full">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-civic-bg">
                  <tool.icon className="h-5 w-5 text-civic" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-1 group-hover:text-civic transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {tool.description}
                  </p>
                  <span className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-civic opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </div>
          </motion.div>)}
      </div>

      {/* Topics */}
      <div className="mt-8 rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-sm font-semibold text-foreground mb-3">Topics Covered</h2>
        <div className="flex gap-2">
          {["Politics", "Climate", "Business"].map(topic => <span key={topic} className="civic-badge">{topic}</span>)}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Additional topics will be added as the platform expands.
        </p>
      </div>
    </div>;
};
export default CivicToolsPage;