
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  autoComplete?: string;
  pattern?: string;
}

export const FormField = ({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  autoComplete,
  pattern
}: FormFieldProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Staggered animation delay for form fields
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.style.opacity = '1';
        inputRef.current.style.transform = 'translateY(0)';
      }
    }, 100 * Number(id.replace(/\D/g, '') || 1));
    
    return () => clearTimeout(timer);
  }, [id]);

  return (
    <div 
      className="mb-5 transition-all duration-300"
      style={{ 
        opacity: 0, 
        transform: 'translateY(10px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease' 
      }}
      ref={inputRef}
    >
      <label 
        htmlFor={id} 
        className={cn(
          "form-label transition-all duration-200",
          isFocused ? "text-primary" : "",
        )}
      >
        {label}{required && <span className="text-primary ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => {
            onChange(e);
            if (!hasInteracted) setHasInteracted(true);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={cn(
            "form-input",
            error && hasInteracted ? "border-destructive/50 focus:border-destructive/50 focus:ring-destructive/10" : "",
            isFocused ? "border-primary/40" : ""
          )}
          required={required}
          autoComplete={autoComplete}
          pattern={pattern}
          aria-invalid={error ? "true" : "false"}
        />
      </div>
      
      {error && hasInteracted && (
        <p className="error-message" role="alert">{error}</p>
      )}
    </div>
  );
};

export default FormField;

const sendDataToPabbly = async (formData) => {
  try {
    const response = await fetch("https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYwNTY5MDYzMzA0MzM1MjZhNTUzYzUxMzEi_pc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
    const result = await response.json();
    console.log("Data sent to Pabbly:", result);
  } catch (error) {
    console.error("Error sending data to Pabbly:", error);
  }
};