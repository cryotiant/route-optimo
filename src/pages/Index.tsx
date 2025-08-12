import NavigationBar from "@/components/NavigationBar";
import HeroSection from "@/components/HeroSection";
import DashboardPreview from "@/components/DashboardPreview";
import FeaturesSection from "@/components/FeaturesSection";

const Index = () => {
  return (
    <div className="min-h-screen">
      <NavigationBar />
      <HeroSection />
      <DashboardPreview />
      <FeaturesSection />
    </div>
  );
};

export default Index;
