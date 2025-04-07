import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Package, Mail, Search, Filter, Printer, Plus, LogOut, X, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parse } from 'date-fns';

interface Post {
  id: string;
  room_number: string;
  initials: string;
  type: 'letter' | 'package' | null;
  status: 'pending' | 'received';
  created_at: string;
}

function AdminPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'received'>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [newPost, setNewPost] = useState({
    room_number: '',
    initials: '',
    type: '' as 'letter' | 'package' | null,
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      toast.error('Failed to fetch posts');
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('');
  };

  const markAsReceived = async (id: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ status: 'received' })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Post marked as received');
      fetchPosts();
    } catch (error) {
      toast.error('Failed to update post status');
      console.error('Error updating post:', error);
    }
  };

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('posts')
        .insert([{
          room_number: newPost.room_number.toUpperCase(),
          initials: newPost.initials.toUpperCase(),
          type: newPost.type || null,
          status: 'pending'
        }]);

      if (error) throw error;
      
      toast.success('Post added successfully');
      setShowAddModal(false);
      setNewPost({ room_number: '', initials: '', type: null });
      fetchPosts();
    } catch (error) {
      toast.error('Failed to add post');
      console.error('Error adding post:', error);
    }
  };

  const handleEditPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    try {
      const { error } = await supabase
        .from('posts')
        .update({
          room_number: editingPost.room_number.toUpperCase(),
          initials: editingPost.initials.toUpperCase(),
          type: editingPost.type,
          status: editingPost.status,
          created_at: editingPost.created_at
        })
        .eq('id', editingPost.id);

      if (error) throw error;
      
      toast.success('Post updated successfully');
      setShowEditModal(false);
      setEditingPost(null);
      fetchPosts();
    } catch (error) {
      toast.error('Failed to update post');
      console.error('Error updating post:', error);
    }
  };

  const handlePrint = () => {
    const printContent = filteredPosts.map(post => ({
      room: post.room_number,
      initials: post.initials,
      date: format(new Date(post.created_at), 'dd-MM-yyyy')
    }));

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Posts List</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h2 { margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { 
                border: 1px solid #000; 
                padding: 8px; 
                text-align: left; 
              }
              th { background-color: #f8f9fa; }
              .date { text-align: right; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <h2>Ibis Hotel Posts List</h2>
            <div class="date">Date: ${format(new Date(), 'dd-MM-yyyy')}</div>
            <table>
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Initials</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${printContent.map(item => `
                  <tr>
                    <td>${item.room}</td>
                    <td>${item.initials}</td>
                    <td>${item.date}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = (
      post.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.initials.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    
    const matchesDate = !dateFilter || 
      format(new Date(post.created_at), 'yyyy-MM-dd') === dateFilter;

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add New Post
          </button>
          <button
            onClick={handleLogout}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-300 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by room or initials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 h-5 w-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'received')}
              className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="received">Received</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <p className="text-gray-600">
              Showing {filteredPosts.length} posts
            </p>
            {(searchTerm || statusFilter !== 'all' || dateFilter) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </button>
            )}
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Printer className="h-5 w-5" />
            Print List
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        ) : (
          <>
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-lg shadow p-6 flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  {post.type === 'package' ? (
                    <Package className="h-6 w-6 text-blue-500" />
                  ) : post.type === 'letter' ? (
                    <Mail className="h-6 w-6 text-green-500" />
                  ) : (
                    <div className="h-6 w-6" />
                  )}
                  <div>
                    <p className="font-semibold">
                      Room {post.room_number} - {post.initials}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(post.created_at), 'dd-MM-yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      post.status === 'received'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {post.status}
                  </span>
                  
                  <button
                    onClick={() => {
                      setEditingPost(post);
                      setShowEditModal(true);
                    }}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  
                  {post.status === 'pending' && (
                    <button
                      onClick={() => markAsReceived(post.id)}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                    >
                      Mark Received
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {filteredPosts.length === 0 && (
              <p className="text-center text-gray-500 py-8">No posts found</p>
            )}
          </>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Add New Post</h2>
            <form onSubmit={handleAddPost}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Room Number</label>
                  <input
                    type="text"
                    required
                    value={newPost.room_number}
                    onChange={(e) => setNewPost({ ...newPost, room_number: e.target.value })}
                    className="mt-1 block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Initials</label>
                  <input
                    type="text"
                    required
                    value={newPost.initials}
                    onChange={(e) => setNewPost({ ...newPost, initials: e.target.value })}
                    className="mt-1 block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={newPost.type || ''}
                    onChange={(e) => setNewPost({ ...newPost, type: e.target.value as 'letter' | 'package' | null })}
                    className="mt-1 block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select type</option>
                    <option value="letter">Letter</option>
                    <option value="package">Package</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Add Post
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Edit Post</h2>
            <form onSubmit={handleEditPost}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Room Number</label>
                  <input
                    type="text"
                    required
                    value={editingPost.room_number}
                    onChange={(e) => setEditingPost({ ...editingPost, room_number: e.target.value })}
                    className="mt-1 block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Initials</label>
                  <input
                    type="text"
                    required
                    value={editingPost.initials}
                    onChange={(e) => setEditingPost({ ...editingPost, initials: e.target.value })}
                    className="mt-1 block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={editingPost.type || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, type: e.target.value as 'letter' | 'package' | null })}
                    className="mt-1 block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select type</option>
                    <option value="letter">Letter</option>
                    <option value="package">Package</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={editingPost.status}
                    onChange={(e) => setEditingPost({ ...editingPost, status: e.target.value as 'pending' | 'received' })}
                    className="mt-1 block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="received">Received</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={format(new Date(editingPost.created_at), "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => setEditingPost({ ...editingPost, created_at: new Date(e.target.value).toISOString() })}
                    className="mt-1 block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingPost(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Update Post
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;