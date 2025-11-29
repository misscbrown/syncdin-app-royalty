export interface Item {
  id: string;
  title: string;
  description: string;
  status: string;
}

export class ItemService {
  async getAll(): Promise<Item[]> {
    return [];
  }

  async getById(id: string): Promise<Item | null> {
    console.log(`Getting item by id: ${id}`);
    return null;
  }

  async create(data: Omit<Item, "id">): Promise<Item> {
    return {
      id: crypto.randomUUID(),
      ...data,
    };
  }

  async update(id: string, data: Partial<Item>): Promise<Item | null> {
    console.log(`Updating item: ${id}`, data);
    return null;
  }

  async delete(id: string): Promise<boolean> {
    console.log(`Deleting item: ${id}`);
    return false;
  }
}

export const itemService = new ItemService();
