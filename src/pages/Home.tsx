import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Calendar, DollarSign, Settings, Edit } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { formatIndianCurrency } from '../utils/currency';
import { toast } from 'react-hot-toast';

interface Subscription {
  id: string;
  name: string;
  amount: number;
  actual_amount: number;
  billing_frequency: string;
  start_date: string;
  billing_date: number;
  category: string;
  reminder_days: number;
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, [user]);

  const fetchSubscriptions = async () => {
    try {
      console.log('Fetching subscriptions...');  // Debug log
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('billing_date', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);  // Debug log
        throw error;
      }
      
      console.log('Fetched data:', data);  // Debug log
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const calculateNextBillingDate = (subscription: Subscription) => {
    const { billing_date, billing_frequency, start_date } = subscription;
    const today = new Date();
    const startDate = new Date(start_date);
    
    // Get months to add based on frequency
    const frequencyMonths = {
      'monthly': 1,
      'quarterly': 3,
      'half-yearly': 6,
      'yearly': 12
    }[billing_frequency] || 1;

    // Find the next billing date
    let nextBilling = new Date(startDate);
    nextBilling.setDate(billing_date);

    // Keep adding frequency months until we find a future date
    while (nextBilling <= today) {
      nextBilling.setMonth(nextBilling.getMonth() + frequencyMonths);
    }
    
    return nextBilling;
  };

  const getNextDueSubscription = () => {
    if (!subscriptions.length) return null;
    
    const today = new Date();
    const upcoming = subscriptions
      .map(sub => ({
        ...sub,
        nextBilling: calculateNextBillingDate(sub)
      }))
      .sort((a, b) => a.nextBilling.getTime() - b.nextBilling.getTime());
    
    return upcoming[0];
  };

  const calculateTotalSpending = () => {
    const monthly = subscriptions.reduce((sum, sub) => {
      const amount = typeof sub.amount === 'number' ? sub.amount : 0;
      return sum + amount;
    }, 0);
    
    return {
      monthly,
      yearly: monthly * 12
    };
  };

  const nextDue = getNextDueSubscription();
  const spending = calculateTotalSpending();

  const getBillingFrequencyLabel = (frequency: string) => {
    const frequencies: Record<string, string> = {
      'monthly': 'Monthly',
      'quarterly': 'Quarterly',
      'half-yearly': 'Half Yearly',
      'yearly': 'Yearly'
    };
    return frequencies[frequency] || frequency;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">My Subscriptions</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/add-subscription')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add New
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <Settings className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Next Due Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Calendar className="h-6 w-6 text-indigo-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Next Due</h2>
            </div>
            {nextDue ? (
              <div>
                <p className="text-2xl font-bold text-gray-900">{nextDue.name}</p>
                <p className="text-gray-600">
                  Due on {format(nextDue.nextBilling, 'MMMM d, yyyy')}
                </p>
                <p className="mt-2 text-lg font-semibold text-indigo-600">
                  {formatIndianCurrency(nextDue.actual_amount)}
                  <span className="text-sm text-gray-500 ml-1">
                    ({getBillingFrequencyLabel(nextDue.billing_frequency).toLowerCase()})
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-gray-600">No upcoming payments</p>
            )}
          </div>

          {/* Monthly Spending Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <DollarSign className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Monthly Spending</h2>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {formatIndianCurrency(spending.monthly)}
            </p>
            <p className="text-gray-600">per month</p>
          </div>

          {/* Yearly Spending Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <DollarSign className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Yearly Spending</h2>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {formatIndianCurrency(spending.yearly)}
            </p>
            <p className="text-gray-600">per year</p>
          </div>
        </div>

        {/* Subscriptions List */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All Subscriptions</h2>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading subscriptions...</p>
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <p className="text-gray-600 mb-4">No subscriptions added yet</p>
              <button
                onClick={() => navigate('/add-subscription')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Your First Subscription
              </button>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {subscriptions.map((subscription) => {
                  const nextBilling = calculateNextBillingDate(subscription);
                  const daysUntilBilling = Math.ceil(
                    (nextBilling.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <li key={subscription.id} className="hover:bg-gray-50">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex justify-between">
                          {/* Left side: Name, billing info, and edit icon */}
                          <div className="flex-1">
                            <div className="flex items-center">
                              <p className="text-lg font-medium text-indigo-600 truncate">
                                {subscription.name}
                              </p>
                              <button
                                onClick={() => navigate(`/edit-subscription/${subscription.id}`)}
                                className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                                title="Edit Subscription"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="mt-1 text-sm text-gray-600">
                              Bills {getBillingFrequencyLabel(subscription.billing_frequency).toLowerCase()} on day {subscription.billing_date}
                            </p>
                            <div className="mt-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {subscription.category}
                              </span>
                            </div>
                          </div>

                          {/* Right side: Amount and next payment */}
                          <div className="text-right ml-6">
                            <p className="text-lg font-semibold text-gray-900">
                              {formatIndianCurrency(subscription.actual_amount)}
                              <span className="text-sm text-gray-500 ml-1">
                                per {getBillingFrequencyLabel(subscription.billing_frequency).toLowerCase()}
                              </span>
                            </p>
                            {subscription.billing_frequency !== 'monthly' && (
                              <p className="text-sm text-gray-500">
                                (≈{formatIndianCurrency(subscription.amount)} monthly)
                              </p>
                            )}
                            <p className="mt-1 text-sm text-gray-600">
                              Next payment on {format(nextBilling, 'MMM d, yyyy')}
                              <br />
                              <span className="text-xs text-gray-500">
                                ({daysUntilBilling} days away)
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}