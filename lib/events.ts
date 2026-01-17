
type Listener = (data: any) => void;
class EventManager {
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(data: any) {
    this.listeners.forEach(listener => listener(data));
  }
}

export const eventManager = new EventManager();
