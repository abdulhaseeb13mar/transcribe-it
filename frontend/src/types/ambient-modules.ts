// Ambient module declarations for packages without types
declare module 'html-to-docx' {
  interface HTMLtoDOCXOptions {
    table?: {
      row?: {
        cantSplit?: boolean
      }
    }
    footer?: boolean
    pageNumber?: boolean
  }

  function HTMLtoDOCX(
    htmlString: string,
    headerHTMLString?: string | null,
    options?: HTMLtoDOCXOptions,
  ): Promise<ArrayBuffer>

  export default HTMLtoDOCX
}
