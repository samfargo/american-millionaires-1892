import {
  byId,
  displayCity,
  fetchJson,
  formatNumber,
  recordsUrl,
  setupBackToTop,
  setActiveNav,
  setPageReady,
} from "/assets/lib.js";

const stateBody = byId("state-body");
const cityBody = byId("city-body");
const cityStateSelect = byId("city-state-select");
const industryBody = byId("industry-body");
const stateSortName = byId("state-sort-name");
const stateSortCount = byId("state-sort-count");
const citySortName = byId("city-sort-name");
const citySortCount = byId("city-sort-count");

let statesCache = [];
let currentState = "";
const stateSort = { key: "state", dir: "asc" };
const citySort = { key: "count", dir: "desc" };

const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderIndustry = (rows) => {
  if (!rows.length) {
    industryBody.innerHTML =
      '<tr><td colspan="2" class="empty-state">No industry totals found.</td></tr>';
    return;
  }
  industryBody.innerHTML = rows
    .map(
      (row) => `
      <tr>
        <td>${escapeHtml(row.category)}</td>
        <td>${formatNumber(row.count)}</td>
      </tr>
    `
    )
    .join("");
};

const sortRows = (rows, key, dir) => {
  const sorted = [...rows].sort((a, b) => {
    if (key === "count") {
      return dir === "asc" ? a.count - b.count : b.count - a.count;
    }
    return dir === "asc"
      ? a[key].localeCompare(b[key])
      : b[key].localeCompare(a[key]);
  });
  return sorted;
};

const setSortButtonState = (nameButton, countButton, activeKey) => {
  nameButton.classList.toggle("is-active", activeKey === "state" || activeKey === "city");
  countButton.classList.toggle("is-active", activeKey === "count");
};

const renderStateTotals = (states) => {
  if (!states.length) {
    stateBody.innerHTML =
      '<tr><td colspan="2" class="empty-state">No state totals found.</td></tr>';
    return;
  }
  stateBody.innerHTML = states
    .map(
      (state) => `
      <tr>
        <td>${escapeHtml(state.state)}</td>
        <td>${formatNumber(state.count || 0)}</td>
      </tr>
    `
    )
    .join("");
};

const renderCityTotals = (stateEntry) => {
  if (!stateEntry) {
    cityBody.innerHTML =
      '<tr><td colspan="2" class="empty-state">Choose a state to view city totals.</td></tr>';
    return;
  }
  if (!stateEntry.cities.length) {
    cityBody.innerHTML =
      '<tr><td colspan="2" class="empty-state">No city totals available.</td></tr>';
    return;
  }
  const sortedCities = sortRows(stateEntry.cities, citySort.key, citySort.dir);
  cityBody.innerHTML = sortedCities
    .map(
      (city) => `
      <tr>
        <td>${escapeHtml(displayCity(city.city))}</td>
        <td>${formatNumber(city.count)}</td>
      </tr>
    `
    )
    .join("");
};

const init = async () => {
  setActiveNav();
  setPageReady();
  setupBackToTop();

  try {
    const [stateCityData, industryTotals] = await Promise.all([
      fetchJson(recordsUrl("state_city_counts.json")),
      fetchJson(recordsUrl("industry_totals.json")),
    ]);
    statesCache = stateCityData.states || [];
    const sortedStates = sortRows(statesCache, stateSort.key, stateSort.dir);
    renderStateTotals(sortedStates);
    renderIndustry(industryTotals);

    cityStateSelect.innerHTML =
      '<option value="">Select a state</option>' +
      statesCache
        .map(
          (state) =>
            `<option value="${state.state}">${state.state} (${formatNumber(
              state.count || 0
            )})</option>`
        )
        .join("");

    cityStateSelect.addEventListener("change", () => {
      currentState = cityStateSelect.value;
      const stateEntry = statesCache.find(
        (state) => state.state === currentState
      );
      renderCityTotals(stateEntry);
    });

    stateSortName.addEventListener("click", () => {
      stateSort.dir =
        stateSort.key === "state"
          ? stateSort.dir === "asc"
            ? "desc"
            : "asc"
          : "asc";
      stateSort.key = "state";
      const resorted = sortRows(statesCache, stateSort.key, stateSort.dir);
      renderStateTotals(resorted);
      setSortButtonState(stateSortName, stateSortCount, stateSort.key);
    });

    stateSortCount.addEventListener("click", () => {
      stateSort.dir =
        stateSort.key === "count"
          ? stateSort.dir === "asc"
            ? "desc"
            : "asc"
          : "desc";
      stateSort.key = "count";
      const resorted = sortRows(statesCache, stateSort.key, stateSort.dir);
      renderStateTotals(resorted);
      setSortButtonState(stateSortName, stateSortCount, stateSort.key);
    });

    citySortName.addEventListener("click", () => {
      citySort.dir =
        citySort.key === "city"
          ? citySort.dir === "asc"
            ? "desc"
            : "asc"
          : "asc";
      citySort.key = "city";
      const stateEntry = statesCache.find(
        (state) => state.state === currentState
      );
      renderCityTotals(stateEntry);
      setSortButtonState(citySortName, citySortCount, citySort.key);
    });

    citySortCount.addEventListener("click", () => {
      citySort.dir =
        citySort.key === "count"
          ? citySort.dir === "asc"
            ? "desc"
            : "asc"
          : "desc";
      citySort.key = "count";
      const stateEntry = statesCache.find(
        (state) => state.state === currentState
      );
      renderCityTotals(stateEntry);
      setSortButtonState(citySortName, citySortCount, citySort.key);
    });

    setSortButtonState(stateSortName, stateSortCount, stateSort.key);
    setSortButtonState(citySortName, citySortCount, citySort.key);
  } catch (error) {
    stateBody.innerHTML =
      '<tr><td colspan="2" class="empty-state">Data unavailable.</td></tr>';
    industryBody.innerHTML =
      '<tr><td colspan="2" class="empty-state">Data unavailable.</td></tr>';
    cityBody.innerHTML =
      '<tr><td colspan="2" class="empty-state">Data unavailable.</td></tr>';
  }
};

init();
