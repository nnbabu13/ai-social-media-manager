"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { searchKnowledge } from "@/app/actions/knowledge";

interface KnowledgeSectionProps {
  businessId: string;
}

export function KnowledgeSection({ businessId }: KnowledgeSectionProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Record<string, unknown[]>>({});
  const [isPending, startTransition] = useTransition();

  const handleSearch = () => {
    if (!query.trim()) return;
    startTransition(async () => {
      const data = await searchKnowledge(businessId, query.trim());
      setResults(data);
    });
  };

  const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Knowledge</h1>
        <p className="text-muted-foreground">Search everything your Business Brain knows.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products, services, FAQs, facts..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isPending || !query.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50"
            >
              {isPending ? "Searching..." : "Search"}
            </button>
          </div>
        </CardContent>
      </Card>

      {totalResults > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{totalResults} result{totalResults !== 1 ? "s" : ""} found</p>

          {results.products && results.products.length > 0 && (
            <KnowledgeGroup title="Products" items={results.products as Array<{ name: string; description: string }>} render={(item) => (
              <div><div className="font-medium">{item.name}</div>{item.description && <div className="text-sm text-muted-foreground">{item.description}</div>}</div>
            )} />
          )}

          {results.services && results.services.length > 0 && (
            <KnowledgeGroup title="Services" items={results.services as Array<{ name: string; description: string }>} render={(item) => (
              <div><div className="font-medium">{item.name}</div>{item.description && <div className="text-sm text-muted-foreground">{item.description}</div>}</div>
            )} />
          )}

          {results.faqs && results.faqs.length > 0 && (
            <KnowledgeGroup title="FAQs" items={results.faqs as Array<{ question: string; answer: string }>} render={(item) => (
              <div><div className="font-medium">Q: {item.question}</div><div className="text-sm text-muted-foreground">A: {item.answer}</div></div>
            )} />
          )}

          {results.facts && results.facts.length > 0 && (
            <KnowledgeGroup title="Facts" items={results.facts as Array<{ title: string; content: string; category: string }>} render={(item) => (
              <div>
                <div className="flex items-center gap-2"><Badge variant="outline" className="text-xs">{item.category}</Badge><span className="font-medium">{item.title}</span></div>
                <div className="text-sm text-muted-foreground mt-1">{item.content}</div>
              </div>
            )} />
          )}

          {results.offers && results.offers.length > 0 && (
            <KnowledgeGroup title="Offers" items={results.offers as Array<{ name: string; description: string }>} render={(item) => (
              <div><div className="font-medium">{item.name}</div>{item.description && <div className="text-sm text-muted-foreground">{item.description}</div>}</div>
            )} />
          )}

          {results.locations && results.locations.length > 0 && (
            <KnowledgeGroup title="Locations" items={results.locations as Array<{ name: string; address: string; city: string }>} render={(item) => (
              <div><div className="font-medium">{item.name}</div><div className="text-sm text-muted-foreground">{[item.address, item.city].filter(Boolean).join(", ")}</div></div>
            )} />
          )}

          {results.personas && results.personas.length > 0 && (
            <KnowledgeGroup title="Personas" items={results.personas as Array<{ name: string; description: string }>} render={(item) => (
              <div><div className="font-medium">{item.name}</div>{item.description && <div className="text-sm text-muted-foreground">{item.description}</div>}</div>
            )} />
          )}
        </div>
      )}

      {query && totalResults === 0 && !isPending && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No results found for &ldquo;{query}&rdquo;
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KnowledgeGroup<T>({ title, items, render }: { title: string; items: T[]; render: (item: T) => React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title} ({items.length})</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="p-3 rounded-lg border">{render(item)}</div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
