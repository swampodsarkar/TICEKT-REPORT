export interface Ticket {
  id: string; // Firebase key
  ticketId: string;
  hubName: string;
  title: string;
  description: string;
  createdAt: number;
  userId: string; // adminId of the user who created the ticket
}
