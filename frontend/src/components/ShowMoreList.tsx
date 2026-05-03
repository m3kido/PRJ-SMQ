import { useEffect, useMemo, useState } from "react";

const DEFAULT_PAGE_SIZE = 10;

export function useShowMoreList<T>(items: T[], resetDeps: unknown[] = [], pageSize = DEFAULT_PAGE_SIZE) {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [pageSize, ...resetDeps]);

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const shownCount = Math.min(visibleCount, items.length);

  return {
    visibleItems,
    shownCount,
    totalCount: items.length,
    hasMore: shownCount < items.length,
    showMore: () => setVisibleCount((current) => Math.min(current + pageSize, items.length)),
    pageSize,
  };
}

type ShowMoreButtonProps = {
  shownCount: number;
  totalCount: number;
  onShowMore: () => void;
  pageSize?: number;
};

export function ShowMoreButton({ shownCount, totalCount, onShowMore, pageSize = DEFAULT_PAGE_SIZE }: ShowMoreButtonProps) {
  if (shownCount >= totalCount) return null;
  const remaining = totalCount - shownCount;
  const nextCount = Math.min(pageSize, remaining);

  return (
    <div className="show-more-row">
      <button className="tag" type="button" onClick={onShowMore}>
        Afficher {nextCount} de plus
      </button>
      <span className="muted">{shownCount}/{totalCount} affichés</span>
    </div>
  );
}
