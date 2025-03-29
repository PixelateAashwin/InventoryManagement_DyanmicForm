import { useEffect, useState } from 'react';
import ContactForm from '@/components/ContactForm';
import InventoryAdmin from '@/components/InventoryAdmin';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  resetInventory,
  getCourseVisibility, 
  setCourseVisibility,
  getCourseModes,
  setCourseModes,
  getCourseCentres,
  setCourseCentres,
  getCourseEligibility,
  setCourseEligibility
} from '@/lib/api';

const Index = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);
  const [formKey, setFormKey] = useState(Date.now());

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    const storedPassword = localStorage.getItem('admin_password');
    if (storedPassword) {
      setAdminPassword(storedPassword);
      setIsAdminAuthorized(true);
    }
    
    const handleCourseConfigChanged = (event: Event) => {
      console.log('Course configuration changed, refreshing form', event);
      
      setFormKey(Date.now());
      
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        const { type, data } = customEvent.detail;
        switch (type) {
          case 'modes':
            toast.success('Course mode settings updated');
            break;
          case 'centres':
            toast.success('Course centre settings updated');
            break;
          default:
            toast.success('Course settings updated');
        }
      } else {
        toast.success('Course settings updated');
      }
    };
    
    window.addEventListener('courseConfigChanged', handleCourseConfigChanged);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('courseConfigChanged', handleCourseConfigChanged);
    };
  }, []);
  
  const handleAdminAccess = () => {
    const password = prompt('Enter admin password:');
    if (password === 'admin123') {
      setAdminPassword(password);
      setIsAdminAuthorized(true);
      localStorage.setItem('admin_password', password);
      toast.success('Admin access granted');
    } else {
      toast.error('Invalid password');
    }
  };
  
  const resetAllSettings = () => {
    if (window.confirm('Are you sure you want to reset ALL course settings? This cannot be undone.')) {
      resetInventory('ai-lvl1');
      resetInventory('robotics-lvl1');
      resetInventory('python-lvl1');
      resetInventory('python-lvl2');
      resetInventory('ai-lvl2');
      resetInventory('drone');
      
      setCourseVisibility({
        "ai-lvl1": true,
        "robotics-lvl1": true,
        "python-lvl1": true,
        "python-lvl2": true,
        "ai-lvl2": true,
        "drone": true,
      });
      
      setCourseModes({
        "ai-lvl1": ["online", "offline"],
        "robotics-lvl1": ["online", "offline"],
        "python-lvl1": ["online", "offline"],
        "python-lvl2": ["online", "offline"],
        "ai-lvl2": ["online", "offline"],
        "drone": ["online", "offline"],
      });
      
      setCourseCentres({
        "ai-lvl1": ["delhi", "gurugram"],
        "robotics-lvl1": ["delhi", "gurugram"],
        "python-lvl1": ["delhi", "gurugram"],
        "python-lvl2": ["delhi", "gurugram"],
        "ai-lvl2": ["delhi", "gurugram"],
        "drone": ["delhi", "gurugram"],
      });
      
      setCourseEligibility({
        "ai-lvl1": ["junior", "senior", "senior-secondary"],
        "robotics-lvl1": ["junior", "senior", "senior-secondary"],
        "python-lvl1": ["junior", "senior", "senior-secondary"],
        "python-lvl2": ["senior", "senior-secondary"],
        "ai-lvl2": ["senior", "senior-secondary"],
        "drone": ["senior", "senior-secondary"],
      });
      
      setFormKey(Date.now());
      
      toast.success('All settings have been reset to defaults');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-blue-50 to-white">
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(to_bottom,white,transparent,white)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-blue-400/10 rounded-full blur-3xl opacity-60 pointer-events-none" />
      
      <div className={`w-full max-w-4xl transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="text-center mb-8">
          <div className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-800 text-xs font-medium mb-3 animate-fade-in">
            Course Registration
          </div>
          <h1 className="text-4xl font-medium text-gray-900 mb-4">Course Registration Form</h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Register for our courses and select your preferred batch date and time slot.
          </p>
          
          <div className="mt-4 flex justify-center space-x-3">
            {!isAdminAuthorized ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleAdminAccess}
                className="text-xs"
              >
                Admin Access
              </Button>
            ) : (
              <>
                <Button 
                  variant={showAdmin ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowAdmin(!showAdmin)}
                  className="text-xs"
                >
                  {showAdmin ? "Hide Admin Panel" : "Show Admin Panel"}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={resetAllSettings}
                  className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  Reset All Settings
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    localStorage.removeItem('admin_password');
                    setIsAdminAuthorized(false);
                    setShowAdmin(false);
                    toast.success('Logged out of admin');
                  }}
                  className="text-xs"
                >
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
        
        {showAdmin && isAdminAuthorized && (
          <div className="mb-8 transition-all duration-300">
            <InventoryAdmin />
          </div>
        )}
        
        <div id="form-embed-container" key={formKey}>
          <ContactForm adminMode={isAdminAuthorized} />
        </div>
      </div>
      
      <footer className={`mt-16 text-center text-gray-400 text-sm transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <p>Privacy-focused design. Your data is securely stored.</p>
      </footer>
    </div>
  );
};

export default Index;
