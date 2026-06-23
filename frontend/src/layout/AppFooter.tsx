export function AppFooter() {
  return (
    <footer className="sticky bottom-0 z-40 flex items-center justify-between border-t border-muted/50 bg-background px-6 py-3">
      <div className="flex items-center gap-2">
        <div className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} RehabAssist. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
