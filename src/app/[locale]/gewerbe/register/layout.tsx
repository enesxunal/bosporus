export default function GewerbeRegisterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bosporus-gray-50">
      <div className="bg-metro-navy text-white py-3 px-4 text-center text-sm font-semibold">
        Bosporus GmbH · Gewerbe-Registrierung
      </div>
      {children}
    </div>
  );
}
