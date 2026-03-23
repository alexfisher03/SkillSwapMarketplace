import { useState } from 'react';

export default function AuthForm({ mode, onSubmit, submitting, error }) {
  const isSignup = mode === 'signup';
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (isSignup) {
      onSubmit({ display_name: displayName, email, password });
    } else {
      onSubmit({ email, password });
    }
  };

  return (
    <form className="card shadow-sm" onSubmit={submit}>
      <div className="card-body">
        {isSignup && (
          <div className="mb-3">
            <label className="form-label">Display name</label>
            <input
              className="form-control"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
        )}
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error ? <p className="text-danger small mb-3">{error}</p> : null}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting
            ? isSignup
              ? 'Creating account...'
              : 'Logging in...'
            : isSignup
              ? 'Create account'
              : 'Login'}
        </button>
      </div>
    </form>
  );
}
