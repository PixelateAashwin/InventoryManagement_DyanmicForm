
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  error?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

const SelectField = ({
  id,
  label,
  value,
  onChange,
  options,
  error,
  required = false,
  placeholder = "Select an option",
  disabled = false
}: SelectFieldProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Staggered animation delay for form fields
    const timer = setTimeout(() => {
      if (selectRef.current) {
        selectRef.current.style.opacity = '1';
        selectRef.current.style.transform = 'translateY(0)';
      }
    }, 100 * Number(id.replace(/\D/g, '') || 1));
    
    return () => clearTimeout(timer);
  }, [id]);

  const handleValueChange = (newValue: string) => {
    onChange(newValue);
    if (!hasInteracted) setHasInteracted(true);
  };

  return (
    <div 
      className="mb-5 transition-all duration-300"
      style={{ 
        opacity: 0, 
        transform: 'translateY(10px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease' 
      }}
      ref={selectRef}
    >
      <label 
        htmlFor={id} 
        className={cn(
          "form-label block mb-2 transition-all duration-200",
          isFocused ? "text-primary" : "",
        )}
      >
        {label}{required && <span className="text-primary ml-1">*</span>}
      </label>
      
      <div className="relative">
        <Select
          value={value}
          onValueChange={handleValueChange}
          disabled={disabled}
          onOpenChange={(open) => setIsFocused(open)}
        >
          <SelectTrigger 
            id={id}
            className={cn(
              "form-input w-full",
              error && hasInteracted ? "border-destructive/50 focus:border-destructive/50 focus:ring-destructive/10" : "",
              isFocused ? "border-primary/40" : ""
            )}
            aria-invalid={error ? "true" : "false"}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value} 
                disabled={option.disabled}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {error && hasInteracted && (
        <p className="error-message mt-1" role="alert">{error}</p>
      )}
    </div>
  );
};

export default SelectField;
