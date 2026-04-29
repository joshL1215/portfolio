export const data = {
    intro: [
        "Hi, I like to build and learn about software. I also used to be an accounting major but I switched after unexpectedly discovering a passion for tech. You'll find my projects and experience among other interesting things on this site."
    ],
    projects: [
        {
            id: "heyhost",
            title: "HeyHost",
            tagline: "1st Place Grand Prize @ SB Hacks XII",
            github: "https://github.com/nacsoprog/HeyHost-SBHacksXII",
            body: [
                "We won the 1st place grand prize at SB Hacks XII with this AI-voice-agent integrated podcast platform.",
                "It allows you to conversate with podcast hosts as AI agents with the ability to manipulate the listening experience based on what you say."
            ],
            stack: ["TypeScript", "React", "Python", "FastAPI", "ElevenLabs", "Whisper"]
        },
        {
            id: "k8s-lite",
            title: "Model Kubernetes Engine",
            tagline: "lightweight k8s-from-scratch in Go",
            github: "https://github.com/joshL1215/k8s-lite",
            body: [
                "Lightweight and educational version of Kubernetes that I built in Go.",
                "It simulates a lot of the core functionality of Kubernetes."
            ],
            stack: ["Go"]
        },
        {
            id: "influely",
            title: "Influely (Most Powerful Insights @ Unwrapathon 2025)",
            tagline: "Youtube NLP Analytics Platform",
            github: "https://github.com/joshL1215/youtube-analytics-unwrap",
            body: [
                "We won the Most Powerful Insights track with this data aggregation and analytics tool.",
                "It takes videos and comments from YouTube to derive product and influencer marketing insights for businesses."
            ],
            stack: ["TypeScript", "React", "Python", "FastAPI"]
        },
        {
            id: "deceitcode",
            title: "DeceitCode",
            tagline: "LeetCode w/ Anti-LLM-Cheat",
            github: "https://github.com/joshL1215/DeceitCode",
            body: [
                "A LeetCode-like webapp built to resist AI-based cheating tools.",
                "Includes a custom code sandbox that runs user submissions in gVisor + Docker containers",
                "Uses prompts embedded in the website to disrupt LLM tools that use OCR or DOM-parsing."
            ],
            stack: ["MERN", "TypeScript", "Go", "Docker", "gVisor"]
        },
    ],
    experience: [
        {
            id: "ziprecruiter",
            role: "Software Engineer Intern",
            org: "ZipRecruiter",
            dates: "Incoming June 2026",
            body: ["Will be joining a team working on clickstream data infrastructure."],
            stack: ["TBD"]
        },
        {
            id: "acm-unwrap",
            role: "Software Developer",
            org: "Unwrap.ai x ACM Industry",
            dates: "Jan 2026 - Present",
            body: [
                "Working on data engineering project in partnership with Unwrap.ai",
                "Mostly responsible for data and cloud infrastructure components"
            ],
            stack: ["Python", "GCP", "Terraform"]
        },
        {
            id: "gogaucho",
            role: "Software Developer",
            org: "GoGaucho",
            dates: "Sept 2025 - Present",
            body: [
                "Maintaining and developing a 10,000+ monthly active user campus app",
                "Also developing some internal tools for student government"
            ],
            stack: ["Vue", "JavaScript", "Firebase"]
        },
        {
            id: "ipmd",
            role: "Software Engineering Intern",
            org: "IPMD, Inc.",
            dates: "June 2025 - November 2025",
            body: [
                "Built agentic tax filing software on the backend",
                "Worked on some DevOps and cloud infrastructure tasks"
            ],
            stack: ["Python", "Flask", "LangChain", "LangGraph", "LLMs", "RAG", "Azure"]
        }
    ]
};

export const SECTIONS = [
    { id: "home", label: "Home" },
    { id: "projects", label: "Projects" },
    { id: "experience", label: "Experience" }
];

export const profile = [
    ["school", "UC Santa Barbara", null],
    ["github", "github.com/joshL1215", "https://github.com/joshL1215"],
    ["linkedin", "linkedin.com/in/joshlee1215", "https://www.linkedin.com/in/joshlee1215/"]
];
