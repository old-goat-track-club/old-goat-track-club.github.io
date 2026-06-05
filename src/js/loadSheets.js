// js/loadSheets.js

const SPREADSHEET_ID = "1S3pbz8AvWpsmvxMdZX7sKBHkZ5RuDGr8NuHHaZ4TPOI";
//https://docs.google.com/spreadsheets/d/1S3pbz8AvWpsmvxMdZX7sKBHkZ5RuDGr8NuHHaZ4TPOI/edit?usp=sharing

/**
 * Fetch data from a public Google Sheet tab via the GViz API.
 * No API key required — sheet must be "Anyone with the link can view".
 *
 * @param {string} sheetName - The tab name in the spreadsheet
 * @returns {Promise<{headers: string[], data: string[][]}>}
 */
export async function loadSheet(sheetName) {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `GViz API error: ${response.status} ${response.statusText}`,
      );
    }

    const csvText = await response.text();
    const lines = csvText.trim().split("\n");

    if (lines.length === 0) {
      return { headers: [], data: [] };
    }

    // Parse CSV rows — handles quoted fields with commas
    function parseRow(row) {
      const result = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          if (inQuotes && row[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    }

    const headers = parseRow(lines[0]);
    const data = lines.slice(1).map(parseRow);

    console.log("sheet data", sheetName, headers, data);
    return { headers, data };
  } catch (error) {
    console.error(`Error loading sheet "${sheetName}":`, error);
    return { headers: [], data: [] };
  }
}

// Re-export ALL rendering functions from loadCsv.js
export {
  loadCsv,
  createTable,
  createRosterTable,
  createRecordsTable,
} from "./loadCsv.js";
