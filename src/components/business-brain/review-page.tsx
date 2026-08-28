"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InterviewReview } from "@/components/business-brain/interview-review";
import { approveKnowledgeItem } from "@/app/actions/interview";
import { getInterview } from "@/app/actions/interview";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ReviewPageProps {
  businessId: string;
}

export function ReviewPage({ businessId }: ReviewPageProps) {
  const router = useRouter();
  const [extractedKnowledge, setExtractedKnowledge] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInterview();
  }, [businessId]);

  const loadInterview = async () => {
    try {
      const interview = await getInterview(businessId);
      if (interview?.knowledge_extracted) {
        setExtractedKnowledge(interview.knowledge_extracted);
      }
    } catch (err) {
      console.error("Failed to load interview:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (entityType: string, data: Record<string, unknown>) => {
    await approveKnowledgeItem(businessId, entityType, "", data);
  };

  const handleReject = (entityType: string, index: number) => {
    setExtractedKnowledge((prev: any) => ({
      ...prev,
      [entityType]: prev[entityType].filter((_: any, i: number) => i !== index),
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!extractedKnowledge) {
    return (
      <Card>
        <CardContent className="space-y-4 py-8 text-center">
          <p className="text-muted-foreground">No extracted knowledge to review.</p>
          <Button onClick={() => router.push("/business-brain")}>
            Back to Business Brain
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <InterviewReview
        extractedKnowledge={extractedKnowledge}
        onApprove={handleApprove}
        onReject={handleReject}
      />
      <div className="flex justify-end">
        <Button onClick={() => router.push("/business-brain")}>
          Continue to Business Brain
        </Button>
      </div>
    </div>
  );
}
