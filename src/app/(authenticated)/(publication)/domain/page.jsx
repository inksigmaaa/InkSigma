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
  pending_verification: "border-amber-200 bg-amber-50 text-amber-800",
  verified: "border-sky-200 bg-sky-50 text-sky-800",
  ssl_pending: "border-indigo-200 bg-indigo-50 text-indigo-800",
  active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  failed: "border-rose-200 bg-rose-50 text-rose-800",
};

const DOMAIN_STATUS_ACCENTS = {
  pending_verification: {
    dot: "bg-amber-400",
    ring: "shadow-[0_0_0_6px_rgba(251,191,36,0.18)]",
    hero: "from-amber-500/20 via-orange-400/10 to-transparent",
  },
  verified: {
    dot: "bg-sky-400",
    ring: "shadow-[0_0_0_6px_rgba(56,189,248,0.16)]",
    hero: "from-sky-500/20 via-cyan-400/10 to-transparent",
  },
  ssl_pending: {
    dot: "bg-indigo-400",
    ring: "shadow-[0_0_0_6px_rgba(129,140,248,0.16)]",
    hero: "from-indigo-500/20 via-violet-400/10 to-transparent",
  },
  active: {
    dot: "bg-emerald-400",
    ring: "shadow-[0_0_0_6px_rgba(52,211,153,0.16)]",
    hero: "from-emerald-500/20 via-teal-400/10 to-transparent",
  },
  failed: {
    dot: "bg-rose-400",
    ring: "shadow-[0_0_0_6px_rgba(251,113,133,0.18)]",
    hero: "from-rose-500/20 via-red-400/10 to-transparent",
  },
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

function CopyButton({ value, onCopy, dark = false }) {
  if (!value) return null;

  return (
    <button
      type="button"
      onClick={() => onCopy(value)}
      className={
        dark
          ? "rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur transition hover:bg-white/15 hover:text-white"
          : "rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
      }
    >
      Copy
    </button>
  );
}

function MetricCard({ label, value, helper, onCopy }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
        {label}
      </div>
      <div className="mt-3 flex items-start gap-3">
        <div className="min-w-0 flex-1 break-all font-mono text-sm font-semibold leading-6 text-white">
          {value || "Not assigned"}
        </div>
        <CopyButton value={value} onCopy={onCopy} dark />
      </div>
      {helper ? (
        <p className="mt-2 text-xs leading-5 text-white/50">{helper}</p>
      ) : null}
    </div>
  );
}

