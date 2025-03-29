import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import FormField from './FormField';
import SelectField from './SelectField';
import CheckboxField from './CheckboxField';
import SuccessMessage from './SuccessMessage';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  submitToPabblyWebhook, 
  getAvailableBatches, 
  getTimeSlots,
  updateLocalCacheAfterBooking,
  getCourseVisibility,
  getCourseEligibility,
  getCourseModes,
  getCourseCentres,
  getGradeCategory
} from '@/lib/api';
import {
  generateUserId,
  validateRequired,
  validateEmail,
  validatePhone,
  formatPhoneNumber
} from '@/utils/formUtils';

interface ContactFormProps {
  adminMode?: boolean;
}

interface FormErrors {
  name: string | null;
  email: string | null;
  phone: string | null;
  grade: string | null;
  courses: string | null;
  batchDate: string | null;
  timeSlot: string | null;
  mode: string | null;
  center: string | null;
  address: string | null;
}

// Course options with prices
const COURSES = [
  { value: "ai-lvl1", label: "AI (Level 1)", price: 10000 },
  { value: "robotics-lvl1", label: "Robotics (Level 1)", price: 10000 },
  { value: "python-lvl1", label: "Python Coding (Level 1)", price: 10000 },
  { value: "python-lvl2", label: "Python Coding (Level 2)", price: 10000 },
  { value: "ai-lvl2", label: "AI (Level 2)", price: 10000 },
  { value: "drone", label: "Drone Engineering", price: 10000 },
];

// Center options
const CENTERS = [
  { value: "delhi", label: "IIT Delhi" },
  { value: "gurugram", label: "Gurugram" }
];

// Courses that require kits for online mode
const COURSES_WITH_KITS = ["robotics-lvl1", "drone"];

