import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm.jsx';
import { signup } from '../api/auth.js';

export default function SignupPage({ onSignup }) {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const submit = (payload) => {
    setError('');
    setSubmitting(true);
    signup(payload)
      .then((data) => {
        onSignup(data.user);
        navigate('/skill-swap');
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="row justify-content-center mt-4">
      <div className="col-12 col-md-6 col-lg-5">
        <h1 className="h4 mb-3">Sign up</h1>
        <AuthForm mode="signup" onSubmit={submit} submitting={submitting} error={error} />
        <p className="small mt-3 mb-0">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
