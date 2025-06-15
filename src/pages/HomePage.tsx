
import Hero from "@/components/home/Hero";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import Categories from "@/components/home/Categories";
import LatestBlogPosts from "@/components/home/LatestBlogPosts";
import Products from "@/components/home/Products";
import Community from "@/components/home/Community";
import Features from "@/components/home/Features";
import Testimonials from "@/components/home/Testimonials";

const HomePage = () => {
  return (
    <div>
      <Hero />
      <WhyChooseUs />
      <Categories />
      <LatestBlogPosts />
      <Products />
      <Community />
      <Features />
      <Testimonials />
    </div>
  );
};

export default HomePage;
