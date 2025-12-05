export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  parent_id: string | null
  image_path: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  payment_terms: string | null
  lead_time_days: number | null
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  sku: string
  barcode: string
  category_id: string | null
  supplier_id: string | null
  brand: string | null
  cost_price: number
  selling_price: number
  compare_at_price: number | null
  tax_rate: number
  weight: number | null
  weight_unit: string | null
  is_active: boolean
  is_featured: boolean
  has_variants: boolean
  track_inventory: boolean
  allow_backorder: boolean
  low_stock_threshold: number
  image_url: string | null
  images: string[]
  tags: string[]
  meta_title: string | null
  meta_description: string | null
  created_at: string
  updated_at: string
  category?: Category
  supplier?: Supplier
}

export interface VariantOption {
  id: string
  name: string
  display_name: string
  sort_order: number
}

export interface VariantOptionValue {
  id: string
  option_id: string
  value: string
  sort_order: number
}

export interface ProductVariant {
  id: string
  product_id: string
  sku: string
  barcode: string
  option_values: Record<string, string>
  cost_price: number | null
  selling_price: number | null
  compare_at_price: number | null
  weight: number | null
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  name: string
  tax_rate: number
}

export interface Location {
  id: string
  name: string
  address: string | null
  city: string | null
  country: string | null
  phone: string | null
  is_active: boolean
  is_default: boolean
  created_at: string
}

export interface Inventory {
  id: string
  product_id: string | null
  variant_id: string | null
  location_id: string
  quantity: number
  reserved_quantity: number
  reorder_point: number
  reorder_quantity: number
  bin_location: string | null
  updated_at: string
  product?: Product
  variant?: ProductVariant
  location?: Location
}

export interface Customer {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  notes: string | null
  loyalty_points: number
  total_spent: number
  total_orders: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Discount {
  id: string
  code: string
  name: string
  description: string | null
  discount_type: "percentage" | "fixed_amount" | "buy_x_get_y"
  discount_value: number
  min_purchase_amount: number | null
  max_discount_amount: number | null
  usage_limit: number | null
  usage_count: number
  per_customer_limit: number | null
  start_date: string | null
  end_date: string | null
  is_active: boolean
  applies_to: "all" | "specific_products" | "specific_categories"
  product_ids: string[]
  category_ids: string[]
  created_at: string
}

export interface Order {
  id: string
  order_number: string
  customer_id: string | null
  location_id: string
  status: "pending" | "processing" | "completed" | "cancelled" | "refunded"
  payment_status: "pending" | "partial" | "paid" | "refunded"
  subtotal: number
  discount_amount: number
  tax_amount: number
  total_amount: number
  change_amount: number
  total?: number // alias for backward compatibility
  notes: string | null
  staff_id: string | null
  discount_id: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  customer?: Customer
  items?: OrderItem[]
  payments?: Payment[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  variant_id: string | null
  product_name: string
  variant_name: string | null
  sku: string
  quantity: number
  unit_price: number
  cost_price: number
  discount_amount: number
  tax_amount: number
  total_amount: number
  total?: number // alias for backward compatibility
  product?: Product
  variant?: ProductVariant
}

export interface Payment {
  id: string
  order_id: string
  payment_method: "cash" | "mpesa" | "card" | "bank_transfer" | "credit"
  amount: number
  reference_number: string | null
  mpesa_receipt: string | null
  mpesa_phone: string | null
  status: "pending" | "completed" | "failed" | "refunded"
  processed_at: string | null
  created_at: string
}

export interface PurchaseOrder {
  id: string
  po_number: string
  supplier_id: string
  location_id: string
  status: "draft" | "sent" | "partial" | "received" | "cancelled"
  subtotal: number
  tax_amount: number
  shipping_cost: number
  total: number
  expected_date: string | null
  received_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  supplier?: Supplier
  items?: PurchaseOrderItem[]
}

export interface PurchaseOrderItem {
  id: string
  purchase_order_id: string
  product_id: string | null
  variant_id: string | null
  quantity_ordered: number
  quantity_received: number
  unit_cost: number
  total: number
  product?: Product
  variant?: ProductVariant
}

export interface ReorderAlert {
  id: string
  product_id: string | null
  variant_id: string | null
  location_id: string
  current_quantity: number
  reorder_point: number
  suggested_quantity: number
  status: "pending" | "ordered" | "dismissed"
  purchase_order_id: string | null
  created_at: string
  resolved_at: string | null
  product?: Product
  variant?: ProductVariant
  location?: Location
}

// Analytics types
export interface DailySalesSummary {
  id: string
  date: string
  location_id: string
  total_orders: number
  total_revenue: number
  total_cost: number
  total_profit: number
  total_items_sold: number
  average_order_value: number
  cash_sales: number
  mpesa_sales: number
  card_sales: number
  other_sales: number
}

export interface ProductSalesStats {
  id: string
  product_id: string
  variant_id: string | null
  period_start: string
  period_end: string
  period_type: "daily" | "weekly" | "monthly"
  quantity_sold: number
  revenue: number
  cost: number
  profit: number
  avg_selling_price: number
}

// UI State types
export interface CartItem {
  product: Product
  variant?: ProductVariant
  quantity: number
  price: number
  discount: number
}

export interface POSState {
  items: CartItem[]
  customer: Customer | null
  discount: Discount | null
  notes: string
}
