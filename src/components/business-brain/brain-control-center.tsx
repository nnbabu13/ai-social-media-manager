"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle, AlertTriangle, Clock, Brain, Shield, Megaphone, Settings,
  BookOpen, Lightbulb, Target, ArrowRight, Zap, ChevronRight,
} from "lucide-react";
import type { BrainReadiness } from "@/types/brain-readiness";
import type { BusinessBrainContext } from "@/types/business-brain";
import { getDomainDisplayName, getStatusIcon } from "@/lib/business-brain/domains";
import { REQUIRED_DOMAINS, OPTIONAL_DOMAINS, FUTURE_DOMAINS } from "@/types/brain-readiness";
import { ACTION_LABELS } from "@/types/ai-operating-rules";
import type { AIActionType } from "@/types/ai-operating-rules";

interface BrainControlCenterProps {
  brain: BusinessBrainContext;
  readiness: BrainReadiness;
}

function formatActionLabel(actionType: string): string {
  return ACTION_LABELS[actionType as AIActionType] || actionType.replace(/_/g, " ");
}

function CircularProgress({ value, size = 180, strokeWidth = 10, isReady }: {
  value: number; size?: number; strokeWidth?: number; isReady: boolean;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const color = isReady ? "#22c55e" : value >= 75 ? "#f59e0b" : value >= 50 ? "#f97316" : "#ef4444";
  const glowColor = isReady ? "rgba(34,197,94,0.15)" : value >= 75 ? "rgba(245,158,11,0.15)" : "rgba(249,115,22,0.15)";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Glow */}
      <div
        className="absolute inset-0 rounded-full blur-2xl transition-all duration-1000"
        style={{ background: glowColor }}
      />
      <svg width={size} height={size} className="relative -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor" strokeWidth={strokeWidth}
          className="text-white/[0.06]"
        />
        {/* Fill */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-extrabold tracking-tight text-white">{value}</span>
        <span className="text-sm font-medium text-white/40 -mt-1">%</span>
      </div>
    </div>
  );
}

