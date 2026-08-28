"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, AlertTriangle, DollarSign, Clock, TrendingUp, Users } from "lucide-react";
import {
  getLeadsAction,
  getLeadStatsAction,
  getFollowUpsDueAction,
  updateLeadAction,
} from "@/app/actions/leads";
import type { LeadWithDetails, LeadFilters, LeadStatusValue, LeadIntentValue } from "@/types/leads";
import Link from "next/link";

interface LeadsPageClientProps {
  businessId: string;
}

const STATUS_CONFIG: Record<string, { color: string; label: string; icon?: React.ReactNode }> = {
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

const INTENT_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-700",
};

export function LeadsPageClient({ businessId }: LeadsPageClientProps) {
  const [leads, setLeads] = useState<LeadWithDetails[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<LeadStatusValue | "all">("all");
  const [filterIntent, setFilterIntent] = useState<LeadIntentValue | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [leadsData, statsData, followUpsData] = await Promise.all([
      getLeadsAction({
        status: filterStatus !== "all" ? filterStatus : undefined,
        intent: filterIntent !== "all" ? filterIntent : undefined,
      }),
      getLeadStatsAction(),
      getFollowUpsDueAction(),
    ]);
    setLeads(leadsData as LeadWithDetails[]);
    setStats(statsData);
    setFollowUps(followUpsData || []);
    setLoading(false);
  }, [filterStatus, filterIntent]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredLeads = leads.filter((lead) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (lead.name || "").toLowerCase().includes(query) ||
      (lead.username || "").toLowerCase().includes(query) ||
      (lead.requirement || "").toLowerCase().includes(query) ||
      (lead.reason || "").toLowerCase().includes(query)
    );
  });

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setUpdatingId(leadId);
    await updateLeadAction(leadId, { status: newStatus as any });
    setUpdatingId(null);
    fetchData();
  };

  const formatCurrency = (value?: number) => {
    if (!value) return "—";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
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
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground">
            Track and manage customer opportunities from social interactions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
                <div className="text-sm text-muted-foreground">Total Leads</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats?.todayHighIntent || 0}</div>
                <div className="text-sm text-muted-foreground">High Intent Today</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{followUps.length}</div>
                <div className="text-sm text-muted-foreground">Follow-ups Due</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{formatCurrency(stats?.pipelineValue)}</div>
                <div className="text-sm text-muted-foreground">Pipeline Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {followUps.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Follow-ups Due ({followUps.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {followUps.slice(0, 5).map((fu: any) => (
              <Link key={fu.id} href={`/leads/${fu.social_leads?.id}`} className="block p-3 hover:bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{fu.social_leads?.social_accounts?.platform}</Badge>
                  <span className="font-medium">{fu.social_leads?.name || fu.social_leads?.username || "Unknown"}</span>
                  <Badge className={INTENT_COLORS[fu.social_leads?.intent]}>{fu.social_leads?.intent}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Due: {formatTime(fu.due_at)} • {fu.message_draft ? "Has draft" : "No draft"}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Leads</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filterIntent} onValueChange={(v) => setFilterIntent(v as LeadIntentValue | "all")}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Intent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Intent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as LeadStatusValue | "all")}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="qualifying">Qualifying</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="follow_up">Follow-up</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
            />
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="h-6 w-6 animate-spin border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No leads found.
            </div>
          ) : (
            <div className="divide-y">
              {filteredLeads.map((lead) => {
                const statusConfig = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
                return (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                    className="block p-4 hover:bg-muted/50 flex items-center gap-4"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold">
                        {(lead.name || lead.username || "?")[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {lead.name || lead.username || "Unknown Customer"}
                        </span>
                        <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                        <Badge className={INTENT_COLORS[lead.intent]}>{lead.intent} intent</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {lead.requirement || lead.reason || "No details"}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{lead.social_account?.platform} • @{lead.username || "unknown"}</span>
                        <span>{formatTime(lead.last_activity_at)}</span>
                        {lead.estimated_value && (
                          <span className="text-green-600 font-medium">{formatCurrency(lead.estimated_value)}</span>
                        )}
                      </div>
                    </div>
                    {lead.status === "new" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          handleStatusChange(lead.id, "qualifying");
                        }}
                        disabled={updatingId === lead.id}
                      >
                        Start Qualifying
                      </Button>
                    )}
                    {lead.status === "qualifying" && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          handleStatusChange(lead.id, "qualified");
                        }}
                        disabled={updatingId === lead.id}
                      >
                        Mark Qualified
                      </Button>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}