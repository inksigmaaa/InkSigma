import test from "node:test";
import assert from "node:assert/strict";
import {
  addVercelProjectDomain,
  buildVercelDnsRecords,
  getVercelDomainConfig,
} from "../services/vercelDomainService.ts";

const withEnv = async (
  values: Record<string, string | undefined>,
  fn: () => Promise<void> | void,
) => {
  const previous = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(values)) {
    previous.set(key, process.env[key]);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    await fn();
  } finally {
    for (const [key, value] of previous.entries()) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

test("getVercelDomainConfig reads required provider env", async () => {
  await withEnv(
    {
      VERCEL_TOKEN: "token_test",
      VERCEL_PROJECT_ID_OR_NAME: "inksigma-web",
      VERCEL_TEAM_ID: "team_123",
      VERCEL_API_TIMEOUT_MS: "1200",
    },
    () => {
      assert.deepEqual(getVercelDomainConfig(), {
        token: "token_test",
        projectIdOrName: "inksigma-web",
        teamId: "team_123",
        teamSlug: undefined,
        timeoutMs: 1200,
      });
    },
  );
});

test("addVercelProjectDomain attaches a domain to the configured project", async () => {
  await withEnv(
    {
      VERCEL_TOKEN: "token_test",
      VERCEL_PROJECT_ID_OR_NAME: "inksigma-web",
      VERCEL_TEAM_ID: "team_123",
    },
    async () => {
      const calls: Array<{ url: string; init: RequestInit }> = [];
      const fetchImpl = async (url: string | URL | Request, init?: RequestInit) => {
        calls.push({ url: String(url), init: init || {} });
        return jsonResponse({
          name: "www.example.com",
          verified: false,
          verification: [
            {
              type: "TXT",
              domain: "_vercel.www.example.com",
              value: "challenge",
            },
          ],
        });
      };

      const result = await addVercelProjectDomain("www.example.com", {
        fetchImpl: fetchImpl as typeof fetch,
      });

      assert.equal(result.name, "www.example.com");
      assert.equal(result.verified, false);
      assert.equal(calls.length, 1);
      assert.equal(
        calls[0].url,
        "https://api.vercel.com/v10/projects/inksigma-web/domains?teamId=team_123",
      );
      assert.equal(calls[0].init.method, "POST");
      assert.equal(
        (calls[0].init.headers as Record<string, string>).Authorization,
        "Bearer token_test",
      );
      assert.deepEqual(JSON.parse(String(calls[0].init.body)), {
        name: "www.example.com",
      });
    },
  );
});

test("addVercelProjectDomain is idempotent when the domain is already on the project", async () => {
  await withEnv(
    {
      VERCEL_TOKEN: "token_test",
      VERCEL_PROJECT_ID_OR_NAME: "inksigma-web",
    },
    async () => {
      const urls: string[] = [];
      const fetchImpl = async (url: string | URL | Request, init?: RequestInit) => {
        urls.push(`${init?.method || "GET"} ${String(url)}`);
        if (urls.length === 1) {
          return jsonResponse(
            {
              error: {
                code: "domain_already_exists",
                message: "Domain already exists in this project.",
              },
            },
            400,
          );
        }

        return jsonResponse({
          name: "www.example.com",
          verified: true,
        });
      };

      const result = await addVercelProjectDomain("www.example.com", {
        fetchImpl: fetchImpl as typeof fetch,
      });

      assert.equal(result.verified, true);
      assert.deepEqual(urls, [
        "POST https://api.vercel.com/v10/projects/inksigma-web/domains",
        "GET https://api.vercel.com/v9/projects/inksigma-web/domains/www.example.com",
      ]);
    },
  );
});

test("buildVercelDnsRecords maps Vercel recommended records", async () => {
  await withEnv(
    {
      VERCEL_TOKEN: "token_test",
      VERCEL_PROJECT_ID_OR_NAME: "inksigma-web",
    },
    async () => {
      const fetchImpl = async () =>
        jsonResponse({
          configuredBy: null,
          recommendedIPv4: [{ value: "76.76.21.21", rank: 1 }],
          recommendedCNAME: [{ value: "cname.vercel-dns.com", rank: 1 }],
          misconfigured: true,
        });

      const result = await buildVercelDnsRecords("example.com", {
        fetchImpl: fetchImpl as typeof fetch,
      });

      assert.equal(result.configuration.misconfigured, true);
      assert.deepEqual(result.records, [
        {
          type: "A",
          name: "@",
          value: "76.76.21.21",
          ttl: "Auto",
          role: "required",
        },
        {
          type: "CNAME",
          name: "www",
          value: "cname.vercel-dns.com",
          ttl: "Auto",
          role: "recommended",
        },
      ]);
    },
  );
});
