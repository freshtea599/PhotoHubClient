export const vLazy = {
  mounted(el, binding) {
    el.classList.add('lazy-image');
    el.dataset.src = binding.value;

    const options = {
      rootMargin: '200px',  // начинаем загрузку за 200px до появления
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.dataset.src;
          if (src && !img.src) {
            img.src = src;
            img.onload = () => img.classList.add('loaded');
            if (img.complete) img.classList.add('loaded');
          }
          observer.unobserve(img);
        }
      });
    }, options);

    observer.observe(el);
    el._lazyObserver = observer;
  },
  updated(el, binding) {
    // При изменении src (например, при рециркуляции DOM в виртуальном скролле)
    if (binding.value !== el.dataset.src) {
      el.dataset.src = binding.value;
      // Если изображение уже было загружено, но сейчас не в зоне видимости, сбросим src,
      // чтобы при следующем появлении загрузилось новое.
      if (el.src && !el._lazyReobserved) {
        el.src = '';
        el.classList.remove('loaded');
        if (el._lazyObserver) {
          el._lazyObserver.unobserve(el);
          el._lazyObserver.observe(el);
        }
        el._lazyReobserved = true;
      }
    }
  },
  unmounted(el) {
    if (el._lazyObserver) {
      el._lazyObserver.disconnect();
      delete el._lazyObserver;
    }
  }
};