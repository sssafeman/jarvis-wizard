import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export interface CommandResult {
  stdout: string;
  stderr: string;
}

export async function runCommand(command: string, cwd?: string): Promise<CommandResult> {
  const result = await execAsync(command, {
    cwd,
    maxBuffer: 1024 * 1024 * 8,
    shell: "/bin/bash"
  });

  return {
    stdout: result.stdout,
    stderr: result.stderr
  };
}

export async function runCommandSafe(command: string, cwd?: string): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  try {
    const result = await runCommand(command, cwd);
    return { ok: true, ...result };
  } catch (error) {
    const cast = error as { stdout?: string; stderr?: string; message?: string };
    return {
      ok: false,
      stdout: cast.stdout ?? "",
      stderr: cast.stderr ?? cast.message ?? "Command failed"
    };
  }
}
