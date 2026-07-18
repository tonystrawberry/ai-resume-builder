import fixture from "@/lib/etl/fixtures/linkedin.json";

export type LinkedInFetchResult = {
  profileUrl: string;
  payload: unknown;
  source: "fixture" | "connector" | "apify";
  warnings: string[];
};

export interface LinkedInConnector {
  fetchPersonProfile(profileUrl: string): Promise<LinkedInFetchResult>;
}

const LINKEDIN_URL_RE =
  /^https?:\/\/([a-z]+\.)?linkedin\.com\/in\/[A-Za-z0-9\-_%]+\/?$/i;

const DEFAULT_APIFY_ACTOR = "harvestapi~linkedin-profile-scraper";
const DEFAULT_PROFILE_MODE = "Profile details no email ($4 per 1k)";

export function isValidLinkedInProfileUrl(url: string) {
  try {
    const parsed = new URL(url.trim());
    return LINKEDIN_URL_RE.test(parsed.href.replace(/\?.*$/, ""));
  } catch {
    return false;
  }
}

export function normalizeLinkedInProfileUrl(url: string) {
  const parsed = new URL(url.trim());
  parsed.search = "";
  parsed.hash = "";
  const path = parsed.pathname.replace(/\/+$/, "");
  return `${parsed.origin}${path}`;
}

/** Fixture-backed connector for local/dev without live scraper credits. */
export class FixtureLinkedInConnector implements LinkedInConnector {
  async fetchPersonProfile(profileUrl: string): Promise<LinkedInFetchResult> {
    return {
      profileUrl: normalizeLinkedInProfileUrl(profileUrl),
      payload: {
        ...fixture,
        profile_url: normalizeLinkedInProfileUrl(profileUrl),
      },
      source: "fixture",
      warnings: [
        "Using sample LinkedIn data. Set APIFY_TOKEN to import real profiles via Apify.",
      ],
    };
  }
}

/**
 * Apify actor runner for harvestapi/linkedin-profile-scraper (or override).
 * Env: APIFY_TOKEN (required), optional APIFY_LINKEDIN_ACTOR_ID.
 */
export class ApifyLinkedInConnector implements LinkedInConnector {
  constructor(
    private readonly token: string,
    private readonly actorId: string = DEFAULT_APIFY_ACTOR,
  ) {}

  async fetchPersonProfile(profileUrl: string): Promise<LinkedInFetchResult> {
    const normalized = normalizeLinkedInProfileUrl(profileUrl);
    const actorPath = this.actorId.replace("/", "~");
    const runUrl = new URL(
      `https://api.apify.com/v2/acts/${actorPath}/runs`,
    );
    runUrl.searchParams.set("token", this.token);
    // Wait up to 5 minutes for the actor to finish (sync-ish).
    runUrl.searchParams.set("waitForFinish", "300");

    const runRes = await fetch(runUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        profileScraperMode:
          process.env.APIFY_LINKEDIN_PROFILE_MODE?.trim() ||
          DEFAULT_PROFILE_MODE,
        // HarvestAPI accepts either; send both for compatibility.
        queries: [normalized],
        urls: [normalized],
      }),
      cache: "no-store",
    });

    if (!runRes.ok) {
      const text = await runRes.text().catch(() => "");
      throw new Error(
        `Apify run failed (${runRes.status}): ${text.slice(0, 300)}`,
      );
    }

    const runJson = (await runRes.json()) as {
      data?: {
        id?: string;
        status?: string;
        defaultDatasetId?: string;
        statusMessage?: string;
      };
    };
    const run = runJson.data;
    if (!run?.defaultDatasetId) {
      throw new Error("Apify run did not return a dataset id");
    }
    if (run.status && !["SUCCEEDED", "SUCCEEDED_WITH_WARNINGS"].includes(run.status)) {
      // Still running after waitForFinish, or failed
      if (run.status === "RUNNING" || run.status === "READY") {
        throw new Error(
          "Apify scrape is still running — try again in a minute, or increase wait time.",
        );
      }
      throw new Error(
        `Apify run ${run.status}: ${run.statusMessage || "unknown error"}`,
      );
    }

    const itemsUrl = new URL(
      `https://api.apify.com/v2/datasets/${run.defaultDatasetId}/items`,
    );
    itemsUrl.searchParams.set("token", this.token);
    itemsUrl.searchParams.set("format", "json");
    itemsUrl.searchParams.set("clean", "1");

    const itemsRes = await fetch(itemsUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!itemsRes.ok) {
      const text = await itemsRes.text().catch(() => "");
      throw new Error(
        `Apify dataset fetch failed (${itemsRes.status}): ${text.slice(0, 300)}`,
      );
    }

    const items = (await itemsRes.json()) as unknown[];
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error(
        "Apify returned no profile data for that LinkedIn URL. Check the URL is public and try again.",
      );
    }

    return {
      profileUrl: normalized,
      payload: items[0],
      source: "apify",
      warnings: [],
    };
  }
}

/**
 * Generic HTTP connector: GET ?url= with Bearer token.
 * Kept for non-Apify providers.
 */
export class HttpLinkedInConnector implements LinkedInConnector {
  constructor(
    private readonly endpoint: string,
    private readonly apiKey: string,
  ) {}

  async fetchPersonProfile(profileUrl: string): Promise<LinkedInFetchResult> {
    const url = new URL(this.endpoint);
    url.searchParams.set("url", normalizeLinkedInProfileUrl(profileUrl));

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `LinkedIn connector failed (${res.status}): ${text.slice(0, 200)}`,
      );
    }

    const payload = await res.json();
    return {
      profileUrl: normalizeLinkedInProfileUrl(profileUrl),
      payload,
      source: "connector",
      warnings: [],
    };
  }
}

export function getLinkedInConnector(): LinkedInConnector {
  const apifyToken =
    process.env.APIFY_TOKEN?.trim() ||
    process.env.LINKEDIN_CONNECTOR_API_KEY?.trim();
  const apifyActor =
    process.env.APIFY_LINKEDIN_ACTOR_ID?.trim() || DEFAULT_APIFY_ACTOR;

  // Prefer Apify when a token is set (unless a generic HTTP URL is explicitly set
  // and looks like a non-Apify endpoint).
  const endpoint = process.env.LINKEDIN_CONNECTOR_URL?.trim();
  if (endpoint && apifyToken && !endpoint.includes("api.apify.com")) {
    return new HttpLinkedInConnector(endpoint, apifyToken);
  }

  if (apifyToken) {
    return new ApifyLinkedInConnector(apifyToken, apifyActor);
  }

  return new FixtureLinkedInConnector();
}
