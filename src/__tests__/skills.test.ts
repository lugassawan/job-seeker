import { describe, expect, test } from "bun:test";
import { extractSkills, extractSkillsAsString } from "../utils/skills";

describe("extractSkills", () => {
  test("finds multiple skills in a description", () => {
    const text =
      "We need a developer with experience in TypeScript, React, and Node.js. " +
      "Must know PostgreSQL and Docker.";
    const skills = extractSkills(text);

    expect(skills).toContain("TypeScript");
    expect(skills).toContain("React");
    expect(skills).toContain("Node.js");
    expect(skills).toContain("PostgreSQL");
    expect(skills).toContain("Docker");
    expect(skills.length).toBeGreaterThanOrEqual(5);
  });

  test("deduplicates skills mentioned multiple times", () => {
    const text =
      "React is required. We use React for the frontend. Strong React experience is a must.";
    const skills = extractSkills(text);

    const reactCount = skills.filter((s) => s === "React").length;
    expect(reactCount).toBe(1);
  });

  test("returns results sorted alphabetically", () => {
    const text = "We use React, Angular, Docker, AWS, and Python.";
    const skills = extractSkills(text);

    const sorted = [...skills].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
    expect(skills).toEqual(sorted);
  });

  test("returns empty array for empty string", () => {
    expect(extractSkills("")).toEqual([]);
  });

  test("returns empty array for irrelevant text", () => {
    const text = "We are looking for a passionate team player who can communicate well.";
    expect(extractSkills(text)).toEqual([]);
  });

  test("handles case-insensitive matching", () => {
    const text = "TYPESCRIPT, react, Docker, aws";
    const skills = extractSkills(text);

    expect(skills).toContain("TypeScript");
    expect(skills).toContain("React");
    expect(skills).toContain("Docker");
    expect(skills).toContain("AWS");
  });

  test("matches skill abbreviations and variants", () => {
    const text = "Experience with k8s, postgres, mongo, and restful APIs required.";
    const skills = extractSkills(text);

    expect(skills).toContain("Kubernetes");
    expect(skills).toContain("PostgreSQL");
    expect(skills).toContain("MongoDB");
    expect(skills).toContain("REST API");
  });

  test("distinguishes Java from JavaScript", () => {
    const text = "Must know Java and JavaScript.";
    const skills = extractSkills(text);

    expect(skills).toContain("Java");
    expect(skills).toContain("JavaScript");
  });

  test("detects React Native separately from React", () => {
    const text = "We use React Native for mobile and React for web.";
    const skills = extractSkills(text);

    expect(skills).toContain("React Native");
    expect(skills).toContain("React");
  });

  test("works with a realistic job description paragraph", () => {
    const text = `
      Senior Full-Stack Engineer

      We are building the next generation of our cloud platform and looking for
      a senior engineer to join our team. You will work across the entire stack
      using TypeScript and Python.

      Requirements:
      - 5+ years of experience with React and Node.js
      - Strong knowledge of PostgreSQL and Redis
      - Experience with AWS services (EC2, S3, Lambda)
      - Familiarity with Docker and Kubernetes for container orchestration
      - Understanding of CI/CD pipelines and GitHub Actions
      - Experience building RESTful APIs and GraphQL endpoints
      - Knowledge of Agile/Scrum methodologies
      - Proficiency with Git version control

      Nice to have:
      - Experience with Kafka or RabbitMQ for event streaming
      - Familiarity with Terraform for infrastructure as code
      - Machine Learning or NLP background
      - MongoDB experience
    `;

    const skills = extractSkills(text);

    expect(skills).toContain("TypeScript");
    expect(skills).toContain("Python");
    expect(skills).toContain("React");
    expect(skills).toContain("Node.js");
    expect(skills).toContain("PostgreSQL");
    expect(skills).toContain("Redis");
    expect(skills).toContain("AWS");
    expect(skills).toContain("Docker");
    expect(skills).toContain("Kubernetes");
    expect(skills).toContain("CI/CD");
    expect(skills).toContain("GitHub Actions");
    expect(skills).toContain("REST API");
    expect(skills).toContain("GraphQL");
    expect(skills).toContain("Agile");
    expect(skills).toContain("Scrum");
    expect(skills).toContain("Git");
    expect(skills).toContain("Kafka");
    expect(skills).toContain("RabbitMQ");
    expect(skills).toContain("Terraform");
    expect(skills).toContain("Machine Learning");
    expect(skills).toContain("NLP");
    expect(skills).toContain("MongoDB");

    // Verify sorting
    for (let i = 1; i < skills.length; i++) {
      const prev = skills.at(i - 1) ?? "";
      const curr = skills.at(i) ?? "";
      expect(
        prev.localeCompare(curr, undefined, {
          sensitivity: "base",
        }),
      ).toBeLessThanOrEqual(0);
    }
  });
});

describe("extractSkillsAsString", () => {
  test("returns a comma-separated string of skills", () => {
    const text = "Experience with React, Docker, and AWS.";
    const result = extractSkillsAsString(text);

    expect(typeof result).toBe("string");
    expect(result).toContain("AWS");
    expect(result).toContain("Docker");
    expect(result).toContain("React");
    expect(result).toContain(", ");
  });

  test("returns empty string for text with no skills", () => {
    expect(extractSkillsAsString("")).toBe("");
    expect(extractSkillsAsString("No tech skills here.")).toBe("");
  });

  test("returns a single skill without commas", () => {
    const text = "Must know Docker.";
    const result = extractSkillsAsString(text);
    expect(result).toBe("Docker");
  });
});
