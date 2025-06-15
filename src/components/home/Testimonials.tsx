
const testimonials = [
  {
    name: "Rahul Kumar",
    position: "Software Engineer",
    location: "Bangalore",
    review: "The web development course was exactly what I needed. Clear explanations and practical projects helped me improve my skills significantly. Great value for money!",
    timeAgo: "1 week ago",
    initials: "RK",
    rating: 5
  },
  {
    name: "Anjali Patel",
    position: "Frontend Developer",
    location: "Mumbai",
    review: "Purchased multiple templates and they're all top-notch. Clean code, modern design, and excellent documentation. The support team is very responsive!",
    timeAgo: "2 weeks ago",
    initials: "AP",
    rating: 5
  },
  {
    name: "Vikram Singh",
    position: "Full Stack Developer",
    location: "Delhi",
    review: "The React.js course bundle is fantastic! Updated content, real-world projects, and the included e-books are very helpful. Highly recommended for aspiring developers.",
    timeAgo: "3 weeks ago",
    initials: "VS",
    rating: 5
  },
  {
    name: "Priya Gupta",
    position: "UI/UX Designer",
    location: "Hyderabad",
    review: "Amazing collection of design resources and templates are modern and easy to customize. Perfect for both beginners and professionals like me.",
    timeAgo: "1 month ago",
    initials: "PG",
    rating: 4
  },
];

// Helper function to render stars
const StarRating = ({ rating }: { rating: number }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <svg
        key={i}
        className={`w-5 h-5 ${i <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
      </svg>
    );
  }
  return <div className="flex">{stars}</div>;
};

const Testimonials = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 animate-fade-in">
            Trusted by <span className="text-ybtBlue">Thousands</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto animate-fade-in">
            Join our community of successful developers and digital creators
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="bg-white p-6 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md animate-slide-in"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-ybtBlue font-bold mr-3">
                  {testimonial.initials}
                </div>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.position}, {testimonial.location}</p>
                </div>
              </div>
              
              <div className="mb-3">
                <StarRating rating={testimonial.rating} />
              </div>
              
              <p className="text-gray-700 mb-4">"{testimonial.review}"</p>
              
              <p className="text-gray-500 text-sm">{testimonial.timeAgo}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
