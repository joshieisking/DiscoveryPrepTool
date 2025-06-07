import { Shield, Zap, Users, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/header";

export default function About() {
  const features = [
    {
      icon: <Zap className="w-8 h-8 text-primary" />,
      title: "AI-Powered Analysis",
      description: "Advanced natural language processing extracts key insights from annual reports in minutes, not hours."
    },
    {
      icon: <Target className="w-8 h-8 text-primary" />,
      title: "Discovery-Ready Insights",
      description: "Get tailored talking points and strategic questions designed specifically for sales discovery conversations."
    },
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      title: "Secure Processing",
      description: "Enterprise-grade security ensures your sensitive documents are processed safely and confidentially."
    },
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: "Sales Team Ready",
      description: "Built for sales professionals who need quick, actionable intelligence for better prospect conversations."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">About Discovery Prep Assistant</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Transform the way your sales team prepares for discovery calls with AI-powered annual report analysis. 
            Turn lengthy documents into actionable insights in minutes.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  {feature.icon}
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How It Works */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Upload Annual Reports</h3>
                  <p className="text-slate-600">
                    Simply drag and drop or select PDF, DOC, or DOCX files of company annual reports, 
                    10-K filings, or quarterly reports.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">AI Analysis</h3>
                  <p className="text-slate-600">
                    Our AI engine processes the document, extracting key financial metrics, strategic initiatives, 
                    challenges, and growth opportunities.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Get Discovery Insights</h3>
                  <p className="text-slate-600">
                    Receive a comprehensive analysis with suggested discovery questions, 
                    key talking points, and strategic insights tailored for sales conversations.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Use Cases */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Perfect For</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Sales Development Reps</h3>
                <p className="text-slate-600">
                  Prepare for cold calls and discovery conversations with deep prospect insights.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Account Executives</h3>
                <p className="text-slate-600">
                  Understand your prospects' business challenges and opportunities before meetings.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Sales Managers</h3>
                <p className="text-slate-600">
                  Equip your team with comprehensive prospect intelligence and talking points.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Business Development</h3>
                <p className="text-slate-600">
                  Identify strategic opportunities and partnership potential with target companies.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <Target className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-slate-600 font-medium">Discovery Prep Assistant</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-slate-500">
              <a href="#" className="hover:text-slate-700 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-700 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-slate-700 transition-colors">Support</a>
              <span>© 2024 Sales Intelligence Tools</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
