declare module "pdf-parse" {
  interface PDFParseResult {
    text: string;
    info: any;
    metadata: any;
    version: string;
    numPages: number;
    numRender: number;
  }

  function pdfParse(buffer: Buffer): Promise<PDFParseResult>;
  export = pdfParse;
}