function DnsRecordCard({ title, description, recordType, host, values, onCopy }) {
  if (!host || !values?.length) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_20px_60px_-50px_rgba(15,23,42,0.55)]">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-950">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-gray-500">{description}</p>
          ) : null}
        </div>
        <span className="w-fit rounded-full border border-gray-200 bg-gray-50 px-3 py-1 font-mono text-xs font-semibold text-gray-700">
          {recordType}
        </span>
      </div>

      <div className="divide-y divide-gray-100">
        <div className="grid gap-3 px-5 py-4 md:grid-cols-[120px,1fr,auto] md:items-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
            Host / name
          </div>
          <div className="break-all font-mono text-sm font-medium text-gray-950">
            {host}
          </div>
          <CopyButton value={host} onCopy={onCopy} />
        </div>

        {values.map((value) => (
          <div
            key={`${recordType}-${value}`}
            className="grid gap-3 px-5 py-4 md:grid-cols-[120px,1fr,auto] md:items-center"
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
              Value
            </div>
            <div className="break-all font-mono text-sm font-medium text-gray-950">
              {value}
            </div>
            <CopyButton value={value} onCopy={onCopy} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SetupStep({ number, title, description }) {
  return (
    <div className="relative rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gray-950 text-xs font-semibold text-white">
          {number}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-950">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-gray-500">{description}</p>
        </div>
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
    "border-gray-200 bg-gray-50 text-gray-700";
  const statusAccent =
    DOMAIN_STATUS_ACCENTS[customDomainStatus] ||
    {
      dot: "bg-gray-400",
      ring: "shadow-[0_0_0_6px_rgba(148,163,184,0.16)]",
      hero: "from-gray-400/20 via-slate-400/10 to-transparent",
    };
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
      <div className="relative w-full min-h-screen overflow-hidden bg-[#F7F4EE] pb-24 pt-[112px] max-md:px-4 max-md:pt-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_22%_10%,rgba(169,65,251,0.18),transparent_32%),radial-gradient(circle_at_78%_18%,rgba(16,185,129,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,244,238,0))]" />
        <div className="relative mx-auto max-w-[1120px] px-5 max-md:px-0">
          <div className="md:pl-[195px]">
            <div className="overflow-hidden rounded-[30px] border border-black/10 bg-white/85 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.65)] backdrop-blur max-md:rounded-2xl">
              <div className="relative overflow-hidden bg-[#111111] px-6 py-7 text-white md:px-8 md:py-8">
                <div className={`absolute inset-0 bg-gradient-to-br ${statusAccent.hero}`} />
                <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full border border-white/10" />
                <div className="absolute -bottom-24 left-16 h-64 w-64 rounded-full bg-white/[0.04] blur-3xl" />

                <div className="relative">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="max-w-2xl">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle}`}>
                          <span className={`h-2 w-2 rounded-full ${statusAccent.dot} ${statusAccent.ring}`} />
                          {statusLabel}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/60">
                          Control plane stays on InkSigma
                        </span>
                      </div>
                      <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">
                        Custom domain control room
                      </h1>
                      <p className="mt-3 max-w-xl text-sm leading-6 text-white/62 md:text-[15px]">
                        Connect a reader-facing hostname, verify ownership, and
                        keep the dashboard safely on the platform domain.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {savedCustomDomain ? (
                        <Button
                          type="button"
                          onClick={handleVerifyDomain}
                          disabled={verifying}
                          className="rounded-full bg-white px-5 text-sm font-semibold text-gray-950 hover:bg-white/90"
                        >
                          {verifying ? "Checking DNS..." : "Verify now"}
                        </Button>
                      ) : null}
                      {previewUrl ? (
                        <a
                          href={previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-10 items-center rounded-full border border-white/15 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/15"
                        >
                          Open public site
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-7 grid gap-3 md:grid-cols-2">
                    <MetricCard
                      label="Platform subdomain"
                      value={currentDomain}
                      helper="Always preserved as a fallback and redirect target."
                      onCopy={copyToClipboard}
                    />
                    <MetricCard
                      label="Canonical public host"
                      value={effectiveCanonicalHost}
                      helper="This is the host readers and search engines should use."
                      onCopy={copyToClipboard}
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8">

            {error ? (
              <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {error}
              </div>
            ) : null}

            <div className="grid gap-5 xl:grid-cols-[1.08fr,0.92fr]">
              <section className="rounded-[24px] border border-gray-200 bg-[#FBFAF7] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-gray-950">
                      Health and routing
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-gray-500">
                      The domain only becomes canonical after ownership and DNS
                      routing both pass.
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle}`}
                  >
                    {statusLabel}
                  </span>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                      Last verified
                    </div>
                    <div className="mt-2 text-sm font-semibold text-gray-950">
                      {formatTimestamp(customDomainVerifiedAt)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                      Last checked
                    </div>
                    <div className="mt-2 text-sm font-semibold text-gray-950">
                      {formatTimestamp(customDomainLastCheckedAt)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5">
                  <h3 className="text-sm font-semibold text-gray-950">
                    Current diagnosis
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    {statusDescription}
                  </p>

                  {customDomainVerificationError ? (
                    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800">
                      {customDomainVerificationError}
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-wrap gap-3">
                    {savedCustomDomain ? (
                      <Button
                        type="button"
                        onClick={handleVerifyDomain}
                        disabled={verifying}
                        className="rounded-full bg-gray-950 px-5 text-white hover:bg-gray-800"
                      >
                        {verifying ? "Checking DNS..." : "Run verification"}
                      </Button>
                    ) : null}
                    {previewUrl ? (
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-10 items-center rounded-full border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        Open public site
                      </a>
                    ) : null}
                  </div>
                </div>
              </section>

              <section className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-[0_20px_60px_-50px_rgba(15,23,42,0.5)]">
                <div className="rounded-2xl bg-[#111111] p-5 text-white">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                    Domain control
                  </div>
                  <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em]">
                  {savedCustomDomain ? "Update custom domain" : "Add custom domain"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-white/55">
                    Save the exact hostname readers should type. Verification
                    runs separately so DNS propagation never blocks editing.
                  </p>
                </div>

                <p className="mt-5 text-sm leading-6 text-gray-500">
                  Enter the exact hostname readers should visit. You can use a
                  root domain such as <span className="font-medium">example.com</span>
                  {" "}or a subdomain such as{" "}
                  <span className="font-medium">blog.example.com</span>.
                </p>

                <div className="mt-5 space-y-2">
                  <label className="block text-sm font-semibold text-gray-950">
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
                    className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 font-mono text-sm shadow-none focus-visible:ring-gray-950"
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
                    className="rounded-full bg-gray-950 px-5 text-white hover:bg-gray-800"
                  >
                    {saving ? "Saving..." : "Save domain"}
                  </Button>

                  {savedCustomDomain ? (
                    <button
                      type="button"
                      onClick={() => setShowRevertConfirmation(true)}
                      disabled={saving}
                      className="rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Revert to subdomain
                    </button>
                  ) : null}
                </div>

                <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900">
                  Dashboard access remains on the platform domain. Changing the
                  custom domain only affects the public publication host, SEO
                  canonical URLs, redirects, and reader-facing traffic.
                </div>
              </section>
            </div>

            <section
              id="instructions"
              className="mt-6 rounded-[24px] border border-gray-200 bg-[#FBFAF7] p-5 md:p-6"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                    DNS setup
                  </div>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-gray-950">
                    Records to publish
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                    Add these records in your DNS provider, wait for propagation,
                    then run verification. Use CNAME for subdomains and A/AAAA
                    records for apex domains.
                  </p>
                </div>
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
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                      No DNS targets are configured on the server yet. Set
                      `CUSTOM_DOMAIN_CNAME_TARGET` or
                      `CUSTOM_DOMAIN_IP_TARGET`, then reload this page.
                    </div>
                  ) : null}

                  <div className="rounded-[24px] border border-gray-200 bg-white p-5">
                    <h3 className="text-sm font-semibold text-gray-950">
                      Recommended rollout
                    </h3>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <SetupStep
                        number="1"
                        title="Verify ownership"
                        description="Add the TXT record first so ownership can pass independently of routing."
                      />
                      <SetupStep
                        number="2"
                        title="Point traffic"
                        description="Add the CNAME target for a subdomain or A/AAAA targets for a root domain."
                      />
                      <SetupStep
                        number="3"
                        title="Activate"
                        description="Wait for DNS propagation, then run verification from this page."
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-8 text-sm leading-6 text-gray-500">
                  Save a custom domain first. InkSigma will generate the TXT
                  verification record and show routing targets here.
                </div>
              )}
            </section>
              </div>
            </div>
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