export function BrainControlCenter({ brain, readiness }: BrainControlCenterProps) {
  const { score, status, required_missing, optional_missing, future_domains } = readiness;
  const isReady = status === "ready";

  const requiredDomains = readiness.domains.filter(d =>
    REQUIRED_DOMAINS.includes(d.domain as typeof REQUIRED_DOMAINS[number])
  );

  const optionalDomains = readiness.domains.filter(d =>
    OPTIONAL_DOMAINS.includes(d.domain as typeof OPTIONAL_DOMAINS[number])
  );

  const autoActions = brain.operations?.operating_rules.filter(r => r.mode === "auto") ?? [];
  const approvalActions = brain.operations?.operating_rules.filter(r => r.mode === "approval") ?? [];
  const humanOnlyActions = brain.operations?.operating_rules.filter(r => r.mode === "human_only") ?? [];

  const location = [brain.business.city, brain.business.region, brain.business.country].filter(Boolean).join(", ");

  const milestones = [
    { pct: 0, label: "Just started" },
    { pct: 25, label: "Basic info" },
    { pct: 50, label: "Good progress" },
    { pct: 75, label: "Almost ready" },
    { pct: 100, label: "Complete" },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* ─── Hero Header ─── */}
      <div className="flex items-center gap-3 pt-2">
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/[0.06] border border-white/[0.08]">
          <Brain className="h-5 w-5 text-white/70" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">AI Business Brain</h1>
          <p className="text-sm text-white/40 mt-0.5">
            Everything your AI manager knows, how it operates, and how it communicates.
          </p>
        </div>
      </div>

      {/* ─── Readiness Hero ─── */}
      <Card className="border-white/[0.08] bg-white/[0.02] overflow-hidden">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row items-center gap-10">

            {/* Circular Score */}
            <div className="shrink-0">
              <CircularProgress value={score} isReady={isReady} />
            </div>

            {/* Right side info */}
            <div className="flex-1 space-y-6 text-center lg:text-left">

              {/* Status */}
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase text-white/30 mb-1">System Status</p>
                <h2 className={`text-xl font-bold ${isReady ? "text-green-400" : "text-amber-400"}`}>
                  {isReady ? "Your AI is Ready" : "Your AI is Almost Ready"}
                </h2>
                <p className="text-sm text-white/50 mt-1">
                  {isReady
                    ? "All core information is in place."
                    : `${required_missing.length} important piece${required_missing.length !== 1 ? "s" : ""} still needed.`
                  }
                </p>
              </div>

              {/* Milestones */}
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  {milestones.map((m, i) => (
                    <div key={m.pct} className="flex-1 flex flex-col items-center relative">
                      {/* Line segment */}
                      {i > 0 && (
                        <div className="absolute top-[5px] right-1/2 w-full h-[2px] -z-0">
                          <div className={`h-full rounded-full ${score >= m.pct ? "bg-white/20" : "bg-white/[0.06]"}`} />
                        </div>
                      )}
                      {/* Dot */}
                      <div className={`relative z-10 h-[10px] w-[10px] rounded-full border-2 transition-all duration-500 ${
                        score >= m.pct
                          ? isReady ? "border-green-400 bg-green-400/30" : "border-amber-400 bg-amber-400/30"
                          : "border-white/10 bg-white/[0.04]"
                      }`} />
                      <span className="text-[10px] text-white/30 mt-1.5 whitespace-nowrap">{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing items */}
              {!isReady && required_missing.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-400/80">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium">Still needed:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {required_missing.map(d => (
                      <Badge
                        key={d.domain}
                        variant="secondary"
                        className="bg-amber-400/10 text-amber-300 border border-amber-400/20 hover:bg-amber-400/15 text-xs"
                      >
                        {getDomainDisplayName(d.domain)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Ready message */}
              {isReady && (
                <div className="flex items-center gap-2 text-green-400/80">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">All core domains complete.</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── AI Knowledge Summary ─── */}
      <Card className="border-white/[0.08] bg-white/[0.02]">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <Lightbulb className="h-4 w-4 text-white/40" />
            <h2 className="text-sm font-semibold tracking-wide uppercase text-white/40">
              If you hired an AI social-media manager today
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-8">
            {/* Left: Knows */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-md bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                </div>
                <h3 className="text-sm font-semibold text-green-400">It would know</h3>
              </div>
              <ul className="space-y-2.5">
                {brain.business.name && (
                  <li className="flex items-start gap-3 group">
                    <CheckCircle className="h-4 w-4 text-green-500/60 mt-0.5 shrink-0 group-hover:text-green-400 transition-colors" />
                    <span className="text-sm text-white/70">Who you are: <strong className="text-white/90">{brain.business.name}</strong>{brain.business.category ? ` (${brain.business.category})` : ""}</span>
                  </li>
                )}
                {brain.products.length > 0 && (
                  <li className="flex items-start gap-3 group">
                    <CheckCircle className="h-4 w-4 text-green-500/60 mt-0.5 shrink-0 group-hover:text-green-400 transition-colors" />
                    <span className="text-sm text-white/70">What you sell: <strong className="text-white/90">{brain.products.map(p => p.name).join(", ")}</strong></span>
                  </li>
                )}
                {brain.services.length > 0 && (
                  <li className="flex items-start gap-3 group">
                    <CheckCircle className="h-4 w-4 text-green-500/60 mt-0.5 shrink-0 group-hover:text-green-400 transition-colors" />
                    <span className="text-sm text-white/70">Services: <strong className="text-white/90">{brain.services.map(s => s.name).join(", ")}</strong></span>
                  </li>
                )}
                {brain.business.target_customers && (
                  <li className="flex items-start gap-3 group">
                    <CheckCircle className="h-4 w-4 text-green-500/60 mt-0.5 shrink-0 group-hover:text-green-400 transition-colors" />
                    <span className="text-sm text-white/70">Customers: <strong className="text-white/90">{brain.business.target_customers}</strong></span>
                  </li>
                )}
                {brain.brand?.tone && (
                  <li className="flex items-start gap-3 group">
                    <CheckCircle className="h-4 w-4 text-green-500/60 mt-0.5 shrink-0 group-hover:text-green-400 transition-colors" />
                    <span className="text-sm text-white/70">Brand voice: <strong className="text-white/90">{brain.brand.tone}</strong></span>
                  </li>
                )}
                {brain.goals.length > 0 && (
                  <li className="flex items-start gap-3 group">
                    <CheckCircle className="h-4 w-4 text-green-500/60 mt-0.5 shrink-0 group-hover:text-green-400 transition-colors" />
                    <span className="text-sm text-white/70">Goals: <strong className="text-white/90">{brain.goals.find(g => g.is_primary)?.goal || brain.goals[0].goal}</strong></span>
                  </li>
                )}
                {brain.strategy?.primary_objective && (
                  <li className="flex items-start gap-3 group">
                    <CheckCircle className="h-4 w-4 text-green-500/60 mt-0.5 shrink-0 group-hover:text-green-400 transition-colors" />
                    <span className="text-sm text-white/70">Strategy: <strong className="text-white/90">{brain.strategy.primary_objective.objective}</strong></span>
                  </li>
                )}
                {brain.operations?.autonomy_profile && (
                  <li className="flex items-start gap-3 group">
                    <CheckCircle className="h-4 w-4 text-green-500/60 mt-0.5 shrink-0 group-hover:text-green-400 transition-colors" />
                    <span className="text-sm text-white/70">AI mode: <strong className="text-white/90">{brain.operations.autonomy_profile}</strong></span>
                  </li>
                )}
              </ul>
            </div>

            {/* Divider */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-white/[0.06]" />

            {/* Right: Would NOT */}
            <div className="space-y-3 mt-6 md:mt-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-md bg-red-500/10 flex items-center justify-center">
                  <Shield className="h-3.5 w-3.5 text-red-400" />
                </div>
                <h3 className="text-sm font-semibold text-red-400">It would NOT</h3>
              </div>
              <ul className="space-y-2.5">
                {humanOnlyActions.length > 0 && (
                  <li className="flex items-start gap-3 group">
                    <Shield className="h-4 w-4 text-red-500/60 mt-0.5 shrink-0 group-hover:text-red-400 transition-colors" />
                    <span className="text-sm text-white/70">Handle complaints, refunds, or legal issues without you</span>
                  </li>
                )}
                {(brain.business_persona?.restricted_claims?.length ?? 0) > 0 && (
                  <li className="flex items-start gap-3 group">
                    <Shield className="h-4 w-4 text-red-500/60 mt-0.5 shrink-0 group-hover:text-red-400 transition-colors" />
                    <span className="text-sm text-white/70">Make unsupported claims</span>
                  </li>
                )}
                <li className="flex items-start gap-3 group">
                  <Shield className="h-4 w-4 text-red-500/60 mt-0.5 shrink-0 group-hover:text-red-400 transition-colors" />
                  <span className="text-sm text-white/70">Negotiate prices or promise refunds without approval</span>
                </li>
                <li className="flex items-start gap-3 group">
                  <Shield className="h-4 w-4 text-red-500/60 mt-0.5 shrink-0 group-hover:text-red-400 transition-colors" />
                  <span className="text-sm text-white/70">Publish content without your approval</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Key Facts ─── */}
      <div>
        <h2 className="text-xs font-semibold tracking-widest uppercase text-white/30 mb-3 px-1">Key Facts</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <FactCard label="Business" value={brain.business.name} icon={<Brain className="h-4 w-4" />} href="/business-brain/business" />
          <FactCard label="Category" value={brain.business.category || "Not set"} icon={<Tag className="h-4 w-4" />} href="/business-brain/business" />
          <FactCard label="Location" value={location || "Not set"} icon={<MapPinIcon />} href="/business-brain/business" />
          <FactCard label="Primary Goal" value={brain.goals.find(g => g.is_primary)?.goal || "Not set"} icon={<Target className="h-4 w-4" />} href="/business-brain/strategy" />
          <FactCard label="Audience" value={brain.business.target_customers || "Not set"} icon={<UsersIcon />} href="/business-brain/audience" />
          <FactCard label="Brand" value={brain.brand?.tone || brain.business_persona?.tone?.join(", ") || "Not set"} icon={<Megaphone className="h-4 w-4" />} href="/business-brain/brand" />
          <FactCard label="Strategy" value={brain.strategy?.primary_objective?.objective || "Not set"} icon={<Zap className="h-4 w-4" />} href="/business-brain/strategy" />
          <FactCard label="AI Mode" value={brain.operations?.autonomy_profile || "Not configured"} icon={<Settings className="h-4 w-4" />} href="/business-brain/operations" />
        </div>
      </div>

      {/* ─── Operational Readiness ─── */}
      <Card className="border-white/[0.08] bg-white/[0.02]">
        <CardContent className="p-6">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-white/30 mb-4">Operational Readiness</h2>
          <div className="grid grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-3">
            {requiredDomains.map((domain) => (
              <div key={domain.domain} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors">
                <span className="text-sm">{getStatusIcon(domain.status)}</span>
                <span className={`text-sm ${domain.status === "complete" ? "text-white/70" : "text-amber-400/80 font-medium"}`}>
                  {getDomainDisplayName(domain.domain)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── Optional Enrichment ─── */}
      {optionalDomains.length > 0 && (
        <Card className="border-white/[0.06] bg-white/[0.015]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xs font-semibold tracking-widest uppercase text-white/25">Optional Enrichment</h2>
              <Badge variant="outline" className="text-[10px] border-white/[0.08] text-white/30 bg-transparent">Optional</Badge>
            </div>
            <p className="text-xs text-white/25 mb-4">Can make your AI smarter, but not required.</p>
            <div className="grid grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-3">
              {optionalDomains.map((domain) => (
                <div key={domain.domain} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors">
                  <span className="text-sm">{getStatusIcon(domain.status)}</span>
                  <span className="text-sm text-white/50">{getDomainDisplayName(domain.domain)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Future Intelligence ─── */}
      {future_domains.length > 0 && (
        <Card className="border-white/[0.06] bg-white/[0.015]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-white/25" />
                <h2 className="text-xs font-semibold tracking-widest uppercase text-white/25">Future Intelligence</h2>
              </div>
              <Badge variant="outline" className="text-[10px] border-white/[0.08] text-white/30 bg-transparent">After Connect</Badge>
            </div>
            <p className="text-xs text-white/25 mb-4">Learned automatically after connecting social accounts.</p>
            <div className="grid grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-3">
              {future_domains.map((domain) => (
                <div key={domain.domain} className="flex items-center gap-2.5 px-3 py-2 rounded-lg">
                  <div className="h-2 w-2 rounded-full bg-white/10" />
                  <span className="text-sm text-white/30">{getDomainDisplayName(domain.domain)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── AI Behavior Summary ─── */}
      <Card className="border-white/[0.08] bg-white/[0.02]">
        <CardContent className="p-6">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-white/30 mb-5">How Your AI Will Behave</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Auto */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                </div>
                <h3 className="text-sm font-semibold text-green-400">Automatically</h3>
              </div>
              <ul className="space-y-1.5">
                {autoActions.length > 0 ? autoActions.map(r => (
                  <li key={r.action_type} className="flex items-center gap-2 text-sm text-white/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400/60 shrink-0" />
                    {formatActionLabel(r.action_type)}
                  </li>
                )) : <li className="text-sm text-white/25">No actions set to automatic</li>}
              </ul>
            </div>
            {/* Approval */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <h3 className="text-sm font-semibold text-amber-400">Ask You First</h3>
              </div>
              <ul className="space-y-1.5">
                {approvalActions.length > 0 ? approvalActions.map(r => (
                  <li key={r.action_type} className="flex items-center gap-2 text-sm text-white/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400/60 shrink-0" />
                    {formatActionLabel(r.action_type)}
                  </li>
                )) : <li className="text-sm text-white/25">No actions set to approval</li>}
              </ul>
            </div>
            {/* Human only */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-red-500/10 flex items-center justify-center">
                  <Shield className="h-3.5 w-3.5 text-red-400" />
                </div>
                <h3 className="text-sm font-semibold text-red-400">Human Only</h3>
              </div>
              <ul className="space-y-1.5">
                {humanOnlyActions.length > 0 ? humanOnlyActions.map(r => (
                  <li key={r.action_type} className="flex items-center gap-2 text-sm text-white/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400/60 shrink-0" />
                    {formatActionLabel(r.action_type)}
                  </li>
                )) : <li className="text-sm text-white/25">No actions set to human only</li>}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Section Navigation ─── */}
      <div>
        <h2 className="text-xs font-semibold tracking-widest uppercase text-white/30 mb-3 px-1">Sections</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <NavCard title="Business" description="Identity, offerings, and facts" icon={<Brain className="h-4 w-4" />} href="/business-brain/business" />
          <NavCard title="Audience" description="Customer personas and needs" icon={<UsersIcon />} href="/business-brain/audience" />
          <NavCard title="Brand" description="Tone, personality, and positioning" icon={<Megaphone className="h-4 w-4" />} href="/business-brain/brand" />
          <NavCard title="Strategy" description="Content plan and conversion" icon={<Target className="h-4 w-4" />} href="/business-brain/strategy" />
          <NavCard title="Operations" description="AI rules and autonomy" icon={<Settings className="h-4 w-4" />} href="/business-brain/operations" />
          <NavCard title="Knowledge" description="Search all business information" icon={<BookOpen className="h-4 w-4" />} href="/business-brain/knowledge" />
        </div>
      </div>

      {/* ─── Next Step CTA ─── */}
      {isReady && (
        <Card className="border-green-500/20 bg-green-500/[0.03]">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-green-500/10 shrink-0">
                <Zap className="h-5 w-5 text-green-400" />
              </div>
              <div className="text-center sm:text-left flex-1">
                <h3 className="text-sm font-semibold text-green-400">Ready for the next step</h3>
                <p className="text-sm text-white/40 mt-0.5">
                  Connect your social accounts so your AI can begin learning from your real social presence.
                </p>
              </div>
              <Button asChild className="bg-green-500 hover:bg-green-600 text-white shrink-0">
                <a href="/accounts" className="flex items-center gap-2">
                  Connect Accounts <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ─── Sub-components ─── */

function FactCard({ label, value, icon, href }: { label: string; value: string; icon?: React.ReactNode; href?: string }) {
  const content = (
    <Card className="border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer h-full group">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-white/20 group-hover:text-white/40 transition-colors">{icon}</span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-white/30">{label}</span>
        </div>
        <div className="text-sm font-semibold text-white/80 truncate">{value}</div>
      </CardContent>
    </Card>
  );
  if (href) return <a href={href}>{content}</a>;
  return content;
}

function NavCard({ title, description, icon, href }: { title: string; description: string; icon: React.ReactNode; href: string }) {
  return (
    <a href={href}>
      <Card className="border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer h-full group">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/50 group-hover:text-white/70 group-hover:bg-white/[0.08] transition-all">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">{title}</div>
              <div className="text-xs text-white/35 mt-0.5">{description}</div>
            </div>
            <ChevronRight className="h-4 w-4 text-white/15 group-hover:text-white/40 transition-colors shrink-0" />
          </div>
        </CardContent>
      </Card>
    </a>
  );
}

/* ─── Inline icon helpers (avoid extra imports) ─── */

function Tag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
