"use client";

import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { githubLight } from "@uiw/codemirror-theme-github";
import { useMutation } from "@tanstack/react-query";
import { Loader2, PlayCircle, Terminal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submissionApi } from "@/lib/api";
import { useSnackbar } from "@/components/snackbar-provider";

const languageExtensions: Record<string, any> = {
  javascript: () => [javascript({ jsx: true })],
  python: () => [python()],
  java: () => [java()],
  cpp: () => [cpp()],
};

const languages = [
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
];

const defaultCode: Record<string, string> = {
  javascript: `// Write your code here\nconsole.log("Hello, World!");`,
  python: `# Write your code here\nprint("Hello, World!")`,
  java: `class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, World!");\n  }\n}`,
  cpp: `#include <iostream>\n\nint main() {\n  std::cout << "Hello, World!" << std::endl;\n  return 0;\n}`,
};

export default function PlaygroundPage() {
  const { toast } = useSnackbar();
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(defaultCode.javascript);
  const [output, setOutput] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const runMutation = useMutation({
    mutationFn: () => submissionApi.runCode(code, language, [{ input: "", expectedOutput: "" }]),
    onSuccess: (data) => {
      const result = data[0];
      if (result.error) {
        setOutput(result.error);
        setIsError(true);
      } else {
        setOutput(result.actualOutput || "(no output)");
        setIsError(false);
      }
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Failed to run code.";
      setOutput(msg);
      setIsError(true);
      toast(msg, "error");
    },
  });

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setOutput(null);
    setCode(defaultCode[newLang] || defaultCode.javascript);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-navy">Code Playground</h1>
        <div className="flex items-center gap-3">
          {/* Language Dropdown */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            {languages.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.label}
              </option>
            ))}
          </select>
          {/* Run Button */}
          <Button
            size="sm"
            className="gap-2"
            disabled={!code.trim() || runMutation.isPending}
            onClick={() => runMutation.mutate()}
          >
            {runMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4" />
            )}
            {runMutation.isPending ? "Running..." : "Run Code"}
          </Button>
        </div>
      </div>

      {/* Editor + Output */}
      <div className="flex-1 rounded-lg border border-border overflow-hidden bg-white flex flex-col min-h-0">
        {/* Editor */}
        <div className="flex-1 min-h-0 overflow-auto">
          <CodeMirror
            value={code}
            onChange={(value) => setCode(value)}
            extensions={languageExtensions[language]?.() || [javascript()]}
            theme={githubLight}
            style={{ fontSize: "14px", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", height: "100%" }}
          />
        </div>

        {/* Output Panel - Only visible when output exists */}
        {output !== null && (
          <div className="border-t border-border bg-surface/30 flex flex-col" style={{ maxHeight: "250px" }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">Output</span>
                {isError && (
                  <span className="text-[10px] font-medium text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Error</span>
                )}
              </div>
              <button
                onClick={() => setOutput(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <pre
              className={`px-4 py-3 text-xs font-mono overflow-auto whitespace-pre-wrap ${
                isError ? "text-red-600" : "text-foreground"
              }`}
            >
              {output}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
