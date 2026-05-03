export type SortDirection = "asc" | "desc";

export type SortConfig = {
  key: string;
  direction: SortDirection;
} | null;

type SortValue = string | number | boolean | null | undefined;

export type SortAccessors<T> = Record<string, (item: T) => SortValue>;

const textCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

function parseDateLike(value: string) {
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return Number(`${iso[1]}${iso[2]}${iso[3]}`);

  const french = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (french) return Number(`${french[3]}${french[2]}${french[1]}`);

  return null;
}

function normalizeSortValue(value: SortValue) {
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const dateValue = parseDateLike(value.trim());
    return dateValue ?? value.trim().toLocaleLowerCase();
  }
  return "";
}

export function sortItems<T>(items: T[], config: SortConfig, accessors: SortAccessors<T>) {
  if (!config || !accessors[config.key]) return items;

  const direction = config.direction === "asc" ? 1 : -1;
  return [...items].sort((left, right) => {
    const leftValue = normalizeSortValue(accessors[config.key](left));
    const rightValue = normalizeSortValue(accessors[config.key](right));

    if (typeof leftValue === "string" && typeof rightValue === "string") {
      return textCollator.compare(leftValue, rightValue) * direction;
    }
    if (leftValue < rightValue) return -1 * direction;
    if (leftValue > rightValue) return 1 * direction;
    return 0;
  });
}
