"use client";

import { useEffect, useRef, useState } from "react";
import { Editor } from "@/components/editor/Editor";
import { dataUrlToBlob } from "@/lib/creative/export";
import type { CreativeState } from "@/lib/creative/types";
import { isImage } from "@/lib/creative/types";
import type { AngleRow } from "@/lib/db";
import {
  getAngle,
  getCreative,
  getInput,
  getProject,
  signedUrl,
  updateCreative,
  uploadToBucket,
} from "@/lib/db";

async function refreshImageUrls(state: CreativeState): Promise<CreativeState> {
  const layers = await Promise.all(
    state.layers.map(async (layer) => {
      if (isImage(layer) && layer.srcPath) {
        const fresh = await signedUrl("assets", layer.srcPath);
        return { ...layer, src: fresh ?? layer.src };
      }
      return layer;
    }),
  );
  return { ...state, layers };
}

export function EditorLoader({
  projectId,
  creativeId,
}: {
  projectId: string;
  creativeId: string;
}) {
  const [state, setState] = useState<CreativeState | null>(null);
  const [title, setTitle] = useState("Creative");
  const [error, setError] = useState<string | null>(null);
  const angleRef = useRef<AngleRow | null>(null);
  const businessTextRef = useRef<string>("");

  useEffect(() => {
    (async () => {
      try {
        const [creative, project, input] = await Promise.all([
          getCreative(creativeId),
          getProject(projectId),
          getInput(projectId),
        ]);
        if (!creative) {
          setError("Creative not found.");
          return;
        }
        if (project) setTitle(project.name);
        businessTextRef.current = input?.business_text ?? "";
        if (creative.angle_id) {
          angleRef.current = await getAngle(creative.angle_id);
        }
        setState(await refreshImageUrls(creative.state_json));
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [projectId, creativeId]);

  async function handleRegenerateCopy(field: string): Promise<string> {
    const angle = angleRef.current;
    if (!angle) return "";
    try {
      const res = await fetch("/api/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          angle: {
            name: angle.name,
            core_message: angle.core_message,
            hook: angle.hook,
            cta: angle.cta,
          },
          businessText: businessTextRef.current,
        }),
      });
      if (!res.ok) return "";
      const copy = (await res.json()) as Record<string, string>;
      return copy[field] ?? "";
    } catch {
      return "";
    }
  }

  async function handleSave(next: CreativeState, thumbnailDataUrl?: string) {
    let thumbnail_url: string | null | undefined = undefined;
    if (thumbnailDataUrl) {
      try {
        const blob = await dataUrlToBlob(thumbnailDataUrl);
        const path = await uploadToBucket("exports", projectId, blob, `${creativeId}.png`);
        thumbnail_url = await signedUrl("exports", path);
      } catch {
        // Thumbnail failure never blocks the state save.
      }
    }
    await updateCreative(creativeId, { state_json: next, thumbnail_url });
  }

  if (error) {
    return (
      <main className="mx-auto max-w-xl px-6 py-20 text-center">
        <p className="text-sm text-red-600">{error}</p>
      </main>
    );
  }
  if (!state) {
    return (
      <main className="mx-auto max-w-xl px-6 py-20 text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          Loading creative…
        </div>
      </main>
    );
  }

  return (
    <Editor
      initialState={state}
      title={title}
      onSave={handleSave}
      onRegenerateCopy={handleRegenerateCopy}
    />
  );
}
