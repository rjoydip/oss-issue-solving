import { dirname } from "jsr:@std/path/dirname";
import { error, info } from "@std/log";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import {
  configPattern,
  getFiles,
  isPnpm,
  isYarn,
  runtimeMapper,
} from "../utils.ts";
import { Output } from "../types.ts";
import { Agent } from "../types.ts";

const exca = promisify(exec);
const getCmd = async (agent: Agent, cwd: string, cmd: { lint: string }) =>
  `${
    agent === "node"
      ? await isPnpm(cwd)
        ? "pnpm run"
        : await isYarn(cwd)
        ? "yarn run"
        : "npm run"
      : agent
  } ${cmd?.lint || "lint"}`;

for await (const file of await getFiles(configPattern)) {
  const { name, path } = file;
  const { agent, cmd = { lint: "lint" } } = runtimeMapper[name];
  const cwd = dirname(path);

  let outputs: Output[] = [];
  if (typeof agent === "string") {
    const $cmd = await getCmd(agent, cwd, cmd);
    const { stderr, stdout } = await exca($cmd, {
      cwd,
    });
    outputs.push({
      stderr,
      stdout,
    });
  } else {
    outputs = await Promise.all(agent.map(async (ag) => {
      const $cmd = await getCmd(ag, cwd, cmd);
      if (path.includes(ag)) {
        const { stderr, stdout } = await exca($cmd, {
          cwd,
        });
        return { stderr, stdout };
      } else {
        return {
          stderr: "",
          stdout: "",
        };
      }
    }));
  }

  outputs
    .filter((i) => i.stderr && i.stdout)
    .map(({ stdout, stderr }) => {
      if (stdout) info(stdout);
      if (stderr && !stderr.includes("$")) error(stderr);
    });
}
console.log("\n%c>> Complement all linting", "color:#C68FE6");
