'use client';

import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function CommentSection({ blogId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyGuestName, setReplyGuestName] = useState('');
  const [expandedReplies, setExpandedReplies] = useState({});
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch current user session
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/get-session`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data?.user || null);
        }
      } catch (err) {
        console.log('Not authenticated');
      }
    };
    fetchUser();
  }, []);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!blogId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/comments/blog/${blogId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('[CommentSection] Fetched comments:', data);
        setComments(data);
      } else {
        setError('Failed to load comments');
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [blogId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const getRelativeTime = (timestamp) => {
    const seconds = Math.floor((currentTime - new Date(timestamp).getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes === 1) return '1 min ago';
    if (minutes < 60) return `${minutes} mins ago`;
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    if (!currentUser && !guestName.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const body = {
        blogId: parseInt(blogId),
        content: newComment.trim()
      };

      if (!currentUser) {
        body.guestName = guestName.trim();
        body.guestEmail = guestEmail.trim() || null;
      }

      const response = await fetch(`${API_URL}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const comment = await response.json();
        console.log('[CommentSection] New comment created:', comment);
        setComments(prev => [comment, ...prev]);
        setNewComment('');
        // Keep guest name for convenience
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to post comment');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      setError('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (commentId) => {
    if (!replyContent.trim()) return;
    if (!currentUser && !replyGuestName.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const body = {
        blogId: parseInt(blogId),
        content: replyContent.trim(),
        parentId: commentId
      };

      if (!currentUser) {
        body.guestName = replyGuestName.trim();
      }

      const response = await fetch(`${API_URL}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const reply = await response.json();
        setComments(comments.map(c => 
          c.id === commentId 
            ? { ...c, replies: [...(c.replies || []), reply] }
            : c
        ));
        setReplyContent('');
        setReplyGuestName('');
        setReplyingTo(null);
        setExpandedReplies(prev => ({ ...prev, [commentId]: true }));
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to post reply');
      }
    } catch (err) {
      console.error('Error posting reply:', err);
      setError('Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const getAuthorAvatar = (author) => {
    if (!author?.image) return null;
    if (author.image.startsWith('http')) return author.image;
    return `${API_URL}${author.image.startsWith('/') ? '' : '/'}${author.image}`;
  };

  const getDisplayName = (comment) => {
    if (comment.author?.name) return comment.author.name;
    if (comment.guestName) return comment.guestName;
    return 'Anonymous';
  };

  const getInitial = (comment) => {
    const name = getDisplayName(comment);
    return name.charAt(0).toUpperCase();
  };

  const totalComments = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);

  return (
    <div className="pt-8 md:pt-12">
      <div className="my-6 md:my-12 border-t border-gray-200 pt-6 md:pt-8">
        <h2 className="text-lg md:text-2xl font-bold text-black mb-6 md:mb-8">
          Join the Discussion
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-2 text-red-800 hover:underline">Dismiss</button>
          </div>
        )}

        <div className="flex gap-3 md:gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
            {currentUser?.image ? (
              <img 
                src={getAuthorAvatar(currentUser)} 
                alt={currentUser.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-purple-600 font-semibold">
                {currentUser?.name?.charAt(0).toUpperCase() || guestName?.charAt(0).toUpperCase() || '?'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {!currentUser && (
              <div className="flex gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Your name *"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-300 text-black text-sm placeholder:text-gray-400"
                  maxLength={100}
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-300 text-black text-sm placeholder:text-gray-400"
                  maxLength={200}
                />
              </div>
            )}
            <textarea
              placeholder="Share your thoughts..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full min-h-[120px] md:min-h-[140px] p-4 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-300 resize-none text-black text-sm md:text-base placeholder:text-gray-400"
              maxLength={2000}
              disabled={submitting}
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-gray-400">{newComment.length}/2000</span>
              <button
                onClick={handleSubmitComment}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base transition-colors"
                disabled={newComment.trim() === '' || submitting}
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 md:mt-12">
        <h3 className="text-lg md:text-xl font-bold text-black mb-4 md:mb-6">
          Comments ({totalComments})
        </h3>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading comments...</div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {comments.length > 0 ? comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 md:p-6">
                <div className="flex gap-3 md:gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {comment.author?.image ? (
                      <img 
                        src={getAuthorAvatar(comment.author)} 
                        alt={getDisplayName(comment)} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-purple-600 font-semibold">{getInitial(comment)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm md:text-base">
                        {getDisplayName(comment)}
                      </span>
                      {!comment.authorId && <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">Guest</span>}
                      <span className="text-xs md:text-sm text-gray-400">
                        {getRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3 text-sm md:text-base break-words whitespace-pre-wrap">{comment.content}</p>
                    
                    <div className="flex gap-3 text-sm items-center">
                      <button
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="text-gray-400 hover:text-purple-600 flex items-center gap-1.5 text-xs md:text-sm transition-colors"
                      >
                        Reply
                      </button>
                    </div>

                    {comment.replies?.length > 0 && (
                      <button
                        onClick={() => toggleReplies(comment.id)}
                        className="mt-4 flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-purple-600 transition-colors"
                      >
                        {expandedReplies[comment.id] ? 'Hide' : 'Show'} Replies ({comment.replies.length})
                        <span className={`transform transition-transform ${expandedReplies[comment.id] ? 'rotate-180' : 'rotate-0'}`}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 9l-7 7-7-7"/>
                          </svg>
                        </span>
                      </button>
                    )}

                    {replyingTo === comment.id && (
                      <div className="mt-4 bg-white rounded-lg p-3 md:p-4 border border-gray-100">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                            <span className="text-purple-600 font-semibold text-sm">
                              {currentUser?.name?.charAt(0).toUpperCase() || replyGuestName?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            {!currentUser && (
                              <input
                                type="text"
                                placeholder="Your name *"
                                value={replyGuestName}
                                onChange={(e) => setReplyGuestName(e.target.value)}
                                className="w-full mb-2 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-300 text-black text-sm placeholder:text-gray-400"
                                maxLength={100}
                              />
                            )}
                            <textarea
                              placeholder="Write a reply..."
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              className="w-full min-h-[80px] p-3 text-black border border-gray-200 rounded-lg focus:outline-none focus:border-purple-300 resize-none text-sm placeholder:text-gray-400"
                              maxLength={2000}
                              disabled={submitting}
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <button
                                onClick={() => { setReplyingTo(null); setReplyContent(''); setReplyGuestName(''); }}
                                className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSubmitReply(comment.id)}
                                className="px-4 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 transition-colors"
                                disabled={replyContent.trim() === '' || submitting}
                              >
                                {submitting ? 'Posting...' : 'Reply'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {comment.replies?.length > 0 && expandedReplies[comment.id] && (
                      <div className="mt-4 space-y-3 pl-3 md:pl-6 border-l-2 border-purple-200">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-3 bg-white p-3 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                              {reply.author?.image ? (
                                <img src={getAuthorAvatar(reply.author)} alt={getDisplayName(reply)} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-purple-600 font-semibold text-xs">{getInitial(reply)}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-semibold text-gray-900 text-sm">{getDisplayName(reply)}</span>
                                {!reply.authorId && <span className="text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">Guest</span>}
                                <span className="text-xs text-gray-400">{getRelativeTime(reply.createdAt)}</span>
                              </div>
                              <p className="text-gray-600 text-sm break-words whitespace-pre-wrap">{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-gray-500 text-center py-8">
                No comments yet. Be the first to share your thoughts!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
