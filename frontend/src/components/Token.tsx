import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { buildPath } from '../utils/config';

export default function Token() {
  const { token } = useParams();

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch(buildPath(`api/sendgrid/verify/${token}`), {
        method: 'PUT'
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Email verified! You can now login.');
        window.location.href = '/login';
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Verification error:', error);
      alert('Verification failed');
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h2>Verifying your email...</h2>
      <p>Please wait while we activate your account.</p>
    </div>
  );
}