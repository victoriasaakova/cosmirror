type CosmirrorMarkProps = {
  className?: string;
};

export function CosmirrorMark({ className = "" }: CosmirrorMarkProps) {
  return (
    <span className={`font-display tracking-tight text-white ${className}`.trim()}>
      Cosmirror
    </span>
  );
}
