import { Transform } from 'class-transformer';

export function Trim() {
  return Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  );
}

export function TrimToUndefined() {
  return Transform(({ value }) => {
    if (value === null || value === undefined) return value;
    if (typeof value !== 'string') return value;
    const trimValue = value.trim();
    return trimValue.length ? trimValue : undefined;
  });
}
