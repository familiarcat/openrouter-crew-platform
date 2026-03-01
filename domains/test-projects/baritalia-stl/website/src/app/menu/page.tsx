import { Header } from '@/components/Header';

export default function Menu() {
  const courses = [
    {
      name: 'Antipasti',
      items: [
        { name: 'Bruschetta al Pomodoro', price: '$8' },
        { name: 'Caprese Salad', price: '$12' },
        { name: 'Calamari Fritti', price: '$14' },
      ]
    },
    {
      name: 'Pasta Classics',
      items: [
        { name: 'Spaghetti alla Carbonara', price: '$18' },
        { name: 'Fettuccine Alfredo', price: '$16' },
        { name: 'Lasagna Bolognese', price: '$20' },
        { name: 'Risotto ai Funghi', price: '$22' },
      ]
    },
    {
      name: 'Main Courses',
      items: [
        { name: 'Branzino al Forno', price: '$32' },
        { name: 'Veal Piccata', price: '$28' },
        { name: 'Osso Buco', price: '$34' },
      ]
    },
  ];

  return (
    <main>
      <Header />
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-12 text-center text-gray-900">Our Menu</h1>

          {courses.map((course) => (
            <div key={course.name} className="mb-12">
              <h2 className="text-3xl font-bold mb-6 text-red-700 border-b-2 border-red-700 pb-4">
                {course.name}
              </h2>
              <div className="space-y-4">
                {course.items.map((item) => (
                  <div key={item.name} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                    <span className="text-lg text-gray-800">{item.name}</span>
                    <span className="text-lg font-bold text-red-700">{item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-12 bg-yellow-50 p-8 rounded-lg border-2 border-yellow-300">
            <p className="text-gray-700">
              <strong>Wine Pairings Available:</strong> Ask our sommelier for perfect wine selections with any dish.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
