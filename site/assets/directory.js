import {
  byId,
  debounce,
  displayCity,
  fetchJson,
  normalizeText,
  recordsUrl,
  setupBackToTop,
  setActiveNav,
  setPageReady,
} from "/assets/lib.js";

const searchInput = byId("search-input");
const stateSelect = byId("state-filter");
const citySelect = byId("city-filter");
const resultsBody = byId("results-body");
const resultsCount = byId("results-count");

let people = [];
let stateCity = [];
const searchParams = new URLSearchParams(window.location.search);
const initialState = searchParams.get("state") || "";
const initialCity = searchParams.get("city") || "";
const initialQuery = searchParams.get("q") || "";

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

const updateResultsCount = (count, total) => {
  resultsCount.textContent = `Showing ${count} of ${total} entries`;
};

const updateCityOptions = (stateValue, selectedCity = "") => {
  const stateEntry = stateCity.find((entry) => entry.state === stateValue);
  citySelect.innerHTML = '<option value="">All cities</option>';
  if (!stateEntry) {
    citySelect.disabled = true;
    return;
  }
  const options = stateEntry.cities
    .map(
      (city) =>
        `<option value="${city.city}">${displayCity(city.city)} (${city.count})</option>`
    )
    .join("");
  citySelect.insertAdjacentHTML("beforeend", options);
  citySelect.disabled = false;
  if (selectedCity) {
    citySelect.value = selectedCity;
  }
};

const applyFilters = () => {
  const state = stateSelect.value;
  const city = citySelect.value;
  const query = normalizeText(searchInput.value);
  let filtered = people;

  if (state) {
    filtered = filtered.filter((person) => person.state === state);
  }
  if (city) {
    filtered = filtered.filter((person) => person.city === city);
  }
  if (query) {
    filtered = filtered.filter(
      (person) =>
        person.name_norm.includes(query) || person.desc_norm.includes(query)
    );
  }

  renderRows(filtered);
  updateResultsCount(filtered.length, people.length);
};

const debouncedFilter = debounce(applyFilters, 80);

const init = async () => {
  setActiveNav();
  setPageReady();
  setupBackToTop();

  if (initialQuery) {
    searchInput.value = initialQuery;
  }

  try {
    const [peopleData, stateCityData] = await Promise.all([
      fetchJson(recordsUrl("people_index.json")),
      fetchJson(recordsUrl("state_city_counts.json")),
    ]);

    people = peopleData;
    stateCity = stateCityData.states;

    stateSelect.innerHTML =
      '<option value="">All states</option>' +
      stateCity
        .map(
          (state) =>
            `<option value="${state.state}">${state.state} (${state.count})</option>`
        )
        .join("");

    if (initialState && stateCity.some((state) => state.state === initialState)) {
      stateSelect.value = initialState;
      updateCityOptions(initialState, initialCity);
    } else {
      updateCityOptions("");
    }

    applyFilters();
  } catch (error) {
    resultsCount.textContent =
      "Unable to load the directory data. Check the data files.";
    resultsBody.innerHTML =
      '<tr><td colspan="4" class="empty-state">Data unavailable.</td></tr>';
  }
};

searchInput.addEventListener("input", debouncedFilter);
stateSelect.addEventListener("change", () => {
  updateCityOptions(stateSelect.value);
  applyFilters();
});
citySelect.addEventListener("change", applyFilters);

init();
