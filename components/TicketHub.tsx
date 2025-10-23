import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../services/firebase';
import { Ticket } from '../types';

declare const jspdf: any;
declare const XLSX: any;

interface TicketHubProps {
    user: { username: string; adminId: string };
    onLogout: () => void;
}

const issueOptions = [
  "Regular Delivery",
  "Late Delivery",
  "Regular Pick-up",
  "Pickup Missed Issue",
  "Zone Change",
  "Late Return Issue",
  "Rider Behaviour",
  "Rolling",
  "Fake Note",
  "Wrong Return",
  "Damaged",
  "Late Payment",
  "Refund",
  "Entry Issues",
  "Missing",
  "Activation",
  "Weight,Charge & Due Bill Issue",
  "COD Issue"
];

const hubOptions = [
    "Mawna Hub(Gazipur)", "Rajbari", "Gopalganj", "Meherpur", "Chuadanga", "Magura", "Narail", "Doulotpur(Khulna)", 
    "Benapol", "Bhanga hub", "Faridpur 2 hub", "Jeshore 2 nd hub", "Futallah", "Sonargaon", "Araihazar", "Baburail", 
    "Bantibazar", "Chandpur", "Chandina", "Raipur", "Haziganj", "Kachua(Chandpur)", "Chuddogram", "Feni", "Faridganj", 
    "Muradnagar", "Daudkandi", "Gouripur(Cumilla)", "Nangolkot", "Barura", "Laksham", "Madaripur", "Manikganj", 
    "Sharitpur", "Sirajdikhan", "Mirzapur", "BArguna", "Bhola", "Pirojpur", "Jhalokati", "Jamalpur", "Kishorganj", 
    "Netrokona", "Bhaluka", "Sherpur", "Teknaf", "Sitakundo", "FAtikchari", "Raozan", "RAngunia", "Chowmohoni", 
    "Sonaimuri", "Chatkil", "Companiganj(Noakhali)", "Senbag", "Keranirhat", "Chakoria", "Ling road", "Ukhiya", 
    "Khagrachari", "Rangabali", "Bandorban", "Thakurgaon", "Gaibandhah", "Narshiindi wearhouse", "Madhobdi", "Habiganj", 
    "Kotwali CTG", "Agrabad", "Halishaor", "Oxyzen", "Chakbazar(Ctg)", "Bakolia", "Hathazari", "Patenga", "City gate", 
    "Cox's Bazar", "Laxmipur", "Noakhali", "Feni", "B. Baria", "Bandor CTG", "Cumilla Sadar", "Cumilla Kandirpar", 
    "Panchlish", "Chandgaon", "Khulna", "Jeshore", "Kustia", "Satkhira", "Bagerhat", "Jhenaidah.", "Alamdanga", 
    "Moylapota", "Sylhet", "Moulvibazar", "Mymenshing", "Rajshahi", "Bogura", "Pabna Hub", "Sirajganj", "Dinajpur", 
    "Rangpur", "Narsingdi", "Tangail", "Munshiganj", "Faridpur"
];

// FIX: Pre-sort hub options to improve performance by avoiding re-sorting on every render.
const sortedHubOptions = [...hubOptions].sort();

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
);

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
);


