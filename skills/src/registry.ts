import type { Skill, SkillKind, SkillManifest } from "./types.js";

export interface SkillSearchFilter {
  kind?: SkillKind;
  tag?: string;
}

export class SkillRegistry {
  private skills = new Map<string, Skill>();

  register(skill: Skill): void {
    const existing = this.skills.get(skill.manifest.name);
    if (existing && existing.manifest.version === skill.manifest.version) {
      throw new Error(
        `Skill "${skill.manifest.name}@${skill.manifest.version}" is already registered`,
      );
    }
    this.skills.set(skill.manifest.name, skill);
  }

  get(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  list(): SkillManifest[] {
    return Array.from(this.skills.values()).map((s) => s.manifest);
  }

  search(filter: SkillSearchFilter = {}): SkillManifest[] {
    return this.list().filter((m) => {
      if (filter.kind && m.kind !== filter.kind) return false;
      if (filter.tag && !(m.tags ?? []).includes(filter.tag)) return false;
      return true;
    });
  }
}
