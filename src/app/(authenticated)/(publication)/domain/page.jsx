"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Copy } from "lucide-react";
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

const DOMAIN_STATUS_LABELS = {
  pending_verification: "Pending verification",
  verified: "DNS pending",
  ssl_pending: "SSL pending",
  active: "Custom Domain",
  failed: "Verification failed",
};

const DOMAIN_STATUS_STYLES = {
  pending_verification: "bg-amber-50 text-amber-700 border border-amber-200",
  verified: "bg-blue-50 text-blue-700 border border-blue-200",
  ssl_pending: "bg-blue-50 text-blue-700 border border-blue-200",
  active: "bg-[#F4F4F4] text-[#808080] border border-[#F4F4F4]",
  failed: "bg-red-50 text-red-700 border border-red-200",
};

function DnsSetupRecords({
  setupPlan,
  setupPlanRequestDomain,
  setupPlanLoading,
  setupPlanError,
  canVerifySavedDomain,
  verifying,
  onVerifyDomain,
  onCopyValue,
  customDomainVerificationError,
  savedCustomDomain,
}) {
  return (
    <div className="flex w-full flex-col gap-4 border-t border-[#EDEDED] pt-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div
            className="font-semibold text-[#A4A4A4] text-[12px] max-md:text-[8px] max-md:font-normal leading-[150%]"
            style={{ fontFamily: "Public Sans" }}
          >
            DNS SETUP RECORDS
          </div>
          <div
            className="font-semibold text-[#202020] text-[16px] max-md:text-[12px] max-md:font-normal leading-[28px] break-all"
            style={{ fontFamily: "Public Sans" }}
          >
            {setupPlan?.domain || setupPlanRequestDomain}
          </div>
          <p className="text-[12px] leading-[18px] text-[#696969] max-md:text-[10px]">
            {setupPlan?.domainType === "apex"
              ? "Add these records for your root domain."
              : "Add this CNAME record for your subdomain."}
          </p>
        </div>
        {canVerifySavedDomain && (
          <Button
            type="button"
            onClick={onVerifyDomain}
            disabled={verifying}
            className="bg-black text-white hover:bg-gray-800 min-w-[112px] text-xs h-9"
          >
            {verifying ? "Checking..." : "Verify DNS"}
          </Button>
        )}
      </div>

      {setupPlanLoading && (
        <div className="rounded border border-[#EAEAEA] bg-[#FAFAFA] px-4 py-3 text-sm text-[#696969]">
          Loading DNS records...
        </div>
      )}

      {setupPlanError && !setupPlanLoading && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {setupPlanError}
        </div>
      )}

      {!setupPlanLoading && setupPlan?.records?.length > 0 && (
        <div className="flex flex-col gap-3">
          {setupPlan.records.map((record, index) => {
            const recordKey = `${record.type}-${record.name}-${record.value}-${index}`;

            return (
              <div
                key={recordKey}
                className="rounded border border-[#EAEAEA] bg-[#FAFAFA] p-3"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] text-[#696969] border border-[#EAEAEA]">
                    {record.role === "required" ? "Required" : "Recommended"}
                  </span>
                </div>

                <div className="overflow-hidden rounded border border-[#EAEAEA] bg-white">
                  <div className="grid grid-cols-[64px_64px_minmax(0,1fr)] border-b border-[#EAEAEA] bg-[#FCFCFC] text-[10px] font-semibold uppercase leading-none tracking-wide text-[#A4A4A4] sm:grid-cols-[92px_92px_minmax(0,1fr)]">
                    <div className="px-3 py-2">Type</div>
                    <div className="border-l border-[#EAEAEA] px-3 py-2">Host</div>
                    <div className="border-l border-[#EAEAEA] px-3 py-2">Value</div>
                  </div>
                  <div className="grid grid-cols-[64px_64px_minmax(0,1fr)] items-stretch text-[13px] text-[#202020] sm:grid-cols-[92px_92px_minmax(0,1fr)]">
                    <div className="flex items-center px-3 py-3 font-medium">
                      {record.type}
                    </div>
                    <div className="flex items-center border-l border-[#EAEAEA] px-3 py-3">
                      {record.name}
                    </div>
                    <div className="flex min-w-0 items-center justify-between gap-2 border-l border-[#EAEAEA] px-3 py-2">
                      <span className="min-w-0 break-all">{record.value}</span>
                      <button
                        type="button"
                        onClick={() => onCopyValue(record.value)}
                        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded border border-[#EAEAEA] bg-[#FAFAFA] px-2.5 text-[12px] font-medium text-[#696969] transition hover:border-[#D4D4D4] hover:bg-white"
                        aria-label={`Copy DNS value for ${record.type} ${record.name}`}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!!setupPlan?.warnings?.length && !setupPlanLoading && (
        <div className="space-y-2 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {setupPlan.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      )}

      {customDomainVerificationError && savedCustomDomain && (
        <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {customDomainVerificationError}
        </div>
      )}
    </div>
  );
}

export default function DomainPage() {
  const { currentPublication, refreshCurrentPublication } = usePublication();
  const [customDomain, setCustomDomain] = useState("");
  const [subdomain, setSubdomain] = useState("Subdomain");
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
  const [verifying, setVerifying] = useState(false);
  const [setupPlan, setSetupPlan] = useState(null);
  const [setupPlanLoading, setSetupPlanLoading] = useState(false);
  const [setupPlanError, setSetupPlanError] = useState("");

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingDomain, setPendingDomain] = useState("");

  const [showRevertConfirmation, setShowRevertConfirmation] = useState(false);

  const applyPublicationDomainState = useCallback((pubData) => {
    const existingCustomDomain = pubData?.customDomain || "";
    setPublicationId(pubData?.id || null);
    setSubdomain(pubData?.subdomain || "Subdomain");
    setSavedCustomDomain(existingCustomDomain);
    setEditDomain(existingCustomDomain);
    setCustomDomainStatus(pubData?.customDomainStatus || null);
    setCustomDomainVerificationError(pubData?.customDomainVerificationError || "");
    setCustomDomainVerifiedAt(pubData?.customDomainVerifiedAt || null);
    setCustomDomainLastCheckedAt(pubData?.customDomainLastCheckedAt || null);
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
        `${apiBase}/api/publications/${targetPublicationId}`,
        {
          credentials: "include",
        },
      );

      if (pubRes.ok) {
        const pubData = await pubRes.json();
        applyPublicationDomainState(pubData);
      }
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
  const normalizedDraftDomain = normalizeCustomDomain(
    savedCustomDomain ? editDomain : customDomain,
  );
  const setupPlanRequestDomain = savedCustomDomain
    ? normalizedDraftDomain || normalizeCustomDomain(savedCustomDomain)
    : normalizedDraftDomain;
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
    (savedCustomDomain ? "Pending verification" : "Subdomain");
  const statusStyle =
    DOMAIN_STATUS_STYLES[customDomainStatus] ||
    "bg-gray-100 text-gray-600 border border-gray-200";
  const shouldShowSetupPlanCard = Boolean(
    publicationId &&
      (setupPlanRequestDomain || setupPlanLoading || setupPlanError || setupPlan),
  );
  const canVerifySavedDomain =
    Boolean(savedCustomDomain) && setupPlan?.domain === savedCustomDomain;

  useEffect(() => {
    if (!publicationId || !setupPlanRequestDomain) {
      setSetupPlan(null);
      setSetupPlanError("");
      setSetupPlanLoading(false);
      return;
    }

    let cancelled = false;
    const apiBase = getApiBase();
    const timeoutId = window.setTimeout(async () => {
      try {
        setSetupPlanLoading(true);
        setSetupPlanError("");
        const response = await fetch(
          `${apiBase}/api/publications/${publicationId}/custom-domain/setup-plan?domain=${encodeURIComponent(setupPlanRequestDomain)}`,
          {
            credentials: "include",
          },
        );

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Failed to load DNS setup records");
        }

        if (!cancelled) {
          setSetupPlan(data);
        }
      } catch (err) {
        if (!cancelled) {
          setSetupPlan(null);
          setSetupPlanError(err.message || "Failed to load DNS setup records");
        }
      } finally {
        if (!cancelled) {
          setSetupPlanLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [publicationId, setupPlanRequestDomain]);

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
    } catch (err) {
      setError(err.message || "Failed to revert to subdomain");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelRevert = () => {
    setShowRevertConfirmation(false);
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

  const copyToClipboard = async (text, label = "Value") => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        toast.success(`${label} copied`);
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
        toast.success(`${label} copied`);
        return;
      }

      throw new Error("Clipboard is not available");
    } catch (err) {
      console.error("Error copying domain:", err);
      toast.error(`Failed to copy ${label.toLowerCase()}. Please copy it manually.`);
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
      <div className="w-full min-h-screen md:absolute md:left-1/2 md:-translate-x-1/2 md:top-[120px] md:max-w-[1034px] z-20 px-0 md:px-5 pt-24 md:pt-0 pb-24 md:pb-0">
        <div className="ml-0 md:ml-[165px] md:border-r md:border-gray-200">
          <div className="flex flex-col pb-8 md:pb-20">
            {/* Header */}
            <div className="text-center mt-10 mb-6 max-md:mb-6 max-md:mt-8 max-md:w-[301px] max-md:mx-auto">
              <h1 className="text-lg md:text-xl font-bold text-gray-900 mb-2 max-md:text-[14px] max-md:font-bold">
                Custom Domain Integration
              </h1>
              <p className="text-sm text-gray-600 px-4 md:px-0 max-md:text-[12px]">
                Connect your custom domain you already own{" "}
                <br className="max-md:hidden" />
                with Inksigma.{" "}
                <a
                  href="#instructions"
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.getElementById("instructions");
                    if (element) {
                      const offset = 120; // Adjust for navbar height
                      const elementPosition =
                        element.getBoundingClientRect().top;
                      const offsetPosition =
                        elementPosition + window.pageYOffset - offset;
                      window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth",
                      });
                    }
                  }}
                  className="text-black font-semibold cursor-pointer max-md:font-normal"
                >
                  Read instructions
                </a>
              </p>
            </div>

            {error && (
              <div className="mx-auto w-full max-w-[400px] md:max-w-[447px] mb-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Current Domain Section */}
            {!savedCustomDomain ? (
              // Initial state - no custom domain saved
              <div className="bg-white mx-auto rounded-lg border border-gray-200 p-6 md:p-8 space-y-5 w-full max-w-[720px] max-md:p-4 max-md:w-[301px] mb-12 md:mb-20">
                <div className="border-b border-gray-200 pb-5">
                  <h2 className="text-xs font-semibold text-gray-400 mb-3 max-md:text-[8px] mb-0 max-md:font-normal">
                    YOUR CURRENT DOMAIN
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-purple-600 font-medium text-sm md:text-base break-all max-md:text-[12px] max-md:font-normal">
                      {currentDomain}
                    </span>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded whitespace-nowrap max-md:text-[8px]">
                      Subdomain
                    </span>
                  </div>
                </div>

                {/* Warning Box */}
                <div className="bg-orange-50 border border-orange-200 rounded p-3">
                  <p className="text-orange-700 text-sm max-md:text-[10px] max-md:font-normal">
                    <span className="font-semibold max-md:font-bold">
                      Warning:
                    </span>{" "}
                    If you change your domain, you can only change it after 14
                    days.
                  </p>
                </div>

                {/* Custom Domain Input */}
                <div className="space-y-3 border-t border-gray-200 pt-5">
                  <label className="block text-sm font-semibold text-gray-900 max-md:text-[12px] max-md:font-normal">
                    Create your Custom Domain
                  </label>
                  <Input
                    type="text"
                    placeholder="joshhh.com"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    className="w-full bg-gray-50 border-gray-300"
                  />
                  <Button
                    onClick={handleSaveChanges}
                    disabled={saving || !customDomain.trim()}
                    className="bg-black text-white hover:bg-gray-800 w-full md:w-auto max-md:w-[112px] max-md:text-[10px] max-md:font-bold max-md:px-2 px-8 text-sm h-10"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>

                {shouldShowSetupPlanCard && (
                  <DnsSetupRecords
                    setupPlan={setupPlan}
                    setupPlanRequestDomain={setupPlanRequestDomain}
                    setupPlanLoading={setupPlanLoading}
                    setupPlanError={setupPlanError}
                    canVerifySavedDomain={canVerifySavedDomain}
                    verifying={verifying}
                    onVerifyDomain={handleVerifyDomain}
                    onCopyValue={(value) => copyToClipboard(value, "Value")}
                    customDomainVerificationError={customDomainVerificationError}
                    savedCustomDomain={savedCustomDomain}
                  />
                )}
              </div>
            ) : (
              // After custom domain is saved - exact CSS styling
              <div className="mx-auto mb-12 md:mb-20 flex w-full max-w-[720px] flex-col gap-6 rounded-lg border border-[#EDEDED] bg-white p-5 md:p-[24px_32px] max-md:w-[301px]">
                {/* Subdomain Domain Section */}
                <div className="flex w-full flex-col gap-1 rounded border border-[#EAEAEA] bg-[#FAFAFA] p-4 md:px-6 md:py-4">
                  <div
                    className="font-semibold text-[#A4A4A4] text-[12px] max-md:text-[8px] max-md:font-normal leading-[150%]"
                    style={{ fontFamily: "Public Sans" }}
                  >
                    YOUR SUBDOMAIN DOMAIN
                  </div>
                  <div
                    className="font-semibold text-[#202020] text-[16px] max-md:text-[12px] max-md:font-normal leading-[28px]"
                    style={{ fontFamily: "Public Sans" }}
                  >
                    {currentDomain}
                  </div>
                  <button
                    onClick={() => copyToClipboard(currentDomain, "Domain")}
                    style={{
                      width: "60px",
                      height: "22px",
                      borderRadius: "4px",
                      padding: "2px 8px",
                      gap: "4px",
                      background: "#FFFFFF",
                      border: "1px solid #EAEAEA",
                      fontFamily: "Public Sans",
                      fontWeight: 400,
                      fontSize: "12px",
                      lineHeight: "150%",
                      color: "#696969",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src="/images/icons/copy-domain.svg"
                      alt="copy"
                      style={{ width: "12px", height: "12px" }}
                    />
                    Copy
                  </button>
                </div>

                {/* Current Domain Section */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    borderBottom: "1px solid #EDEDED",
                    paddingBottom: "24px",
                  }}
                >
                  <div
                    className="font-semibold text-[#A4A4A4] text-[12px] max-md:text-[8px] max-md:font-normal leading-[150%]"
                    style={{ fontFamily: "Public Sans" }}
                  >
                    YOUR CURRENT DOMAIN
                  </div>
                  <div
                    className="flex flex-wrap items-center gap-3"
                  >
                    <span
                      className="font-semibold text-[#7C3AED] text-[16px] max-md:text-[12px] max-md:font-normal leading-[28px] break-all"
                      style={{ fontFamily: "Public Sans" }}
                    >
                      {savedCustomDomain}
                    </span>
                    <span
                      className={`rounded-[71px] flex items-center justify-center h-[26px] px-3 text-[12px] max-md:text-[8px] leading-[150%] whitespace-nowrap ${statusStyle}`}
                      style={{ fontFamily: "Public Sans" }}
                    >
                      {statusLabel}
                    </span>
                  </div>
                </div>

                {/* Info Box */}
                <div
                  className="min-h-[88px] h-auto w-full rounded bg-[#ECF0FE] p-4 text-[#0048B5] text-[12px] leading-[18.5px] md:px-6 md:py-4 max-md:text-[10px] max-md:font-normal"
                  style={{ fontFamily: "Public Sans" }}
                >
                  <span className="font-bold max-md:font-bold">Info:</span> If
                  you wish to switch back to your subdomain,{" "}
                  <span className="font-bold max-md:font-normal">COPY</span> and{" "}
                  <span className="font-bold max-md:font-normal">PASTE</span>{" "}
                  the subdomain above into the below text field and click on
                  &apos;Save Changes&apos;.
                </div>

                {/* Edit Domain Section */}
                <div
                  className="flex w-full flex-col gap-3"
                >
                  <div
                    style={{
                      fontFamily: "Public Sans",
                      fontWeight: 600,
                      fontSize: "14px",
                      lineHeight: "100%",
                      color: "#202020",
                    }}
                    className="max-md:text-[12px] max-md:!font-normal"
                  >
                    Edit Your current Domain
                  </div>
                  <input
                    type="text"
                    value={editDomain}
                    onChange={(e) => setEditDomain(e.target.value)}
                    className="max-md:text-[12px]"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #EAEAEA",
                      borderRadius: "4px",
                      fontFamily: "Public Sans",
                      fontWeight: 400,
                      fontSize: "14px",
                      lineHeight: "150%",
                      color: "#202020",
                      background: "#FFFFFF",
                    }}
                    placeholder="Enter domain"
                  />
                  <button
                    onClick={handleEditSave}
                    disabled={saving}
                    className="max-md:!w-[112px] max-md:text-[10px] max-md:!px-2"
                    style={{
                      width: "141px",
                      height: "32px",
                      borderRadius: "4px",
                      padding: "8px 24px",
                      background: "#080808",
                      border: "none",
                      fontFamily: "Public Sans",
                      fontWeight: 500,
                      fontSize: "14px",
                      lineHeight: "150%",
                      color: "#EDEDED",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>

                {shouldShowSetupPlanCard && (
                  <DnsSetupRecords
                    setupPlan={setupPlan}
                    setupPlanRequestDomain={setupPlanRequestDomain}
                    setupPlanLoading={setupPlanLoading}
                    setupPlanError={setupPlanError}
                    canVerifySavedDomain={canVerifySavedDomain}
                    verifying={verifying}
                    onVerifyDomain={handleVerifyDomain}
                    onCopyValue={(value) => copyToClipboard(value, "Value")}
                    customDomainVerificationError={customDomainVerificationError}
                    savedCustomDomain={savedCustomDomain}
                  />
                )}
              </div>
            )}

            {/* Divider Line */}
            <div className="border-t border-gray-200 mb-8 md:mb-12"></div>

            {/* Instructions Section */}
            <div
              id="instructions"
              className="space-y-4 w-full px-10 max-w-[100%] max-md:px-0 max-md:w-[301px] max-md:mx-auto"
            >
              <h2 className="text-base md:text-lg font-bold text-gray-900 max-md:text-[14px] max-md:font-bold">
                Custom Domain Integration Instructions
              </h2>

              <div className="space-y-3 text-sm text-gray-700 leading-relaxed max-md:text-[12px]">
                <p>
                  <span className="font-semibold max-md:font-normal">1.</span>{" "}
                  Enter the correct domain name that you have bought/own in the
                  domain field
                </p>

                <p className="text-gray-600 pl-4 md:pl-4">
                  Now to connect your existing website to your new domain,
                  please do the following steps :
                </p>

                <p>
                  <span className="font-semibold max-md:font-normal">2.</span>{" "}
                  Use the DNS record type and host shown above, then copy the
                  value into your domain provider.
                </p>

                <p>
                  <span className="font-semibold max-md:font-normal">3.</span>{" "}
                  Open your domain&apos;s{" "}
                  <span className="font-semibold max-md:font-normal">DNS</span>{" "}
                  (Domain Name System) Management in your domain provider -like
                  GoDaddy, Cloudflare, Bluehost, Hostgator, etc.
                </p>

                <p>
                  <span className="font-semibold max-md:font-normal">4.</span>{" "}
                  If there&apos;s an existing record for the same host, edit it and
                  replace it with the new DNS value shown above. Root domains
                  usually need an A record, while subdomains usually need a
                  CNAME record.
                </p>

                <p className="text-gray-600 pl-4 md:pl-4">(or)</p>

                <p className="font-semibold">
                  If there is no existing A record, you can create your own A
                  record by doing the following steps
                </p>

                {/* Instructional Image - Different for mobile and desktop/tablet */}
                <div className="my-6 bg-white rounded-lg border border-gray-200 p-4 md:p-6">
                  {/* Mobile Image - Only for small screens (phones) */}
                  <img
                    src="/images/Domain/DomainMobile.jpg"
                    alt="DNS Configuration Steps showing steps 1-5 for adding A record"
                    className="w-full h-auto block sm:hidden"
                  />
                  {/* Desktop/Tablet Image - For tablets and larger */}
                  <img
                    src="/images/Domain/Imageeess.jpg"
                    alt="DNS Configuration Steps showing steps 1-5 for adding A record"
                    className="w-full h-auto hidden sm:block"
                  />
                </div>

                <p>
                  <span className="font-semibold max-md:font-normal">5.</span>{" "}
                  Save the DNS record in your domain provider.
                </p>

                <p>
                  <span className="font-semibold max-md:font-normal">6.</span>{" "}
                  Now come back to your admin panel and click VERIFY DNS.
                </p>

                <p>
                  <span className="font-semibold max-md:font-normal">7.</span> A
                  pop-up will appear to re-confirm your domain change request.
                  Click YES.
                </p>

                <p>
                  <span className="font-semibold max-md:font-normal">8.</span>{" "}
                  You will be redirected to a 404 Error Page. Please don&apos;t
                  worry. We are just now transferring your blog site to your new
                  domain.
                </p>

                <p>
                  <span className="font-semibold max-md:font-normal">9.</span>{" "}
                  After 5 minutes, enter your newly connected domain name in the
                  search bar of your browser to experience your own blog site.
                </p>

                <p className="mt-4">
                  Your blog website should be now loaded to your new domain.
                </p>

                <p className="mt-2">
                  Welcome to your own blog website, built with love from
                  Inksigma
                </p>

                {/* Query/Support Section */}
                <div className="mt-8 space-y-4">
                  <h3 className="font-semibold text-gray-900">
                    Query/Support:
                  </h3>

                  <p>
                    Your website should be reflected within less than 15 minutes
                    which is our maximum waiting time. In case, you are facing
                    trouble or if you have messed up at any of the steps
                    including entering the wrong email address,
                  </p>

                  <p>
                    Please write to us from your registered email address
                    explaining your problem to support@zemuria.com and we will
                    be happy to assist you to solve it as soon as possible.
                  </p>

                  <p className="mt-4">Aspiring to help every small business,</p>

                  <p className="mt-2">
                    With love,
                    <br />
                    <span className="font-semibold max-md:font-normal">
                      Inksigma
                    </span>
                  </p>
                </div>
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
          className="w-[calc(100vw-2rem)] max-w-[350px] rounded-[4px] border-none bg-[#FEFEFE] p-6 shadow-2xl sm:p-8"
          showClose={false}
        >
          <DialogTitle className="sr-only">Confirm Domain Change</DialogTitle>
          <div className="flex flex-col items-center gap-4">
            <h3
              className="text-center text-[16px] font-bold leading-7 text-black max-md:text-[12px] max-md:font-normal"
              style={{
                fontFamily: "Public Sans",
                margin: 0,
              }}
            >
              Are you sure you want to change your domain name?
            </h3>

            <div
              className="flex w-full flex-col justify-center gap-2 rounded-[8px] border border-[#EAEAEA] p-4 sm:p-6"
              style={{
                minHeight: "102px",
              }}
            >
              <div
                className="max-md:text-[8px]"
                style={{
                  fontFamily: "Public Sans",
                  fontWeight: 600,
                  fontSize: "12px",
                  lineHeight: "150%",
                  color: "#A4A4A4",
                  textTransform: "uppercase",
                }}
              >
                YOUR DOMAIN WILL BE CHANGED TO
              </div>
              <div
                className="max-md:text-[14px]"
                style={{
                  fontFamily: "Public Sans",
                  fontWeight: 600,
                  fontSize: "18px",
                  lineHeight: "28px",
                  background:
                    "linear-gradient(224.74deg, #A941FB 4.1%, rgba(120, 100, 240, 0.92) 96.28%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                {pendingDomain}
              </div>
            </div>

            <div className="mt-2 flex w-full justify-end gap-4">
              <button
                onClick={handleCancelSave}
                disabled={saving}
                className="max-md:min-w-[80px] max-md:text-[12px] max-md:px-4"
                style={{
                  minWidth: "94px",
                  height: "32px",
                  borderRadius: "4px",
                  padding: "8px 24px",
                  gap: "4px",
                  background: "#F4F4F4",
                  border: "none",
                  fontFamily: "Public Sans",
                  fontWeight: 500,
                  fontSize: "14px",
                  lineHeight: "150%",
                  color: "#2E2E2E",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={saving}
                className="max-md:min-w-[100px] max-md:text-[12px] max-md:px-4"
                style={{
                  minWidth: "123px",
                  height: "32px",
                  borderRadius: "4px",
                  padding: "8px 16px",
                  gap: "10px",
                  background:
                    "linear-gradient(224.74deg, #A941FB 4.1%, rgba(120, 100, 240, 0.92) 96.28%)",
                  border: "none",
                  fontFamily: "Public Sans",
                  fontWeight: 600,
                  fontSize: "14px",
                  lineHeight: "100%",
                  color: "#EDEDED",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showRevertConfirmation}
        onOpenChange={(open) => !open && !saving && handleCancelRevert()}
      >
        <DialogContent
          className="w-[calc(100vw-2rem)] max-w-[350px] rounded-[4px] border-none bg-[#FEFEFE] p-6 shadow-2xl sm:p-8"
          showClose={false}
        >
          <DialogTitle className="sr-only">Confirm Revert To Subdomain</DialogTitle>
          <div className="flex flex-col items-center justify-center gap-6">
            <h3
              className="text-center text-[16px] font-bold leading-7 text-black max-md:text-[12px] max-md:font-normal"
              style={{
                fontFamily: "Public Sans",
                margin: 0,
              }}
            >
              Are you sure you want to change back to Subdomain ?
            </h3>

            <div className="flex gap-2">
              <button
                onClick={handleCancelRevert}
                disabled={saving}
                className="max-md:min-w-[80px] max-md:text-[12px] max-md:px-4"
                style={{
                  minWidth: "94px",
                  height: "32px",
                  borderRadius: "4px",
                  padding: "8px 24px",
                  gap: "4px",
                  background: "#F4F4F4",
                  border: "none",
                  fontFamily: "Public Sans",
                  fontWeight: 500,
                  fontSize: "14px",
                  lineHeight: "150%",
                  color: "#2E2E2E",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                No, Cancel
              </button>
              <button
                onClick={handleConfirmRevert}
                disabled={saving}
                className="max-md:min-w-[80px] max-md:text-[12px] max-md:px-4"
                style={{
                  minWidth: "82px",
                  height: "32px",
                  borderRadius: "4px",
                  padding: "8px 16px",
                  gap: "10px",
                  background:
                    "linear-gradient(224.74deg, #A941FB 4.1%, rgba(120, 100, 240, 0.92) 96.28%)",
                  border: "none",
                  fontFamily: "Public Sans",
                  fontWeight: 600,
                  fontSize: "14px",
                  lineHeight: "100%",
                  color: "#EDEDED",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {saving ? "Saving..." : "Yes"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
