<template>
  <div class="flex items-center justify-between">
    <span class="flex grow flex-col">
      <label class="text-sm/6 font-medium text-gray-900 dark:text-white" id="availability-label">Available to hire</label>
      <span class="text-sm text-gray-500 dark:text-gray-400" id="availability-description">Nulla amet tempus sit accumsan. Aliquet turpis sed sit lacinia.</span>
    </span>
    <div class="group relative inline-flex w-11 shrink-0 rounded-full bg-gray-200 p-0.5 outline-offset-2 outline-indigo-600 ring-1 ring-inset ring-gray-900/5 transition-colors duration-200 ease-in-out has-[:checked]:bg-indigo-600 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 dark:bg-white/5 dark:outline-indigo-500 dark:ring-white/10 dark:has-[:checked]:bg-indigo-500">
      <span class="size-5 rounded-full bg-white shadow-sm ring-1 ring-gray-900/5 transition-transform duration-200 ease-in-out group-has-[:checked]:translate-x-5"></span>
      <input type="checkbox" class="absolute inset-0 size-full appearance-none focus:outline-none" id="availability" name="availability" aria-labelledby="availability-label" aria-describedby="availability-description" />
    </div>
  </div>
</template>
