import { useEffect, useState } from 'react';
import './App.css';
import Login from './Pages/Login';
import Register from './Pages/Register';
import Todos from './Pages/Todos';
import {BrowserRouter as Router,Routes,Route,Navigate} from "react-router-dom";
import { messaging } from './config/firebase';
import { onMessage } from 'firebase/messaging';


function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));

  useEffect(() => {
    const handleStorage = () => setToken(localStorage.getItem("token"));
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    onMessage(messaging, (payload) => {
      console.log("Foreground message:", payload);

      if (Notification.permission === "granted") {
        new Notification(payload.notification?.title || "New Notification", {
          body: payload.notification?.body || "You have a new message",
        });
      }
    });
  }, []);
  
  return (
    <Router>
      <Routes>
        <Route path='/login' element={<Login onLogin={setToken} />}/>
        <Route path='/register' element={<Register />}/>
        <Route path='/todos' element={token ? <Todos /> : <Navigate to='/login'/>} />
        <Route path="*" element={<Navigate to={token ? "/todos" : "/login"} />} />
      </Routes>
    </Router>
  );
};

export default App;