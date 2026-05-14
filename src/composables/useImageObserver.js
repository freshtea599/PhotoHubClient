// src/composables/useImageObserver.js
import { onUnmounted } from 'vue';

export function useImageObserver(rootMargin = '600px') {
  const observers = new Map();

  const observe = (element, url, onLoad) => {
    if (!element) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = new Image();
          img.onload = () => {
            onLoad(url);
            observer.unobserve(element);
          };
          img.src = url;
        }
      });
    }, { rootMargin });
    observer.observe(element);
    observers.set(element, observer);
  };

  const unobserve = (element) => {
    const obs = observers.get(element);
    if (obs) {
      obs.disconnect();
      observers.delete(element);
    }
  };

  onUnmounted(() => {
    observers.forEach(obs => obs.disconnect());
    observers.clear();
  });

  return { observe, unobserve };
}