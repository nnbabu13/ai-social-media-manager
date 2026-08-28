"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InterviewChat } from "@/components/business-brain/interview-chat";
import { startInterview, sendMessage, completeInterview, getInterview, getInterviewMessages, skipQuestion } from "@/app/actions/interview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Brain } from "lucide-react";

interface InterviewPageProps {
  businessId: string;
}

const STAGES = ["business", "products_services", "customers", "brand", "policies", "goals"];

export function InterviewPage({ businessId }: InterviewPageProps) {
  const router = useRouter();
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [currentStage, setCurrentStage] = useState("business");
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [status, setStatus] = useState("not_started");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInterview();
  }, [businessId]);

  const loadInterview = async () => {
    try {
      const interview = await getInterview(businessId);
      if (interview) {
        setInterviewId(interview.id);
        setCurrentStage(interview.current_stage);
        setCompletionPercentage(interview.completion_percentage);
        setStatus(interview.status);

        const msgs = await getInterviewMessages(interview.id);
        setMessages(msgs);
      }
    } catch (err) {
      setError("Failed to load interview");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await startInterview(businessId);
      if (result.error) {
        setError(result.error);
      } else if (result.interviewId) {
        setInterviewId(result.interviewId);
        setStatus("in_progress");

        const msgs = await getInterviewMessages(result.interviewId);
        setMessages(msgs);
      }
    } catch (err) {
      setError("Failed to start interview");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!interviewId) return;

    try {
      const result = await sendMessage(interviewId, content);
      if (result.error) {
        setError(result.error);
      } else if (result) {
        setCurrentStage(result.stage);
        setCompletionPercentage(result.percentage ?? 0);

        const msgs = await getInterviewMessages(interviewId);
        setMessages(msgs);
      }
    } catch (err) {
      setError("Failed to send message");
    }
  };

  const handleSkip = async () => {
    if (!interviewId) return;

    try {
      const result = await skipQuestion(interviewId);
      if (result.error) {
        setError(result.error);
      } else if (result) {
        setCurrentStage(result.stage ?? currentStage);
        setCompletionPercentage(result.percentage ?? 0);

        const msgs = await getInterviewMessages(interviewId);
        setMessages(msgs);
      }
    } catch (err) {
      setError("Failed to skip question");
    }
  };

  const handleComplete = async () => {
    if (!interviewId) return;

    try {
      const result = await completeInterview(interviewId);
      if (result.error) {
        setError(result.error);
      } else {
        setStatus("completed");
        router.push("/business-brain/review");
      }
    } catch (err) {
      setError("Failed to complete interview");
    }
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

  if (status === "not_started") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Let&apos;s build your Business Brain
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            I&apos;ll ask you questions across 6 topics to help your AI manager understand your business.
            This takes about 5-10 minutes.
          </p>

          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium mb-2">We&apos;ll cover:</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">1</span>
                Business basics
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">2</span>
                Products & services
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">3</span>
                Your customers
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">4</span>
                Brand voice
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">5</span>
                Policies & pricing
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">6</span>
                Social media goals
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            You can skip any question. The AI will extract knowledge from your answers automatically.
          </p>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleStart} disabled={isLoading} size="lg">
            Start Interview
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Card>
          <CardContent className="py-3">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}
      <InterviewChat
        interviewId={interviewId!}
        initialMessages={messages}
        currentStage={currentStage}
        completionPercentage={completionPercentage}
        status={status}
        onSendMessage={handleSendMessage}
        onComplete={handleComplete}
        onSkip={handleSkip}
      />
    </div>
  );
}
