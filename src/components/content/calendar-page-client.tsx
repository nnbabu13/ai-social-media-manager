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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import {
  getCalendarSchedulesAction,
  approveContentAction,
  publishNowAction,
  cancelScheduleAction,
  scheduleContentAction,
  rescheduleAction,
} from "@/app/actions/calendar";

interface CalendarItem {
  id: string;
  content_item_id: string;
  social_account_id: string;
  scheduled_at: string;
  scheduled_at_utc: string;
  timezone: string;
  status: string;
  provider_post_id?: string;
  content_items: {
    id: string;
    title?: string;
    body?: string;
    pillar?: string;
    persona?: string;
    objective?: string;
    platform_content?: Record<string, any>;
    status: string;
  };
  social_accounts: {
    id: string;
    platform: string;
    username?: string;
  };
}

interface CalendarPageClientProps {
  businessId: string;
  initialStartDate: string;
  initialEndDate: string;
  monthStart: string;
  monthEnd: string;
}

type ViewMode = "week" | "month" | "list";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700 border-gray-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  review: "bg-yellow-100 text-yellow-700 border-yellow-200",
  approved: "bg-blue-100 text-blue-700 border-blue-200",
  scheduled: "bg-purple-100 text-purple-700 border-purple-200",
  publishing: "bg-orange-100 text-orange-700 border-orange-200",
  published: "bg-green-100 text-green-700 border-green-200",
  failed: "bg-red-100 text-red-700 border-red-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
};

const PLATFORM_ICONS: Record<string, string> = {
  instagram: "IG",
  facebook: "FB",
  linkedin: "LI",
  tiktok: "TK",
  youtube: "YT",
  x: "X",
};

