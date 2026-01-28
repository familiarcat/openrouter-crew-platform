import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

type Edit = { startLine: number; endLine: number; text: string };
type Body =
  | { op: "readFile"; filePath: string }
  | { op: "writeFile"; filePath: string; content: string; createDirs?: boolean }
  | { op: "listDir"; dirPath: string }
  | { op: "ensureDir"; dirPath: string }
  | { op: "applyPatch"; filePath: string; edits: Edit[] };

function projectRoot() {
  return process.cwd();
}

const BLOCKED = [
  ".git",
  "node_modules",
  ".env",
  ".env.local",
  ".secrets",
  ".next",
  "dist",
];

const ALLOWED_ROOTS = [
  "workspace",
  "projects",
  "data",
  "docs",
  "src",
  "app",
  "vscode-extension",
  "lib",
];

function isBlocked(p: string) {
  return BLOCKED.some(b => p === b || p.startsWith(b + path.sep));
}

function resolveSafe(userPath: string) {
  const root = projectRoot();
  const cleaned = userPath.replace(/^\/+/, "");
  const top = cleaned.split(/[\\/]/)[0] || "";
  if (!ALLOWED_ROOTS.includes(top)) {
    throw new Error(`Path not allowed: ${top}`);
  }
  if (isBlocked(cleaned)) {
    throw new Error(`Path blocked`);
  }
  const abs = path.resolve(root, cleaned);
  if (!abs.startsWith(root)) {
    throw new Error(`Invalid path traversal`);
  }
  return abs;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    if (body.op === "readFile") {
      const abs = resolveSafe(body.filePath);
      const content = await fs.readFile(abs, "utf8");
      return NextResponse.json({ ok: true, content });
    }

    if (body.op === "writeFile") {
      const abs = resolveSafe(body.filePath);
      if (body.createDirs) {
        await fs.mkdir(path.dirname(abs), { recursive: true });
      }
      await fs.writeFile(abs, body.content, "utf8");
      return NextResponse.json({ ok: true });
    }

    if (body.op === "listDir") {
      const abs = resolveSafe(body.dirPath);
      const entries = await fs.readdir(abs, { withFileTypes: true });
      return NextResponse.json({
        ok: true,
        entries: entries.map(e => ({ name: e.name, type: e.isDirectory() ? "dir" : "file" })),
      });
    }

    if (body.op === "ensureDir") {
      const abs = resolveSafe(body.dirPath);
      await fs.mkdir(abs, { recursive: true });
      return NextResponse.json({ ok: true });
    }

    if (body.op === "applyPatch") {
      const abs = resolveSafe(body.filePath);
      const original = await fs.readFile(abs, "utf8");
      const lines = original.split(/\r?\n/);

      const edits = [...body.edits].sort((a,b) => b.startLine - a.startLine);
      for (const e of edits) {
        const s = Math.max(1, e.startLine);
        const t = Math.max(s, e.endLine);
        lines.splice(s - 1, t - (s - 1), ...e.text.split(/\r?\n/));
      }

      await fs.writeFile(abs, lines.join("\n"), "utf8");
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unknown op" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Error" }, { status: 500 });
  }
}
