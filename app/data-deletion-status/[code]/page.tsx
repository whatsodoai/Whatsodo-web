import { CheckCircle2 } from 'lucide-react';

export default async function DataDeletionStatusPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <div className="min-h-screen bg-[#fafaf7] flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl shadow-soft-lg p-8 max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-green-600" />
        </div>
        <h1 className="font-bold text-gray-900 text-lg mb-2">Data deletion processed</h1>
        <p className="text-gray-500 text-sm mb-4">
          All Whatsodo data associated with this request has been deleted.
        </p>
        <p className="text-xs text-gray-400 font-mono break-all">Confirmation code: {code}</p>
      </div>
    </div>
  );
}
