import { Link } from "react-router-dom";
import { Eye, FileText, Heart, MessageCircle, Theater } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { countWords, type StoryDocument } from "@/hooks/use-documents";

const statusColors: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Editing: "bg-warm-light text-primary",
  Final: "bg-secondary text-sage-dark",
};

const formatRelativeDate = (value: Date) => {
  const now = Date.now();
  const diffMinutes = Math.floor((now - value.getTime()) / 60000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return value.toLocaleDateString();
};

const toExcerpt = (work: StoryDocument) => {
  const base = work.description.trim() || work.content.trim();
  if (!base) return "No description yet.";
  if (base.length <= 180) return base;
  return `${base.slice(0, 177)}...`;
};

const StoryCard = ({ work }: { work: StoryDocument }) => {
  const wordCount = countWords(work.content);
  const updatedAt = formatRelativeDate(work.updatedAt);
  const excerpt = toExcerpt(work);

  return (
    <Link
      to={`/document/${work.id}`}
      className="block bg-card rounded-lg border border-border p-4 hover:shadow-lg transition-colors"
    >
      <div className="flex gap-4">
        <div className="w-24 h-32 rounded-md bg-gradient-to-br from-primary/10 to-primary/5 flex-shrink-0 overflow-hidden flex items-center justify-center text-xs text-muted-foreground">
          {work.coverUrl ? (
            <img src={work.coverUrl} alt={work.title} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center px-2">Cover</div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <h3 className="font-display text-lg font-semibold text-foreground">{work.title}</h3>
            <Badge className={statusColors[work.status]} variant="secondary">
              {work.status}
            </Badge>
          </div>
          <p className="font-body text-sm text-muted-foreground line-clamp-3 mt-2 italic">
            {excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-4">
            <span className="flex items-center gap-1">
              {work.type === "playscript" ? (
                <Theater className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {work.genre}
            </span>
            <span>{wordCount.toLocaleString()} words</span>
            <span>{work.language}</span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {work.reads.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {work.votes.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {work.comments.toLocaleString()}
            </span>
            <span className="ml-auto text-right">{updatedAt}</span>
          </div>

          {work.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {work.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-[11px]">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default StoryCard;
