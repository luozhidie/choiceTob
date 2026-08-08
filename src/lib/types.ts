export interface Product {
  id: string;
  name: string;
  images: string[];
  color_season: string;
  style_type: string;
  stock: number;
  wholesale_price: number;
  retail_price: number;
  attributes: {
    fabric: string;
    season: string;
    occasion: string;
    fit: string;
    sizes: string[];
  };
  description: string;
  supplier_id: string;
  is_hot: boolean;
}

export interface Supplier {
  id: string;
  company_name: string;
  contact_person: string;
  phone: string;
  main_categories: string[];
  brand: string;
  annual_capacity: string;
  rating: number;
  level: "A" | "B" | "C";
  status: string;
  created_at: string;
}

export interface VIPMember {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  level: "V1" | "V2" | "V3";
  annual_spend: number;
  discount_rate: number;
  return_rate: number;
  created_at: string;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  wholesale_price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  total_amount: number;
  status: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  payment_method: string;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  price: number;
  level: string;
  description: string;
  outline: string[];
  created_at: string;
}
