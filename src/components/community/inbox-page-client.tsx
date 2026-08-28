"use client";

import { useState, useEffect, useCallback } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Send,
  ThumbsUp,
  User,
  Bot,
  Shield,
  ArrowRight,
} from "lucide-react";
import {
  getInboxConversationsAction,
  getConversationDetailAction,
  getPendingApprovalsAction,
  approveConversationResponseAction,
  rejectConversationResponseAction,
  takeOverAction,
  releaseConversationAction,
  addNoteAction,
  getInboxStatsAction,
} from "@/app/actions/inbox";

interface Conversation {
  id: string;
  platform: string;
  channel_type: string;
  customer_name?: string;
  customer_username?: string;
  status: string;
  priority: string;
  intent?: string;
  risk_level: string;
  summary?: string;
  ai_handled: boolean;
  human_locked: boolean;
  unread_count: number;
  last_message_at?: string;
  messageCount: number;
  social_accounts?: { platform: string; username?: string };
}

interface Message {
  id: string;
  direction: string;
  sender_type: string;
  sender_name?: string;
  text?: string;
  created_at: string;
}

interface Approval {
  id: string;
  conversation_id: string;
  action_type: string;
  draft_response: string;
  reason?: string;
  risk_level: string;
  confidence?: number;
  status: string;
  social_conversations?: any;
  created_at: string;
}

interface InboxPageClientProps {
  businessId: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-gray-100 text-gray-700 border-gray-200",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  open: "bg-green-100 text-green-700",
  needs_approval: "bg-yellow-100 text-yellow-700",
  escalated: "bg-red-100 text-red-700",
  waiting_customer: "bg-purple-100 text-purple-700",
  waiting_business: "bg-orange-100 text-orange-700",
  resolved: "bg-gray-100 text-gray-500",
  archived: "bg-gray-50 text-gray-400",
};

const PLATFORM_ICONS: Record<string, string> = {
  instagram: "IG",
  facebook: "FB",
  linkedin: "LI",
};

