
import { useState, useRef, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CheckboxFieldProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  price?: number;
  disabled?: boolean;
  highlight?: boolean;
}

export const CheckboxField = ({
  id,
  label,
  checked,
  onChange,
  description,
  price,
  disabled = false,
  highlight = false
}: CheckboxFieldProps) => {
  const [hasInteracted, setHasInteracted] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Staggered animation delay for form fields
    const timer = setTimeout(() => {
      if (fieldRef.current) {
        fieldRef.current.style.opacity = '1';
        fieldRef.current.style.transform = 'translateY(0)';
      }
    }, 100 * Number(id.replace(/\D/g, '') || 1));
    
    return () => clearTimeout(timer);
  }, [id]);

  return (
    <div 
      className={cn(
        "mb-3 flex items-start space-x-3 p-2 rounded-md transition-colors",
        highlight && "bg-blue-50/50"
      )}
      style={{ 
        opacity: 0, 
        transform: 'translateY(10px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease' 
      }}
      ref={fieldRef}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(isChecked) => {
          onChange(!!isChecked);
          if (!hasInteracted) setHasInteracted(true);
        }}
        disabled={disabled}
        className={cn("mt-1", highlight && "border-primary")}
      />
      <div className="grid gap-1.5">
        <Label 
          htmlFor={id}
          className={cn(
            "font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            highlight && "text-primary font-semibold"
          )}
        >
          {label}
          {price !== undefined && (
            <span className="text-primary ml-2">₹{price.toLocaleString()}</span>
          )}
        </Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
};

export default CheckboxField;
