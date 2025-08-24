import React, { Suspense } from "react";
import NavigationBar from "@/components/NavigationBar";
import InteractiveMap from "@/components/InteractiveMap";
import RealTimeSchedules from "@/components/RealTimeSchedules";
import AllStopsList from "@/components/AllStopsList";

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Something went wrong
            </h1>
            <p className="text-muted-foreground mb-4">
              {this.state.error?.message || 'An error occurred'}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-primary text-primary-foreground px-4 py-2 rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading Component
const LoadingComponent = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading Transjakarta Transit Optimizer...</p>
    </div>
  </div>
);

const Index = () => {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <NavigationBar />
        <Suspense fallback={<LoadingComponent />}>
          <InteractiveMap />
          <AllStopsList />
          <RealTimeSchedules />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
};

export default Index;
