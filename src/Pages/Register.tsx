import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import API from '../API/api';
import '../styles/Register.css'
import { validateRegister, ValidationErrors } from '../Validation/validation';


const Register = () => {

  const [name, setName] = useState("")
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [role, setRole] = useState("user");
  const navigate = useNavigate();

  const handleRegister = async () => {
    const newErrors = validateRegister(name, email, password);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      await API.post("/auth/register", { name, email, password, role: role || "user"});
      alert("Registered successfully");
      navigate("/todos");
    } catch (err: any) {
      console.error(err.response?.data);
      alert("Registration failed: " + (err.response?.data?.message || "Unknown error"));
    }
  };
  
 return (
    <div className='register-form'>
       
        <h2>Register</h2>

        <input type="text"
        placeholder='Name'
        value={name}
        onChange={(e) => setName(e.target.value)} 
        />
        {errors.name && <p className="error">{errors.name}</p>}
        <br />

        <input type="text"
        placeholder='Email'
        value={email}
        onChange={(e) => setEmail(e.target.value)} 
        />
        {errors.email && <p className="error">{errors.email}</p>}
        <br />

        <input type="text"
        placeholder='Password'
        value={password}
        onChange={(e) => setPassword(e.target.value)} 
        />
        {errors.password && <p className="error">{errors.password}</p>}
        <br />

        <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="user">User</option>
        <option value="admin">Admin</option>
        </select>
        <br /><br />

        <button onClick={handleRegister}>Register</button>

        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>

    </div>
  );
};

export default Register;
