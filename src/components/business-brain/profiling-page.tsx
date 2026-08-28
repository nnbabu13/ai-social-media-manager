"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProfilingScreenComponent } from "@/components/business-brain/profiling-screen";
import { PersonaReview } from "@/components/business-brain/persona-review";
import { startProfiling, saveProfilingAnswers, generatePersonas, approvePersona, approveAllPersonas } from "@/app/actions/profiling";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Brain } from "lucide-react";
import type { ProfilingScreen, ProfilingAnswer, GeneratedPersona } from "@/types/business-profiling";

interface ProfilingPageProps {
  businessId: string;
}

export function ProfilingPage({ businessId }: ProfilingPageProps) {
  const router = useRouter();
  const [screens, setScreens] = useState<ProfilingScreen[]>([]);
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [allAnswers, setAllAnswers] = useState<Record<string, ProfilingAnswer[]>>({});
  const [personas, setPersonas] = useState<GeneratedPersona[]>([]);
  const [derivedInsights, setDerivedInsights] = useState<string[]>([]);
  const [phase, setPhase] = useState<"loading" | "profiling" | "generating" | "review" | "done">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfiling();
  }, [businessId]);

  const loadProfiling = async () => {
    try {
      const result = await startProfiling(businessId);
      if (result.error) {
        setError(result.error);
        setPhase("done");
      } else if (result.screens) {
        setScreens(result.screens);
        setPhase("profiling");
      }
    } catch (err) {
      setError("Failed to load profiling");
      setPhase("done");
    }
  };

  const handleScreenNext = async (answers: ProfilingAnswer[]) => {
    const screen = screens[currentScreenIndex];
    const updatedAnswers = { ...allAnswers, [screen.id]: answers };
    setAllAnswers(updatedAnswers);

    if (currentScreenIndex < screens.length - 1) {
      await saveProfilingAnswers(businessId, screen.id, answers, updatedAnswers);
      setCurrentScreenIndex(prev => prev + 1);
    } else {
      setPhase("generating");
      try {
        const result = await generatePersonas(businessId, updatedAnswers);
        if (result.error) {
          setError(result.error);
          setPhase("profiling");
        } else if (result.personas) {
          setPersonas(result.personas);
          setDerivedInsights(result.derived_insights || []);
          setPhase("review");
        }
      } catch (err) {
        setError("Failed to generate personas");
        setPhase("profiling");
      }
    }
  };

  const handleScreenBack = () => {
    if (currentScreenIndex > 0) {
      setCurrentScreenIndex(prev => prev - 1);
    }
  };

  const handleApprovePersona = async (index: number, edited?: Record<string, unknown>) => {
    await approvePersona(businessId, index, edited);
  };

  const handleApproveAll = async () => {
    await approveAllPersonas(businessId);
    setPhase("done");
    router.push("/business-brain");
  };

  const handleRegenerate = async () => {
    setPhase("generating");
    try {
      const result = await generatePersonas(businessId, allAnswers);
      if (result.personas) {
        setPersonas(result.personas);
        setDerivedInsights(result.derived_insights || []);
        setPhase("review");
      }
    } catch (err) {
      setError("Failed to regenerate personas");
      setPhase("review");
    }
  };

  if (phase === "loading") {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (phase === "done") {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <Brain className="h-12 w-12 mx-auto text-green-500" />
          <h2 className="text-xl font-bold">Your Business Brain is Ready</h2>
          <p className="text-muted-foreground">
            Personas approved. Your AI manager now understands your customers.
          </p>
          <Button onClick={() => router.push("/business-brain")} size="lg">
            Continue to Business Brain
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === "generating") {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <h2 className="text-xl font-bold">Generating your customer personas...</h2>
          <p className="text-muted-foreground">
            Analyzing your selections and creating AI-powered personas.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (phase === "review") {
    return (
      <div className="space-y-4">
        {error && (
          <Card>
            <CardContent className="py-3">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}
        <PersonaReview
          personas={personas}
          derivedInsights={derivedInsights}
          onApprove={handleApprovePersona}
          onApproveAll={handleApproveAll}
          onRegenerate={handleRegenerate}
        />
      </div>
    );
  }

  const currentScreen = screens[currentScreenIndex];

  return (
    <div className="space-y-4">
      {error && (
        <Card>
          <CardContent className="py-3">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}
      <ProfilingScreenComponent
        screen={currentScreen}
        screenIndex={currentScreenIndex}
        totalScreens={screens.length}
        initialAnswers={allAnswers[currentScreen.id]}
        onNext={handleScreenNext}
        onBack={currentScreenIndex > 0 ? handleScreenBack : undefined}
      />
    </div>
  );
}
