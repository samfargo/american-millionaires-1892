export const byId = (id) => document.getElementById(id);

export const normalizeText = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const slugify = (value) =>
  normalizeText(value)
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const formatNumber = (value) =>
  new Intl.NumberFormat("en-US").format(value);

export const debounce = (fn, wait = 80) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
};

export const setActiveNav = () => {
  const path = window.location.pathname;
  const navLinks = document.querySelectorAll(".site-nav a");
  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;
    if (href === "/" && path === "/") {
      link.classList.add("is-active");
      return;
    }
    if (href !== "/" && path.startsWith(href)) {
      link.classList.add("is-active");
    }
  });
};

export const buildQuery = (params) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  return search.toString();
};

export const displayCity = (value) => {
  if (!value) return "Unknown";
  return value.toLowerCase() === "null" ? "Unknown" : value;
};

export const parsePath = () => window.location.pathname.split("/").filter(Boolean);

export const setPageReady = () => {
  const page = document.querySelector(".page");
  if (page) {
    page.classList.add("fade-in");
    return;
  }
  document.body.classList.add("fade-in");
};

export const fetchJson = async (url) => {
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Failed to load ${url}`);
  }
  return response.json();
};

export const recordsUrl = (file) =>
  new URL(`./records/${file}`, import.meta.url).toString();

export const setupBackToTop = () => {
  const link = document.querySelector(".back-to-top");
  if (!link) return;
  const toggle = () => {
    if (window.scrollY > 0) {
      link.classList.add("is-visible");
    } else {
      link.classList.remove("is-visible");
    }
  };
  toggle();
  window.addEventListener("scroll", toggle, { passive: true });
};
