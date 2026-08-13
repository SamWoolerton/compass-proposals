export function sum(ns: Iterable<number>): number {
  let acc = 0
  for (const n of ns) acc += n
  return acc
}

// Sum without `.map` building an intermediate array
export function sumBy<T>(items: Iterable<T>, fn: (item: T) => number): number {
  let acc = 0
  for (const item of items) acc += fn(item)
  return acc
}

export function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' ? value : null
}

export const roundTo = (val: number, dp: number) =>
  Math.round(val * 10 ** dp) / 10 ** dp

export const clamp = (n: number, [min, max]: [number, number]) =>
  Math.min(Math.max(n, min), max)
