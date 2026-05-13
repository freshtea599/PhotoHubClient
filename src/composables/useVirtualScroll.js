import { ref, computed } from 'vue';

export function useVirtualScroll(itemHeight, totalItemsRef) {
  const scrollTop = ref(0);
  const containerHeight = ref(0);

  const startIndex = computed(() => Math.floor(scrollTop.value / itemHeight));
  const endIndex = computed(() => Math.min(
    startIndex.value + Math.ceil(containerHeight.value / itemHeight) + 2,
    totalItemsRef.value
  ));
  const offsetY = computed(() => startIndex.value * itemHeight);
  const totalHeight = computed(() => totalItemsRef.value * itemHeight);

  const onScroll = (e) => {
    scrollTop.value = e.target.scrollTop;
    containerHeight.value = e.target.clientHeight;
  };

  return { startIndex, endIndex, offsetY, totalHeight, onScroll };
}