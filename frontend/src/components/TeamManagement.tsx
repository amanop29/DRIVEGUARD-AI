import React, { useState } from 'react';
import { Shield, Users, Car, TrendingUp, Plus, Edit2, Trash2, UserCheck, UserX, Award, Activity, Bell, IndianRupee } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Progress } from './ui/progress';
import { PerformanceAlerts } from './PerformanceAlerts';
import { Logo } from './Logo';

interface Driver {
  id: string;
  name: string;
  email: string;
  license: string;
  joinDate: string;
  assignedVehicle?: string;
  totalAnalyses: number;
  averageScore: number;
  lastAnalysis?: string;
  status: 'active' | 'inactive';
}

interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  year: number;
  assignedDriverId?: string;
  insuranceAmount?: number;
}

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  accountType: 'individual' | 'enterprise';
  businessType?: 'insurance' | 'fleet-operator';
  carNumber?: string;
}

interface AnalysisRecord {
  id: string;
  fileName: string;
  date: string;
  score: number;
  duration: string;
  carNumber?: string;
  driverId?: string;
}

interface TeamManagementProps {
  userData: UserData | null;
  drivers: Driver[];
  vehicles: Vehicle[];
  onSetDrivers: (drivers: Driver[]) => void;
  onSetVehicles: (vehicles: Vehicle[]) => void;
  onBackToUpload: () => void;
  onViewProfile: () => void;
  onViewDashboard: () => void;
  analysisHistory: AnalysisRecord[];
  onLogoClick: () => void;
}

