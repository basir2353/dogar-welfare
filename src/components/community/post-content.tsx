import { extractHashtags } from "@/shared";

type PostContentProps = {
  text: string;
  className?: string;
  onHashtagClick?: (tag: string) => void;
};

/** Render post body with clickable hashtag highlights. */
export function PostContentWithHashtags({ text, className, onHashtagClick }: PostContentProps) {
  const parts = text.split(/(#[\w\u0600-\u06FF]+)/g);
  return (
    <p className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("#") && extractHashtags(part).length > 0) {
          const tag = part.slice(1).toLowerCase();
          if (onHashtagClick) {
            return (
              <button
                key={`${i}-${tag}`}
                type="button"
                onClick={() => onHashtagClick(tag)}
                className="font-medium text-primary hover:underline"
              >
                {part}
              </button>
            );
          }
          return (
            <span key={`${i}-${tag}`} className="font-medium text-primary">
              {part}
            </span>
          );
        }
        return <span key={`${i}-t`}>{part}</span>;
      })}
    </p>
  );
}
