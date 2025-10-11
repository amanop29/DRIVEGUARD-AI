import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Shield, 
  TrendingDown, 
  Users, 
  BarChart3, 
  Car, 
  DollarSign,
  ArrowRight,
  Star,
  Award,
  AlertTriangle,
  User,
  Trophy,
  BookOpen,
  Target
} from 'lucide-react';

export function FeaturesSections() {
  const insuranceFeatures = [
    {
      icon: BarChart3,
      title: 'Risk Assessment',
      description: 'Analyze real driving behavior to calculate accurate risk profiles and premium rates'
    },
    {
      icon: TrendingDown,
      title: 'Reduce Claims',
      description: 'Identify high-risk drivers before incidents occur, reducing overall claim costs'
    },
    {
      icon: DollarSign,
      title: 'Dynamic Pricing',
      description: 'Offer personalized premiums based on actual driving performance, not demographics'
    },
    {
      icon: Shield,
      title: 'Fraud Detection',
      description: 'Verify claims with actual driving data and detect potential insurance fraud'
    }
  ];

  const cabFeatures = [
    {
      icon: Users,
      title: 'Driver Monitoring',
      description: 'Track and improve driver performance across your entire fleet in real-time'
    },
    {
      icon: Award,
      title: 'Safety Training',
      description: 'Identify specific areas where drivers need improvement and provide targeted training'
    },
    {
      icon: AlertTriangle,
      title: 'Incident Prevention',
      description: 'Proactively address risky driving behaviors before they lead to accidents'
    },
    {
      icon: Star,
      title: 'Performance Rewards',
      description: 'Implement performance-based incentives to encourage safe driving practices'
    }
  ];

  const individualFeatures = [
    {
      icon: Target,
      title: 'Personal Improvement',
      description: 'Get detailed insights into your driving habits and receive personalized recommendations'
    },
    {
      icon: DollarSign,
      title: 'Lower Insurance Costs',
      description: 'Build a verifiable safe driving record to qualify for better insurance rates'
    },
    {
      icon: BookOpen,
      title: 'Skill Development',
      description: 'Learn from AI-powered analysis to become a safer, more confident driver'
    },
    {
      icon: Trophy,
      title: 'Achievement Tracking',
      description: 'Monitor your progress over time and celebrate your driving milestones'
    }
  ];

  return (
    <>
      {/* Individual Drivers Section */}
      <section className="py-20 px-4 bg-secondary/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="outline">For Individual Drivers</Badge>
                <h2 className="text-3xl md:text-4xl font-bold">
                  Improve Your Driving & Save Money
                </h2>
                <p className="text-muted-foreground text-lg">
                  Take control of your driving journey with personalized insights, track your progress,
                  and build a proven safety record that could lower your insurance premiums.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {individualFeatures.map((feature, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <feature.icon className="h-6 w-6 text-primary" />
                      <h3 className="font-semibold">{feature.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
              
              
            </div>
            
            <div className="relative">
              <div className="rounded-lg shadow-2xl w-full h-96 bg-gradient-to-br from-purple-100 to-orange-200 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <User className="h-16 w-16 text-purple-600 mx-auto" />
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-purple-800">Personal Dashboard</h3>
                    <p className="text-purple-600">Track your driving improvements</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Insurance Companies Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="rounded-lg shadow-2xl w-full h-96 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <BarChart3 className="h-16 w-16 text-blue-600 mx-auto" />
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-blue-800">Insurance Analytics</h3>
                    <p className="text-blue-600">Real-time risk assessment dashboard</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-8 order-1 lg:order-2">
              <div className="space-y-4">
                <Badge variant="outline">For Insurance Companies</Badge>
                <h2 className="text-3xl md:text-4xl font-bold">
                  Transform Risk Assessment with Real Data
                </h2>
                <p className="text-muted-foreground text-lg">
                  Move beyond traditional demographic-based pricing. Use actual driving behavior to set premiums,
                  reduce claims, and improve customer satisfaction with fair, personalized rates.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {insuranceFeatures.map((feature, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <feature.icon className="h-6 w-6 text-primary" />
                      <h3 className="font-semibold">{feature.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
              
              
            </div>
          </div>
        </div>
      </section>

      {/* Fleet Operators Section */}
      <section className="py-20 px-4 bg-secondary/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="outline">For Fleet Operators</Badge>
                <h2 className="text-3xl md:text-4xl font-bold">
                  Ensure Driver Safety & Performance
                </h2>
                <p className="text-muted-foreground text-lg">
                  Monitor your entire fleet's driving behavior, improve safety standards, reduce accidents,
                  and enhance customer experience through data-driven driver management.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cabFeatures.map((feature, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <feature.icon className="h-6 w-6 text-primary" />
                      <h3 className="font-semibold">{feature.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
              
              
            </div>
            
            <div className="relative">
              <div className="rounded-lg shadow-2xl w-full h-96 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Car className="h-16 w-16 text-green-600 mx-auto" />
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-green-800">Fleet Management</h3>
                    <p className="text-green-600">Driver performance monitoring</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}