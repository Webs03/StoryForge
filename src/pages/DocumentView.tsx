import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen, ArrowLeft, Save, Download, Share2, Clock,
  FileText, Theater, ChevronDown, Bold, Italic, AlignLeft,
  AlignCenter, List, Heading1, Heading2, Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const mockDocument = {
  id: "1",
  title: "The Last Lighthouse Keeper",
  type: "story" as const,
  status: "Editing" as const,
  wordCount: 4280,
  genre: "Literary Fiction",
  updatedAt: "2 hours ago",
  versions: 12,
  content: `The fog rolled in at dusk, thick as wool, swallowing the coastline whole. Elias stood at the top of the lighthouse, hands wrapped around his coffee mug, watching the world disappear.

He had been keeper for thirty-seven years. Thirty-seven years of wind and salt and the rhythmic sweep of the beam across dark water. The lighthouse was more than a building to him — it was a companion, a confidant, the only thing that had never left.

"They're closing us down," the letter had said. Three sentences. Typed, not handwritten. No one writes by hand anymore, Elias thought. Not even when they're ending someone's life.

The fog horn sounded — low, mournful, a sound that lived in his bones. He wondered if the ships would miss it. He wondered if anyone would miss him.

Below, the waves crashed against the rocks in their eternal argument with the shore. Elias set down his mug and began his final inspection of the light.`,
};

const DocumentView = () => {
  const { id } = useParams();
  const doc = mockDocument;
  const isPlayscript = (doc.type as string) === "playscript";

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <div className="flex items-center gap-2">
              {isPlayscript ? <Theater className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-primary" />}
              <span className="font-display font-semibold text-foreground">{doc.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-warm-light text-primary text-xs">{doc.status}</Badge>
            <span className="text-xs text-muted-foreground font-body hidden sm:inline">Saved {doc.updatedAt}</span>
            <Button variant="ghost" size="sm"><Save className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm"><Share2 className="h-4 w-4" /></Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Document Meta */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-wrap items-center gap-4 text-sm font-body text-muted-foreground mb-6">
            <span>{doc.genre}</span>
            <span>·</span>
            <span>{doc.wordCount.toLocaleString()} words</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {doc.versions} versions</span>
          </div>
        </motion.div>

        {/* Formatting Toolbar */}
        <div className="flex items-center gap-1 p-2 bg-card rounded-lg border border-border mb-6 overflow-x-auto">
          {[Bold, Italic, Minus, Heading1, Heading2, AlignLeft, AlignCenter, List].map((Icon, i) => (
            <Button key={i} variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
              <Icon className="h-4 w-4" />
            </Button>
          ))}
          <Separator orientation="vertical" className="h-5 mx-1" />
          <Button variant="ghost" size="sm" className="text-xs font-body shrink-0">
            Focus Mode
          </Button>
        </div>

        {/* Editor Area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-lg border border-border p-8 md:p-12 min-h-[60vh] shadow-sm"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-8">{doc.title}</h1>
          <div className="font-body text-foreground/90 leading-[1.9] text-base md:text-lg whitespace-pre-line">
            {doc.content}
          </div>
        </motion.div>

        {/* Bottom Stats */}
        <div className="flex items-center justify-between mt-6 text-xs font-body text-muted-foreground">
          <span>Section 1 of 1</span>
          <span>{doc.wordCount.toLocaleString()} words · {Math.ceil(doc.wordCount / 250)} min read</span>
        </div>
      </div>
    </div>
  );
};

export default DocumentView;
