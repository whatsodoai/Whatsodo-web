import type { Metadata } from 'next';
import Link from 'next/link';
import { Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy — Whatsodo',
  description: 'How Whatsodo collects, uses, and protects your data and your WhatsApp Business account information.',
};

export default function PrivacyPolicyPage() {
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-8">Last updated: {new Date().toISOString().split('T')[0]}</p>

        <section className="space-y-4 text-gray-700 text-sm leading-relaxed">
          <p>
            Whatsodo (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) provides an AI-powered WhatsApp CRM. This
            policy explains what data we collect when you connect your WhatsApp Business Account through Meta&apos;s
            Embedded Signup, and how we use it.
          </p>

          <h2 className="text-lg font-bold text-gray-900 pt-4">What we collect</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Your WhatsApp Business Account ID, phone number ID, and a System User access token issued by Meta when you connect your number.</li>
            <li>Messages exchanged between your WhatsApp Business number and your customers, so we can store conversation history and generate AI replies.</li>
            <li>Lead and appointment information your customers share through WhatsApp.</li>
            <li>Your account details (name, email) and business profile information you provide directly.</li>
          </ul>

          <h2 className="text-lg font-bold text-gray-900 pt-4">How we use it</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>To send and receive WhatsApp messages on your behalf via the Meta Cloud API.</li>
            <li>To generate AI-assisted replies grounded in your business&apos;s knowledge base.</li>
            <li>To show you leads, conversations, and appointments in your Whatsodo dashboard.</li>
          </ul>

          <h2 className="text-lg font-bold text-gray-900 pt-4">Data isolation</h2>
          <p>
            Each business&apos;s WhatsApp credentials, leads, and conversations are stored separately and are never
            shared with or visible to any other business using Whatsodo.
          </p>

          <h2 className="text-lg font-bold text-gray-900 pt-4">Deleting your data</h2>
          <p>
            You can disconnect your WhatsApp Business Account at any time from Whatsodo Settings, or by removing
            Whatsodo&apos;s access from your Facebook Business settings. Removing access there automatically clears
            your stored WhatsApp credentials. To request full deletion of your account and all associated data,
            email us or use Facebook&apos;s &quot;Apps and Websites&quot; settings to submit a data deletion request.
          </p>

          <h2 className="text-lg font-bold text-gray-900 pt-4">Contact</h2>
          <p>For privacy questions or deletion requests, contact n.ragavendar@gmail.com.</p>
        </section>
      </div>
    </div>
  );
}
