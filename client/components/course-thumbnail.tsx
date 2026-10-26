"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";

function normalizeSrc(src?: string | null) {
  if (!src) return null;
  if (/^(https?:|data:|blob:|\/)/.test(src)) return src;
  return `/${src}`;
}

export function CourseThumbnail({
  src,
  alt = "Course thumbnail",
  className = "",
  iconClassName = "h-8 w-8",
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  iconClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const resolved = normalizeSrc(src);

  if (resolved && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolved}
        alt={alt}
        onError={() => setFailed(true)}
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <div className={`flex items-center justify-center bg-surface ${className}`}>
      <BookOpen className={`${iconClassName} text-muted-foreground/30`} />
    </div>
  );
}
