import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { 
  Upload, 
  FileVideo, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Users, 
  Car,
  Zap,
  Download,
  FileDown
} from 'lucide-react';

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

interface BulkUploadFile {
  file: File;
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  assignedDriverId?: string;
  assignedVehicleId?: string;
  detectedDriver?: string;
  detectedVehicle?: string;
  score?: number;
  error?: string;
}

interface AutoAssignmentRules {
  enableAutoDriverAssignment: boolean;
  enableAutoVehicleAssignment: boolean;
  fallbackDriverId?: string;
  fallbackVehicleId?: string;
  useFilenamePatterns: boolean;
  customPatterns: string[];
}

interface BulkUploadProps {
  drivers: Driver[];
  vehicles: Vehicle[];
  onUploadComplete: (files: BulkUploadFile[]) => void;
  onAddDriver?: (driver: Omit<Driver, 'id' | 'totalAnalyses' | 'averageScore' | 'joinDate' | 'lastAnalysis'>) => string;
  onAddVehicle?: (vehicle: Omit<Vehicle, 'id'>) => string;
}

export function BulkUpload({ drivers, vehicles, onUploadComplete, onAddDriver, onAddVehicle }: BulkUploadProps) {
  const [uploadFiles, setUploadFiles] = useState<BulkUploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoAssignmentRules, setAutoAssignmentRules] = useState<AutoAssignmentRules>({
    enableAutoDriverAssignment: true,
    enableAutoVehicleAssignment: true,
    useFilenamePatterns: true,
    customPatterns: ['driver_{name}', 'vehicle_{plate}', '{driver}_{vehicle}']
  });
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('video/')
    );
    
    addFilesToQueue(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      addFilesToQueue(files);
    }
  };

  const addFilesToQueue = (files: File[]) => {
    const newFiles: BulkUploadFile[] = files.map(file => ({
      file,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      status: 'pending',
      progress: 0,
      ...detectAssignmentsFromFilename(file.name)
    }));
    
    setUploadFiles(prev => [...prev, ...newFiles]);
  };

  const detectAssignmentsFromFilename = (filename: string) => {
    if (!autoAssignmentRules.useFilenamePatterns) {
      return {};
    }

    const result: { detectedDriver?: string; detectedVehicle?: string; assignedDriverId?: string; assignedVehicleId?: string } = {};
    
    // Simple pattern matching for demo purposes
    const lowerFilename = filename.toLowerCase();
    
    // Try to match driver names
    const matchedDriver = drivers.find(driver => 
      lowerFilename.includes(driver.name.toLowerCase()) ||
      lowerFilename.includes(driver.license.toLowerCase())
    );
    
    if (matchedDriver) {
      result.detectedDriver = matchedDriver.name;
      result.assignedDriverId = matchedDriver.id;
    }
    
    // Try to match vehicle plate numbers
    const matchedVehicle = vehicles.find(vehicle => 
      lowerFilename.includes(vehicle.plateNumber.toLowerCase()) ||
      lowerFilename.includes(vehicle.model.toLowerCase())
    );
    
    if (matchedVehicle) {
      result.detectedVehicle = matchedVehicle.plateNumber;
      result.assignedVehicleId = matchedVehicle.id;
    }
    
    return result;
  };

  const updateFileAssignment = (fileId: string, driverId?: string, vehicleId?: string) => {
    setUploadFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { 
            ...file, 
            assignedDriverId: driverId,
            assignedVehicleId: vehicleId
          }
        : file
    ));
  };

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const clearAll = () => {
    setUploadFiles([]);
  };

  const processUploads = async () => {
    setIsProcessing(true);
    
    // Apply fallback assignments
    const filesToProcess = uploadFiles.map(file => ({
      ...file,
      assignedDriverId: file.assignedDriverId || autoAssignmentRules.fallbackDriverId,
      assignedVehicleId: file.assignedVehicleId || autoAssignmentRules.fallbackVehicleId
    }));
    
    setUploadFiles(filesToProcess);

    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      
      // Update status to processing
      setUploadFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'processing' } : f
      ));
      
      try {
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setUploadFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, progress } : f
          ));
        }
        
        // Simulate analysis
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate score
        const score = Math.floor(Math.random() * 40) + 60;
        
        // Mark as completed
        setUploadFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'completed', score, progress: 100 }
            : f
        ));
        
      } catch (error) {
        setUploadFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'failed', error: 'Upload failed', progress: 0 }
            : f
        ));
      }
    }
    
    setIsProcessing(false);
    onUploadComplete(filesToProcess);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'processing': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <FileVideo className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      case 'processing': return 'secondary';
      default: return 'outline';
    }
  };

  const completedCount = uploadFiles.filter(f => f.status === 'completed').length;
  const failedCount = uploadFiles.filter(f => f.status === 'failed').length;
  const pendingCount = uploadFiles.filter(f => f.status === 'pending').length;
  const processingCount = uploadFiles.filter(f => f.status === 'processing').length;

  const canProcess = uploadFiles.length > 0 && !isProcessing && processingCount === 0;
  const hasResults = completedCount > 0 || failedCount > 0;

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Bulk Video Upload</span>
              </CardTitle>
              <CardDescription>
                Upload multiple driving videos for batch analysis
              </CardDescription>
            </div>
            <Dialog open={isRulesModalOpen} onOpenChange={setIsRulesModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Zap className="h-4 w-4 mr-2" />
                  Auto-Assignment Rules
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Auto-Assignment Configuration</DialogTitle>
                  <DialogDescription>
                    Configure how videos are automatically assigned to drivers and vehicles
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="auto-driver"
                        checked={autoAssignmentRules.enableAutoDriverAssignment}
                        onCheckedChange={(checked) => 
                          setAutoAssignmentRules(prev => ({ 
                            ...prev, 
                            enableAutoDriverAssignment: !!checked 
                          }))
                        }
                      />
                      <Label htmlFor="auto-driver">Auto-assign drivers</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="auto-vehicle"
                        checked={autoAssignmentRules.enableAutoVehicleAssignment}
                        onCheckedChange={(checked) => 
                          setAutoAssignmentRules(prev => ({ 
                            ...prev, 
                            enableAutoVehicleAssignment: !!checked 
                          }))
                        }
                      />
                      <Label htmlFor="auto-vehicle">Auto-assign vehicles</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filename-patterns"
                        checked={autoAssignmentRules.useFilenamePatterns}
                        onCheckedChange={(checked) => 
                          setAutoAssignmentRules(prev => ({ 
                            ...prev, 
                            useFilenamePatterns: !!checked 
                          }))
                        }
                      />
                      <Label htmlFor="filename-patterns">Use filename pattern matching</Label>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Fallback Driver</Label>
                    <Select 
                      value={autoAssignmentRules.fallbackDriverId || 'none'} 
                      onValueChange={(value) => 
                        setAutoAssignmentRules(prev => ({ 
                          ...prev, 
                          fallbackDriverId: value === 'none' ? undefined : value 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select default driver" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No default</SelectItem>
                        {drivers.map(driver => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Fallback Vehicle</Label>
                    <Select 
                      value={autoAssignmentRules.fallbackVehicleId || 'none'} 
                      onValueChange={(value) => 
                        setAutoAssignmentRules(prev => ({ 
                          ...prev, 
                          fallbackVehicleId: value === 'none' ? undefined : value 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select default vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No default</SelectItem>
                        {vehicles.map(vehicle => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.plateNumber} - {vehicle.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
          >
            <Upload className={`h-8 w-8 mx-auto mb-4 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
            <h3 className="mb-2">Drop videos here or click to browse</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Support for MP4, MOV, AVI files. Multiple files supported.
            </p>
            <input
              type="file"
              accept="video/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="bulk-file-input"
            />
            <Button asChild>
              <label htmlFor="bulk-file-input" className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Select Videos
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Files Queue */}
      {uploadFiles.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upload Queue ({uploadFiles.length} files)</CardTitle>
                <CardDescription>
                  Review and configure assignments before processing
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={clearAll} disabled={isProcessing}>
                  Clear All
                </Button>
                <Button 
                  onClick={processUploads} 
                  disabled={!canProcess}
                  className="min-w-32"
                >
                  {isProcessing ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Process All
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Progress Summary */}
            {(processingCount > 0 || hasResults) && (
              <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Pending</div>
                  <div className="text-xl font-semibold">{pendingCount}</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Processing</div>
                  <div className="text-xl font-semibold text-blue-600">{processingCount}</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Completed</div>
                  <div className="text-xl font-semibold text-green-600">{completedCount}</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Failed</div>
                  <div className="text-xl font-semibold text-red-600">{failedCount}</div>
                </div>
              </div>
            )}

            {/* Files List */}
            <div className="space-y-3">
              {uploadFiles.map((uploadFile) => (
                <div key={uploadFile.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    {getStatusIcon(uploadFile.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium truncate">{uploadFile.file.name}</p>
                      <Badge variant={getStatusColor(uploadFile.status) as any}>
                        {uploadFile.status}
                      </Badge>
                    </div>
                    
                    {uploadFile.status === 'processing' && (
                      <Progress value={uploadFile.progress} className="mb-2" />
                    )}
                    
                    {uploadFile.score && (
                      <div className="text-sm text-muted-foreground mb-2">
                        Score: {uploadFile.score}/100
                      </div>
                    )}
                    
                    {uploadFile.error && (
                      <Alert className="mb-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{uploadFile.error}</AlertDescription>
                      </Alert>
                    )}
                    
                    {/* Assignment Controls */}
                    {uploadFile.status === 'pending' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Driver Assignment</Label>
                          <Select 
                            value={uploadFile.assignedDriverId || 'none'} 
                            onValueChange={(value) => updateFileAssignment(uploadFile.id, value === 'none' ? undefined : value, uploadFile.assignedVehicleId)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select driver" />
                            </SelectTrigger>
                            <SelectContent>
                              {uploadFile.detectedDriver && uploadFile.assignedDriverId && (
                                <SelectItem value={uploadFile.assignedDriverId} className="font-medium">
                                  📍 {uploadFile.detectedDriver} (detected)
                                </SelectItem>
                              )}
                              <SelectItem value="none">No assignment</SelectItem>
                              {drivers.map(driver => (
                                <SelectItem key={driver.id} value={driver.id}>
                                  {driver.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-xs">Vehicle Assignment</Label>
                          <Select 
                            value={uploadFile.assignedVehicleId || 'none'} 
                            onValueChange={(value) => updateFileAssignment(uploadFile.id, uploadFile.assignedDriverId, value === 'none' ? undefined : value)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select vehicle" />
                            </SelectTrigger>
                            <SelectContent>
                              {uploadFile.detectedVehicle && uploadFile.assignedVehicleId && (
                                <SelectItem value={uploadFile.assignedVehicleId} className="font-medium">
                                  📍 {uploadFile.detectedVehicle} (detected)
                                </SelectItem>
                              )}
                              <SelectItem value="none">No assignment</SelectItem>
                              {vehicles.map(vehicle => (
                                <SelectItem key={vehicle.id} value={vehicle.id}>
                                  {vehicle.plateNumber} - {vehicle.model}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {uploadFile.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(uploadFile.id)}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {hasResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>Bulk Upload Results</span>
            </CardTitle>
            <CardDescription>
              Upload and analysis completed for {completedCount} of {uploadFiles.length} files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Successfully processed {completedCount} videos
                {failedCount > 0 && `, ${failedCount} failed`}
              </div>
              <Button variant="outline" size="sm">
                <FileDown className="h-4 w-4 mr-2" />
                Export Results
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}