import type { SortConfig, SortDirection } from "../utils/tableSort";

type Props = {
  label: string;
  sortKey: string;
  sortConfig: SortConfig;
  onSort: (key: string, direction: SortDirection) => void;
};

function SortableHeader({ label, sortKey, sortConfig, onSort }: Props) {
  const activeDirection = sortConfig?.key === sortKey ? sortConfig.direction : null;
  const nextDirection = activeDirection === "desc" ? "asc" : "desc";

  return (
    <th>
      <button
        type="button"
        className={`sortable-th ${activeDirection ? "active" : ""}`}
        onClick={() => onSort(sortKey, nextDirection)}
        title="Cliquer pour alterner le tri"
      >
        <span>{label}</span>
        <span className="sort-indicator">{activeDirection === "asc" ? "↑" : activeDirection === "desc" ? "↓" : ""}</span>
      </button>
    </th>
  );
}

export default SortableHeader;
