import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Target } from 'lucide-react';

interface PredictionData {
  time: string;
  predicted: number;
  actual: number;
}

const MLPredictions: React.FC = () => {
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [modelAccuracy, setModelAccuracy] = useState(0);

  useEffect(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const data: PredictionData[] = hours.map(hour => {
      let baseDemand = 20;
      if (hour >= 7 && hour <= 9) baseDemand += Math.sin((hour - 7) * Math.PI / 2) * 180;
      if (hour >= 17 && hour <= 19) baseDemand += Math.sin((hour - 17) * Math.PI / 2) * 160;
      if (hour >= 11 && hour <= 15) baseDemand += 60;
      if (hour >= 22 || hour <= 5) baseDemand *= 0.3;
      const predicted = Math.round(baseDemand + (Math.random() * 20 - 10));
      const actual = Math.round(predicted + (Math.random() * 30 - 15));
      return {
        time: `${hour.toString().padStart(2, '0')}:00`,
        predicted,
        actual
      };
    });
    setPredictions(data);
    const accuracy = data.reduce((acc, point) => {
      const error = Math.abs(point.predicted - point.actual) / Math.max(point.actual, 1);
      return acc + (1 - Math.min(1, error));
    }, 0) / data.length * 100;
    setModelAccuracy(Math.round(accuracy));
  }, []);

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4">
            <Target className="w-3 h-3 mr-1" />
            ML Model Accuracy
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Forecast Accuracy Over 24 Hours
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Showing predicted vs. actual demand used to compute accuracy ({modelAccuracy}%).
          </p>
        </div>
        <Card className="p-6 shadow-elegant">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={predictions}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="predicted" stroke="hsl(var(--primary))" strokeWidth={2} name="Predicted" dot={false} />
                <Line type="monotone" dataKey="actual" stroke="hsl(var(--transit-orange))" strokeWidth={2} name="Actual" dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default MLPredictions;