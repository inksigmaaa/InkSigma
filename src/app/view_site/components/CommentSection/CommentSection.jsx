'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function CommentSection() {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedReplies, setExpandedReplies] = useState({});
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Load comments from localStorage on mount
  useEffect(() => {
    const savedComments = localStorage.getItem('blogComments');
    if (savedComments) {
      setComments(JSON.parse(savedComments));
    } else {
      // Set default comments with fixed timestamps
      const defaultComments = [
        {
          id: 1,
          author: 'Rajeswari P',
          avatar: '/images/avatar.jpg',
          content: 'hi',
          createdAt: Date.now(),
          replies: [
            {
              id: 2,
              author: 'Rajeswari P',
              avatar: '/images/avatar.jpg',
              content: 'hello',
              createdAt: Date.now(),
            },
          ],
        },
      ];
      setComments(defaultComments);
      localStorage.setItem('blogComments', JSON.stringify(defaultComments));
    }
  }, []);

  // Save comments to localStorage whenever they change
  useEffect(() => {
    if (comments.length > 0) {
      localStorage.setItem('blogComments', JSON.stringify(comments));
    }
  }, [comments]);

  // Update current time every second for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  // Function to calculate relative time
  const getRelativeTime = (timestamp) => {
    const seconds = Math.floor((currentTime - timestamp) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 10) return 'Few seconds ago';
    if (seconds < 60) return `Few seconds ago`;
    if (minutes === 1) return '1 min ago';
    if (minutes < 60) return `${minutes} mins ago`;
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;
    if (weeks === 1) return '1 week ago';
    if (weeks < 4) return `${weeks} weeks ago`;
    if (months === 1) return '1 month ago';
    if (months < 12) return `${months} months ago`;
    if (years === 1) return '1 year ago';
    return `${years} years ago`;
  };

  const handleSubmitComment = () => {
    if (newComment.trim() === '') return;

    const comment = {
      id: Date.now(),
      author: 'Guest User',
      avatar: '/images/avatar.jpg',
      content: newComment,
      createdAt: Date.now(),
      replies: [],
    };

    setComments([...comments, comment]);
    setNewComment('');
  };

  const handleSubmitReply = (commentId) => {
    if (replyContent.trim() === '') return;

    const reply = {
      id: Date.now(),
      author: 'Guest User',
      avatar: '/images/avatar.jpg',
      content: replyContent,
      createdAt: Date.now(),
    };

    setComments(
      comments.map((comment) =>
        comment.id === commentId
          ? { ...comment, replies: [...comment.replies, reply] }
          : comment
      )
    );

    setReplyContent('');
    setReplyingTo(null);
  };

  const handleDeleteComment = (commentId) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      setComments(comments.filter((comment) => comment.id !== commentId));
    }
  };

  const handleDeleteReply = (commentId, replyId) => {
    if (confirm('Are you sure you want to delete this reply?')) {
      setComments(
        comments.map((comment) =>
          comment.id === commentId
            ? {
              ...comment,
              replies: comment.replies.filter((reply) => reply.id !== replyId),
            }
            : comment
        )
      );
    }
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  return (
    <div>
      {/* New Comment Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-black mb-6">
          Share your thoughts on the article
        </h2>

        <div className="flex gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0"></div>
          <div className="flex-1">
            <textarea
              placeholder="Enter your comments"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full min-h-[120px] p-4 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 resize-none text-black"
              maxLength={1000}
            />
            <div className="flex flex-col  justify-end items-end mt-2 ">
              <span className="text-sm text-gray-500 ">
                {newComment.length}/1000
              </span>
              <button
                onClick={handleSubmitComment}
                className=" py-2 text-purple-800 hover: font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={newComment.trim() === ''}
              >
                Submit comment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Discussion Section */}
      <div>
        <h3 className="text-xl font-bold text-black mb-6">Discussion</h3>

        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900">
                      {comment.author}
                    </span>
                    <span className="text-sm text-gray-500">
                      {getRelativeTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">{comment.content}</p>
                  <div className="flex gap-4 text-sm">
                    <button
                      onClick={() => setReplyingTo(comment.id)}
                      className="text-gray-400 hover:text-gray-600 flex items-center gap-1.5"
                    >
                      <Image
                        src="/svg/reply_icon.svg"
                        alt="Delete"
                        width={60}
                        height={60}
                      />

                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}

                    >
                      <Image
                        src="/svg/delete_btn_icon.svg"
                        alt="Delete"
                        width={60}
                        height={60}
                      />
                    </button>
                  </div>

                  {/* Replies Toggle Button */}
                  {comment.replies.length > 0 && (
                    <button
                      onClick={() => toggleReplies(comment.id)}
                      className="mt-4 flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-gray-700"
                    >
                      Replies({comment.replies.length})
                      <span className={`transform transition-transform ${expandedReplies[comment.id] ? 'rotate-270' : 'rotate-90'}`}>
                        <Image
                          src="/svg/arrow-right.svg"
                          alt="reply drop down arrow"
                          width={20}
                          height={20}
                        />
                      </span>
                    </button>
                  )}

                  {/* Reply Form */}
                  {replyingTo === comment.id && (
                    <div className="mt-4">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0"></div>
                        <div className="flex-1">
                          <textarea
                            placeholder="Write a reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="w-full min-h-[80px] p-3 text-black border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 resize-none text-sm"
                            maxLength={1000}
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <button
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyContent('');
                              }}
                              className="px-4 py-1 text-sm text-gray-600 hover:text-gray-800"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSubmitReply(comment.id)}
                              className="px-4 py-1 text-sm text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
                              disabled={replyContent.trim() === ''}
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Replies - Collapsible */}
                  {comment.replies.length > 0 && expandedReplies[comment.id] && (
                    <div className="mt-4 space-y-4 pl-4 border-gray-200">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0"></div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900 text-sm">
                                {reply.author}
                              </span>
                              <Image
                                src="/svg/Orginal Author.svg"
                                alt="Original Author"
                                width={16}
                                height={16}
                              />
                              <span className="text-xs text-gray-400">
                                {getRelativeTime(reply.createdAt)}
                              </span>
                            </div>
                            <p className="text-gray-700 text-sm mb-2">
                              {reply.content}
                            </p>
                            <button
                              onClick={() =>
                                handleDeleteReply(comment.id, reply.id)
                              }

                            >
                              <Image
                                src="/svg/delete_btn_icon.svg"
                                alt="Delete"
                                width={60}
                                height={60}
                              />

                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {comments.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            No comments yet. Be the first to share your thoughts!
          </p>
        )}
      </div>
    </div>
  );
}
