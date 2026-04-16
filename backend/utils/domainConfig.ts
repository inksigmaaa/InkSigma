const normalizeConfiguredDomain = (value: string | null | undefined): string => {
  if (!value) return "";

  const trimmed = String(value).trim().toLowerCase();
  if (!trimmed) return "";

  const withoutProtocol = trimmed.replace(/^[a-z]+:\/\//, "");
  const withoutPath = withoutProtocol.split("/")[0];
  const withoutPort = withoutPath.replace(/:\d+$/, "");

  return withoutPort.replace(/^\.+/, "");
};

export const parseConfiguredDomains = (value: string | undefined): string[] =>
  Array.from(
    new Set(
      (value || "")
        .split(",")
        .map((entry) => normalizeConfiguredDomain(entry))
        .filter(Boolean),
    ),
  );

export const normalizeConfiguredDomainValue = normalizeConfiguredDomain;
