export interface MongoDataset {
  id: string;
  name: string;
  description: string;
  collections: Record<string, Record<string, unknown>[]>;
}

// A small document store mirroring the SQL "shop" domain, so the Mongo track
// feels familiar.
export const MONGO_DATASETS: MongoDataset[] = [
  {
    id: "store",
    name: "Shop (documents)",
    description: "A document store: users, products and orders as MongoDB collections.",
    collections: {
      users: [
        { _id: 1, name: "Amara", plan: "pro", age: 31, city: "Lagos" },
        { _id: 2, name: "Liam", plan: "free", age: 27, city: "Dublin" },
        { _id: 3, name: "Sofia", plan: "pro", age: 35, city: "Milan" },
        { _id: 4, name: "Kenji", plan: "enterprise", age: 42, city: "Tokyo" },
        { _id: 5, name: "Noor", plan: "free", age: 29, city: "Cairo" },
      ],
      products: [
        { _id: 1, name: "Keyboard", category: "Electronics", price: 89.99, stock: 40 },
        { _id: 2, name: "Mouse", category: "Electronics", price: 24.5, stock: 120 },
        { _id: 3, name: "Monitor", category: "Electronics", price: 219, stock: 18 },
        { _id: 4, name: "Desk Lamp", category: "Home", price: 32, stock: 75 },
        { _id: 5, name: "Chair", category: "Home", price: 249.99, stock: 12 },
        { _id: 6, name: "Notebook", category: "Stationery", price: 6.5, stock: 500 },
      ],
      orders: [
        { _id: 1, user: "Amara", status: "shipped", total: 139 },
        { _id: 2, user: "Sofia", status: "pending", total: 219 },
        { _id: 3, user: "Amara", status: "shipped", total: 54 },
        { _id: 4, user: "Kenji", status: "shipped", total: 389 },
        { _id: 5, user: "Liam", status: "pending", total: 24.5 },
      ],
    },
  },
];

export function getMongoDataset(id: string): MongoDataset {
  const d = MONGO_DATASETS.find((x) => x.id === id);
  if (!d) throw new Error(`Unknown Mongo dataset: ${id}`);
  return d;
}
