import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { FeatureSection } from '@/components/FeatureSection';

export default function Home() {
  return (
    <main>
      <Header />
      <HeroSection />
      <FeatureSection />
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-8 text-gray-900">Welcome to BarItalia STL</h2>
          <p className="text-xl text-gray-600 text-center mb-8">
            Discover the authentic flavors of Italy in the heart of St. Louis.
            Since 2015, BarItalia has been serving exquisite Italian cuisine with passion and precision.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-4 text-red-700">Fresh Ingredients</h3>
              <p className="text-gray-600">
                We source the finest Italian ingredients and local produce to ensure every dish is exceptional.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-4 text-red-700">Expert Chefs</h3>
              <p className="text-gray-600">
                Our award-winning chefs bring decades of experience and authentic Italian culinary tradition.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-4 text-red-700">Warm Ambiance</h3>
              <p className="text-gray-600">
                Step into an elegant Italian atmosphere perfect for romantic dinners and special occasions.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
