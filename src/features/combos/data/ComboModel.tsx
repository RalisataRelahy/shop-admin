// types/combo.ts
export interface ComboModel {
  id: number | string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_active: boolean;
}

// Combo enrichi avec les items qui le composent
export interface ComboWithItems extends ComboModel {
  itemIds: number[];
}

export interface MenuItem {
  id: number;
  name: string;
}