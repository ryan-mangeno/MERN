import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildPath } from "../utils/config";

function Register() {
  const navigate = useNavigate();

  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  function handleSetEmail(e: any): void {
    setEmail(e.target.value);
  }

  function handleSetUsername(e: any): void {
    setUsername(e.target.value);
  }

  function handleSetPassword(e: any): void {
    setPassword(e.target.value);
  }

  async function doRegister(event: any): Promise<void> {
    event.preventDefault();

    // Validate fields
    if (!email || !username || !password) {
      setMessage('All fields are required');
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }

    try {
      // Step 1: Register user
      const registerResponse = await fetch(buildPath('api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email })
      });

      const registerData = await registerResponse.json();

      if (!registerData.userId) {
        setMessage(registerData.error || 'Registration failed');
        return;
      }

      // Step 2: Send verification email
      const emailResponse = await fetch(buildPath('api/sendgrid/send-verification-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          username: username,
          token: registerData.temporarytoken
        })
      });

      const emailData = await emailResponse.json();

      if (emailData.success) {
        setMessage('Account created! Please check your email to verify your account.');
        // Clear form
        setEmail('');
        setUsername('');
        setPassword('');
        // Redirect to login after 3 seconds
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setMessage('Account created but email verification failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setMessage('Registration failed. Please try again.');
    }
  }

  return (
    <div id="registerDiv">
      <span id="inner-title">CREATE AN ACCOUNT</span><br />

      <input
        type="email"
        id="registerEmail"
        placeholder="Email"
        value={email}
        onChange={handleSetEmail}
      /><br />

      <input
        type="text"
        id="registerUsername"
        placeholder="Username"
        value={username}
        onChange={handleSetUsername}
      /><br />

      <input
        type="password"
        id="registerPassword"
        placeholder="Password"
        value={password}
        onChange={handleSetPassword}
      /><br />

      <input
        type="submit"
        id="registerButton"
        className="buttons"
        value="Register"
        onClick={doRegister}
      />

      <span id="registerResult">{message}</span><br />

      <button id="backToLoginButton" onClick={() => navigate('/login')}>
        Back to Login
      </button>
    </div>
  );
}

export default Register;
