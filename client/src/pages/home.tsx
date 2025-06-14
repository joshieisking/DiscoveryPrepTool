import { Target, Zap, Lightbulb, TrendingUp } from "lucide-react";
import Header from "@/components/header";
import FileUpload from "@/components/file-upload";
import UploadHistory from "@/components/upload-history";
import { Logo } from "@/components/ui/logo";

export default function Home() {
  return (
    <div className="min-h-screen bg-background geometric-bg flex flex-col">
      <Header />
      <main className="main-content flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 content-boundary">
          {/* Hero Section */}
          <section className="text-center mb-16 relative">
            <div className="hero-shapes"></div>
            <div className="max-w-4xl mx-auto relative z-10">
              <h2 className="text-5xl font-bold text-foreground mb-6 leading-tight">
                Your <span className="text-primary">ACES</span> for every 
                <span className="text-accent"> Discovery Call</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Transform annual reports into strategic sales intelligence. Our AI 
                extracts actionable insights from complex financial documents, 
                delivering your competitive advantage in minutes.
              </p>
              <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                <div className="flex flex-col items-center p-4 card-enhanced">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <span className="font-semibold text-foreground">ACES Intelligence</span>
                  <span className="text-sm text-muted-foreground mt-1">Strategic insights extraction</span>
                </div>
                <div className="flex flex-col items-center p-4 card-enhanced">
                  <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-3">
                    <Zap className="w-6 h-6 text-secondary" />
                  </div>
                  <span className="font-semibold text-foreground">5-Minute Analysis</span>
                  <span className="text-sm text-muted-foreground mt-1">Rapid document processing</span>
                </div>
                <div className="flex flex-col items-center p-4 card-enhanced">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-3">
                    <Lightbulb className="w-6 h-6 text-accent" />
                  </div>
                  <span className="font-semibold text-foreground">Trusted Insights</span>
                  <span className="text-sm text-muted-foreground mt-1">Data-driven recommendations</span>
                </div>
              </div>
            </div>
          </section>

          {/* File Upload Section */}
          <FileUpload />

          {/* Upload History Section */}
          <UploadHistory />
        </div>
      </main>
      {/* Footer */}
      <footer className="bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <Logo size="medium" variant="footer" showText={true} />
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Support
              </a>
              <span>© 2025 Disco ACES</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
