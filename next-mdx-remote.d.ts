declare module 'next-mdx-remote/render-to-string' {
  type Components = { [key: string]: JSXElementConstructor<any> }

  interface Scope {
    [key: string]: unknown
  }

  export interface Source {
    compiledSource: string
    renderedOutput: string
    scope?: Scope
  }

  type RenderToStringOptions = {
    components?: Components
    mdxOptions?: unknown
    scope?: Scope
  }

  declare function renderToString(
    content: string,
    options?: RenderToStringOptions
  ): Promise<Source>
  export default renderToString
}

declare module 'next-mdx-remote/hydrate' {
  type HydrateOptions = { components: JSX.Element }

  export interface Source {
    compiledSource: string
    renderedOutput: string
    scope?: Scope
  }

  declare function hydrate(
    content: Source,
    options?: HydrateOptions
  ): JSX.Element
  export default hydrate
}
