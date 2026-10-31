/**
 * yvl build --id <slug> [--spec <file>] [--update]
 * Step 7: spec -> src/data/videos/<slug>.ts, with the project's OWN generator (scripts/video-prep/build.mjs), after
 * `check` passes. Then Prettier formats the new file and index.ts the way a commit would, and `npm run test:video`
 * runs the repo's validation over every lesson. Nothing here publishes anything: a lesson reaches learners only
 * through a push to the release branch, and only when the owner says so.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { HERE, draftPath, fail, requireId, resolveRepo } from "../lib/util.mjs";

const sh = (cmd, args, cwd) => spawnSync(cmd, args, { cwd, encoding: "utf8", shell: process.platform === "win32" });

export async function run(args) {
  const repo = resolveRepo(args);
  const id = requireId(args);
  const specFile = args.spec ? String(args.spec) : draftPath(args, id, "spec");
  if (!fs.existsSync(specFile)) fail(`no ${specFile}`);
  const generator = path.join(repo, "scripts", "video-prep", "build.mjs");
  if (!fs.existsSync(generator)) fail(`${generator} is missing: this checkout is too old (use a worktree of origin/master)`);

  const yvl = path.resolve(HERE, "..", "yvl.mjs");
  const checkArgs = [yvl, "check", "--id", id, "--repo", repo, ...(args.spec ? ["--spec", specFile] : []), ...(args.update ? ["--update"] : [])];
  const check = spawnSync(process.execPath, checkArgs, { encoding: "utf8" });
  process.stdout.write(check.stdout ?? "");
  if (check.status !== 0) fail("check failed: fix the errors above first (nothing was built)");

  const built = spawnSync(process.execPath, [generator, specFile], { cwd: repo, encoding: "utf8" });
  process.stdout.write(built.stdout ?? "");
  if (built.status !== 0) fail(`the repo generator failed:\n${built.stderr ?? ""}`);

  const files = [`src/data/videos/${id}.ts`, "src/data/videos/index.ts"];
  const pretty = sh("npx", ["prettier", "--write", ...files], repo);
  console.log(pretty.status === 0 ? `formatted ${files.join(", ")}` : `WARN prettier failed (${(pretty.stderr ?? "").trim().split("\n").pop()})`);

  const tests = sh("npm", ["run", "test:video"], repo);
  const tail = `${tests.stdout ?? ""}${tests.stderr ?? ""}`.trim().split("\n").slice(-8).join("\n");
  console.log(`npm run test:video -> ${tests.status === 0 ? "pass" : "FAIL"}\n${tail}`);
  if (tests.status !== 0) fail("the repo's own tests reject the lesson");
  console.log(`built ${files[0]}. next: yvl check --id ${id} --built, yvl verify --id ${id}, then commit with explicit paths (never publish without the owner's word).`);
}
