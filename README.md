# Danilo Saccani academic website

This repository contains a static personal academic website for GitHub Pages. It uses only HTML, CSS, vanilla JavaScript, and JSON data files. There is no build step, package manager, backend, database, or deployment system.

## Publish on GitHub Pages

1. Push the repository to `https://github.com/DaniloSaccani/danilosaccani.github.io`.
2. In GitHub, open **Settings > Pages**.
3. Set the source to the `main` branch and the repository root.
4. Save the settings.
5. The site should be available at `https://danilosaccani.github.io`.

The `.nojekyll` file is included so GitHub Pages serves the static files directly without trying to process them with Jekyll.

## Update the profile picture

Put the profile image at:

```text
picture/profile.jpg
```

If the image is missing, the homepage shows a clean initials placeholder instead of a broken image.

## Update the CV

Replace the PDF at:

```text
cv/cv.pdf
```

The CV page links to this file and embeds it in the page. If the PDF is missing on GitHub Pages, the page shows a placeholder message.

## Add or edit publications

Edit:

```text
assets/data/publications.json
```

Each publication supports this structure:

```json
{
  "title": "",
  "authors": "",
  "venue": "",
  "year": "",
  "type": "journal | conference | preprint | thesis | book-chapter | in-preparation",
  "status": "published | accepted | preprint | in preparation",
  "links": {
    "pdf": "",
    "arxiv": "",
    "doi": "",
    "code": "",
    "slides": ""
  },
  "tags": ["MPC", "safe learning"]
}
```

Use `"TODO"` for uncertain fields rather than inventing details. The list in `publications.json` is a seed list, not a verified complete bibliography. The publications page groups papers by type and sorts newest first within each group. If years are equal or set to `TODO`, the order in the JSON file is used as the tie-breaker.

The JavaScript bolds `Danilo Saccani` automatically in author lists.

## Add a presentation

1. Upload the PDF to:

```text
assets/presentations/
```

2. Add a corresponding entry in:

```text
assets/data/presentations.json
```

Example:

```json
{
  "title": "My Talk Title",
  "event": "Conference or seminar name",
  "type": "conference talk",
  "location": "City, Country",
  "date": "2026-05-01",
  "year": "2026",
  "description": "One short sentence about the talk.",
  "pdf": "assets/presentations/my-talk.pdf",
  "video": "",
  "tags": ["MPC", "Safe Learning"]
}
```

Do not rely on GitHub Pages scanning folders automatically. The presentation will only appear if it has an entry in `assets/data/presentations.json`.

## Add teaching, tutorials, workshops, service, or reviewing

Edit:

```text
assets/data/teaching.json
```

Use the `category` field to place an entry in one of these sections:

```text
teaching
tutorials
workshops
service
```

## Change colors and styling

Edit the CSS variables at the top of:

```text
assets/css/style.css
```

The main accent colors are:

```css
--color-accent: #0f6b73;
--color-accent-dark: #084c59;
--color-blue: #1d5f8f;
```

## Edit personal links

Personal links appear in the repeated header/footer and in the homepage/contact pages. Edit the relevant HTML files directly:

```text
index.html
contact.html
research.html
publications.html
presentations.html
cv.html
teaching.html
```

Because this is a static site without a templating system, the header and footer are repeated in each HTML file.

## Avoid broken links

- Keep internal links relative, such as `cv/cv.pdf` or `assets/presentations/talk.pdf`.
- Check that uploaded files match the exact filename and capitalization used in the JSON or HTML.
- Leave link fields as empty strings (`""`) until a PDF, DOI, arXiv page, code repository, slide deck, or video is available.
- External profile links open in a new browser tab.
- If you rename a page, update the navigation in every HTML file.

## Local preview

Because the publications, presentations, and teaching pages load JSON with JavaScript, preview the site through a local web server rather than opening the HTML files directly. From the repository root, run:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```
