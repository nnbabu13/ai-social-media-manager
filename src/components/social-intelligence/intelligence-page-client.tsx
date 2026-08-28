"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Scan, AlertTriangle, Lightbulb, Users, MessageSquare, ChevronRight, X, Check, Eye } from "lucide-react";
import {
  triggerSocialScan,
  dismissObservation,
  acceptRecommendation,
  dismissRecommendation,
  reviewRecommendation,
  updateLead,
} from "@/app/actions/social-intelligence";
import { cn } from "@/lib/utils";

interface Observation {
  id: string | undefined;
  observation_type: string;
  severity: string;
  title: string;
  summary: string;
  evidence: Record<string, unknown>;
  confidence: number;
  status: string;
  created_at: string;
}

interface Recommendation {
  id: string | undefined;
  observation_id: string | null | undefined;
  title: string;
  description: string;
  action_type: string;
  priority: string;
  confidence: number;
  reason: string;
  status: string;
  created_at: string;
}

interface Lead {
  id: string | undefined;
  platform_user_id: string;
  name: string | null | undefined;
  username: string | null | undefined;
  source_type: string;
  intent: string;
  reason: string;
  status: string;
  confidence: number;
  created_at: string;
}

interface ScanJob {
  id: string;
  scan_type: string;
  status: string;
  observations_created: number;
  recommendations_created: number;
  leads_created: number;
  created_at: string;
  completed_at: string | null;
}

interface Props {
  businessId: string;
  initialObservations: Observation[];
  initialRecommendations: Recommendation[];
  initialLeads: Lead[];
  scanJobs: ScanJob[];
  connectedAccounts: Array<{ id: string; platform: string; account_name: string; status: string }>;
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    urgent: "bg-red-100 text-red-800 border-red-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    medium: "bg-amber-100 text-amber-800 border-amber-200",
    low: "bg-blue-100 text-blue-800 border-blue-200",
    info: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return <Badge className={styles[severity] || styles.info}>{severity}</Badge>;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function confidenceLabel(c: number): string {
  if (c >= 0.8) return "High confidence";
  if (c >= 0.5) return "Medium confidence";
  return "Low confidence";
}

function ObservationTypeIcon({ type }: { type: string }) {
  if (type.includes("complaint") || type.includes("sensitive")) return <AlertTriangle className="h-4 w-4" />;
  if (type.includes("lead") || type.includes("conversion")) return <Users className="h-4 w-4" />;
  if (type.includes("question") || type.includes("faq")) return <MessageSquare className="h-4 w-4" />;
  return <Lightbulb className="h-4 w-4" />;
}

export function IntelligencePageClient({
  businessId,
  initialObservations,
  initialRecommendations,
  initialLeads,
  scanJobs,
  connectedAccounts,
}: Props) {
  const [observations, setObservations] = useState<Observation[]>(initialObservations);
  const [recommendations, setRecommendations] = useState<Recommendation[]>(initialRecommendations);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ summary: string; nextMove?: string } | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const urgentCount = observations.filter((o) => o.severity === "urgent" || o.severity === "high").length;
  const newLeadCount = leads.filter((l) => l.status === "new").length;
  const newRecCount = recommendations.filter((r) => r.status === "new").length;

