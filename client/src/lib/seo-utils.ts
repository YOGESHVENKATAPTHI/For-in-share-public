import type { Tag } from "@shared/schema";

export interface SEOMetadata {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  ogImage?: string;
}

/**
 * Generate SEO metadata from tags and content
 */
export function generateSEOMetadata(
  title: string,
  description: string,
  tags: Tag[],
  options: {
    maxTitleLength?: number;
    maxDescriptionLength?: number;
    maxKeywords?: number;
  } = {}
): SEOMetadata {
  const {
    maxTitleLength = 60,
    maxDescriptionLength = 160,
    maxKeywords = 10,
  } = options;

  // Generate meta title
  const tagNames = tags.map(tag => tag.name).join(", ");
  let metaTitle = title;

  if (tagNames && title.length + tagNames.length + 3 <= maxTitleLength) {
    metaTitle = `${title} - ${tagNames}`;
  } else if (title.length > maxTitleLength) {
    metaTitle = title.substring(0, maxTitleLength - 3) + "...";
  }

  // Generate meta description
  let metaDescription = description;
  if (tags.length > 0) {
    const tagString = `Tags: ${tagNames}`;
    if (description.length + tagString.length + 2 <= maxDescriptionLength) {
      metaDescription = `${description}. ${tagString}`;
    } else if (description.length > maxDescriptionLength * 0.7) {
      // If description is already quite long, just add a few key tags
      const keyTags = tags.slice(0, 3).map(tag => tag.name).join(", ");
      metaDescription = `${description.substring(0, maxDescriptionLength - keyTags.length - 10)}... Tags: ${keyTags}`;
    }
  }

  if (metaDescription.length > maxDescriptionLength) {
    metaDescription = metaDescription.substring(0, maxDescriptionLength - 3) + "...";
  }

  // Generate keywords
  const keywords = tags
    .slice(0, maxKeywords)
    .map(tag => tag.name.toLowerCase())
    .join(", ");

  return {
    metaTitle,
    metaDescription,
    keywords,
  };
}

/**
 * Generate structured data (JSON-LD) for better SEO
 */
export function generateStructuredData(
  type: 'forum' | 'file' | 'message',
  data: {
    id: string;
    title: string;
    description?: string;
    url: string;
    author?: {
      name: string;
      id: string;
    };
    tags: Tag[];
    createdAt: string;
    updatedAt?: string;
    image?: string;
  }
) {
  const baseData: any = {
    "@context": "https://schema.org",
    "@type": type === 'forum' ? "DiscussionForumPosting" : "CreativeWork",
    "name": data.title,
    "description": data.description,
    "url": data.url,
    "datePublished": data.createdAt,
    "dateModified": data.updatedAt || data.createdAt,
    "keywords": data.tags.map(tag => tag.name).join(", "),
    "about": data.tags.map(tag => ({
      "@type": "Thing",
      "name": tag.name,
      "description": tag.description,
    })),
  };

  if (data.author) {
    baseData["author"] = {
      "@type": "Person",
      "name": data.author.name,
      "identifier": data.author.id,
    };
  }

  if (data.image) {
    baseData["image"] = data.image;
  }

  if (type === 'forum') {
    baseData["@type"] = "DiscussionForumPosting";
    baseData["mainEntityOfPage"] = data.url;
  }

  return baseData;
}

/**
 * Extract keywords from text content for auto-tagging suggestions
 */
export function extractKeywords(text: string, maxKeywords: number = 10): string[] {
  // Simple keyword extraction - split by common separators and filter
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3) // Only words longer than 3 characters
    .filter(word => !['that', 'with', 'have', 'this', 'will', 'your', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were'].includes(word)); // Filter common stop words

  // Count frequency
  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  // Sort by frequency and return top keywords
  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word);
}