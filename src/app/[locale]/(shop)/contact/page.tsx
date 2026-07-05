import { setRequestLocale } from "next-intl/server";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-bosporus-gray-800 mb-8">Kontakt</h1>
      <div className="grid gap-6">
        {[
          { icon: MapPin, text: "Von Hünefeld Straße 2, 50829 Köln" },
          { icon: Phone, text: "+49 221 34098290" },
          { icon: Mail, text: "info@bosporus-gmbh.com" },
          { icon: Clock, text: "Mo.–Sa.: 00:00–18:00 Uhr" },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-4 p-4 bg-white border border-bosporus-gray-200 rounded-xl">
            <div className="w-10 h-10 bg-bosporus-light rounded-full flex items-center justify-center">
              <Icon className="w-5 h-5 text-bosporus" />
            </div>
            <span className="text-bosporus-gray-800">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
