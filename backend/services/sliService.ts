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
};

const LATENCY_WINDOW_SIZE = 2_000;

class SliService {
  private readonly startedAt = Date.now();
  private requestCount = 0;
  private errorRequestCount = 0;
  private readonly latencyWindow: number[] = [];
  private authFailureCount = 0;
  private domainVerificationChecks = 0;
  private domainVerificationFailureCount = 0;

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
    };
  }
}

const sliService = new SliService();

export default sliService;
