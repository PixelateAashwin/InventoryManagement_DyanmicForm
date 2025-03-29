
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface SuccessMessageProps {
  userId: string;
  onReset: () => void;
}

const SuccessMessage = ({ userId, onReset }: SuccessMessageProps) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`text-center transition-all duration-500 ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-4'}`}>
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg 
          className="w-8 h-8 text-green-500" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M5 13l4 4L19 7"
          ></path>
        </svg>
      </div>
      
      <h3 className="text-2xl font-medium text-gray-900 mb-2">Thank You</h3>
      <p className="text-gray-500 mb-2">Your information has been received.</p>
      <p className="text-sm text-gray-400 mb-6">Reference ID: {userId}</p>
      
      <Button 
        onClick={onReset}
        className="btn-primary transition-all duration-300 hover:scale-105"
      >
        Submit Another Response
      </Button>
    </div>
  );
};

export default SuccessMessage;
