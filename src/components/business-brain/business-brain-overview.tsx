"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Brain, Search, CheckCircle, AlertTriangle, Clock, ExternalLink, ArrowRight } from "lucide-react";
import type { BrainCompletenessResult, KnowledgeHealthWarning } from "@/types/business-brain";
import type { BrainReadiness, DomainReadiness } from "@/types/brain-readiness";
import { getDomainDisplayName, getStatusIcon } from "@/lib/business-brain/domains";
import { DomainFixIt } from "./domain-fix-it";
import { KnowledgeDialog, type KnowledgeType } from "./knowledge-dialog";
import { REQUIRED_DOMAINS, OPTIONAL_DOMAINS, FUTURE_DOMAINS } from "@/types/brain-readiness";

interface BusinessBrainOverviewProps {
  completeness: BrainCompletenessResult;
  warnings: KnowledgeHealthWarning[];
  readiness?: BrainReadiness;
  businessId: string;
  business: {
    name: string;
    category: string | null;
    description: string | null;
    website_url: string | null;
  };
  counts: {
    products: number;
    services: number;
    faqs: number;
    facts: number;
    locations: number;
    offers: number;
    personas: number;
    documents: number;
  };
}

export function BusinessBrainOverview({
  completeness,
  warnings,
  readiness,
  businessId,
  business,
  counts,
}: BusinessBrainOverviewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogType, setDialogType] = useState<KnowledgeType | null>(null);

  const score = readiness?.score ?? completeness.percentage;
  const isReady = readiness?.status === "ready";

  const requiredDomains = readiness?.domains.filter(d =>
    REQUIRED_DOMAINS.includes(d.domain as typeof REQUIRED_DOMAINS[number])
  ) ?? [];

  const optionalDomains = readiness?.domains.filter(d =>
    OPTIONAL_DOMAINS.includes(d.domain as typeof OPTIONAL_DOMAINS[number])
  ) ?? [];

  const futureDomains = readiness?.domains.filter(d =>
    FUTURE_DOMAINS.includes(d.domain as typeof FUTURE_DOMAINS[number])
  ) ?? [];

  const missingRequired = readiness?.required_missing ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Business Brain</h1>
          <p className="text-muted-foreground">
            The information your AI manager uses to understand your business.
          </p>
        </div>
      </div>

      {/* Main Readiness Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            {score}% Operationally Ready
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={score} className="h-3" />
          
          {isReady ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Your AI has the core information it needs to manage your business.</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">The AI still needs:</span>
              </div>
              <ul className="space-y-1 ml-7">
                {missingRequired.map((domain) => (
                  <li key={domain.domain} className="text-sm text-muted-foreground">
                    {domain.missing[0] || `${getDomainDisplayName(domain.domain)} needs more information`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Core Domains */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Core Domains</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {requiredDomains.map((domain) => (
              <div
                key={domain.domain}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50"
              >
                <span className="text-base">{getStatusIcon(domain.status)}</span>
                <span className="text-sm font-medium">{getDomainDisplayName(domain.domain)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Missing Domains - Fix It Section */}
      {missingRequired.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Fill in the missing pieces
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {missingRequired.map((domain) => (
              <DomainFixIt
                key={domain.domain}
                domain={domain.domain}
                missing={domain.missing}
                businessId={businessId}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Optional Enrichment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Optional Enrichment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {optionalDomains.map((domain) => (
              <div
                key={domain.domain}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50"
              >
                <span className="text-base">{getStatusIcon(domain.status)}</span>
                <span className="text-sm">{getDomainDisplayName(domain.domain)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Future Domains */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Available After Social Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {futureDomains.map((domain) => (
              <div
                key={domain.domain}
                className="flex items-center gap-2 p-2 rounded-md text-muted-foreground"
              >
                <span className="text-base">{getStatusIcon(domain.status)}</span>
                <span className="text-sm">{getDomainDisplayName(domain.domain)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Knowledge Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KnowledgeCard title="Products" count={counts.products} onClick={() => setDialogType("products")} />
        <KnowledgeCard title="Services" count={counts.services} onClick={() => setDialogType("services")} />
        <KnowledgeCard title="FAQs" count={counts.faqs} onClick={() => setDialogType("faqs")} />
        <KnowledgeCard title="Facts" count={counts.facts} onClick={() => setDialogType("facts")} />
        <KnowledgeCard title="Locations" count={counts.locations} onClick={() => setDialogType("locations")} />
        <KnowledgeCard title="Offers" count={counts.offers} onClick={() => setDialogType("offers")} />
        <KnowledgeCard title="Personas" count={counts.personas} onClick={() => setDialogType("personas")} />
        <KnowledgeCard
          title="Customer Profiling"
          count={counts.personas}
          href="/business-brain/profiling"
          badge={counts.personas > 0 ? "Completed" : "Not started"}
        />
        <KnowledgeCard
          title="Personas"
          count={0}
          href="/business-brain/personas"
          badge="Brand + Customers"
        />
        <KnowledgeCard
          title="Social Strategy"
          count={0}
          href="/business-brain/strategy"
          badge="Content Plan"
        />
        <KnowledgeCard
          title="AI Settings"
          count={0}
          href="/business-brain/operations"
          badge="Rules & Autonomy"
        />
      </div>

      {dialogType && (
        <KnowledgeDialog
          open={!!dialogType}
          onOpenChange={(open) => { if (!open) setDialogType(null); }}
          type={dialogType}
          businessId={businessId}
        />
      )}

      {/* Website Section */}
      {business.website_url && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Website Knowledge</h3>
                <p className="text-sm text-muted-foreground">
                  Your website is an additional knowledge source.{" "}
                  <Badge variant="secondary">Optional</Badge>
                </p>
              </div>
              <Button variant="outline" asChild>
                <a href={business.website_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Website
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KnowledgeCard({
  title,
  count,
  href,
  badge,
  onClick,
}: {
  title: string;
  count: number;
  href?: string;
  badge?: string;
  onClick?: () => void;
}) {
  const content = (
    <Card className="transition-colors hover:bg-muted/50 cursor-pointer">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{title}</span>
          {badge ? (
            <Badge variant={badge === "Completed" ? "default" : "outline"}>{badge}</Badge>
          ) : (
            <span className="text-2xl font-bold">{count}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <a href={href}>{content}</a>;
  }
  return <button onClick={onClick} className="text-left">{content}</button>;
}
