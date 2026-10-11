import { BIOME_LEN } from '../config/tune';
import { BIOMES } from '../data/biomes';
import type { DecoKind } from '../data/biomes';

type RGB = [number, number, number];

function parseCol(s: string): RGB {
  s = (s || '').trim();
  let m: RegExpExecArray | null;
  if ((m = /^#([0-9a-f]{6})$/i.exec(s))) {
    const h = m[1]!;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  return [255, 241, 214];
}

function mixCol(c1: RGB, c2: RGB, f: number): string {
  return `rgb(${[0, 1, 2].map((i) => Math.round(c1[i]! + (c2[i]! - c1[i]!) * f)).join(',')})`;
}

function biomeCols(i: number): { a: RGB; b: RGB; line: RGB; ink: RGB; deco: DecoKind } {
  const b = BIOMES[i]!;
  return { a: parseCol(b.a), b: parseCol(b.b), line: parseCol(b.line), ink: parseCol(b.ink), deco: b.deco };
}

export interface Palette {
  a: string;
  b: string;
  line: string;
  ink: string;
  deco: DecoKind;
}

/** Couleurs du décor à la profondeur D, avec un fondu sur les 10 derniers % de chaque décor. */
export function palette(D: number): Palette {
  const last = BIOMES.length - 1, seg = D / BIOME_LEN, fl = Math.floor(seg), i = Math.min(fl, last), f = seg - fl;
  const A = biomeCols(i);
  const fm = i < last && f > 0.9 ? (f - 0.9) / 0.1 : 0, B = fm > 0 ? biomeCols(i + 1) : A;
  return {
    a: mixCol(A.a, B.a, fm), b: mixCol(A.b, B.b, fm), line: mixCol(A.line, B.line, fm), ink: mixCol(A.ink, B.ink, fm),
    deco: i < last && f > 0.95 ? B.deco : A.deco,
  };
}

/** Pseudo-aléatoire stable (même résultat pour les mêmes entrées) pour placer les décors. */
export function hash(k: number, s: number): number {
  const x = Math.sin(k * 127.1 + s * 311.7) * 43758.5453;
  return x - Math.floor(x);
}
