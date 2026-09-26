export interface UndoableAction {
  id: string;
  description: string;
  timestamp: number; // Date.now()
  expiresAt: number; // timestamp + 30000 (30 seconds)
  undo: () => void;
}

class UndoManager {
  private stack: UndoableAction[] = [];
  private listeners: ((actions: UndoableAction[]) => void)[] = [];

  constructor() {
    // Clean expired actions every second
    setInterval(() => {
      this.pruneExpired();
    }, 1000);
  }

  public push(action: Omit<UndoableAction, 'id' | 'timestamp' | 'expiresAt'>) {
    const id = Math.random().toString(36).substring(2, 9);
    const timestamp = Date.now();
    const expiresAt = timestamp + 30000; // 30 seconds undo window
    const newAction: UndoableAction = {
      ...action,
      id,
      timestamp,
      expiresAt,
    };

    this.stack.unshift(newAction); // Most recent first
    if (this.stack.length > 10) {
      this.stack.pop();
    }
    this.notify();
    return id;
  }

  public getActions(): UndoableAction[] {
    this.pruneExpired();
    return [...this.stack];
  }

  public undoLatest(): boolean {
    this.pruneExpired();
    if (this.stack.length === 0) return false;
    const action = this.stack.shift();
    if (action) {
      try {
        action.undo();
        this.notify();
        return true;
      } catch (err) {
        console.error("Failed to undo action:", err);
        return false;
      }
    }
    return false;
  }

  public undoAction(id: string): boolean {
    this.pruneExpired();
    const index = this.stack.findIndex(a => a.id === id);
    if (index === -1) return false;
    const action = this.stack.splice(index, 1)[0];
    if (action) {
      try {
        action.undo();
        this.notify();
        return true;
      } catch (err) {
        console.error("Failed to undo action:", err);
        return false;
      }
    }
    return false;
  }

  private pruneExpired() {
    const now = Date.now();
    const initialLen = this.stack.length;
    this.stack = this.stack.filter(a => a.expiresAt > now);
    if (this.stack.length !== initialLen) {
      this.notify();
    }
  }

  public subscribe(listener: (actions: UndoableAction[]) => void) {
    this.listeners.push(listener);
    listener(this.getActions());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    const current = this.getActions();
    this.listeners.forEach(l => l(current));
  }
}

export const undoManager = new UndoManager();
