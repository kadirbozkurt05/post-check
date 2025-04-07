import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Package, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';

interface Post {
  id: string;
  room_number: string;
  initials: string;
  type: 'letter' | 'package' | null;
  status: 'pending' | 'received';
  created_at: string;
}

export default function PublicPage() {
  const [roomNumber, setRoomNumber] = useState('');
  const [initials, setInitials] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate('/admin');
    }
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setHasSearched(true);

    try {
      const formattedRoomNumber = roomNumber.trim().toUpperCase();
      const formattedInitials = initials.trim().toUpperCase();

      // Fetch posts directly without setting claims
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('room_number', formattedRoomNumber)
        .eq('initials', formattedInitials)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset hasSearched when user starts typing
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
    setHasSearched(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Check Your Mail</h1>
          <p className="mt-2 text-gray-600">Enter your room number and initials to see your mail status</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6 mb-8">
          <div className="space-y-4">
            <div>
              <label htmlFor="roomNumber" className="block text-sm font-medium text-gray-700">
                Room Number
              </label>
              <input
                type="text"
                id="roomNumber"
                value={roomNumber}
                onChange={(e) => handleInputChange(setRoomNumber, e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                placeholder="e.g., 210"
              />
            </div>
            <div>
              <label htmlFor="initials" className="block text-sm font-medium text-gray-700">
                Initials
              </label>
              <input
                type="text"
                id="initials"
                value={initials}
                onChange={(e) => handleInputChange(setInitials, e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                placeholder="e.g., KB"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check Mail'}
            </button>
          </div>
        </form>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        ) : hasSearched && (
          <>
            {posts.length > 0 ? (
              <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="p-4 bg-blue-50 border-b border-blue-100">
                  <h2 className="text-lg font-semibold text-blue-900">
                    Mail found for Room {roomNumber.toUpperCase()} - {initials.toUpperCase()}
                  </h2>
                </div>
                <ul className="divide-y divide-gray-200">
                  {posts.map((post) => (
                    <li key={post.id} className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 text-gray-400">
                          {post.type === 'package' ? (
                            <Package className="h-6 w-6 text-blue-500" />
                          ) : post.type === 'letter' ? (
                            <Mail className="h-6 w-6 text-green-500" />
                          ) : (
                            <div className="h-6 w-6" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {post.type ? post.type.charAt(0).toUpperCase() + post.type.slice(1) : 'Mail'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Received: {format(new Date(post.created_at), 'dd-MM-yyyy')}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              post.status === 'received'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {post.status === 'received' ? 'Picked up' : 'Ready for pickup'}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-white shadow-sm rounded-lg p-6 text-center">
                <p className="text-gray-500">No mail found for Room {roomNumber.toUpperCase()} - {initials.toUpperCase()}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}