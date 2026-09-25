"use client";

import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { githubLight } from "@uiw/codemirror-theme-github";
import { useMutation } from "@tanstack/react-query";
import { Loader2, PlayCircle, CheckCircle2, XCircle, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { submissionApi, type CodeRunResult } from "@/lib/api";
import { useSnackbar } from "@/components/snackbar-provider";

const languageExtensions: Record<string, any> = {
  javascript: () => [javascript({ jsx: true })],
  python: () => [python()],
};

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  language: string;
  testCases: { input: string; expectedOutput: string; hidden?: boolean }[];
}

export function CodeEditor({ code, onChange, language, testCases }: CodeEditorProps) {
  const { toast } = useSnackbar();
  const [results, setResults] = useState<CodeRunResult[] | null>(null);
  const [showTestCases, setShowTestCases] = useState(true);

  const visibleTestCases = testCases.filter((tc) => !tc.hidden);

  const runMutation = useMutation({
    mutationFn: () => submissionApi.runCode(code, language, testCases),
    onSuccess: (data) => {
      setResults(data);
      const allPassed = data.every((r) => r.isCorrect);
      if (allPassed) {
        toast("All test cases passed!", "success");
      } else {
        const passed = data.filter((r) => r.isCorrect).length;
        toast(`${passed}/${data.length} test cases passed.`, "error");
      }
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Failed to run code. Please try again.";
      toast(msg, "error");
    },
  });

  const extensions = languageExtensions[language]?.() || [javascript()];

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-white flex flex-col">
      {/* Editor Panel */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-surface/50 shrink-0">
          <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            {language}
          </span>
          <span className="text-[11px] text-muted-foreground">
            &middot; Write your solution below
          </span>
          <div className="ml-auto">
            <Button
              className="gap-2"
              size="sm"
              disabled={!code.trim() || runMutation.isPending || testCases.length === 0}
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
        <div className="flex-1 min-h-0 overflow-auto" style={{ minHeight: "400px" }}>
            <CodeMirror
              value={code}
              onChange={(value) => onChange(value)}
              extensions={extensions}
              theme={githubLight}
              style={{ fontSize: "14px", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", height: "100%" }}
            />
        </div>
      </div>

      {/* Test Cases - Below Editor */}
      <div className="border-t border-border bg-surface/30">
        <button
          className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-surface/50 transition-colors"
          onClick={() => setShowTestCases(!showTestCases)}
        >
          {showTestCases ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <Label className="text-xs font-semibold text-muted-foreground cursor-pointer">
            Test Cases ({visibleTestCases.length})
          </Label>
        </button>

        {showTestCases && (
          <div className="px-4 pb-4 flex gap-3 overflow-x-auto">
            {visibleTestCases.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic">No visible test cases</p>
            ) : (
              visibleTestCases.map((tc, i) => {
                const result = results?.[i];
                return (
                  <div
                    key={i}
                    className={`rounded-md border p-2.5 text-[11px] space-y-1 transition-colors shrink-0 min-w-[200px] ${
                      result
                        ? result.isCorrect
                          ? "border-emerald-200 bg-emerald-50/60"
                          : "border-red-200 bg-red-50/60"
                        : "border-border bg-white/60"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold">
                      {result ? (
                        result.isCorrect ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-red-600" />
                        )
                      ) : null}
                      <span className={result?.isCorrect ? "text-emerald-700" : result ? "text-red-700" : "text-foreground"}>
                        Case {i + 1}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-muted-foreground">
                        Input: <span className="font-mono text-foreground">{tc.input || "(empty)"}</span>
                      </p>
                      <p className="text-muted-foreground">
                        Expected: <span className="font-mono text-foreground">{tc.expectedOutput}</span>
                      </p>
                      {result && !result.isCorrect && (
                        <>
                          {result.actualOutput !== null && (
                            <p className="text-muted-foreground">
                              Got: <span className="font-mono text-foreground">{result.actualOutput || "(empty output)"}</span>
                            </p>
                          )}
                          {result.error && (
                            <p className="text-red-600 font-mono whitespace-pre-wrap break-all">{result.error}</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
