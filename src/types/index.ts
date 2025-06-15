
// Re-export all collection interfaces
export { BlogPost } from './blog';
export {
  Cart,
  CartItem,
  Coupon,
  Order,
  OrderItem,
  Address,
  Product,
  User
} from './collections';

export interface CategoryItem {
  title: string;
  icon: string;
  description: string;
}

export interface Feature {
  title: string;
  description: string;
  icon: string;
}

export interface Testimonial {
  name: string;
  position: string;
  location: string;
  review: string;
  rating: number;
  timeAgo: string;
  initials: string;
}

export interface SocialStat {
  platform: string;
  count: number;
  label: string;
  icon: string;
}
