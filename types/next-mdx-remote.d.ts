type Components = { [key: string]: JSXElementConstructor<any> }
declare module 'next-mdx-remote/render-to-string' {
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
  type HydrateOptions = {
    components: Components
  }

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
