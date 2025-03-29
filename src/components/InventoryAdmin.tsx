import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  getAvailableBatches, 
  getTimeSlots, 
  manuallyUpdateInventory, 
  resetInventory,
  getCourseVisibility,
  setCourseVisibility,
  getCourseEligibility,
  setCourseEligibility,
  getCourseModes,
  setCourseModes,
  getCourseCentres,
  setCourseCentres
} from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckboxField } from '@/components/CheckboxField';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookOpen, Settings, Eye, EyeOff, Filter, Plus, Edit, Calendar, Clock, MapPin, School, Users } from 'lucide-react';

interface Batch {
  date: string;
  slotsAvailable: number;
}

interface TimeSlot {
  slot: string;
  slotsAvailable: number;
}

const AVAILABLE_COURSES = [
  { id: "ai-lvl1", label: "AI (Level 1)" },
  { id: "robotics-lvl1", label: "Robotics (Level 1)" },
  { id: "python-lvl1", label: "Python Coding (Level 1)" },
  { id: "python-lvl2", label: "Python Coding (Level 2)" },
  { id: "ai-lvl2", label: "AI (Level 2)" },
  { id: "drone", label: "Drone Programming" },
];

const GRADE_LEVELS = [
  { id: "junior", label: "Junior (Class 1-5)" },
  { id: "senior", label: "Senior (Class 6-8)" },
  { id: "senior-secondary", label: "Senior Secondary (Class 9-12)" },
];

const MODE_OPTIONS = [
  { id: "online", label: "Online" },
  { id: "offline", label: "Offline" },
];

const CENTRE_OPTIONS = [
  { id: "delhi", label: "Delhi (IIT)" },
  { id: "gurugram", label: "Gurugram" },
];

