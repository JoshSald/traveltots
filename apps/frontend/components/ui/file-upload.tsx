"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

type FileUploadProps = {
  onChange: (files: File[]) => void;
  disabled?: boolean;
  accept?: string;
  multiple?: boolean;
  className?: string;
  title?: string;
  subtitle?: string;
};

export function FileUpload({
  onChange,
  disabled = false,
  accept = "image/*",
  multiple = true,
  className,
  title = "Upload file",
  subtitle = "Drag or drop your files here or click to upload",
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const emitFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || disabled) return;
    onChange(Array.from(fileList));
  };

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="hidden"
        onChange={(event) => {
          emitFiles(event.target.files);
          event.currentTarget.value = "";
        }}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) {
            setIsDragging(true);
          }
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          emitFiles(event.dataTransfer.files);
        }}
        className={cn(
          "group relative w-full overflow-hidden rounded-sm border border-dashed p-8 text-left transition-colors",
          "border-(--color-border) bg-(--color-surface-lowest)",
          "hover:border-(--color-primary-dark) hover:bg-(--color-surface-muted)",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary)/50",
          "disabled:cursor-not-allowed disabled:opacity-60",
          isDragging &&
            "border-(--color-primary-dark) bg-(--color-surface-muted)",
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(139,133,125,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(139,133,125,0.12)_1px,transparent_1px)] bg-size-[24px_24px] opacity-40" />

        <div className="relative z-10 flex flex-col items-center justify-center gap-3 text-center">
          <div className="inline-flex size-12 items-center justify-center rounded-sm border border-(--color-border) bg-(--color-surface) text-(--color-text-primary) shadow-sm transition-colors group-hover:bg-(--color-surface-low)">
            <UploadCloud className="size-5" />
          </div>
          <p className="text-sm font-semibold text-(--color-text-primary)">
            {title}
          </p>
          <p className="text-xs text-(--color-text-muted)">{subtitle}</p>
        </div>
      </button>
    </div>
  );
}
