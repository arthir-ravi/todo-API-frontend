import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../API/api';
import '../styles/Login.css';
import { validateLogin, ValidationErrors } from '../Validation/validation';

const Login = ({ onLogin }: { onLogin: (token: string) => void }) => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [serverError, setServerError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
    setServerError('');

    const newErrors = validateLogin(email, password);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const res = await API.post<{ access_token: string }>('/auth/login', { email, password });
      const token = res.data.access_token;
      onLogin(token);
      localStorage.setItem('token', token);
      navigate('/todos');
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
        setServerError('Incorrect email or password');
      } else {
        setServerError('Something went wrong. Please try again later.');
      }
    }
  };

  return (
    <div className='login-form'>
      <h2>Login</h2>

      <input
        type='text'
        placeholder='Email'
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {errors.email && <p className='error'>{errors.email}</p>}

      <input
        type='password'
        placeholder='Password'
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {errors.password && <p className='error'>{errors.password}</p>}

      {serverError && <p className='error'>{serverError}</p>}

      <button onClick={handleLogin}>Login</button>

      <p>
        Don't have an account? <Link to='/register'>Register</Link>
      </p>
    </div>
  );
};

export default Login;
