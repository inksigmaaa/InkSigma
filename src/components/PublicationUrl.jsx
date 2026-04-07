'use client';

import { getPublicationUrl } from "@/utils/publicationDomain";

export function PublicationUrl({ publication }) {
  return getPublicationUrl(publication);
}

export function usePublicationUrl(publication) {
  return getPublicationUrl(publication);
}
