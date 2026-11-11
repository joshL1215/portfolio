import { sections, socials } from "./content.js";

// Page states:
//   home          name in its big spot with the category menu under it
//   <section id>  name + menu shrink into the top-right corner, and the section's
//                 panel (scrollable) fills the right side below them
//
// Clicking the name: on home it calls onNameClickHome (clears the pile);
// anywhere else it goes back home. Escape also goes home.

const MOVE_MS = 650;

export function initUI({ onNameClickHome, onReadingChange = () => {}, onDrops = () => {} }) {
  const brand = document.querySelector("#brand");
  const name = document.querySelector("#name");
  const menu = document.querySelector("#menu");
  const panel = document.querySelector("#panel");

  let state = "home";

  for (const section of sections) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = section.label;
    button.dataset.section = section.id;
    button.addEventListener("click", () => {
      if (state === section.id && detail) closeDetail();
      else setState(state === section.id ? "home" : section.id);
    });
    menu.append(button);
  }

  const socialsEl = document.querySelector("#socials");
  for (const { label, url } of socials) {
    const a = document.createElement("a");
    a.href = url;
    a.textContent = label;
    a.target = "_blank";
    a.rel = "noopener";
    socialsEl.append(a);
  }

  name.addEventListener("click", () => {
    if (state === "home") onNameClickHome();
    else setState("home");
  });
  addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (detail) closeDetail(); // write-up → back to the list first
    else if (state !== "home") setState("home");
  });

  // UI clicks shouldn't also drop objects on the stage
  for (const el of document.querySelectorAll("[data-ui]")) {
    el.addEventListener("pointerdown", (e) => e.stopPropagation());
  }

  // ---------- panel views ----------
  // list view: every entry's title + caption. Clicking one with a write-up swaps the
  // list out for that entry's detail view (the panel also widens for reading room).
  let detail = null; // id of the entry whose write-up is open, or null

  function renderPanel(sectionId) {
    const section = sections.find((s) => s.id === sectionId);
    panel.replaceChildren();
    if (section.paragraphs) {
      for (const text of section.paragraphs) {
        const p = document.createElement("p");
        p.textContent = text;
        panel.append(p);
      }
      panel.scrollTop = 0;
      return;
    }
    const list = document.createElement("ul");
    for (const entry of section.entries) {
      const li = document.createElement("li");
      const head = document.createElement("button");
      head.type = "button";
      head.className = "entry-head";
      head.append(span("entry-title", entry.title), span("entry-meta", entry.meta));
      head.addEventListener("click", () => openDetail(section, entry));
      li.append(head);
      list.append(li);
    }
    panel.append(list);
    panel.scrollTop = 0;
  }

  function renderDetail(section, entry) {
    panel.replaceChildren();
    const view = document.createElement("article");
    view.className = "detail";

    const back = document.createElement("button");
    back.type = "button";
    back.className = "detail-back";
    back.textContent = `← ${section.label}`;
    back.addEventListener("click", closeDetail);

    const title = document.createElement("h2");
    title.textContent = entry.title;
    view.append(back, title, span("entry-meta", entry.meta));

    if (entry.links?.length) {
      const links = document.createElement("div");
      links.className = "detail-links";
      for (const { label, url } of entry.links) {
        const a = document.createElement("a");
        a.href = url;
        a.textContent = label;
        a.target = "_blank";
        a.rel = "noopener";
        links.append(a);
      }
      view.append(links);
    }

    // body: list of paragraphs; a line starting with "## " is a subheading
    const body = document.createElement("div");
    body.className = "detail-body";
    for (const text of entry.body || (entry.desc ? [entry.desc] : [])) {
      const heading = text.startsWith("## ");
      const el = document.createElement(heading ? "h3" : "p");
      el.textContent = heading ? text.slice(3) : text;
      body.append(el);
    }
    view.append(body);
    panel.append(view);
    panel.scrollTop = 0;
  }

  // fade/slide the current view out, swap content, slide the new one in
  function swapView(render, dir) {
    const old = panel.firstElementChild;
    const out = old
      ? old.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateX(${-24 * dir}px)` }],
          { duration: 160, easing: "ease-in", fill: "forwards" }).finished
      : Promise.resolve();
    out.then(() => {
      render();
      panel.firstElementChild?.animate(
        [{ opacity: 0, transform: `translateX(${24 * dir}px)` }, { opacity: 1, transform: "none" }],
        { duration: 260, easing: "ease-out" }
      );
    });
  }

  function openDetail(section, entry) {
    detail = entry.id;
    panel.classList.add("wide");
    onReadingChange(true);
    if (entry.drops) onDrops(`${section.id}/${entry.id}`, entry.drops);
    swapView(() => renderDetail(section, entry), 1);
  }

  function closeDetail() {
    if (!detail) return;
    detail = null;
    panel.classList.remove("wide");
    onReadingChange(false);
    swapView(() => renderPanel(state), -1);
  }

  function span(className, text) {
    const el = document.createElement("span");
    el.className = className;
    el.textContent = text;
    return el;
  }

  function setState(next) {
    if (next === state) return;
    const wasHome = state === "home";
    const goingHome = next === "home";
    state = next;
    if (detail) onReadingChange(false);
    detail = null;
    panel.classList.remove("wide");

    for (const b of menu.children) b.classList.toggle("active", b.dataset.section === next);

    if (goingHome) {
      panel.classList.remove("open");
    } else {
      renderPanel(next);
      panel.classList.add("open");
      const section = sections.find((s) => s.id === next);
      if (section.drops) onDrops(section.id, section.drops);
    }

    // only the name block moves when switching between home and a section
    if (wasHome !== goingHome) moveBrand(() => document.body.classList.toggle("in-section", !goingHome));
  }

  // FLIP: measure where the name and menu are, switch layouts, measure again, then
  // animate each from its old spot/size to the new one so it glides instead of jumping.
  // The name, menu and links are done separately because only the name changes size.
  function moveBrand(switchLayout) {
    const parts = [name, menu, socialsEl];
    const first = parts.map((el) => el.getBoundingClientRect());
    switchLayout();
    parts.forEach((el, i) => {
      const last = el.getBoundingClientRect();
      const dx = first[i].left - last.left;
      const dy = first[i].top - last.top;
      const s = first[i].height / last.height;
      el.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${s})` },
          { transform: "translate(0, 0) scale(1)" },
        ],
        { duration: MOVE_MS, easing: "cubic-bezier(0.65, 0, 0.25, 1)" }
      );
    });
  }

  return { brand };
}
