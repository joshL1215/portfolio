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
    content.appendChild(doc);
}

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