const ContactForm = ({ adminMode = false }: ContactFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    grade: '',
    batchDate: '',
    timeSlot: '',
    mode: '',
    center: '',
    coupon: '',
    address: '',
  });
  
  const [selectedCourses, setSelectedCourses] = useState<{[key: string]: boolean}>({});
  
  const [errors, setErrors] = useState<FormErrors>({
    name: null,
    email: null,
    phone: null,
    grade: null,
    courses: null,
    batchDate: null,
    timeSlot: null,
    mode: null,
    center: null,
    address: null
  });
  
  const [userId, setUserId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [availableBatches, setAvailableBatches] = useState<Array<{date: string, slotsAvailable: number}>>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<Array<{slot: string, slotsAvailable: number}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPrice, setTotalPrice] = useState(0);
  const [discountApplied, setDiscountApplied] = useState(false);
  
  const [courseVisibility, setCourseVisibility] = useState<Record<string, boolean>>(getCourseVisibility());
  const [courseEligibility, setCourseEligibility] = useState<Record<string, string[]>>(getCourseEligibility());
  const [courseModes, setCourseModes] = useState<Record<string, string[]>>(getCourseModes());
  const [courseCentres, setCourseCentres] = useState<Record<string, string[]>>(getCourseCentres());
  
  useEffect(() => {
    const handleConfigChange = () => {
      setCourseVisibility(getCourseVisibility());
      setCourseEligibility(getCourseEligibility());
      setCourseModes(getCourseModes());
      setCourseCentres(getCourseCentres());
    };
    
    window.addEventListener('courseConfigChanged', handleConfigChange);
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.includes('form_embed_course_')) {
        handleConfigChange();
      }
    });
    
    return () => {
      window.removeEventListener('courseConfigChanged', handleConfigChange);
      window.removeEventListener('storage', handleConfigChange);
    };
  }, []);
  
  useEffect(() => {
    setUserId(generateUserId());
    
    const fetchInventoryData = async () => {
      setIsLoading(true);
      try {
        const [batches, slots] = await Promise.all([
          getAvailableBatches(),
          getTimeSlots()
        ]);
        
        setAvailableBatches(batches);
        setAvailableTimeSlots(slots);
      } catch (error) {
        console.error('Error fetching inventory data:', error);
        toast.error('Failed to load availability data. Using cached data instead.');
      } finally {
        setIsLoading(false);
        
        setTimeout(() => {
          setIsFormVisible(true);
        }, 200);
      }
    };
    
    fetchInventoryData();
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  useEffect(() => {
    let price = 0;
    Object.entries(selectedCourses).forEach(([courseId, isSelected]) => {
      if (isSelected) {
        const course = COURSES.find(c => c.value === courseId);
        if (course) {
          price += course.price;
        }
      }
    });
    
    if (formData.coupon === 'rancho10' && price > 0) {
      price = price * 0.9;
      if (!discountApplied) {
        setDiscountApplied(true);
        toast.success('Coupon applied: 10% discount');
      }
    } else {
      setDiscountApplied(false);
    }
    
    setTotalPrice(price);
  }, [selectedCourses, formData.coupon]);
  
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'form_embed_batches' && e.newValue) {
      try {
        const batches = JSON.parse(e.newValue);
        setAvailableBatches(batches);
      } catch (error) {
        console.error('Error parsing batches from storage event:', error);
      }
    }
    
    if (e.key === 'form_embed_timeslots' && e.newValue) {
      try {
        const slots = JSON.parse(e.newValue);
        setAvailableTimeSlots(slots);
      } catch (error) {
        console.error('Error parsing time slots from storage event:', error);
      }
    }
  };
  
  const gradeOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `Class ${i + 1}`
  }));
  
  const batchOptions = availableBatches.map(batch => ({
    value: batch.date,
    label: `${batch.date} (${batch.slotsAvailable} slots available)`,
    disabled: batch.slotsAvailable <= 0
  }));
  
  const timeSlotOptions = availableTimeSlots.map(timeSlot => ({
    value: timeSlot.slot,
    label: `${timeSlot.slot} (${timeSlot.slotsAvailable} slots available)`,
    disabled: timeSlot.slotsAvailable <= 0
  }));
  
  const showAddressInput = formData.mode === 'online' && 
    Object.entries(selectedCourses).some(([courseId, isSelected]) => 
      isSelected && COURSES_WITH_KITS.includes(courseId));
  
  const showCenterSelection = formData.mode === 'offline';
  
  const validateForm = (): boolean => {
    const hasSelectedCourses = Object.values(selectedCourses).some(selected => selected);
    
    const newErrors = {
      name: validateRequired(formData.name),
      email: formData.email ? validateEmail(formData.email) : validateRequired(formData.email),
      phone: formData.phone ? validatePhone(formData.phone) : validateRequired(formData.phone),
      grade: validateRequired(formData.grade),
      courses: hasSelectedCourses ? null : 'Please select at least one course',
      batchDate: validateRequired(formData.batchDate),
      timeSlot: validateRequired(formData.timeSlot),
      mode: validateRequired(formData.mode),
      center: showCenterSelection && !formData.center ? 'Please select a center' : null,
      address: showAddressInput && !formData.address ? 'Please provide your address for kit delivery' : null
    };
    
    setErrors(newErrors);
    
    return !Object.values(newErrors).some(error => error !== null);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    
    if (id === 'phone') {
      setFormData(prev => ({
        ...prev,
        [id]: formatPhoneNumber(value)
      }));
    } else if (id === 'coupon') {
      setFormData(prev => ({
        ...prev,
        [id]: value
      }));
      
      setErrors(prev => ({
        ...prev,
        coupon: null
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [id]: value
      }));
    }
    
    setErrors(prev => ({
      ...prev,
      [id]: null
    }));
  };
  
  const handleSelectChange = (id: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
    
    setErrors(prev => ({
      ...prev,
      [id]: null
    }));
  };
  
  const handleCourseToggle = (courseId: string, isSelected: boolean) => {
    setSelectedCourses(prev => ({
      ...prev,
      [courseId]: isSelected
    }));
    
    if (isSelected) {
      setErrors(prev => ({
        ...prev,
        courses: null
      }));
    }
  };
  
  const handleModeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      mode: value,
      center: value === 'offline' ? prev.center : ''
    }));
    
    setErrors(prev => ({
      ...prev,
      mode: null,
      center: null
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please correct the errors in the form');
      return;
    }
    
    const selectedBatch = availableBatches.find(b => b.date === formData.batchDate);
    const selectedTimeSlot = availableTimeSlots.find(t => t.slot === formData.timeSlot);
    
    if (selectedBatch?.slotsAvailable <= 0 || selectedTimeSlot?.slotsAvailable <= 0) {
      toast.error('Sorry, the selected batch or time slot is no longer available');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const coursesArray = Object.entries(selectedCourses)
        .filter(([_, isSelected]) => isSelected)
        .map(([courseId]) => courseId);
      
      const completeFormData = {
        ...formData,
        userId,
        courses: coursesArray,
        totalPrice
      };
      
      const result = await submitToPabblyWebhook(completeFormData);
      
      if (result.success) {
        setAvailableBatches(prev => prev.map(batch => 
          batch.date === formData.batchDate 
            ? { ...batch, slotsAvailable: Math.max(0, batch.slotsAvailable - 1) }
            : batch
        ));
        
        setAvailableTimeSlots(prev => prev.map(slot => 
          slot.slot === formData.timeSlot 
            ? { ...slot, slotsAvailable: Math.max(0, slot.slotsAvailable - 1) }
            : slot
        ));
        
        setIsFormVisible(false);
        setTimeout(() => {
          setIsSubmitted(true);
        }, 500);
        toast.success('Registration successful');
      } else {
        toast.error(result.error || 'Failed to submit registration');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      grade: '',
      batchDate: '',
      timeSlot: '',
      mode: '',
      center: '',
      coupon: '',
      address: '',
    });
    setSelectedCourses({});
    setErrors({
      name: null,
      email: null,
      phone: null,
      grade: null,
      courses: null,
      batchDate: null,
      timeSlot: null,
      mode: null,
      center: null,
      address: null
    });
    setUserId(generateUserId());
    setIsSubmitted(false);
    setDiscountApplied(false);
    
    setTimeout(() => {
      setIsFormVisible(true);
    }, 200);
    
    getAvailableBatches().then(setAvailableBatches).catch(console.error);
    getTimeSlots().then(setAvailableTimeSlots).catch(console.error);
  };
  
  const getFilteredCourses = () => {
    if (!formData.grade) return COURSES;
    
    const gradeCategory = getGradeCategory(formData.grade);
    
    return COURSES.filter(course => {
      if (!courseVisibility[course.value]) return false;
      
      const eligibleGrades = courseEligibility[course.value] || [];
      return eligibleGrades.includes(gradeCategory);
    });
  };
  
  const getAvailableModesForCourse = (courseId: string) => {
    return courseModes[courseId] || ["online", "offline"];
  };
  
  const getAvailableCentresForCourse = (courseId: string) => {
    return courseCentres[courseId] || ["delhi", "gurugram"];
  };
  
  const getFilteredCentres = () => {
    const selectedCourseIds = Object.entries(selectedCourses)
      .filter(([_, isSelected]) => isSelected)
      .map(([courseId]) => courseId);
    
    const commonCentres = CENTERS.filter(center => {
      return selectedCourseIds.every(courseId => {
        const availableCentres = getAvailableCentresForCourse(courseId);
        return availableCentres.includes(center.value);
      });
    });
    
    return commonCentres;
  };
  
  const isModeAvailableForSelectedCourses = (mode: string) => {
    const selectedCourseIds = Object.entries(selectedCourses)
      .filter(([_, isSelected]) => isSelected)
      .map(([courseId]) => courseId);
    
    return selectedCourseIds.every(courseId => {
      const availableModes = getAvailableModesForCourse(courseId);
      return availableModes.includes(mode);
    });
  };
  
  if (isSubmitted) {
    return <SuccessMessage userId={userId} onReset={resetForm} />;
  }
  
  const filteredCourses = getFilteredCourses();
  const filteredCentres = getFilteredCentres();
  const isOnlineModeAvailable = isModeAvailableForSelectedCourses('online');
  const isOfflineModeAvailable = isModeAvailableForSelectedCourses('offline');
  
  return (
    <form 
      onSubmit={handleSubmit}
      className={`glass-panel rounded-2xl px-8 py-10 transition-all duration-500 w-full max-w-md mx-auto
                ${isFormVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <h2 className="text-2xl font-medium text-center mb-8">Course Registration</h2>
      
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <p>Loading availability data...</p>
        </div>
      )}
      
      {!isLoading && (
        <>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Personal Information</h3>
            
            <FormField
              id="name"
              label="Full Name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="John Doe"
              error={errors.name || ''}
              required
              autoComplete="name"
            />
            
            <FormField
              id="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="john.doe@example.com"
              error={errors.email || ''}
              required
              autoComplete="email"
            />
            
            <FormField
              id="phone"
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="(123) 456-7890"
              error={errors.phone || ''}
              required
              autoComplete="tel"
            />
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Course Selection</h3>
            
            <SelectField
              id="grade"
              label="Grade/Class"
              value={formData.grade}
              onChange={(value) => handleSelectChange('grade', value)}
              options={gradeOptions}
              error={errors.grade || ''}
              required
              placeholder="Select student's grade"
            />
            
            <div className="mb-4">
              <Label className="form-label block mb-3">
                Courses <span className="text-primary ml-1">*</span>
              </Label>
              
              <div className="space-y-2 pl-1">
                {filteredCourses.map(course => (
                  <CheckboxField
                    key={course.value}
                    id={course.value}
                    label={course.label}
                    checked={!!selectedCourses[course.value]}
                    onChange={(checked) => handleCourseToggle(course.value, checked)}
                    price={course.price}
                  />
                ))}
                
                {filteredCourses.length === 0 && (
                  <p className="text-muted-foreground text-sm py-2">
                    No courses available for the selected grade level.
                  </p>
                )}
              </div>
              
              {errors.courses && (
                <p className="error-message" role="alert">{errors.courses}</p>
              )}
            </div>
            
            <div className="mb-4">
              <Label className="form-label block mb-3">
                Mode <span className="text-primary ml-1">*</span>
              </Label>
              
              <RadioGroup 
                value={formData.mode}
                onValueChange={handleModeChange}
                className="space-y-2 pl-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="online" id="mode-online" disabled={!isOnlineModeAvailable} />
                  <Label htmlFor="mode-online" className={!isOnlineModeAvailable ? "opacity-50" : ""}>
                    Online
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="offline" id="mode-offline" disabled={!isOfflineModeAvailable} />
                  <Label htmlFor="mode-offline" className={!isOfflineModeAvailable ? "opacity-50" : ""}>
                    Offline
                  </Label>
                </div>
              </RadioGroup>
              
              {errors.mode && (
                <p className="error-message" role="alert">{errors.mode}</p>
              )}
            </div>
            
            {showCenterSelection && (
              <SelectField
                id="center"
                label="Center Location"
                value={formData.center}
                onChange={(value) => handleSelectChange('center', value)}
                options={filteredCentres}
                error={errors.center || ''}
                required
                placeholder="Select a center"
              />
            )}
            
            {showAddressInput && (
              <FormField
                id="address"
                label="Delivery Address (for kit)"
                type="text"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter your full address for kit delivery"
                error={errors.address || ''}
                required
              />
            )}
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Schedule</h3>
            
            <SelectField
              id="batchDate"
              label="Batch Date"
              value={formData.batchDate}
              onChange={(value) => handleSelectChange('batchDate', value)}
              options={batchOptions}
              error={errors.batchDate || ''}
              required
              placeholder="Select a batch date"
            />
            
            <SelectField
              id="timeSlot"
              label="Time Slot"
              value={formData.timeSlot}
              onChange={(value) => handleSelectChange('timeSlot', value)}
              options={timeSlotOptions}
              error={errors.timeSlot || ''}
              required
              placeholder="Select a time slot"
            />
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Payment</h3>
            
            <FormField
              id="coupon"
              label="Coupon Code"
              type="text"
              value={formData.coupon}
              onChange={handleInputChange}
              placeholder="Enter coupon code (if any)"
              error={''}
            />
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between font-medium">
                <span>Total Price:</span>
                <span className="text-primary text-lg">₹{totalPrice.toLocaleString()}</span>
              </div>
              {discountApplied && (
                <p className="text-sm text-green-600 mt-1">10% discount applied</p>
              )}
            </div>
          </div>
          
          <div className="mt-8">
            <Button 
              type="submit" 
              className="w-full btn-primary h-12 text-base font-medium transition-all duration-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Register Now'
              )}
            </Button>
          </div>
          
          <p className="text-xs text-center text-gray-500 mt-6">
            Your information will be securely stored.
            <br />Reference ID: <span className="font-mono">{userId}</span>
          </p>
        </>
      )}
    </form>
  );
};

export default ContactForm;