  const handleScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const result = await triggerSocialScan(businessId);
      setScanResult({ summary: result.summary, nextMove: result.nextMove });
      setObservations(result.observations as any);
      setRecommendations(result.recommendations as any);
      setLeads(result.leads as any);
    } catch {
      // silent
    } finally {
      setScanning(false);
    }
  };

  const handleDismissObs = async (id: string | undefined) => {
    if (!id) return;
    await dismissObservation(id, businessId);
    setObservations((prev) => prev.filter((o) => o.id !== id));
  };

  const handleAcceptRec = async (id: string | undefined) => {
    if (!id) return;
    await acceptRecommendation(id, businessId);
    setRecommendations((prev) => prev.map((r) => (r.id === id ? { ...r, status: "accepted" } : r)));
  };

  const handleDismissRec = async (id: string | undefined) => {
    if (!id) return;
    await dismissRecommendation(id, businessId);
    setRecommendations((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateLead = async (id: string | undefined, status: string) => {
    if (!id) return;
    await updateLead(id, status, businessId);
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Social Intelligence</h1>
          <p className="text-muted-foreground">What your AI has learned from your social presence.</p>
        </div>
        <Button onClick={handleScan} disabled={scanning || connectedAccounts.length === 0}>
          {scanning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Scan className="h-4 w-4 mr-2" />}
          {scanning ? "Scanning..." : "Scan now"}
        </Button>
      </div>

      {connectedAccounts.length === 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 text-sm text-amber-800">
            No social accounts connected. Connect accounts in the Accounts section to enable social intelligence.
          </CardContent>
        </Card>
      )}

      {scanResult && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <p className="text-sm text-green-800 font-medium">Scan complete</p>
            <p className="text-sm text-green-700 mt-1">{observations.length} observations, {recommendations.length} recommendations, {leads.length} leads</p>
          </CardContent>
        </Card>
      )}

      {(urgentCount > 0 || newLeadCount > 0 || newRecCount > 0) && (
        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Needs your attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {observations
              .filter((o) => o.severity === "urgent" || o.severity === "high")
              .slice(0, 3)
              .map((obs) => (
                <div key={obs.id} className="flex items-center justify-between p-3 rounded-md bg-red-50 border border-red-100">
                  <div className="flex items-center gap-2">
                    <ObservationTypeIcon type={obs.observation_type} />
                    <div>
                      <p className="text-sm font-medium">{obs.title}</p>
                      <p className="text-xs text-muted-foreground">{obs.summary.slice(0, 100)}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleDismissObs(obs.id)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            {newLeadCount > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-blue-50 border border-blue-100">
                <Users className="h-4 w-4 text-blue-600" />
                <p className="text-sm">{newLeadCount} new potential lead{newLeadCount > 1 ? "s" : ""}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="observations">Observations ({observations.length})</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations ({recommendations.length})</TabsTrigger>
          <TabsTrigger value="leads">Leads ({leads.length})</TabsTrigger>
          <TabsTrigger value="history">Scan History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s AI Read</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {scanResult?.summary ? (
                <p className="text-sm">{scanResult.summary}</p>
              ) : observations.length > 0 ? (
                <div className="space-y-2">
                  {observations.slice(0, 3).map((obs) => (
                    <div key={obs.id} className="flex items-start gap-2">
                      <ObservationTypeIcon type={obs.observation_type} />
                      <p className="text-sm">{obs.title}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Run a scan to see what your AI has learned.</p>
              )}
            </CardContent>
          </Card>

          {scanResult?.nextMove && (
            <Card>
              <CardHeader>
                <CardTitle>Next move</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{scanResult.nextMove}</p>
              </CardContent>
            </Card>
          )}

          {recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendations.slice(0, 3).map((rec) => (
                  <div key={rec.id} className="flex items-center justify-between p-3 rounded-md border">
                    <div>
                      <p className="text-sm font-medium">{rec.title}</p>
                      <p className="text-xs text-muted-foreground">{rec.description.slice(0, 100)}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleAcceptRec(rec.id)}>
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDismissRec(rec.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="observations" className="space-y-4">
          {observations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No observations yet. Run a scan to analyze your social data.
              </CardContent>
            </Card>
          ) : (
            observations.map((obs) => (
              <Card key={obs.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <ObservationTypeIcon type={obs.observation_type} />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{obs.title}</p>
                          <SeverityBadge severity={obs.severity} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{obs.summary}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{formatTimeAgo(obs.created_at)}</span>
                          <span>{confidenceLabel(obs.confidence)}</span>
                          <span className="capitalize">{obs.observation_type.replace(/_/g, " ")}</span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleDismissObs(obs.id)}>
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {recommendations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No recommendations yet. Run a scan to generate recommendations.
              </CardContent>
            </Card>
          ) : (
            recommendations.map((rec) => (
              <Card key={rec.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{rec.title}</p>
                        <SeverityBadge severity={rec.priority} />
                        <Badge variant="outline">{rec.action_type.replace(/_/g, " ")}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                      <p className="text-xs text-muted-foreground mt-2 italic">{rec.reason}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{formatTimeAgo(rec.created_at)}</span>
                        <span>{confidenceLabel(rec.confidence)}</span>
                        <span className="capitalize">Status: {rec.status}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleAcceptRec(rec.id)}>
                        Accept
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDismissRec(rec.id)}>
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="leads" className="space-y-4">
          {leads.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No potential leads detected yet.
              </CardContent>
            </Card>
          ) : (
            leads.map((lead) => (
              <Card key={lead.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{lead.name || lead.username || "Unknown user"}</p>
                        <Badge variant={lead.intent === "high" ? "default" : "secondary"}>
                          {lead.intent} intent
                        </Badge>
                        <Badge variant="outline">{lead.source_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{lead.reason}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{formatTimeAgo(lead.created_at)}</span>
                        <span>{confidenceLabel(lead.confidence)}</span>
                        <span className="capitalize">Status: {lead.status}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {lead.status === "new" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleUpdateLead(lead.id, "reviewing")}>
                            Review
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleUpdateLead(lead.id, "ignored")}>
                            Ignore
                          </Button>
                        </>
                      )}
                      {lead.status === "reviewing" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleUpdateLead(lead.id, "qualified")}>
                            Qualify
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleUpdateLead(lead.id, "ignored")}>
                            Ignore
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {scanJobs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No scan history yet.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Type</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Observations</th>
                      <th className="text-left p-3 font-medium">Recommendations</th>
                      <th className="text-left p-3 font-medium">Leads</th>
                      <th className="text-left p-3 font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanJobs.map((job) => (
                      <tr key={job.id} className="border-b last:border-0">
                        <td className="p-3">{job.scan_type}</td>
                        <td className="p-3">
                          <Badge variant={job.status === "completed" ? "default" : job.status === "failed" ? "destructive" : "secondary"}>
                            {job.status}
                          </Badge>
                        </td>
                        <td className="p-3">{job.observations_created}</td>
                        <td className="p-3">{job.recommendations_created}</td>
                        <td className="p-3">{job.leads_created}</td>
                        <td className="p-3">{formatTimeAgo(job.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
