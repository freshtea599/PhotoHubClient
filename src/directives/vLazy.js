export const vLazy = {
  mounted(el, binding) {
    // 1. Начальное состояние: прозрачность 0 и класс для CSS
    el.classList.add('lazy-image')
    
    // 2. Настраиваем IntersectionObserver
    const options = {
      rootMargin: '100px', // Начинать грузить за 100px до появления
      threshold: 0.1
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target
          const src = binding.value // URL из v-lazy="..."

          // 3. Обработка тега <picture> и вложенных <source>
          // Если картинка внутри <picture>, нужно подменить srcset у соседей
          const picture = img.closest('picture')
          if (picture) {
            const sources = picture.querySelectorAll('source[data-srcset]')
            sources.forEach((source) => {
              source.srcset = source.dataset.srcset
            })
          }

          // 4. Устанавливаем основной src
          if (src) {
            img.src = src
          }

          // 5. Когда загрузится - показываем (fade-in)
          img.onload = () => {
            img.classList.add('loaded')
          }
          
          // Если картинка уже в кеше браузера, onload может не сработать, проверяем:
          if (img.complete) {
            img.classList.add('loaded')
          }

          // 6. Перестаем следить после загрузки
          observer.unobserve(el)
        }
      })
    }, options)

    observer.observe(el)
  }
}
