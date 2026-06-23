export type SessionStage = "SETUP" | "COUNTDOWN" | "LIVE" | "DONE";

export type FeedbackItem = {
  id: string;
  level: "info" | "warn" | "good";
  message: string;
};
