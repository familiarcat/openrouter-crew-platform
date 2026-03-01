import { Header } from '@/components/Header';

export default function Contact() {
  return (
    <main>
      <Header />
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-12 text-center text-gray-900">Contact Us</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            <div className="bg-gray-50 p-8 rounded-lg">
              <h2 className="text-2xl font-bold mb-6 text-red-700">Get in Touch</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Location</h3>
                  <p className="text-gray-700">
                    123 South Seventh Street<br />
                    St. Louis, MO 63101<br />
                    Downtown St. Louis
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Phone</h3>
                  <p className="text-gray-700">
                    <a href="tel:+13145551234" className="text-red-700 hover:underline">
                      (314) 555-1234
                    </a>
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Email</h3>
                  <p className="text-gray-700">
                    <a href="mailto:info@baritaliastl.com" className="text-red-700 hover:underline">
                      info@baritaliastl.com
                    </a>
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Hours</h3>
                  <p className="text-gray-700">
                    Monday - Thursday: 5:00 PM - 10:00 PM<br />
                    Friday - Saturday: 5:00 PM - 11:00 PM<br />
                    Sunday: 5:00 PM - 9:00 PM<br />
                    <span className="text-red-700 font-bold">Closed Tuesdays</span>
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Follow Us</h3>
                  <div className="flex gap-4">
                    <a href="#" className="text-red-700 hover:text-red-900">Instagram</a>
                    <a href="#" className="text-red-700 hover:text-red-900">Facebook</a>
                    <a href="#" className="text-red-700 hover:text-red-900">Twitter</a>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold mb-6 text-red-700">Private Events</h2>
              <p className="text-gray-700 mb-4">
                BarItalia is the perfect venue for your special occasion. We offer customizable menus and
                exclusive event spaces for:
              </p>
              <ul className="space-y-3 text-gray-700 mb-6">
                <li>✓ Wedding Receptions</li>
                <li>✓ Corporate Functions</li>
                <li>✓ Birthday Celebrations</li>
                <li>✓ Anniversary Dinners</li>
                <li>✓ Private Tastings</li>
              </ul>
              <p className="text-gray-700 mb-6">
                Contact our events coordinator at{' '}
                <a href="mailto:events@baritaliastl.com" className="text-red-700 hover:underline">
                  events@baritaliastl.com
                </a>
              </p>
              <button className="w-full bg-red-700 text-white font-bold py-3 rounded-lg hover:bg-red-800 transition">
                Request Event Details
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 p-8 rounded-lg border-2 border-yellow-300">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Catering Available</h3>
            <p className="text-gray-700">
              Bring the flavors of BarItalia to your location. We offer professional catering services
              for events of any size. Call us for a custom quote.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
