import React from 'react';
import { Navigate, Route, Routes } from "react-router-dom";
import { BrowserRouter } from 'react-router-dom';
import './App.css';
import AdminDashboard from "./Pages/AdminDashboard";
import NetworkEngineerDashboard from './Pages/NetworkEngineerDashboard';
import NetworkTechnicianDashboard from './Pages/NetworkTechnicianDashboard';
import SignIn from './Pages/SignIn'; 
import AuthentificationRoute from './components/AuthentificationRoute';
import PrivateRoute from './components/PrivateRoute';



function App() {
  return (
    <BrowserRouter>
      <Routes>
       {/* Authentication routes (only for non-logged in users) */}
      <Route element={<AuthentificationRoute />}>
        <Route path="/" element={<SignIn/>}/>
      </Route>
              
        {/* Protected routes with role-based access */}
          <Route element={<PrivateRoute allowedRoles={['admin']} />}>
               <Route path="/admin-dashboard" element={<AdminDashboard/>}/>
          </Route>
          <Route element={<PrivateRoute allowedRoles={['engineer']} />}>
               <Route path="/network-dashboard" element={<NetworkEngineerDashboard/>}/>  
          </Route>
          <Route element={<PrivateRoute allowedRoles={['technician']} />}>
                 <Route path="/technician-dashboard" element={<NetworkTechnicianDashboard/>}/>
          </Route>

        
        {/* Fallback for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />


      </Routes>
    </BrowserRouter>
  );
}

export default App;