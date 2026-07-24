import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <h1 className="text-5xl font-bold text-gray-900 mb-4">
        <span className="text-indigo-600">Invoice</span>Pro
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-md">
        Professional invoicing made simple. Create, send, and track invoices for your business.
      </p>
      <div className="flex gap-4">
        <Link
          href="/register"
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Get Started Free
        </Link>
        <Link
          href="/login"
          className="bg-white text-gray-700 px-6 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Sign In
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl w-full">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-3xl mb-3">&#x1F4C4;</div>
          <h3 className="font-semibold text-gray-900 mb-2">Create Invoices</h3>
          <p className="text-sm text-gray-600">Build professional invoices in seconds with our intuitive form.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-3xl mb-3">&#x1F465;</div>
          <h3 className="font-semibold text-gray-900 mb-2">Manage Clients</h3>
          <p className="text-sm text-gray-600">Keep track of all your clients and their billing information.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-3xl mb-3">&#x1F4CA;</div>
          <h3 className="font-semibold text-gray-900 mb-2">Track Revenue</h3>
          <p className="text-sm text-gray-600">Monitor your income with detailed analytics and tax reports.</p>
        </div>
      </div>
    </div>
  );
}