const TicketHub: React.FC<TicketHubProps> = ({ user, onLogout }) => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newTicketId, setNewTicketId] = useState('');
    const [newHubName, setNewHubName] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');

    useEffect(() => {
        const ticketsRef = db.ref('tickets');
        const listener = ticketsRef.orderByChild('userId').equalTo(user.adminId).on('value', (snapshot) => {
            const data = snapshot.val();
            const loadedTickets: Ticket[] = [];
            if (data) {
                for (const key in data) {
                    loadedTickets.push({
                        id: key,
                        ...data[key]
                    });
                }
            }
            setTickets(loadedTickets.sort((a, b) => a.createdAt - b.createdAt));
            setIsLoading(false);
        });

        return () => ticketsRef.off('value', listener);
    }, [user.adminId]);

    const addTicket = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTicketId.trim() || !newHubName.trim() || !newTitle.trim()) return;

        const newTicket: Omit<Ticket, 'id'> = {
            ticketId: newTicketId,
            hubName: newHubName,
            title: newTitle,
            description: newDescription,
            createdAt: Date.now(),
            userId: user.adminId,
        };

        db.ref('tickets').push(newTicket);
        setNewTicketId('');
        setNewHubName('');
        setNewTitle('');
        setNewDescription('');
    };
    
    const updateTicket = useCallback((id: string, field: keyof Omit<Ticket, 'id' | 'createdAt' | 'userId'>, value: string) => {
        const ticketRef = db.ref(`tickets/${id}`);
        ticketRef.update({ [field]: value });
    }, []);

    const deleteTicket = (id: string) => {
        db.ref(`tickets/${id}`).remove();
    };

    const exportToPDF = () => {
        const doc = new jspdf.jsPDF();
        doc.text("Ticket Data", 14, 16);
        doc.autoTable({
            head: [['Ticket ID', 'HUB Name', 'Title', 'Description']],
            body: tickets.map(t => [t.ticketId, t.hubName, t.title, t.description]),
            startY: 20,
        });
        doc.save('tickets.pdf');
    };

    const exportToExcel = () => {
        const exportData = tickets.map(t => ({
            'Ticket ID': t.ticketId,
            'HUB Name': t.hubName,
            'Title': t.title,
            'Description': t.description,
         }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Tickets');
        XLSX.writeFile(workbook, 'tickets.xlsx');
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <header className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ticket Hub</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage and track your support tickets in real-time.</p>
                </div>
                 <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                    <div className="text-right">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">{user.username}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Admin ID: {user.adminId}</p>
                    </div>
                    <button onClick={onLogout} className="flex items-center justify-center p-2 text-sm font-medium text-white bg-gray-500 rounded-full hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-300">
                       <LogoutIcon />
                    </button>
                </div>
            </header>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Add New Ticket</h2>
                <form onSubmit={addTicket} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
                    <input
                        type="text"
                        placeholder="Ticket ID"
                        value={newTicketId}
                        onChange={(e) => setNewTicketId(e.target.value)}
                        className="w-full px-3 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        required
                    />
                     <select
                        value={newHubName}
                        onChange={(e) => setNewHubName(e.target.value)}
                        className="w-full px-3 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        required
                    >
                        <option value="" disabled>Select a HUB</option>
                        {sortedHubOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                    <select
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full px-3 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        required
                    >
                        <option value="" disabled>Select an issue type</option>
                        {issueOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                    <textarea
                        placeholder="Description"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        rows={1}
                        className="w-full px-3 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                    <button type="submit" className="flex items-center justify-center w-full px-4 py-2 text-white font-semibold bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-300 transform hover:scale-105">
                        <PlusIcon /> Add
                    </button>
                </form>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                 <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Ticket List</h2>
                        <div className="flex items-center space-x-2">
                            <button onClick={exportToPDF} className="flex items-center justify-center px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-300">
                                <DownloadIcon /> PDF
                            </button>
                            <button onClick={exportToExcel} className="flex items-center justify-center px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-300">
                                <DownloadIcon /> Excel
                            </button>
                        </div>
                    </div>
                    <span className="px-3 py-1 text-sm font-semibold text-indigo-600 bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-200 rounded-full">
                        Total Issues: {tickets.length}
                    </span>
                </div>
                {isLoading ? (
                    <p className="p-6 text-center text-gray-500 dark:text-gray-400">Loading tickets...</p>
                ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Ticket ID</th>
                                <th scope="col" className="px-6 py-3">HUB Name</th>
                                <th scope="col" className="px-6 py-3">Issue Title</th>
                                <th scope="col" className="px-6 py-3">Description</th>
                                <th scope="col" className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.map((ticket) => (
                                <tr key={ticket.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4">
                                        <input
                                            type="text"
                                            defaultValue={ticket.ticketId}
                                            onBlur={(e) => updateTicket(ticket.id, 'ticketId', e.target.value)}
                                            className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
                                        />
                                    </td>
                                     <td className="px-6 py-4">
                                        <select
                                            defaultValue={ticket.hubName}
                                            onChange={(e) => updateTicket(ticket.id, 'hubName', e.target.value)}
                                            className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
                                        >
                                            {sortedHubOptions.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                          <select
                                              defaultValue={ticket.title}
                                              onChange={(e) => updateTicket(ticket.id, 'title', e.target.value)}
                                              className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
                                          >
                                            {issueOptions.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                          </select>
                                    </td>
                                    <td className="px-6 py-4">
                                          <textarea
                                              defaultValue={ticket.description}
                                              onBlur={(e) => updateTicket(ticket.id, 'description', e.target.value)}
                                              rows={2}
                                              className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 resize-y"
                                          />
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => deleteTicket(ticket.id)} className="text-red-500 hover:text-red-700 transition">
                                            <TrashIcon />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 )}
            </div>
        </div>
    );
};

export default TicketHub;
