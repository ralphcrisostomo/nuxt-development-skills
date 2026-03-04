export default function Example() {
  return (
    <div className="overflow-hidden bg-white py-24 sm:py-32 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="max-w-2xl text-pretty text-5xl font-semibold tracking-tight text-gray-900 sm:text-balance sm:text-6xl dark:text-white">
          Everything you need to deploy your app
        </p>
        <div className="relative mt-16 aspect-[2432/1442] h-[36rem] sm:h-auto sm:w-[calc(theme(maxWidth.7xl)-theme(spacing.16))]">
          <div className="absolute -inset-2 rounded-[calc(theme(borderRadius.xl)+theme(spacing.2))] shadow-sm ring-1 ring-black/5 dark:bg-white/[0.025] dark:ring-white/10" />
          <img
            alt=""
            src="https://tailwindcss.com/plus-assets/img/component-images/project-app-screenshot.png"
            className="h-full rounded-xl shadow-2xl ring-1 ring-black/10 dark:hidden dark:ring-white/10"
          />
          <img
            alt=""
            src="https://tailwindcss.com/plus-assets/img/component-images/dark-project-app-screenshot.png"
            className="hidden h-full rounded-xl shadow-2xl ring-1 ring-black/10 dark:block dark:ring-white/10"
          />
        </div>
      </div>
    </div>
  )
}
