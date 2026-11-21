import { ValueNode } from "../inspect/values";

export interface Container {
  frame: number; // the frame its values belong to
  children(start?: number, count?: number): Promise<ValueNode[]>;
  loaded: ValueNode[] | null; // the children last given out, for setVariable to find one by name
}

const FIRST = 1000; // frame ids and thread ids are small numbers: a reference is never mistaken for one

export class References {
  private containers = new Map<number, Container>();
  private next = FIRST;

  // Everything the last stop handed out is gone: the program ran, or its state was edited.
  clear(): void {
    this.containers.clear();
    this.next = FIRST;
  }

  add(frame: number, children: Container["children"]): number {
    const reference = this.next++;
    this.containers.set(reference, { frame, children, loaded: null });
    return reference;
  }

  // 0 for a row that does not open
  of(frame: number, node: ValueNode): number {
    return node.children ? this.add(frame, (start, count) => node.children(start, count)) : 0;
  }

  get(reference: number): Container | null {
    return this.containers.get(reference) || null;
  }
}

// "0x00401000" and 4198400 both name an address; null for text that names none
export function parseReference(text: string | undefined): number | null {
  if (!text) return null;
  const value = /^0x[0-9a-f]+$/i.test(text.trim()) ? parseInt(text.trim().slice(2), 16) : /^\d+$/.test(text.trim()) ? Number(text.trim()) : NaN;
  return value >= 0 && value <= 0xffffffff ? value : null;
}

export function memoryReference(address: number): string {
  return "0x" + ("0000000" + (address >>> 0).toString(16).toUpperCase()).slice(-8);
}
