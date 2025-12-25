import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { messagesAPI, usersAPI, chatRoomsAPI, getUploadUrl } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon,
  XMarkIcon,
  Cog6ToothIcon,
  UserPlusIcon,
  ArrowRightOnRectangleIcon,
  LinkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

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

interface ChatRoom {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  type: string;
  creatorId: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  memberCount: number;
  inviteCode: string;
  myRole?: string;
  members?: Array<{ user: User }>;
}

interface ChatRoomMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  messageType: string;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  sender: User;
}

const Messages: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [searchParams] = useSearchParams();
  const newUserId = searchParams.get('user');
  const roomParam = searchParams.get('room');
  const navigate = useNavigate();
  const { user } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState<'direct' | 'groups'>(roomParam ? 'groups' : 'direct');

  // Direct messages state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newChatUser, setNewChatUser] = useState<User | null>(null);

  // Group chat state
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [roomMessages, setRoomMessages] = useState<ChatRoomMessage[]>([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomType, setNewRoomType] = useState<'project' | 'community'>('project');
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [showJoinRoom, setShowJoinRoom] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      // Fetch both direct conversations and chat rooms
      await Promise.all([
        fetchConversations(),
        fetchChatRooms()
      ]);

      // Handle new user from query param
      if (newUserId && newUserId !== user?.id) {
        try {
          const response = await usersAPI.getUser(newUserId);
          const userData = response.data.user || response.data;

          if (userData) {
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
            setActiveTab('direct');
          }
        } catch (err) {
          console.error('Failed to load user:', err);
          toast.error('User not found');
        }
      }

      // Handle room from query param
      if (roomParam) {
        setActiveTab('groups');
      }

      setLoading(false);
    };

    init();
  }, [newUserId, user?.id, roomParam]);

  // Check for existing conversation when conversations update
  useEffect(() => {
    if (newUserId && conversations.length > 0 && newChatUser) {
      const existingConv = conversations.find(c => c.otherUser.id === newUserId);
      if (existingConv) {
        setNewChatUser(null);
        navigate(`/messages/${existingConv.conversationId}`, { replace: true });
      }
    }
  }, [conversations, newUserId, newChatUser, navigate]);

  useEffect(() => {
    if (conversationId) {
      setNewChatUser(null);
      setSelectedRoom(null);
      fetchMessages(conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, roomMessages]);

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
      console.error('Failed to load conversations');
    }
  };

  const fetchChatRooms = async () => {
    try {
      const response = await chatRoomsAPI.getRooms();
      setChatRooms(response.data.chatRooms || []);
    } catch (err) {
      console.error('Failed to load chat rooms');
    }
  };

  const fetchMessages = async (convId: string) => {
    setMessagesLoading(true);
    try {
      const response = await messagesAPI.getMessages(convId);
      setMessages(response.data.messages || []);

      try {
        await messagesAPI.markAsRead(convId);
      } catch (e) {
        // Ignore mark as read errors
      }

      setConversations(prev => prev.map(c =>
        c.conversationId === convId ? { ...c, unreadCount: 0 } : c
      ));
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  };

  const fetchRoomMessages = async (roomId: string) => {
    setMessagesLoading(true);
    try {
      const response = await chatRoomsAPI.getMessages(roomId);
      setRoomMessages(response.data.messages || []);
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);

    if (selectedRoom) {
      // Send to group chat
      try {
        const response = await chatRoomsAPI.sendMessage(selectedRoom.id, newMessage.trim());
        setRoomMessages(prev => [...prev, response.data.message]);
        setNewMessage('');
      } catch (err: any) {
        toast.error(err.response?.data?.error || 'Failed to send message');
      }
    } else {
      // Send direct message
      const receiverId = newChatUser?.id || selectedConversation?.otherUser.id;
      if (!receiverId) {
        setSending(false);
        return;
      }

      try {
        const response = await messagesAPI.sendMessage(receiverId, newMessage.trim());
        const sentMessage = response.data.message;

        setMessages(prev => [...prev, sentMessage]);
        setNewMessage('');

        if (newChatUser) {
          await fetchConversations();
          const newConvId = sentMessage.conversationId;
          navigate(`/messages/${newConvId}`, { replace: true });
          setNewChatUser(null);
        } else if (selectedConversation) {
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
      }
    }

    setSending(false);
  };

  const selectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setSelectedRoom(null);
    setNewChatUser(null);
    navigate(`/messages/${conv.conversationId}`);
  };

  const selectRoom = (room: ChatRoom) => {
    setSelectedRoom(room);
    setSelectedConversation(null);
    setNewChatUser(null);
    fetchRoomMessages(room.id);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim() || creatingRoom) return;

    setCreatingRoom(true);
    try {
      const response = await chatRoomsAPI.createRoom({
        name: newRoomName.trim(),
        description: newRoomDescription.trim() || undefined,
        type: newRoomType
      });
      const newRoom = response.data.chatRoom;
      setChatRooms(prev => [newRoom, ...prev]);
      setSelectedRoom(newRoom);
      setRoomMessages([]);
      setShowCreateRoom(false);
      setNewRoomName('');
      setNewRoomDescription('');
      toast.success('Group created!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create group');
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    try {
      const response = await chatRoomsAPI.joinByInvite(joinCode.trim());
      const room = response.data.chatRoom;
      setChatRooms(prev => [room, ...prev]);
      setSelectedRoom(room);
      fetchRoomMessages(room.id);
      setShowJoinRoom(false);
      setJoinCode('');
      toast.success('Joined group!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid invite code');
    }
  };

  const handleLeaveRoom = async () => {
    if (!selectedRoom || !window.confirm('Are you sure you want to leave this group?')) return;

    try {
      await chatRoomsAPI.removeMember(selectedRoom.id, user!.id);
      setChatRooms(prev => prev.filter(r => r.id !== selectedRoom.id));
      setSelectedRoom(null);
      setRoomMessages([]);
      toast.success('Left group');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to leave group');
    }
  };

  const copyInviteCode = () => {
    if (selectedRoom) {
      navigator.clipboard.writeText(selectedRoom.inviteCode);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    }
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
  const showMessageArea = conversationId || newChatUser || selectedRoom;

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
          {/* Sidebar */}
          <div className={`w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col ${showMessageArea ? 'hidden md:flex' : ''}`}>
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('direct')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'direct'
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                Direct
              </button>
              <button
                onClick={() => setActiveTab('groups')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'groups'
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <UserGroupIcon className="w-5 h-5" />
                Groups
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'direct' ? (
                // Direct Messages List
                conversations.length === 0 && !newChatUser ? (
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
                )
              ) : (
                // Group Chats List
                <>
                  {/* Action buttons */}
                  <div className="p-3 flex gap-2">
                    <button
                      onClick={() => setShowCreateRoom(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Create
                    </button>
                    <button
                      onClick={() => setShowJoinRoom(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <UserPlusIcon className="w-4 h-4" />
                      Join
                    </button>
                  </div>

                  {chatRooms.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      No group chats yet
                    </div>
                  ) : (
                    chatRooms.map(room => (
                      <button
                        key={room.id}
                        onClick={() => selectRoom(room)}
                        className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left ${
                          selectedRoom?.id === room.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                        }`}
                      >
                        {room.avatarUrl ? (
                          <img
                            src={getUploadUrl(room.avatarUrl) || ''}
                            alt={room.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-medium">
                            <UserGroupIcon className="w-6 h-6" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900 dark:text-white truncate">
                              {room.name}
                            </span>
                            {room.lastMessageAt && (
                              <span className="text-xs text-gray-500">
                                {formatTime(room.lastMessageAt)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400">{room.memberCount} members</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              room.type === 'project'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                            }`}>
                              {room.type}
                            </span>
                          </div>
                          {room.lastMessagePreview && (
                            <p className="text-sm text-gray-500 truncate mt-1">
                              {room.lastMessagePreview}
                            </p>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className={`flex-1 flex flex-col ${!showMessageArea ? 'hidden md:flex' : ''}`}>
            {selectedRoom ? (
              // Group Chat
              <>
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setSelectedRoom(null);
                        setRoomMessages([]);
                      }}
                      className="md:hidden p-2 text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    {selectedRoom.avatarUrl ? (
                      <img
                        src={getUploadUrl(selectedRoom.avatarUrl) || ''}
                        alt={selectedRoom.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white">
                        <UserGroupIcon className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedRoom.name}</span>
                      <p className="text-xs text-gray-500">{selectedRoom.memberCount} members</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowInviteCode(true)}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Invite"
                    >
                      <LinkIcon className="w-5 h-5" />
                    </button>
                    {selectedRoom.myRole !== 'owner' && (
                      <button
                        onClick={handleLeaveRoom}
                        className="p-2 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Leave Group"
                      >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messagesLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : roomMessages.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    roomMessages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                        {msg.senderId !== user?.id && (
                          <img
                            src={getUploadUrl(msg.sender?.avatarUrl) || '/default-avatar.png'}
                            alt=""
                            className="w-8 h-8 rounded-full mr-2 mt-1"
                          />
                        )}
                        <div className={`max-w-xs md:max-w-md ${msg.senderId === user?.id ? '' : ''}`}>
                          {msg.senderId !== user?.id && (
                            <p className="text-xs text-gray-500 mb-1">{msg.sender?.displayName || msg.sender?.username}</p>
                          )}
                          <div
                            className={`px-4 py-2 rounded-2xl ${
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
            ) : currentChatUser ? (
              // Direct Message
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

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Group Chat</h3>
              <button onClick={() => setShowCreateRoom(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateRoom}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={e => setNewRoomName(e.target.value)}
                    placeholder="Enter group name..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={newRoomDescription}
                    onChange={e => setNewRoomDescription(e.target.value)}
                    placeholder="What's this group about?"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white resize-none"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Group Type
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setNewRoomType('project')}
                      className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-colors ${
                        newRoomType === 'project'
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Project
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewRoomType('community')}
                      className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-colors ${
                        newRoomType === 'community'
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Community
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateRoom(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newRoomName.trim() || creatingRoom}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creatingRoom ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Room Modal */}
      {showJoinRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Join Group Chat</h3>
              <button onClick={() => setShowJoinRoom(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleJoinRoom}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Invite Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter invite code..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-mono text-center text-lg tracking-widest"
                  maxLength={10}
                  required
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowJoinRoom(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!joinCode.trim()}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  Join
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Code Modal */}
      {showInviteCode && selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Invite to {selectedRoom.name}</h3>
              <button onClick={() => setShowInviteCode(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Share this code with others to invite them to the group:
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-center font-mono text-xl tracking-widest text-gray-900 dark:text-white">
                {selectedRoom.inviteCode}
              </div>
              <button
                onClick={copyInviteCode}
                className={`p-4 rounded-lg transition-colors ${
                  copiedInvite
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {copiedInvite ? <CheckIcon className="w-6 h-6" /> : <LinkIcon className="w-6 h-6" />}
              </button>
            </div>
            <button
              onClick={() => setShowInviteCode(false)}
              className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
