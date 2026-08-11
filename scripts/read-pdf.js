// Extracts raw text from a PDF so company details can be read from
// the CR / VAT certificates. Usage: node scripts/read-pdf.js "<path>"
const fs = require("fs");
const pdf = require("pdf-parse");

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/read-pdf.js <file.pdf>");
  process.exit(1);
}

pdf(fs.readFileSync(file))
  .then((data) => {
    console.log("=== PAGES:", data.numpages, "===");
    console.log(data.text);
  })
  .catch((err) => {
    console.error("failed:", err.message);
    process.exit(1);
  });
