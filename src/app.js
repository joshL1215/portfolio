import { el, setStatus } from './dom.js';
import { data, SECTIONS } from './data.js';
import {
    renderHome,
    renderHomePreview,
    renderProjectsList,
    renderExperienceList,
    renderPreviewPlaceholder,
    renderProjectDetail,
    renderExperienceDetail
} from './sections.js';

const state = {
    section: "home",
    selectedKind: null,
    selectedId: null
};

function renderTabs() {
    const tabs = document.getElementById("left-tabs");
    tabs.innerHTML = "";
    SECTIONS.forEach(s => {
        const b = el("button", {
            class: "tab" + (state.section === s.id ? " active" : ""),
            text: s.label,
            onClick: () => setSection(s.id)
        });
        tabs.appendChild(b);
    });
}

function renderLeft() {
    renderTabs();
    const content = document.getElementById("left-content");
    content.innerHTML = "";

    if (state.section === "home") {
        renderHome(content);
    } else if (state.section === "projects") {
        renderProjectsList(content, state, selectItem);
    } else if (state.section === "experience") {
        renderExperienceList(content, state, selectItem);
    }
    setStatus("left", state.section);
}

function renderRightDefault() {
    const content = document.getElementById("right-content");
    content.innerHTML = "";
    if (state.section === "home") {
        renderHomePreview(content);
        setStatus("right", "about");
    } else {
        renderPreviewPlaceholder(content);
        setStatus("right", "idle");
    }
}

function renderRightDetail(kind, id) {
    const content = document.getElementById("right-content");
    content.innerHTML = "";

    const item = kind === "projects"
        ? data.projects.find(p => p.id === id)
        : data.experience.find(x => x.id === id);
    if (!item) { renderRightDefault(); return; }

    if (kind === "projects") {
        renderProjectDetail(content, item);
    } else {
        renderExperienceDetail(content, item);
    }
    setStatus("right", `${kind}/${item.id}`);
}

function setSection(s) {
    state.section = s;
    state.selectedKind = null;
    state.selectedId = null;
    renderLeft();
    renderRightDefault();
}

function selectItem(kind, id) {
    state.selectedKind = kind;
    state.selectedId = id;
    renderLeft();
    renderRightDetail(kind, id);
}

export function init() {
    renderLeft();
    renderRightDefault();
}
