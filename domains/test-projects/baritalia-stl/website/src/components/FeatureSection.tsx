export function FeatureSection() {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900">Award-Winning</h3>
            <p className="text-gray-600">
              Recognized by Michelin and acclaimed by St. Louis Magazine for exceptional cuisine
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">👨‍🍳</div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900">Expert Chefs</h3>
            <p className="text-gray-600">
              Our chefs bring decades of experience and authentic Italian culinary expertise
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🍷</div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900">Fine Wines</h3>
            <p className="text-gray-600">
              Curated wine selection from Italy and around the world to complement every dish
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
