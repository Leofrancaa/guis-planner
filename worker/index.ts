// Custom service worker code merged into the next-pwa generated SW
// Handles push notifications and notification clicks

export {};

interface ExtendableEvent extends Event {
  waitUntil(promise: Promise<any>): void;
}

interface PushEvent extends ExtendableEvent {
  data: {
    json(): any;
    text(): string;
  } | null;
}

interface NotificationEvent extends ExtendableEvent {
  notification: {
    close(): void;
    data: any;
  };
}

interface ServiceWorkerGlobalScope {
  addEventListener(type: 'push', listener: (event: PushEvent) => void): void;
  addEventListener(type: 'notificationclick', listener: (event: NotificationEvent) => void): void;
  registration: {
    showNotification(title: string, options?: any): Promise<void>;
  };
  clients: {
    openWindow(url: string): Promise<void>;
  };
}

declare const self: ServiceWorkerGlobalScope;

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Guis Planner', {
      body: data.body || '',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [200, 100, 200],
    } as NotificationOptions)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow('/agenda'));
});
