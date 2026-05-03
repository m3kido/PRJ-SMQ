type LoadingCardProps = {
  title?: string;
  description?: string;
  lines?: number;
};

type TableLoadingRowProps = {
  colSpan: number;
  label?: string;
};

export function LoadingSpinner({ label = "Chargement..." }: { label?: string }) {
  return (
    <div className="loading-inline" role="status" aria-live="polite">
      <span className="loading-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function LoadingCard({ title = "Chargement des données", description = "Préparation de la vue...", lines = 3 }: LoadingCardProps) {
  return (
    <div className="card loading-card" role="status" aria-live="polite">
      <LoadingSpinner label={title} />
      <div className="muted">{description}</div>
      <div className="loading-skeleton-stack" aria-hidden="true">
        {Array.from({ length: lines }).map((_, index) => (
          <span key={index} className="loading-skeleton-line" />
        ))}
      </div>
    </div>
  );
}

export function TableLoadingRow({ colSpan, label = "Chargement des données..." }: TableLoadingRowProps) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <LoadingSpinner label={label} />
      </td>
    </tr>
  );
}