export function InboxPageClient({ businessId }: InboxPageClientProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [editedResponse, setEditedResponse] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [convData, approvalData, statsData] = await Promise.all([
      getInboxConversationsAction(businessId, {
        status: filterStatus !== "all" ? filterStatus : undefined,
        priority: filterPriority !== "all" ? filterPriority : undefined,
      }),
      getPendingApprovalsAction(),
      getInboxStatsAction(businessId),
    ]);
    setConversations(convData as Conversation[]);
    setApprovals(approvalData as Approval[]);
    setStats(statsData);
    setLoading(false);
  }, [businessId, filterStatus, filterPriority]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenConversation = async (conv: Conversation) => {
    setSelectedConv(conv);
    setShowDetailDialog(true);
    const detail = await getConversationDetailAction(conv.id);
    setMessages(detail.messages as Message[]);
  };

  const handleApprove = async (approvalId: string) => {
    setActionLoading(approvalId);
    await approveConversationResponseAction(approvalId);
    setActionLoading(null);
    setShowApprovalDialog(false);
    fetchData();
  };

  const handleApproveEdited = async (approvalId: string) => {
    setActionLoading(approvalId);
    await approveConversationResponseAction(approvalId, editedResponse);
    setActionLoading(null);
    setShowApprovalDialog(false);
    fetchData();
  };

  const handleReject = async (approvalId: string) => {
    setActionLoading(approvalId);
    await rejectConversationResponseAction(approvalId);
    setActionLoading(null);
    setShowApprovalDialog(false);
    fetchData();
  };

  const handleTakeOver = async (convId: string) => {
    setActionLoading(convId);
    await takeOverAction(convId);
    setActionLoading(null);
    fetchData();
  };

  const handleRelease = async (convId: string) => {
    setActionLoading(convId);
    await releaseConversationAction(convId);
    setActionLoading(null);
    fetchData();
  };

  const handleAddNote = async (convId: string) => {
    if (!noteText.trim()) return;
    await addNoteAction(convId, noteText);
    setNoteText("");
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "";
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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent": return <AlertTriangle className="h-3 w-3" />;
      case "high": return <ArrowRight className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Community Manager</h1>
          <p className="text-muted-foreground">
            Manage customer conversations across your social platforms.
          </p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.todayHandled}</div>
              <div className="text-sm text-muted-foreground">Handled today</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.needsAttention}</div>
              <div className="text-sm text-muted-foreground">Needs attention</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.todayLeads}</div>
              <div className="text-sm text-muted-foreground">Leads detected</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.todayComplaints}</div>
              <div className="text-sm text-muted-foreground">Complaints</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="needs_approval">Needs Approval</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {approvals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Awaiting Approval ({approvals.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {approvals.map((approval) => (
              <div
                key={approval.id}
                className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => {
                  setSelectedApproval(approval);
                  setEditedResponse(approval.draft_response);
                  setShowApprovalDialog(true);
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">
                    {PLATFORM_ICONS[approval.social_conversations?.platform] || "?"}
                  </Badge>
                  <span className="text-sm font-medium">
                    {approval.social_conversations?.customer_name || "Customer"}
                  </span>
                  <Badge className={PRIORITY_COLORS[approval.risk_level === "high" ? "high" : "medium"]}>
                    {approval.action_type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {approval.draft_response || "Draft pending..."}
                </p>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatTime(approval.created_at)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversations ({conversations.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No conversations found.
            </div>
          ) : (
            <div className="divide-y">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleOpenConversation(conv)}
                >
                  <div className="flex-shrink-0">
                    <Badge variant="outline" className="w-10 justify-center">
                      {PLATFORM_ICONS[conv.platform] || "?"}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {conv.customer_name || conv.customer_username || "Unknown"}
                      </span>
                      <Badge className={PRIORITY_COLORS[conv.priority]}>
                        {getPriorityIcon(conv.priority)}
                        <span className="ml-1">{conv.priority}</span>
                      </Badge>
                      <Badge className={STATUS_COLORS[conv.status]}>
                        {conv.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {conv.summary || conv.intent || "No messages yet"}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {formatTime(conv.last_message_at)}
                  </div>
                  {conv.human_locked && (
                    <Badge variant="outline" className="text-orange-600">
                      <User className="h-3 w-3 mr-1" />
                      Human
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedConv?.customer_name || selectedConv?.customer_username || "Conversation"}
            </DialogTitle>
            <DialogDescription>
              {selectedConv?.platform} • {selectedConv?.channel_type?.replace("_", " ")}
            </DialogDescription>
          </DialogHeader>
          {selectedConv && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={PRIORITY_COLORS[selectedConv.priority]}>
                  {selectedConv.priority}
                </Badge>
                <Badge className={STATUS_COLORS[selectedConv.status]}>
                  {selectedConv.status.replace("_", " ")}
                </Badge>
                {selectedConv.intent && (
                  <Badge variant="outline">{selectedConv.intent}</Badge>
                )}
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.direction === "outbound"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        {msg.sender_type === "ai" ? (
                          <Bot className="h-3 w-3" />
                        ) : msg.sender_type === "customer" ? (
                          <User className="h-3 w-3" />
                        ) : null}
                        <span className="text-xs opacity-70">
                          {msg.sender_name || msg.sender_type}
                        </span>
                      </div>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {selectedConv.summary && (
                <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                  <p className="text-xs font-medium text-blue-800 mb-1">AI Summary</p>
                  <p className="text-sm text-blue-700">{selectedConv.summary}</p>
                </div>
              )}

              <div className="flex gap-2">
                {selectedConv.human_locked ? (
                  <Button
                    variant="outline"
                    onClick={() => handleRelease(selectedConv.id)}
                    disabled={actionLoading === selectedConv.id}
                  >
                    Return to AI
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => handleTakeOver(selectedConv.id)}
                    disabled={actionLoading === selectedConv.id}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Take over
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Textarea
                  placeholder="Add internal note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={2}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddNote(selectedConv.id)}
                  disabled={!noteText.trim()}
                >
                  Add Note
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Response</DialogTitle>
            <DialogDescription>
              {selectedApproval?.action_type} • {selectedApproval?.risk_level} risk
            </DialogDescription>
          </DialogHeader>
          {selectedApproval && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm whitespace-pre-wrap">{selectedApproval.draft_response}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Edit response (optional)</label>
                <Textarea
                  value={editedResponse}
                  onChange={(e) => setEditedResponse(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>

              {selectedApproval.reason && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Reason:</span> {selectedApproval.reason}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button
              onClick={() => selectedApproval && handleApprove(selectedApproval.id)}
              disabled={actionLoading === selectedApproval?.id}
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
            {editedResponse !== selectedApproval?.draft_response && (
              <Button
                variant="outline"
                onClick={() => selectedApproval && handleApproveEdited(selectedApproval.id)}
                disabled={actionLoading === selectedApproval?.id}
              >
                Send Edited
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => selectedApproval && handleReject(selectedApproval.id)}
              disabled={actionLoading === selectedApproval?.id}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
