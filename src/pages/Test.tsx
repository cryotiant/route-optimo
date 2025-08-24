import React from 'react';
import NavigationBar from "@/components/NavigationBar";

const Test = () => {
  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />
      <div className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Test Page - Transjakarta Transit Optimizer
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            If you can see this, the basic app structure is working!
          </p>
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-4">System Status</h2>
            <div className="space-y-2 text-left">
              <div className="flex justify-between">
                <span>React:</span>
                <span className="text-green-500">✓ Working</span>
              </div>
              <div className="flex justify-between">
                <span>Tailwind CSS:</span>
                <span className="text-green-500">✓ Working</span>
              </div>
              <div className="flex justify-between">
                <span>Navigation:</span>
                <span className="text-green-500">✓ Working</span>
              </div>
              <div className="flex justify-between">
                <span>Routing:</span>
                <span className="text-green-500">✓ Working</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                The app is loading correctly. You can now add the complex components back.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Test;
