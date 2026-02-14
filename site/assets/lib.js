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

const SITE_HEADER = {
  title: "American Millionaires, 1892",
  subtitle:
    "Digitzed record of The Tribune Monthly's American Millionaires edition.",
  nav: [
    { href: "/", label: "Home" },
    { href: "/directory/", label: "Directory" },
    { href: "/notable/", label: "Notable Names" },
    { href: "/overview/", label: "Overview" },
    { href: "/gallery/", label: "Gallery" },
    { href: "/contact/", label: "Contact" },
  ],
};

const buildSiteHeader = () => {
  const fragment = document.createDocumentFragment();

  const brand = document.createElement("div");
  brand.className = "brand";

  const titleLink = document.createElement("a");
  titleLink.className = "brand__title";
  titleLink.href = "/";
  titleLink.textContent = SITE_HEADER.title;

  const subtitle = document.createElement("div");
  subtitle.className = "brand__subtitle";
  subtitle.textContent = SITE_HEADER.subtitle;

  brand.append(titleLink, subtitle);

  const nav = document.createElement("nav");
  nav.className = "site-nav";
  nav.setAttribute("aria-label", "Primary");

  SITE_HEADER.nav.forEach((item) => {
    const link = document.createElement("a");
    link.href = item.href;
    link.textContent = item.label;
    nav.appendChild(link);
  });

  fragment.append(brand, nav);
  return fragment;
};

const ensureSiteHeader = () => {
  const header =
    document.querySelector("[data-site-header]") ||
    document.querySelector(".site-header");
  if (!header) return;
  if (header.dataset.navReady === "true") return;
  const content = buildSiteHeader();
  if (typeof header.replaceChildren === "function") {
    header.replaceChildren(content);
  } else {
    header.innerHTML = "";
    header.appendChild(content);
  }
  header.dataset.navReady = "true";
};

export const setActiveNav = () => {
  ensureSiteHeader();
  const path = window.location.pathname;
  const navLinks = document.querySelectorAll(".site-nav a");
  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;
    link.classList.remove("is-active");
    link.removeAttribute("aria-current");
    if (href === "/" && path === "/") {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
      return;
    }
    if (href !== "/" && path.startsWith(href)) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
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
