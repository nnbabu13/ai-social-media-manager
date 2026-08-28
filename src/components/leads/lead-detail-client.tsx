"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft, AlertTriangle, DollarSign, Clock, MapPin, Package, User, MessageSquare, RefreshCw, Plus, Trash2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import {
  getLeadDetailAction,
  updateLeadAction,
  createFollowUpAction,
  completeFollowUpAction,
  cancelFollowUpAction,
  addLeadNoteAction,
  getMissingQualificationAction,
} from "@/app/actions/leads";
import type { LeadWithDetails, LeadFollowUp } from "@/types/leads";

interface LeadDetailClientProps {
  businessId: string;
  leadId: string;
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  new: { color: "bg-blue-100 text-blue-700", label: "New" },
  qualifying: { color: "bg-yellow-100 text-yellow-700", label: "Qualifying" },
  qualified: { color: "bg-green-100 text-green-700", label: "Qualified" },
  contacted: { color: "bg-purple-100 text-purple-700", label: "Contacted" },
  follow_up: { color: "bg-orange-100 text-orange-700", label: "Follow-up" },
  won: { color: "bg-emerald-100 text-emerald-700", label: "Won" },
  lost: { color: "bg-red-100 text-red-700", label: "Lost" },
  ignored: { color: "bg-gray-100 text-gray-500", label: "Ignored" },
  unqualified: { color: "bg-slate-100 text-slate-500", label: "Unqualified" },
};

const STAGE_CONFIG: Record<string, { color: string; label: string }> = {
  detected: { color: "bg-blue-100 text-blue-700", label: "Detected" },
  qualified: { color: "bg-green-100 text-green-700", label: "Qualified" },
  quotation: { color: "bg-purple-100 text-purple-700", label: "Quotation" },
  negotiation: { color: "bg-orange-100 text-orange-700", label: "Negotiation" },
  booked: { color: "bg-indigo-100 text-indigo-700", label: "Booked" },
  won: { color: "bg-emerald-100 text-emerald-700", label: "Won" },
  lost: { color: "bg-red-100 text-red-700", label: "Lost" },
};

const INTENT_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-700",
};

const FOLLOW_UP_STATUS: Record<string, { color: string; label: string }> = {
  pending: { color: "bg-yellow-100 text-yellow-700", label: "Pending" },
  completed: { color: "bg-green-100 text-green-700", label: "Completed" },
  cancelled: { color: "bg-gray-100 text-gray-500", label: "Cancelled" },
  overdue: { color: "bg-red-100 text-red-700", label: "Overdue" },
};

