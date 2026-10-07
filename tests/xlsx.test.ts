import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { columnIndex, xlsxToCsv } from "../lib/xlsx";

/** Build the smallest .xlsx Excel would recognise, for the parser to read. */
async function workbook(
  rows: (string | number)[][],
  opts: { shared?: boolean } = { shared: true },
): Promise<ArrayBuffer> {
  const zip = new JSZip();
  const strings: string[] = [];
  const cellXml = (v: string | number, ref: string) => {
    if (typeof v === "number") return `<c r="${ref}"><v>${v}</v></c>`;
    if (!opts.shared) return `<c r="${ref}" t="inlineStr"><is><t>${v}</t></is></c>`;
    let i = strings.indexOf(v);
    if (i === -1) i = strings.push(v) - 1;
    return `<c r="${ref}" t="s"><v>${i}</v></c>`;
  };
  const body = rows
    .map((row, r) => {
      const cells = row
        .map((v, c) => (v === "" ? "" : cellXml(v, `${String.fromCharCode(65 + c)}${r + 1}`)))
        .join("");
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join("");
  zip.file("xl/worksheets/sheet1.xml", `<worksheet><sheetData>${body}</sheetData></worksheet>`);
  if (opts.shared) {
    zip.file(
      "xl/sharedStrings.xml",
      `<sst>${strings.map((s) => `<si><t>${s}</t></si>`).join("")}</sst>`,
    );
  }
  const buf = await zip.generateAsync({ type: "arraybuffer" });
  return buf;
}

describe("reading an Excel upload", () => {
  it("turns the first sheet into CSV", async () => {
    const { csv, problem } = await xlsxToCsv(
      await workbook([
        ["Name", "Email", "Role"],
        ["Amina Hassan", "amina@example.test", "learner"],
      ]),
    );
    expect(problem).toBeUndefined();
    expect(csv).toBe("Name,Email,Role\r\nAmina Hassan,amina@example.test,learner");
  });

  it("reads cells typed straight into the sheet, not just shared strings", async () => {
    const { csv } = await xlsxToCsv(
      await workbook([["Name"], ["Jo Patel"]], { shared: false }),
    );
    expect(csv).toBe("Name\r\nJo Patel");
  });

  it("keeps a blank cell in place instead of shifting the row left", async () => {
    const { csv } = await xlsxToCsv(
      await workbook([
        ["Name", "Email", "Role"],
        ["Sam", "", "org_admin"],
      ]),
    );
    expect(csv).toBe("Name,Email,Role\r\nSam,,org_admin");
  });

  it("quotes a cell containing a comma, and unescapes XML entities", async () => {
    const { csv } = await xlsxToCsv(
      await workbook([["Course"], ["Moving & Handling, Level 2"]]),
    );
    expect(csv).toBe('Course\r\n"Moving & Handling, Level 2"');
  });

  it("skips empty rows and reports an empty sheet", async () => {
    const withGap = await xlsxToCsv(await workbook([["Name"], [""], ["Jo"]]));
    expect(withGap.csv).toBe("Name\r\nJo");
    const empty = await xlsxToCsv(await workbook([[""]]));
    expect(empty.problem).toBe("That sheet is empty.");
  });

  it("explains itself when the file isn't an Excel file at all", async () => {
    const { problem } = await xlsxToCsv(new TextEncoder().encode("just text").buffer as ArrayBuffer);
    expect(problem).toMatch(/really an Excel file/);
  });

  it("maps spreadsheet column letters to positions", () => {
    expect(columnIndex("A1")).toBe(0);
    expect(columnIndex("C7")).toBe(2);
    expect(columnIndex("AA1")).toBe(26);
  });
});
