<template>
  <div class="flex items-center">
    <div class="w-full border-t border-gray-300 dark:border-white/15" aria-hidden="true"></div>
    <div class="relative flex justify-center">
      <button type="button" class="inline-flex items-center gap-x-1.5 whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:shadow-none dark:ring-white/5 dark:hover:bg-white/20">
        <PlusIcon class="-ml-1 -mr-0.5 size-5 text-gray-400" aria-hidden="true" />
        Button text
      </button>
    </div>
    <div class="w-full border-t border-gray-300 dark:border-white/10" aria-hidden="true"></div>
  </div>
</template>

<script setup>
import { PlusIcon } from '@heroicons/vue/20/solid'
</script>