import { el } from './dom.js';
import { data, profile } from './data.js';

export function renderHome(content) {
    content.appendChild(el("h1", { text: "Joshua Lee" }));
    content.appendChild(el("p", { class: "doc meta", text: "CS @ UCSB" }));

    const doc = el("div", { class: "doc home" });
    const kv = el("div", {});
    profile.forEach(([k, v, href]) => {
        const row = el("div", { class: "kv" });
        row.appendChild(el("div", { class: "kv-label", text: k }));
        if (href) {
            const val = el("div", {});
            val.appendChild(el("a", { class: "ext", href, target: "_blank", text: v }));
            row.appendChild(val);
        } else {
            row.appendChild(el("div", { text: v }));
        }
        kv.appendChild(row);
    });
    doc.appendChild(kv);
    content.appendChild(doc);
}

function renderList(content, title, items, kind, state, onSelect, headingFor) {
    content.appendChild(el("h1", { text: title }));
    items.forEach((item, i) => {
        const row = el("div", {
            class: "row" + (state.selectedKind === kind && state.selectedId === item.id ? " active" : ""),
            onClick: () => onSelect(kind, item.id)
        });
        row.appendChild(el("div", { class: "row-num", text: String(i + 1).padStart(2, "0") }));
        const body = el("div", { class: "row-body" });
        const titleEl = el("div", { class: "row-title" });
        const heading = headingFor(item);
        if (kind === "experience" && item.org) {
            titleEl.appendChild(document.createTextNode(`${item.role} — `));
            titleEl.appendChild(el("strong", { text: item.org }));
        } else {
            titleEl.textContent = heading;
        }
        body.appendChild(titleEl);
        body.appendChild(el("div", { class: "row-sub", text: item.tagline || item.dates }));
        row.appendChild(body);
        content.appendChild(row);
    });
}

export function renderProjectsList(content, state, onSelect) {
    renderList(content, "Projects", data.projects, "projects", state, onSelect, p => p.title);
}

export function renderExperienceList(content, state, onSelect) {
    renderList(content, "Experience", data.experience, "experience", state, onSelect,
        x => x.org ? `${x.role} — ${x.org}` : x.role);
}

export function renderPreviewPlaceholder(content) {
    const doc = el("div", { class: "doc" });
    doc.appendChild(el("h1", { text: "Preview" }));
    doc.appendChild(el("p", { class: "meta", text: "nothing selected" }));
    doc.appendChild(el("p", { text: "Select a project or experience entry on the left to read it here." }));

    const wrap = el("div", { class: "topo-wrap" });
    wrap.innerHTML = TOPO_SVG;
    doc.appendChild(wrap);

    content.appendChild(doc);
}

const TOPO_SVG = `
<svg class="topo" viewBox="0 0 360 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <marker id="topoarr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#1a1a1a"/>
    </marker>
  </defs>
  <g fill="none" stroke="#1a1a1a" stroke-width="1">
    <line class="e e-ab" x1="56" y1="78" x2="106" y2="46" marker-end="url(#topoarr)"/>
    <line class="e e-ac" x1="56" y1="86" x2="106" y2="118" marker-end="url(#topoarr)"/>
    <line class="e e-bd" x1="136" y1="46" x2="186" y2="78" marker-end="url(#topoarr)"/>
    <line class="e e-cd" x1="136" y1="118" x2="186" y2="86" marker-end="url(#topoarr)"/>
    <line class="e e-ce" x1="136" y1="124" x2="186" y2="156" marker-end="url(#topoarr)"/>
    <line class="e e-df" x1="216" y1="86" x2="266" y2="118" marker-end="url(#topoarr)"/>
    <line class="e e-ef" x1="216" y1="156" x2="266" y2="126" marker-end="url(#topoarr)"/>
  </g>
  <g fill="none" stroke="#1a1a1a" stroke-width="1">
    <line class="c c1" x1="76" y1="110" x2="94" y2="110" marker-end="url(#topoarr)"/>
    <line class="c c2" x1="126" y1="110" x2="144" y2="110" marker-end="url(#topoarr)"/>
    <line class="c c3" x1="176" y1="110" x2="194" y2="110" marker-end="url(#topoarr)"/>
    <line class="c c4" x1="226" y1="110" x2="244" y2="110" marker-end="url(#topoarr)"/>
    <line class="c c5" x1="276" y1="110" x2="294" y2="110" marker-end="url(#topoarr)"/>
  </g>
  <g class="topo-nodes">
    <g class="n n1"><circle cx="40" cy="84" r="14"/></g>
    <g class="n n2"><circle cx="120" cy="40" r="14"/></g>
    <g class="n n3"><circle cx="120" cy="124" r="14"/></g>
    <g class="n n4"><circle cx="200" cy="84" r="14"/></g>
    <g class="n n5"><circle cx="200" cy="162" r="14"/></g>
    <g class="n n6"><circle cx="280" cy="124" r="14"/></g>
  </g>
</svg>
`;

export function renderHomePreview(content) {
    content.appendChild(el("h1", { text: "About" }));
    content.appendChild(el("p", { class: "doc meta", text: "Josh Lee" }));
    const doc = el("div", { class: "doc about" });
    data.intro.forEach(line => doc.appendChild(el("p", { text: line })));
    content.appendChild(doc);
}

export function renderProjectDetail(content, item) {
    const doc = el("div", { class: "doc" });
    doc.appendChild(el("h1", { text: item.title }));
    doc.appendChild(el("p", { class: "meta", text: item.tagline }));

    doc.appendChild(el("h2", { text: "Overview" }));
    const ul = el("ul");
    item.body.forEach(b => ul.appendChild(el("li", { text: b })));
    doc.appendChild(ul);

    if (item.stack && item.stack.length) {
        doc.appendChild(el("h2", { text: "Stack" }));
        const tags = el("div");
        item.stack.forEach(s => tags.appendChild(el("span", { class: "tag", text: s })));
        doc.appendChild(tags);
    }

    if (item.github) {
        doc.appendChild(el("h2", { text: "Repository" }));
        doc.appendChild(el("p", {}, [
            el("a", { class: "ext", href: item.github, target: "_blank", text: item.github })
        ]));
    }
    content.appendChild(doc);
}

export function renderExperienceDetail(content, item) {
    const doc = el("div", { class: "doc" });
    if (item.org) {
        const h1 = el("h1");
        h1.appendChild(el("strong", { text: item.org }));
        doc.appendChild(h1);
        doc.appendChild(el("p", { class: "role", text: item.role }));
    } else {
        doc.appendChild(el("h1", { text: item.role }));
    }
    doc.appendChild(el("p", { class: "meta", text: item.dates }));

    doc.appendChild(el("h2", { text: "Summary" }));
    const ul = el("ul");
    item.body.forEach(b => ul.appendChild(el("li", { text: b })));
    doc.appendChild(ul);
    if (item.stack && item.stack.length) {
        doc.appendChild(el("h2", { text: "Stack" }));
        const tags = el("div");
        item.stack.forEach(s => tags.appendChild(el("span", { class: "tag", text: s })));
        doc.appendChild(tags);
    }
    content.appendChild(doc);
}
