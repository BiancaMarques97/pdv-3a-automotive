type SpinnerProps = {
  label?: string;
  fullScreen?: boolean;
};

export function Spinner({ label, fullScreen = false }: SpinnerProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className="h-14 w-14 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500"
        role="status"
        aria-label="Carregando"
      />

      {label && <div className="text-sm font-medium text-muted-foreground">{label}</div>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30">
        {content}
      </div>
    );
  }

  return <div className="flex min-h-[40vh] w-full items-center justify-center">{content}</div>;
}
