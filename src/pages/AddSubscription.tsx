import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatIndianCurrency } from '../utils/currency';

const categories = [
  'Streaming',
  'Gaming',
  'Music',
  'Cloud Storage',
  'Software',
  'News',
  'Fitness',
  'Other'
];

const billingFrequencies = [
  { id: 'monthly', label: 'Monthly', months: 1 },
  { id: 'quarterly', label: 'Quarterly', months: 3 },
  { id: 'half-yearly', label: 'Half Yearly', months: 6 },
  { id: 'yearly', label: 'Yearly', months: 12 }
];

export default function AddSubscription() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    startDate: '',
    billingFrequency: 'monthly',
    billingDate: '1',
    category: 'Streaming',
    reminderDays: '3'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to add a subscription');
      return;
    }

    setLoading(true);
    try {
      // Validate amount
      const inputAmount = parseFloat(formData.amount);
      if (isNaN(inputAmount) || inputAmount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      // Validate start date
      if (!formData.startDate) {
        throw new Error('Please select a start date');
      }

      const frequency = billingFrequencies.find(f => f.id === formData.billingFrequency);
      if (!frequency) {
        throw new Error('Invalid billing frequency');
      }

      // Calculate monthly amount
      const monthlyAmount = inputAmount / frequency.months;

      // Log the data being sent to Supabase
      const subscriptionData = {
        user_id: user.id,
        name: formData.name.trim(),
        amount: monthlyAmount,
        actual_amount: inputAmount,
        billing_frequency: formData.billingFrequency,
        start_date: formData.startDate,
        billing_date: parseInt(formData.billingDate),
        category: formData.category,
        reminder_days: parseInt(formData.reminderDays)
      };
      
      console.log('Sending data to Supabase:', subscriptionData);

      const { data, error } = await supabase
        .from('subscriptions')
        .insert([subscriptionData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', error);
        throw new Error(error.message || 'Failed to add subscription');
      }

      console.log('Successfully added subscription:', data);
      toast.success('Subscription added successfully!');
      navigate('/');
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to add subscription. Please try again.';
      toast.error(errorMessage);
      console.error('Error adding subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Add New Subscription</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow rounded-lg p-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Subscription Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              placeholder="Netflix, Spotify, etc."
            />
          </div>

          <div>
            <label htmlFor="billingFrequency" className="block text-sm font-medium text-gray-700">
              Billing Frequency
            </label>
            <select
              id="billingFrequency"
              name="billingFrequency"
              required
              value={formData.billingFrequency}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            >
              {billingFrequencies.map(frequency => (
                <option key={frequency.id} value={frequency.id}>
                  {frequency.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              {formData.billingFrequency === 'monthly' ? 'Monthly Amount' : `Amount per ${formData.billingFrequency.replace('-', ' ')}`}
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₹</span>
              </div>
              <input
                type="number"
                step="0.01"
                id="amount"
                name="amount"
                required
                value={formData.amount}
                onChange={handleChange}
                className="block w-full pl-7 rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                placeholder="0.00"
              />
            </div>
            {formData.billingFrequency !== 'monthly' && formData.amount && (
              <p className="mt-1 text-sm text-gray-500">
                Monthly equivalent: {formatIndianCurrency(parseFloat(formData.amount) / (billingFrequencies.find(f => f.id === formData.billingFrequency)?.months || 1))}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              required
              value={formData.startDate}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="billingDate" className="block text-sm font-medium text-gray-700">
              {formData.billingFrequency === 'monthly' 
                ? 'Billing Date (Day of month)'
                : `First Billing Date`}
            </label>
            <select
              id="billingDate"
              name="billingDate"
              required
              value={formData.billingDate}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="category"
              name="category"
              required
              value={formData.category}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="reminderDays" className="block text-sm font-medium text-gray-700">
              Reminder Days Before
            </label>
            <input
              type="number"
              id="reminderDays"
              name="reminderDays"
              min="0"
              max="30"
              required
              value={formData.reminderDays}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              'Adding...'
            ) : (
              <>
                <Plus className="h-5 w-5 mr-2" />
                Add Subscription
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}