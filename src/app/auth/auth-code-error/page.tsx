export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05070C]">
      <div className="max-w-md w-full px-6">
        <div className="bg-[#0F131C] rounded-2xl p-8 border border-red-900/50">
          <h1 className="text-2xl font-bold text-red-400 mb-4">
            Authentication Error
          </h1>
          <p className="text-gray-400 mb-6">
            There was a problem signing you in. Please try again.
          </p>
          <a
            href="/login"
            className="block w-full text-center bg-white text-gray-900 font-medium px-6 py-3 rounded-full hover:bg-gray-100 transition-colors"
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  )
}
