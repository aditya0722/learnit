import { execSync, execFileSync } from "child_process";

const decodeFile = (base64, path) => `echo '${base64}' | base64 -d > ${path}`;

const LANGUAGE_CONFIG = {
  javascript: {
    image: "node:20-alpine",
    run: (code, input) =>
      `${decodeFile(code, "/tmp/solution.js")} && ${decodeFile(input, "/tmp/input.txt")} && node /tmp/solution.js < /tmp/input.txt`,
  },
  python: {
    image: "python:3.12-alpine",
    run: (code, input) =>
      `${decodeFile(code, "/tmp/solution.py")} && ${decodeFile(input, "/tmp/input.txt")} && python3 /tmp/solution.py < /tmp/input.txt`,
  },
  java: {
    image: "eclipse-temurin:21-jdk-alpine",
    run: (code, input) => {
      const className =
        Buffer.from(code, "base64").toString("utf-8").match(/\bclass\s+(\w+)/)?.[1] ||
        "Solution";
      return `${decodeFile(code, `/tmp/${className}.java`)} && ${decodeFile(input, "/tmp/input.txt")} && mkdir -p /tmp/build && javac -d /tmp/build /tmp/${className}.java && java -cp /tmp/build ${className} < /tmp/input.txt`;
    },
  },
  cpp: {
    image: "gcc:latest",
    run: (code, input) =>
      `${decodeFile(code, "/tmp/solution.cpp")} && ${decodeFile(input, "/tmp/input.txt")} && mkdir -p /tmp/build && g++ -o /tmp/build/solution /tmp/solution.cpp && /tmp/build/solution < /tmp/input.txt`,
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
const input = require("fs").readFileSync("/tmp/input.txt", "utf-8").trim();
${code}
`;
    case "python":
      return `
import sys
input_data = open("/tmp/input.txt").read().strip()
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

  const encodedCode = Buffer.from(wrapForLanguage(code, language)).toString(
    "base64"
  );

  for (const testCase of testCases) {
    const encodedInput = Buffer.from(testCase.input || "").toString("base64");

    const dockerArgs = [
      "run",
      "--rm",
      "--memory",
      MEMORY_LIMIT,
      "--cpus",
      CPU_LIMIT,
      "--network",
      "none",
      "--read-only",
      "--tmpfs",
      "/tmp:rw,exec,size=64m",
      config.image,
      "sh",
      "-c",
      config.run(encodedCode, encodedInput),
    ];

    try {
      const output = execFileSync("docker", dockerArgs, {
        timeout: TIMEOUT_MS,
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "pipe"],
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
    throw new Error(
      "Docker is not running. Please start Docker on the server to run code."
    );
  }

  return executeWithDocker(code, language, testCases);
}
