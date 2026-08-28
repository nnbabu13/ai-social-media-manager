import type { ContentGenerationContext, ClaimValidation } from "@/types/content";

export function validateContentClaims(
  content: { caption?: string; hook?: string; script?: string; cta?: string },
  brain: ContentGenerationContext["businessBrain"]
): ClaimValidation {
  const unsupportedClaims: string[] = [];
  const warnings: string[] = [];

  const allText = [content.caption, content.hook, content.script, content.cta]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // Price/offer validation
  const pricePatterns = [
    /₹\s*\d+/g,
    /Rs\.?\s*\d+/g,
    /\$\s*\d+/g,
    /\d+%\s*off/g,
    /discount/gi,
    /free/gi,
  ];

  for (const pattern of pricePatterns) {
    const matches = allText.match(pattern);
    if (matches) {
      const matchText = matches[0].toLowerCase();
      const hasMatchingOffer = brain.facts.some((f) =>
        (f.category === "offers" || f.category === "pricing") &&
        f.content.toLowerCase().includes(matchText)
      );
      const hasProduct = brain.products.some((p) =>
        allText.includes(p.toLowerCase())
      );

      if (!hasMatchingOffer && !hasProduct) {
        unsupportedClaims.push(`Price/promotional claim "${matches[0]}" not supported by Business Brain`);
      }
    }
  }

  // Certification/award claims
  const certPatterns = [/certified/gi, /award/gi, /certification/gi, /accredited/gi, /licensed/gi];
  for (const pattern of certPatterns) {
    if (pattern.test(allText)) {
      const hasCert = brain.facts.some((f) =>
        f.content.toLowerCase().match(pattern)
      );
      if (!hasCert) {
        unsupportedClaims.push(`Certification/award claim found but not in Business Brain`);
      }
    }
  }

  // Testimonial validation
  if (/customer says|testimonial|review says|client says/i.test(allText)) {
    warnings.push("Content references customer testimonials — ensure real approved quotes are used");
  }

  // Delivery/location claims
  const deliveryPatterns = [/deliver(y|ies|ing)?/gi, /service area/gi, /\d+\s*km/gi];
  for (const pattern of deliveryPatterns) {
    if (pattern.test(allText)) {
      const hasLocation = brain.facts.some((f) =>
        f.content.toLowerCase().match(/deliver|service area|location/)
      );
      if (!hasLocation) {
        warnings.push("Delivery/location claims should be verified against Business Brain");
      }
    }
  }

  // Forbidden phrases check
  if (brain.brand?.forbiddenPhrases) {
    for (const phrase of brain.brand.forbiddenPhrases) {
      if (allText.includes(phrase.toLowerCase())) {
        unsupportedClaims.push(`Forbidden phrase "${phrase}" used`);
      }
    }
  }

  return {
    valid: unsupportedClaims.length === 0,
    unsupportedClaims,
    warnings,
  };
}
