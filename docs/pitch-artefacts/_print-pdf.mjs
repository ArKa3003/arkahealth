import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = "file://" + path.join(__dirname, "ARKA_AWS_scaling_architecture.html");
const out = path.join(__dirname, "ARKA_AWS_scaling_architecture.pdf");

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto(html, { waitUntil: "networkidle0" });
await page.pdf({
  path: out,
  format: "letter",
  landscape: true,
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: "0.35in", right: "0.35in", bottom: "0.35in", left: "0.35in" },
  scale: 0.88,
});
await browser.close();
console.log("Wrote", out);
