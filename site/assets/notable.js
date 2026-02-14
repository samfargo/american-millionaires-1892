import {
  byId,
  displayCity,
  fetchJson,
  normalizeText,
  recordsUrl,
  setupBackToTop,
  setActiveNav,
  setPageReady,
} from "/assets/lib.js";

const notableNames = [
  "ANDREW CARNEGIE (of Carnegie Bros. & Co., and Carnegie, Phipps & Co.).",
  "JOHN D. ROCKEFELLER.",
  "WILLIAM ROCKEFELLER.",
  "J. PIERPONT MORGAN (of Drexel, Morgan & Co.).",
  "CORNELIUS VANDERBILT",
  "WILLIAM K. VANDERBILT",
  "GEORGE W. VANDERBILT",
  "FREDERICK W. VANDERBILT",
  "JAY GOULD.",
  "GEORGE M. PULLMAN (of the Pullman Palace Car Company).",
  "MARSHALL FIELD (of Field, Leiter & Co.).",
  "JOHN JACOB ASTOR.",
  "WILLIAM WALDORF ASTOR.",
  "ALEXANDER GRAHAM BELL.",
  "THOMAS A. EDISON.",
  'SAMUEL L. CLEMENS (known in literature as "Mark Twain").',
  "P. T. BARNUM.",
  "LEVI STRAUSS.",
  "ADOLPHUS BUSCH (of Anheuser-Busch Brewing Association).",
  "H. C. FRICK (of the H. C. Frick Coke Company).",
  "THOMAS A. MELLON.",
  "JOHN S. PILLSBURY.",
  "CLEMENCE STUDEBAKER (of the Studebaker Bros. Manufacturing Company).",
  "J. M. STUDEBAKER (of the Studebaker Brothers Manufacturing Company).",
  "SAMUEL COLGATE (of Colgate & Co.).",
  "JAMES C. FARGO.",
  "CHARLES FARGO.",
];

const notableNameNorms = new Set(notableNames.map((name) => normalizeText(name)));

const resultsBody = byId("results-body");
let people = [];

const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderRows = (rows) => {
  if (!rows.length) {
    resultsBody.innerHTML =
      '<tr><td colspan="4" class="empty-state">No matches found.</td></tr>';
    return;
  }
  const html = rows
    .map(
      (person) => `
      <tr>
        <td>${escapeHtml(person.name)}</td>
        <td>${escapeHtml(person.state)}</td>
        <td>${escapeHtml(displayCity(person.city))}</td>
        <td>${escapeHtml(person.desc)}</td>
      </tr>
    `
    )
    .join("");
  resultsBody.innerHTML = html;
};

const init = async () => {
  setActiveNav();
  setPageReady();
  setupBackToTop();

  try {
    const peopleData = await fetchJson(recordsUrl("people_index.json"));

    people = peopleData.filter((person) =>
      notableNameNorms.has(person.name_norm)
    );
    renderRows(people);
  } catch (error) {
    resultsBody.innerHTML =
      '<tr><td colspan="4" class="empty-state">Data unavailable.</td></tr>';
  }
};

init();
