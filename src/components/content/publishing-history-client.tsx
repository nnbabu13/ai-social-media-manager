"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Clock, Loader2, RefreshCw } from "lucide-react";
import { getPublishHistoryAction, retryPublishAction } from "@/app/actions/calendar";

interface PublishJob {
  id: string;
  content_schedule_id: string;
  content_item_id: string;
  social_account_id: string;
  status: string;
  attempt_count: number;
  max_attempts: number;
  last_error?: string;
  error_type?: string;
  provider_post_id?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  content_items: {
    id: string;
    title?: string;
    pillar?: string;
    status: string;
  };
  social_accounts: {
    id: string;
    platform: string;
    username?: string;
  };
}

interface PublishingHistoryClientProps {
  businessId: string;
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  queued: { color: "bg-gray-100 text-gray-700", icon: <Clock className="h-3 w-3" />, label: "Queued" },
  processing: { color: "bg-orange-100 text-orange-700", icon: <Loader2 className="h-3 w-3 animate-spin" />, label: "Processing" },
  published: { color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="h-3 w-3" />, label: "Published" },
  failed: { color: "bg-red-100 text-red-700", icon: <XCircle className="h-3 w-3" />, label: "Failed" },
  cancelled: { color: "bg-gray-100 text-gray-500", icon: <XCircle className="h-3 w-3" />, label: "Cancelled" },
};

export function PublishingHistoryClient({ businessId }: PublishingHistoryClientProps) {
  const [jobs, setJobs] = useState<PublishJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<PublishJob | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    const data = await getPublishHistoryAction(businessId);
    setJobs(data as PublishJob[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, [businessId]);

  const handleRetry = async (jobId: string) => {
    setRetrying(jobId);
    const result = await retryPublishAction(jobId);
    setRetrying(null);
    if (result.success) {
      fetchJobs();
      setShowDetailDialog(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Publishing History</h1>
        <p className="text-muted-foreground">
          Track all publishing attempts and their results.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No publishing history yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => {
                  const statusConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG.queued;
                  return (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">
                        {job.content_items?.title || "Untitled"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{job.social_accounts?.platform}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig.color}>
                          {statusConfig.icon}
                          <span className="ml-1">{statusConfig.label}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(job.created_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(job.completed_at)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {job.attempt_count}/{job.max_attempts}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedJob(job);
                            setShowDetailDialog(true);
                          }}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Publishing Detail</DialogTitle>
            <DialogDescription>
              {selectedJob?.social_accounts?.platform} •{" "}
              {formatDate(selectedJob?.created_at)}
            </DialogDescription>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={STATUS_CONFIG[selectedJob.status]?.color}>
                  {STATUS_CONFIG[selectedJob.status]?.icon}
                  <span className="ml-1">{STATUS_CONFIG[selectedJob.status]?.label}</span>
                </Badge>
                <Badge variant="outline">{selectedJob.social_accounts?.platform}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Content:</span>{" "}
                  {selectedJob.content_items?.title || "Untitled"}
                </div>
                <div>
                  <span className="text-muted-foreground">Account:</span>{" "}
                  {selectedJob.social_accounts?.username || "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Started:</span>{" "}
                  {formatDate(selectedJob.started_at)}
                </div>
                <div>
                  <span className="text-muted-foreground">Completed:</span>{" "}
                  {formatDate(selectedJob.completed_at)}
                </div>
                <div>
                  <span className="text-muted-foreground">Attempts:</span>{" "}
                  {selectedJob.attempt_count} / {selectedJob.max_attempts}
                </div>
                {selectedJob.provider_post_id && (
                  <div>
                    <span className="text-muted-foreground">Provider Post ID:</span>{" "}
                    <code className="text-xs">{selectedJob.provider_post_id}</code>
                  </div>
                )}
              </div>

              {selectedJob.last_error && (
                <div className="p-3 bg-red-50 rounded-md border border-red-200">
                  <p className="text-sm font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-700">{selectedJob.last_error}</p>
                  {selectedJob.error_type && (
                    <p className="text-xs text-red-600 mt-1">Type: {selectedJob.error_type}</p>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex gap-2">
            {selectedJob?.status === "failed" && selectedJob.attempt_count < selectedJob.max_attempts && (
              <Button
                onClick={() => selectedJob && handleRetry(selectedJob.id)}
                disabled={retrying === selectedJob?.id}
              >
                {retrying === selectedJob?.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Retry
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
