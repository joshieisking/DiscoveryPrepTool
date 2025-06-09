import { Target, Zap, Lightbulb, TrendingUp } from "lucide-react";
import Header from "@/components/header";
import FileUpload from "@/components/file-upload";
import UploadHistory from "@/components/upload-history";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              Your ACES for every Discovery Call
            </h2>
            <p className="text-xl text-slate-600 mb-6">
              Turn intimidating annual reports into your secret weapon. Our AI
              finds the business gold buried in financial jargon, delivering
              your ACES playbook to Advocate with authority, Collaborate with
              context, Empathize with evidence, and Strategize with substance.
            </p>
            <div className="flex justify-center space-x-8 text-sm text-slate-500">
              <div className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-primary" />
                <span>
                  <strong>ACES Intelligence</strong>
                </span>
              </div>
              <div className="flex items-center">
                <Zap className="w-5 h-5 mr-2 text-primary" />
                <span>
                  <strong>5-Minute Advantage</strong>
                </span>
              </div>
              <div className="flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-primary" />
                <span>
                  <strong>Trusted Advisor Mode</strong>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* File Upload Section */}
        <FileUpload />

        {/* Upload History Section */}
        <UploadHistory />
      </main>
      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-slate-600 font-medium">
                Discovery Prep Assistant
              </span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-slate-500">
              <a href="#" className="hover:text-slate-700 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-slate-700 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-slate-700 transition-colors">
                Support
              </a>
              <span>© 2025 ACES</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
