'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function CommentSection({ blogId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedReplies, setExpandedReplies] = useState({});
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [loading, setLoading] = useState(false);

  // Update current time every second for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getRelativeTime = (timestamp) => {
    const seconds = Math.floor((currentTime - timestamp) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Few seconds ago';
    if (minutes === 1) return '1 min ago';
    if (minutes < 60) return `${minutes} mins ago`;
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  const handleSubmitComment = () => {
    if (newComment.trim() === '') return;

    const newCommentData = {
      id: Date.now(),
      content: newComment,
      author: { name: 'Guest User', avatar: '/images/avatar.jpg' },
      createdAt: new Date().toISOString(),
      replies: [],
    };

    setComments([newCommentData, ...comments]);
    setNewComment('');
  };

  const handleSubmitReply = (commentId) => {
    if (replyContent.trim() === '') return;

    const newReply = {
      id: Date.now(),
      content: replyContent,
      author: { name: 'Guest User', avatar: '/images/avatar.jpg' },
      createdAt: new Date().toISOString(),
    };

    setComments(
      comments.map((comment) =>
        comment.id === commentId
          ? { ...comment, replies: [...comment.replies, newReply] }
          : comment
      )
    );
    setReplyContent('');
    setReplyingTo(null);
  };

  const handleDeleteComment = (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    setComments(comments.filter((c) => c.id !== commentId));
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  return (
    <div className="pt-8 md:pt-12">
      <div className="my-6 md:my-12 border-t border-gray-200 pt-6 md:pt-8">
        <h2 className="text-lg md:text-2xl font-bold text-black mb-6 md:mb-8">
          How useful was this blog?
        </h2>

        <div className="flex gap-3 md:gap-4 mb-6">
          <div className="w-10 h-10 md:w-10 md:h-10 rounded-full bg-gray-200 flex-shrink-0"></div>
          <div className="flex-1 min-w-0">
            <textarea
              placeholder="Enter your comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full min-h-[120px] md:min-h-[140px] p-4 md:p-4 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 resize-none text-black text-sm md:text-base placeholder:text-gray-400"
              maxLength={1000}
            />
            <div className="flex justify-end items-center mt-3">
              <button
                onClick={handleSubmitComment}
                className="px-6 py-2 text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                disabled={newComment.trim() === ''}
              >
                Add Comment
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 md:mt-12">
        <h3 className="text-lg md:text-xl font-bold text-black mb-4 md:mb-6">
          Discussions ({comments.length})
        </h3>

        <div className="space-y-4 md:space-y-6">
          {comments.length > 0 ? comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 md:p-6">
              <div className="flex gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-10 md:h-10 rounded-full bg-gray-300 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm md:text-base">
                      {comment.author?.name || 'Guest'}
                    </span>
                    <span className="text-xs md:text-sm text-gray-400">
                      {getRelativeTime(new Date(comment.createdAt).getTime())}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3 text-sm md:text-base break-words">{comment.content}</p>
                  <div className="flex gap-3 text-sm items-center">
                    <button
                      onClick={() => setReplyingTo(comment.id)}
                      className="text-gray-400 hover:text-gray-600 flex items-center gap-1.5 text-xs md:text-sm"
                    >
                      <span>Reply</span>
                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-gray-400 hover:text-red-600 flex items-center gap-1.5 text-xs md:text-sm"
                    >
                      <span>Delete</span>
                    </button>
                  </div>

                  {comment.replies.length > 0 && (
                    <button
                      onClick={() => toggleReplies(comment.id)}
                      className="mt-4 flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-gray-700"
                    >
                      Replies ({comment.replies.length})
                      <span className={`transform transition-transform ${expandedReplies[comment.id] ? 'rotate-180' : 'rotate-0'}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 9l-7 7-7-7"/>
                        </svg>
                      </span>
                    </button>
                  )}

                  {replyingTo === comment.id && (
                    <div className="mt-4 bg-white rounded-lg p-3 md:p-4">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <textarea
                            placeholder="Write a reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="w-full min-h-[80px] p-3 text-black border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 resize-none text-sm placeholder:text-gray-400"
                            maxLength={1000}
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <button
                              onClick={() => { setReplyingTo(null); setReplyContent(''); }}
                              className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSubmitReply(comment.id)}
                              className="px-4 py-1.5 text-sm text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
                              disabled={replyContent.trim() === ''}
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {comment.replies.length > 0 && expandedReplies[comment.id] && (
                    <div className="mt-4 space-y-3 pl-3 md:pl-6 border-l-2 border-gray-200">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3 bg-white p-3 rounded-lg">
                          <div className="w-9 h-9 rounded-full bg-gray-300 flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-semibold text-gray-900 text-sm">{reply.author?.name || 'Guest'}</span>
                              <span className="text-xs text-gray-400">{getRelativeTime(new Date(reply.createdAt).getTime())}</span>
                            </div>
                            <p className="text-gray-600 text-sm mb-2 break-words">{reply.content}</p>
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
      </div>
    </div>
  );
}
