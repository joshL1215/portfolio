export const data = {
    intro: [
        "Hi I'm Josh, this is my website",
        "I like to build and learn about software",
        "I was originally studying to become an accountant but then I unexpectedly discovered that I had a passion for CS in the middle of it",
        "On my site you will find my projects, experience and some technical, sometimes maybe non-technical, writing",
    ],
    projects: [
        {
            id: "GPU-accelerated Vector Store",
            title: "vectorDB",
            tagline: "Vector database with GPU accelerated semantic search",
            github: "https://github.com/joshL1215/vectorDB",
            body: [
                "A custom vector database written in C++, Rust, and CUDA",
                "Handwritten CUDA kernels, specifically optimized for RAG workloads (low top-k cosine similarity search with WarpSelect)",
                "C++ engine managing CPU + GPU memory and harnessing kernels on behalf of top level Rust FFI layers",
            ],
            stack: ["C++", "CUDA", "Rust"],
        },
        {
            id: "k8s-like",
            title: "k8s-like",
            tagline: "Kubernetes-like container orchestrator",
            github: "https://github.com/joshL1215/k8s-like",
            body: [
                "A lightweight and educational reimplementation of Kubernetes with many of its core components",
            ],
            stack: ["Go", "gRPC"],
        },
        {
            id: "ephemeral",
            title: "ephemeral",
            tagline: "Agentic compute workload manager",
            github: "https://github.com/joshL1215/ephemeral",
            body: [
                "Experimental infra project built at HackTech 2026 (Caltech)",
                "An LLM reads agent logs and predictively provisions compute sandboxes likely to be requested by the agent in the future",
                "Sandboxes are Docker containers secured with memory + CPU quotas and kernel protection with gVisor",
            ],
            stack: ["Python", "Docker", "gVisor", "React", "TypeScript"],
        },
        {
            id: "heyhost",
            title: "heyhost | 1st Place Grand Prize @ SB Hacks 2026",
            tagline: "Voice agent augmented podcasts",
            github: "https://github.com/nacsoprog/HeyHost-SBHacksXII",
            body: [
                "A platform that makes podcasts more interactive using AI voice agents",
                "Allows conversation with podcast hosts in the form of an AI voice agent with tool calling capability (ex. clipping, replay, search)",
            ],
            stack: ["TypeScript", "React", "Python", "ElevenLabs", "Whisper"],
        },
        {
            id: "influely",
            title: "influely | Track Winner @ Unwrapathon 2025",
            tagline: "Product analytics platform",
            github: "https://github.com/joshL1215/youtube-analytics-unwrap",
            body: [
                "We won the Most Powerful Insights track with this data aggregation and analytics tool.",
                "It takes videos and comments from YouTube to derive product and influencer marketing insights for businesses.",
            ],
            stack: ["TypeScript", "React", "Python", "FastAPI"],
        },
        {
            id: "deceitcode",
            title: "deceitcode",
            tagline: "LeetCode w/ Anti-LLM-Cheat",
            github: "https://github.com/joshL1215/DeceitCode",
            body: [
                "A LeetCode-like webapp built to resist AI-based cheating tools.",
                "Includes a custom code sandbox that runs user submissions in gVisor + Docker containers",
                "Uses prompts embedded in the website to disrupt LLM tools that use OCR or DOM-parsing.",
            ],
            stack: ["MERN", "TypeScript", "Go", "Docker", "gVisor"],
        },
    ],
    experience: [
        {
            id: "ziprecruiter",
            role: "Software Engineer Intern",
            org: "ZipRecruiter",
            dates: "June 2026 - Sep 2026",
            body: [
                "Working on the Recommendations team, mostly supporting machine learning work with internal tooling",
            ],
            stack: ["Go, gRPC, React, Athena/SQL"],
        },
        {
            id: "acm-unwrap",
            role: "Software Developer",
            org: "Unwrap.ai x ACM Industry",
            dates: "Jan 2026 - Present",
            body: [
                "Working on data engineering project in partnership with Unwrap.ai",
                "Mostly responsible for data and cloud infrastructure components",
            ],
            stack: ["Python", "GCP", "Terraform"],
        },
        {
            id: "gogaucho",
            role: "Software Developer",
            org: "GoGaucho",
            dates: "Sept 2025 - Present",
            body: [
                "Maintaining and developing a 10,000+ monthly active user campus app",
                "Also developing some internal tools for student government",
            ],
            stack: ["Vue", "JavaScript", "Firebase"],
        },
        {
            id: "ipmd",
            role: "Software Engineer Intern",
            org: "IPMD, Inc.",
            dates: "June 2025 - November 2025",
            body: [
                "Built agentic tax filing software on the backend",
                "Worked on some DevOps and cloud infrastructure tasks",
            ],
            stack: [
                "Python",
                "Flask",
                "LangChain",
                "LangGraph",
                "LLMs",
                "RAG",
                "Azure",
            ],
        },
    ],
};

export const SECTIONS = [
    { id: "home", label: "Home" },
    { id: "projects", label: "Projects" },
    { id: "experience", label: "Experience" },
];

export const profile = [
    ["school", "UC Santa Barbara", null],
    ["github", "github.com/joshL1215", "https://github.com/joshL1215"],
    [
        "linkedin",
        "linkedin.com/in/joshlee1215",
        "https://www.linkedin.com/in/joshlee1215/",
    ],
];