export function LeadDetailClient({ businessId, leadId }: LeadDetailClientProps) {
  const [lead, setLead] = useState<LeadWithDetails | null>(null);
  const [followUps, setFollowUps] = useState<LeadFollowUp[]>([]);
  const [missingInfo, setMissingInfo] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [followUpDraft, setFollowUpDraft] = useState("");
  const [followUpDue, setFollowUpDue] = useState("");
  const [followUpType, setFollowUpType] = useState<"manual" | "ai_suggested">("manual");

  const fetchData = async () => {
    setLoading(true);
    const [leadData, missing] = await Promise.all([
      getLeadDetailAction(leadId),
      getMissingQualificationAction(leadId),
    ]);
    setLead(leadData as LeadWithDetails);
    setFollowUps(leadData?.follow_ups || []);
    setMissingInfo(missing || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [leadId]);

  const handleStatusChange = async (newStatus: string) => {
    setActionLoading("status");
    await updateLeadAction(leadId, { status: newStatus as any });
    setActionLoading(null);
    fetchData();
  };

  const handleStageChange = async (newStage: string) => {
    setActionLoading("stage");
    await updateLeadAction(leadId, { stage: newStage as any });
    setActionLoading(null);
    fetchData();
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setActionLoading("note");
    await addLeadNoteAction(leadId, noteText);
    setNoteText("");
    setActionLoading(null);
    fetchData();
  };

  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpDraft.trim() || !followUpDue) return;
    setActionLoading("followup");
    await createFollowUpAction(leadId, followUpType, followUpDue, followUpDraft);
    setFollowUpDraft("");
    setFollowUpDue("");
    setShowFollowUpForm(false);
    setActionLoading(null);
    fetchData();
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const formatCurrency = (value?: number) => {
    if (!value) return "—";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-32">
          <div className="h-6 w-6 animate-spin border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="container mx-auto py-6 text-center">
        <p className="text-muted-foreground">Lead not found.</p>
        <Link href="/leads" className="mt-4 text-primary hover:underline">
          Back to leads
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
  const stageConfig = lead.stage ? STAGE_CONFIG[lead.stage] : null;
  const intentColor = INTENT_COLORS[lead.intent];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/leads" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{lead.name || lead.username || "Lead"}</h1>
          <p className="text-muted-foreground">
            {lead.social_account?.platform} • @{lead.username || "unknown"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Lead Details</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                <Badge className={intentColor}>{lead.intent} intent</Badge>
                {stageConfig && <Badge className={stageConfig.color}>{stageConfig.label}</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Source</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{lead.social_account?.platform}</Badge>
                    <span>{lead.source_type}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Detected</label>
                  <div className="mt-1 text-sm">{formatTime(lead.first_detected_at)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Activity</label>
                  <div className="mt-1 text-sm">{formatTime(lead.last_activity_at)}</div>
                </div>
                {lead.estimated_value && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Est. Value</label>
                    <div className="mt-1 text-sm font-medium text-green-600">{formatCurrency(lead.estimated_value)}</div>
                  </div>
                )}
              </div>

              {lead.requirement && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Requirement</label>
                  <p className="mt-1">{lead.requirement}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {lead.quantity && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Quantity</label>
                    <div className="mt-1 flex items-center gap-1">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>{lead.quantity}</span>
                    </div>
                  </div>
                )}
                {lead.location && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Location</label>
                    <div className="mt-1 flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{lead.location}</span>
                    </div>
                  </div>
                )}
              </div>

              {lead.interested_product && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Interested Product</label>
                  <div className="mt-1 font-medium">{lead.interested_product.name}</div>
                </div>
              )}

              {lead.interested_service && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Interested Service</label>
                  <div className="mt-1 font-medium">{lead.interested_service.name}</div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t">
                <Select
                  value={lead.status}
                  onValueChange={handleStatusChange}
                  disabled={actionLoading === "status"}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="qualifying">Qualifying</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="follow_up">Follow-up</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="ignored">Ignored</SelectItem>
                    <SelectItem value="unqualified">Unqualified</SelectItem>
                  </SelectContent>
                </Select>
                {lead.stage && (
                  <Select
                    value={lead.stage}
                    onValueChange={handleStageChange}
                    disabled={actionLoading === "stage"}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="detected">Detected</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="quotation">Quotation</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="booked">Booked</SelectItem>
                      <SelectItem value="won">Won</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {missingInfo.length > 0 && (
                <div className="p-3 bg-yellow-50 rounded-md border border-yellow-200">
                  <p className="text-sm font-medium text-yellow-800 mb-2">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    Information Still Needed
                  </p>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {missingInfo.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Follow-ups
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowFollowUpForm(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Follow-up
                </Button>
              </div>

              {showFollowUpForm && (
                <form onSubmit={handleCreateFollowUp} className="space-y-3 p-3 bg-muted/30 rounded-lg">
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={followUpType} onValueChange={(v) => setFollowUpType(v as "manual" | "ai_suggested")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="ai_suggested">AI Suggested</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="datetime-local"
                      value={followUpDue}
                      onChange={(e) => setFollowUpDue(e.target.value)}
                      required
                    />
                  </div>
                  <Textarea
                    value={followUpDraft}
                    onChange={(e) => setFollowUpDraft(e.target.value)}
                    placeholder="Message draft (optional)"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button type="submit" disabled={actionLoading === "followup"}>
                      {actionLoading === "followup" ? "Creating..." : "Create"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowFollowUpForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              {followUps.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No follow-ups yet.</p>
              ) : (
                <div className="space-y-2">
                  {followUps.map((fu) => {
                    const statusConfig = FOLLOW_UP_STATUS[fu.status] || FOLLOW_UP_STATUS.pending;
                    return (
                      <div key={fu.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{fu.type}</Badge>
                              <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Due: {formatTime(fu.due_at)}
                            </p>
                            {fu.message_draft && (
                              <p className="text-sm mt-1 p-2 bg-muted rounded">
                                {fu.message_draft}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {fu.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  completeFollowUpAction(fu.id);
                                  fetchData();
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
                            )}
                            {fu.status === "pending" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  cancelFollowUpAction(fu.id);
                                  fetchData();
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Internal Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Add internal note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={2}
              />
              <Button
                onClick={handleAddNote}
                disabled={!noteText.trim() || actionLoading === "note"}
              >
                {actionLoading === "note" ? "Adding..." : "Add Note"}
              </Button>
              {lead.notes && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {lead.reason || "No AI summary available."}
              </p>
              <div className="mt-3 p-3 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground">
                  Source: {lead.source_type} on {lead.social_account?.platform}
                </p>
                {lead.source_conversation_id && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Conversation: {lead.source_conversation_id.slice(0, 8)}...
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Confidence: {Math.round((lead.confidence || 0) * 100)}%
                </p>
                {lead.brain_version && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Brain Version: {lead.brain_version}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="border-l-2 border-muted pl-4">
                <div className="relative">
                  <div className="absolute left-[-8px] top-1 w-3 h-3 rounded-full bg-primary" />
                  <p className="text-sm font-medium">Lead detected</p>
                  <p className="text-xs text-muted-foreground">{formatTime(lead.first_detected_at)}</p>
                </div>
                {lead.source_message_ids && lead.source_message_ids.length > 0 && (
                  <div className="relative mt-4">
                    <div className="absolute left-[-8px] top-1 w-3 h-3 rounded-full bg-muted" />
                    <p className="text-sm font-medium">Source messages</p>
                    <p className="text-xs text-muted-foreground">{lead.source_message_ids.length} message(s)</p>
                  </div>
                )}
                {lead.observation_ids && lead.observation_ids.length > 0 && (
                  <div className="relative mt-4">
                    <div className="absolute left-[-8px] top-1 w-3 h-3 rounded-full bg-muted" />
                    <p className="text-sm font-medium">Intelligence signals</p>
                    <p className="text-xs text-muted-foreground">{lead.observation_ids.length} observation(s)</p>
                  </div>
                )}
                {lead.status !== "new" && (
                  <div className="relative mt-4">
                    <div className="absolute left-[-8px] top-1 w-3 h-3 rounded-full bg-green-500" />
                    <p className="text-sm font-medium">Status changed to {lead.status}</p>
                    <p className="text-xs text-muted-foreground">{formatTime(lead.updated_at)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Value & Conversion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Est. Value</label>
                  <div className="mt-1 text-lg font-bold">{formatCurrency(lead.estimated_value)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Currency</label>
                  <div className="mt-1 text-sm">{lead.estimated_value_currency || "INR"}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  placeholder="Update est. value"
                  value={lead.estimated_value?.toString() || ""}
                  onChange={(e) => updateLeadAction(leadId, { estimatedValue: parseFloat(e.target.value) || undefined })}
                  className="col-span-2"
                />
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  Only set if owner has confirmed pricing/quantity. Do not invent values.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}