import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { commentsAPI, socialAPI, getUploadUrl } from '../../services/api';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { HeartIcon, ChatBubbleLeftIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

interface Comment {
  id: string;
  content: string;
  likes: number;
  replyCount: number;
  isPinned: boolean;
  isCreatorHighlighted: boolean;
  editedAt: string | null;
  createdAt: string;
  user: User;
}

interface CommentsProps {
  videoId: string;
  videoOwnerId?: string;
  commentsEnabled: boolean;
  commentsCount: number;
}

const Comments: React.FC<CommentsProps> = ({ videoId, videoOwnerId, commentsEnabled, commentsCount }) => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [sortBy, setSortBy] = useState<'createdAt' | 'likes'>('createdAt');

  // Reply state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replies, setReplies] = useState<Record<string, Comment[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});

  // Like state
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchComments();
  }, [videoId, sortBy]);

  const fetchComments = async (pageNum = 1) => {
    try {
      setLoading(pageNum === 1);
      const response = await commentsAPI.getComments(videoId, {
        page: pageNum,
        limit: 20,
        sortBy,
        order: sortBy === 'likes' ? 'DESC' : 'DESC'
      });

      const newComments = response.data.comments || [];
      if (pageNum === 1) {
        setComments(newComments);
      } else {
        setComments(prev => [...prev, ...newComments]);
      }
      setHasMore(pageNum < (response.data.pagination?.pages || 1));
      setPage(pageNum);
    } catch (err: any) {
      console.error('Failed to fetch comments:', err);
      setError(err.response?.data?.error?.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;

    setSubmitting(true);
    try {
      const response = await commentsAPI.createComment({
        videoId,
        content: newComment.trim()
      });
      setComments(prev => [response.data.comment, ...prev]);
      setNewComment('');
      toast.success('Comment posted!');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || !isAuthenticated) return;

    setSubmitting(true);
    try {
      const response = await commentsAPI.createComment({
        videoId,
        content: replyContent.trim(),
        parentId
      });

      // Add reply to local state
      setReplies(prev => ({
        ...prev,
        [parentId]: [...(prev[parentId] || []), response.data.comment]
      }));

      // Update reply count
      setComments(prev => prev.map(c =>
        c.id === parentId ? { ...c, replyCount: c.replyCount + 1 } : c
      ));

      setReplyContent('');
      setReplyingTo(null);
      toast.success('Reply posted!');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const loadReplies = async (commentId: string) => {
    if (loadingReplies[commentId]) return;

    setLoadingReplies(prev => ({ ...prev, [commentId]: true }));
    try {
      const response = await commentsAPI.getReplies(commentId, { limit: 50 });
      setReplies(prev => ({
        ...prev,
        [commentId]: response.data.replies || []
      }));
    } catch (err) {
      console.error('Failed to load replies:', err);
    } finally {
      setLoadingReplies(prev => ({ ...prev, [commentId]: false }));
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!isAuthenticated) {
      toast.error('Please log in to like comments');
      return;
    }

    try {
      await socialAPI.likeComment(commentId);
      if (likedComments.has(commentId)) {
        setLikedComments(prev => {
          const next = new Set(prev);
          next.delete(commentId);
          return next;
        });
        setComments(prev => prev.map(c =>
          c.id === commentId ? { ...c, likes: c.likes - 1 } : c
        ));
      } else {
        setLikedComments(prev => new Set(prev).add(commentId));
        setComments(prev => prev.map(c =>
          c.id === commentId ? { ...c, likes: c.likes + 1 } : c
        ));
      }
    } catch (err) {
      console.error('Failed to like comment:', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentsAPI.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete comment');
    }
  };

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
  };

  const CommentItem: React.FC<{ comment: Comment; isReply?: boolean }> = ({ comment, isReply = false }) => {
    const [showOptions, setShowOptions] = useState(false);
    const isOwner = user?.id === comment.user.id;
    const isVideoOwner = user?.id === videoOwnerId;

    return (
      <div className={`flex gap-3 ${isReply ? 'ml-12' : ''} ${comment.isPinned ? 'bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg -mx-3' : ''}`}>
        <Link to={`/profile/${comment.user.username}`} className="flex-shrink-0">
          {comment.user.avatarUrl ? (
            <img
              src={getUploadUrl(comment.user.avatarUrl) || ''}
              alt={comment.user.username}
              className={`rounded-full object-cover ${isReply ? 'w-8 h-8' : 'w-10 h-10'}`}
            />
          ) : (
            <div className={`rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium ${isReply ? 'w-8 h-8 text-sm' : 'w-10 h-10'}`}>
              {comment.user.firstName?.[0] || '?'}
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {comment.isPinned && (
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Pinned</span>
            )}
            <Link to={`/profile/${comment.user.username}`} className="font-semibold text-sm text-gray-900 dark:text-white hover:text-indigo-600">
              {comment.user.firstName} {comment.user.lastName}
            </Link>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTimeAgo(comment.createdAt)}
              {comment.editedAt && ' (edited)'}
            </span>
            {comment.isCreatorHighlighted && (
              <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded">Creator's pick</span>
            )}
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap break-words">
            {comment.content}
          </p>

          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => handleLikeComment(comment.id)}
              className={`flex items-center gap-1 text-sm ${likedComments.has(comment.id) ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              {likedComments.has(comment.id) ? (
                <HeartSolidIcon className="w-4 h-4" />
              ) : (
                <HeartIcon className="w-4 h-4" />
              )}
              {comment.likes > 0 && <span>{comment.likes}</span>}
            </button>

            {!isReply && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <ChatBubbleLeftIcon className="w-4 h-4" />
                Reply
              </button>
            )}

            {(isOwner || isVideoOwner) && (
              <div className="relative">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <EllipsisVerticalIcon className="w-4 h-4" />
                </button>

                {showOptions && (
                  <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                    {isOwner && (
                      <button
                        onClick={() => {
                          handleDeleteComment(comment.id);
                          setShowOptions(false);
                        }}
                        className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Delete
                      </button>
                    )}
                    {isVideoOwner && !isReply && (
                      <>
                        <button
                          onClick={async () => {
                            try {
                              await commentsAPI.pinComment(comment.id);
                              toast.success(comment.isPinned ? 'Comment unpinned' : 'Comment pinned');
                              fetchComments();
                            } catch (err) {
                              toast.error('Failed to pin comment');
                            }
                            setShowOptions(false);
                          }}
                          className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {comment.isPinned ? 'Unpin' : 'Pin'}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reply form */}
          {replyingTo === comment.id && isAuthenticated && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={submitting}
              />
              <button
                onClick={() => handleSubmitReply(comment.id)}
                disabled={!replyContent.trim() || submitting}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Reply
              </button>
              <button
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent('');
                }}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Replies */}
          {!isReply && comment.replyCount > 0 && (
            <div className="mt-2">
              {replies[comment.id] ? (
                <div className="space-y-3 mt-3">
                  {replies[comment.id].map(reply => (
                    <CommentItem key={reply.id} comment={reply} isReply />
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => loadReplies(comment.id)}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                  disabled={loadingReplies[comment.id]}
                >
                  {loadingReplies[comment.id] ? 'Loading...' : `View ${comment.replyCount} ${comment.replyCount === 1 ? 'reply' : 'replies'}`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!commentsEnabled) {
    return (
      <div className="py-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Comments</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          Comments are disabled for this video.
        </p>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {commentsCount} {commentsCount === 1 ? 'Comment' : 'Comments'}
        </h2>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'likes')}
          className="text-sm border-none bg-transparent text-gray-600 dark:text-gray-400 cursor-pointer focus:ring-0"
        >
          <option value="createdAt">Newest first</option>
          <option value="likes">Top comments</option>
        </select>
      </div>

      {/* Comment form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              {user?.avatarUrl ? (
                <img
                  src={getUploadUrl(user.avatarUrl) || ''}
                  alt={user.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium">
                  {user?.firstName?.[0] || '?'}
                </div>
              )}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                disabled={submitting}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Posting...' : 'Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
          <p className="text-gray-600 dark:text-gray-400">
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">Sign in</Link>
            {' '}to leave a comment
          </p>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-2" />
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <ChatBubbleLeftIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))}

          {hasMore && (
            <button
              onClick={() => fetchComments(page + 1)}
              className="w-full py-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
            >
              Load more comments
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Comments;
