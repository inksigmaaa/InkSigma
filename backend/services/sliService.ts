type SliSnapshot = {
  uptimeSeconds: number;
  api: {
    totalRequests: number;
    errorRequests: number;
    errorRate: number;
    p95LatencyMs: number;
  };
  auth: {
    failures: number;
  };
  domainVerification: {
    checks: number;
    failures: number;
    failureRate: number;
  };
  viewTracking: {
    attempts: number;
    newViews: number;
    dedupeHits: number;
    dbFallbacks: number;
  };
  scheduler: {
    runs: number;
    batches: number;
    published: number;
    publishFailures: number;
  };
};

const LATENCY_WINDOW_SIZE = 2_000;

export class SliService {
  private readonly startedAt = Date.now();
  private requestCount = 0;
  private errorRequestCount = 0;
  private readonly latencyWindow: number[] = [];
  private authFailureCount = 0;
  private domainVerificationChecks = 0;
  private domainVerificationFailureCount = 0;
  private viewTrackingAttempts = 0;
  private viewTrackingNewViews = 0;
  private viewTrackingDedupeHits = 0;
  private viewTrackingDbFallbacks = 0;
  private schedulerRuns = 0;
  private schedulerBatches = 0;
  private schedulerPublished = 0;
  private schedulerPublishFailures = 0;

  recordRequest(durationMs: number, statusCode: number) {
    this.requestCount += 1;
    if (statusCode >= 500) {
      this.errorRequestCount += 1;
    }

    const normalizedDuration = Number.isFinite(durationMs)
      ? Math.max(0, Math.round(durationMs))
      : 0;

    this.latencyWindow.push(normalizedDuration);
    if (this.latencyWindow.length > LATENCY_WINDOW_SIZE) {
      this.latencyWindow.shift();
    }
  }

  recordAuthFailure() {
    this.authFailureCount += 1;
  }

  recordDomainVerification(success: boolean) {
    this.domainVerificationChecks += 1;
    if (!success) {
      this.domainVerificationFailureCount += 1;
    }
  }

  recordViewTracking(params: {
    isNewView: boolean;
    dedupeHit?: boolean;
    usedDatabaseFallback?: boolean;
  }) {
    this.viewTrackingAttempts += 1;

    if (params.isNewView) {
      this.viewTrackingNewViews += 1;
    }

    if (params.dedupeHit) {
      this.viewTrackingDedupeHits += 1;
    }

    if (params.usedDatabaseFallback) {
      this.viewTrackingDbFallbacks += 1;
    }
  }

  recordSchedulerRun(params: { batches?: number }) {
    this.schedulerRuns += 1;
    this.schedulerBatches += Math.max(0, Number(params.batches || 0));
  }

  recordSchedulerPublish(success: boolean) {
    if (success) {
      this.schedulerPublished += 1;
      return;
    }

    this.schedulerPublishFailures += 1;
  }

  private getLatencyPercentile(percentile: number) {
    if (this.latencyWindow.length === 0) return 0;

    const sorted = [...this.latencyWindow].sort((a, b) => a - b);
    const index = Math.min(
      sorted.length - 1,
      Math.max(0, Math.ceil((percentile / 100) * sorted.length) - 1),
    );

    return sorted[index] ?? 0;
  }

  getSnapshot(): SliSnapshot {
    const errorRate =
      this.requestCount > 0 ? this.errorRequestCount / this.requestCount : 0;
    const domainFailureRate =
      this.domainVerificationChecks > 0
        ? this.domainVerificationFailureCount / this.domainVerificationChecks
        : 0;

    return {
      uptimeSeconds: Math.round((Date.now() - this.startedAt) / 1000),
      api: {
        totalRequests: this.requestCount,
        errorRequests: this.errorRequestCount,
        errorRate,
        p95LatencyMs: this.getLatencyPercentile(95),
      },
      auth: {
        failures: this.authFailureCount,
      },
      domainVerification: {
        checks: this.domainVerificationChecks,
        failures: this.domainVerificationFailureCount,
        failureRate: domainFailureRate,
      },
      viewTracking: {
        attempts: this.viewTrackingAttempts,
        newViews: this.viewTrackingNewViews,
        dedupeHits: this.viewTrackingDedupeHits,
        dbFallbacks: this.viewTrackingDbFallbacks,
      },
      scheduler: {
        runs: this.schedulerRuns,
        batches: this.schedulerBatches,
        published: this.schedulerPublished,
        publishFailures: this.schedulerPublishFailures,
      },
    };
  }
}

const sliService = new SliService();

export default sliService;
