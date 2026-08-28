"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Edit, Trash2 } from "lucide-react";

interface ExtractedKnowledge {
  products?: Array<{ name: string; description: string; confidence: number }>;
  services?: Array<{ name: string; description: string; confidence: number }>;
  faqs?: Array<{ question: string; answer: string; confidence: number }>;
  facts?: Array<{ category: string; title: string; content: string; confidence: number }>;
  businessFacts?: Array<{ category: string; title: string; content: string; confidence: number }>;
  locations?: Array<{ name: string; city: string; service_area: string; confidence: number }>;
  customerPersonas?: Array<{ name: string; description: string; pain_points: string; needs: string; confidence: number }>;
}

interface InterviewReviewProps {
  extractedKnowledge: ExtractedKnowledge;
  onApprove: (entityType: string, data: Record<string, unknown>) => Promise<void>;
  onReject: (entityType: string, index: number) => void;
}

export function InterviewReview({ extractedKnowledge, onApprove, onReject }: InterviewReviewProps) {
  const [approvedItems, setApprovedItems] = useState<string[]>([]);

  const products = extractedKnowledge.products || [];
  const services = extractedKnowledge.services || [];
  const faqs = extractedKnowledge.faqs || [];
  const facts = extractedKnowledge.facts || extractedKnowledge.businessFacts || [];
  const locations = extractedKnowledge.locations || [];
  const customerPersonas = extractedKnowledge.customerPersonas || [];

  const handleApprove = async (entityType: string, index: number, data: Record<string, unknown>) => {
    await onApprove(entityType, data);
    setApprovedItems(prev => [...prev, `${entityType}-${index}`]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Here&apos;s what I learned</h2>
        <p className="text-muted-foreground">
          Review the information extracted from your interview. You can approve, edit, or remove each item.
        </p>
      </div>

      {products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {products.map((product, i) => (
              <KnowledgeItem
                key={i}
                title={product.name}
                description={product.description}
                confidence={product.confidence}
                isApproved={approvedItems.includes(`products-${i}`)}
                onApprove={() => handleApprove("product", i, product)}
                onReject={() => onReject("products", i)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {services.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {services.map((service, i) => (
              <KnowledgeItem
                key={i}
                title={service.name}
                description={service.description}
                confidence={service.confidence}
                isApproved={approvedItems.includes(`services-${i}`)}
                onApprove={() => handleApprove("service", i, service)}
                onReject={() => onReject("services", i)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {faqs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Suggested FAQs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {faqs.map((faq, i) => (
              <KnowledgeItem
                key={i}
                title={faq.question}
                description={faq.answer}
                confidence={faq.confidence}
                isApproved={approvedItems.includes(`faqs-${i}`)}
                onApprove={() => handleApprove("faq", i, faq)}
                onReject={() => onReject("faqs", i)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {facts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Business Facts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {facts.map((fact, i) => (
              <KnowledgeItem
                key={i}
                title={fact.title}
                description={fact.content}
                confidence={fact.confidence}
                badge={fact.category}
                isApproved={approvedItems.includes(`facts-${i}`)}
                onApprove={() => handleApprove("fact", i, fact)}
                onReject={() => onReject("facts", i)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {locations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Locations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {locations.map((location, i) => (
              <KnowledgeItem
                key={i}
                title={location.name}
                description={`${location.city}${location.service_area ? ` - Service area: ${location.service_area}` : ""}`}
                confidence={location.confidence}
                isApproved={approvedItems.includes(`locations-${i}`)}
                onApprove={() => handleApprove("location", i, location)}
                onReject={() => onReject("locations", i)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {customerPersonas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Customer Personas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customerPersonas.map((persona, i) => (
              <KnowledgeItem
                key={i}
                title={persona.name}
                description={persona.description}
                confidence={persona.confidence}
                isApproved={approvedItems.includes(`personas-${i}`)}
                onApprove={() => handleApprove("persona", i, persona)}
                onReject={() => onReject("personas", i)}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KnowledgeItem({
  title,
  description,
  confidence,
  badge,
  isApproved,
  onApprove,
  onReject,
}: {
  title: string;
  description: string;
  confidence: number;
  badge?: string;
  isApproved: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className={`rounded-lg border p-4 ${isApproved ? "bg-green-50 dark:bg-green-950/20" : ""}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{title}</h4>
            {badge && <Badge variant="secondary">{badge}</Badge>}
            <Badge variant={confidence >= 0.8 ? "default" : "outline"}>
              {Math.round(confidence * 100)}% confident
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex gap-1">
          {isApproved ? (
            <Badge variant="default">
              <CheckCircle className="mr-1 h-3 w-3" />
              Approved
            </Badge>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={onApprove}>
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={onReject}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
