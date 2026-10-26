// Public preview content. Images are genuine project captures; presentation frames are illustrative.
const previews = {
  "novalens": {
    "name": "NovaLens",
    "text": "From unidentified parts to a reviewable catalogue.",
    "image": "novalens-review.webp",
    "alt": "Historical NovaLens review demonstration",
    "caption": "Historical mock-provider capture. Sample candidates require verification.",
    "url": "/work/novalens/",
    "artifact": "screen"
  },
  "forma": {
    "name": "Forma",
    "text": "A clearer view of invoices and receivables.",
    "image": "forma-dashboard.webp",
    "alt": "Forma application dashboard with seeded data",
    "caption": "Actual application interface with seeded sample data. Not live financial results.",
    "url": "/work/forma/",
    "artifact": "screen"
  },
  "atlas": {
    "name": "Atlas",
    "text": "Finding your way inside unfamiliar places.",
    "image": "atlas-route.webp",
    "alt": "Atlas illustrative indoor navigation",
    "caption": "Illustrative route. Physical venue validation pending.",
    "url": "/work/atlas/",
    "artifact": "phone"
  },
  "sketchbook": {
    "name": "The sketchbook",
    "text": "Experiments, personal tools and questions worth working through.",
    "image": "laas-tracking.webp",
    "alt": "Football video with unreviewed detections",
    "caption": "Laas research output. Temporary tracks are not verified player identities.",
    "url": "/sketchbook/",
    "artifact": "notebook"
  },
  "digital-twin": {
    "name": "Digital Twin",
    "text": "Real-time ML-system observability: a Python telemetry pipeline using Kafka and Flink for event processing, Redis for state, and Grafana and Prometheus for monitoring and alerts.",
    "url": "/work/digital-twin/",
    "artifact": "note"
  },
  "about": {
    "name": "Hello, I’m Anotida.",
    "text": "I build apps, websites, and ideas I want to see exist. Based in Johannesburg, working across software engineering, product design, AI and mobile experiences.",
    "url": "/about/",
    "artifact": "postcard"
  },
  "dala": {
    "name": "Dala",
    "text": "A VirtuKey iPhone app built with SwiftUI. Native source includes demo roles and an API client. A genuine device capture is being prepared; connected backend and payment behaviour remain unverified.",
    "url": "/work/dala/",
    "artifact": "note"
  },
  "index": {
    "name": "The project files",
    "text": "Practical AI, mobile interaction and systems work. Browse the full Index for the idea, my contribution, current status and decisions behind each project.",
    "url": "/work/",
    "cta": "Browse projects",
    "artifact": "folder"
  },
  "cv": {
    "name": "Experience & CV",
    "image": "cv-page.webp",
    "alt": "First page of Anotida Dzinotyiwei’s supplied CV",
    "caption": "First page of my supplied CV.",
    "text": "Software engineering and product work across VirtuKey, Decision Boundary Alpha, Dala, Kenac Computer Systems and Veneka. My supplied CV includes the complete experience record.",
    "url": "/cv/",
    "cta": "View experience & CV",
    "download": true,
    "document": true,
    "artifact": "cv"
  },
  "collection": {
    "name": "Products & websites",
    "text": "A collection of authored interfaces and storefront design.",
    "image": "aloir-web.webp",
    "alt": "Aloir Apparel storefront demo",
    "caption": "Authored design with a sample catalogue. This demo does not take payments or place orders.",
    "url": "/collection/",
    "cta": "View the collection",
    "artifact": "print"
  }
};

const dimensions = {
  'cv-page.webp': [857, 1109],
  'aloir-web.webp': [1440, 1000],
  'novalens-review.webp': [1068, 2048],
  'forma-dashboard.webp': [1440, 1000],
  'atlas-route.webp': [390, 844],
  'laas-tracking.webp': [848, 480],
};
let projectNotes = {};
try { projectNotes = JSON.parse(document.querySelector('#project-preview-data')?.textContent || '{}'); } catch {}
const dialog = document.querySelector('#object-dialog');
const stage = document.querySelector('.office-stage');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let opener = null;
let origin = null;
let activeAnimations = [];
let generation = 0;
let closing = false;

function escapeText(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
}

