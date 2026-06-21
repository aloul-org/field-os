import { renderDocumentHtml, type PdfDocument } from "@/lib/pdf/template";

/**
 * Render an estimate/invoice to a PDF buffer with headless Chromium.
 *
 * On Vercel/Lambda we use @sparticuz/chromium's serverless-compatible binary.
 * Locally, set PUPPETEER_EXECUTABLE_PATH to your installed Chrome/Edge (e.g.
 * "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"); if neither is
 * available the route surfaces a friendly error rather than crashing.
 */
export async function generateDocumentPdf(doc: PdfDocument): Promise<Buffer> {
  const html = renderDocumentHtml(doc);

  const puppeteer = (await import("puppeteer-core")).default;
  const chromiumMod = await import("@sparticuz/chromium");
  const chromium = chromiumMod.default;

  const isServerless = Boolean(
    process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL
  );
  const localExecutable = process.env.PUPPETEER_EXECUTABLE_PATH;

  const executablePath =
    !isServerless && localExecutable
      ? localExecutable
      : await chromium.executablePath();

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "a4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
