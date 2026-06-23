import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FeedbackItem } from "@/features/patient/session/types/sessionType";
import { Badge } from "@/components/ui/badge";

export function FeedbackPanel({ items }: { items: FeedbackItem[] }) {
  return (
    <Card className="rounded-2xl border-muted/40 shadow-sm">
      <CardHeader className="py-4">
        <CardTitle className="text-base">Live feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Feedback will appear here during the session.
          </p>
        ) : (
          items.map((f) => (
            <div key={f.id} className="flex items-start justify-between gap-3">
              <p className="text-sm">{f.message}</p>
              <Badge
                variant={
                  f.level === "good"
                    ? "default"
                    : f.level === "warn"
                      ? "destructive"
                      : "secondary"
                }
              >
                {f.level}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
