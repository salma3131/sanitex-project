import ReportFormModern from '@/components/ReportFormModern';

export default function Report() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-neutral-light py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-neutral-dark mb-2">🚨 Report an Issue</h1>
            <p className="text-gray-600">Help us maintain cleanliness by reporting any sanitation concerns in your area.</p>
          </div>

          <div className="card p-8">
            <ReportFormModern />
          </div>
        </div>
      </div>
    </div>
  );
}
