import type { DemoData } from './types';

function saleDate(daysAgo: number, hour: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 12, 0, 0);
  return date.toISOString();
}

export const initialData: DemoData = {
  products: [
    { id: 'p01', name: 'Studio Headphones', sku: 'AUD-101', category: 'Electronics', price: 89.99, stock: 34, minStock: 10 },
    { id: 'p02', name: 'Wireless Mouse', sku: 'ACC-204', category: 'Accessories', price: 32.5, stock: 8, minStock: 12 },
    { id: 'p03', name: 'Mechanical Keyboard', sku: 'ACC-208', category: 'Accessories', price: 119, stock: 21, minStock: 8 },
    { id: 'p04', name: 'Desk Lamp', sku: 'HOM-310', category: 'Home & Living', price: 46, stock: 17, minStock: 8 },
    { id: 'p05', name: 'Ergonomic Chair', sku: 'OFF-401', category: 'Office', price: 329, stock: 6, minStock: 8 },
    { id: 'p06', name: 'USB-C Hub', sku: 'ELE-112', category: 'Electronics', price: 58.75, stock: 42, minStock: 12 },
    { id: 'p07', name: 'Notebook Set', sku: 'OFF-415', category: 'Office', price: 18.5, stock: 55, minStock: 20 },
    { id: 'p08', name: 'Ceramic Planter', sku: 'HOM-324', category: 'Home & Living', price: 27, stock: 0, minStock: 6 },
    { id: 'p09', name: 'Portable Speaker', sku: 'AUD-124', category: 'Electronics', price: 74.99, stock: 19, minStock: 8 },
    { id: 'p10', name: 'Monitor Stand', sku: 'OFF-428', category: 'Office', price: 64, stock: 11, minStock: 8 },
    { id: 'p11', name: 'Water Bottle', sku: 'ACC-231', category: 'Accessories', price: 24, stock: 38, minStock: 12 },
    { id: 'p12', name: 'Air Purifier', sku: 'APP-510', category: 'Appliances', price: 189, stock: 7, minStock: 8 },
    { id: 'p13', name: 'Smart Plug Duo', sku: 'ELE-139', category: 'Electronics', price: 39.9, stock: 26, minStock: 10 },
    { id: 'p14', name: 'Woven Storage Basket', sku: 'HOM-339', category: 'Home & Living', price: 42, stock: 14, minStock: 6 },
    { id: 'p15', name: 'Standing Desk', sku: 'OFF-449', category: 'Office', price: 549, stock: 4, minStock: 5 },
    { id: 'p16', name: 'Webcam HD', sku: 'ELE-153', category: 'Electronics', price: 79, stock: 23, minStock: 8 },
    { id: 'p17', name: 'Cotton Throw', sku: 'HOM-352', category: 'Home & Living', price: 68, stock: 12, minStock: 6 },
    { id: 'p18', name: 'Laptop Sleeve', sku: 'ACC-256', category: 'Accessories', price: 35, stock: 31, minStock: 10 },
    { id: 'p19', name: 'Espresso Maker', sku: 'APP-536', category: 'Appliances', price: 249, stock: 9, minStock: 6 },
    { id: 'p20', name: 'Filing Cabinet', sku: 'OFF-467', category: 'Office', price: 215, stock: 5, minStock: 6 },
    { id: 'p21', name: 'LED Strip Lights', sku: 'ELE-166', category: 'Electronics', price: 29.5, stock: 48, minStock: 15 },
    { id: 'p22', name: 'Glass Food Container', sku: 'HOM-373', category: 'Home & Living', price: 22, stock: 25, minStock: 10 },
    { id: 'p23', name: 'Wireless Charger', sku: 'ACC-279', category: 'Accessories', price: 44, stock: 3, minStock: 8 },
    { id: 'p24', name: 'Air Fryer Compact', sku: 'APP-548', category: 'Appliances', price: 139, stock: 13, minStock: 6 },
  ],
  customers: [
    { id: 'c01', name: 'Olivia Chen', email: 'olivia@northstar.co', phone: '+1 (415) 555-0182', company: 'Northstar Studio', registeredAt: '2025-08-14' },
    { id: 'c02', name: 'Marcus Rivera', email: 'marcus@fieldwork.com', phone: '+1 (312) 555-0147', company: 'Fieldwork Co.', registeredAt: '2025-09-02' },
    { id: 'c03', name: 'Sofia Patel', email: 'sofia@brightlane.io', phone: '+1 (646) 555-0109', company: 'Brightlane', registeredAt: '2025-09-18' },
    { id: 'c04', name: 'Ethan Brooks', email: 'ethan@oakandmain.com', phone: '+1 (512) 555-0173', company: 'Oak & Main', registeredAt: '2025-10-05' },
    { id: 'c05', name: 'Isabella Nguyen', email: 'isabella@monohaus.com', phone: '+1 (206) 555-0191', company: 'Monohaus', registeredAt: '2025-10-21' },
    { id: 'c06', name: 'James Wilson', email: 'james@studiowest.net', phone: '+1 (213) 555-0134', company: 'Studio West', registeredAt: '2025-11-07' },
    { id: 'c07', name: 'Amara Johnson', email: 'amara@kindredgoods.com', phone: '+1 (404) 555-0168', company: 'Kindred Goods', registeredAt: '2025-11-19' },
    { id: 'c08', name: 'Lucas Martin', email: 'lucas@moderneast.co', phone: '+1 (718) 555-0126', company: 'Modern East', registeredAt: '2025-12-03' },
    { id: 'c09', name: 'Mia Thompson', email: 'mia@floraandform.com', phone: '+1 (503) 555-0155', company: 'Flora & Form', registeredAt: '2026-01-09' },
    { id: 'c10', name: 'Noah Kim', email: 'noah@pivotalworks.io', phone: '+1 (617) 555-0118', company: 'Pivotal Works', registeredAt: '2026-01-22' },
    { id: 'c11', name: 'Grace Anderson', email: 'grace@coastline.design', phone: '+1 (305) 555-0193', company: 'Coastline Design', registeredAt: '2026-02-11' },
    { id: 'c12', name: 'Leo Garcia', email: 'leo@everydaymarket.shop', phone: '+1 (210) 555-0179', company: 'Everyday Market', registeredAt: '2026-02-28' },
  ],
  sales: [
    { id: 'SW-2048', customerId: 'c01', customerName: 'Olivia Chen', date: saleDate(0, 10), items: [{ productId: 'p01', quantity: 2, unitPrice: 89.99 }, { productId: 'p06', quantity: 1, unitPrice: 58.75 }], total: 238.73, status: 'completed' },
    { id: 'SW-2047', customerId: 'c04', customerName: 'Ethan Brooks', date: saleDate(0, 9), items: [{ productId: 'p05', quantity: 1, unitPrice: 329 }, { productId: 'p07', quantity: 3, unitPrice: 18.5 }], total: 384.5, status: 'completed' },
    { id: 'SW-2046', customerId: 'c02', customerName: 'Marcus Rivera', date: saleDate(1, 11), items: [{ productId: 'p03', quantity: 1, unitPrice: 119 }, { productId: 'p18', quantity: 2, unitPrice: 35 }], total: 189, status: 'completed' },
    { id: 'SW-2045', customerId: 'c09', customerName: 'Mia Thompson', date: saleDate(1, 9), items: [{ productId: 'p14', quantity: 2, unitPrice: 42 }, { productId: 'p17', quantity: 1, unitPrice: 68 }], total: 152, status: 'completed' },
    { id: 'SW-2044', customerId: 'c03', customerName: 'Sofia Patel', date: saleDate(2, 9), items: [{ productId: 'p16', quantity: 2, unitPrice: 79 }, { productId: 'p13', quantity: 1, unitPrice: 39.9 }], total: 197.9, status: 'completed' },
    { id: 'SW-2043', customerId: 'c07', customerName: 'Amara Johnson', date: saleDate(2, 13), items: [{ productId: 'p19', quantity: 1, unitPrice: 249 }], total: 249, status: 'completed' },
    { id: 'SW-2042', customerId: 'c05', customerName: 'Isabella Nguyen', date: saleDate(3, 10), items: [{ productId: 'p02', quantity: 2, unitPrice: 32.5 }, { productId: 'p11', quantity: 3, unitPrice: 24 }], total: 137, status: 'completed' },
    { id: 'SW-2041', customerId: 'c08', customerName: 'Lucas Martin', date: saleDate(3, 14), items: [{ productId: 'p15', quantity: 1, unitPrice: 549 }, { productId: 'p10', quantity: 1, unitPrice: 64 }], total: 613, status: 'completed' },
    { id: 'SW-2040', customerId: 'c12', customerName: 'Leo Garcia', date: saleDate(4, 9), items: [{ productId: 'p24', quantity: 2, unitPrice: 139 }], total: 278, status: 'completed' },
    { id: 'SW-2039', customerId: 'c06', customerName: 'James Wilson', date: saleDate(5, 16), items: [{ productId: 'p09', quantity: 2, unitPrice: 74.99 }, { productId: 'p21', quantity: 4, unitPrice: 29.5 }], total: 267.98, status: 'completed' },
    { id: 'SW-2038', customerId: 'c10', customerName: 'Noah Kim', date: saleDate(8, 11), items: [{ productId: 'p12', quantity: 1, unitPrice: 189 }, { productId: 'p22', quantity: 3, unitPrice: 22 }], total: 255, status: 'completed' },
    { id: 'SW-2037', customerId: 'c11', customerName: 'Grace Anderson', date: saleDate(11, 15), items: [{ productId: 'p04', quantity: 2, unitPrice: 46 }, { productId: 'p08', quantity: 1, unitPrice: 27 }], total: 119, status: 'completed' },
    { id: 'SW-2036', customerId: 'c01', customerName: 'Olivia Chen', date: saleDate(18, 12), items: [{ productId: 'p03', quantity: 1, unitPrice: 119 }, { productId: 'p23', quantity: 2, unitPrice: 44 }], total: 207, status: 'completed' },
    { id: 'SW-2035', customerId: 'c04', customerName: 'Ethan Brooks', date: saleDate(25, 10), items: [{ productId: 'p20', quantity: 1, unitPrice: 215 }, { productId: 'p07', quantity: 5, unitPrice: 18.5 }], total: 307.5, status: 'completed' },
    { id: 'SW-2034', customerId: 'c09', customerName: 'Mia Thompson', date: saleDate(32, 14), items: [{ productId: 'p01', quantity: 1, unitPrice: 89.99 }, { productId: 'p18', quantity: 1, unitPrice: 35 }], total: 124.99, status: 'completed' },
    { id: 'SW-2033', customerId: 'c03', customerName: 'Sofia Patel', date: saleDate(43, 9), items: [{ productId: 'p13', quantity: 3, unitPrice: 39.9 }, { productId: 'p06', quantity: 2, unitPrice: 58.75 }], total: 236.2, status: 'completed' },
    { id: 'SW-2032', customerId: 'c07', customerName: 'Amara Johnson', date: saleDate(55, 16), items: [{ productId: 'p17', quantity: 2, unitPrice: 68 }, { productId: 'p14', quantity: 1, unitPrice: 42 }], total: 178, status: 'completed' },
    { id: 'SW-2031', customerId: 'c02', customerName: 'Marcus Rivera', date: saleDate(76, 13), items: [{ productId: 'p16', quantity: 1, unitPrice: 79 }, { productId: 'p10', quantity: 2, unitPrice: 64 }], total: 207, status: 'completed' },
  ],
};
