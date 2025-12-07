import { useEffect } from 'react';

interface MetaTagsProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

export function MetaTags({
  title,
  description,
  keywords,
  image,
  url = window.location.href,
  type = 'website'
}: MetaTagsProps) {
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = title;
    }

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property = false) => {
      const attribute = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;

      if (element) {
        element.content = content;
      } else {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        element.content = content;
        document.head.appendChild(element);
      }
    };

    // Basic meta tags
    if (description) {
      updateMetaTag('description', description);
    }

    if (keywords) {
      updateMetaTag('keywords', keywords);
    }

    // Open Graph tags
    if (title) {
      updateMetaTag('og:title', title, true);
    }

    if (description) {
      updateMetaTag('og:description', description, true);
    }

    updateMetaTag('og:url', url, true);
    updateMetaTag('og:type', type, true);

    if (image) {
      updateMetaTag('og:image', image, true);
    }

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    if (title) {
      updateMetaTag('twitter:title', title);
    }
    if (description) {
      updateMetaTag('twitter:description', description);
    }
    if (image) {
      updateMetaTag('twitter:image', image);
    }

  }, [title, description, keywords, image, url, type]);

  return null; // This component doesn't render anything
}