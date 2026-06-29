import type { Metadata } from 'next';
import Link from 'next/link';
import { Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service — Whatsodo',
  description: 'Terms governing use of Whatsodo, an AI-powered WhatsApp CRM.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#fafaf7]">
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <p className="text-gray-900 font-bold text-lg">Whatsodo</p>
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 prose prose-gray">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-gray-400 text-sm mb-8">Last updated: {new Date().toISOString().split('T')[0]}</p>

        <section className="space-y-4 text-gray-700 text-sm leading-relaxed">
          <p>
            By using Whatsodo, you agree to these terms. Whatsodo connects to the Meta WhatsApp Business Platform on
            your behalf, using credentials you grant via Meta&apos;s Embedded Signup or Meta Business Manager.
          </p>

          <h2 className="text-lg font-bold text-gray-900 pt-4">Your responsibilities</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>You must own or have authorization to connect the WhatsApp Business number you link to Whatsodo.</li>
            <li>You are responsible for complying with WhatsApp&apos;s Business Messaging Policy and Meta&apos;s Platform Terms when sending messages through Whatsodo.</li>
            <li>You must not use Whatsodo to send unsolicited bulk messages, spam, or content that violates Meta&apos;s policies.</li>
          </ul>

          <h2 className="text-lg font-bold text-gray-900 pt-4">Service</h2>
          <p>
            Whatsodo acts as a technology provider that relays messages between your customers and your WhatsApp
            Business number via Meta&apos;s Cloud API, and provides AI-assisted replies, lead tracking, and
            appointment scheduling on top of that connection. We do not own, resell, or control your WhatsApp
            Business Account — it remains yours and you can disconnect it from Whatsodo at any time.
          </p>

          <h2 className="text-lg font-bold text-gray-900 pt-4">Termination</h2>
          <p>
            You may disconnect your WhatsApp Business Account or delete your Whatsodo account at any time. We may
            suspend access for accounts that violate Meta&apos;s policies or these terms.
          </p>

          <h2 className="text-lg font-bold text-gray-900 pt-4">Contact</h2>
          <p>For questions about these terms, contact n.ragavendar@gmail.com.</p>
        </section>
      </div>
    </div>
  );
}
