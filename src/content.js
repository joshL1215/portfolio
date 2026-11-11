// All site content lives here. Each section is a menu category, in menu order.
//   entries:    a list (experience, projects); each entry shows up in the panel
//   paragraphs: plain text section (about)
// Entry fields:
//   title, meta   always shown in the list (meta = the little caption)
//   desc          short summary; used as the write-up until `body` exists
//   body          full write-up shown when the entry is clicked: a list of paragraphs,
//                 a line starting with "## " becomes a subheading
//   links         [{ label, url }] shown under the write-up's title
//   drops         models dropped onto the stage when it's opened (ids from MODELS in
//                 main.js; repeat an id to drop several). Sections can have drops too.

// always shown in the bottom-right corner
export const socials = [
  { label: "github", url: "https://github.com/joshL1215" },
  { label: "linkedin", url: "https://www.linkedin.com/in/joshlee1215/" },
];

export const sections = [
  {
    id: "about",
    label: "about",
    drops: ["bridge", "trident", "cup"],
    paragraphs: [
      "Math & CS student at UCSD",
      "Hi, I'm Josh - welcome to my site. I'm currently an undergrad studying Math and Computer Science at UC San Diego. I previously attended UC Santa Barbara, where I actually pivoted from business/accounting to CS after discovering a strong passion for software.",
      "This site is WIP"
    ],
  },
  {
    id: "work",
    label: "experience",
    entries: [
      { id: "ziprecruiter", title: "ZipRecruiter", meta: "SWE Intern · 06.2026 – 09.2026", drops: ["chair"] },
      { id: "unwrap", title: "Unwrap.ai x ACM", meta: "Software Dev · 01.2026 – now", drops: ["tbd"] },
      { id: "gogaucho", title: "GoGaucho", meta: "Software Dev · 09.2025 – now", drops: ["tbd"] },
      { id: "ipmd", title: "IPMD, Inc.", meta: "SWE Intern · 06.2025 – 11.2025", drops: ["tbd"] },
    ],
  },
  {
    id: "projects",
    label: "projects",
    entries: [
      {
        id: "warpdb",
        title: "warpDB",
        meta: "GPU vector store",
        desc: "Vector store with a Rust API, a C++ storage engine, and a CUDA kernel for cosine-similarity top-k search.",
        links: [{ label: "github", url: "https://github.com/joshL1215/warpDB" }],
        drops: ["gpu", "embedding", "graph"],
      },
      {
        id: "k8s-like",
        title: "k8s-like",
        meta: "container orchestrator",
        desc: "Kubernetes core functionalities reimplemented from scratch",
        links: [{ label: "github", url: "https://github.com/joshL1215/k8s-like" }],
        drops: ["container", "container"],
      },
      {
        id: "glob",
        title: "glob",
        meta: "homelab",
        desc: "My old laptop turned into a VM cluster hypervisor running Kubernetes, Argo CD and Grafana, with its GPU exposed so I can run CUDA work from my MacBook.",
        links: [{ label: "github", url: "https://github.com/joshL1215/glob" }],
        drops: ["rack", "gpu", "container"],
      },
      {
        id: "heyhost",
        title: "heyhost",
        meta: "1st @ SB Hacks 2026",
        desc: "Talk back to podcasts: say \"hey host!\" to interrupt and ask a question, and the host answers in their own voice.",
        links: [{ label: "github", url: "https://github.com/nacsoprog/HeyHost-SBHacksXII" }],
        drops: ["trophy"],
      },
      {
        id: "influely",
        title: "influely",
        meta: "track winner @ Unwrapathon",
        desc: "Type in your product, and it finds relevant YouTube videos, then scrapes and categorizes their comments into insights.",
        links: [{ label: "github", url: "https://github.com/joshL1215/youtube-analytics-unwrap" }],
        drops: ["medal"],
      },
      {
        id: "deceitcode",
        title: "deceitcode",
        meta: "anti-LLM-cheat leetcode",
        desc: "LeetCode-style platform with its own Docker + gVisor code-judging sandbox, and anti-LLM prompts hidden throughout to trip up AI cheating.",
        links: [{ label: "github", url: "https://github.com/joshL1215/DeceitCode" }],
        drops: ["tbd"],
      },
    ],
  },
];