export function TeamManagement({ 
  userData, 
  drivers, 
  vehicles, 
  onSetDrivers, 
  onSetVehicles, 
  onBackToUpload, 
  onViewProfile,
  onViewDashboard,
  analysisHistory,
  onLogoClick
}: TeamManagementProps) {
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [newDriver, setNewDriver] = useState({ name: '', email: '', license: '' });
  const [newVehicle, setNewVehicle] = useState({ plateNumber: '', model: '', year: '', insuranceAmount: '' });

  // No sample data - clean slate for new users

  // Check if user has enterprise account
  if (userData?.accountType !== 'enterprise') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <nav className="border-b bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Logo 
              onClick={onLogoClick}
              size="md"
            />
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={onBackToUpload}>
                Back to Upload
              </Button>
              <Button variant="outline" onClick={onViewProfile}>
                Profile
              </Button>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="mb-4">Enterprise Feature</h2>
            <p className="text-muted-foreground mb-6">
              Team Management is only available for Enterprise accounts. Upgrade your account to manage drivers, assign vehicles, and view team performance.
            </p>
            <Button onClick={onViewProfile} className="bg-gradient-to-r from-primary to-primary/80">
              Upgrade to Enterprise
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleAddDriver = () => {
    if (newDriver.name && newDriver.email && newDriver.license) {
      const driver: Driver = {
        id: Date.now().toString(),
        name: newDriver.name,
        email: newDriver.email,
        license: newDriver.license,
        joinDate: new Date().toLocaleDateString(),
        totalAnalyses: 0,
        averageScore: 0,
        status: 'active'
      };
      onSetDrivers([...drivers, driver]);
      setNewDriver({ name: '', email: '', license: '' });
      setIsAddDriverOpen(false);
    }
  };

  const handleAddVehicle = () => {
    if (newVehicle.plateNumber && newVehicle.model && newVehicle.year) {
      const vehicle: Vehicle = {
        id: Date.now().toString(),
        plateNumber: newVehicle.plateNumber,
        model: newVehicle.model,
        year: parseInt(newVehicle.year),
        insuranceAmount: newVehicle.insuranceAmount ? parseFloat(newVehicle.insuranceAmount) : undefined
      };
      onSetVehicles([...vehicles, vehicle]);
      setNewVehicle({ plateNumber: '', model: '', year: '', insuranceAmount: '' });
      setIsAddVehicleOpen(false);
    }
  };

  const handleRemoveDriver = (driverId: string) => {
    onSetDrivers(drivers.filter(d => d.id !== driverId));
    // Unassign from vehicles
    onSetVehicles(vehicles.map(v => 
      v.assignedDriverId === driverId 
        ? { ...v, assignedDriverId: undefined }
        : v
    ));
  };

  const handleRemoveVehicle = (vehicleId: string) => {
    onSetVehicles(vehicles.filter(v => v.id !== vehicleId));
    // Update drivers
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle?.assignedDriverId) {
      onSetDrivers(drivers.map(d => 
        d.id === vehicle.assignedDriverId 
          ? { ...d, assignedVehicle: undefined }
          : d
      ));
    }
  };

  const handleAssignVehicle = (driverId: string, vehicleId: string) => {
    // Unassign previous assignments
    onSetVehicles(vehicles.map(v => 
      v.assignedDriverId === driverId 
        ? { ...v, assignedDriverId: undefined }
        : v.id === vehicleId
        ? { ...v, assignedDriverId: driverId }
        : v
    ));
    
    const vehicle = vehicles.find(v => v.id === vehicleId);
    onSetDrivers(drivers.map(d => 
      d.id === driverId 
        ? { ...d, assignedVehicle: vehicle?.plateNumber }
        : { ...d, assignedVehicle: d.assignedVehicle === vehicle?.plateNumber ? undefined : d.assignedVehicle }
    ));
  };

  const toggleDriverStatus = (driverId: string) => {
    onSetDrivers(drivers.map(d => 
      d.id === driverId 
        ? { ...d, status: d.status === 'active' ? 'inactive' : 'active' }
        : d
    ));
  };

  // Calculate team performance metrics
  const activeDrivers = drivers.filter(d => d.status === 'active');
  const totalAnalyses = analysisHistory.length;
  const avgTeamScore = analysisHistory.length > 0 
    ? analysisHistory.reduce((sum, analysis) => sum + analysis.score, 0) / analysisHistory.length
    : 0;

  // Get driver rankings based on average score and analysis count
  const rankedDrivers = [...drivers].sort((a, b) => {
    if (b.averageScore !== a.averageScore) {
      return b.averageScore - a.averageScore;
    }
    return b.totalAnalyses - a.totalAnalyses;
  });

  const unassignedVehicles = vehicles.filter(v => !v.assignedDriverId);

  // Calculate total insurance amount for insurance companies
  const totalInsuranceAmount = userData?.businessType === 'insurance' 
    ? vehicles.reduce((sum, vehicle) => sum + (vehicle.insuranceAmount || 0), 0)
    : 0;

  const isInsuranceBusiness = userData?.businessType === 'insurance';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-semibold">DRIVEGUARD AI</span>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-gradient-to-r from-primary/10 to-primary/5">
              {userData?.businessType === 'insurance' ? 'Insurance Company' : 'Enterprise Account'}
            </Badge>
            <Button variant="outline" onClick={onBackToUpload}>
              Back to Upload
            </Button>
            <Button variant="outline" onClick={onViewProfile}>
              Profile
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="hidden lg:flex items-center gap-2 mb-6 text-sm text-muted-foreground">
          <button onClick={onViewDashboard} className="hover:text-foreground">Dashboard</button>
          <span>/</span>
          <button onClick={onViewProfile} className="hover:text-foreground">Profile</button>
          <span>/</span>
          <span>Team Management</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2">Team Management</h1>
          <p className="text-muted-foreground">
            Manage your drivers, assign vehicles, and monitor team performance
          </p>
        </div>

        {/* Overview Cards */}
        <div className={`grid grid-cols-1 ${isInsuranceBusiness ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-6 mb-8`}>
          <Card className="bg-gradient-to-br from-card to-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <Users className="h-5 w-5 text-primary" />
                <span>{activeDrivers.length}</span>
              </CardTitle>
              <CardDescription>Active Drivers</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <Car className="h-5 w-5 text-primary" />
                <span>{vehicles.length}</span>
              </CardTitle>
              <CardDescription>Team Vehicles</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <Activity className="h-5 w-5 text-primary" />
                <span>{totalAnalyses}</span>
              </CardTitle>
              <CardDescription>Total Analyses</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span>{avgTeamScore.toFixed(1)}</span>
              </CardTitle>
              <CardDescription>Avg Team Score</CardDescription>
            </CardHeader>
          </Card>

          {isInsuranceBusiness && (
            <Card className="bg-gradient-to-br from-card to-card/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <IndianRupee className="h-5 w-5 text-primary" />
                  <span>₹{totalInsuranceAmount.toLocaleString()}</span>
                </CardTitle>
                <CardDescription>Total Coverage</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="drivers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Drivers Tab */}
          <TabsContent value="drivers" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2>Driver Management</h2>
              <Dialog open={isAddDriverOpen} onOpenChange={setIsAddDriverOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-primary to-primary/80">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Driver
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Driver</DialogTitle>
                    <DialogDescription>
                      Add a new driver to your team
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="driver-name">Full Name</Label>
                      <Input
                        id="driver-name"
                        value={newDriver.name}
                        onChange={(e) => setNewDriver({...newDriver, name: e.target.value})}
                        placeholder="Enter driver's full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="driver-email">Email</Label>
                      <Input
                        id="driver-email"
                        type="email"
                        value={newDriver.email}
                        onChange={(e) => setNewDriver({...newDriver, email: e.target.value})}
                        placeholder="Enter driver's email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="driver-license">License Number</Label>
                      <Input
                        id="driver-license"
                        value={newDriver.license}
                        onChange={(e) => setNewDriver({...newDriver, license: e.target.value})}
                        placeholder="Enter license number"
                      />
                    </div>
                    <Button onClick={handleAddDriver} className="w-full">
                      Add Driver
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Assigned Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Analyses</TableHead>
                    <TableHead>Avg Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell>
                        <div>
                          <div>{driver.name}</div>
                          <div className="text-sm text-muted-foreground">{driver.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{driver.license}</TableCell>
                      <TableCell>
                        {driver.assignedVehicle ? (
                          <Badge variant="secondary">{driver.assignedVehicle}</Badge>
                        ) : (
                          <Select onValueChange={(vehicleId) => handleAssignVehicle(driver.id, vehicleId)}>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Assign" />
                            </SelectTrigger>
                            <SelectContent>
                              {unassignedVehicles.map((vehicle) => (
                                <SelectItem key={vehicle.id} value={vehicle.id}>
                                  {vehicle.plateNumber}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={driver.status === 'active' ? 'default' : 'secondary'}>
                          {driver.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{driver.totalAnalyses}</TableCell>
                      <TableCell>{driver.averageScore.toFixed(1)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleDriverStatus(driver.id)}
                          >
                            {driver.status === 'active' ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveDriver(driver.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Vehicles Tab */}
          <TabsContent value="vehicles" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2>Vehicle Management</h2>
              <Dialog open={isAddVehicleOpen} onOpenChange={setIsAddVehicleOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-primary to-primary/80">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vehicle
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Vehicle</DialogTitle>
                    <DialogDescription>
                      Add a new vehicle to your fleet
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="vehicle-plate">Plate Number</Label>
                      <Input
                        id="vehicle-plate"
                        value={newVehicle.plateNumber}
                        onChange={(e) => setNewVehicle({...newVehicle, plateNumber: e.target.value})}
                        placeholder="Enter plate number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicle-model">Model</Label>
                      <Input
                        id="vehicle-model"
                        value={newVehicle.model}
                        onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                        placeholder="Enter vehicle model"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicle-year">Year</Label>
                      <Input
                        id="vehicle-year"
                        type="number"
                        value={newVehicle.year}
                        onChange={(e) => setNewVehicle({...newVehicle, year: e.target.value})}
                        placeholder="Enter year"
                      />
                    </div>
                    {isInsuranceBusiness && (
                      <div>
                        <Label htmlFor="vehicle-insurance">Insurance Amount</Label>
                        <Input
                          id="vehicle-insurance"
                          type="number"
                          value={newVehicle.insuranceAmount}
                          onChange={(e) => setNewVehicle({...newVehicle, insuranceAmount: e.target.value})}
                          placeholder="Enter insurance amount"
                        />
                      </div>
                    )}
                    <Button onClick={handleAddVehicle} className="w-full">
                      Add Vehicle
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plate Number</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Year</TableHead>
                    {isInsuranceBusiness && <TableHead>Insurance Amount</TableHead>}
                    <TableHead>Assigned Driver</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle) => {
                    const assignedDriver = drivers.find(d => d.id === vehicle.assignedDriverId);
                    return (
                      <TableRow key={vehicle.id}>
                        <TableCell>{vehicle.plateNumber}</TableCell>
                        <TableCell>{vehicle.model}</TableCell>
                        <TableCell>{vehicle.year}</TableCell>
                        {isInsuranceBusiness && (
                          <TableCell>
                            {vehicle.insuranceAmount ? `₹${vehicle.insuranceAmount.toLocaleString()}` : 'N/A'}
                          </TableCell>
                        )}
                        <TableCell>
                          {assignedDriver ? (
                            <Badge variant="secondary">{assignedDriver.name}</Badge>
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveVehicle(vehicle.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <h2>Team Performance Overview</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Driver Activity</CardTitle>
                  <CardDescription>Active vs Inactive drivers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Active Drivers</span>
                      <span>{activeDrivers.length}</span>
                    </div>
                    <Progress value={(activeDrivers.length / drivers.length) * 100 || 0} />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Inactive: {drivers.length - activeDrivers.length}</span>
                      <span>Total: {drivers.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Utilization</CardTitle>
                  <CardDescription>Assigned vs Available vehicles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Assigned Vehicles</span>
                      <span>{vehicles.filter(v => v.assignedDriverId).length}</span>
                    </div>
                    <Progress value={(vehicles.filter(v => v.assignedDriverId).length / vehicles.length) * 100 || 0} />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Available: {unassignedVehicles.length}</span>
                      <span>Total: {vehicles.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Team Activity</CardTitle>
                <CardDescription>Latest driving analyses from your team</CardDescription>
              </CardHeader>
              <CardContent>
                {analysisHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysisHistory.slice(0, 10).map((analysis) => {
                        const driver = analysis.driverId ? drivers.find(d => d.id === analysis.driverId) : null;
                        return (
                          <TableRow key={analysis.id}>
                            <TableCell>{analysis.date}</TableCell>
                            <TableCell>{driver?.name || 'Unknown'}</TableCell>
                            <TableCell>{analysis.carNumber || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant={analysis.score >= 80 ? 'default' : analysis.score >= 60 ? 'secondary' : 'destructive'}>
                                {analysis.score}
                              </Badge>
                            </TableCell>
                            <TableCell>{analysis.duration}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No analysis data available yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>
      </div>
    </div>
  );
}