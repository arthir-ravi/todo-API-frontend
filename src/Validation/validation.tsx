export interface ValidationErrors {
    name?: string;
    email?: string;
    password?: string;
  }
  
  export const validateRegister = (name: string, email: string, password: string): ValidationErrors => {
    const errors: ValidationErrors = {};
  
    if (!name.trim()) {
      errors.name = "Name is required";
    }
  
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Invalid email format";
    }
  
    if (!password.trim()) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

  
    return errors;
  };

  export const validateLogin = (email: string, password: string): ValidationErrors => {
    const errors: ValidationErrors = {};
  
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Invalid email format";
    }
  
    if (!password.trim()) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
     
    return errors;
  };
  