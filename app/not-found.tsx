import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-[70vh]">
      <h2 className="text-4xl font-bold mb-4">404</h2>
      <p className="text-xl mb-8">Page not found</p>
      <Link href="/strategies" className="bg-primary text-primary-foreground px-4 py-2 rounded">
        Return to strategies
      </Link>
    </div>
  );
}
