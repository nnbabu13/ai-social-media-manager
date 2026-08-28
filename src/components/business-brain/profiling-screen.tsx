"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, CheckCircle } from "lucide-react";
import type { ProfilingScreen, ProfilingQuestion, ProfilingAnswer } from "@/types/business-profiling";

interface ProfilingScreenProps {
  screen: ProfilingScreen;
  screenIndex: number;
  totalScreens: number;
  initialAnswers?: ProfilingAnswer[];
  onNext: (answers: ProfilingAnswer[]) => void;
  onBack?: () => void;
}

export function ProfilingScreenComponent({
  screen,
  screenIndex,
  totalScreens,
  initialAnswers,
  onNext,
  onBack,
}: ProfilingScreenProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    if (initialAnswers) {
      for (const answer of initialAnswers) {
        initial[answer.question_id] = answer.selected_option_ids;
      }
    }
    return initial;
  });

  const [customTexts, setCustomTexts] = useState<Record<string, string>>({});
  const [showOther, setShowOther] = useState<Record<string, boolean>>({});

  const handleToggleOption = (questionId: string, optionId: string, mode: "single" | "multiple") => {
    setSelectedOptions(prev => {
      const current = prev[questionId] || [];
      if (mode === "single") {
        return { ...prev, [questionId]: [optionId] };
      }
      if (current.includes(optionId)) {
        return { ...prev, [questionId]: current.filter(id => id !== optionId) };
      }
      return { ...prev, [questionId]: [...current, optionId] };
    });
  };

  const handleNoneOfThese = (questionId: string) => {
    setSelectedOptions(prev => ({ ...prev, [questionId]: ["none"] }));
  };

  const handleOtherToggle = (questionId: string) => {
    setShowOther(prev => ({ ...prev, [questionId]: !prev[questionId] }));
    if (!showOther[questionId]) {
      setSelectedOptions(prev => {
        const current = prev[questionId] || [];
        if (!current.includes("other")) {
          return { ...prev, [questionId]: [...current, "other"] };
        }
        return prev;
      });
    }
  };

  const handleCustomText = (questionId: string, text: string) => {
    setCustomTexts(prev => ({ ...prev, [questionId]: text }));
    if (text.trim()) {
      setSelectedOptions(prev => {
        const current = prev[questionId] || [];
        if (!current.includes("other")) {
          return { ...prev, [questionId]: [...current, "other"] };
        }
        return prev;
      });
    }
  };

  const buildAnswers = (): ProfilingAnswer[] => {
    return screen.questions.map(q => {
      const selected = selectedOptions[q.id] || [];
      const customText = customTexts[q.id];
      return {
        question_id: q.id,
        selected_option_ids: selected,
        custom_text: customText || undefined,
      };
    });
  };

  const hasSelections = screen.questions.every(q => {
    const selected = selectedOptions[q.id] || [];
    return selected.length > 0;
  });

  const progress = ((screenIndex + 1) / totalScreens) * 100;

  if (screen.id === "review") {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
          <h2 className="text-xl font-bold">Profile Complete</h2>
          <p className="text-muted-foreground">
            Ready to generate your customer personas based on your selections.
          </p>
          <Button onClick={() => onNext([])} size="lg">
            Generate Personas
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Step {screenIndex + 1} of {totalScreens}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Screen */}
      <Card>
        <CardHeader>
          <CardTitle>{screen.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{screen.description}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {screen.questions.map(question => (
            <QuestionSection
              key={question.id}
              question={question}
              selected={selectedOptions[question.id] || []}
              customText={customTexts[question.id] || ""}
              showOther={showOther[question.id] || false}
              onToggle={(optionId) => handleToggleOption(question.id, optionId, question.selection_mode)}
              onNone={() => handleNoneOfThese(question.id)}
              onOtherToggle={() => handleOtherToggle(question.id)}
              onCustomText={(text) => handleCustomText(question.id, text)}
            />
          ))}

          <div className="flex justify-between pt-4">
            {onBack ? (
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
            ) : (
              <div />
            )}
            <Button
              onClick={() => onNext(buildAnswers())}
              disabled={!hasSelections}
            >
              Continue
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QuestionSection({
  question,
  selected,
  customText,
  showOther,
  onToggle,
  onNone,
  onOtherToggle,
  onCustomText,
}: {
  question: ProfilingQuestion;
  selected: string[];
  customText: string;
  showOther: boolean;
  onToggle: (optionId: string) => void;
  onNone: () => void;
  onOtherToggle: () => void;
  onCustomText: (text: string) => void;
}) {
  const isNoneSelected = selected.includes("none");
  const isOtherSelected = selected.includes("other");

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-medium">{question.title}</h3>
        {question.description && (
          <p className="text-sm text-muted-foreground">{question.description}</p>
        )}
        {question.selection_mode === "multiple" && (
          <p className="text-xs text-muted-foreground mt-1">Select all that apply</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {question.options.map(option => (
          <Badge
            key={option.id}
            variant={selected.includes(option.id) ? "default" : "outline"}
            className={`cursor-pointer px-3 py-1.5 text-sm transition-colors ${
              selected.includes(option.id)
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
            onClick={() => !isNoneSelected && onToggle(option.id)}
          >
            {option.label}
          </Badge>
        ))}

        {question.allow_none && (
          <Badge
            variant={isNoneSelected ? "destructive" : "outline"}
            className={`cursor-pointer px-3 py-1.5 text-sm transition-colors ${
              isNoneSelected ? "" : "hover:bg-muted"
            }`}
            onClick={onNone}
          >
            None of these
          </Badge>
        )}

        {question.allow_other && (
          <Badge
            variant={isOtherSelected ? "default" : "outline"}
            className={`cursor-pointer px-3 py-1.5 text-sm transition-colors ${
              isOtherSelected ? "bg-secondary text-secondary-foreground" : "hover:bg-muted"
            }`}
            onClick={onOtherToggle}
          >
            Other
          </Badge>
        )}
      </div>

      {showOther && (
        <Textarea
          placeholder="Tell us more..."
          value={customText}
          onChange={(e) => onCustomText(e.target.value)}
          rows={2}
          className="mt-2"
        />
      )}
    </div>
  );
}
