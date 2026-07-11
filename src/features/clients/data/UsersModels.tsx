export interface ClientUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  totalOrders: number;
  loyalty: "Bronze" | "Silver" | "Gold";
  active: boolean;
  avatar: string;
}

export const initialClients: ClientUser[] = [
  {
    id: 1,
    name: "Amina Diallo",
    email: "amina@email.com",
    phone: "+221 77 123 45 67",
    city: "Dakar",
    totalOrders: 12,
    loyalty: "Gold",
    active: true,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: 2,
    name: "Moussa Fall",
    email: "moussa@email.com",
    phone: "+221 78 456 78 90",
    city: "Thiès",
    totalOrders: 6,
    loyalty: "Silver",
    active: true,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: 3,
    name: "Saliou Ba",
    email: "saliou@email.com",
    phone: "+221 70 234 56 78",
    city: "Saint-Louis",
    totalOrders: 2,
    loyalty: "Bronze",
    active: false,
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80",
  },
];
