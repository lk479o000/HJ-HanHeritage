<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  minRows?: number
  maxRows?: number
  disabled?: boolean
}>(), {
  placeholder: '',
  minRows: 3,
  maxRows: 10,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const textareaStyle = ref({ minHeight: '', maxHeight: '' })

const getLineHeight = () => {
  if (!textareaRef.value) return 24
  const computedStyle = window.getComputedStyle(textareaRef.value)
  const lineHeight = computedStyle.lineHeight
  if (lineHeight === 'normal') return 24
  return parseFloat(lineHeight) || 24
}

const updateHeight = () => {
  if (!textareaRef.value) return
  
  const lineHeight = getLineHeight()
  const minHeight = lineHeight * props.minRows
  const maxHeight = lineHeight * props.maxRows
  
  textareaStyle.value = {
    minHeight: `${minHeight}px`,
    maxHeight: `${maxHeight}px`
  }
  
  textareaRef.value.style.height = 'auto'
  const scrollHeight = textareaRef.value.scrollHeight
  const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight)
  textareaRef.value.style.height = `${newHeight}px`
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
  nextTick(updateHeight)
}

watch(() => props.modelValue, () => {
  nextTick(updateHeight)
})

onMounted(() => {
  nextTick(updateHeight)
})
</script>

<template>
  <textarea
    ref="textareaRef"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :style="textareaStyle"
    @input="handleInput"
    class="auto-resize-textarea"
  />
</template>

<style scoped lang="scss">
.auto-resize-textarea {
  width: 100%;
  padding: 12px 16px;
  font-family: var(--admin-font);
  font-size: 14px;
  line-height: 1.6;
  color: var(--admin-text);
  background-color: #fff;
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius);
  resize: none;
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;

  &::placeholder {
    color: var(--admin-muted);
  }

  &:focus {
    outline: none;
    border-color: var(--admin-primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  &:disabled {
    background-color: #f8fafc;
    color: var(--admin-muted);
    cursor: not-allowed;
  }
}
</style>
