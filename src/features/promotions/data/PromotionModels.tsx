export interface Promotion {
  id: number;
  title: string;
  description: string;
  discount: number;
  code: string;
  imageUrl: string;
  active: boolean;
}

export const initialPromotions: Promotion[] = [
  {
    id: 1,
    title: "Burger Week",
    description: "Réduction de 20 % sur tous les burgers premium.",
    discount: 20,
    code: "BURGER20",
    imageUrl:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
    active: true,
  },
  {
    id: 2,
    title: "Pizza Duo",
    description: "Deux pizzas à partir de 24 € pendant le week-end.",
    discount: 15,
    code: "PIZZA15",
    imageUrl:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80",
    active: true,
  },
  {
    id: 3,
    title: "Happy Snack",
    description: "Offre spéciale sur les wraps et boissons.",
    discount: 10,
    code: "SNACK10",
    imageUrl:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80",
    active: false,
  },
];
