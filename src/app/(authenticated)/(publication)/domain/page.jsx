"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getApiBase } from "@/utils/apiBase";
import {
  getSubdomainDomainLabel,
  getPublicationUrl,
  hasActiveCustomDomain,
} from "@/utils/publicationDomain";
import {
  validateCustomDomain,
  normalizeCustomDomain,
  normalizeSubdomain,
} from "@/utils/domainValidation";
import { usePublication } from "@/contexts/PublicationContext";
import { toast } from "sonner";

const EMPTY_DOMAIN_CONFIGURATION = {
  verificationRecord: null,
  routingTargets: {
    cname: [],
    ip: [],
  },
};

const DOMAIN_STATUS_LABELS = {
  pending_verification: "Pending verification",
  verified: "Routing pending",
  ssl_pending: "SSL pending",
  active: "Active",
  failed: "Verification failed",
};

const DOMAIN_STATUS_STYLES = {
  pending_verification: "border border-amber-200 bg-amber-50 text-amber-700",
  verified: "border border-blue-200 bg-blue-50 text-blue-700",
  ssl_pending: "border border-blue-200 bg-blue-50 text-blue-700",
  active: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  failed: "border border-red-200 bg-red-50 text-red-700",
};

const DOMAIN_STATUS_DESCRIPTIONS = {
  pending_verification:
    "Save the domain, add the TXT and routing records below, then run verify from this page.",
  verified:
    "Ownership is confirmed, but the domain is not pointing at InkSigma yet. Finish the CNAME or A/AAAA setup and verify again.",
  ssl_pending:
    "DNS is in place and SSL is still provisioning. Readers should continue using the current canonical host until activation finishes.",
  active:
    "This custom domain is the live canonical public host for the publication. Dashboard access still stays on the platform domain.",
  failed:
    "Verification failed. Check the TXT record, confirm the routing target, wait for DNS propagation, and verify again.",
};

const formatTimestamp = (value) => {
  if (!value) return "Not yet";

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "Not yet";
  }
};

