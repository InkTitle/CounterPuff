import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const outDir = path.join(process.cwd(), "private", "ebooks");
await mkdir(outDir, { recursive: true });

const pdf = await PDFDocument.create();
const font = await pdf.embedFont(StandardFonts.Helvetica);
const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

function addPage(title, lines) {
  const page = pdf.addPage([612, 792]);
  page.drawText(title, { x: 56, y: 720, size: 18, font: fontBold, color: rgb(0.05, 0.14, 0.22) });
  let y = 680;
  for (const line of lines) {
    page.drawText(line, { x: 56, y, size: 11, font, color: rgb(0.12, 0.2, 0.28) });
    y -= 18;
  }
  return page;
}

try {
  const coverBytes = await readFile(path.join(process.cwd(), "public", "images", "book-cover.png"));
  const coverImage = await pdf.embedJpg(coverBytes).catch(async () => pdf.embedPng(coverBytes));
  const page = pdf.addPage([612, 792]);
  const dims = coverImage.scaleToFit(500, 700);
  page.drawImage(coverImage, { x: (612 - dims.width) / 2, y: (792 - dims.height) / 2, width: dims.width, height: dims.height });
} catch {
  addPage("The CounterPuff Method", ["Warren Lockhart"]);
}

addPage("About this file", [
  "This PDF is the in-app copy used by the CounterPuff reader.",
  "The original manuscript filename specified in the product brief was",
  "Final_TCPM.pdf. That file was not present in the application package",
  "when this deployment was built, so this authorized placeholder is used",
  "until an administrator uploads the official PDF.",
  "",
  "This file does not invent book chapters, quotations, or page numbers",
  "from the manuscript. It only repeats public cover information and",
  "blank worksheets.",
]);

addPage("The CounterPuff Method (cover summary)", [
  "A practical, evidence-informed guide to understanding urges,",
  "changing routines, and building a quit plan.",
  "",
  "How to Systematically Deconstruct and Destroy Tobacco Cravings.",
  "Warren Lockhart",
  "",
  "Notice — Catch the urge early",
  "Deconstruct — Separate the urge into parts",
  "Choose — Make the next action deliberate",
  "Respond — Build a short, realistic plan",
  "Review — Learn without punishing yourself",
]);

addPage("Blank worksheet: Notice", [
  "Date: ____________________   Time: ____________________",
  "Where I am: ___________________________________________",
  "Body sensation: ________________________________________",
  "Trigger (if known): ____________________________________",
  "Urge strength (0-10): __________________________________",
  "",
  "I will wait this many minutes before deciding: __________",
]);

addPage("Blank worksheet: Deconstruct", [
  "Physical part: _________________________________________",
  "Habit / routine part: __________________________________",
  "Thought / story part: __________________________________",
  "What I expected the product to do: _____________________",
  "What else could meet that need in 10 minutes: ___________",
]);

addPage("Blank 30-day plan grid", [
  "Use one box per day. Write S for smoke-free, L for lapse,",
  "or R for reduced. A lapse does not erase earlier days.",
  "",
  "01 ____  02 ____  03 ____  04 ____  05 ____  06 ____  07 ____",
  "08 ____  09 ____  10 ____  11 ____  12 ____  13 ____  14 ____",
  "15 ____  16 ____  17 ____  18 ____  19 ____  20 ____  21 ____",
  "22 ____  23 ____  24 ____  25 ____  26 ____  27 ____  28 ____",
  "29 ____  30 ____",
  "",
  "Notes: ________________________________________________",
]);

addPage("Health notice", [
  "CounterPuff and this document are educational behavioral support.",
  "They are not medical care, a diagnosis, or an emergency service.",
  "If you have an urgent health problem, contact local emergency",
  "services. Consider a qualified clinician or a reputable quitline.",
]);

const bytes = await pdf.save();
const dest = path.join(outDir, "counterpuff-method.pdf");
await writeFile(dest, bytes);
console.log("wrote", dest, "pages", pdf.getPageCount());
