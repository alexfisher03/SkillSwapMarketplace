import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm.jsx';
import { login } from '../api/auth.js';

export default function LoginPage({ onLogin }) {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const submit = (payload) => {
    setError('');
    setSubmitting(true);
    login(payload)
      .then((data) => {
        onLogin({ ...data.user, token: data.token });
        navigate('/skill-swap');
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="row justify-content-center mt-4">
      <div className="col-12 col-md-6 col-lg-5">
        <h1 className="h4 mb-3">Login</h1>
        <AuthForm mode="login" onSubmit={submit} submitting={submitting} error={error} />
        <p className="small mt-3 mb-0">
          Need an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
