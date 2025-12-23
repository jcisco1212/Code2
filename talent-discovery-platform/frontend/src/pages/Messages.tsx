import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { messagesAPI, usersAPI, getUploadUrl } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface User {
  id: string;
  username: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  avatarUrl: string | null;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: User;
}

interface Conversation {
  conversationId: string;
  otherUser: User;
  lastMessage: {
    content: string;
    createdAt: string;
  } | null;
  unreadCount: number;
}

const Messages: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [searchParams] = useSearchParams();
  const newUserId = searchParams.get('user');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newChatUser, setNewChatUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  // Handle new user from query param
  useEffect(() => {
    const loadNewUser = async () => {
      if (newUserId && newUserId !== user?.id) {
        try {
          // Check if conversation already exists
          const existingConv = conversations.find(c => c.otherUser.id === newUserId);
          if (existingConv) {
            navigate(`/messages/${existingConv.conversationId}`, { replace: true });
            return;
          }

          // Fetch user info
          const response = await usersAPI.getUser(newUserId);
          const userData = response.data.user;
          setNewChatUser({
            id: userData.id,
            username: userData.username,
            displayName: userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName,
            avatarUrl: userData.avatarUrl
          });
          setSelectedConversation(null);
          setMessages([]);
        } catch (err) {
          toast.error('User not found');
          navigate('/messages', { replace: true });
        }
      }
    };

    if (!loading) {
      loadNewUser();
    }
  }, [newUserId, conversations, loading, user?.id, navigate]);

  useEffect(() => {
    if (conversationId) {
      setNewChatUser(null);
      fetchMessages(conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await messagesAPI.getConversations();
      const convs = (response.data.conversations || []).map((c: any) => ({
        conversationId: c.conversationId,
        otherUser: {
          id: c.otherUser.id,
          username: c.otherUser.username,
          displayName: c.otherUser.firstName && c.otherUser.lastName
            ? `${c.otherUser.firstName} ${c.otherUser.lastName}`
            : c.otherUser.username,
          avatarUrl: c.otherUser.avatarUrl
        },
        lastMessage: c.lastMessage,
        unreadCount: c.unreadCount
      }));
      setConversations(convs);

      if (conversationId) {
        const conv = convs.find((c: Conversation) => c.conversationId === conversationId);
        if (conv) setSelectedConversation(conv);
      }
    } catch (err) {
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    setMessagesLoading(true);
    try {
      const response = await messagesAPI.getMessages(convId);
      setMessages(response.data.messages || []);

      // Mark as read
      try {
        await messagesAPI.markAsRead(convId);
      } catch (e) {
        // Ignore mark as read errors
      }

      // Update unread count in conversations list
      setConversations(prev => prev.map(c =>
        c.conversationId === convId ? { ...c, unreadCount: 0 } : c
      ));
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const receiverId = newChatUser?.id || selectedConversation?.otherUser.id;
    if (!receiverId) return;

    setSending(true);
    try {
      const response = await messagesAPI.sendMessage(receiverId, newMessage.trim());
      const sentMessage = response.data.message;

      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');

      // If this was a new chat, refresh conversations and navigate
      if (newChatUser) {
        await fetchConversations();
        const newConvId = sentMessage.conversationId;
        navigate(`/messages/${newConvId}`, { replace: true });
        setNewChatUser(null);
      } else if (selectedConversation) {
        // Update last message in conversations
        setConversations(prev => prev.map(c =>
          c.conversationId === selectedConversation.conversationId ? {
            ...c,
            lastMessage: {
              content: newMessage.trim(),
              createdAt: new Date().toISOString()
            }
          } : c
        ));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const selectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setNewChatUser(null);
    navigate(`/messages/${conv.conversationId}`);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const currentChatUser = newChatUser || selectedConversation?.otherUser;
  const showMessageArea = conversationId || newChatUser;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Messages</h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden" style={{ height: '70vh' }}>
        <div className="flex h-full">
          {/* Conversations List */}
          <div className={`w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700 ${showMessageArea ? 'hidden md:block' : ''}`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">Conversations</h2>
            </div>
            <div className="overflow-y-auto" style={{ height: 'calc(100% - 57px)' }}>
              {conversations.length === 0 && !newChatUser ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No conversations yet
                </div>
              ) : (
                conversations.map(conv => (
                  <button
                    key={conv.conversationId}
                    onClick={() => selectConversation(conv)}
                    className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left ${
                      conversationId === conv.conversationId ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                    }`}
                  >
                    {conv.otherUser.avatarUrl ? (
                      <img
                        src={getUploadUrl(conv.otherUser.avatarUrl) || '/default-avatar.png'}
                        alt={conv.otherUser.displayName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium">
                        {conv.otherUser.displayName?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 dark:text-white truncate">
                          {conv.otherUser.displayName}
                        </span>
                        {conv.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {formatTime(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-500 truncate">
                          {conv.lastMessage?.content || 'No messages yet'}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className={`flex-1 flex flex-col ${!showMessageArea ? 'hidden md:flex' : ''}`}>
            {currentChatUser ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                  <button
                    onClick={() => {
                      navigate('/messages');
                      setNewChatUser(null);
                    }}
                    className="md:hidden p-2 text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <Link to={`/profile/${currentChatUser.username}`} className="flex items-center gap-3">
                    {currentChatUser.avatarUrl ? (
                      <img
                        src={getUploadUrl(currentChatUser.avatarUrl) || '/default-avatar.png'}
                        alt={currentChatUser.displayName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium">
                        {currentChatUser.displayName?.charAt(0) || '?'}
                      </div>
                    )}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {currentChatUser.displayName}
                    </span>
                  </Link>
                  {newChatUser && (
                    <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                      New conversation
                    </span>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messagesLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      {newChatUser
                        ? `Start a conversation with ${newChatUser.displayName}!`
                        : 'No messages yet. Start the conversation!'}
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${
                            msg.senderId === user?.id
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                          }`}
                        >
                          <p className="break-words">{msg.content}</p>
                          <p className={`text-xs mt-1 ${msg.senderId === user?.id ? 'text-indigo-200' : 'text-gray-400'}`}>
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-full dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? '...' : 'Send'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                Select a conversation to start messaging
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
