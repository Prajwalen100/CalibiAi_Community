import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getArticleSlug } from "./article-link";
import { LEARNING_ROLES, ROLE_DETAILS } from "./content";

const levels = ["beginner", "intermediate"] as const;

describe("getArticleSlug", () => {
  it("maps every roadmap display role and level to its stable article-file slug", () => {
    for (const role of LEARNING_ROLES) {
      for (const level of levels) {
        const displayRole = ROLE_DETAILS[role].title;
        expect(getArticleSlug(displayRole, level[0].toUpperCase() + level.slice(1), 2))
          .toBe(`${role}-${level}-day-2`);
      }
    }
  });

  it("has an article for every day of every configured roadmap", () => {
    const articlesDirectory = path.join(process.cwd(), "content", "articles", "generated");

    for (const role of LEARNING_ROLES) {
      for (const level of levels) {
        const roadmapPath = path.join(process.cwd(), "content", "roadmap", ROLE_DETAILS[role].roadmap[level]);
        const roadmap = JSON.parse(fs.readFileSync(roadmapPath, "utf8")) as {
          roadmap: { role: string; level: string };
          days: Array<{ day: number }>;
        };

        for (const { day } of roadmap.days) {
          const articleFile = `article-${getArticleSlug(roadmap.roadmap.role, roadmap.roadmap.level, day)}.json`;
          expect(fs.existsSync(path.join(articlesDirectory, articleFile)), articleFile).toBe(true);
        }
      }
    }
  });
});
