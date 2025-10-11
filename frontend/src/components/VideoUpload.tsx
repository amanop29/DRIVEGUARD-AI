import React, { useState, useCallback } from "react";
import {
  Upload,
  FileVideo,
  X,
  User,
  Car,
  Crown,
  ArrowLeft,
  Users,
  Plus,
  UserPlus,
  Truck,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  accountType: "individual" | "enterprise";
  carNumber?: string;
}

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
}

interface VideoUploadProps {
  onUploadComplete: (file: File, carNumber?: string, driverId?: string, vehicleId?: string) => void;
  onViewProfile: () => void;
  onBackToDashboard: () => void;
  userData: UserData | null;
  onViewTeam?: () => void;
  drivers?: Driver[];
  vehicles?: Vehicle[];
  onAddDriver?: (driver: Omit<Driver, 'id' | 'totalAnalyses' | 'averageScore' | 'joinDate' | 'lastAnalysis'>) => string;
  onAddVehicle?: (vehicle: Omit<Vehicle, 'id'>) => string;
  onLogoClick?: () => void;
}

export function VideoUpload({
  onUploadComplete,
  onViewProfile,
  onBackToDashboard,
  userData,
  onViewTeam,
  drivers = [],
  vehicles = [],
  onAddDriver,
  onAddVehicle,
  onLogoClick,
}: VideoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(
    null,
  );
  const [carNumber, setCarNumber] = useState<string>(
    userData?.carNumber || "",
  );
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [newDriverData, setNewDriverData] = useState({
    name: '',
    email: '',
    license: '',
    status: 'active' as const
  });
  const [newVehicleData, setNewVehicleData] = useState({
    plateNumber: '',
    model: '',
    year: new Date().getFullYear(),
    assignedDriverId: ''
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find((file) =>
      file.type.startsWith("video/"),
    );

    if (videoFile) {
      setSelectedFile(videoFile);
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type.startsWith("video/")) {
        setSelectedFile(file);
      }
    },
    [],
  );

  const handleUpload = useCallback(() => {
    if (!selectedFile) return;

    // For enterprise accounts, show driver selection modal
    if (userData?.accountType === 'enterprise') {
      setIsDriverModalOpen(true);
      return;
    }

    // For individual accounts, proceed directly
    processUpload();
  }, [selectedFile, userData?.accountType]);

  const processUpload = useCallback(async (driverId?: string, vehicleId?: string) => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('video', selectedFile);
      
      // Add metadata
      if (carNumber) formData.append('carNumber', carNumber);
      if (driverId) formData.append('driverId', driverId);
      if (vehicleId) formData.append('vehicleId', vehicleId);

      // Upload video to backend
      const uploadResponse = await fetch('http://localhost:3001/api/upload-video', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const { jobId } = await uploadResponse.json();
      
      // Poll for processing status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`http://localhost:3001/api/status/${jobId}`);
          const statusData = await statusResponse.json();
          
          setUploadProgress(statusData.progress);
          
          if (statusData.status === 'completed') {
            clearInterval(pollInterval);
            setTimeout(() => {
              onUploadComplete(selectedFile, carNumber, driverId, vehicleId);
            }, 500);
          } else if (statusData.status === 'failed') {
            clearInterval(pollInterval);
            throw new Error(statusData.error || 'Processing failed');
          }
        } catch (error) {
          clearInterval(pollInterval);
          console.error('Status polling error:', error);
          setIsUploading(false);
          alert('Failed to check processing status. Please try again.');
        }
      }, 1000); // Poll every second

    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      setUploadProgress(0);
      alert('Video upload failed. Please try again.');
    }
  }, [selectedFile, carNumber, onUploadComplete]);

  const handleDriverSelection = () => {
    let finalDriverId = selectedDriverId;
    let finalVehicleId = selectedVehicleId;

    // If "add-new" is selected for driver, create new driver
    if (selectedDriverId === 'add-new' && onAddDriver) {
      if (!newDriverData.name || !newDriverData.email || !newDriverData.license) {
        return; // Validation failed
      }
      
      finalDriverId = onAddDriver({
        name: newDriverData.name,
        email: newDriverData.email,
        license: newDriverData.license,
        status: newDriverData.status
      });
    }

    // If "add-new" is selected for vehicle, create new vehicle
    if (selectedVehicleId === 'add-new' && onAddVehicle) {
      if (!newVehicleData.plateNumber || !newVehicleData.model) {
        return; // Validation failed
      }
      
      finalVehicleId = onAddVehicle({
        plateNumber: newVehicleData.plateNumber,
        model: newVehicleData.model,
        year: newVehicleData.year,
        assignedDriverId: finalDriverId !== 'add-new' ? finalDriverId : undefined
      });
    }

    setIsDriverModalOpen(false);
    processUpload(finalDriverId, finalVehicleId);
  };

  // Handle driver selection change to auto-fill assigned vehicle
  const handleDriverChange = (driverId: string) => {
    setSelectedDriverId(driverId);
    
    // If a real driver is selected (not 'add-new'), check if they have an assigned vehicle
    if (driverId !== 'add-new') {
      const selectedDriver = drivers.find(d => d.id === driverId);
      if (selectedDriver?.assignedVehicle) {
        // Find the vehicle by plate number (assignedVehicle is the plate number)
        const assignedVehicle = vehicles.find(v => v.plateNumber === selectedDriver.assignedVehicle);
        if (assignedVehicle) {
          setSelectedVehicleId(assignedVehicle.id);
        }
      } else {
        // If driver has no assigned vehicle, clear vehicle selection
        setSelectedVehicleId('');
      }
    } else {
      // If adding new driver, clear vehicle selection
      setSelectedVehicleId('');
    }
  };

  const resetNewDriverData = () => {
    setNewDriverData({
      name: '',
      email: '',
      license: '',
      status: 'active'
    });
    setNewVehicleData({
      plateNumber: '',
      model: '',
      year: new Date().getFullYear(),
      assignedDriverId: ''
    });
    setSelectedDriverId('');
    setSelectedVehicleId('');
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  const currentUser = userData || {
    firstName: "User",
    lastName: "",
    email: "user@example.com",
    company: "Company",
    accountType: "individual" as const,
    carNumber: "",
  };

  const initials = currentUser.accountType === "enterprise" && currentUser.company
    ? currentUser.company.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()
    : `${currentUser.firstName?.[0] || "U"}${currentUser.lastName?.[0] || ""}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Mobile-responsive Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBackToDashboard} size="sm" className="flex-shrink-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Badge
              variant={
                currentUser.accountType === "enterprise"
                  ? "default"
                  : "secondary"
              }
              className="text-xs flex-shrink-0"
            >
              <div className="flex items-center">
                {currentUser.accountType === "enterprise" ? (
                  <>
                    <Crown className="mr-1 h-3 w-3 flex-shrink-0" />
                    <span>
                      Enterprise
                    </span>
                  </>
                ) : (
                  <>
                    <User className="mr-1 h-3 w-3 flex-shrink-0" />
                    <span>Individual</span>
                  </>
                )}
              </div>
            </Badge>
            {currentUser.accountType === "enterprise" && onViewTeam && (
              <Button variant="outline" onClick={onViewTeam} className="relative" size="sm">
                <Users className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Team</span>
                {/* Critical Alert Indicator */}
                {drivers.some(d => d.status === 'active' && d.averageScore > 0 && d.averageScore <= 60) && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full border-2 border-background">
                    <div className="absolute inset-0 bg-destructive rounded-full animate-ping"></div>
                  </div>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onViewProfile}
              className="flex items-center space-x-2 sm:space-x-3"
              size="sm"
            >
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium">
                  {currentUser.accountType === "enterprise" && currentUser.company
                    ? currentUser.company
                    : `${currentUser.firstName} ${currentUser.lastName}`
                  }
                </p>
              </div>
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl">Driver Behavior Analysis</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Upload a driving video to get detailed analysis of driver performance, safety metrics, and behavior patterns.
          </p>
        </div>
      </div>

      {/* Single Upload Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4 sm:p-6 lg:p-8">
            {!selectedFile ? (
              <div
                className={`border-2 border-dashed rounded-lg p-6 sm:p-8 lg:p-12 text-center transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="mb-2">
                  Drop your driving video here
                </h3>
                <p className="text-muted-foreground mb-4">
                  Support for MP4, MOV, AVI files up to 500MB
                </p>
                <Button asChild>
                  <label className="cursor-pointer">
                    Choose File
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileVideo className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">
                        {selectedFile.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(
                          selectedFile.size /
                          (1024 * 1024)
                        ).toFixed(2)}{" "}
                        MB
                      </p>
                    </div>
                  </div>
                  {!isUploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading and processing...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}

                {!isUploading && (
                  <Button
                    onClick={handleUpload}
                    className="w-full"
                    size="lg"
                  >
                    Analyze Driving Behavior
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Vehicle Information Sidebar */}
        <div className="space-y-4">


          {currentUser.accountType === "enterprise" && (
            <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <h3 className="font-medium mb-4 flex items-center">
                <Users className="mr-2 h-4 w-4 text-primary" />
                Team Assignment
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Active Drivers:</span>
                    <Badge variant="secondary">{drivers.filter(d => d.status === 'active').length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Vehicles:</span>
                    <Badge variant="secondary">{vehicles.length}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  You'll be prompted to assign driver and vehicle before analysis begins.
                </p>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Driver performance tracking</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Vehicle usage analytics</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Performance optimization insights</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h3 className="font-medium mb-4">
              Analysis Features
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Speed Pattern Analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Lane Change Detection</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Braking Behavior</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Safety Violations</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Risk Assessment</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Driver & Vehicle Selection Dialog for Enterprise Accounts */}
      <Dialog open={isDriverModalOpen} onOpenChange={setIsDriverModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Assign Driver & Vehicle</span>
            </DialogTitle>
            <DialogDescription>
              Select the driver and vehicle that will be associated with this video analysis.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Driver Selection */}
            <div className="space-y-2">
              <Label>Select Driver</Label>
              <Select value={selectedDriverId} onValueChange={handleDriverChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.filter(d => d.status === 'active').map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{driver.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {driver.assignedVehicle || 'No vehicle'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                  <Separator className="my-2" />
                  <SelectItem value="add-new">
                    <div className="flex items-center">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add New Driver
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Vehicle Selection */}
            <div className="space-y-2">
              <Label>Select Vehicle</Label>
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{vehicle.plateNumber}</span>
                        <div className="flex items-center space-x-2 ml-2">
                          <Badge variant="outline" className="text-xs">
                            {vehicle.model} ({vehicle.year})
                          </Badge>
                          {vehicle.assignedDriverId && (
                            <Badge variant="secondary" className="text-xs">
                              {drivers.find(d => d.id === vehicle.assignedDriverId)?.name || 'Assigned'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                  <Separator className="my-2" />
                  <SelectItem value="add-new">
                    <div className="flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Vehicle
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedDriverId === 'add-new' && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium flex items-center">
                  <UserPlus className="h-4 w-4 mr-2" />
                  New Driver Details
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="new-driver-name">Full Name</Label>
                    <Input
                      id="new-driver-name"
                      placeholder="Enter full name"
                      value={newDriverData.name}
                      onChange={(e) => setNewDriverData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-driver-email">Email</Label>
                    <Input
                      id="new-driver-email"
                      type="email"
                      placeholder="Enter email"
                      value={newDriverData.email}
                      onChange={(e) => setNewDriverData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-driver-license">License Number</Label>
                  <Input
                    id="new-driver-license"
                    placeholder="Enter license number"
                    value={newDriverData.license}
                    onChange={(e) => setNewDriverData(prev => ({ ...prev, license: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {selectedVehicleId === 'add-new' && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium flex items-center">
                  <Truck className="h-4 w-4 mr-2" />
                  New Vehicle Details
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="new-vehicle-plate">Plate Number</Label>
                    <Input
                      id="new-vehicle-plate"
                      placeholder="e.g., ABC-123"
                      value={newVehicleData.plateNumber}
                      onChange={(e) => setNewVehicleData(prev => ({ ...prev, plateNumber: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-vehicle-model">Vehicle Model</Label>
                    <Input
                      id="new-vehicle-model"
                      placeholder="e.g., Toyota Camry"
                      value={newVehicleData.model}
                      onChange={(e) => setNewVehicleData(prev => ({ ...prev, model: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-vehicle-year">Year</Label>
                  <Input
                    id="new-vehicle-year"
                    type="number"
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    placeholder="2024"
                    value={newVehicleData.year}
                    onChange={(e) => setNewVehicleData(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDriverModalOpen(false);
                  resetNewDriverData();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDriverSelection}
                disabled={
                  !selectedDriverId || 
                  !selectedVehicleId ||
                  (selectedDriverId === 'add-new' && (!newDriverData.name || !newDriverData.email || !newDriverData.license)) ||
                  (selectedVehicleId === 'add-new' && (!newVehicleData.plateNumber || !newVehicleData.model))
                }
                className="bg-gradient-to-r from-primary to-primary/80"
              >
                {(selectedDriverId === 'add-new' || selectedVehicleId === 'add-new') ? 'Add Details & Continue' : 'Continue Analysis'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}