function imageMarkup(preview) {
  if (!preview.image) return '';
  const [width, height] = dimensions[preview.image];
  return `<img src="/assets/${preview.image}" width="${width}" height="${height}" alt="${escapeText(preview.alt)}" decoding="async">`;
}

function artifactMarkup(preview) {
  const image = imageMarkup(preview);
  if (preview.artifact === 'notebook') {
    return `<div class="pickup-notebook-left"><span>FIELD NOTES</span><h3>What can<br>video tell us?</h3><p>Laas<br>Detections, tracks<br>& open questions.</p></div><div class="pickup-notebook-right">${image}<span>Local research output</span></div>`;
  }
  if (preview.artifact === 'folder') {
    return '<span class="pickup-folder-tab">SELECTED WORK</span><div class="pickup-folder-sheet"><span>On My Table</span><h3>The project files.</h3><p>NovaLens · Atlas · Digital Twin<br>TradeOS · Forma · Dala<br>AceTech eRequisitions · Folio · Laas</p></div>';
  }
  if (image) return image;
  return `<span class="pickup-paper-kicker">ON MY TABLE</span><h3>${escapeText(preview.name)}</h3><span class="pickup-paper-signature">Anotida Dzinotyiwei</span>`;
}

function renderPreview(preview, projectId) {
  const notes = projectNotes[projectId];
  const visual = preview.document
    ? `<div class="pickup-artifact artifact-cv"><iframe src="/assets/anotida-dzinotyiwei-cv.pdf#view=FitH" title="Anotida Dzinotyiwei’s CV preview" loading="lazy"></iframe></div><p class="pickup-caption">A quick look at my supplied CV. Scroll inside the document to read; open or download the PDF for the full-page view.</p>`
    : `<div class="pickup-artifact artifact-${preview.artifact}">${artifactMarkup(preview)}</div>${preview.caption ? `<p class="pickup-caption">${escapeText(preview.caption)}</p>` : ''}`;
  document.querySelector('#dialog-content').innerHTML = `
    <div class="pickup-layout${preview.document ? ' pickup-layout-cv' : ''}">
      <div class="pickup-visual${preview.document ? ' pickup-visual-cv' : ''}">${visual}</div>
      <div class="pickup-copy${preview.document ? ' pickup-copy-cv' : ''}">
        <p class="small">From my table</p>
        <h2 id="dialog-title">${escapeText(preview.name)}</h2>
        <p class="pickup-description" id="pickup-description">${escapeText(notes?.summary || preview.text)}</p>
        ${notes ? `<dl class="pickup-facts"><div><dt>My part</dt><dd>${escapeText(notes.role)}</dd></div><div><dt>Where it stands</dt><dd>${escapeText(notes.status)}</dd></div></dl>` : ''}
        <div class="pickup-actions">
          <a class="button" href="${preview.url}">${escapeText(preview.cta || 'Open the story')} <span aria-hidden="true">↗</span></a>
          ${preview.artifact==='phone'?'<a class="text-link pickup-related" href="/work/dala/">Also on the iPhone: Dala ↗</a>':''}
          ${preview.document ? '<a class="text-link modal-open-pdf" href="/assets/anotida-dzinotyiwei-cv.pdf" target="_blank" rel="noopener">Open full PDF ↗</a>' : ''}
          ${preview.download ? '<a class="text-link modal-download" href="/assets/anotida-dzinotyiwei-cv.pdf" download>Download CV PDF ↓</a>' : ''}
        </div>
      </div>
    </div>`;
}

function measureOrigin(element) {
  const detail = { id: element.dataset.project, rect: null };
  stage?.dispatchEvent(new CustomEvent('office:measure-object', { detail }));
  const measured = detail.rect || element.getBoundingClientRect();
  return { left: measured.left, top: measured.top, width: Math.max(12, measured.width), height: Math.max(12, measured.height) };
}

function transformToOrigin(rect) {
  const scale = Math.max(.08, Math.min(.95, origin.width / rect.width, origin.height / rect.height));
  const x = origin.left + origin.width / 2 - rect.left - rect.width / 2;
  const y = origin.top + origin.height / 2 - rect.top - rect.height / 2;
  const tilt = dialog.dataset.artifact === 'screen' ? 6 : dialog.dataset.artifact === 'cv' ? 2 : 38;
  return `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotateX(${tilt}deg) rotateY(-9deg) rotateZ(-3deg)`;
}

