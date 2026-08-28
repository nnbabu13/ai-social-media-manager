"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  TrendingUp, AlertTriangle, Lightbulb, Target, Zap, Users, BarChart3, ArrowRight, CheckCircle2, XCircle, RefreshCw, Clock, Brain, Sparkles, LayoutDashboard, MessageSquare, FileText, Trophy
} from "lucide-react";
import {
  getPerformanceAnalysisAction,
  getGrowthInsightsAction,
  getGrowthRecommendationsAction,
  getNextMoveAction,
  getDailyBriefAction,
  getWeeklyReviewAction,
  getStrategyHealthAction,
  approveRecommendationAction,
  rejectRecommendationAction,
  createStrategyChangeRequestAction,
} from "@/app/actions/growth";
import type {
  PerformanceAnalysisResult,
  GrowthInsight,
  GrowthRecommendation,
  NextMove,
  DailyBriefData,
  WeeklyReviewData,
  StrategyHealth,
} from "@/types/growth";

interface AnalyticsClientProps {
  businessId: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-blue-100 text-blue-700 border-blue-200",
  info: "bg-gray-100 text-gray-700 border-gray-200",
};

export function AnalyticsClient({ businessId }: AnalyticsClientProps) {
  const [analysis, setAnalysis] = useState<PerformanceAnalysisResult | null>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [nextMove, setNextMove] = useState<any | null>(null);
  const [dailyBrief, setDailyBrief] = useState<any | null>(null);
  const [weeklyReview, setWeeklyReview] = useState<any | null>(null);
  const [strategyHealth, setStrategyHealth] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedRecommendation, setSelectedRecommendation] = useState<any | null>(null);
  const [showRecommendationDialog, setShowRecommendationDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [
        analysisData,
        insightsData,
        recommendationsData,
        nextMoveData,
        dailyBriefData,
        weeklyReviewData,
        strategyHealthData,
      ] = await Promise.all([
        getPerformanceAnalysisAction(),
        getGrowthInsightsAction(),
        getGrowthRecommendationsAction(),
        getNextMoveAction(),
        getDailyBriefAction(),
        getWeeklyReviewAction(),
        getStrategyHealthAction(),
      ]);
      setAnalysis(analysisData);
      setInsights(insightsData || []);
      setRecommendations(recommendationsData || []);
      setNextMove(nextMoveData);
      setDailyBrief(dailyBriefData);
      setWeeklyReview(weeklyReviewData);
      setStrategyHealth(strategyHealthData);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleApprove = async (recId: string) => {
    setActionLoading(recId);
    await approveRecommendationAction(recId);
    setActionLoading(null);
    fetchAll();
  };

  const handleReject = async (recId: string) => {
    setActionLoading(recId);
    await rejectRecommendationAction(recId);
    setActionLoading(null);
    fetchAll();
  };

  const handleImplement = async (rec: any) => {
    setActionLoading(rec.id);
    const changes = {
      action: rec.action_type,
      title: rec.title,
      description: rec.description,
    };
    await createStrategyChangeRequestAction(rec.id, changes);
    setActionLoading(null);
    fetchAll();
  };

  const formatConfidence = (conf: number) => `${Math.round(conf * 100)}%`;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Growth Strategist</h1>
          <p className="text-muted-foreground">
            Performance intelligence that learns from results and recommends what to do next.
          </p>
        </div>
        <Button variant="outline" onClick={fetchAll} disabled={loading}>
          Refresh Analysis
        </Button>
      </div>

      <div className="text-center text-muted-foreground py-8">
        Analytics client loaded successfully. Full implementation pending.
      </div>
    </div>
  );
}