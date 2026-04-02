import React from "react";
import { Leaf, Home, Activity, BarChart3, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "dashboard",   label: "Dashboard",   icon: Home },
  { id: "analyzer",   label: "Analyzer",    icon: Activity },
  { id: "comparison", label: "Comparison",  icon: BarChart3 },
  { id: "suggestions",label: "Suggestions", icon: Sparkles },
];

export const Sidebar: React.FC<Props> = ({ activeTab, onTabChange }) => (
  <div className="w-64 border-r border-border bg-background h-screen sticky top-0 flex flex-col hidden md:flex shrink-0">
    {/* Logo */}
    <div className="p-6 border-b border-border">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-green-500/10 rounded-lg">
          <Leaf className="h-5 w-5 text-green-500" />
        </div>
        <div>
          <h1 className="font-bold text-sm leading-none">Token Analyzer</h1>
          <p className="text-xs text-muted-foreground mt-0.5">AI Sustainability</p>
        </div>
      </div>
    </div>

    {/* Nav */}
    <nav className="flex-1 p-3 space-y-1">
      {navItems.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
            activeTab === id
              ? "bg-green-500/10 text-green-600 dark:text-green-400"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
          {activeTab === id && (
            <div className="ml-auto h-1.5 w-1.5 rounded-full bg-green-500" />
          )}
        </button>
      ))}
    </nav>

    {/* Footer card */}
    <div className="p-3 border-t border-border">
      <Card className="bg-green-500/5 border-green-500/20">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <Leaf className="h-4 w-4 text-green-500" />
            <span className="text-xs font-semibold text-green-600 dark:text-green-400">Go Green</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Optimize prompts to reduce your AI carbon footprint.
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
);