function DnsRecordCard({
  title,
  description,
  recordType,
  host,
  values,
  onCopy,
}) {
  if (!host || !values?.length) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {description ? (
          <p className="text-sm leading-6 text-gray-600">{description}</p>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[160px,1fr]">
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
            Type
          </div>
          <div className="mt-1 text-sm font-medium text-gray-900">
            {recordType}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
            Host / Name
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="break-all text-sm font-medium text-gray-900">
              {host}
            </span>
            <button
              type="button"
              onClick={() => onCopy(host)}
              className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 transition hover:bg-gray-100"
            >
              Copy
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {values.map((value) => (
          <div
            key={`${recordType}-${value}`}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
          >
            <span className="min-w-[52px] text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
              Value
            </span>
            <span className="flex-1 break-all text-sm text-gray-900">
              {value}
            </span>
            <button
              type="button"
              onClick={() => onCopy(value)}
              className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 transition hover:bg-gray-100"
            >
              Copy
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DomainPage() {
  const { currentPublication, refreshCurrentPublication } = usePublication();
  const [customDomain, setCustomDomain] = useState("");
  const [subdomain, setSubdomain] = useState("subdomain");
  const [publicationId, setPublicationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedCustomDomain, setSavedCustomDomain] = useState("");
  const [editDomain, setEditDomain] = useState("");
  const [customDomainStatus, setCustomDomainStatus] = useState(null);
  const [customDomainVerificationError, setCustomDomainVerificationError] =
    useState("");
  const [customDomainVerifiedAt, setCustomDomainVerifiedAt] = useState(null);
  const [customDomainLastCheckedAt, setCustomDomainLastCheckedAt] =
    useState(null);
  const [customDomainConfiguration, setCustomDomainConfiguration] = useState(
    EMPTY_DOMAIN_CONFIGURATION,
  );
  const [canonicalHost, setCanonicalHost] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingDomain, setPendingDomain] = useState("");
  const [showRevertConfirmation, setShowRevertConfirmation] = useState(false);

  const applyPublicationDomainState = useCallback((pubData) => {
    const existingCustomDomain = pubData?.customDomain || "";
    setPublicationId(pubData?.id || null);
    setSubdomain(pubData?.subdomain || "subdomain");
    setSavedCustomDomain(existingCustomDomain);
    setEditDomain(existingCustomDomain);
    setCustomDomainStatus(pubData?.customDomainStatus || null);
    setCustomDomainVerificationError(pubData?.customDomainVerificationError || "");
    setCustomDomainVerifiedAt(pubData?.customDomainVerifiedAt || null);
    setCustomDomainLastCheckedAt(pubData?.customDomainLastCheckedAt || null);
    setCustomDomainConfiguration(
      pubData?.customDomainConfiguration || EMPTY_DOMAIN_CONFIGURATION,
    );
    setCanonicalHost(pubData?.canonicalHost || null);
  }, []);

  const loadPublicationData = useCallback(async () => {
    try {
      setError("");
      const apiBase = getApiBase();
      const targetPublicationId = currentPublication?.id;

      if (!targetPublicationId) {
        setLoading(false);
        return;
      }

      const pubRes = await fetch(
        `${apiBase}/api/publications/${targetPublicationId}/domain-management`,
        {
          credentials: "include",
        },
      );

      if (!pubRes.ok) {
        throw new Error("Failed to load publication");
      }

      const pubData = await pubRes.json();
      applyPublicationDomainState(pubData);
    } catch (err) {
      console.error("Error loading publication:", err);
      setError("Failed to load domain settings.");
    } finally {
      setLoading(false);
    }
  }, [applyPublicationDomainState, currentPublication?.id]);

  useEffect(() => {
    loadPublicationData();
  }, [loadPublicationData]);

  const currentDomain = getSubdomainDomainLabel(subdomain);
  const normalizedCurrentDomain = normalizeCustomDomain(currentDomain);
  const normalizedPublicationSubdomain = normalizeSubdomain(subdomain);
  const previewUrl = getPublicationUrl({
    subdomain,
    customDomain: savedCustomDomain,
    customDomainStatus,
  });
  const isCustomDomainLive = hasActiveCustomDomain({
    customDomain: savedCustomDomain,
    customDomainStatus,
  });
  const statusLabel =
    DOMAIN_STATUS_LABELS[customDomainStatus] ||
    (savedCustomDomain ? "Subdomain fallback" : "Subdomain only");
  const statusStyle =
    DOMAIN_STATUS_STYLES[customDomainStatus] ||
    "border border-gray-200 bg-gray-50 text-gray-700";
  const statusDescription =
    DOMAIN_STATUS_DESCRIPTIONS[customDomainStatus] ||
    "The platform subdomain remains canonical until the custom domain becomes active.";
  const effectiveCanonicalHost =
    canonicalHost ||
    (isCustomDomainLive
      ? normalizeCustomDomain(savedCustomDomain)
      : currentDomain);
  const verificationRecord =
    customDomainConfiguration?.verificationRecord || null;
  const cnameTargets =
    customDomainConfiguration?.routingTargets?.cname || [];
  const ipTargets = customDomainConfiguration?.routingTargets?.ip || [];

  const handleSaveChanges = () => {
    const normalizedDomain = normalizeCustomDomain(customDomain);
    const validation = validateCustomDomain(normalizedDomain);

    if (!normalizedDomain) return;
    if (!validation.valid) {
      setError(validation.error || "Invalid custom domain");
      return;
    }

    setError("");
    setPendingDomain(normalizedDomain);
    setShowConfirmation(true);
  };

  const handleEditSave = () => {
    const normalizedDomain = normalizeCustomDomain(editDomain);
    const isSwitchingBackToSubdomain =
      normalizedDomain === normalizedCurrentDomain ||
      normalizedDomain === normalizedPublicationSubdomain;

    if (!normalizedDomain || isSwitchingBackToSubdomain) {
      setShowRevertConfirmation(true);
      return;
    }

    const validation = validateCustomDomain(normalizedDomain);
    if (!validation.valid) {
      setError(validation.error || "Invalid custom domain");
      return;
    }

    setError("");
    setPendingDomain(normalizedDomain);
    setShowConfirmation(true);
  };

  const handleConfirmSave = async () => {
    if (!publicationId) return;

    try {
      setSaving(true);
      setError("");
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/api/publications/${publicationId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customDomain: pendingDomain,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save domain");
      }

      const updated = await response.json();
      await refreshCurrentPublication();
      applyPublicationDomainState(updated);
      setCustomDomain("");
      setShowConfirmation(false);
      setPendingDomain("");
      toast.success("Custom domain saved");
    } catch (err) {
      setError(err.message || "Failed to save domain");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSave = () => {
    setShowConfirmation(false);
    setPendingDomain("");
  };

  const handleConfirmRevert = async () => {
    if (!publicationId) return;

    try {
      setSaving(true);
      setError("");
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/api/publications/${publicationId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customDomain: "",
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to revert to subdomain");
      }

      const updated = await response.json();
      await refreshCurrentPublication();
      applyPublicationDomainState(updated);
      setCustomDomain("");
      setShowRevertConfirmation(false);
      toast.success("Reverted to platform subdomain");
    } catch (err) {
      setError(err.message || "Failed to revert to subdomain");
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!publicationId || !savedCustomDomain) return;

    try {
      setVerifying(true);
      setError("");
      const apiBase = getApiBase();
      const response = await fetch(
        `${apiBase}/api/publications/${publicationId}/custom-domain/verify`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to verify domain");
      }

      const updated = await response.json();
      await refreshCurrentPublication();
      applyPublicationDomainState(updated);
      toast.success(
        updated.customDomainStatus === "active"
          ? "Custom domain is now active"
          : "Verification checked. DNS still needs attention.",
      );
    } catch (err) {
      setError(err.message || "Failed to verify domain");
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      if (!text) return;

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        toast.success("Copied");
        return;
      }

      if (typeof document !== "undefined") {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        toast.success("Copied");
        return;
      }

      throw new Error("Clipboard is not available");
    } catch (err) {
      console.error("Error copying:", err);
      toast.error("Failed to copy. Please copy it manually.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Loading domain settings...
      </div>
    );
  }

  return (
    <>
      <div className="w-full min-h-screen px-4 pb-20 pt-24 md:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-3 border-b border-gray-200 pb-6">
              <h1 className="text-2xl font-semibold text-gray-900">
                Custom Domain
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-gray-600">
                The publication can run on a custom public hostname, but the
                dashboard and admin surfaces stay on the InkSigma platform
                domain. Save the hostname, add the DNS records below, and use
                verify to activate it.
              </p>
            </div>

            {error ? (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
              <section className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      Current routing
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      The platform subdomain is always preserved. Historical
                      hostnames redirect to the canonical public host once the
                      custom domain is active.
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyle}`}
                  >
                    {statusLabel}
                  </span>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                      Platform subdomain
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="break-all text-sm font-medium text-gray-900">
                        {currentDomain}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(currentDomain)}
                        className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600 transition hover:bg-gray-100"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                      Canonical public host
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="break-all text-sm font-medium text-gray-900">
                        {effectiveCanonicalHost || "Not yet assigned"}
                      </span>
                      {effectiveCanonicalHost ? (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(effectiveCanonicalHost)}
                          className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600 transition hover:bg-gray-100"
                        >
                          Copy
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        Verification status
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-gray-600">
                        {statusDescription}
                      </p>
                    </div>
                    {savedCustomDomain ? (
                      <Button
                        type="button"
                        onClick={handleVerifyDomain}
                        disabled={verifying}
                        className="bg-black text-white hover:bg-gray-800"
                      >
                        {verifying ? "Checking DNS..." : "Verify domain"}
                      </Button>
                    ) : null}
                  </div>

                  {customDomainVerificationError ? (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {customDomainVerificationError}
                    </div>
                  ) : null}

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                        Last verified
                      </div>
                      <div className="mt-1 text-sm text-gray-900">
                        {formatTimestamp(customDomainVerifiedAt)}
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                        Last checked
                      </div>
                      <div className="mt-1 text-sm text-gray-900">
                        {formatTimestamp(customDomainLastCheckedAt)}
                      </div>
                    </div>
                  </div>

                  {previewUrl ? (
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex text-sm font-medium text-black underline-offset-4 hover:underline"
                    >
                      Open public site
                    </a>
                  ) : null}
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-5">
                <h2 className="text-base font-semibold text-gray-900">
                  {savedCustomDomain ? "Update custom domain" : "Add custom domain"}
                </h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  Enter the exact hostname readers should visit. You can use a
                  root domain such as <span className="font-medium">example.com</span>
                  {" "}or a subdomain such as{" "}
                  <span className="font-medium">blog.example.com</span>.
                </p>

                <div className="mt-5 space-y-2">
                  <label className="block text-sm font-medium text-gray-900">
                    Custom domain
                  </label>
                  <Input
                    type="text"
                    placeholder="stories.example.com"
                    value={savedCustomDomain ? editDomain : customDomain}
                    onChange={(event) =>
                      savedCustomDomain
                        ? setEditDomain(event.target.value)
                        : setCustomDomain(event.target.value)
                    }
                    className="w-full"
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Button
                    type="button"
                    onClick={savedCustomDomain ? handleEditSave : handleSaveChanges}
                    disabled={
                      saving ||
                      !(savedCustomDomain ? editDomain.trim() : customDomain.trim())
                    }
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    {saving ? "Saving..." : "Save domain"}
                  </Button>

                  {savedCustomDomain ? (
                    <button
                      type="button"
                      onClick={() => setShowRevertConfirmation(true)}
                      disabled={saving}
                      className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Revert to subdomain
                    </button>
                  ) : null}
                </div>

                <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
                  Dashboard access remains on the platform domain. Changing the
                  custom domain only affects the public publication host, SEO
                  canonical URLs, redirects, and reader-facing traffic.
                </div>
              </section>
            </div>

            <section
              id="instructions"
              className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-5"
            >
              <div className="flex flex-col gap-2">
                <h2 className="text-base font-semibold text-gray-900">
                  DNS setup
                </h2>
                <p className="text-sm leading-6 text-gray-600">
                  Save the domain first, add the DNS records shown here in your
                  registrar or DNS provider, wait for propagation, and then run
                  verify from this page.
                </p>
              </div>

              {savedCustomDomain ? (
                <div className="mt-6 space-y-4">
                  <DnsRecordCard
                    title="Ownership verification"
                    description="Create this TXT record exactly as shown. InkSigma uses it to confirm that you control the domain."
                    recordType="TXT"
                    host={verificationRecord?.host}
                    values={verificationRecord?.value ? [verificationRecord.value] : []}
                    onCopy={copyToClipboard}
                  />

                  <DnsRecordCard
                    title="Subdomain routing"
                    description="Use this CNAME target when connecting a hostname such as blog.example.com."
                    recordType="CNAME"
                    host={savedCustomDomain}
                    values={cnameTargets}
                    onCopy={copyToClipboard}
                  />

                  <DnsRecordCard
                    title="Apex / root routing"
                    description="Use these A or AAAA targets when connecting the root domain such as example.com."
                    recordType="A / AAAA"
                    host={savedCustomDomain}
                    values={ipTargets}
                    onCopy={copyToClipboard}
                  />

                  {!verificationRecord && !cnameTargets.length && !ipTargets.length ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      No DNS targets are configured on the server yet. Set
                      `CUSTOM_DOMAIN_CNAME_TARGET` or
                      `CUSTOM_DOMAIN_IP_TARGET`, then reload this page.
                    </div>
                  ) : null}

                  <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Recommended rollout
                    </h3>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                          Step 1
                        </div>
                        <p className="mt-1 text-sm leading-6 text-gray-700">
                          Add the TXT record first so ownership verification can
                          succeed independently of routing.
                        </p>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                          Step 2
                        </div>
                        <p className="mt-1 text-sm leading-6 text-gray-700">
                          Add either the CNAME target for a subdomain or the A /
                          AAAA targets for the root domain.
                        </p>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                          Step 3
                        </div>
                        <p className="mt-1 text-sm leading-6 text-gray-700">
                          Wait for DNS propagation, then run verify. The custom
                          domain becomes canonical only after activation.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-sm text-gray-600">
                  Save a custom domain first. InkSigma will generate the TXT
                  verification record and show the routing targets here.
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      <Dialog
        open={showConfirmation}
        onOpenChange={(open) => !open && !saving && handleCancelSave()}
      >
        <DialogContent
          className="w-[calc(100vw-2rem)] max-w-[420px] rounded-xl border-none bg-white p-6 shadow-2xl"
          showClose={false}
        >
          <DialogTitle className="sr-only">Confirm domain change</DialogTitle>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Confirm custom domain
            </h3>
            <p className="text-sm leading-6 text-gray-600">
              InkSigma will save this hostname, keep the platform subdomain as a
              fallback, and mark the new domain for verification.
            </p>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                New custom domain
              </div>
              <div className="mt-1 break-all text-base font-medium text-gray-900">
                {pendingDomain}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelSave}
                disabled={saving}
                className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <Button
                type="button"
                onClick={handleConfirmSave}
                disabled={saving}
                className="bg-black text-white hover:bg-gray-800"
              >
                {saving ? "Saving..." : "Confirm"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showRevertConfirmation}
        onOpenChange={(open) => !open && !saving && setShowRevertConfirmation(false)}
      >
        <DialogContent
          className="w-[calc(100vw-2rem)] max-w-[420px] rounded-xl border-none bg-white p-6 shadow-2xl"
          showClose={false}
        >
          <DialogTitle className="sr-only">Revert to subdomain</DialogTitle>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Revert to platform subdomain
            </h3>
            <p className="text-sm leading-6 text-gray-600">
              The publication will go back to the InkSigma subdomain as its
              canonical host. The previous custom domain will remain in hostname
              history and redirect if it still points to InkSigma.
            </p>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                Canonical host after revert
              </div>
              <div className="mt-1 break-all text-base font-medium text-gray-900">
                {currentDomain}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRevertConfirmation(false)}
                disabled={saving}
                className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <Button
                type="button"
                onClick={handleConfirmRevert}
                disabled={saving}
                className="bg-black text-white hover:bg-gray-800"
              >
                {saving ? "Saving..." : "Revert"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
