import { Transform } from 'class-transformer';

export function ToBoolean() {
  return Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;

    if (typeof value === 'boolean') return value;

    if (typeof value === 'number') {
      if (value === 1) return true;
      if (value === 0) return false;
      return undefined;
    }

    if (typeof value === 'string') {
      const v = value.trim().toLowerCase();
      if (!v.length) return undefined;

      if (v === 'true' || v === '1') return true;
      if (v === 'false' || v === '0') return false;

      return undefined;
    }

    return undefined;
  });
}
