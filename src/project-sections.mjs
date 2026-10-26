const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export function caseContents(project) {
  const items=[['overview','Overview']];
  if(project.steps.length)items.push(['journey','The journey']);
  if(project.decisions.length)items.push(['decisions','Decisions']);
  if(project.engineering?.length)items.push(['engineering','Engineering']);
  items.push(['status','Where it stands']);
  return `<nav class="case-contents" aria-label="Inside this case study">${items.map(([id,label])=>`<a href="#${id}">${label}</a>`).join('')}</nav>`;
}
export function contextSection(project) {
  if(!project.context)return '';
  return `<section class="story case-context"><div><p class="small">The idea</p><h2>A little context.</h2></div><div>${project.context.map(p=>`<p>${escape(p)}</p>`).join('')}<h3>My part in the work</h3><p>${escape(project.contribution)}</p><ul class="case-capabilities" aria-label="Areas of work">${project.capabilities.map(c=>`<li>${escape(c)}</li>`).join('')}</ul></div></section>`;
}
export function gallerySection(project) {
  if(!project.gallery?.length)return '';
  return `<section class="story case-gallery ${project.slug==='atlas'?'case-gallery-mobile':''}" aria-label="More of the project">${project.gallery.map(item=>`<figure><a href="/assets/${item.src}" aria-label="Open full-size ${escape(item.alt)}"><img src="/assets/${item.src}" width="${item.width}" height="${item.height}" alt="${escape(item.alt)}" loading="lazy" decoding="async"></a><figcaption>${escape(item.caption)} <a href="/assets/${item.src}">View capture ↗</a></figcaption></figure>`).join('')}</section>`;
}
export function engineeringSection(project) {
  if(!project.engineering?.length)return '';
  return `<section class="story engineering-notes" id="engineering"><div><p class="small">For a closer look</p><h2>Under the surface.</h2></div><div>${project.engineering.map(([heading,body])=>`<details><summary>${escape(heading)}<span aria-hidden="true">+</span></summary><p>${escape(body)}</p></details>`).join('')}</div></section>`;
}
export function reflectionSection(project) {
  return project.reflection?`<section class="story case-reflection"><p class="small">A thought to take forward</p><p>${escape(project.reflection)}</p></section>`:'';
}
