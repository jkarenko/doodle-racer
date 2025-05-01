/**
 * persistence.ts
 *
 * Intention: Handle compression and storage of doodles/settings in
 * localStorage with a capacity cap.
 */
import LZString from "lz-string";
import type {Stroke} from "@/types/models";
import {uid} from "@/utils/id";

const KEY = "dr:doodles";
const MAX_DOODLES = 20;

export interface DoodleMeta {
  id: string;
  name: string;
  created: number;
  strokes: Stroke[];
}

function read(): DoodleMeta[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const json = LZString.decompress(raw);
    return json ? (JSON.parse(json) as DoodleMeta[]) : [];
  } catch {
    return [];
  }
}

function write(list: DoodleMeta[]): void {
  // Cap list size
  const trimmed = list.slice(-MAX_DOODLES);
  localStorage.setItem(KEY, LZString.compress(JSON.stringify(trimmed)));
}

export function saveDoodle(name: string, strokes: Stroke[]): void {
  const list = read();
  list.push({id: uid(), name, created: Date.now(), strokes});
  write(list);
}

export function loadDoodles(): DoodleMeta[] {
  return read();
}
