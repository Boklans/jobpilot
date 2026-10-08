import { CandidateProfile, JobListing, ApplicationTrackerItem } from "@/types";

export const sampleCandidateProfiles: CandidateProfile[] = [
  {
    id: "profile-1",
    fullName: "Ігор Бойко",
    title: "Senior Full-Stack / React Native Developer",
    summary: "Senior Software Engineer із 6+ роками комерційного досвіду розробки високонавантажених web та mobile додатків на TypeScript, React, React Native та Node.js.",
    yearsOfExperience: 6,
    skills: [
      "React Native",
      "TypeScript",
      "React",
      "Node.js",
      "Expo",
      "Next.js",
      "PostgreSQL",
      "REST APIs",
      "GraphQL",
      "Tailwind CSS",
      "Docker",
      "Git"
    ],
    experiences: [
      {
        id: "exp-1",
        company: "TechScale Solutions",
        position: "Lead Mobile / Frontend Engineer",
        period: "2022 - Present",
        description: [
          "Архітектура та запуск кросплатформеного додатку на React Native / Expo з аудиторією 250k+ користувачів.",
          "Оптимізація продуктивності рендерингу додатку, скорочення часу запуску на 40%.",
          "Менторинг команди з 4 Middle інженерів та впровадження стандарту типізації TypeScript."
        ],
        technologies: ["React Native", "TypeScript", "Expo", "Node.js", "PostgreSQL"]
      },
      {
        id: "exp-2",
        company: "FinTech Innovation Lab",
        position: "Senior Frontend Developer",
        period: "2020 - 2022",
        description: [
          "Розробка веб-платформи банкінгу на React, Next.js та Tailwind CSS.",
          "Інтеграція платіжних шлюзів через REST та GraphQL API."
        ],
        technologies: ["React", "Next.js", "TypeScript", "REST APIs", "GraphQL"]
      }
    ]
  },
  {
    id: "profile-2",
    fullName: "Олексій Коваленко",
    title: "Senior Backend / Node.js & Go Engineer",
    summary: "Senior Backend Engineer із 7+ роками комерційного досвіду розробки високонавантажених мікросервісів, платіжних систем та баз даних на Node.js, NestJS, Go та PostgreSQL.",
    yearsOfExperience: 7,
    skills: [
      "Node.js",
      "NestJS",
      "Go",
      "Golang",
      "PostgreSQL",
      "Redis",
      "RabbitMQ",
      "Docker",
      "Kubernetes",
      "AWS",
      "Microservices",
      "CI/CD",
      "REST APIs",
      "TypeScript"
    ],
    experiences: [
      {
        id: "exp-2-1",
        company: "FinTech Payments Global",
        position: "Lead Backend Engineer",
        period: "2022 - Present",
        description: [
          "Розробка ядра платіжного шлюзу на Node.js / NestJS та PostgreSQL з пропускною здатністю 1500+ RPS.",
          "Впровадження розподіленого кешування через Redis та черг на RabbitMQ.",
          "Налаштування автоматизованих пайплайнів CI/CD через GitHub Actions та деплой у Kubernetes."
        ],
        technologies: ["Node.js", "NestJS", "PostgreSQL", "Redis", "Docker", "Kubernetes"]
      }
    ]
  }
];

export const defaultCandidateProfile: CandidateProfile = sampleCandidateProfiles[0];

export const sampleJobs: JobListing[] = [
  {
    id: "job-1",
    title: "Senior React Native Developer",
    company: "Nordic FinTech",
    location: "Remote · Europe",
    salary: "$4,500 - $5,500",
    sourceUrl: "https://djinni.co/jobs/example-react-native",
    createdAt: new Date().toISOString(),
    rawDescription: `We are looking for an experienced Senior React Native Developer to join our core product team.
    
Requirements:
- 5+ years of software development experience
- Strong proficiency in React Native, TypeScript, and Expo
- Experience with REST APIs, state management, and offline-first mobile architecture
- Nice to have: AWS Cloud knowledge, CI/CD pipeline automation, Microservices
- Fluent English (B2+)`
  },
  {
    id: "job-2",
    title: "Senior Full-Stack Engineer (React / Node.js)",
    company: "SaaS Rocket",
    location: "Remote · Worldwide",
    salary: "$5,000 - $6,500",
    sourceUrl: "https://jobs.dou.ua/example-fullstack",
    createdAt: new Date().toISOString(),
    rawDescription: `Join our team to build next-generation analytics platform.
    
What you will do:
- Develop modern responsive Web applications using Next.js, React, TypeScript and Tailwind
- Design backend services with Node.js and PostgreSQL
- Requirements: 5+ years experience, solid Docker & CI/CD background, AWS experience is a plus.`
  }
];

export const initialApplications: ApplicationTrackerItem[] = [
  {
    id: "app-1",
    job: sampleJobs[0],
    status: "interview",
    appliedDate: "2026-10-02",
    interviewDate: "15 Жовтня, 15:00",
    contactPerson: "Олена (HR Lead)",
    salaryTarget: "$5,000",
    matchScore: 92,
    notes: "HR скринінг пройдено успішно. Технічне інтерв'ю призначено на п'ятницю.",
    updatedAt: new Date().toISOString()
  },
  {
    id: "app-2",
    job: sampleJobs[1],
    status: "applied",
    appliedDate: "2026-10-05",
    matchScore: 88,
    notes: "Надіслано адаптований Cover Letter через Djinni.",
    updatedAt: new Date().toISOString()
  }
];

