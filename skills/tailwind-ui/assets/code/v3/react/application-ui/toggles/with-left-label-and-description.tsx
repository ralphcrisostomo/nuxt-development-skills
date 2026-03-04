export default function Example() {
  return (
    <div className="flex items-center justify-between">
      <span className="flex grow flex-col">
        <label id="availability-label" className="text-sm/6 font-medium text-gray-900 dark:text-white">
          Available to hire
        </label>
        <span id="availability-description" className="text-sm text-gray-500 dark:text-gray-400">
          Nulla amet tempus sit accumsan. Aliquet turpis sed sit lacinia.
        </span>
      </span>
      <div className="group relative inline-flex w-11 shrink-0 rounded-full bg-gray-200 p-0.5 outline-offset-2 outline-indigo-600 ring-1 ring-inset ring-gray-900/5 transition-colors duration-200 ease-in-out has-[:checked]:bg-indigo-600 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 dark:bg-white/5 dark:outline-indigo-500 dark:ring-white/10 dark:has-[:checked]:bg-indigo-500">
        <span className="size-5 rounded-full bg-white shadow-sm ring-1 ring-gray-900/5 transition-transform duration-200 ease-in-out group-has-[:checked]:translate-x-5" />
        <input
          id="availability"
          name="availability"
          type="checkbox"
          aria-labelledby="availability-label"
          aria-describedby="availability-description"
          className="absolute inset-0 size-full appearance-none focus:outline-none"
        />
      </div>
    </div>
  )
}
