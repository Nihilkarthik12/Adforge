"use client";

// Dev sandbox: edit a template with no backend. Not linked from the dashboard.
import { Editor } from "@/components/editor/Editor";
import { sampleCreative } from "@/lib/creative/sample";

export default function EditorDemoPage() {
  return (
    <Editor
      initialState={sampleCreative}
      title="Editor demo"
    />
  );
}
