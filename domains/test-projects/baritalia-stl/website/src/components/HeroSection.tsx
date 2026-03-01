export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-r from-red-900 to-red-700 text-white py-32 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Authentic Italian Cuisine
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-yellow-100">
          Experience the flavors of Italy in downtown St. Louis
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <a
            href="/reservations"
            className="bg-yellow-400 text-red-900 font-bold px-8 py-4 rounded-lg hover:bg-yellow-300 transition inline-block"
          >
            Make a Reservation
          </a>
          <a
            href="/menu"
            className="bg-white text-red-900 font-bold px-8 py-4 rounded-lg hover:bg-gray-100 transition inline-block"
          >
            View Menu
          </a>
        </div>
      </div>
    </section>
  );
}
