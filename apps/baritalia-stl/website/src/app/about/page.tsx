import { Header } from '@/components/Header';

export default function About() {
  return (
    <main>
      <Header />
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-12 text-center text-gray-900">About BarItalia STL</h1>

          <div className="bg-gray-50 p-8 rounded-lg mb-12">
            <h2 className="text-3xl font-bold mb-4 text-red-700">Our Story</h2>
            <p className="text-lg text-gray-700 mb-4">
              Founded in 2015, BarItalia STL was established by a team of passionate Italian-American chefs
              dedicated to bringing authentic Italian cuisine to downtown St. Louis. What started as a
              neighborhood gem has grown into one of the city's most celebrated fine dining establishments.
            </p>
            <p className="text-lg text-gray-700">
              Our commitment to excellence is reflected in every dish we serve. From traditional pasta recipes
              passed down through generations to innovative interpretations of classic Italian cuisine, we
              celebrate the rich culinary heritage of Italy while embracing local Missouri ingredients.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-4 text-red-700">Our Philosophy</h3>
              <ul className="space-y-3 text-gray-700">
                <li>✓ Source only the finest ingredients</li>
                <li>✓ Honor traditional Italian cooking techniques</li>
                <li>✓ Support local farmers and suppliers</li>
                <li>✓ Create unforgettable dining experiences</li>
                <li>✓ Provide exceptional, personalized service</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-4 text-red-700">Awards & Recognition</h3>
              <ul className="space-y-3 text-gray-700">
                <li>★ Michelin Recommended (2023)</li>
                <li>★ St. Louis Magazine Best Italian Restaurant</li>
                <li>★ OpenTable Diners' Choice Award</li>
                <li>★ Wine Spectator Award of Excellence</li>
              </ul>
            </div>
          </div>

          <div className="bg-red-50 p-8 rounded-lg border-l-4 border-red-700">
            <h3 className="text-2xl font-bold mb-4 text-red-700">Chef's Note</h3>
            <p className="text-gray-700 italic">
              "At BarItalia, we believe that exceptional food comes from passion, precision, and respect for our
              ingredients. Every plate that leaves our kitchen tells a story of Italian tradition and St. Louis
              pride. We're honored to share our love of Italian cuisine with you."
            </p>
            <p className="text-right text-gray-700 font-bold mt-4">- Chef Marco Benedetti</p>
          </div>
        </div>
      </section>
    </main>
  );
}
