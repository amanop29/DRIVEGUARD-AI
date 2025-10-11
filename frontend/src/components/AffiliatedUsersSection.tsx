import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Users } from 'lucide-react';

interface AnalysisRecord {
  id: string;
  fileName: string;
  date: string;
  score: number;
  duration: string;
  carNumber?: string;
  driverId?: string;
  vehicleId?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  organizationId?: string;
  organizationName?: string;
  isFromAffiliatedUser?: boolean;
}

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  accountType: 'individual' | 'enterprise';
  businessType?: 'insurance' | 'fleet-operator';
  carNumber?: string;
  affiliatedOrganizationId?: string;
  affiliatedOrganizationName?: string;
  affiliatedOrganizationType?: 'insurance' | 'fleet-operator';
  organizationId?: string;
}

interface AffiliatedUsersSectionProps {
  analysisHistory: AnalysisRecord[];
  userData: UserData | null;
  onViewAnalysis: (analysisId: string) => void;
}

export function AffiliatedUsersSection({ analysisHistory, userData, onViewAnalysis }: AffiliatedUsersSectionProps) {
  const affiliatedUserAnalyses = analysisHistory.filter(a => a.isFromAffiliatedUser);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <span>Affiliated Individual Users</span>
            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
              External
            </Badge>
          </span>
          <Badge variant="secondary">{affiliatedUserAnalyses.length}</Badge>
        </CardTitle>
        <CardDescription>
          Analyses from individual users affiliated with your organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {affiliatedUserAnalyses.slice(0, 5).map((analysis) => (
            <div 
              key={analysis.id} 
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors bg-blue-50/50 dark:bg-blue-900/10"
              onClick={() => onViewAnalysis(analysis.id)}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  analysis.score >= 80 ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                  analysis.score >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' :
                  'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                }`}>
                  {analysis.score}
                </div>
                <div>
                  <div className="font-medium">{analysis.fileName}</div>
                  <div className="text-sm text-muted-foreground space-x-2">
                    <span>{analysis.date}</span>
                    <span>•</span>
                    <span>{analysis.duration}</span>
                    <span>•</span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      👤 Driver Analysis
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                  Individual User
                </Badge>
                <Badge variant={analysis.score >= 80 ? 'default' : analysis.score >= 60 ? 'secondary' : 'destructive'}>
                  {analysis.score}%
                </Badge>
              </div>
            </div>
          ))}
          {affiliatedUserAnalyses.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-medium mb-2">No Affiliated Users Yet</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Individual users can join your organization using the affiliation code. 
                Share your organization's affiliation code with users who should be linked to your account.
              </p>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Your Affiliation Codes:</p>
                <div className="space-y-1">
                  {userData?.businessType === 'insurance' && (
                    <Badge variant="outline" className="font-mono">SDI2024</Badge>
                  )}
                  {userData?.businessType === 'fleet-operator' && (
                    <Badge variant="outline" className="font-mono">MFS2024</Badge>
                  )}
                  {!userData?.businessType && (
                    <Badge variant="outline" className="font-mono">ORG2024</Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}