export function CalendarPageClient({
  businessId,
  initialStartDate,
  initialEndDate,
  monthStart,
  monthEnd,
}: CalendarPageClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [schedules, setSchedules] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date(initialStartDate));
  const [currentMonth, setCurrentMonth] = useState(new Date(monthStart));
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [publishing, setPublishing] = useState(false);

  const fetchSchedules = useCallback(async (start: string, end: string) => {
    setLoading(true);
    const data = await getCalendarSchedulesAction(start, end);
    setSchedules(data as CalendarItem[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    const start = currentWeekStart.toISOString();
    const end = new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    fetchSchedules(start, end);
  }, [currentWeekStart, fetchSchedules]);

  const filteredSchedules = schedules.filter((s) => {
    if (filterPlatform !== "all" && s.social_accounts?.platform !== filterPlatform) return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    return true;
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    return date;
  });

  const getSchedulesForDay = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return filteredSchedules.filter((s) => {
      const schedDate = new Date(s.scheduled_at_utc).toISOString().split("T")[0];
      return schedDate === dateStr;
    });
  };

  const handlePrevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const handleApprove = async (itemId: string) => {
    const result = await approveContentAction(itemId);
    if (result.success) {
      setShowDetailDialog(false);
      fetchSchedules(currentWeekStart.toISOString(), new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString());
    }
  };

  const handlePublishNow = async (itemId: string, accountId: string) => {
    setPublishing(true);
    const result = await publishNowAction(itemId, accountId);
    setPublishing(false);
    if (result.success) {
      setShowDetailDialog(false);
      fetchSchedules(currentWeekStart.toISOString(), new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString());
    }
  };

  const handleCancel = async (scheduleId: string) => {
    const result = await cancelScheduleAction(scheduleId);
    if (result.success) {
      setShowDetailDialog(false);
      fetchSchedules(currentWeekStart.toISOString(), new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString());
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
        return <CheckCircle2 className="h-3 w-3" />;
      case "failed":
        return <XCircle className="h-3 w-3" />;
      case "publishing":
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case "scheduled":
      case "confirmed":
        return <Clock className="h-3 w-3" />;
      default:
        return <AlertTriangle className="h-3 w-3" />;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Calendar</h1>
          <p className="text-muted-foreground">
            See what your AI has planned, what needs your approval, and what is scheduled.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="list">List</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="publishing">Publishing</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {currentWeekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
            {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <Button variant="outline" size="sm" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentWeekStart(new Date())}>
            Today
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : viewMode === "week" ? (
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day, idx) => {
            const daySchedules = getSchedulesForDay(day);
            const isToday = day.toISOString().split("T")[0] === new Date().toISOString().split("T")[0];

            return (
              <Card key={idx} className={isToday ? "border-primary" : ""}>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm font-medium">
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                    <span className={`ml-2 ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
                      {day.getDate()}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 space-y-2">
                  {daySchedules.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No posts</p>
                  ) : (
                    daySchedules.map((sched) => (
                      <div
                        key={sched.id}
                        className={`p-2 rounded-md border cursor-pointer hover:shadow-sm transition-shadow ${STATUS_COLORS[sched.status] || "bg-gray-50"}`}
                        onClick={() => {
                          setSelectedItem(sched);
                          setShowDetailDialog(true);
                        }}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-white/50">
                            {PLATFORM_ICONS[sched.social_accounts?.platform] || "?"}
                          </span>
                          <span className="text-[10px]">
                            {new Date(sched.scheduled_at_utc).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-xs font-medium line-clamp-2">
                          {sched.content_items?.title || "Untitled"}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {getStatusIcon(sched.status)}
                          <span className="text-[10px] capitalize">{sched.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : viewMode === "list" ? (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredSchedules.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No scheduled content found.
                </div>
              ) : (
                filteredSchedules.map((sched) => (
                  <div
                    key={sched.id}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer"
                    onClick={() => {
                      setSelectedItem(sched);
                      setShowDetailDialog(true);
                    }}
                  >
                    <div className="flex-shrink-0 w-16 text-center">
                      <div className="text-xs text-muted-foreground">
                        {new Date(sched.scheduled_at_utc).toLocaleDateString("en-US", { weekday: "short" })}
                      </div>
                      <div className="text-sm font-medium">
                        {new Date(sched.scheduled_at_utc).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(sched.scheduled_at_utc).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <Badge className={STATUS_COLORS[sched.status]}>
                      {getStatusIcon(sched.status)}
                      <span className="ml-1 capitalize">{sched.status}</span>
                    </Badge>
                    <Badge variant="outline">
                      {PLATFORM_ICONS[sched.social_accounts?.platform]}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {sched.content_items?.title || "Untitled"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sched.content_items?.pillar || "No pillar"} •{" "}
                        {sched.social_accounts?.username || "Unknown account"}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Open
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          Month view coming soon. Use Week or List view.
        </div>
      )}

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedItem?.content_items?.title || "Content Detail"}</DialogTitle>
            <DialogDescription>
              {selectedItem?.social_accounts?.platform} •{" "}
              {selectedItem && new Date(selectedItem.scheduled_at_utc).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={STATUS_COLORS[selectedItem.status]}>
                  {getStatusIcon(selectedItem.status)}
                  <span className="ml-1 capitalize">{selectedItem.status}</span>
                </Badge>
                <Badge variant="outline">
                  {PLATFORM_ICONS[selectedItem.social_accounts?.platform]}
                  <span className="ml-1">{selectedItem.social_accounts?.platform}</span>
                </Badge>
              </div>

              {selectedItem.content_items?.body && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{selectedItem.content_items.body}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Pillar:</span>{" "}
                  {selectedItem.content_items?.pillar || "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Persona:</span>{" "}
                  {selectedItem.content_items?.persona || "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Objective:</span>{" "}
                  {selectedItem.content_items?.objective || "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Timezone:</span>{" "}
                  {selectedItem.timezone}
                </div>
              </div>

              {selectedItem.provider_post_id && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Provider Post ID:</span>{" "}
                  <code className="text-xs">{selectedItem.provider_post_id}</code>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex gap-2">
            {selectedItem?.content_items?.status === "review" && (
              <Button
                onClick={() => selectedItem && handleApprove(selectedItem.content_item_id)}
              >
                Approve
              </Button>
            )}
            {selectedItem?.content_items?.status === "approved" && selectedItem?.status !== "published" && (
              <Button
                onClick={() =>
                  selectedItem &&
                  handlePublishNow(selectedItem.content_item_id, selectedItem.social_account_id)
                }
                disabled={publishing}
              >
                {publishing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Publish Now
              </Button>
            )}
            {selectedItem?.status === "confirmed" && (
              <Button
                variant="destructive"
                onClick={() => selectedItem && handleCancel(selectedItem.id)}
              >
                Cancel Schedule
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
