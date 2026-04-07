import test from "node:test";
import assert from "node:assert/strict";
import { SliService } from "../services/sliService.ts";

test("SliService tracks view dedupe and scheduler counters", () => {
  const service = new SliService();

  service.recordViewTracking({
    isNewView: false,
    dedupeHit: true,
    usedDatabaseFallback: false,
  });
  service.recordViewTracking({
    isNewView: true,
    dedupeHit: false,
    usedDatabaseFallback: true,
  });
  service.recordSchedulerRun({ batches: 3 });
  service.recordSchedulerPublish(true);
  service.recordSchedulerPublish(false);

  const snapshot = service.getSnapshot();

  assert.equal(snapshot.viewTracking.attempts, 2);
  assert.equal(snapshot.viewTracking.newViews, 1);
  assert.equal(snapshot.viewTracking.dedupeHits, 1);
  assert.equal(snapshot.viewTracking.dbFallbacks, 1);
  assert.equal(snapshot.scheduler.runs, 1);
  assert.equal(snapshot.scheduler.batches, 3);
  assert.equal(snapshot.scheduler.published, 1);
  assert.equal(snapshot.scheduler.publishFailures, 1);
});

test("SliService keeps API percentile tracking intact", () => {
  const service = new SliService();

  service.recordRequest(10, 200);
  service.recordRequest(20, 200);
  service.recordRequest(200, 500);

  const snapshot = service.getSnapshot();

  assert.equal(snapshot.api.totalRequests, 3);
  assert.equal(snapshot.api.errorRequests, 1);
  assert.equal(snapshot.api.p95LatencyMs, 200);
});
