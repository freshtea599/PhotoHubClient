import { ref, computed } from 'vue'

export function useVirtualScroll(itemHeight, totalItemsRef) {
  const scrollTop = ref(0)
  const containerHeight = ref(0)

  const startIndex = computed(() => Math.floor(scrollTop.value / itemHeight.value))
  const endIndex = computed(() => Math.min(
    startIndex.value + Math.ceil(containerHeight.value / itemHeight.value) + 4,
    totalItemsRef.value
  ))
  const offsetY = computed(() => startIndex.value * itemHeight.value)
  const totalHeight = computed(() => totalItemsRef.value * itemHeight.value)

  const onScroll = (e) => {
    scrollTop.value = e.target.scrollTop
    if (!containerHeight.value && e.target.clientHeight) {
      containerHeight.value = e.target.clientHeight
    }
  }

  const setContainerHeight = (height) => {
    containerHeight.value = height
  }

  return { startIndex, endIndex, offsetY, totalHeight, onScroll, setContainerHeight }
}