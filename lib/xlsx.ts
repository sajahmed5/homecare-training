import JSZip from "jszip";

/**
 * Read the first sheet of an .xlsx file into CSV text.
 *
 * Both upload screens used to detect an Excel file and tell the manager to go
 * away and save it as CSV — someone had already discovered that managers
 * upload .xlsx, and the fix was an instruction (usability audit, 7 Oct 2026).
 * These users live in Excel, so we read it.
 *
 * Deliberately small: an .xlsx is a zip of XML, we already ship JSZip, and we
 * only need the cell text of one sheet. No spreadsheet library, no formulas,
 * no formatting — anything we can't read comes back as a clear problem rather
 * than a wrong row.
 */

/** Unescape the five XML entities Excel writes. */
function unescapeXml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, "&");
}

/** All the text inside one element, with the tags removed. */
function textOf(xml: string): string {
  return unescapeXml(xml.replace(/<[^>]*>/g, ""));
}

/** "BC12" → 54 (zero-based column index). */
export function columnIndex(ref: string): number {
  const letters = ref.replace(/[0-9]/g, "");
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** Shared strings are stored once and referenced by index. */
function sharedStrings(xml: string): string[] {
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1]));
}

function sheetToRows(sheetXml: string, strings: string[]): string[][] {
  const rows: string[][] = [];
  for (const rowMatch of sheetXml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells: string[] = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c([^>]*)\/>|<c([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = cellMatch[1] ?? cellMatch[2] ?? "";
      const body = cellMatch[3] ?? "";
      const ref = /r="([A-Z]+\d+)"/.exec(attrs)?.[1];
      const type = /t="([^"]+)"/.exec(attrs)?.[1];
      let value = "";
      if (type === "s") {
        const idx = Number(textOf(body));
        value = strings[idx] ?? "";
      } else if (type === "inlineStr") {
        value = textOf(body);
      } else {
        const v = /<v>([\s\S]*?)<\/v>/.exec(body);
        value = v ? unescapeXml(v[1]) : "";
      }
      // Honour the cell reference, so blank cells don't shift a row left.
      const at = ref ? columnIndex(ref) : cells.length;
      while (cells.length < at) cells.push("");
      cells[at] = value.trim();
    }
    rows.push(cells);
  }
  return rows;
}

export interface XlsxResult {
  csv?: string;
  problem?: string;
}

/** Convert the first worksheet of an .xlsx to CSV text. */
export async function xlsxToCsv(data: ArrayBuffer): Promise<XlsxResult> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(data);
  } catch {
    return { problem: "That file couldn't be opened. Is it really an Excel file?" };
  }

  // Sheets are named sheet1.xml, sheet2.xml…; take the lowest-numbered one,
  // which is the first tab in every file Excel writes.
  const sheetNames = Object.keys(zip.files)
    .filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n))
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  const first = sheetNames[0];
  if (!first) {
    return { problem: "That Excel file has no sheets we can read." };
  }

  const sheetXml = await zip.file(first)!.async("string");
  const stringsFile = zip.file("xl/sharedStrings.xml");
  const strings = stringsFile ? sharedStrings(await stringsFile.async("string")) : [];

  const rows = sheetToRows(sheetXml, strings).filter((r) =>
    r.some((c) => c !== ""),
  );
  if (rows.length === 0) {
    return { problem: "That sheet is empty." };
  }

  return { csv: rows.map((r) => r.map(csvCell).join(",")).join("\r\n") };
}
