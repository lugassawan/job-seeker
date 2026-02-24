interface TechSkill {
  name: string;
  pattern: RegExp;
}

export const TECH_SKILLS: TechSkill[] = [
  // Languages
  { name: "JavaScript", pattern: /\bjavascript\b|\bjs\b/i },
  { name: "TypeScript", pattern: /\btypescript\b|\bts\b/i },
  { name: "Python", pattern: /\bpython\b/i },
  { name: "Java", pattern: /\bjava\b(?!\s*script)/i },
  { name: "Go", pattern: /\bgolang\b|\bgo\b(?:\s+language|\s+developer|\s+engineer)?/i },
  { name: "Rust", pattern: /\brust\b/i },
  { name: "Ruby", pattern: /\bruby\b/i },
  { name: "Scala", pattern: /\bscala\b/i },
  { name: "Kotlin", pattern: /\bkotlin\b/i },
  { name: "Swift", pattern: /\bswift\b/i },
  { name: "PHP", pattern: /\bphp\b/i },
  { name: "C#", pattern: /\bc#\b|\bcsharp\b/i },
  { name: "C++", pattern: /\bc\+\+\b|\bcpp\b/i },
  { name: "Elixir", pattern: /\belixir\b/i },
  { name: "Clojure", pattern: /\bclojure\b/i },
  { name: "Haskell", pattern: /\bhaskell\b/i },

  // Frontend
  { name: "React", pattern: /\breact\b(?!\s*native)/i },
  { name: "Vue", pattern: /\bvue(?:\.js)?\b/i },
  { name: "Angular", pattern: /\bangular\b/i },
  { name: "Svelte", pattern: /\bsvelte\b/i },
  { name: "Next.js", pattern: /\bnext\.?js\b|\bnext\.js\b/i },
  { name: "Nuxt", pattern: /\bnuxt(?:\.?js)?\b/i },
  { name: "HTML", pattern: /\bhtml5?\b/i },
  { name: "CSS", pattern: /\bcss3?\b/i },
  { name: "Tailwind", pattern: /\btailwind(?:\s*css)?\b/i },
  { name: "SASS", pattern: /\bsass\b|\bscss\b/i },

  // Backend
  { name: "Node.js", pattern: /\bnode\.?js\b|\bnode\.js\b/i },
  { name: "Express", pattern: /\bexpress(?:\.?js)?\b/i },
  { name: "Django", pattern: /\bdjango\b/i },
  { name: "Flask", pattern: /\bflask\b/i },
  { name: "FastAPI", pattern: /\bfastapi\b/i },
  { name: "Spring", pattern: /\bspring\b(?:\s*boot)?\b/i },
  { name: "Rails", pattern: /\brails\b|\bruby\s+on\s+rails\b/i },
  { name: "Laravel", pattern: /\blaravel\b/i },
  { name: "NestJS", pattern: /\bnest\.?js\b|\bnestjs\b/i },
  { name: "Deno", pattern: /\bdeno\b/i },
  { name: "Bun", pattern: /\bbun\b/i },

  // Mobile
  { name: "React Native", pattern: /\breact\s*native\b/i },
  { name: "Flutter", pattern: /\bflutter\b/i },
  { name: "SwiftUI", pattern: /\bswiftui\b/i },
  { name: "Jetpack Compose", pattern: /\bjetpack\s*compose\b/i },
  { name: "iOS", pattern: /\bios\b/i },
  { name: "Android", pattern: /\bandroid\b/i },

  // Cloud/Infra
  { name: "AWS", pattern: /\baws\b|\bamazon\s+web\s+services\b/i },
  { name: "GCP", pattern: /\bgcp\b|\bgoogle\s+cloud\b/i },
  { name: "Azure", pattern: /\bazure\b/i },
  { name: "Docker", pattern: /\bdocker\b/i },
  { name: "Kubernetes", pattern: /\bkubernetes\b|\bk8s\b/i },
  { name: "Terraform", pattern: /\bterraform\b/i },
  { name: "Ansible", pattern: /\bansible\b/i },
  { name: "CI/CD", pattern: /\bci\s*\/\s*cd\b|\bcicd\b/i },
  { name: "Jenkins", pattern: /\bjenkins\b/i },
  { name: "GitHub Actions", pattern: /\bgithub\s*actions\b/i },

  // Data
  { name: "PostgreSQL", pattern: /\bpostgresql\b|\bpostgres\b/i },
  { name: "MySQL", pattern: /\bmysql\b/i },
  { name: "MongoDB", pattern: /\bmongodb\b|\bmongo\b/i },
  { name: "Redis", pattern: /\bredis\b/i },
  { name: "Elasticsearch", pattern: /\belasticsearch\b|\belastic\s*search\b/i },
  { name: "Kafka", pattern: /\bkafka\b/i },
  { name: "RabbitMQ", pattern: /\brabbitmq\b/i },
  { name: "GraphQL", pattern: /\bgraphql\b/i },
  { name: "REST API", pattern: /\brest\s*api\b|\brestful\b/i },
  { name: "gRPC", pattern: /\bgrpc\b/i },

  // ML/AI
  { name: "TensorFlow", pattern: /\btensorflow\b/i },
  { name: "PyTorch", pattern: /\bpytorch\b/i },
  { name: "Machine Learning", pattern: /\bmachine\s*learning\b|\bml\b/i },
  { name: "Deep Learning", pattern: /\bdeep\s*learning\b/i },
  { name: "NLP", pattern: /\bnlp\b|\bnatural\s+language\s+processing\b/i },
  { name: "LLM", pattern: /\bllm\b|\blarge\s+language\s+model\b/i },
  { name: "OpenAI", pattern: /\bopenai\b/i },
  { name: "Computer Vision", pattern: /\bcomputer\s*vision\b/i },

  // Other
  { name: "Git", pattern: /\bgit\b(?!hub|lab)/i },
  { name: "Linux", pattern: /\blinux\b/i },
  { name: "Agile", pattern: /\bagile\b/i },
  { name: "Scrum", pattern: /\bscrum\b/i },
  { name: "Microservices", pattern: /\bmicroservices?\b/i },
  { name: "Serverless", pattern: /\bserverless\b/i },
  { name: "WebSocket", pattern: /\bwebsockets?\b/i },
  { name: "OAuth", pattern: /\boauth\b/i },
];

export function extractSkills(text: string): string[] {
  const found = new Set<string>();

  for (const skill of TECH_SKILLS) {
    if (skill.pattern.test(text)) {
      found.add(skill.name);
    }
  }

  return Array.from(found).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

export function extractSkillsAsString(text: string): string {
  return extractSkills(text).join(", ");
}
