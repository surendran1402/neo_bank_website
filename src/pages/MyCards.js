import React, { useEffect, useState } from 'react';
import { bankingAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import CountUp from '../components/CountUp';
const maskCardNumber = (num) => {
  const s = String(num || '****6782').replaceAll(' ', '');
  if (s.length >= 4) {
    return `XXXX XXXX XXXX ${s.slice(-4)}`;
  }
  return 'XXXX XXXX XXXX 6782';
};

const MyCards = () => {
  const { token } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await bankingAPI.getAccounts(token);
        if (res.success) setCards(res.bankAccounts || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Cards</h1>
            <p className="text-gray-600">View all your cards and details</p>
          </div>
        </div>

        {loading ? (
          <div className="text-gray-500">Loading cards…</div>
        ) : cards.length === 0 ? (
          <div className="text-gray-500">No cards found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((c, idx) => (
              <div key={c.id || idx} className="overflow-visible">
                {/* Card visual */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white relative overflow-hidden aspect-[428/270] w-64 sm:w-72 md:w-80 lg:w-96
                  p-5 transition-transform duration-300 hover:scale-105 hover:shadow-xl hover:z-20">

                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full" />
                  <div className="absolute -right-10 top-10 w-28 h-28 bg-white/10 rounded-full" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-6 rounded bg-yellow-300/90" />
                      <div className="w-8 h-6 rounded bg-red-400/90 -ml-3" />
                    </div>
                    <span className="text-[10px] md:text-xs bg-green-700/90 rounded-full px-2 py-0.5">Active</span>
                  </div>

                  <div className="mt-4">
                    <p className="text-[10px] uppercase tracking-wider text-blue-100">Card Number</p>
                    <p className="font-mono font-semibold text-lg tracking-normal">{maskCardNumber(c.account_number)}</p>
                  </div>

                  <div className="absolute left-5 right-5 bottom-4 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-blue-100">Financial Institution</p>
                      <p className="text-sm font-semibold leading-tight">{c.bank_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-blue-100">Balance</p>
                      <p className="text-xl md:text-2xl font-bold text-green-500/90">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(c.balance) || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCards;
