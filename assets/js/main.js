(() => {
  const DATA_PATHS = {
    gallery: "assets/data/gallery.json",
    publications: "assets/data/publications.json",
    presentations: "assets/data/presentations.json",
    teaching: "assets/data/teaching.json"
  };

  const TYPE_ORDER = [
    "journal",
    "conference",
    "preprint",
    "thesis",
    "book-chapter",
    "in-preparation"
  ];

  const TYPE_LABELS = {
    "journal": "Journal papers",
    "conference": "Conference papers",
    "preprint": "Preprints",
    "thesis": "Thesis / book chapters",
    "book-chapter": "Thesis / book chapters",
    "in-preparation": "In preparation"
  };

  const LINK_LABELS = {
    pdf: "PDF",
    arxiv: "arXiv",
    doi: "DOI",
    code: "Code",
    slides: "Slides"
  };

  const TEACHING_LABELS = {
    teaching: "Teaching",
    tutorials: "Tutorials and PhD courses",
    workshops: "Workshops",
    service: "Service and reviewing"
  };

  document.addEventListener("DOMContentLoaded", () => {
    setupNavigation();
    setCurrentYear();
    setupImageFallbacks();
    setupPdfViewers();
    renderGallery();
    renderPublications();
    renderPresentations();
    renderTeaching();
  });

  function setupNavigation() {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.querySelector("#site-nav");

    if (toggle && nav) {
      toggle.addEventListener("click", () => {
        const expanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!expanded));
        nav.classList.toggle("is-open", !expanded);
        document.body.classList.toggle("nav-open", !expanded);
      });

      nav.addEventListener("click", (event) => {
        if (event.target.closest("a")) {
          toggle.setAttribute("aria-expanded", "false");
          nav.classList.remove("is-open");
          document.body.classList.remove("nav-open");
        }
      });
    }

    const currentPage = getCurrentPageName();
    document.querySelectorAll(".nav-links a").forEach((link) => {
      const linkPage = normalizePageName(link.getAttribute("href"));
      if (linkPage === currentPage) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      }
    });
  }

  function getCurrentPageName() {
    const page = window.location.pathname.split("/").pop() || "index.html";
    return normalizePageName(page);
  }

  function normalizePageName(path) {
    if (!path || path === "./" || path === "/") {
      return "index.html";
    }
    const clean = path.split("#")[0].split("?")[0];
    return clean || "index.html";
  }

  function setCurrentYear() {
    document.querySelectorAll("[data-current-year]").forEach((node) => {
      node.textContent = new Date().getFullYear();
    });
  }

  function setupImageFallbacks() {
    enableImageFallbacks(document);
  }

  function enableImageFallbacks(scope) {
    scope.querySelectorAll("[data-fallback-image]").forEach((image) => {
      if (image.dataset.fallbackReady === "true") {
        return;
      }

      image.dataset.fallbackReady = "true";
      const shell = image.closest("[data-image-shell]");
      image.addEventListener("error", () => {
        if (shell) {
          shell.classList.add("is-missing");
        }
        image.removeAttribute("src");
      });
    });
  }

  async function renderGallery() {
    const root = document.querySelector("[data-gallery-root]");
    if (!root) {
      return;
    }

    try {
      const data = await loadJson(DATA_PATHS.gallery);
      const entries = Array.isArray(data) ? data : data.gallery || [];
      if (!entries.length) {
        root.innerHTML = renderStatus("No experiment gallery items have been added yet.");
        return;
      }

      root.innerHTML = entries.map(renderGalleryCard).join("");
      enableImageFallbacks(root);
    } catch (error) {
      root.innerHTML = renderStatus(`Could not load the experiment gallery from <code>${DATA_PATHS.gallery}</code>. Check that the JSON file exists and is valid.`);
      console.error(error);
    }
  }

  function renderGalleryCard(entry) {
    const title = entry.title || "Untitled gallery item";
    const image = entry.image || "";
    const imageMarkup = image
      ? `<img src="${escapeAttribute(image)}" alt="${escapeAttribute(title)}" loading="lazy" data-fallback-image>`
      : "";
    const videoMarkup = entry.video
      ? `<a class="small-link" href="${escapeAttribute(entry.video)}" target="_blank" rel="noopener">Watch demo</a>`
      : "";

    return `
      <article class="gallery-card">
        <div class="gallery-media" data-image-shell>
          ${imageMarkup}
          <div class="gallery-placeholder" aria-hidden="true">
            <span>Image pending</span>
          </div>
        </div>
        <div class="gallery-body">
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(entry.caption || "Add a short caption in assets/data/gallery.json.")}</p>
          ${renderTags(entry.tags)}
          ${videoMarkup ? `<div class="gallery-actions">${videoMarkup}</div>` : ""}
        </div>
      </article>
    `;
  }

  async function setupPdfViewers() {
    const viewers = document.querySelectorAll("[data-pdf-viewer]");
    for (const viewer of viewers) {
      const src = viewer.getAttribute("data-pdf-src");
      if (!src) {
        continue;
      }

      const exists = await resourceExists(src);
      if (exists === false) {
        viewer.classList.add("pdf-placeholder");
        viewer.innerHTML = `<p>The PDF file <code>${escapeHtml(src)}</code> is not available yet. Upload it to this path to enable the preview.</p>`;
      }
    }
  }

  async function renderPublications() {
    const root = document.querySelector("[data-publications-root]");
    if (!root) {
      return;
    }

    try {
      const data = await loadJson(DATA_PATHS.publications);
      const publications = Array.isArray(data) ? data : data.publications || [];
      const withIndex = publications.map((item, index) => ({ ...item, originalIndex: index }));
      setupPublicationFilters(root, withIndex);
      drawPublications(root, withIndex, "all");
    } catch (error) {
      root.innerHTML = renderStatus(`Could not load publications from <code>${DATA_PATHS.publications}</code>. Check that the JSON file exists and is valid.`);
      console.error(error);
    }
  }

  function setupPublicationFilters(root, publications) {
    const buttons = document.querySelectorAll("[data-publication-filter]");
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        buttons.forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");
        drawPublications(root, publications, button.getAttribute("data-publication-filter") || "all");
      });
    });
  }

  function drawPublications(root, publications, activeFilter) {
    const normalizedFilter = normalizeTag(activeFilter);
    const filtered = normalizedFilter === "all"
      ? publications
      : publications.filter((publication) => {
        return (publication.tags || []).some((tag) => normalizeTag(tag) === normalizedFilter);
      });

    if (filtered.length === 0) {
      root.innerHTML = renderStatus("No publications match this filter yet.");
      return;
    }

    const groups = groupPublications(filtered);
    root.innerHTML = groups.map(([type, items]) => {
      const sectionItems = items
        .slice()
        .sort(compareByYearThenFileOrder)
        .map(renderPublication)
        .join("");

      return `
        <section class="dynamic-group" aria-labelledby="pub-${escapeAttribute(type)}">
          <h2 id="pub-${escapeAttribute(type)}">${TYPE_LABELS[type] || titleCase(type)}</h2>
          ${sectionItems}
        </section>
      `;
    }).join("");
  }

  function groupPublications(publications) {
    const grouped = new Map();
    publications.forEach((publication) => {
      const key = publication.type || "in-preparation";
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(publication);
    });

    return Array.from(grouped.entries()).sort(([a], [b]) => {
      const aIndex = TYPE_ORDER.indexOf(a);
      const bIndex = TYPE_ORDER.indexOf(b);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });
  }

  function renderPublication(publication) {
    const links = renderLinks(publication.links);
    const tags = renderTags(publication.tags);
    const status = publication.status ? `<span class="status-pill">${escapeHtml(publication.status)}</span>` : "";
    const year = publication.year || "TODO";
    const venue = publication.venue || "TODO";

    return `
      <article class="publication-card">
        <div>
          <span class="publication-type">${escapeHtml(titleCase(publication.type || "publication"))}</span>
          ${status}
        </div>
        <h3>${escapeHtml(publication.title || "Untitled publication")}</h3>
        <p class="publication-authors">${highlightAuthor(publication.authors || "TODO")}</p>
        <p class="publication-meta">${escapeHtml(venue)} - ${escapeHtml(String(year))}</p>
        ${tags}
        ${links}
      </article>
    `;
  }

  function compareByYearThenFileOrder(a, b) {
    const aYear = parseYear(a.year);
    const bYear = parseYear(b.year);
    if (aYear !== bYear) {
      return bYear - aYear;
    }
    return a.originalIndex - b.originalIndex;
  }

  function parseYear(year) {
    const parsed = Number.parseInt(year, 10);
    return Number.isFinite(parsed) ? parsed : -1;
  }

  function highlightAuthor(authors) {
    return escapeHtml(authors).replace(/Danilo Saccani/g, "<strong>Danilo Saccani</strong>");
  }

  async function renderPresentations() {
    const root = document.querySelector("[data-presentations-root]");
    if (!root) {
      return;
    }

    try {
      const data = await loadJson(DATA_PATHS.presentations);
      const presentations = Array.isArray(data) ? data : data.presentations || [];
      if (!presentations.length) {
        root.innerHTML = renderStatus("No presentations have been added yet.");
        return;
      }

      const sorted = presentations
        .map((item, index) => ({ ...item, originalIndex: index }))
        .sort(compareByYearThenFileOrder)
        .map((item, renderIndex) => ({ ...item, renderIndex }));

      const grouped = groupBy(sorted, (item) => item.year || "TODO");
      root.innerHTML = Array.from(grouped.entries()).map(([year, items]) => `
        <section class="dynamic-group" aria-labelledby="presentations-${escapeAttribute(year)}">
          <h2 id="presentations-${escapeAttribute(year)}">${escapeHtml(String(year))}</h2>
          ${items.map(renderPresentation).join("")}
        </section>
      `).join("");

      root.querySelectorAll("[data-view-slides]").forEach((button) => {
        button.addEventListener("click", () => {
          const index = Number.parseInt(button.getAttribute("data-view-slides"), 10);
          const presentation = sorted[index];
          updatePresentationViewer(presentation);
        });
      });
    } catch (error) {
      root.innerHTML = renderStatus(`Could not load presentations from <code>${DATA_PATHS.presentations}</code>. Check that the JSON file exists and is valid.`);
      console.error(error);
    }
  }

  function renderPresentation(presentation) {
    const tags = renderTags(presentation.tags);
    const pdf = presentation.pdf || "";
    const openPdf = pdf
      ? `<a class="small-link" href="${escapeAttribute(pdf)}" target="_blank" rel="noopener">Open PDF</a>`
      : `<span class="small-link is-disabled" aria-disabled="true">PDF TODO</span>`;
    const video = presentation.video
      ? `<a class="small-link" href="${escapeAttribute(presentation.video)}" target="_blank" rel="noopener noreferrer">Video</a>`
      : "";
    const viewSlides = pdf
      ? `<button class="small-link button-like" type="button" data-view-slides="${presentation.renderIndex}">View slides</button>`
      : "";

    return `
      <article class="presentation-card">
        <span class="publication-type">${escapeHtml(presentation.type || "presentation")}</span>
        <h3>${escapeHtml(presentation.title || "Untitled presentation")}</h3>
        <p class="presentation-meta">${escapeHtml(presentation.event || "TODO")} - ${escapeHtml(presentation.date || presentation.year || "TODO")} - ${escapeHtml(presentation.location || "TODO")}</p>
        <p>${escapeHtml(presentation.description || "Add a short description in the JSON data file.")}</p>
        ${tags}
        <div class="presentation-actions">${viewSlides}${openPdf}${video}</div>
      </article>
    `;
  }

  async function updatePresentationViewer(presentation) {
    const title = document.querySelector("#presentation-viewer-title");
    const viewer = document.querySelector("#presentation-viewer");
    if (!viewer || !presentation) {
      return;
    }

    if (title) {
      title.textContent = presentation.title || "Slides preview";
    }

    if (!presentation.pdf) {
      viewer.className = "pdf-placeholder";
      viewer.innerHTML = "<p>No PDF has been added for this presentation yet.</p>";
      return;
    }

    viewer.className = "pdf-placeholder";
    viewer.innerHTML = `<p>Checking <code>${escapeHtml(presentation.pdf)}</code>...</p>`;

    const exists = await resourceExists(presentation.pdf);
    if (exists === false) {
      viewer.innerHTML = `<p>The slides PDF was not found at <code>${escapeHtml(presentation.pdf)}</code>. Upload the file to this path or update the JSON entry.</p>`;
      return;
    }

    viewer.innerHTML = `
      <iframe src="${escapeAttribute(presentation.pdf)}" title="${escapeAttribute(presentation.title || "Presentation slides")}"></iframe>
    `;
  }

  async function renderTeaching() {
    const root = document.querySelector("[data-teaching-root]");
    if (!root) {
      return;
    }

    try {
      const data = await loadJson(DATA_PATHS.teaching);
      const entries = Array.isArray(data) ? data : data.entries || [];
      if (!entries.length) {
        root.innerHTML = renderStatus("No teaching or service entries have been added yet.");
        return;
      }

      const grouped = groupBy(entries, (item) => item.category || "teaching");
      const orderedGroups = Object.keys(TEACHING_LABELS)
        .filter((key) => grouped.has(key))
        .map((key) => [key, grouped.get(key)]);

      root.innerHTML = orderedGroups.map(([category, items]) => `
        <section class="dynamic-group" aria-labelledby="teaching-${escapeAttribute(category)}">
          <h2 id="teaching-${escapeAttribute(category)}">${TEACHING_LABELS[category] || titleCase(category)}</h2>
          ${items.map(renderTeachingEntry).join("")}
        </section>
      `).join("");
    } catch (error) {
      root.innerHTML = renderStatus(`Could not load teaching entries from <code>${DATA_PATHS.teaching}</code>. Check that the JSON file exists and is valid.`);
      console.error(error);
    }
  }

  function renderTeachingEntry(entry) {
    const tags = renderTags(entry.tags);
    const institution = entry.institution || "TODO";
    const period = entry.period || "TODO";

    return `
      <article class="teaching-card">
        <h3>${escapeHtml(entry.title || "Untitled entry")}</h3>
        <p class="teaching-meta">${escapeHtml(entry.role || "TODO")} - ${escapeHtml(institution)} - ${escapeHtml(period)}</p>
        <p>${escapeHtml(entry.description || "Add a short description in assets/data/teaching.json.")}</p>
        ${tags}
      </article>
    `;
  }

  async function loadJson(path) {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Could not fetch ${path}: ${response.status}`);
    }
    return response.json();
  }

  async function resourceExists(path) {
    try {
      const response = await fetch(path, { method: "HEAD", cache: "no-store" });
      return response.ok;
    } catch (error) {
      // Some local file previews block fetch. In that case, keep the embed/link visible.
      return null;
    }
  }

  function groupBy(items, getKey) {
    const grouped = new Map();
    items.forEach((item) => {
      const key = getKey(item);
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(item);
    });
    return grouped;
  }

  function renderLinks(links = {}) {
    const activeLinks = Object.entries(links).filter(([, href]) => Boolean(href));
    if (!activeLinks.length) {
      return "";
    }

    return `
      <div class="publication-actions">
        ${activeLinks.map(([key, href]) => `<a class="small-link" href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer">${LINK_LABELS[key] || titleCase(key)}</a>`).join("")}
      </div>
    `;
  }

  function renderTags(tags = []) {
    if (!tags.length) {
      return "";
    }

    return `
      <div class="tag-list">
        ${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
      </div>
    `;
  }

  function renderStatus(message) {
    return `<p class="status-message">${message}</p>`;
  }

  function normalizeTag(tag) {
    return String(tag || "").trim().toLowerCase();
  }

  function titleCase(value) {
    return String(value || "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }
})();
