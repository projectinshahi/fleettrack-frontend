import { create } from "zustand";

interface Client {
  id: string;
  name: string;
}

interface ClientStore {
  selectedClient: Client | null;
  setSelectedClient: (client: Client | null) => void;
}

export const useClientStore = create<ClientStore>((set) => ({
  selectedClient: null,

  setSelectedClient: (client) =>
    set({
      selectedClient: client,
    }),
}));