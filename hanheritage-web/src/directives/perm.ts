import type { Directive, DirectiveBinding } from 'vue'
import { useUserStore } from '@/stores/user'

export const vPerm: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    const userStore = useUserStore()
    const value = binding.value

    if (!value) return

    const perms = Array.isArray(value) ? value : [value]
    const hasAccess = userStore.hasAnyPerm(perms)

    if (!hasAccess) {
      el.style.display = 'none'
      el.dataset.permHidden = 'true'
    }
  },

  updated(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    const userStore = useUserStore()
    const value = binding.value

    if (!value) {
      if (el.dataset.permHidden === 'true') {
        el.style.display = ''
        delete el.dataset.permHidden
      }
      return
    }

    const perms = Array.isArray(value) ? value : [value]
    const hasAccess = userStore.hasAnyPerm(perms)

    if (hasAccess) {
      if (el.dataset.permHidden === 'true') {
        el.style.display = ''
        delete el.dataset.permHidden
      }
    } else {
      el.style.display = 'none'
      el.dataset.permHidden = 'true'
    }
  },
}
