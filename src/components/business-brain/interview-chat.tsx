"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Send, CheckCircle, ChevronRight, SkipForward } from "lucide-react";

interface Message {
  id: string;
  role: "system" | "assistant" | "user";
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

interface InterviewChatProps {
  interviewId: string;
  initialMessages: Message[];
  currentStage: string;
  completionPercentage: number;
  status: string;
  onSendMessage: (message: string) => Promise<void>;
  onComplete: () => Promise<void>;
  onSkip: () => Promise<void>;
}

const STAGES = [
  { key: "business", label: "Business basics", icon: "1" },
  { key: "products_services", label: "Products & services", icon: "2" },
  { key: "customers", label: "Customers", icon: "3" },
  { key: "brand", label: "Brand voice", icon: "4" },
  { key: "policies", label: "Policies", icon: "5" },
  { key: "goals", label: "Goals", icon: "6" },
] as const;

const STAGE_ORDER = STAGES.map(s => s.key);

export function InterviewChat({
  interviewId,
  initialMessages,
  currentStage,
  completionPercentage,
  status,
  onSendMessage,
  onComplete,
  onSkip,
}: InterviewChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: text.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      await onSendMessage(text.trim());
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await onSkip();
    } catch (error) {
      console.error("Failed to skip:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const currentStageIndex = STAGE_ORDER.indexOf(currentStage as typeof STAGE_ORDER[number]);

  // Get the last assistant message to check for suggested_answers
  const lastAssistantMsg = [...messages].reverse().find(m => m.role === "assistant");
  const suggestedAnswers = (lastAssistantMsg?.metadata as Record<string, unknown>)?.suggested_answers as string[] | undefined;
  const hasOptions = suggestedAnswers && suggestedAnswers.length > 0;

  // Check if last message was already answered (last user message is after last assistant)
  const lastMsg = messages[messages.length - 1];
  const waitingForAnswer = lastMsg?.role === "assistant" && status !== "completed";

  return (
    <div className="flex h-[calc(100vh-200px)] flex-col">
      {/* Stage progress indicator */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">
              {STAGES[currentStageIndex]?.label || currentStage}
            </span>
            <span className="text-sm text-muted-foreground">
              {completionPercentage}% complete
            </span>
          </div>
          <Progress value={completionPercentage} className="h-2 mb-4" />

          <div className="flex items-center gap-1">
            {STAGES.map((stage, index) => {
              const isCompleted = index < currentStageIndex;
              const isCurrent = index === currentStageIndex;

              return (
                <div key={stage.key} className="flex items-center">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isCurrent
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      stage.icon
                    )}
                  </div>
                  {index < STAGES.length - 1 && (
                    <ChevronRight className="h-3 w-3 text-muted-foreground mx-0.5" />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-2 text-center">
            <Badge variant={status === "completed" ? "success" : "default"}>
              {STAGES[currentStageIndex]?.label || currentStage}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Chat area */}
      <Card className="flex-1 overflow-hidden">
        <CardHeader className="border-b py-3">
          <CardTitle className="text-base">Interview</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.role === "assistant" && (
                    <p className="text-xs font-medium text-muted-foreground mb-1">AI Interviewer</p>
                  )}
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-muted px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Input area */}
      {status === "completed" ? (
        <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
          <CheckCircle className="h-5 w-5" />
          <span>Interview completed! You can now review your extracted knowledge.</span>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {/* Option chips */}
          {waitingForAnswer && hasOptions && !isLoading && (
            <div className="flex flex-wrap gap-2">
              {suggestedAnswers!.map((option, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => handleSend(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          )}

          {/* Text input + buttons */}
          <div className="flex gap-2">
            <Textarea
              placeholder={waitingForAnswer && hasOptions ? "Or type your own answer..." : "Type your answer..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={2}
              className="flex-1"
            />
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isLoading}
                className="px-4"
              >
                <Send className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={isLoading}
                className="px-4"
                title="Skip this question"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Complete button */}
      {status !== "completed" && completionPercentage >= 60 && (
        <div className="mt-3 flex justify-center">
          <Button variant="default" onClick={onComplete} disabled={isLoading}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Finish Interview & Review Knowledge
          </Button>
        </div>
      )}
    </div>
  );
}
