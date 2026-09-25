import { execSync, execFileSync } from "child_process";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

const LANGUAGE_CONFIG = {
  javascript: {
    image: "node:20-alpine",
    filename: "solution.js",
    run: ["node", "/code/solution.js"],
  },
  python: {
    image: "python:3.12-alpine",
    filename: "solution.py",
    run: ["python3", "/code/solution.py"],
  },
  java: {
    image: "eclipse-temurin:21-jdk-alpine",
    filename: "Solution.java",
    run: ["sh", "-c", "javac -d /build /code/Solution.java && java -cp /build Solution"],
  },
  cpp: {
    image: "gcc:latest",
    filename: "solution.cpp",
    run: ["sh", "-c", "g++ -o /build/solution /code/solution.cpp && /build/solution"],
  },
};

const TIMEOUT_MS = 5000;
const MEMORY_LIMIT = "256m";
const CPU_LIMIT = "1";

function checkDockerAvailable() {
  try {
    execSync("docker info", { stdio: "pipe", timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

function wrapForLanguage(code, language) {
  switch (language) {
    case "javascript":
      return `
const input = require("fs").readFileSync("/code/input.txt", "utf-8").trim();
${code}
`;
    case "python":
      return `
import sys
input_data = open("/code/input.txt").read().strip()
${code}
`;
    case "java":
      return code;
    case "cpp":
      return code;
    default:
      return code;
  }
}


async function executeWithDocker(code, language, testCases) {
  const config = LANGUAGE_CONFIG[language];
  const results = [];

  for (const testCase of testCases) {
    const runId = randomUUID();
    const tmpDir = join(process.env.TEMP || "/tmp", `code-runner-${runId}`);

    try {
      mkdirSync(tmpDir, { recursive: true });

      const wrappedCode = wrapForLanguage(code, language);
      writeFileSync(join(tmpDir, config.filename), wrappedCode, "utf-8");
      writeFileSync(join(tmpDir, "input.txt"), testCase.input || "", "utf-8");

      const needsBuildDir = language === "java" || language === "cpp";
      if (needsBuildDir) {
        mkdirSync(join(tmpDir, "build"), { recursive: true });
      }

      const dockerArgs = [
        "run", "--rm",
        "--memory", MEMORY_LIMIT,
        "--cpus", CPU_LIMIT,
        "--network", "none",
        "--read-only",
        "--tmpfs", "/tmp:size=10m",
        "-v", `${tmpDir.replace(/\\/g, "/")}:/code:ro`,
        ...(needsBuildDir ? ["-v", `${tmpDir.replace(/\\/g, "/")}/build:/build`] : []),
        config.image,
        ...config.run,
      ];

      const output = execFileSync("docker", dockerArgs, {
        timeout: TIMEOUT_MS,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });

      const actualOutput = output.trim();
      const expectedOutput = (testCase.expectedOutput || "").trim();
      const isCorrect = actualOutput === expectedOutput;

      results.push({
        input: testCase.input,
        expectedOutput,
        actualOutput,
        isCorrect,
        error: null,
      });
    } catch (error) {
      let errorMessage = error.message || "Execution failed";

      if (error.killed || error.signal === "SIGTERM") {
        errorMessage = "Time limit exceeded (5s timeout)";
      }

      if (error.stderr) {
        errorMessage = error.stderr.toString().slice(0, 500);
      }

      results.push({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: null,
        isCorrect: false,
        error: errorMessage,
      });
    } finally {
      if (existsSync(tmpDir)) {
        rmSync(tmpDir, { recursive: true, force: true });
      }
    }
  }

  return results;
}

export async function executeCode(code, language, testCases = []) {
  const config = LANGUAGE_CONFIG[language];
  if (!config) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const dockerAvailable = checkDockerAvailable();

  if (!dockerAvailable) {
    throw new Error("Docker is not running. Please start Docker Desktop to run code.");
  }

  return executeWithDocker(code, language, testCases);
}
