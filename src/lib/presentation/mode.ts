import "server-only";

export function isPresentationMode() {
  return process.env.NODE_ENV !== "production" && process.env.PRESENTATION_MODE === "true";
}
