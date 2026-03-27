import { headers } from "next/headers";
import {
  fetchPublicationForMetadata,
  getRequestHost,
} from "@/utils/publicationSeo";
import { getPublicationPageUrl } from "@/utils/publicationDomain";
import { parseHost } from "@/utils/hostParser";

const buildRobotsText = ({ allow = ["/"], disallow = [], sitemap = "" }) => {
  const lines = ["User-agent: *"];

  if (allow.length === 0 && disallow.length === 0) {
    lines.push("Disallow:");
  }

  allow.forEach((value) => lines.push(`Allow: ${value}`));
  disallow.forEach((value) => lines.push(`Disallow: ${value}`));

  if (sitemap) {
    lines.push(`Sitemap: ${sitemap}`);
  }

  return `${lines.join("\n")}\n`;
};

export async function GET() {
  const headerList = await headers();
  const host = getRequestHost(headerList);
  const parsedHost = parseHost(host);

  if (parsedHost.isDashboard) {
    return new Response(
      buildRobotsText({
        allow: [],
        disallow: ["/"],
      }),
      {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const publication = await fetchPublicationForMetadata({ host });

  if (publication?.id) {
    return new Response(
      buildRobotsText({
        allow: ["/"],
        sitemap: getPublicationPageUrl(publication, "/sitemap.xml"),
      }),
      {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  return new Response(
    buildRobotsText({
      allow: ["/"],
    }),
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}
