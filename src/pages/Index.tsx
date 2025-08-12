import NavigationBar from "@/components/NavigationBar";
import HeroSection from "@/components/HeroSection";
import DashboardPreview from "@/components/DashboardPreview";
import FeaturesSection from "@/components/FeaturesSection";
import InteractiveMap from "@/components/InteractiveMap";
import MLPredictions from "@/components/MLPredictions";
import RealTimeSchedules from "@/components/RealTimeSchedules";
import SmartCityDashboard from "@/components/SmartCityDashboard";

const Index = () => {
  return (
    <div className="min-h-screen">
      <NavigationBar />
      <HeroSection />
      <SmartCityDashboard />
      <DashboardPreview />
      <InteractiveMap />
      <MLPredictions />
      <RealTimeSchedules />
      <FeaturesSection />
    </div>
  );
};

export default Index;
