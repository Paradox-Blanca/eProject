export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth">
      <aside className="auth-brand" aria-hidden="true" />
      <main className="auth-main">
        <div className="card">
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
          {children}
        </div>
      </main>
    </div>
  );
}
