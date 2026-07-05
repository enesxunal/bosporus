"use client";

import { useState } from "react";
import Image from "next/image";
import { GripVertical, Trash2, Upload, Link2, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface ProductImageGalleryProps {
  urls: string[];
  onChange: (urls: string[]) => void;
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
}

export function ProductImageGallery({ urls, onChange, onUpload, uploading }: ProductImageGalleryProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [newUrl, setNewUrl] = useState("");

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const next = [...urls];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const addUrl = () => {
    const trimmed = newUrl.trim();
    if (!trimmed) return;
    onChange([...urls, trimmed]);
    setNewUrl("");
  };

  return (
    <div className="space-y-4">
      {urls.length > 0 ? (
        <>
          <p className="text-xs text-bosporus-muted">
            Görselleri sürükleyip bırakarak sıralayın. <strong>İlk görsel</strong> mağazada ana fotoğraf olur.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {urls.map((url, i) => (
              <div
                key={`${url}-${i}`}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverIndex(i);
                }}
                onDragLeave={() => setOverIndex(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null) reorder(dragIndex, i);
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                className={cn(
                  "relative aspect-square rounded-xl overflow-hidden border-2 bg-bosporus-gray-50 transition-all cursor-grab active:cursor-grabbing",
                  i === 0 ? "border-bosporus ring-2 ring-bosporus/20" : "border-bosporus-gray-200",
                  dragIndex === i && "opacity-40 scale-95",
                  overIndex === i && dragIndex !== i && "border-bosporus border-dashed scale-[1.02]"
                )}
              >
                <Image src={url} alt="" fill className="object-cover pointer-events-none" sizes="160px" />
                <div className="absolute top-0 inset-x-0 flex items-center justify-between p-1.5 bg-gradient-to-b from-black/50 to-transparent">
                  <span className="flex items-center gap-0.5 text-white/90">
                    <GripVertical className="w-4 h-4" />
                    {i === 0 ? (
                      <span className="text-[10px] font-bold bg-bosporus-yellow text-metro-navy px-1.5 py-0.5 rounded">Ana</span>
                    ) : (
                      <span className="text-[10px] font-medium">{i + 1}</span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => onChange(urls.filter((_, j) => j !== i))}
                    className="p-1 rounded-md bg-white/90 text-bosporus-red hover:bg-white"
                    title="Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-bosporus-gray-200 rounded-2xl bg-bosporus-gray-50/50">
          <ImageIcon className="w-10 h-10 text-bosporus-muted mb-2" />
          <p className="text-sm text-bosporus-muted">Henüz görsel yok</p>
        </div>
      )}

      <div className="flex flex-col gap-3 pt-1 border-t border-bosporus-gray-100">
        <label className="block">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={async (e) => {
              const files = Array.from(e.target.files ?? []);
              for (const f of files) await onUpload(f);
              e.target.value = "";
            }}
          />
          <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-bosporus-gray-200 text-sm font-semibold cursor-pointer hover:border-bosporus hover:bg-bosporus-light/30 transition-colors w-full sm:w-auto justify-center">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Bilgisayardan yükle
          </span>
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bosporus-muted" />
            <input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
              placeholder="Görsel linki (https://…)"
              className="field-input !pl-10"
            />
          </div>
          <Button type="button" variant="outline" onClick={addUrl} disabled={!newUrl.trim()}>
            Ekle
          </Button>
        </div>
      </div>
    </div>
  );
}
