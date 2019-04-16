import 'babel-polyfill'

Array.prototype.forEach.call(
  document.querySelectorAll('[data-module]'),
  (element: HTMLElement) => {
    const keys: string[] = element.getAttribute('data-module')!.split(/\s+/)
    const opts: string | null = element.getAttribute('data-options') || null

    keys.forEach(key => {
      import(`./modules/${key.charAt(0).toUpperCase() + key.slice(1)}`).then(
        module => {
          const options: object = opts
            ? keys.length > 1
              ? JSON.parse(opts)[key]
              : JSON.parse(opts)
            : {}

          if (module !== void 0) return new module.default(element, options)
        },
      )
    })
  },
)
