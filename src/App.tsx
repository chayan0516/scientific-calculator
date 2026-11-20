import Calculator from './components/Calculator';

export default function App() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-3 py-6 sm:px-6">
      {/* ambient background glows */}
      <div
        aria-hidden
        className="animate-breathe pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-accent/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-accent/8 blur-3xl"
      />
      {/* subtle radial vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(255,121,0,0.07), transparent 55%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-accent/8 blur-3xl"
      />
      <Calculator />
    </div>
  );
}
