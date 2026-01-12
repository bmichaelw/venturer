import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function CommentSection({ itemId }) {
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', itemId],
    queryFn: () => base44.entities.Comment.filter({ item_id: itemId }, '-created_date'),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const createCommentMutation = useMutation({
    mutationFn: async (commentData) => {
      const comment = await base44.entities.Comment.create(commentData);
      
      // Create notifications for mentions
      if (commentData.mentions?.length > 0) {
        const notifications = commentData.mentions.map(email => ({
          user_email: email,
          type: 'mention',
          item_id: itemId,
          message: `${currentUser.full_name || currentUser.email} mentioned you in a comment`,
          related_user: currentUser.email,
        }));
        await base44.entities.Notification.bulkCreate(notifications);
      }
      
      return comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', itemId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setNewComment('');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    // Extract mentions (@email)
    const mentionRegex = /@(\S+@\S+\.\S+)/g;
    const mentions = [...newComment.matchAll(mentionRegex)].map(match => match[1]);

    createCommentMutation.mutate({
      item_id: itemId,
      content: newComment,
      mentions: mentions.length > 0 ? mentions : undefined,
    });
  };

  const getInitials = (name, email) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-slate-600" />
        <h3 className="text-sm font-semibold text-slate-900">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comments List */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No comments yet</p>
        ) : (
          comments.map((comment) => {
            const user = allUsers.find(u => u.email === comment.created_by);
            return (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="bg-slate-200 text-slate-700 text-xs">
                    {getInitials(user?.full_name, comment.created_by)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-900">
                      {user?.full_name || comment.created_by}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment... (use @email to mention someone)"
          rows={3}
          className="resize-none text-sm"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={!newComment.trim() || createCommentMutation.isPending}
            className="bg-slate-900 hover:bg-slate-800"
          >
            <Send className="w-3 h-3 mr-1" />
            Comment
          </Button>
        </div>
      </form>
    </div>
  );
}