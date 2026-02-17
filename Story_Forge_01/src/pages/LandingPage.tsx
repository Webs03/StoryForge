import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Pen, FolderOpen, History, Share2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-image.jpg";

const features = [
  {
    icon: Pen,
    title: "Specialized Editors",
    description: "Dedicated editors for short stories and playscripts with professional formatting tools.",
  },
  {
    icon: FolderOpen,
    title: "Smart Organization",
    description: "Tags, collections, status labels, and powerful search across all your works.",
  },
  {
    icon: History,
    title: "Version Control",
    description: "Auto-save, manual checkpoints, side-by-side comparison, and instant rollback.",
  },
  {
    icon: Share2,
    title: "Export & Share",
    description: "Export to PDF, DOCX, EPUB. Share with password protection and expiration dates.",
  },
  {
    icon: BookOpen,
    title: "Writing Analytics",
    description: "Track your productivity, writing streaks, and most productive times.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your stories are encrypted and backed up. You own your data, always.",
  },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-6">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-display text-xl font-bold text-foreground">StoryForge</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 font-body text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#workflow" className="text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/signin">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImage} alt="Writing desk" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-3xl mx-auto text-center"
          >
            <p className="text-primary font-body font-semibold tracking-widest uppercase text-sm mb-4">
              For Writers, By Design
            </p>
            <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground leading-tight mb-6 text-balance">
              Where Stories Find Their Shape
            </h1>
            <p className="font-body text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              A secure, intuitive platform for writers to craft, organize, and manage short stories and playscripts — with professional formatting and version control.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-base px-8 py-6" asChild>
                <Link to="/dashboard">Start Writing Free</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8 py-6" asChild>
                <a href="#features">Explore Features</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 bg-card">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-primary font-body font-semibold tracking-widest uppercase text-sm mb-3">Crafted for Writers</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground">
              Everything You Need to Write
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-background rounded-lg p-8 border border-border hover:border-primary/30 transition-colors group"
              >
                <div className="h-12 w-12 rounded-lg bg-warm-light flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="font-body text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="workflow" className="py-20 md:py-32">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-primary font-body font-semibold tracking-widest uppercase text-sm mb-3">Simple Workflow</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground">
              From Idea to Final Draft
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Create or Upload", desc: "Start a new story or playscript, or upload existing files." },
              { step: "02", title: "Write & Organize", desc: "Use specialized editors with auto-save and version history." },
              { step: "03", title: "Export & Share", desc: "Export to any format or share with collaborators securely." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="text-center"
              >
                <div className="font-display text-6xl font-bold text-primary/20 mb-4">{item.step}</div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="font-body text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-card">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-6">
              Ready to Forge Your Story?
            </h2>
            <p className="font-body text-lg text-muted-foreground mb-10">
              Join writers who trust StoryForge to keep their words safe, organized, and beautifully formatted.
            </p>
            <Button size="lg" className="text-base px-10 py-6" asChild>
              <Link to="/dashboard">Get Started — It's Free</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-bold text-foreground">StoryForge</span>
          </div>
          <p className="font-body text-sm text-muted-foreground">
            © 2026 StoryForge. Crafted for storytellers.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
