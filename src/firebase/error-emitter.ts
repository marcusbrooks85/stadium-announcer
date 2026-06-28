'use client';

/**
 * A simple custom EventEmitter for browser compatibility.
 * Replaces the Node.js 'events' module to resolve Turbopack compilation errors.
 */
class SimpleEventEmitter {
  private listeners: { [key: string]: Function[] } = {};

  on(event: string, listener: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  off(event: string, listener: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((l) => l !== listener);
  }

  emit(event: string, ...args: any[]) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach((l) => l(...args));
  }
}

export const errorEmitter = new SimpleEventEmitter();
