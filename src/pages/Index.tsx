import NavigationBar from "@/components/NavigationBar";
import InteractiveMap from "@/components/InteractiveMap";
import MLPredictions from "@/components/MLPredictions";
import RealTimeSchedules from "@/components/RealTimeSchedules";

const Index = () => {
  return (
    <div className="min-h-screen">
      <NavigationBar />
      <InteractiveMap />
      <RealTimeSchedules />
      <MLPredictions />
    </div>
  );
};

export default Index;
