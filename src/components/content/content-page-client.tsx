"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Lightbulb, FileText, CheckCircle, XCircle, Eye, RefreshCw } from "lucide-react";
import { generateIdeas, createContentFromIdea, approveContent, rejectContent, getContentItems } from "@/app/actions/content-manager";
import { PLATFORM_CAPABILITIES } from "@/types/content";
import type { Platform, ContentObjective, ContentIdea, ContentDraft } from "@/types/content";
import { cn } from "@/lib/utils";

interface ContentItem {
  id: string;
  platform: string;
  type: string;
  title: string;
  topic: string;
  objective: string;
  pillar: string;
  persona_name: string | null;
  status: string;
  caption: string | null;
  hook: string | null;
  cta: string | null;
  quality_score: number | null;
  quality_status: string | null;
  created_at: string;
}

interface SocialObservation {
  id: string;
  title: string;
  summary: string;
  observation_type: string;
  severity: string;
}

interface Strategy {
  primary_objective: string | null;
  content_pillars: string[] | null;
  target_audiences: string[] | null;
}

interface Props {
  businessId: string;
  initialContent: ContentItem[];
  socialObservations: SocialObservation[];
  strategy: Strategy | null;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    idea: "bg-gray-100 text-gray-800",
    brief: "bg-blue-100 text-blue-800",
    draft: "bg-amber-100 text-amber-800",
    review: "bg-orange-100 text-orange-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };
  return <Badge className={styles[status] || "bg-gray-100 text-gray-800"}>{status}</Badge>;
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

export function ContentPageClient({
  businessId,
  initialContent,
  socialObservations,
  strategy,
}: Props) {
  const [content, setContent] = useState<ContentItem[]>(initialContent);
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("instagram");
  const [selectedPillar, setSelectedPillar] = useState<string>(strategy?.content_pillars?.[0] || "Education");
  const [selectedObjective, setSelectedObjective] = useState<ContentObjective>("education");
  const [activeTab, setActiveTab] = useState("ideas");
  const [generatedDraft, setGeneratedDraft] = useState<{
    contentId: string;
    draft: ContentDraft;
    review: { approved: boolean; score: number; status: string; issues: string[]; warnings: string[] };
    claimValidation: { valid: boolean; unsupportedClaims: string[]; warnings: string[] };
  } | null>(null);

  const pillars = strategy?.content_pillars || ["Education", "Product", "Social Proof", "Community", "Promotion"];
  const ideasCount = ideas.length;
  const draftsCount = content.filter((c) => c.status === "draft").length;
  const reviewCount = content.filter((c) => c.status === "review").length;
  const approvedCount = content.filter((c) => c.status === "approved").length;

  const handleGenerateIdeas = async () => {
    setGenerating(true);
    try {
      const result = await generateIdeas({
        businessId,
        platform: selectedPlatform,
        objective: selectedObjective,
        pillar: selectedPillar,
        count: 5,
      });
      setIdeas(result.ideas);
      setActiveTab("ideas");
    } catch {
      // silent
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateDraft = async (idea: ContentIdea) => {
    setCreating(idea.title);
    setGeneratedDraft(null);
    try {
      const result = await createContentFromIdea({
        businessId,
        idea,
        platform: selectedPlatform,
      });
      setGeneratedDraft(result);
      const updated = await getContentItems(businessId);
      setContent(updated as ContentItem[]);
      setActiveTab("drafts");
    } catch {
      // silent
    } finally {
      setCreating(null);
    }
  };

  const handleApprove = async (id: string) => {
    await approveContent(id, businessId);
    setContent((prev) => prev.map((c) => (c.id === id ? { ...c, status: "approved" } : c)));
  };

  const handleReject = async (id: string) => {
    await rejectContent(id, businessId);
    setContent((prev) => prev.map((c) => (c.id === id ? { ...c, status: "rejected" } : c)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Content Manager</h1>
          <p className="text-muted-foreground">Create content informed by your Business Brain and Social Intelligence.</p>
        </div>
      </div>

      {socialObservations.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Today&apos;s strategy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {strategy?.primary_objective && (
              <p className="text-sm"><span className="font-medium">Goal:</span> {strategy.primary_objective.replace(/_/g, " ")}</p>
            )}
            {strategy?.target_audiences?.[0] && (
              <p className="text-sm"><span className="font-medium">Primary audience:</span> {strategy.target_audiences[0]}</p>
            )}
            <div className="text-sm">
              <span className="font-medium">Today&apos;s opportunity:</span>
              <p className="text-muted-foreground mt-1">{socialObservations[0].title} — {socialObservations[0].summary.slice(0, 120)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Generate content</CardTitle>
          <CardDescription>Select platform, pillar, and objective to generate ideas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Platform</label>
              <Select value={selectedPlatform} onValueChange={(v) => setSelectedPlatform(v as Platform)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(PLATFORM_CAPABILITIES).map((p) => (
                    <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Pillar</label>
              <Select value={selectedPillar} onValueChange={setSelectedPillar}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pillars.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Objective</label>
              <Select value={selectedObjective} onValueChange={(v) => setSelectedObjective(v as ContentObjective)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["education", "awareness", "engagement", "trust", "lead_generation", "sales", "community", "retention"].map((o) => (
                    <SelectItem key={o} value={o}>{o.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerateIdeas} disabled={generating}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lightbulb className="h-4 w-4 mr-2" />}
              Generate ideas
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedDraft && (
        <Card className={cn("border-2", generatedDraft.claimValidation.valid ? "border-green-200" : "border-amber-200")}>
          <CardHeader>
            <CardTitle>Draft ready</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Hook:</span>
                <p className="mt-1">{generatedDraft.draft.hook}</p>
              </div>
              <div>
                <span className="font-medium">CTA:</span>
                <p className="mt-1">{generatedDraft.draft.cta}</p>
              </div>
            </div>
            <div>
              <span className="font-medium text-sm">Caption:</span>
              <p className="mt-1 text-sm whitespace-pre-wrap">{generatedDraft.draft.caption}</p>
            </div>
            {generatedDraft.draft.hashtags && generatedDraft.draft.hashtags.length > 0 && (
              <div className="text-sm">
                <span className="font-medium">Hashtags:</span> {generatedDraft.draft.hashtags.join(" ")}
              </div>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleApprove(generatedDraft.contentId)}>
                <CheckCircle className="h-4 w-4 mr-1" /> Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleReject(generatedDraft.contentId)}>
                <XCircle className="h-4 w-4 mr-1" /> Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="ideas" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="ideas">Ideas ({ideasCount})</TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({draftsCount})</TabsTrigger>
          <TabsTrigger value="review">Review ({reviewCount})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedCount})</TabsTrigger>
          <TabsTrigger value="library">Library ({content.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="ideas" className="space-y-4">
          {ideas.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No ideas yet. Click &quot;Generate ideas&quot; to create content ideas.
              </CardContent>
            </Card>
          ) : (
            ideas.map((idea, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{idea.title}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{idea.pillar}</Badge>
                        <Badge variant="outline">{idea.objective.replace(/_/g, " ")}</Badge>
                        <Badge variant="outline">{idea.format.replace(/_/g, " ")}</Badge>
                        {idea.personaName && <Badge variant="secondary">{idea.personaName}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{idea.rationale}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleCreateDraft(idea)}
                      disabled={creating === idea.title}
                    >
                      {creating === idea.title ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <FileText className="h-4 w-4 mr-1" />
                      )}
                      Generate draft
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="drafts" className="space-y-4">
          {content.filter((c) => c.status === "draft").length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No drafts yet. Generate content from ideas.
              </CardContent>
            </Card>
          ) : (
            content.filter((c) => c.status === "draft").map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{item.title}</p>
                        <StatusBadge status={item.status} />
                      </div>
                      {item.hook && <p className="text-sm mt-1">{item.hook}</p>}
                      <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                        <span>{item.platform}</span>
                        <span>•</span>
                        <span>{item.pillar}</span>
                        <span>•</span>
                        <span>{item.objective.replace(/_/g, " ")}</span>
                        {item.persona_name && <><span>•</span><span>{item.persona_name}</span></>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => handleApprove(item.id)}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleReject(item.id)}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          {content.filter((c) => c.status === "review").length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No content in review.
              </CardContent>
            </Card>
          ) : (
            content.filter((c) => c.status === "review").map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{item.title}</p>
                        <StatusBadge status={item.status} />
                      </div>
                      {item.caption && <p className="text-sm mt-1 line-clamp-3">{item.caption}</p>}
                      <p className="text-xs text-muted-foreground mt-2">Needs review — claims may be unsupported</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => handleApprove(item.id)}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleReject(item.id)}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {content.filter((c) => c.status === "approved").length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No approved content yet.
              </CardContent>
            </Card>
          ) : (
            content.filter((c) => c.status === "approved").map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="font-medium">{item.title}</p>
                    <StatusBadge status={item.status} />
                  </div>
                  {item.hook && <p className="text-sm mt-1">{item.hook}</p>}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          {content.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No content items yet.
              </CardContent>
            </Card>
          ) : (
            content.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{item.title}</p>
                        <StatusBadge status={item.status} />
                        <Badge variant="outline">{item.platform}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(item.created_at)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