const InventoryAdmin = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>(AVAILABLE_COURSES[0].id);
  const [newCount, setNewCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState("inventory");
  
  const [courseEligibility, setCourseEligibility] = useState<Record<string, string[]>>(getCourseEligibility());
  const [courseVisibility, setCourseVisibility] = useState<Record<string, boolean>>(getCourseVisibility());
  
  const [courseModes, setCourseModes] = useState<Record<string, string[]>>(getCourseModes());
  const [courseCentres, setCourseCentres] = useState<Record<string, string[]>>(getCourseCentres());
  
  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const [batchData, slotData] = await Promise.all([
        getAvailableBatches(selectedCourse),
        getTimeSlots(selectedCourse)
      ]);
      
      setBatches(batchData);
      setTimeSlots(slotData);
      setSelectedBatch('');
      setSelectedTimeSlot('');
    } catch (error) {
      console.error('Error loading inventory:', error);
      toast.error('Failed to load inventory data');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadInventory();
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [selectedCourse]);
  
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key?.includes('form_embed_')) {
      loadInventory();
    }
  };
  
  const handleManualUpdate = () => {
    if (!selectedBatch || !selectedTimeSlot) {
      toast.error('Please select both a batch date and time slot');
      return;
    }
    
    try {
      manuallyUpdateInventory(selectedCourse, selectedBatch, selectedTimeSlot, newCount);
      loadInventory();
      toast.success('Inventory updated successfully');
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast.error('Failed to update inventory');
    }
  };
  
  const handleReset = () => {
    if (window.confirm(`Are you sure you want to reset inventory data for ${AVAILABLE_COURSES.find(c => c.id === selectedCourse)?.label}?`)) {
      resetInventory(selectedCourse);
      loadInventory();
      toast.success('Inventory data has been reset');
    }
  };
  
  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
  };
  
  const toggleCourseVisibility = (courseId: string) => {
    const newVisibility = {
      ...courseVisibility,
      [courseId]: !courseVisibility[courseId]
    };
    
    setCourseVisibility(newVisibility);
    
    toast.success(`${AVAILABLE_COURSES.find(c => c.id === courseId)?.label} is now ${courseVisibility[courseId] ? 'hidden' : 'visible'}`);
  };
  
  const toggleGradeEligibility = (courseId: string, gradeId: string) => {
    const currentEligibility = courseEligibility[courseId] || [];
    
    let newEligibility;
    if (currentEligibility.includes(gradeId)) {
      newEligibility = {
        ...courseEligibility,
        [courseId]: currentEligibility.filter(g => g !== gradeId)
      };
    } else {
      newEligibility = {
        ...courseEligibility,
        [courseId]: [...currentEligibility, gradeId]
      };
    }
    
    setCourseEligibility(newEligibility);
  };
  
  const toggleCourseMode = (courseId: string, modeId: string) => {
    const currentModes = courseModes[courseId] || [];
    
    let newModes;
    if (currentModes.includes(modeId)) {
      if (currentModes.length > 1) {
        newModes = {
          ...courseModes,
          [courseId]: currentModes.filter(m => m !== modeId)
        };
      } else {
        toast.error("Course must have at least one mode available");
        return;
      }
    } else {
      newModes = {
        ...courseModes,
        [courseId]: [...currentModes, modeId]
      };
    }
    
    setCourseModes(newModes);
    
    setCourseModes(newModes);
    
    toast.success(`Mode settings updated for ${AVAILABLE_COURSES.find(c => c.id === courseId)?.label}`);
    
    window.dispatchEvent(new CustomEvent('courseConfigChanged', {
      detail: { type: 'modes', data: newModes }
    }));
  };
  
  const toggleCourseCentre = (courseId: string, centreId: string) => {
    const currentCentres = courseCentres[courseId] || [];
    
    let newCentres;
    if (currentCentres.includes(centreId)) {
      if (currentCentres.length > 1 && courseModes[courseId]?.includes("offline")) {
        newCentres = {
          ...courseCentres,
          [courseId]: currentCentres.filter(c => c !== centreId)
        };
      } else if (!courseModes[courseId]?.includes("offline")) {
        newCentres = {
          ...courseCentres,
          [courseId]: currentCentres.filter(c => c !== centreId)
        };
      } else {
        toast.error("Course must have at least one centre available for offline mode");
        return;
      }
    } else {
      newCentres = {
        ...courseCentres,
        [courseId]: [...currentCentres, centreId]
      };
    }
    
    setCourseCentres(newCentres);
    
    setCourseCentres(newCentres);
    
    toast.success(`Centre settings updated for ${AVAILABLE_COURSES.find(c => c.id === courseId)?.label}`);
    
    window.dispatchEvent(new CustomEvent('courseConfigChanged', {
      detail: { type: 'centres', data: newCentres }
    }));
  };
  
  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
        <p className="mt-2">Loading inventory data...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-5xl mx-auto">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <Settings className="h-5 w-5" />
        Admin Panel
      </h2>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Inventory Management
          </TabsTrigger>
          <TabsTrigger value="eligibility" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Course Configuration
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory" className="space-y-6">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Select Course</label>
            <Select
              value={selectedCourse}
              onValueChange={handleCourseChange}
            >
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <SelectValue placeholder="Select a course" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_COURSES.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Batch Dates
              </h3>
              <div className="bg-gray-50 p-3 rounded-md max-h-64 overflow-y-auto">
                {batches.length > 0 ? (
                  batches.map((batch) => (
                    <div key={batch.date} className="mb-2 flex justify-between items-center">
                      <span>{batch.date}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium 
                        ${batch.slotsAvailable > 2 ? 'bg-green-100 text-green-800' : 
                          batch.slotsAvailable > 0 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {batch.slotsAvailable} slots
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm py-2">No batch dates available for this course</p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time Slots
              </h3>
              <div className="bg-gray-50 p-3 rounded-md max-h-64 overflow-y-auto">
                {timeSlots.length > 0 ? (
                  timeSlots.map((slot) => (
                    <div key={slot.slot} className="mb-2 flex justify-between items-center">
                      <span>{slot.slot}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium 
                        ${slot.slotsAvailable > 2 ? 'bg-green-100 text-green-800' : 
                          slot.slotsAvailable > 0 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {slot.slotsAvailable} slots
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm py-2">No time slots available for this course</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Update Inventory
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium mb-1">Batch Date</label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2"
                >
                  <option value="">Select batch date</option>
                  {batches.map((batch) => (
                    <option key={batch.date} value={batch.date}>
                      {batch.date} ({batch.slotsAvailable} slots)
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Time Slot</label>
                <select
                  value={selectedTimeSlot}
                  onChange={(e) => setSelectedTimeSlot(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2"
                >
                  <option value="">Select time slot</option>
                  {timeSlots.map((slot) => (
                    <option key={slot.slot} value={slot.slot}>
                      {slot.slot} ({slot.slotsAvailable} slots)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">New Slot Count</label>
              <input
                type="number"
                min="0"
                max="20"
                value={newCount}
                onChange={(e) => setNewCount(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            
            <Button 
              onClick={handleManualUpdate}
              className="w-full"
            >
              Update Inventory
            </Button>
          </div>
          
          <div className="flex justify-between">
            <Button 
              onClick={loadInventory}
              variant="outline"
            >
              Refresh Data
            </Button>
            
            <Button 
              onClick={handleReset}
              variant="destructive"
            >
              Reset Course Inventory
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="eligibility" className="space-y-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visibility
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <School className="h-4 w-4" />
                      Grade Eligibility
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Modes
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      Centres
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {AVAILABLE_COURSES.map((course) => (
                  <tr key={course.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{course.label}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleCourseVisibility(course.id)}
                        className={`inline-flex items-center gap-1 ${courseVisibility[course.id] ? 'text-green-700' : 'text-red-700'}`}
                      >
                        {courseVisibility[course.id] ? (
                          <>
                            <Eye className="h-4 w-4" />
                            Visible
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4" />
                            Hidden
                          </>
                        )}
                      </Button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            {(courseEligibility[course.id] || []).length} Grade(s)
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                          <DropdownMenuLabel>Grade Eligibility</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {GRADE_LEVELS.map((grade) => (
                            <DropdownMenuItem 
                              key={grade.id}
                              onClick={() => toggleGradeEligibility(course.id, grade.id)}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <div className={`w-4 h-4 border rounded-sm flex items-center justify-center ${
                                (courseEligibility[course.id] || []).includes(grade.id) 
                                  ? 'bg-primary border-primary' 
                                  : 'border-gray-300'
                              }`}>
                                {(courseEligibility[course.id] || []).includes(grade.id) && (
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="4"
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    className="h-3 w-3 text-white"
                                  >
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                )}
                              </div>
                              {grade.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            {(courseModes[course.id] || []).length} Mode(s)
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                          <DropdownMenuLabel>Available Modes</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {MODE_OPTIONS.map((mode) => (
                            <DropdownMenuItem 
                              key={mode.id}
                              onClick={() => toggleCourseMode(course.id, mode.id)}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <div className={`w-4 h-4 border rounded-sm flex items-center justify-center ${
                                (courseModes[course.id] || []).includes(mode.id) 
                                  ? 'bg-primary border-primary' 
                                  : 'border-gray-300'
                              }`}>
                                {(courseModes[course.id] || []).includes(mode.id) && (
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="4"
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    className="h-3 w-3 text-white"
                                  >
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                )}
                              </div>
                              {mode.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            {(courseCentres[course.id] || []).length} Centre(s)
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                          <DropdownMenuLabel>Available Centres</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {CENTRE_OPTIONS.map((centre) => (
                            <DropdownMenuItem 
                              key={centre.id}
                              onClick={() => toggleCourseCentre(course.id, centre.id)}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <div className={`w-4 h-4 border rounded-sm flex items-center justify-center ${
                                (courseCentres[course.id] || []).includes(centre.id) 
                                  ? 'bg-primary border-primary' 
                                  : 'border-gray-300'
                              }`}>
                                {(courseCentres[course.id] || []).includes(centre.id) && (
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="4"
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    className="h-3 w-3 text-white"
                                  >
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                )}
                              </div>
                              {centre.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InventoryAdmin;
