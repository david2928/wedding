export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-soft-white">
      <div className="text-center">
        <h1 className="text-4xl font-poppins font-bold text-ocean-blue mb-4">404 - Page Not Found</h1>
        <p className="text-lg text-foreground mb-8">Oops! The page you're looking for doesn't exist.</p>
        <a href="/" className="text-sky-blue hover:text-ocean-blue underline">
          Return to Home
        </a>
      </div>
    </div>
  )
}
