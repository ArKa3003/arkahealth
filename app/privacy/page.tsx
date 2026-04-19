/**
 * Placeholder privacy policy for ARKA Health (regulatory / go-live checklist).
 */

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-semibold text-arka-text">Privacy Policy</h1>
      <p className="mt-4 text-sm text-arka-text-soft">
        This is a placeholder page. Replace with your organization&apos;s privacy policy before production. ARKA-INS
        stores no PHI in application logs or Supabase; patient identifiers are hashed where required.
      </p>
    </main>
  );
}
