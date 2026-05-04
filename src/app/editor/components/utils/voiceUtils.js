const VOICE_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
];

export const VOICE_MAX_RECORDING_SECONDS = 300;
export const VOICE_CONTENT_ONLY_MESSAGE =
  "Voice dictation is only for article content, not the title or short description.";

export const getSupportedVoiceMimeType = () => {
  if (typeof MediaRecorder === "undefined") return "";
  return (
    VOICE_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) || ""
  );
};

export const getVoiceFileExtension = (mimeType) => {
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
};

export const formatVoiceDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
};

export const isTitleOrDescriptionFocused = () => {
  if (typeof document === "undefined") return false;
  const activeElement = document.activeElement;
  return Boolean(
    activeElement?.matches?.("input.title-input, input.desc-input"),
  );
};
