export function el(tag, opts = {}, children = []) {
    const e = document.createElement(tag);
    if (opts.class) e.className = opts.class;
    if (opts.html !== undefined) e.innerHTML = opts.html;
    if (opts.text !== undefined) e.textContent = opts.text;
    if (opts.onClick) e.addEventListener("click", opts.onClick);
    if (opts.href) e.href = opts.href;
    if (opts.target) e.target = opts.target;
    if (opts.id) e.id = opts.id;
    if (opts.style) Object.assign(e.style, opts.style);
    for (const c of children) if (c) e.appendChild(c);
    return e;
}

export function setStatus(which, text) {
    const e = document.getElementById(which + "-status");
    if (e) e.textContent = text;
}
