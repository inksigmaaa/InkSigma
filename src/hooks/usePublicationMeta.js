import { useEffect, useState } from 'react';

export function usePublicationMeta(subdomain = null) {
  const [publication, setPublication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndUpdateMeta = async () => {
      try {
        // If subdomain is provided, fetch by subdomain, otherwise fetch by user session
        const url = subdomain 
          ? `/api/publication/subdomain/${subdomain}`
          : "/api/publication/get";
          
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setPublication(data.publication);
          
          // Update favicon
          if (data.publication?.faviconUrl) {
            updateFavicon(`http://localhost:3001${data.publication.faviconUrl}`);
          }
          
          // Update page title
          if (data.publication?.name) {
            document.title = data.publication.name;
          }
          
          // Update meta description
          if (data.publication?.description) {
            updateMetaTag('description', data.publication.description);
          }
          
          // Update Open Graph meta tags
          if (data.publication?.name) {
            updateMetaTag('og:title', data.publication.name, 'property');
          }
          
          if (data.publication?.description) {
            updateMetaTag('og:description', data.publication.description, 'property');
          }
          
          if (data.publication?.metaOgImageUrl) {
            updateMetaTag('og:image', `http://localhost:3001${data.publication.metaOgImageUrl}`, 'property');
          }
        }
      } catch (error) {
        console.error("Error fetching publication:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndUpdateMeta();
  }, [subdomain]);

  return { publication, loading };
}

function updateFavicon(href) {
  let favicon = document.querySelector("link[rel='icon']");
  if (favicon) {
    favicon.href = href;
  } else {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = href;
    document.head.appendChild(favicon);
  }
}

function updateMetaTag(name, content, attribute = 'name') {
  let meta = document.querySelector(`meta[${attribute}='${name}']`);
  if (meta) {
    meta.content = content;
  } else {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, name);
    meta.content = content;
    document.head.appendChild(meta);
  }
}
