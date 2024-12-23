import { Eye, EyeClosed } from "lucide-react";
import { memo, useRef, useState } from "react";
import { Button } from "./button";
import { Input, InputProps } from "./input";

const PasswordInputField = memo(({ ...props }: InputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null); // Reference to the input field

  const togglePasswordVisibility = (event: React.MouseEvent) => {
    event.preventDefault(); // Prevent default to avoid triggering parent form events
    setShowPassword((prev) => !prev);
    inputRef.current?.focus(); // Refocus the input field
  };

  return (
    <div className="relative">
      <Input
        {...props}
        ref={inputRef} // Attach the ref to the input
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        placeholder="Enter your password"
        className="pr-12"
      />
      <Button
        variant="ghost"
        size="sm"
        className="h-full absolute inset-y-0 right-0 flex items-center px-3"
        onClick={togglePasswordVisibility}
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          <Eye className="h-5 w-5" />
        ) : (
          <EyeClosed className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
});

export default PasswordInputField;