function cancelAnimations() {
  for (const animation of activeAnimations) animation.cancel();
  activeAnimations = [];
}

function animate(element, frames, options) {
  const animation = element.animate(frames, { fill: 'both', ...options });
  activeAnimations.push(animation);
  return animation;
}

function openPreview(element) {
  const preview = previews[element.dataset.project];
  if (!preview) return;
  generation += 1;
  closing = false;
  cancelAnimations();
  opener?.classList.remove('is-picked-up');
  opener = element;
  opener.classList.add('is-picked-up');
  origin = measureOrigin(element);
  dialog.classList.remove('is-closing');
  dialog.dataset.artifact = preview.artifact;
  renderPreview(preview, element.dataset.project);
  dialog.setAttribute('aria-describedby', 'pickup-description');
  dialog.scrollTop = 0;
  stage?.dispatchEvent(new CustomEvent('office:pickup', { detail: { id: element.dataset.project } }));
  if (!dialog.open) dialog.showModal();
  dialog.querySelector('.dialog-close').focus({ preventScroll: true });
  if (reducedMotion.matches || !Element.prototype.animate) return;

  const artifact = dialog.querySelector('.pickup-artifact');
  const rect = artifact.getBoundingClientRect();
  animate(artifact, [
    { transform: transformToOrigin(rect), opacity: .35 },
    { transform: 'translate3d(0, 0, 0) scale(1) rotateX(0deg) rotateY(0deg) rotateZ(0deg)', opacity: 1 },
  ], { duration: 500, easing: 'cubic-bezier(.16, 1, .3, 1)' });

  dialog.querySelectorAll('.pickup-copy > *, .pickup-caption').forEach((item, index) => {
    animate(item, [
      { opacity: 0, transform: 'translateY(14px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], { duration: 320, delay: 110 + index * 35, easing: 'cubic-bezier(.2, .7, .2, 1)' });
  });
}

async function closePreview() {
  if (!dialog.open || closing) return;
  closing = true;
  const token = ++generation;
  if (reducedMotion.matches || !Element.prototype.animate) {
    dialog.close();
    return;
  }
  const artifact = dialog.querySelector('.pickup-artifact');
  const current = { transform: getComputedStyle(artifact).transform, opacity: getComputedStyle(artifact).opacity };
  const copySnapshots = [...dialog.querySelectorAll('.pickup-copy > *, .pickup-caption')].map(item => [item, getComputedStyle(item).opacity]);
  cancelAnimations();
  for (const [item, opacity] of copySnapshots) item.style.opacity = opacity;
  // Measure its resting position after cancelling an interrupted opening animation.
  const rect = artifact.getBoundingClientRect();
  if (opener?.isConnected) origin = measureOrigin(opener);
  dialog.classList.add('is-closing');
  const departure = animate(artifact, [current, { transform: transformToOrigin(rect), opacity: 0 }], {
    duration: 260, easing: 'cubic-bezier(.4, 0, .6, 1)',
  });
  dialog.querySelectorAll('.pickup-copy, .pickup-caption').forEach(item => {
    animate(item, [{ opacity: getComputedStyle(item).opacity }, { opacity: 0 }], { duration: 130 });
  });
  try { await departure.finished; } catch { return; }
  if (token === generation && dialog.open) dialog.close();
}

if (dialog && typeof dialog.showModal === 'function') {
  document.querySelectorAll('[data-project]').forEach(element => {
    element.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      if (!previews[element.dataset.project]) return;
      event.preventDefault();
      openPreview(element);
    });
  });
  dialog.querySelector('.dialog-close').addEventListener('click', closePreview);
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    closePreview();
  });
  dialog.addEventListener('click', event => {
    // The native dialog fills the viewport so the artifact can travel freely.
    if (event.target === dialog || event.target.id === 'dialog-content' || event.target.classList.contains('pickup-layout')) closePreview();
  });
  dialog.addEventListener('close', () => {
    generation += 1;
    closing = false;
    cancelAnimations();
    dialog.classList.remove('is-closing');
    opener?.classList.remove('is-picked-up');
    opener?.focus({ preventScroll: true });
  });
  reducedMotion.addEventListener('change', () => {
    cancelAnimations();
    if (closing && dialog.open) dialog.close();
  });
}
